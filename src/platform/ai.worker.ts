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

const MODEL_REPO = "bartowski/SmolLM2-135M-Instruct-GGUF";
const MODEL_FILE = "SmolLM2-135M-Instruct-Q4_K_M.gguf";
const SYSTEM_PROMPT =
  "You are Vibex: a dry, funny senior AI pair-programmer. Answer in 1-3 short sentences, under 60 tokens.";

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
        { role: "user", content: message.prompt }
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

  loading ??= loadModel();
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

  await instance.loadModelFromHF(
    {
      file: MODEL_FILE,
      repo: MODEL_REPO
    },
    {
      n_gpu_layers: 0,
      progressCallback(progress) {
        post({ loaded: progress.loaded, total: progress.total, type: "progress" });
      },
      useCache: true
    }
  );

  wllama = instance;
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
