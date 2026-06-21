import { LoggerWithoutDebug, Wllama } from "@wllama/wllama/esm/index.js";
import wllamaWasmUrl from "@wllama/wllama/esm/wasm/wllama.wasm?url";

type WorkerRequest =
  | { readonly id: number; readonly type: "download" }
  | {
      readonly eraModel: string;
      readonly id: number;
      readonly prompt: string;
      readonly type: "generate";
    };

type WorkerResponse =
  | { readonly id: number; readonly ok: true; readonly text?: string; readonly type: "result" }
  | { readonly id: number; readonly message: string; readonly ok: false; readonly type: "result" }
  | { readonly loaded: number; readonly total: number; readonly type: "progress" }
  | { readonly type: "ready" };

const MODEL_FILE = "SmolLM2-135M-Instruct-Q4_K_M.gguf";
const BUNDLED_MODEL_URL = import.meta.env.DEV
  ? `/models/${MODEL_FILE}`
  : new URL(`../models/${MODEL_FILE}`, self.location.href).href;
const SYSTEM_PROMPT =
  "You are Vibex: a dry, funny senior AI pair-programmer. Answer in 1-3 short sentences, under 60 tokens.";
const MAX_PROMPT_CHARS = 1000;

type LoadModelOptions = NonNullable<Parameters<Wllama["loadModel"]>[1]>;
type LocalModelFile = Blob & { readonly name: string };

let wllama: Wllama | undefined;
let loading: Promise<void> | undefined;

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  void handleRequest(event.data);
});

async function handleRequest(message: WorkerRequest): Promise<void> {
  try {
    if (message.type === "download") {
      await ensureModel();
      post({ id: message.id, ok: true, type: "result" });
      post({ type: "ready" });
      return;
    }

    await ensureModel();
    const response = await getWllama().createChatCompletion({
      max_tokens: 60,
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT} Current in-game model era: ${message.eraModel}.`
        },
        { role: "user", content: clampPrompt(message.prompt) }
      ]
    });
    post({
      id: message.id,
      ok: true,
      text: response.choices[0]?.message.content?.trim(),
      type: "result"
    });
  } catch (error) {
    post({
      id: message.id,
      message: error instanceof Error ? error.message : "Vibex AI failed",
      ok: false,
      type: "result"
    });
  }
}

async function ensureModel(): Promise<void> {
  if (wllama?.isModelLoaded() === true) {
    return;
  }

  loading ??= loadModel().catch((error: unknown) => {
    loading = undefined;
    throw error;
  });
  await loading;
}

async function loadModel(): Promise<void> {
  const instance = new Wllama(
    {
      default: wllamaWasmUrl
    },
    {
      allowOffline: true,
      logger: LoggerWithoutDebug,
      suppressNativeLog: true
    }
  );

  const loadOptions = createLoadOptions();
  await loadBundledModel(instance, loadOptions);
  wllama = instance;
}

async function loadBundledModel(instance: Wllama, loadOptions: LoadModelOptions): Promise<void> {
  const model = await fetchBundledModelFile();
  await instance.loadModel([model], loadOptions);
  post({ loaded: model.size, total: model.size, type: "progress" });
}

async function fetchBundledModelFile(): Promise<LocalModelFile> {
  const response = await fetch(BUNDLED_MODEL_URL);

  if (!response.ok) {
    throw new Error(`Bundled Vibex model failed to load (${response.status})`);
  }

  const total = Number(response.headers.get("content-length") ?? 0);
  const contentType = response.headers.get("content-type") ?? "application/octet-stream";

  if (response.body === null) {
    const blob = await response.blob();
    post({ loaded: blob.size, total: total > 0 ? total : blob.size, type: "progress" });
    return createLocalModelFile([blob], contentType);
  }

  const chunks: BlobPart[] = [];
  const reader = response.body.getReader();
  let loaded = 0;

  for (;;) {
    const result = await reader.read();

    if (result.done) {
      break;
    }

    loaded += result.value.byteLength;
    chunks.push(result.value);
    post({ loaded, total, type: "progress" });
  }

  return createLocalModelFile(chunks, contentType);
}

function createLocalModelFile(chunks: BlobPart[], type: string): LocalModelFile {
  if (typeof File !== "undefined") {
    return new File(chunks, MODEL_FILE, { type });
  }

  const blob = new Blob(chunks, { type }) as LocalModelFile;
  Object.defineProperty(blob, "name", { value: MODEL_FILE });
  return blob;
}

function createLoadOptions(): LoadModelOptions {
  return {
    n_gpu_layers: 0
  };
}

function getWllama(): Wllama {
  if (wllama === undefined) {
    throw new Error("Vibex AI model is not loaded");
  }

  return wllama;
}

function post(message: WorkerResponse): void {
  self.postMessage(message);
}

function clampPrompt(prompt: string): string {
  return prompt.length <= MAX_PROMPT_CHARS ? prompt : prompt.slice(0, MAX_PROMPT_CHARS);
}
