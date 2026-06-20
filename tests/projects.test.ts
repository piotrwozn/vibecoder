import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState } from "../src/core/state";
import { C } from "../src/data/constants";
import { REFACTOR_PROJECT } from "../src/data/projects";
import { createDerivedCache, recomputeDerivedCache } from "../src/systems/production";
import {
  ensureProjectBoard,
  getProjectIncomeRate,
  refreshProjectBoard,
  startProject,
  tickProjectIncome,
  tickProjects
} from "../src/systems/projects";

describe("M3 projects and money", () => {
  it("builds and ships an E1 project into payout, portfolio revenue, and hype", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.res.loc = Big.fromNumber(25);
    ensureProjectBoard(state);
    recomputeDerivedCache(state, cache);

    expect(state.projects.board.map((offer) => offer.projectId)).toEqual([
      "p_llama_todo",
      "p_landing",
      "p_scope_creep"
    ]);

    const started = startProject(state, "p_llama_todo", cache);
    expect(started.ok).toBe(true);
    expect(state.res.loc.eq0()).toBe(true);

    tickProjects(state, cache, 15);

    expect(state.projects.active).toHaveLength(0);
    expect(state.projects.portfolio).toHaveLength(1);
    expect(state.res.money.toNumber()).toBeCloseTo(25);
    expect(state.lifetime.money.toNumber()).toBeCloseTo(25);
    expect(state.projects.portfolio[0]?.revenue.toNumber()).toBeCloseTo(25 * C.REVENUE_RATIO);
    expect(state.res.hype).toBeCloseTo(1.15);

    tickProjectIncome(state, cache, 10);

    expect(state.res.money.toNumber()).toBeCloseTo(25 + 25 * C.REVENUE_RATIO * 1.15 * 10);
    expect(getProjectIncomeRate(state, cache).toNumber()).toBeCloseTo(25 * C.REVENUE_RATIO * 1.15);

    state.projects.portfolio[0] = { ...state.projects.portfolio[0]!, bugged: true };
    expect(getProjectIncomeRate(state, cache).toNumber()).toBeCloseTo(
      25 * C.REVENUE_RATIO * C.BUG_PENALTY * 1.15
    );
  });

  it("grants first-three RP rewards from Scope Creep Special", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    recomputeDerivedCache(state, cache);

    for (let i = 0; i < 4; i += 1) {
      state.res.loc = Big.fromNumber(2_000);
      expect(startProject(state, "p_scope_creep", cache).ok).toBe(true);
      tickProjects(state, cache, 40);
    }

    expect(state.res.rp).toBe(3);
  });

  it("prioritizes the highest unlocked era on the project board", () => {
    const state = createDefaultGameState();
    state.era = 2;

    refreshProjectBoard(state);

    expect(state.projects.board.slice(0, 2).map((offer) => offer.projectId)).toEqual([
      "p_micro_saas",
      "p_chirper_bot"
    ]);
  });

  it("runs Refactor as a special project that lowers debt", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.res.loc = Big.fromNumber(600);
    state.res.debt = Big.fromNumber(1_000);
    recomputeDerivedCache(state, cache);
    cache.locRate = Big.fromNumber(10);

    const started = startProject(state, REFACTOR_PROJECT.id, cache);
    expect(started.ok).toBe(true);
    expect(state.res.loc.eq0()).toBe(true);

    tickProjects(state, cache, 30);

    expect(state.projects.portfolio).toHaveLength(0);
    expect(state.res.money.eq0()).toBe(true);
    expect(state.res.debt.toNumber()).toBeCloseTo(400);
  });
});
