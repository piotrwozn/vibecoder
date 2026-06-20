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

export function createFullVibexAiClient(onChange: VibexAiChangeHandler): VibexAiClient {
  let nextId = 1;
  let worker: Worker | undefined;
  let status: VibexAiStatus = "idle";
  let progress: VibexAiProgress | undefined;
  const pending = new Map<number, PendingRequest>();

  const ensureWorker = (): Worker => {
    if (worker !== undefined) {
      return worker;
    }

    worker = new Worker(new URL("./ai.worker.ts", import.meta.url), { type: "module" });
    worker.addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;

      if (message.type === "progress") {
        progress = { loaded: message.loaded, total: message.total };
        status = "downloading";
        onChange();
        return;
      }

      if (message.type === "ready") {
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
      onChange();

      if (message.ok) {
        request.resolve(message.text);
      } else {
        request.reject(new Error(message.message));
      }
    });
    worker.addEventListener("error", () => {
      status = "error";
      rejectPending(new Error("Vibex AI worker failed"));
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
    async downloadModel(): Promise<boolean> {
      if (status === "busy" || status === "downloading") {
        return false;
      }

      const id = nextId;
      nextId += 1;
      status = "downloading";
      progress = { loaded: 0, total: 0 };
      onChange();

      try {
        await send({ id, type: "download" });
        status = "ready";
        onChange();
        return true;
      } catch {
        status = "error";
        onChange();
        return false;
      }
    },

    async generate(prompt: string, eraModel: string): Promise<string | undefined> {
      if (status !== "ready") {
        return undefined;
      }

      const id = nextId;
      nextId += 1;
      status = "busy";
      onChange();

      try {
        return await send({ eraModel, id, prompt, type: "generate" });
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
}
