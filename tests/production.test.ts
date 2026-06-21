import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState } from "../src/core/state";
import { GENERATORS } from "../src/data/generators";
import {
  buyGenerator,
  createDerivedCache,
  getMilestoneState,
  recomputeDerivedCache,
  tickProduction
} from "../src/systems/production";

describe("M2 production and generator purchases", () => {
  it("applies formula milestones and E1 rates", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.owned.generators.g_autocomplete = 10;

    recomputeDerivedCache(state, cache);

    expect(cache.generatorEntries.g_autocomplete?.milestone.multiplier.toNumber()).toBeCloseTo(2);
    expect(cache.generatorEntries.g_autocomplete?.milestone.nextAt).toBe(25);
    expect(cache.locRate.toNumber()).toBeCloseTo(10);

    tickProduction(state, cache, 0.1);

    expect(state.res.loc.toNumber()).toBeCloseTo(1);
    expect(state.lifetime.loc.toNumber()).toBeCloseTo(1);
  });

  it("buys all three E1 generators with money and unlock prerequisites", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.res.money = Big.fromNumber(25_000);
    state.res.computeCap = 100;
    recomputeDerivedCache(state, cache);

    expect(buyGenerator(state, cache, "g_parrot", 1).ok).toBe(false);
    expect(buyGenerator(state, cache, "g_autocomplete", 10).ok).toBe(true);
    expect(buyGenerator(state, cache, "g_parrot", 1).ok).toBe(true);
    expect(buyGenerator(state, cache, "g_macro", 1).ok).toBe(true);

    expect(state.owned.generators.g_autocomplete).toBe(10);
    expect(state.owned.generators.g_parrot).toBe(1);
    expect(state.owned.generators.g_macro).toBe(1);
    expect(state.res.computeUsed).toBe(15);
    expect(cache.locRate.toNumber()).toBeCloseTo(44);
  });

  it("supports MAX purchases from geometric cost formulas", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    const autocomplete = GENERATORS[0];

    if (autocomplete === undefined) {
      throw new Error("Missing E1 generator fixture");
    }

    state.res.money = Big.bulkCost(autocomplete.baseCost, autocomplete.growth, 0, 3);
    recomputeDerivedCache(state, cache);

    const result = buyGenerator(state, cache, "g_autocomplete", "max");

    expect(result.quantity).toBe(3);
    expect(state.owned.generators.g_autocomplete).toBe(3);
    expect(state.res.money.toNumber()).toBeCloseTo(0, 8);
  });

  it("keeps a 1000-agent production tick below the M2 budget", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.owned.generators.g_autocomplete = 1000;
    recomputeDerivedCache(state, cache);

    const startedAt = performance.now();
    for (let i = 0; i < 1000; i += 1) {
      tickProduction(state, cache, 0.1);
    }
    const averageMs = (performance.now() - startedAt) / 1000;

    expect(averageMs).toBeLessThan(2);
  });
});

describe("M2 generator milestones", () => {
  it("uses fixed thresholds and then steps every 500 after 1000", () => {
    expectMilestone(9, 0, 1, 10);
    expectMilestone(10, 1, 2, 25);
    expectMilestone(1000, 7, 128, 1500);
    expectMilestone(1500, 8, 256, 2000);
  });

  it("keeps endless milestone multipliers in Big without overflowing recompute", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.owned.generators.g_autocomplete = 600_000;

    const milestone = getMilestoneState(600_000);
    recomputeDerivedCache(state, cache);

    expect(milestone.count).toBe(1205);
    expect(milestone.multiplier.e).toBeGreaterThan(308);
    expect(Number.isFinite(milestone.multiplier.m)).toBe(true);
    expect(Number.isFinite(cache.locRate.m)).toBe(true);
    expect(Number.isFinite(cache.locRate.e)).toBe(true);
  });
});

function expectMilestone(owned: number, count: number, multiplier: number, nextAt: number): void {
  const milestone = getMilestoneState(owned);
  expect(milestone.count).toBe(count);
  expect(milestone.multiplier.toNumber()).toBeCloseTo(multiplier);
  expect(milestone.nextAt).toBe(nextAt);
}
