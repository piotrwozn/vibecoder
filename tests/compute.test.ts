import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState } from "../src/core/state";
import { C } from "../src/data/constants";
import { HARDWARE } from "../src/data/hardware";
import { buyHardware, getAvailableHardware, recomputeComputeCap } from "../src/systems/compute";
import { buyGenerator, createDerivedCache, recomputeDerivedCache } from "../src/systems/production";

describe("M16 component hardware", () => {
  it("shows every PC component from the start and hides server hardware until PC max", () => {
    const state = createDefaultGameState(1_000, "full");
    const availableIds = getAvailableHardware(state).map((hardware) => hardware.id);

    expect(availableIds).toEqual(
      expect.arrayContaining(["h_cpu", "h_ram", "h_ssd", "h_psu_pc", "h_cooling_pc", "h_gpu"])
    );
    expect(availableIds).not.toContain("h_rack");

    state.res.money = Big.fromNumber(1e9);
    buyPcToMax(state);

    expect(getAvailableHardware(state).map((hardware) => hardware.id)).toContain("h_rack");
  });

  it("blocks generator purchases over compute cap and releases the wall with hardware", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.res.money = Big.fromNumber(2_000);
    state.owned.generators.g_autocomplete = 1;
    recomputeDerivedCache(state, cache);

    expect(buyGenerator(state, cache, "g_autocomplete", 10).reason).toBe("compute");
    expect(state.owned.generators.g_autocomplete).toBe(1);

    const hardware = buyHardware(state, "h_cpu");

    expect(hardware.ok).toBe(true);
    expect(state.owned.hardware.h_cpu).toBe(1);
    expect(state.res.computeCap).toBe(12);
    for (const id of ["h_ram", "h_ssd", "h_psu_pc", "h_cooling_pc", "h_gpu"]) {
      expect(buyHardware(state, id).ok).toBe(true);
    }
    expect(state.res.computeCap).toBe(20);
    const blockedCpuTier = buyHardware(state, "h_cpu");
    expect(blockedCpuTier.ok).toBe(false);
    expect(blockedCpuTier.reason).toBe("psuTier");
    expect(buyHardware(state, "h_psu_pc").ok).toBe(true);
    expect(state.res.computeCap).toBe(20);
    expect(buyHardware(state, "h_cpu").ok).toBe(true);
    expect(state.res.computeCap).toBe(22);
    recomputeDerivedCache(state, cache);

    expect(buyGenerator(state, cache, "g_autocomplete", 10).ok).toBe(true);
    expect(state.res.computeUsed).toBe(11);
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

    for (const id of ["h_srv_board", "h_srv_psu", "h_srv_cooling", "h_srv_net", "h_blade"]) {
      expect(buyHardware(state, id).ok).toBe(true);
    }
    expect(state.res.computeCap).toBe(C.HW_PC_MAX_CAP + 20);
    const blockedBladeTier = buyHardware(state, "h_blade");
    expect(blockedBladeTier.ok).toBe(false);
    expect(blockedBladeTier.reason).toBe("psuTier");
    expect(buyHardware(state, "h_srv_psu").ok).toBe(true);
    for (const id of ["h_srv_board", "h_srv_cooling", "h_srv_net", "h_blade"]) {
      expect(buyHardware(state, id).ok).toBe(true);
    }
    expect(state.res.computeCap).toBe(C.HW_PC_MAX_CAP + 40);
  });
});

function buyPcToMax(state: ReturnType<typeof createDefaultGameState>): void {
  const pcHardware = HARDWARE.filter((entry) => entry.phase === "pc");
  let progress = true;

  while (
    progress &&
    pcHardware.some((hardware) => (state.owned.hardware[hardware.id] ?? 0) < hardware.maxLevel)
  ) {
    progress = false;

    for (const hardware of pcHardware) {
      if ((state.owned.hardware[hardware.id] ?? 0) >= hardware.maxLevel) {
        continue;
      }

      const result = buyHardware(state, hardware.id);
      if (result.ok) {
        progress = true;
      } else {
        expect(result.reason).toBe("psuTier");
      }
    }
  }

  for (const hardware of pcHardware) {
    expect(state.owned.hardware[hardware.id] ?? 0).toBe(hardware.maxLevel);
  }
}
