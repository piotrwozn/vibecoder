import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { deserializeGameState, serializeGameState } from "../src/core/save";
import { createDefaultGameState } from "../src/core/state";
import { PRESTIGE } from "../src/data/constants";
import { GENERATORS } from "../src/data/generators";
import { getBugSpawnedAtStatKey } from "../src/systems/debt";
import {
  buyInsightNode,
  calculateAvailableInsightGain,
  calculateRewriteRequirement,
  calculateTotalInsightPotential,
  createRewritePreview,
  getInsightTree,
  getInsightNodeState,
  isRewriteBooting,
  performRewrite
} from "../src/systems/prestige";
import {
  createDerivedCache,
  getGeneratorCost,
  recomputeDerivedCache
} from "../src/systems/production";

describe("M8 prestige REWRITE", () => {
  it("calculates Insight as unclaimed gain since the last EXIT", () => {
    const state = createDefaultGameState();
    state.lifetime.locSinceExit = getInsightGainThreshold(8);

    expect(calculateTotalInsightPotential(state)).toBe(8);
    expect(calculateAvailableInsightGain(state)).toBe(8);

    state.lifetime.insightSinceExit = 5;
    state.prestige.rewrites = 1;

    expect(calculateAvailableInsightGain(state)).toBe(3);
    expect(calculateRewriteRequirement(state)).toBe(1.25);
  });

  it("matches the REWRITE forecast with the actual selective reset", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.lifetime.locSinceExit = getInsightGainThreshold(PRESTIGE.REWRITE_MIN_FIRST);
    state.res.loc = Big.fromNumber(12_345);
    state.res.money = Big.fromNumber(10_000);
    state.res.debt = Big.fromNumber(999);
    state.res.hype = 4;
    state.owned.generators.g_autocomplete = 10;
    state.owned.generators.g_parrot = 2;
    state.owned.hardware.h_gaming_rig = 2;
    state.owned.upgrades.add("u_better_prompts");
    state.owned.research.add("r_t1");
    state.owned.insightNodes.add("i_v1");
    state.owned.insightNodes.add("i_c1");
    state.owned.insightNodes.add("i_c4");
    state.automation.autoPrompt = { enabled: true };
    state.projects.active.push({
      id: "p_landing.1",
      buildS: 20,
      cost: Big.fromNumber(300),
      elapsedS: 5,
      payout: Big.fromNumber(360),
      projectId: "p_landing",
      revenue: Big.fromNumber(1.44)
    });
    state.projects.portfolio.push({
      id: "p_llama_todo.1",
      bugged: true,
      projectId: "p_llama_todo",
      revenue: Big.fromNumber(0.1),
      shippedAtS: 10
    });
    state.stats[getBugSpawnedAtStatKey("p_llama_todo.1")] = 123;
    state.story.seen.add("a1_08_rewrite_intro");

    recomputeDerivedCache(state, cache);
    const preview = createRewritePreview(state);
    const result = performRewrite(state, cache);

    expect(result.ok).toBe(true);
    expect(result.gain).toBe(preview.availableInsight);
    expect(preview.lostLoc.toNumber()).toBeCloseTo(12_345);
    expect(preview.lostMoney.toNumber()).toBeCloseTo(10_000);
    expect(preview.lostAgents).toBe(12);
    expect(preview.lostHardware).toBe(2);
    expect(preview.lostProducts).toBe(1);
    expect(preview.lostUpgrades).toBe(1);
    expect(preview.startMoney.toNumber()).toBeCloseTo(600);

    expect(state.prestige.rewrites).toBe(1);
    expect(state.res.insight.toNumber()).toBe(PRESTIGE.REWRITE_MIN_FIRST);
    expect(state.lifetime.insightSinceExit).toBe(PRESTIGE.REWRITE_MIN_FIRST);
    expect(state.res.loc.eq0()).toBe(true);
    expect(state.res.money.toNumber()).toBeCloseTo(preview.startMoney.toNumber());
    expect(state.res.debt.eq0()).toBe(true);
    expect(state.res.hype).toBe(1);
    expect(state.owned.generators.g_autocomplete).toBe(5);
    expect(state.owned.generators.g_parrot).toBe(0);
    expect(state.owned.hardware).toEqual({});
    expect(state.res.computeCap).toBe(6);
    expect(state.projects.active).toHaveLength(0);
    expect(state.projects.portfolio).toHaveLength(0);
    expect(state.stats[getBugSpawnedAtStatKey("p_llama_todo.1")]).toBeUndefined();
    expect(state.projects.board.length).toBeGreaterThan(0);
    expect(state.owned.upgrades.size).toBe(0);
    expect(state.owned.research.has("r_t1")).toBe(true);
    expect(state.automation).toEqual({});
    expect(state.story.seen.has("a1_08_rewrite_intro")).toBe(true);
    expect(isRewriteBooting(state)).toBe(true);
  });

  it("buys Insight nodes in order and applies their DerivedCache effects", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    const autocomplete = GENERATORS[0];

    if (autocomplete === undefined) {
      throw new Error("Missing autocomplete generator");
    }

    state.res.insight = Big.fromNumber(35);
    state.owned.generators.g_autocomplete = 10;
    recomputeDerivedCache(state, cache);

    expect(getInsightNodeState(state, expectInsightNode("i_v2"))).toBe("locked");
    expect(buyInsightNode(state, cache, "i_v1").ok).toBe(true);
    expect(buyInsightNode(state, cache, "i_v2").ok).toBe(true);
    expect(buyInsightNode(state, cache, "i_v3").ok).toBe(true);

    recomputeDerivedCache(state, cache);

    expect(state.res.insight.eq0()).toBe(true);
    expect(cache.multipliers.insightNodes).toBeCloseTo(1.25);
    expect(cache.costs.generatorMultiplier).toBeCloseTo(0.85);
    expect(cache.locRate.toNumber()).toBeCloseTo(12.5);
    expect(cache.generatorEntries.g_autocomplete?.cost1.toNumber()).toBeCloseTo(
      getGeneratorCost(autocomplete, 10, 1, 0.85).toNumber()
    );
  });

  it("blocks REWRITE below the first and repeat thresholds", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();

    state.lifetime.locSinceExit = getInsightGainThreshold(PRESTIGE.REWRITE_MIN_FIRST - 1);
    expect(performRewrite(state, cache)).toMatchObject({ ok: false, reason: "threshold" });
    expect(state.prestige.rewrites).toBe(0);

    state.prestige.rewrites = 1;
    state.lifetime.insightSinceExit = 20;
    state.lifetime.locSinceExit = getInsightGainThreshold(24);
    expect(calculateRewriteRequirement(state)).toBe(5);
    expect(performRewrite(state, cache)).toMatchObject({ ok: false, reason: "threshold" });
    expect(state.prestige.rewrites).toBe(1);
  });

  it("keeps automation through REWRITE only with the core node", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.lifetime.locSinceExit = getInsightGainThreshold(PRESTIGE.REWRITE_MIN_FIRST);
    state.owned.insightNodes.add("i_v1");
    state.owned.insightNodes.add("i_v2");
    state.owned.insightNodes.add("i_v3");
    state.owned.insightNodes.add("i_core_automation");
    state.automation.autoPrompt = { enabled: true };

    const result = performRewrite(state, cache);

    expect(result.ok).toBe(true);
    expect(state.automation.autoPrompt?.enabled).toBe(true);
  });

  it("round-trips a post-REWRITE save without repair", () => {
    const state = createDefaultGameState(1_000);
    const cache = createDerivedCache();
    state.lifetime.locSinceExit = getInsightGainThreshold(PRESTIGE.REWRITE_MIN_FIRST);
    state.owned.insightNodes.add("i_v1");

    expect(performRewrite(state, cache).ok).toBe(true);

    const result = deserializeGameState(serializeGameState(state), {
      edition: "demo",
      nowMs: 2_000
    });

    expect(result.repaired).toBe(false);
    expect(result.state.prestige.rewrites).toBe(1);
    expect(result.state.res.insight.toNumber()).toBe(PRESTIGE.REWRITE_MIN_FIRST);
    expect(result.state.owned.insightNodes.has("i_v1")).toBe(true);
    expect(result.state.owned.generators.g_autocomplete).toBe(5);
    expect(isRewriteBooting(result.state)).toBe(true);
  });
});

function getInsightGainThreshold(gain: number): Big {
  return Big.mul(
    Big.fromNumber(PRESTIGE.INSIGHT_DIV),
    Big.powNumber(gain + 0.01, 1 / PRESTIGE.INSIGHT_EXP)
  );
}

function expectInsightNode(id: string) {
  const definition = getInsightTree().find((entry) => entry.id === id);

  if (definition === undefined) {
    throw new Error(`Missing test Insight node: ${id}`);
  }

  return definition;
}
