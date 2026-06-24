import { describe, expect, it, vi } from "vitest";

import { createEventBus } from "../src/core/bus";
import type { Big } from "../src/core/bignum";
import { SAVE_VERSION } from "../src/core/migrations";
import { createDefaultGameState, createInitialRngSeed } from "../src/core/state";
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
    expect(state.rngSeed).toBe(createInitialRngSeed(1000));
  });

  it("varies fresh game RNG seeds by creation time while keeping them persisted", () => {
    const first = createDefaultGameState(1000);
    const second = createDefaultGameState(2000);

    expect(first.rngSeed).not.toBe(1);
    expect(first.rngSeed).not.toBe(second.rngSeed);
    expect(first.vibex).not.toEqual(second.vibex);
  });

  it("exports all M2 constants from the plan", () => {
    expect(C.TICK_HZ).toBe(10);
    expect(C.CLICK_SYNERGY).toBe(0.02);
    expect(C.HW_BASE_CAP).toBe(10);
    expect(C.HW_PC_MAX_CAP).toBe(186);
    expect(C.MILESTONES).toEqual([10, 25, 50, 100, 250, 500, 1000]);
    expect(PRESTIGE.INSIGHT_DIV).toBe(1e6);
    expect(PRESTIGE.REWRITE_MIN_FIRST).toBe(6);
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

  it("snapshots listeners during emit", () => {
    const bus = createEventBus();
    const seen: string[] = [];
    let offSecond = (): void => {};

    bus.on("res:changed", () => {
      seen.push("first");
      offSecond();
      bus.on("res:changed", () => {
        seen.push("third");
      });
    });
    offSecond = bus.on("res:changed", () => {
      seen.push("second");
    });

    bus.emit("res:changed", "loc");

    expect(seen).toEqual(["first", "second"]);
  });

  it("continues dispatching when one listener throws", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const bus = createEventBus();
    const seen: string[] = [];

    bus.on("res:changed", () => {
      throw new Error("listener failed");
    });
    bus.on("res:changed", (resource) => {
      seen.push(resource);
    });

    bus.emit("res:changed", "loc");

    expect(seen).toEqual(["loc"]);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
