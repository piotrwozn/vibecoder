import { describe, expect, it } from "vitest";

import { createDefaultGameState } from "../src/core/state";
import { C } from "../src/data/constants";
import { createDerivedCache, recomputeDerivedCache } from "../src/systems/production";
import {
  getClickPower,
  isFlowActive,
  performPromptClick,
  tickPromptFlow
} from "../src/systems/prompt";

describe("M2 PROMPT click and flow", () => {
  it("adds click power from base and passive production", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.owned.generators.g_autocomplete = 10;
    recomputeDerivedCache(state, cache);

    const clickPower = performPromptClick(state, cache, 0);

    expect(clickPower.toNumber()).toBeCloseTo(1.2);
    expect(state.res.loc.toNumber()).toBeCloseTo(1.2);
    expect(state.flow.meter).toBe(C.FLOW_GAIN);
  });

  it("activates flow at 100 percent and multiplies later clicks", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    recomputeDerivedCache(state, cache);

    for (let i = 0; i < 13; i += 1) {
      performPromptClick(state, cache, i);
    }

    expect(isFlowActive(state, 13)).toBe(true);
    expect(state.flow.activeUntil).toBe(42);
    expect(getClickPower(state, cache, 13).toNumber()).toBeCloseTo(C.FLOW_MULT);
  });

  it("decays flow meter only after the idle grace", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    recomputeDerivedCache(state, cache);

    performPromptClick(state, cache, 0);
    expect(tickPromptFlow(state, 1, 4)).toBe(false);
    expect(state.flow.meter).toBe(C.FLOW_GAIN);

    expect(tickPromptFlow(state, 1, 6)).toBe(true);
    expect(state.flow.meter).toBeCloseTo(0);
    expect(tickPromptFlow(state, 1, 7)).toBe(false);
  });

  it("reports flow expiry as a visible state change", () => {
    const state = createDefaultGameState();
    state.flow.activeUntil = 10;

    expect(isFlowActive(state, 9)).toBe(true);
    expect(tickPromptFlow(state, 1, 10)).toBe(true);
    expect(isFlowActive(state, 10)).toBe(false);
  });
});
