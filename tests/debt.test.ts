import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState, type GameState } from "../src/core/state";
import { C } from "../src/data/constants";
import { calculateDebtD0, calculateDebtEfficiency, fixBug, tickDebt } from "../src/systems/debt";
import { createDerivedCache, recomputeDerivedCache } from "../src/systems/production";

describe("M5 tech debt", () => {
  it("reduces production by the debt efficiency formula", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.owned.generators.g_autocomplete = 10;
    state.res.debt = Big.fromNumber(calculateDebtD0(state));

    recomputeDerivedCache(state, cache);

    const expectedEff = 1 / (1 + 1) ** C.DEBT_EFF_EXP;
    expect(calculateDebtEfficiency(state)).toBeCloseTo(expectedEff);
    expect(cache.multipliers.debt).toBeCloseTo(expectedEff);
    expect(cache.locRate.toNumber()).toBeCloseTo(10 * expectedEff);
  });

  it("grows debt from current LoC rate", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.meta.playtimeS = 1;
    recomputeDerivedCache(state, cache);
    cache.locRate = Big.fromNumber(100);

    tickDebt(state, cache, 1);

    expect(state.res.debt.toNumber()).toBeCloseTo(100 * C.DEBT_FACTOR);
  });

  it("applies QA and refactor daemon passive debt reduction", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.res.debt = Big.fromNumber(1_000);
    state.owned.generators.g_qa_bot = 2;
    state.owned.generators.g_refactor_daemon = 1;
    cache.project.qaMultiplier = 2;

    tickDebt(state, cache, 1);

    expect(state.res.debt.toNumber()).toBeCloseTo(1_000 * (1 - (0.005 * 2 + 0.02) * 2));
  });

  it("spawns and fixes deterministic product bugs", () => {
    const state = createBugFixture(7);
    const twin = createBugFixture(7);
    const cache = createDerivedCache();
    const twinCache = createDerivedCache();
    recomputeDerivedCache(state, cache);
    recomputeDerivedCache(twin, twinCache);

    tickDebt(state, cache, C.BUG_CHECK_INTERVAL);
    tickDebt(twin, twinCache, C.BUG_CHECK_INTERVAL);

    expect(state.bugs).toEqual(twin.bugs);
    expect(state.bugs).toHaveLength(1);
    expect(state.projects.portfolio[0]?.bugged).toBe(true);

    const fixed = fixBug(state, "p_llama_todo.1");

    expect(fixed.ok).toBe(true);
    expect(state.bugs).toHaveLength(0);
    expect(state.projects.portfolio[0]?.bugged).toBe(false);
    expect(state.stats["bugs.fixed"]).toBe(1);
  });
});

function createBugFixture(seed: number): GameState {
  const state = createDefaultGameState();
  state.rngSeed = seed;
  state.meta.playtimeS = C.BUG_CHECK_INTERVAL;
  state.res.debt = Big.fromNumber(calculateDebtD0(state) * 20);
  state.projects.portfolio.push({
    id: "p_llama_todo.1",
    bugged: false,
    projectId: "p_llama_todo",
    revenue: Big.fromNumber(1),
    shippedAtS: 0
  });
  return state;
}
