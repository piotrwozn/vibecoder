import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState } from "../src/core/state";
import { C } from "../src/data/constants";
import { REFACTOR_PROJECT } from "../src/data/projects";
import { createDerivedCache, recomputeDerivedCache } from "../src/systems/production";
import {
  ensureProjectBoard,
  getProject,
  getProjectCost,
  getProjectIncomeRate,
  refreshProjectBoard,
  startProject,
  tickProjectIncome,
  tickProjects
} from "../src/systems/projects";

describe("M3 projects and money", () => {
  it("builds and ships Llama Farm Todo for payout and hype without recurring revenue", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    const payout = 75 * 0.45;
    state.res.loc = Big.fromNumber(75);
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

    tickProjects(state, cache, 45);

    expect(state.projects.active).toHaveLength(0);
    expect(state.projects.portfolio).toHaveLength(1);
    expect(state.res.money.toNumber()).toBeCloseTo(payout);
    expect(state.lifetime.money.toNumber()).toBeCloseTo(payout);
    expect(state.projects.portfolio[0]?.revenue.eq0()).toBe(true);
    expect(state.res.hype).toBeCloseTo(1.15);

    tickProjectIncome(state, cache, 10);

    expect(state.res.money.toNumber()).toBeCloseTo(payout);
    expect(getProjectIncomeRate(state, cache).eq0()).toBe(true);

    state.projects.portfolio[0] = {
      ...state.projects.portfolio[0]!,
      bugged: true,
      revenue: Big.fromNumber(999)
    };
    expect(getProjectIncomeRate(state, cache).eq0()).toBe(true);
  });

  it("builds and ships a normal E1 project into payout, portfolio revenue, and hype", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    const payout = 1_200 * 0.55;
    state.res.loc = Big.fromNumber(1_200);
    recomputeDerivedCache(state, cache);

    const started = startProject(state, "p_landing", cache);
    expect(started.ok).toBe(true);
    expect(state.res.loc.eq0()).toBe(true);

    tickProjects(state, cache, 75);

    expect(state.projects.active).toHaveLength(0);
    expect(state.projects.portfolio).toHaveLength(1);
    expect(state.res.money.toNumber()).toBeCloseTo(payout);
    expect(state.lifetime.money.toNumber()).toBeCloseTo(payout);
    expect(state.projects.portfolio[0]?.revenue.toNumber()).toBeCloseTo(payout * C.REVENUE_RATIO);
    expect(state.res.hype).toBeCloseTo(1.15);

    tickProjectIncome(state, cache, 10);

    expect(state.res.money.toNumber()).toBeCloseTo(payout + payout * C.REVENUE_RATIO * 1.15 * 10);
    expect(getProjectIncomeRate(state, cache).toNumber()).toBeCloseTo(
      payout * C.REVENUE_RATIO * 1.15
    );

    state.projects.portfolio[0] = { ...state.projects.portfolio[0]!, bugged: true };
    expect(getProjectIncomeRate(state, cache).toNumber()).toBeCloseTo(
      payout * C.REVENUE_RATIO * C.BUG_PENALTY * 1.15
    );
  });

  it("grants first-three RP rewards from Scope Creep Special", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    recomputeDerivedCache(state, cache);

    for (let i = 0; i < 4; i += 1) {
      state.res.loc = Big.fromNumber(100_000);
      expect(startProject(state, "p_scope_creep", cache).ok).toBe(true);
      tickProjects(state, cache, 120);
    }

    expect(state.res.rp).toBe(3);
  });

  it("allows only one active project build at a time", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.res.loc = Big.fromNumber(10_000);
    recomputeDerivedCache(state, cache);

    const started = startProject(state, "p_llama_todo", cache);
    const locAfterFirstStart = state.res.loc.copy();
    const second = startProject(state, "p_landing", cache);
    const refactor = startProject(state, REFACTOR_PROJECT.id, cache);

    expect(started.ok).toBe(true);
    expect(second).toMatchObject({ ok: false, reason: "busy" });
    expect(refactor).toMatchObject({ ok: false, reason: "busy" });
    expect(state.projects.active).toHaveLength(1);
    expect(state.res.loc.eq(locAfterFirstStart)).toBe(true);

    tickProjects(state, cache, 45);

    expect(startProject(state, "p_landing", cache).ok).toBe(true);
  });

  it("increases standard project costs after each started project", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    const llama = getProject("p_llama_todo");
    const landing = getProject("p_landing");

    expect(llama).not.toBeUndefined();
    expect(landing).not.toBeUndefined();
    recomputeDerivedCache(state, cache);

    expect(getProjectCost(llama!, cache, state).toNumber()).toBe(75);
    expect(getProjectCost(landing!, cache, state).toNumber()).toBe(1_200);

    state.res.loc = Big.fromNumber(10_000);
    expect(startProject(state, "p_llama_todo", cache).ok).toBe(true);

    expect(getProjectCost(llama!, cache, state).toNumber()).toBeCloseTo(
      75 * (1 + C.REVENUE_RATIO) * (1 + C.FLOW_GAIN)
    );
    expect(getProjectCost(landing!, cache, state).toNumber()).toBeCloseTo(
      1_200 * (1 + C.REVENUE_RATIO)
    );
    expect(getProjectCost(REFACTOR_PROJECT, cache, state).toNumber()).toBeCloseTo(
      cache.locRate.toNumber() * C.REFACTOR_COST_SECONDS
    );
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
