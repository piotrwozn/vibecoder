import { beforeEach, describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState } from "../src/core/state";
import { createAppFormatters } from "../src/app/formatters";
import { createViewModelBuilder } from "../src/app/view-models";
import { createVibexSession } from "../src/app/vibex-session";
import { loadLocale } from "../src/i18n/i18n";
import { createDerivedCache, recomputeDerivedCache } from "../src/systems/production";
import { startProject, tickProjects } from "../src/systems/projects";
import type { CommsController } from "../src/app/comms";
import type { VibexAiClient } from "../src/platform/ai";

beforeEach(async () => {
  await loadLocale("en");
});

describe("view models", () => {
  it("stops advertising RP on project cards after the reward limit is exhausted", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();

    recomputeDerivedCache(state, cache);

    for (let ship = 0; ship < 3; ship += 1) {
      state.res.loc = Big.fromNumber(100_000);
      expect(startProject(state, "p_scope_creep", cache).ok).toBe(true);
      tickProjects(state, cache, 120);
      recomputeDerivedCache(state, cache);
    }

    const builder = createViewModelBuilder({
      cache,
      comms: createCommsStub(),
      formatters: createAppFormatters(() => state),
      getOfflineSummary: () => undefined,
      hasPersistedSave: () => false,
      getState: () => state,
      vibexAi: createVibexAiStub(),
      vibexSession: createVibexSession(state.vibex)
    });

    const view = builder.createDevFloorView(cache, true);
    const scope = view.projects.offers.find((offer) => offer.id === "p_scope_creep");

    expect(scope?.tag).toBe("Standard");
  });

  it("continues existing hosted projects without showing a fresh deployment choice", () => {
    const state = createDefaultGameState(0, "full");
    const cache = createDerivedCache();
    state.res.loc = Big.fromNumber(10_000);
    state.res.computeCap = 0;
    state.projects.board = [{ id: "p_landing", projectId: "p_landing" }];
    state.projects.portfolio.push({
      id: "p_landing.1",
      bugged: false,
      computeUse: 4,
      deploymentMode: "hosted",
      level: 1,
      projectId: "p_landing",
      revenue: Big.fromNumber(1),
      shippedAtS: 0
    });
    recomputeDerivedCache(state, cache);

    const builder = createViewModelBuilder({
      cache,
      comms: createCommsStub(),
      formatters: createAppFormatters(() => state),
      getOfflineSummary: () => undefined,
      hasPersistedSave: () => false,
      getState: () => state,
      vibexAi: createVibexAiStub(),
      vibexSession: createVibexSession(state.vibex)
    });

    const offer = builder.createDevFloorView(cache, true).projects.offers.find((entry) => {
      return entry.id === "p_landing";
    });

    expect(offer?.isContinuation).toBe(true);
    expect(offer?.continueDeploymentMode).toBe("hosted");
    expect(offer?.canStart).toBe(true);
    expect(offer?.canStartSelfHosted).toBe(false);
  });

  it("does not reopen the finale modal after an ending was chosen", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();

    state.story.act = 5;
    state.story.seen.add("a5_11_finale");
    state.story.seen.add("a5_12_final_choice");
    state.prestige.endingChoice = "merge";
    state.story.flags.add("iteration_unlocked");
    state.story.flags.add("achievement.ending_merge");
    recomputeDerivedCache(state, cache);

    const builder = createViewModelBuilder({
      cache,
      comms: createCommsStub(),
      formatters: createAppFormatters(() => state),
      getOfflineSummary: () => undefined,
      hasPersistedSave: () => false,
      getState: () => state,
      vibexAi: createVibexAiStub(),
      vibexSession: createVibexSession(state.vibex)
    });

    expect(builder.createDevFloorView(cache, true).ending.visible).toBe(false);
  });

  it("refreshes the Aurora unlock state even while the Aurora window is closed", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    const builder = createViewModelBuilder({
      cache,
      comms: createCommsStub(),
      formatters: createAppFormatters(() => state),
      getOfflineSummary: () => undefined,
      hasPersistedSave: () => false,
      getState: () => state,
      vibexAi: createVibexAiStub(),
      vibexSession: createVibexSession(state.vibex)
    });

    expect(builder.createDevFloorView(cache, false).aurora.unlocked).toBe(false);

    state.aurora.unlocked = true;
    state.aurora.status = "funding";
    state.story.flags.add("aurora_unlocked");

    expect(builder.createDevFloorView(cache, false).aurora.unlocked).toBe(true);
  });
});

function createCommsStub(): CommsController {
  return {
    getNotificationWindowBounds: () => ({ height: 1, width: 1 }),
    getStoryLines: () => [],
    getStoryMessageAppId: () => undefined,
    getView: () => ({
      messages: [],
      quiet: false,
      unreadByChannel: { chat: 0, feed: 0, mail: 0 },
      unreadCount: 0
    }),
    markAppRead: () => {},
    markDirty: () => {},
    showStoryToast: () => {}
  };
}

function createVibexAiStub(): VibexAiClient {
  return {
    dispose: () => {},
    downloadModel: async () => false,
    generate: async () => undefined,
    snapshot: () => ({
      canDownload: false,
      modelSizeLabel: "",
      progress: undefined,
      status: "unavailable"
    })
  };
}
