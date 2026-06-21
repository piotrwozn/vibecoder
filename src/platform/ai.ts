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
  let loading: Promise<VibexAiClient> | undefined;

  const loadClient = async (): Promise<VibexAiClient> => {
    loading ??= import("./ai.full").then((module) => {
      client = module.createFullVibexAiClient(onChange);
      onChange();
      return client;
    });
    return loading;
  };

  return {
    async downloadModel(): Promise<boolean> {
      return (await loadClient()).downloadModel();
    },

    async generate(prompt: string, eraModel: string): Promise<string | undefined> {
      return (await loadClient()).generate(prompt, eraModel);
    },

    snapshot(): VibexAiSnapshot {
      return client?.snapshot() ?? createIdleSnapshot();
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
