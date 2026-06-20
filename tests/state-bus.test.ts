import { describe, expect, it } from "vitest";

import { createEventBus } from "../src/core/bus";
import type { Big } from "../src/core/bignum";
import { SAVE_VERSION } from "../src/core/migrations";
import { createDefaultGameState } from "../src/core/state";
import { C, PRESTIGE } from "../src/data/constants";
import { STARTING_COMPUTE_CAP } from "../src/data/hardware";

describe("M2 state and bus", () => {
  it("creates the full default game state tree", () => {
    const state = createDefaultGameState(1000);

    expect(state.v).toBe(SAVE_VERSION);
    expect(state.meta.createdAt).toBe(1000);
    expect(state.meta.edition).toBe("demo");
    expect(state.res.loc.eq0()).toBe(true);
    expect(state.res.money.eq0()).toBe(true);
    expect(state.res.computeCap).toBe(STARTING_COMPUTE_CAP);
    expect(state.res.hype).toBe(1);
    expect(state.owned.generators.g_autocomplete).toBe(0);
    expect(state.owned.generators.g_parrot).toBe(0);
    expect(state.owned.generators.g_macro).toBe(0);
    expect(state.settings.notation).toBe("sci");
    expect(state.ui.scene).toBe("boot");
    expect(state.ui.bootSeen).toBe(false);
    expect(state.ui.windows.vibex.open).toBe(false);
  });

  it("exports all M2 constants from the plan", () => {
    expect(C.TICK_HZ).toBe(10);
    expect(C.CLICK_SYNERGY).toBe(0.02);
    expect(C.HW_BASE_CAP).toBe(6);
    expect(C.HW_PC_MAX_CAP).toBe(3486);
    expect(C.MILESTONES).toEqual([10, 25, 50, 100, 250, 500, 1000]);
    expect(PRESTIGE.INSIGHT_DIV).toBe(1e7);
    expect(PRESTIGE.ITER_HOLD_S).toBe(600);
  });

  it("delivers typed events and supports unsubscribe", () => {
    const bus = createEventBus();
    const seen: Array<string | Big> = [];
    const off = bus.on("res:changed", (resource) => {
      seen.push(resource);
    });

    bus.emit("res:changed", "loc");
    off();
    bus.emit("res:changed", "money");

    expect(seen).toEqual(["loc"]);
  });
});
