import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState } from "../src/core/state";
import { C } from "../src/data/constants";
import { HARDWARE } from "../src/data/hardware";
import { buyHardware, getAvailableHardware, recomputeComputeCap } from "../src/systems/compute";
import { buyGenerator, createDerivedCache, recomputeDerivedCache } from "../src/systems/production";

describe("M16 component hardware", () => {
  it("blocks generator purchases over compute cap and releases the wall with hardware", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.res.money = Big.fromNumber(1_000);
    recomputeDerivedCache(state, cache);

    expect(buyGenerator(state, cache, "g_autocomplete", 10).reason).toBe("compute");
    expect(state.owned.generators.g_autocomplete).toBe(0);

    const hardware = buyHardware(state, "h_cpu");

    expect(hardware.ok).toBe(true);
    expect(state.owned.hardware.h_cpu).toBe(1);
    expect(state.res.computeCap).toBe(46);
    recomputeDerivedCache(state, cache);

    expect(buyGenerator(state, cache, "g_autocomplete", 10).ok).toBe(true);
    expect(state.res.computeUsed).toBe(10);
  });

  it("gates server hardware behind a completed PC and gives the PC max cap", () => {
    const state = createDefaultGameState(1_000, "full");
    state.res.money = Big.fromNumber(1e9);

    buyPcToMax(state);
    recomputeComputeCap(state);

    expect(state.res.computeCap).toBe(C.HW_PC_MAX_CAP);
    expect(state.hardware.pcComplete).toBe(true);
    expect(getAvailableHardware(state).some((hardware) => hardware.id === "h_rack")).toBe(true);
  });

  it("keeps an empty rack at zero cap until server modules are installed", () => {
    const state = createDefaultGameState(1_000, "full");
    state.res.money = Big.fromNumber(1e9);

    buyPcToMax(state);
    expect(buyHardware(state, "h_rack").ok).toBe(true);
    expect(state.res.computeCap).toBe(C.HW_PC_MAX_CAP);

    expect(buyHardware(state, "h_blade").ok).toBe(true);
    expect(state.res.computeCap).toBe(C.HW_PC_MAX_CAP + 300);
  });
});

function buyPcToMax(state: ReturnType<typeof createDefaultGameState>): void {
  for (const hardware of HARDWARE.filter((entry) => entry.phase === "pc")) {
    while ((state.owned.hardware[hardware.id] ?? 0) < hardware.maxLevel) {
      const result = buyHardware(state, hardware.id);
      expect(result.ok).toBe(true);
    }
  }
}
