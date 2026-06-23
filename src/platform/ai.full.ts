import { LoggerWithoutDebug, Wllama } from "@wllama/wllama/esm/index.js";
import wllamaWasmUrl from "@wllama/wllama/esm/wasm/wllama.wasm?url";

import {
  createIdleSnapshot,
  type VibexAiChangeHandler,
  type VibexAiClient,
  type VibexAiProgress,
  type VibexAiSnapshot,
  type VibexAiStatus
} from "./ai";

const MODEL_FILE = "SmolLM2-135M-Instruct-Q4_K_M.gguf";
const BUNDLED_MODEL_URL = import.meta.env.DEV
  ? `/models/${MODEL_FILE}`
  : new URL(`../models/${MODEL_FILE}`, import.meta.url).href;
const SYSTEM_PROMPT =
  "You are Vibex: a dry, funny senior AI pair-programmer. Answer in 1-3 short sentences, under 60 tokens.";
const MAX_PROMPT_CHARS = 1000;

type LoadModelOptions = NonNullable<Parameters<Wllama["loadModel"]>[1]>;
type LocalModelFile = Blob & { readonly name: string };
type ProgressHandler = (progress: VibexAiProgress) => void;

export function createFullVibexAiClient(onChange: VibexAiChangeHandler): VibexAiClient {
  let status: VibexAiStatus = "idle";
  let errorMessage: string | undefined;
  let progress: VibexAiProgress | undefined;
  let wllama: Wllama | undefined;
  let loading: Promise<void> | undefined;
  let abortController: AbortController | undefined;
  let epoch = 0;
  let lastProgressPercent = -1;

  return {
    dispose(): void {
      epoch += 1;
      abortController?.abort();
      abortController = undefined;
      void wllama?.exit().catch(() => {});
      wllama = undefined;
      loading = undefined;
      status = "idle";
      errorMessage = undefined;
      progress = undefined;
      onChange();
    },

    async downloadModel(): Promise<boolean> {
      if (status === "busy" || status === "downloading") {
        return false;
      }

      const requestEpoch = epoch + 1;
      epoch = requestEpoch;
      status = "downloading";
      errorMessage = undefined;
      progress = { loaded: 0, total: 0 };
      onChange();

      try {
        await ensureModel(requestEpoch);

        if (requestEpoch !== epoch || wllama?.isModelLoaded() !== true) {
          return false;
        }

        status = "ready";
        onChange();
        return true;
      } catch (error) {
        if (requestEpoch !== epoch) {
          return false;
        }

        await disposeCurrentInstance();
        status = "error";
        errorMessage = getErrorMessage(error, "Vibex AI download failed");
        progress = undefined;
        onChange();
        return false;
      }
    },

    async generate(prompt: string, eraModel: string): Promise<string | undefined> {
      if (status !== "ready" || wllama?.isModelLoaded() !== true) {
        return undefined;
      }

      const requestEpoch = epoch;
      status = "busy";
      errorMessage = undefined;
      onChange();

      try {
        const response = await wllama.createChatCompletion({
          max_tokens: 60,
          messages: [
            {
              role: "system",
              content: `${SYSTEM_PROMPT} Current in-game model era: ${eraModel}.`
            },
            { role: "user", content: clampPrompt(prompt) }
          ]
        });

        if (requestEpoch !== epoch) {
          return undefined;
        }

        status = "ready";
        onChange();
        return response.choices[0]?.message.content?.trim();
      } catch (error) {
        if (requestEpoch === epoch) {
          status = "error";
          errorMessage = getErrorMessage(error, "Vibex AI generation failed");
          progress = undefined;
          onChange();
        }

        return undefined;
      }
    },

    snapshot(): VibexAiSnapshot {
      return status === "idle"
        ? createIdleSnapshot()
        : {
            canDownload: status !== "busy" && status !== "downloading",
            errorMessage,
            modelSizeLabel: createIdleSnapshot().modelSizeLabel,
            progress,
            status
          };
    }
  };

  async function ensureModel(requestEpoch: number): Promise<void> {
    if (wllama?.isModelLoaded() === true) {
      return;
    }

    loading ??= loadModel(requestEpoch).finally(() => {
      loading = undefined;
    });
    await loading;
  }

  async function loadModel(requestEpoch: number): Promise<void> {
    abortController = new AbortController();
    await disposeCurrentInstance();
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
    wllama = instance;
    lastProgressPercent = -1;

    try {
      const loadOptions = createLoadOptions();
      const model = await fetchBundledModelFile(abortController.signal, (nextProgress) => {
        if (requestEpoch === epoch && shouldReportProgress(nextProgress)) {
          progress = nextProgress;
          status = "downloading";
          onChange();
        }
      });

      if (requestEpoch !== epoch) {
        await disposeInstance(instance);
        return;
      }

      await instance.loadModel([model], loadOptions);

      if (requestEpoch !== epoch) {
        await disposeInstance(instance);
        return;
      }

      progress = { loaded: model.size, total: model.size };
      onChange();
    } catch (error) {
      await disposeInstance(instance);
      throw error;
    }
  }

  async function disposeInstance(instance: Wllama): Promise<void> {
    if (wllama === instance) {
      wllama = undefined;
    }

    await instance.exit().catch(() => {});
  }

  async function disposeCurrentInstance(): Promise<void> {
    const instance = wllama;
    wllama = undefined;
    await instance?.exit().catch(() => {});
  }

  function shouldReportProgress(nextProgress: VibexAiProgress): boolean {
    if (nextProgress.total <= 0) {
      return lastProgressPercent < 0;
    }

    const percent = Math.min(100, Math.floor((nextProgress.loaded / nextProgress.total) * 100));
    if (percent === lastProgressPercent && nextProgress.loaded < nextProgress.total) {
      return false;
    }

    lastProgressPercent = percent;
    return true;
  }
}

async function fetchBundledModelFile(
  signal: AbortSignal,
  reportProgress: ProgressHandler
): Promise<LocalModelFile> {
  const response = await fetch(BUNDLED_MODEL_URL, { signal });

  if (!response.ok) {
    throw new Error(`Bundled Vibex model failed to load (${response.status})`);
  }

  const total = Number(response.headers.get("content-length") ?? 0);
  const contentType = response.headers.get("content-type") ?? "application/octet-stream";

  if (response.body === null) {
    const blob = await response.blob();
    reportProgress({ loaded: blob.size, total: total > 0 ? total : blob.size });
    return createLocalModelFile([blob], contentType);
  }

  const chunks: ArrayBuffer[] = [];
  const reader = response.body.getReader();
  let loaded = 0;

  for (;;) {
    const result = await reader.read();

    if (result.done) {
      break;
    }

    loaded += result.value.byteLength;
    chunks.push(copyChunk(result.value));
    reportProgress({ loaded, total });
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

function copyChunk(chunk: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(chunk.byteLength);
  new Uint8Array(copy).set(chunk);
  return copy;
}

function createLoadOptions(): LoadModelOptions {
  return {
    n_gpu_layers: 0
  };
}

function clampPrompt(prompt: string): string {
  return prompt.length <= MAX_PROMPT_CHARS ? prompt : prompt.slice(0, MAX_PROMPT_CHARS);
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
