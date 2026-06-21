import {
  createIdleSnapshot,
  type VibexAiChangeHandler,
  type VibexAiClient,
  type VibexAiProgress,
  type VibexAiSnapshot,
  type VibexAiStatus
} from "./ai";

type WorkerRequest =
  | { readonly id: number; readonly type: "download" }
  | {
      readonly eraModel: string;
      readonly id: number;
      readonly prompt: string;
      readonly type: "generate";
    };

type WorkerMessage =
  | { readonly id: number; readonly ok: true; readonly text?: string; readonly type: "result" }
  | { readonly id: number; readonly message: string; readonly ok: false; readonly type: "result" }
  | { readonly loaded: number; readonly total: number; readonly type: "progress" }
  | { readonly type: "ready" };

interface PendingRequest {
  readonly reject: (reason?: unknown) => void;
  readonly resolve: (value: string | undefined) => void;
}

const MAX_PROMPT_CHARS = 1000;

export function createFullVibexAiClient(onChange: VibexAiChangeHandler): VibexAiClient {
  let nextId = 1;
  let worker: Worker | undefined;
  let status: VibexAiStatus = "idle";
  let errorMessage: string | undefined;
  let progress: VibexAiProgress | undefined;
  let disposed = false;
  const pending = new Map<number, PendingRequest>();

  const ensureWorker = (): Worker => {
    if (worker !== undefined) {
      return worker;
    }

    worker = new Worker(new URL("./ai.worker.ts", import.meta.url), { type: "module" });
    worker.addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;

      if (message.type === "progress") {
        errorMessage = undefined;
        progress = { loaded: message.loaded, total: message.total };
        status = "downloading";
        onChange();
        return;
      }

      if (message.type === "ready") {
        errorMessage = undefined;
        status = "ready";
        onChange();
        return;
      }

      const request = pending.get(message.id);
      if (request === undefined) {
        return;
      }

      pending.delete(message.id);
      status = message.ok ? "ready" : "error";
      if (!message.ok) {
        errorMessage = message.message;
        progress = undefined;
      } else {
        errorMessage = undefined;
      }
      onChange();

      if (message.ok) {
        request.resolve(message.text);
      } else {
        request.reject(new Error(message.message));
      }
    });
    worker.addEventListener("error", () => {
      status = "error";
      errorMessage = "Vibex AI worker failed";
      progress = undefined;
      rejectPending(new Error("Vibex AI worker failed"));
      worker?.terminate();
      worker = undefined;
      onChange();
    });

    return worker;
  };

  const send = (message: WorkerRequest): Promise<string | undefined> =>
    new Promise((resolve, reject) => {
      pending.set(message.id, { reject, resolve });
      ensureWorker().postMessage(message);
    });

  return {
    dispose(): void {
      disposed = true;
      rejectPending(new Error("Vibex AI disposed"));
      worker?.terminate();
      worker = undefined;
      status = "idle";
      errorMessage = undefined;
      progress = undefined;
      onChange();
    },

    async downloadModel(): Promise<boolean> {
      if (status === "busy" || status === "downloading") {
        return false;
      }

      disposed = false;
      const id = nextId;
      nextId += 1;
      status = "downloading";
      errorMessage = undefined;
      progress = { loaded: 0, total: 0 };
      onChange();

      try {
        await send({ id, type: "download" });
        status = "ready";
        onChange();
        return true;
      } catch (error) {
        if (disposed) {
          return false;
        }

        status = "error";
        errorMessage = error instanceof Error ? error.message : "Vibex AI download failed";
        progress = undefined;
        onChange();
        return false;
      }
    },

    async generate(prompt: string, eraModel: string): Promise<string | undefined> {
      if (status !== "ready") {
        return undefined;
      }

      disposed = false;
      const id = nextId;
      nextId += 1;
      status = "busy";
      onChange();

      try {
        return await send({ eraModel, id, prompt: clampPrompt(prompt), type: "generate" });
      } catch {
        return undefined;
      } finally {
        status = status === "busy" ? "ready" : status;
        onChange();
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

  function rejectPending(error: Error): void {
    for (const request of pending.values()) {
      request.reject(error);
    }

    pending.clear();
  }

  function clampPrompt(prompt: string): string {
    return prompt.length <= MAX_PROMPT_CHARS ? prompt : prompt.slice(0, MAX_PROMPT_CHARS);
  }
}
