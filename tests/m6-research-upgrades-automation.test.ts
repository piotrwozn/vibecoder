import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState } from "../src/core/state";
import { C } from "../src/data/constants";
import {
  AUTO_BUY_HARDWARE_ID,
  AUTO_FIX_ID,
  AUTO_PROMPT_ID,
  AUTO_REFACTOR_ID,
  AUTO_REFRESH_PROJECTS_ID,
  AUTO_SHIP_ID,
  getAutoBuyRuleId,
  getAutomationToggles,
  setAutomationEnabled,
  tickAutomation
} from "../src/systems/automation";
import { getBugSpawnedAtStatKey } from "../src/systems/debt";
import { getClickPower } from "../src/systems/prompt";
import {
  createDerivedCache,
  recomputeDerivedCache,
  tickProduction
} from "../src/systems/production";
import { refreshProjectBoard } from "../src/systems/projects";
import { buyResearch } from "../src/systems/research";
import { buyUpgrade } from "../src/systems/upgrades";

describe("M6 research and upgrades", () => {
  it("buys research with RP and applies LoC effects through DerivedCache", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.res.rp = 2;
    state.owned.generators.g_autocomplete = 10;

    recomputeDerivedCache(state, cache);
    expect(cache.locRate.toNumber()).toBeCloseTo(10);

    const result = buyResearch(state, cache, "r_t1");

    expect(result.ok).toBe(true);
    expect(state.res.rp).toBe(0);
    expect(cache.multipliers.research).toBeCloseTo(1.25);
    expect(cache.locRate.toNumber()).toBeCloseTo(12.5);

    tickProduction(state, cache, 1);

    expect(state.res.loc.toNumber()).toBeCloseTo(12.5);
  });

  it("buys upgrades with money and applies click effects through DerivedCache", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.lifetime.loc = Big.fromNumber(50);
    state.res.money = Big.fromNumber(100);

    recomputeDerivedCache(state, cache);

    const result = buyUpgrade(state, cache, "u_better_prompts");

    expect(result.ok).toBe(true);
    expect(state.res.money.eq0()).toBe(true);
    expect(cache.click.multiplier).toBe(2);
    expect(getClickPower(state, cache, 0).toNumber()).toBeCloseTo(2);
  });
});

describe("M6 automation", () => {
  it("runs auto-prompt from cached automation rate", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.owned.research.add("r_a1");
    setAutomationEnabled(state, AUTO_PROMPT_ID, true);

    recomputeDerivedCache(state, cache);
    cache.locRate = Big.fromNumber(100);

    expect(tickAutomation(state, cache, 10)).toBe(true);
    expect(state.res.loc.toNumber()).toBeCloseTo(100 * C.AUTO_PROMPT_LOC_RATE_FRACTION * 10);
  });

  it("auto-buys enabled generator types while keeping 10% cash", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.owned.research.add("r_a1");
    state.owned.research.add("r_a2");
    state.res.money = Big.fromNumber(10_000);
    state.res.computeCap = 100;
    setAutomationEnabled(state, getAutoBuyRuleId("g_autocomplete"), true);
    setAutomationEnabled(state, getAutoBuyRuleId("g_parrot"), true);

    recomputeDerivedCache(state, cache);

    expect(tickAutomation(state, cache, 0.1)).toBe(true);
    expect(state.owned.generators.g_autocomplete).toBeGreaterThan(0);
    expect(state.res.money.gte(Big.fromNumber(10_000 * C.AUTO_BUY_KEEP_CASH_RATIO))).toBe(true);
  });

  it("auto-fixes bugs only after the cached delay", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.owned.research.add("r_a1");
    state.owned.research.add("r_a2");
    state.owned.research.add("r_a3");
    state.projects.portfolio.push({
      id: "p_llama_todo.1",
      bugged: true,
      computeUse: 0,
      deploymentMode: "selfHosted",
      level: 1,
      projectId: "p_llama_todo",
      revenue: Big.fromNumber(1),
      shippedAtS: 0
    });
    state.bugs.push({ productId: "p_llama_todo.1" });
    state.stats[getBugSpawnedAtStatKey("p_llama_todo.1")] = 0;
    setAutomationEnabled(state, AUTO_FIX_ID, true);

    recomputeDerivedCache(state, cache);
    state.meta.playtimeS = C.AUTO_FIX_DELAY_S - 1;

    expect(tickAutomation(state, cache, 0.1)).toBe(false);
    expect(state.bugs).toHaveLength(1);

    state.meta.playtimeS = C.AUTO_FIX_DELAY_S;

    expect(tickAutomation(state, cache, 0.1)).toBe(true);
    expect(state.bugs).toHaveLength(0);
    expect(state.projects.portfolio[0]?.bugged).toBe(false);
  });

  it("exposes late automation toggles when their research unlocks", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    for (const id of [
      "r_a1",
      "r_a2",
      "r_a3",
      "r_a4",
      "r_a5",
      "r_a6",
      "r_a7",
      "r_a8",
      "r_a9",
      "r_a10"
    ]) {
      state.owned.research.add(id);
    }

    recomputeDerivedCache(state, cache);

    const toggles = getAutomationToggles(state, cache);
    expect(toggles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: AUTO_REFRESH_PROJECTS_ID, unlocked: true }),
        expect.objectContaining({ id: AUTO_SHIP_ID, unlocked: true }),
        expect.objectContaining({ id: AUTO_REFACTOR_ID, unlocked: true }),
        expect.objectContaining({ id: AUTO_BUY_HARDWARE_ID, unlocked: true })
      ])
    );
  });

  it("auto-ships the best affordable project by priority", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    for (const id of ["r_a1", "r_a2", "r_a3", "r_a4", "r_a5", "r_a6"]) {
      state.owned.research.add(id);
    }
    state.res.loc = Big.fromNumber(10_000);
    state.projects.prioritySetting = "payout";
    refreshProjectBoard(state);
    setAutomationEnabled(state, AUTO_SHIP_ID, true);
    recomputeDerivedCache(state, cache);

    expect(tickAutomation(state, cache, 1)).toBe(true);
    expect(state.projects.active).toHaveLength(1);
  });

  it("auto-buys affordable hardware upgrades", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    for (const id of [
      "r_a1",
      "r_a2",
      "r_a3",
      "r_a4",
      "r_a5",
      "r_a6",
      "r_a7",
      "r_a8",
      "r_a9",
      "r_a10"
    ]) {
      state.owned.research.add(id);
    }
    state.res.money = Big.fromNumber(1_000);
    setAutomationEnabled(state, AUTO_BUY_HARDWARE_ID, true);
    recomputeDerivedCache(state, cache);

    expect(tickAutomation(state, cache, 1)).toBe(true);
    expect(Object.values(state.owned.hardware).some((level) => level > 0)).toBe(true);
  });
});
