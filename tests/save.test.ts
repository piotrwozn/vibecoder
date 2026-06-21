import { describe, expect, it } from "vitest";

import v1Fixture from "./fixtures/saves/v1.json";
import v2Fixture from "./fixtures/saves/v2.json";
import v3Fixture from "./fixtures/saves/v3.json";
import v4Fixture from "./fixtures/saves/v4.json";
import v5Fixture from "./fixtures/saves/v5.json";
import v6Fixture from "./fixtures/saves/v6.json";
import { Big } from "../src/core/bignum";
import { SAVE_VERSION } from "../src/core/migrations";
import {
  deserializeGameState,
  exportGameState,
  importGameState,
  loadGameState,
  serializeGameState
} from "../src/core/save";
import { createDefaultGameState } from "../src/core/state";
import { C } from "../src/data/constants";
import { LEGACY_HARDWARE_ID } from "../src/data/hardware";
import { recomputeComputeCap } from "../src/systems/compute";
import {
  createDerivedCache,
  recomputeDerivedCache,
  tickProduction
} from "../src/systems/production";

describe("M4 save/load", () => {
  it("round-trips Big values, Sets, arrays, and settings", () => {
    const state = createDefaultGameState(1_000, "demo");
    state.meta.lastSeen = 2_000;
    state.res.loc = Big.fromNumber(123);
    state.res.money = Big.fromNumber(456);
    state.owned.research.add("r_test");
    state.projects.portfolio.push({
      id: "p_llama_todo.1",
      bugged: false,
      projectId: "p_llama_todo",
      revenue: Big.fromNumber(7),
      shippedAtS: 10
    });
    state.settings.notation = "suffix";
    state.settings.doNotDisturb = true;
    state.settings.vibexLocalAi = true;
    state.ui.tutorial = {
      active: true,
      completed: false,
      step: "projects"
    };

    const result = deserializeGameState(serializeGameState(state), {
      edition: "demo",
      nowMs: 9_000
    });

    expect(result.repaired).toBe(false);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.res.loc.toNumber()).toBe(123);
    expect(result.state.res.money.toNumber()).toBeCloseTo(456);
    expect(result.state.owned.research.has("r_test")).toBe(true);
    expect(result.state.projects.portfolio[0]?.revenue.toNumber()).toBe(7);
    expect(result.state.settings.notation).toBe("suffix");
    expect(result.state.settings.doNotDisturb).toBe(true);
    expect(result.state.settings.vibexLocalAi).toBe(true);
    expect(result.state.ui.tutorial).toEqual({
      active: true,
      completed: false,
      step: "projects"
    });
    expect(result.state.meta.lastSeen).toBe(2_000);
  });

  it("repairs broken localStorage JSON into a bootable default state", async () => {
    const result = await loadGameState(
      {
        edition: "demo",
        load: async () => "{broken"
      },
      42
    );

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.meta.lastSeen).toBe(42);
    expect(result.state.res.loc.eq0()).toBe(true);
  });

  it("exports and imports base64 saves while adopting the current edition", () => {
    const state = createDefaultGameState(1_000, "demo");
    state.res.loc = Big.fromNumber(99);

    const imported = importGameState(exportGameState(state), {
      edition: "full",
      nowMs: 5_000
    });

    expect(imported.ok).toBe(true);
    if (imported.ok) {
      expect(imported.state.meta.edition).toBe("full");
      expect(imported.state.res.loc.toNumber()).toBe(99);
    }

    expect(importGameState("not a save").ok).toBe(false);
  });

  it("migrates the v1 fixture to the desktop shell and boots headless for 60 seconds", () => {
    const result = deserializeGameState(JSON.stringify(v1Fixture), {
      edition: "demo",
      nowMs: 10_000
    });
    const cache = createDerivedCache();

    recomputeDerivedCache(result.state, cache);
    tickProduction(result.state, cache, 60);

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.ui.scene).toBe("desktop");
    expect(result.state.ui.bootSeen).toBe(true);
    expect(result.state.ui.tutorial).toEqual({
      active: false,
      completed: false,
      step: "welcome"
    });
    expect(result.state.ui.windows.agents.open).toBe(false);
  });

  it("migrates the v2 fixture to split M14 apps", () => {
    const result = deserializeGameState(JSON.stringify(v2Fixture), {
      edition: "demo",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.settings.doNotDisturb).toBe(false);
    expect(result.state.settings.skipIntro).toBe(false);
    expect(result.state.ui.windows.agents.open).toBe(true);
    expect(result.state.ui.windows.hardware.open).toBe(false);
    expect(result.state.ui.windows.upgrades.open).toBe(false);
    expect(result.state.ui.windows.chat.appId).toBe("chat");
    expect(result.state.ui.windows.mail.appId).toBe("mail");
    expect(result.state.ui.windows.feed.appId).toBe("feed");
    expect((result.state.ui.windows as Record<string, unknown>).comms).toBeUndefined();
  });

  it("migrates the v3 fixture to M15 local AI settings", () => {
    const result = deserializeGameState(JSON.stringify(v3Fixture), {
      edition: "demo",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.settings.vibexLocalAi).toBe(false);
    expect(result.state.settings.doNotDisturb).toBe(false);
  });

  it("migrates the v4 old hardware tiers to M16 legacy cap", () => {
    const result = deserializeGameState(JSON.stringify(v4Fixture), {
      edition: "full",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.owned.hardware[LEGACY_HARDWARE_ID]).toBe(3124);
    expect(result.state.owned.hardware.h_gaming_rig).toBeUndefined();
    expect(result.state.res.computeCap).toBe(3130);
    expect(recomputeComputeCap(result.state)).toBe(3130);
    expect(result.state.hardware.pcComplete).toBe(true);
    expect(result.state.res.computeCap).toBe(C.HW_BASE_CAP + 3124);
    expect(result.state.ui.tutorial).toEqual({
      active: false,
      completed: true,
      step: "done"
    });
  });

  it("migrates v5 saves to v6 with completed tutorial for established runs", () => {
    const result = deserializeGameState(JSON.stringify(v5Fixture), {
      edition: "full",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.ui.tutorial).toEqual({
      active: false,
      completed: true,
      step: "done"
    });
    expect(result.state.owned.hardware[LEGACY_HARDWARE_ID]).toBe(3124);
  });

  it("migrates v6 saves to v7 with locked Aurora and a repaired Aurora window", () => {
    const result = deserializeGameState(JSON.stringify(v6Fixture), {
      edition: "full",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.aurora).toEqual({
      billingPaused: false,
      completed: false,
      currentPhase: 0,
      dedicatedServers: 0,
      hostedServers: 0,
      phaseActive: false,
      phaseElapsedS: 0,
      status: "locked",
      unlocked: false
    });
    expect(result.state.ui.windows.aurora.appId).toBe("aurora");
    expect(result.state.ui.windows.aurora.open).toBe(false);
  });

  it("round-trips v7 Aurora progress, hosting, and dedicated servers", () => {
    const state = createDefaultGameState(1_000, "full");
    state.aurora = {
      billingPaused: true,
      completed: false,
      currentPhase: 3,
      dedicatedServers: 2,
      hostedServers: 4,
      phaseActive: true,
      phaseElapsedS: 123,
      status: "billing",
      unlocked: true
    };

    const result = deserializeGameState(serializeGameState(state), {
      edition: "full",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(false);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.aurora).toEqual(state.aurora);
  });
});
