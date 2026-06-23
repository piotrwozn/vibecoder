import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState } from "../src/core/state";
import { PROJECT_CHAINS } from "../src/data/project-chains";
import { addBuildMomentum, getBuildMomentum, tickBuildMomentum } from "../src/systems/momentum";
import {
  getProjectChainCompletedFlag,
  getProjectChainEffects,
  getProjectChainSummary,
  recordProjectChainProgress
} from "../src/systems/project-chains";
import { createDerivedCache, recomputeDerivedCache } from "../src/systems/production";
import { startProject, tickProjects } from "../src/systems/projects";

describe("build momentum and project chains", () => {
  it("turns recent progress into a decaying production bonus", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.story.act = 4;
    state.owned.generators.g_autocomplete = 1;
    recomputeDerivedCache(state, cache);
    const baseline = cache.locRate.toNumber();

    addBuildMomentum(state, 50);
    recomputeDerivedCache(state, cache);
    const boosted = cache.locRate.toNumber();

    expect(getBuildMomentum(state)).toBe(50);
    expect(boosted).toBeGreaterThan(baseline);

    expect(tickBuildMomentum(state, 3600)).toBe(true);
    recomputeDerivedCache(state, cache);

    expect(getBuildMomentum(state)).toBeLessThan(50);
    expect(cache.locRate.toNumber()).toBeLessThan(boosted);
  });

  it("adds momentum when a normal project ships", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.res.loc = Big.fromNumber(100);
    recomputeDerivedCache(state, cache);

    expect(startProject(state, "p_llama_todo", cache).ok).toBe(true);
    tickProjects(state, cache, 45);

    expect(state.stats["project.p_llama_todo.shipped"]).toBe(1);
    expect(getBuildMomentum(state)).toBeGreaterThan(0);
  });

  it("claims a project chain once every project in it shipped at least once", () => {
    const state = createDefaultGameState();
    const chain = PROJECT_CHAINS[0];

    if (chain === undefined) {
      throw new Error("Missing project chain fixture");
    }

    for (const projectId of chain.projectIds.slice(0, -1)) {
      state.stats[`project.${projectId}.shipped`] = 1;
    }

    expect(getProjectChainSummary(state).next?.progress).toBeCloseTo(2 / 3);

    const lastProjectId = chain.projectIds[chain.projectIds.length - 1];
    if (lastProjectId === undefined) {
      throw new Error("Missing project chain project fixture");
    }

    state.stats[`project.${lastProjectId}.shipped`] = 1;
    const completed = recordProjectChainProgress(state, lastProjectId);

    expect(completed.map((entry) => entry.id)).toEqual([chain.id]);
    expect(state.story.flags.has(getProjectChainCompletedFlag(chain.id))).toBe(true);
    expect(getBuildMomentum(state)).toBeGreaterThan(0);
    expect(getProjectChainSummary(state).completedChains).toBe(1);
  });

  it("applies claimed chain rewards through the derived cache", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    const chain = PROJECT_CHAINS.find((entry) => entry.reward.locMultiplier !== undefined);

    if (chain === undefined) {
      throw new Error("Missing LoC project chain fixture");
    }

    state.owned.generators.g_autocomplete = 1;
    state.story.act = 4;
    recomputeDerivedCache(state, cache);
    const baseline = cache.locRate.toNumber();

    state.story.flags.add(getProjectChainCompletedFlag(chain.id));
    recomputeDerivedCache(state, cache);

    const effects = getProjectChainEffects(state);
    expect(effects.locMultiplier).toBeGreaterThan(1);
    expect(effects.payoutMultiplier).toBeGreaterThan(1);
    expect(cache.multipliers.projectChains).toBeGreaterThan(1);
    expect(cache.project.payoutMultiplier).toBeGreaterThan(1);
    expect(cache.locRate.toNumber()).toBeGreaterThan(baseline);
  });
});
