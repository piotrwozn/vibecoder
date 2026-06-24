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
