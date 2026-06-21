import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { Big } from "../src/core/bignum";
import { createDefaultGameState } from "../src/core/state";
import { PRESTIGE } from "../src/data/constants";
import { GENERATORS } from "../src/data/generators";
import { PROJECTS } from "../src/data/projects";
import { ECHO_EVENTS } from "../src/data/story/echoes";
import { hasMessage } from "../src/i18n/i18n";
import {
  AUTO_REWRITE_ID,
  getAutoRewriteRuleMultiplier,
  getAutomationToggles,
  setAutomationEnabled,
  tickAutomation
} from "../src/systems/automation";
import {
  applyIterationSoftcap,
  calculateIterationCostMultiplier,
  calculateIterationProductionMultiplier,
  getIterationSoftcapThreshold
} from "../src/systems/iteration";
import {
  ITERATION_HOLD_STAT,
  buyParadoxItem,
  calculateParadoxMultiplier,
  calculateRewriteRequirement,
  createIterationPreview,
  performIteration
} from "../src/systems/prestige";
import { getProjectCost, getProjectPayout, getProjectRevenue } from "../src/systems/projects";
import {
  createDerivedCache,
  getGeneratorCost,
  recomputeDerivedCache
} from "../src/systems/production";
import { tickStory } from "../src/systems/story";

