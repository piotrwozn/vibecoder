import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState } from "../src/core/state";
import { OMEGA } from "../src/data/constants";
import {
  createDerivedCache,
  recomputeDerivedCache,
  type DerivedCache
} from "../src/systems/production";
import {
  createOmegaReadinessDiagnostics,
  createProgressDiagnostics
} from "../src/systems/progress";
import { startProject } from "../src/systems/projects";

function setup(): {
  readonly cache: DerivedCache;
  readonly state: ReturnType<typeof createDefaultGameState>;
} {
  const state = createDefaultGameState(0, "full", 1);
  const cache = createDerivedCache();
  recomputeDerivedCache(state, cache);
  return { cache, state };
}

describe("progress diagnostics", () => {
  it("points a fresh run toward the first project and its LoC bottleneck", () => {
    const { cache, state } = setup();

    const progress = createProgressDiagnostics(state, cache);

    expect(progress.nextGoal).toEqual({ kind: "startProject", targetId: "p_llama_todo" });
    expect(progress.bottleneck).toEqual({ kind: "loc", targetId: "p_llama_todo" });
  });

  it("clears the project bottleneck once the first offer is affordable", () => {
    const { cache, state } = setup();
    state.res.loc = Big.fromNumber(100);

    const progress = createProgressDiagnostics(state, cache);

    expect(progress.nextGoal).toEqual({ kind: "startProject", targetId: "p_llama_todo" });
    expect(progress.bottleneck).toEqual({ kind: "none" });
  });

  it("waits on active builds before suggesting more purchases", () => {
    const { cache, state } = setup();
    state.res.loc = Big.fromNumber(100);

    expect(startProject(state, "p_llama_todo", cache).ok).toBe(true);

    const progress = createProgressDiagnostics(state, cache);

    expect(progress.nextGoal).toEqual({ kind: "shipProject", targetId: "p_llama_todo" });
    expect(progress.bottleneck).toEqual({ kind: "project", targetId: "p_llama_todo" });
  });

  it("identifies compute walls for affordable agents", () => {
    const { cache, state } = setup();
    state.res.money = Big.fromNumber(100);
    state.res.computeCap = 0;
    state.res.computeUsed = 0;
    recomputeDerivedCache(state, cache);

    const progress = createProgressDiagnostics(state, cache);

    expect(progress.nextGoal).toEqual({ kind: "buyGenerator", targetId: "g_autocomplete" });
    expect(progress.bottleneck).toEqual({ kind: "compute", targetId: "g_autocomplete" });
  });

  it("treats OMEGA prestige depth as a recommendation instead of a hard readiness lock", () => {
    const { cache, state } = setup();
    state.story.act = 5;
    state.era = 10;
    state.lifetime.loc = Big.from(OMEGA.LIFETIME_LOC_TARGET);
    state.stats[`project.${OMEGA.PROJECT_ID}.shipped`] = 1;

    const omega = createOmegaReadinessDiagnostics(state, cache);

    expect(omega.ready).toBe(true);
    expect(omega.status).toBe("strong");
    expect(omega.recommendedGoal.kind).toBe("buyInsight");
  });

  it("points late OMEGA progress toward the OMEGA project without requiring REWRITE count", () => {
    const { cache, state } = setup();
    state.story.act = 5;
    state.story.flags.add("omega_requests");
    state.era = 10;
    state.lifetime.loc = Big.from(OMEGA.LIFETIME_LOC_TARGET);

    const progress = createProgressDiagnostics(state, cache);

    expect(progress.nextGoal).toEqual({ kind: "startProject", targetId: OMEGA.PROJECT_ID });
    expect(progress.omega.ready).toBe(false);
  });
});
