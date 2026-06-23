import type { Edition } from "./platform";

export type VibexAiStatus = "unavailable" | "idle" | "downloading" | "ready" | "busy" | "error";

export interface VibexAiProgress {
  readonly loaded: number;
  readonly total: number;
}

export interface VibexAiSnapshot {
  readonly canDownload: boolean;
  readonly errorMessage?: string;
  readonly modelSizeLabel: string;
  readonly progress: VibexAiProgress | undefined;
  readonly status: VibexAiStatus;
}

export interface VibexAiClient {
  dispose(): void;
  downloadModel(): Promise<boolean>;
  generate(prompt: string, eraModel: string): Promise<string | undefined>;
  snapshot(): VibexAiSnapshot;
}

export type VibexAiChangeHandler = () => void;

const MODEL_SIZE_LABEL = "95-135 MB";
const LOCAL_AI_BUILD_ENABLED = import.meta.env.VITE_EDITION === "full";

export function createVibexAiClient(
  edition: Edition,
  onChange: VibexAiChangeHandler = () => {}
): VibexAiClient {
  if (!LOCAL_AI_BUILD_ENABLED || edition === "demo" || typeof Worker === "undefined") {
    return createUnavailableAiClient();
  }

  let client: VibexAiClient | undefined;
  let loading: Promise<VibexAiClient | undefined> | undefined;
  let loadError: string | undefined;
  let loadEpoch = 0;

  const loadClient = async (): Promise<VibexAiClient | undefined> => {
    if (client !== undefined) {
      return client;
    }

    const epoch = loadEpoch;
    loadError = undefined;
    loading ??= import("./ai.full")
      .then((module) => {
        const loadedClient = module.createFullVibexAiClient(onChange);

        if (epoch !== loadEpoch) {
          loadedClient.dispose();
          return undefined;
        }

        client = loadedClient;
        onChange();
        return client;
      })
      .catch((error: unknown) => {
        if (epoch === loadEpoch) {
          loadError = getErrorMessage(error);
          onChange();
        }

        return undefined;
      })
      .finally(() => {
        if (epoch === loadEpoch) {
          loading = undefined;
        }
      });
    return loading;
  };

  return {
    dispose(): void {
      loadEpoch += 1;
      client?.dispose();
      client = undefined;
      loadError = undefined;
      loading = undefined;
      onChange();
    },

    async downloadModel(): Promise<boolean> {
      const loadedClient = await loadClient();

      if (loadedClient === undefined) {
        return false;
      }

      try {
        return await loadedClient.downloadModel();
      } catch (error) {
        loadError = getErrorMessage(error);
        onChange();
        return false;
      }
    },

    async generate(prompt: string, eraModel: string): Promise<string | undefined> {
      const loadedClient = await loadClient();

      if (loadedClient === undefined) {
        return undefined;
      }

      try {
        return await loadedClient.generate(prompt, eraModel);
      } catch (error) {
        loadError = getErrorMessage(error);
        onChange();
        return undefined;
      }
    },

    snapshot(): VibexAiSnapshot {
      return (
        client?.snapshot() ??
        (loadError === undefined ? createIdleSnapshot() : createErrorSnapshot(loadError))
      );
    }
  };
}

export function createIdleSnapshot(): VibexAiSnapshot {
  return {
    canDownload: true,
    modelSizeLabel: MODEL_SIZE_LABEL,
    progress: undefined,
    status: "idle"
  };
}

function createUnavailableAiClient(): VibexAiClient {
  return {
    dispose(): void {},

    async downloadModel(): Promise<boolean> {
      return false;
    },

    async generate(): Promise<string | undefined> {
      return undefined;
    },

    snapshot(): VibexAiSnapshot {
      return {
        canDownload: false,
        modelSizeLabel: MODEL_SIZE_LABEL,
        progress: undefined,
        status: "unavailable"
      };
    }
  };
}

function createErrorSnapshot(errorMessage: string): VibexAiSnapshot {
  return {
    canDownload: true,
    errorMessage,
    modelSizeLabel: MODEL_SIZE_LABEL,
    progress: undefined,
    status: "error"
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "local AI failed";
}
