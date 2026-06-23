import { describe, expect, it } from "vitest";

import { createAppActions, type AppActionsRuntime } from "../src/app/actions";
import { Big } from "../src/core/bignum";
import { createEventBus } from "../src/core/bus";
import { createDefaultGameState, type GameState } from "../src/core/state";
import { createViewInvalidation } from "../src/core/view-invalidation";
import type { VibexAiClient } from "../src/platform/ai";
import type { Platform } from "../src/platform/platform";
import type { AudioController } from "../src/ui/audio";
import type { AppActions, AppShell } from "../src/ui/render";
import type { CommsController } from "../src/app/comms";
import type { VibexSession } from "../src/app/vibex-session";
import { createDerivedCache, recomputeDerivedCache } from "../src/systems/production";

describe("bankruptcy action guards", () => {
  it("blocks gameplay actions after bank default while leaving safe actions available", () => {
    const state = createDefaultGameState(0, "full");
    state.bank.defaulted = true;
    state.bank.defaultedAtS = 10;
    state.bank.overdraft = Big.fromNumber(10_000);
    state.res.computeCap = 1_000;
    state.res.money = Big.fromNumber(1_000_000);
    const { actions, counters } = createBankruptcyActions(state);

    actions.buyGenerator("g_autocomplete", 1);
    expect(state.owned.generators.g_autocomplete).toBe(0);
    expect(counters.flushed).toBe(1);

    const response = actions.sendVibexPrompt("build");
    expect(response).toMatchObject({
      committed: false,
      loc: "0 LoC",
      prompt: "build"
    });
    expect(response.response).toContain("Bankruptcy");

    expect(actions.exportSave().length).toBeGreaterThan(0);
    actions.quitToTitle();
    expect(state.ui.scene).toBe("boot");
  });

  it("repays bank debt before allowing a gameplay purchase", () => {
    const state = createDefaultGameState(0, "full");
    state.bank.overdraft = Big.fromNumber(100);
    state.res.money = Big.fromNumber(1_000_000);
    state.res.computeCap = 1_000;
    const { actions } = createBankruptcyActions(state);

    actions.buyGenerator("g_autocomplete", 1);

    expect(state.bank.overdraft.eq0()).toBe(true);
    expect(state.owned.generators.g_autocomplete).toBe(1);
    expect(state.res.money.lt(Big.fromNumber(1_000_000))).toBe(true);
  });
});

function createBankruptcyActions(state: GameState): {
  readonly actions: AppActions;
  readonly counters: { flushed: number };
} {
  const counters = { flushed: 0 };
  const appShell: AppShell = {
    addTerminalLog(): void {},
    destroy(): void {},
    showToast(): void {},
    updateDevFloor(): void {},
    updateFrameAlpha(): void {}
  };
  const platform: Platform = {
    edition: "full",
    async load(): Promise<string | null> {
      return null;
    },
    openExternal(): void {},
    async save(): Promise<void> {},
    setTitle(): void {}
  };
  const audio: AudioController = {
    play(): void {},
    setSettings(): void {}
  };
  const comms: CommsController = {
    getNotificationWindowBounds: () => ({ height: 1, width: 1 }),
    getStoryLines: () => [],
    getStoryMessageAppId: () => undefined,
    getView: () => ({
      messages: [],
      quiet: false,
      unreadByChannel: { chat: 0, feed: 0, mail: 0 },
      unreadCount: 0
    }),
    markAppRead(): void {},
    markDirty(): void {},
    showStoryToast(): void {}
  };
  const vibexAi: VibexAiClient = {
    dispose(): void {},
    async downloadModel(): Promise<boolean> {
      return false;
    },
    async generate(): Promise<string | undefined> {
      return undefined;
    },
    snapshot: () => ({
      canDownload: false,
      modelSizeLabel: "0 MB",
      progress: undefined,
      status: "unavailable"
    })
  };
  const vibexSession: VibexSession = {
    advanceCode: () => ({ committed: false, fileId: "test", lineKeys: [], sequence: 0 }),
    createManualFallbackResponse: () => "",
    drawCannedResponse: () => ({ prompt: "", response: "" }),
    getAssistant: () => ({ prompt: "", response: "" }),
    getCodeFrame: () => ({ committed: false, fileId: "test", lineKeys: [], sequence: 0 }),
    getFileTabs: () => [],
    reset(): void {},
    setAssistant(): void {},
    syncSeeds(): void {}
  };
  const cache = createDerivedCache();
  recomputeDerivedCache(state, cache);
  const runtime: AppActionsRuntime = {
    app: () => appShell,
    audio,
    bus: createEventBus(),
    cache,
    changeLanguage: async () => undefined,
    comms,
    completeTutorial(): void {},
    dismissOffline(): void {},
    formatters: {
      formatLinesOfCode: () => "0 LoC"
    },
    flushActionInvalidation(): void {
      counters.flushed += 1;
    },
    getState: () => state,
    installState(): void {},
    invalidation: createViewInvalidation(false),
    moveTutorialStep(): void {},
    persistence: {
      persistNow: async () => true,
      unblock(): void {},
      scheduleAutosave(): void {}
    },
    persistNow: async () => true,
    platform,
    scheduleAutosave(): void {},
    syncVibexSeeds(): void {},
    updateVisibleView(): void {},
    vibexAi,
    vibexSession
  };

  return { actions: createAppActions(runtime), counters };
}
