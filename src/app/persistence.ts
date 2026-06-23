import { saveGameState } from "../core/save";
import type { GameState } from "../core/state";
import type { Platform } from "../platform/platform";
import type { SaveFailureNotifier } from "./save-failure";

export interface PersistenceController {
  persistNow(): Promise<boolean>;
  scheduleAutosave(): void;
  unblock(): void;
}

export interface PersistenceControllerOptions {
  readonly blocked: boolean;
  readonly getState: () => GameState;
  readonly platform: Platform;
  readonly saveFailureNotifier: SaveFailureNotifier;
}

export function createPersistenceController(
  options: PersistenceControllerOptions
): PersistenceController {
  let autosaveTimer: number | undefined;
  let inFlightSave: Promise<boolean> | undefined;
  let persistenceBlocked = options.blocked;
  let saveQueued = false;

  const persistNow = async (): Promise<boolean> => {
    if (persistenceBlocked) {
      return false;
    }

    if (inFlightSave !== undefined) {
      saveQueued = true;
      return inFlightSave;
    }

    inFlightSave = drainSaveQueue().finally(() => {
      inFlightSave = undefined;
    });

    return inFlightSave;
  };

  const saveOnce = async (): Promise<boolean> =>
    options.saveFailureNotifier.report(
      await saveGameState(options.platform, options.getState(), Date.now())
    );

  const drainSaveQueue = async (): Promise<boolean> => {
    let result = await saveOnce();

    while (saveQueued && !persistenceBlocked) {
      saveQueued = false;
      result = await saveOnce();
    }

    return result;
  };

  return {
    persistNow,

    scheduleAutosave(): void {
      if (autosaveTimer !== undefined) {
        window.clearInterval(autosaveTimer);
      }

      const autosaveS = options.getState().settings.autosaveS;
      const intervalS = Number.isFinite(autosaveS) ? Math.max(1, autosaveS) : 1;
      autosaveTimer = window.setInterval(() => {
        void persistNow();
      }, intervalS * 1000);
    },

    unblock(): void {
      persistenceBlocked = false;
    }
  };
}
