import type { VibexState } from "../core/state";
import { VIBEX_CODE_FILES } from "../data/vibex";
import { t } from "../i18n/i18n";
import {
  advanceVibexCode,
  createVibexCannedBag,
  createVibexCodeState,
  drawVibexCannedPair,
  getVibexCodeFrame,
  getVibexFileLabelKey,
  getVibexManualFallbackKey,
  type VibexCannedBag,
  type VibexCodeFrame,
  type VibexCodeState
} from "../systems/vibex";

type VibexAssistantState =
  | {
      readonly kind: "keys";
      readonly promptKey: string;
      readonly responseKey: string;
    }
  | {
      readonly kind: "text";
      readonly prompt: string;
      readonly response: string;
    };

export interface VibexFileTabView {
  readonly active: boolean;
  readonly id: string;
  readonly label: string;
}

export interface VibexSession {
  advanceCode(): VibexCodeFrame;
  createManualFallbackResponse(prompt: string, eraModel: string): string;
  drawCannedResponse(): { readonly prompt: string; readonly response: string };
  getAssistant(): { readonly prompt: string; readonly response: string };
  getCodeFrame(): VibexCodeFrame;
  getFileTabs(): readonly VibexFileTabView[];
  reset(vibex: VibexState): void;
  setAssistant(prompt: string, response: string): void;
  syncSeeds(vibex: VibexState): void;
}

export function createVibexSession(vibex: VibexState): VibexSession {
  let cannedBag: VibexCannedBag;
  let assistant: VibexAssistantState;
  let codeState: VibexCodeState;
  let codeFrame: VibexCodeFrame;

  const reset = (nextVibex: VibexState): void => {
    cannedBag = createVibexCannedBag(nextVibex.cannedSeed);
    drawVibexCannedPair(cannedBag);
    assistant = createIdleAssistant();
    codeState = createVibexCodeState(nextVibex.codeSeed);
    codeFrame = getVibexCodeFrame(codeState);
    syncSeeds(nextVibex);
  };

  const syncSeeds = (nextVibex: VibexState): void => {
    nextVibex.cannedSeed = cannedBag.seed;
    nextVibex.codeSeed = codeState.seed;
  };

  reset(vibex);

  return {
    advanceCode(): VibexCodeFrame {
      codeFrame = advanceVibexCode(codeState);
      return codeFrame;
    },

    createManualFallbackResponse(prompt: string, eraModel: string): string {
      return t(getVibexManualFallbackKey(codeFrame.sequence), {
        model: eraModel,
        prompt: prompt.slice(0, 72)
      });
    },

    drawCannedResponse(): { readonly prompt: string; readonly response: string } {
      const current = drawVibexCannedPair(cannedBag);
      return {
        prompt: t(current.promptKey),
        response: t(current.responseKey)
      };
    },

    getAssistant(): { readonly prompt: string; readonly response: string } {
      if (assistant.kind === "keys") {
        return {
          prompt: t(assistant.promptKey),
          response: t(assistant.responseKey)
        };
      }

      return {
        prompt: assistant.prompt,
        response: assistant.response
      };
    },

    getCodeFrame(): VibexCodeFrame {
      return codeFrame;
    },

    getFileTabs(): readonly VibexFileTabView[] {
      const activeFileId = codeFrame.fileId;
      return VIBEX_CODE_FILES.map((file, index) => ({
        active: file.id === activeFileId,
        id: file.id,
        label: t(getVibexFileLabelKey(codeState, index))
      }));
    },

    reset,

    setAssistant(prompt: string, response: string): void {
      assistant = {
        kind: "text",
        prompt,
        response
      };
    },

    syncSeeds
  };
}

function createIdleAssistant(): VibexAssistantState {
  return {
    kind: "keys",
    promptKey: "vibex.aiAssistant.idlePrompt",
    responseKey: "vibex.aiAssistant.idleResponse"
  };
}