describe("M10 endless ITERATION", () => {
  it("applies the endless softcap and shifts it by iteration", () => {
    const rate = Big.from("1e40");
    const softened = applyIterationSoftcap(rate, 0);

    expect(softened.log10()).toBeCloseTo(39.5);
    expect(applyIterationSoftcap(rate, 1).toString()).toBe(rate.toString());
    expect(getIterationSoftcapThreshold(2).toString()).toBe("1e65");
    expect(calculateIterationCostMultiplier(3).toNumber()).toBeCloseTo(10 ** 2.7);
    expect(calculateIterationProductionMultiplier(2).toNumber()).toBeCloseTo(2 ** 6);
  });

  it("performs the third reset layer and grants 2^k Paradox", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.story.flags.add("iteration_unlocked");
    state.story.flags.add("prestige.runModifier.active.no_click");
    state.prestige.endingChoice = "merge";
    state.prestige.iteration = 2;
    state.res.paradox = 3;
    state.res.equity = 9;
    state.res.insight = Big.fromNumber(100);
    state.res.loc = Big.fromNumber(123);
    state.res.money = Big.fromNumber(456);
    state.owned.equityPerks.add("q_board_seat");
    state.owned.paradoxItems.add("x_theme_glitch");
    state.owned.paradoxItems.add("x_rule_slot_1");
    state.owned.paradoxItems.add("x_start_insight");
    state.automation.autoRewrite = { enabled: true };
    state.prestige.rewrites = 4;
    state.stats[ITERATION_HOLD_STAT] = PRESTIGE.ITER_HOLD_S;
    state.stats["projects.started"] = 3;
    state.stats["project.started.p_landing"] = 2;
    state.stats["stats.locRate.sample.0"] = Big.fromNumber(10);
    state.stats["stats.locRate.sampleCount"] = 1;
    state.stats["stats.locRate.sampleIndex"] = 0;
    state.stats["stats.locRate.lastSampleAt"] = 120;
    cache.locRate = getIterationSoftcapThreshold(2);

    const preview = createIterationPreview(state, cache);
    const result = performIteration(state, cache);

    expect(preview.canIterate).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.gain).toBe(4);
    expect(state.prestige.iteration).toBe(3);
    expect(state.res.paradox).toBe(7);
    expect(state.res.equity).toBe(0);
    expect(state.res.insight.toNumber()).toBe(10);
    expect(state.res.loc.eq0()).toBe(true);
    expect(state.res.money.eq0()).toBe(true);
    expect(state.prestige.rewrites).toBe(4);
    expect(calculateRewriteRequirement(state)).toBe(PRESTIGE.REWRITE_MIN_FIRST);
    expect(state.stats["projects.started"]).toBeUndefined();
    expect(state.stats["project.started.p_landing"]).toBeUndefined();
    expect(state.stats["stats.locRate.sample.0"]).toBeUndefined();
    expect(state.stats["stats.locRate.sampleCount"]).toBeUndefined();
    expect(state.stats["stats.locRate.sampleIndex"]).toBeUndefined();
    expect(state.stats["stats.locRate.lastSampleAt"]).toBeUndefined();
    expect(state.owned.equityPerks.size).toBe(0);
    expect(state.owned.generators.g_autocomplete).toBe(1);
    expect(state.owned.paradoxItems.has("x_theme_glitch")).toBe(true);
    expect(state.automation.autoRewrite?.enabled).toBe(true);
    expect(state.story.flags.has("prestige.runModifier.active.no_click")).toBe(false);
    expect(state.story.act).toBe(9);
    expect(tickAutomation(state, cache, 1)).toBe(false);
    expect(state.prestige.rewrites).toBe(4);
  });

  it("applies iteration cost to agent and project build costs only", () => {
    const baseState = createDefaultGameState();
    const baseCache = createDerivedCache();
    const iterState = createDefaultGameState();
    const iterCache = createDerivedCache();
    const generator = GENERATORS[0]!;
    const project = PROJECTS[0]!;

    iterState.prestige.iteration = 1;
    recomputeDerivedCache(baseState, baseCache);
    recomputeDerivedCache(iterState, iterCache);

    const baseGeneratorCost = getGeneratorCost(
      generator,
      0,
      1,
      baseCache.costs.generatorMultiplier
    );
    const iterGeneratorCost = getGeneratorCost(
      generator,
      0,
      1,
      iterCache.costs.generatorMultiplier
    );
    const baseProjectCost = getProjectCost(project, baseCache);
    const iterProjectCost = getProjectCost(project, iterCache);

    expect(iterGeneratorCost.log10() - baseGeneratorCost.log10()).toBeCloseTo(
      PRESTIGE.ITER_COST_E_PER_K
    );
    expect(iterProjectCost.log10() - baseProjectCost.log10()).toBeCloseTo(
      PRESTIGE.ITER_COST_E_PER_K
    );
    expect(getProjectPayout(project, iterCache).toString()).toBe(
      getProjectPayout(project, baseCache).toString()
    );
    expect(getProjectRevenue(project, iterCache).toString()).toBe(
      getProjectRevenue(project, baseCache).toString()
    );
  });

  it("buys Paradox items, applies engine multiplier, and unlocks echo flags", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.story.flags.add("iteration_unlocked");
    state.prestige.endingChoice = "fork";
    state.res.paradox = 300;

    expect(buyParadoxItem(state, cache, "x_paradox_engine").ok).toBe(true);
    expect(calculateParadoxMultiplier(state, 15)).toBeCloseTo(16 ** 0.55);

    expect(buyParadoxItem(state, cache, "x_echo_01").ok).toBe(true);
    expect(state.story.flags.has("paradox.echo.x_echo_01")).toBe(true);
  });

  it("unlocks auto-REWRITE through Paradox rule slots", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.owned.paradoxItems.add("x_rule_slot_1");
    state.lifetime.locSinceExit = getInsightGainThreshold(PRESTIGE.REWRITE_MIN_FIRST);
    setAutomationEnabled(state, AUTO_REWRITE_ID, true);
    recomputeDerivedCache(state, cache);

    expect(tickAutomation(state, cache, 1)).toBe(true);
    expect(state.prestige.rewrites).toBe(1);
    expect(state.res.insight.toNumber()).toBe(PRESTIGE.REWRITE_MIN_FIRST);
  });

  it("maps each Paradox rule slot to an independent auto-REWRITE rule", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.owned.paradoxItems.add("x_rule_slot_1");
    state.owned.paradoxItems.add("x_rule_slot_2");
    state.owned.paradoxItems.add("x_rule_slot_3");
    recomputeDerivedCache(state, cache);

    const rules = getAutomationToggles(state, cache).filter(
      (rule) => getAutoRewriteRuleMultiplier(rule.id) !== undefined
    );
    const surplusRule = rules.find(
      (rule) => getAutoRewriteRuleMultiplier(rule.id) === PRESTIGE.PARADOX_BASE
    );

    expect(rules).toHaveLength(3);
    expect(rules.map((rule) => rule.unlocked)).toEqual([true, true, true]);
    expect(rules.map((rule) => getAutoRewriteRuleMultiplier(rule.id))).toEqual([1, 2, 4]);
    expect(surplusRule).toBeDefined();

    state.lifetime.locSinceExit = getInsightGainThreshold(PRESTIGE.REWRITE_MIN_FIRST);
    setAutomationEnabled(state, surplusRule!.id, true);
    expect(tickAutomation(state, cache, 1)).toBe(false);
    expect(state.prestige.rewrites).toBe(0);

    state.lifetime.locSinceExit = getInsightGainThreshold(
      PRESTIGE.REWRITE_MIN_FIRST * PRESTIGE.PARADOX_BASE
    );
    expect(tickAutomation(state, cache, 1)).toBe(true);
    expect(state.prestige.rewrites).toBe(1);
    expect(state.res.insight.toNumber()).toBe(PRESTIGE.REWRITE_MIN_FIRST * PRESTIGE.PARADOX_BASE);
  });

  it("keeps auto-REWRITE hot path off rewrite preview allocation", () => {
    const source = readFileSync(new URL("../src/systems/automation.ts", import.meta.url), "utf8");

    expect(source).not.toContain("createRewritePreview");
  });

  it("registers 20 act-9 echoes with i18n text", () => {
    const state = createDefaultGameState(1_000, "full");
    state.story.act = 9;
    state.prestige.iteration = 1;
    state.meta.playtimeS = 1;

    expect(ECHO_EVENTS).toHaveLength(20);
    for (const event of ECHO_EVENTS) {
      expect(hasMessage(event.textKey)).toBe(true);
    }

    tickStory(state, 1);
    expect(state.story.seen.has("x_echo_01")).toBe(true);
  });
});

function getInsightGainThreshold(gain: number): Big {
  return Big.mul(
    Big.fromNumber(PRESTIGE.INSIGHT_DIV),
    Big.powNumber(gain + 0.01, 1 / PRESTIGE.INSIGHT_EXP)
  );
}
