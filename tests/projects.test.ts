import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createEventBus } from "../src/core/bus";
import { createDefaultGameState } from "../src/core/state";
import {
  createViewInvalidation,
  flushViewInvalidation,
  markResourceEvent
} from "../src/core/view-invalidation";
import { C } from "../src/data/constants";
import {
  PROJECT_MAX_LEVEL,
  PROJECT_REVENUE_LEVEL_BONUS,
  REFACTOR_PROJECT
} from "../src/data/projects";
import { createDerivedCache, recomputeDerivedCache } from "../src/systems/production";
import {
  ensureProjectBoard,
  getProject,
  getProjectCost,
  getProjectIncomeRate,
  getProjectMaxLevel,
  getVisibleProjectOffers,
  getProductRevenue,
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

  it("starts a project when current LoC exactly matches the computed cost", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    const project = getProject("p_landing");

    expect(project).not.toBeUndefined();
    recomputeDerivedCache(state, cache);
    const cost = getProjectCost(project!, cache, state);
    state.res.loc = cost.copy();

    const started = startProject(state, project!.id, cache);

    expect(started.ok).toBe(true);
    expect(started.cost.eq(cost)).toBe(true);
    expect(state.res.loc.eq0()).toBe(true);
    expect(state.projects.active).toHaveLength(1);
  });

  it("flushes a project start action without waiting for the render loop", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    const bus = createEventBus();
    const invalidation = createViewInvalidation(false);
    const project = getProject("p_landing");
    let viewUpdates = 0;

    expect(project).not.toBeUndefined();
    recomputeDerivedCache(state, cache);
    state.res.loc = getProjectCost(project!, cache, state);
    bus.on("res:changed", (resource) => {
      markResourceEvent(invalidation, resource);
    });

    const result = startProject(state, project!.id, cache, bus);
    invalidation.markVisibleChanged(result.ok);

    const flushed = flushViewInvalidation(invalidation, {
      recomputeCache(): void {
        recomputeDerivedCache(state, cache);
      },
      updateView(): void {
        viewUpdates += 1;
      }
    });

    expect(result.ok).toBe(true);
    expect(flushed).toEqual({ cache: false, view: true });
    expect(viewUpdates).toBe(1);
    expect(state.res.loc.eq0()).toBe(true);
    expect(state.projects.active).toHaveLength(1);
  });

  it("upgrades an existing standard project without paying the launch payout again", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    const payout = 1_200 * 0.55;
    const baseRevenue = payout * C.REVENUE_RATIO;
    state.res.loc = Big.fromNumber(1_000_000);
    recomputeDerivedCache(state, cache);

    expect(startProject(state, "p_landing", cache).ok).toBe(true);
    tickProjects(state, cache, 75);

    expect(state.projects.portfolio).toHaveLength(1);
    expect(state.projects.portfolio[0]?.level).toBe(1);
    expect(state.projects.portfolio[0]?.revenue.toNumber()).toBeCloseTo(baseRevenue);
    expect(state.res.money.toNumber()).toBeCloseTo(payout);
    expect(state.lifetime.money.toNumber()).toBeCloseTo(payout);

    state.res.hype = 0;
    state.res.loc = Big.fromNumber(1_000_000);
    expect(startProject(state, "p_landing", cache).ok).toBe(true);
    tickProjects(state, cache, 75);

    expect(state.projects.portfolio).toHaveLength(1);
    expect(state.projects.portfolio[0]?.level).toBe(2);
    expect(state.projects.portfolio[0]?.revenue.toNumber()).toBeCloseTo(
      baseRevenue * (1 + PROJECT_REVENUE_LEVEL_BONUS)
    );
    expect(state.res.money.toNumber()).toBeCloseTo(payout);
    expect(state.lifetime.money.toNumber()).toBeCloseTo(payout);
  });

  it("blocks fresh project instances after the previous one reaches max level", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    const project = getProject("p_landing");

    expect(project).not.toBeUndefined();
    state.res.loc = Big.fromNumber(1_000_000);
    state.projects.portfolio.push({
      id: "p_landing.1",
      bugged: false,
      level: getProjectMaxLevel(project!),
      projectId: "p_landing",
      revenue: Big.zero(),
      shippedAtS: 0
    });
    recomputeDerivedCache(state, cache);

    const result = startProject(state, "p_landing", cache);

    expect(result).toMatchObject({ ok: false, reason: "maxLevel" });
    expect(state.projects.active).toHaveLength(0);
    expect(state.projects.portfolio).toHaveLength(1);
    expect(state.projects.portfolio[0]?.level).toBe(getProjectMaxLevel(project!));
    expect(state.res.money.eq0()).toBe(true);
  });

  it("replaces a visible project offer after that project reaches max level", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    const project = getProject("p_micro_saas");

    expect(project).not.toBeUndefined();
    state.era = 2;
    state.res.loc = Big.fromNumber(1_000_000_000);
    state.projects.portfolio.push({
      id: "p_micro_saas.1",
      bugged: false,
      level: getProjectMaxLevel(project!) - 1,
      projectId: "p_micro_saas",
      revenue: Big.one(),
      shippedAtS: 0
    });
    refreshProjectBoard(state);
    recomputeDerivedCache(state, cache);

    expect(getVisibleProjectOffers(state, cache).map((offer) => offer.projectId)).toEqual([
      "p_micro_saas",
      "p_chirper_bot",
      "p_llama_todo"
    ]);
    expect(startProject(state, "p_micro_saas", cache).ok).toBe(true);

    tickProjects(state, cache, project!.buildS);

    expect(state.projects.portfolio[0]?.level).toBe(getProjectMaxLevel(project!));
    expect(getVisibleProjectOffers(state, cache).map((offer) => offer.projectId)).toEqual([
      "p_chirper_bot",
      "p_llama_todo",
      "p_landing"
    ]);
  });

  it("keeps portfolio income scaling in Big space past Number.MAX_VALUE prestige", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.res.hype = 2;
    state.res.insight = Big.fromLog10(500);
    state.projects.portfolio.push({
      id: "p_landing.1",
      bugged: false,
      level: 1,
      projectId: "p_landing",
      revenue: Big.one(),
      shippedAtS: 0
    });

    recomputeDerivedCache(state, cache);

    const income = getProjectIncomeRate(state, cache);

    expect(cache.multipliers.prestige).toBe(Number.MAX_VALUE);
    expect(cache.multipliers.prestigeBig.e).toBeGreaterThan(308);
    expect(income.e).toBeGreaterThan(308);
    expect(income.log10()).toBeCloseTo(
      cache.multipliers.prestigeBig.log10() + Math.log10(state.res.hype)
    );
  });

  it("uses the same hype, prestige, and bug penalty for product rows and total income", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.res.hype = 2;
    state.res.insight = Big.fromNumber(15);
    state.projects.portfolio.push(
      {
        id: "p_landing.1",
        bugged: false,
        level: 1,
        projectId: "p_landing",
        revenue: Big.fromNumber(10),
        shippedAtS: 0
      },
      {
        id: "p_landing.2",
        bugged: true,
        level: 1,
        projectId: "p_landing",
        revenue: Big.fromNumber(10),
        shippedAtS: 0
      }
    );

    recomputeDerivedCache(state, cache);

    const rowTotal = state.projects.portfolio.reduce(
      (sum, product) => Big.add(sum, getProductRevenue(product, cache, state.res.hype)),
      Big.zero()
    );

    expect(rowTotal.toNumber()).toBeCloseTo(getProjectIncomeRate(state, cache).toNumber());
    expect(
      getProductRevenue(state.projects.portfolio[1]!, cache, state.res.hype).toNumber()
    ).toBeCloseTo(
      getProductRevenue(state.projects.portfolio[0]!, cache, state.res.hype).toNumber() *
        C.BUG_PENALTY
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

  it("blocks standard projects that already have a max-level product", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.res.loc = Big.from("1e12");
    state.projects.portfolio.push({
      id: "p_landing.1",
      bugged: false,
      level: PROJECT_MAX_LEVEL,
      projectId: "p_landing",
      revenue: Big.fromNumber(10),
      shippedAtS: 0
    });
    recomputeDerivedCache(state, cache);

    const beforeLoc = state.res.loc.copy();
    const result = startProject(state, "p_landing", cache);

    expect(result).toMatchObject({ ok: false, reason: "maxLevel" });
    expect(state.res.loc.toString()).toBe(beforeLoc.toString());
    expect(state.projects.active).toHaveLength(0);
    expect(state.projects.portfolio).toHaveLength(1);
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

  it("looks up project definitions by id including special refactor projects", () => {
    expect(getProject("p_landing")?.id).toBe("p_landing");
    expect(getProject(REFACTOR_PROJECT.id)).toBe(REFACTOR_PROJECT);
    expect(getProject("missing")).toBeUndefined();
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
    expect(state.stats["projects.started"]).toBeUndefined();
    expect(state.stats[`project.started.${REFACTOR_PROJECT.id}`]).toBeUndefined();

    tickProjects(state, cache, 30);

    expect(state.projects.portfolio).toHaveLength(0);
    expect(state.res.money.eq0()).toBe(true);
    expect(state.res.debt.toNumber()).toBeCloseTo(400);
  });
});
