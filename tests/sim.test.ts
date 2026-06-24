import { describe, expect, it } from "vitest";

import {
  readArgs,
  runCampaignSim,
  runEndlessSmokeSim,
  SIM_FIRST_EXIT_MIN_EQUITY_GAIN
} from "../tools/sim/index.ts";

describe("M9 campaign sim", () => {
  it("uses the plan floor for first EXIT equity in strategy decisions", () => {
    expect(SIM_FIRST_EXIT_MIN_EQUITY_GAIN).toBe(3);
  });

  it("runs real strategy-specific ticks instead of a scripted completion", () => {
    const sane = runCampaignSim({ strategy: "sane", hours: 5 });
    const idle = runCampaignSim({ strategy: "idle_only", hours: 5 });

    expect(sane.completeH).toBeUndefined();
    expect(sane.cache.locRate.eq0()).toBe(false);
    expect(sane.state.stats["stats.locRate.sampleCount"]).toBeGreaterThan(0);
    expect(sane.state.story.act).toBeGreaterThanOrEqual(idle.state.story.act);
    expect(sane.state.lifetime.loc.gt(idle.state.lifetime.loc)).toBe(true);
  });

  it("rejects invalid CLI arguments instead of silently running defaults", () => {
    expect(() => readArgs(["--strategy", "definitely-not-a-strategy"])).toThrow("unknown strategy");
    expect(() => readArgs(["--hours", "-1", "--strategy", "sane"])).toThrow(
      "--hours must be a positive number"
    );
    expect(() => readArgs(["--endless-iterations", "nope"])).toThrow(
      "--endless-iterations must be a positive integer"
    );
  });

  it("keeps the sane 100h route stable under rotating capped project offers", () => {
    const result = runCampaignSim({ strategy: "sane", hours: 100 });
    const firstRewrite = result.milestones.find((milestone) => milestone.label === "First REWRITE");
    const act1Finale = result.milestones.find((milestone) => milestone.label === "Act 1 finale");
    const act2Finale = result.milestones.find((milestone) => milestone.label === "Act 2 finale");
    const act3Finale = result.milestones.find((milestone) => milestone.label === "Act 3 finale");
    const firstExit = result.milestones.find((milestone) => milestone.label === "First EXIT");

    expect(firstRewrite?.atH).toBeGreaterThanOrEqual(3);
    expect(firstRewrite?.atH).toBeLessThanOrEqual(12);
    expect(act1Finale?.atH).toBeLessThanOrEqual(15);
    expect(act2Finale?.atH).toBeGreaterThanOrEqual(20);
    expect(act2Finale?.atH).toBeLessThanOrEqual(45);
    expect(firstExit).toBeUndefined();
    expect(act3Finale).toBeUndefined();
    expect(result.state.story.act).toBe(3);
    expect(result.omegaCompleteH).toBeUndefined();
    expect(result.completeH).toBeUndefined();
    expect(result.state.aurora.unlocked).toBe(false);
  }, 60_000);

  it("keeps sane 100h before Aurora while preserving finite resources", () => {
    const result = runCampaignSim({ strategy: "sane", hours: 100 });

    expect(result.omegaCompleteH).toBeUndefined();
    expect(result.auroraCompleteH).toBeUndefined();
    expect(result.completeH).toBeUndefined();
    expect(result.state.aurora.completed).toBe(false);
    expect(result.seenEvents).toBeGreaterThanOrEqual(40);
    expect(Number.isFinite(result.state.lifetime.loc.e)).toBe(true);
    expect(Number.isFinite(result.state.res.money.e)).toBe(true);
  }, 60_000);

  it("maxer stays stable through 80h without skipping the Act 0 agent event", () => {
    const result = runCampaignSim({ strategy: "maxer", hours: 80 });

    expect(result.omegaCompleteH).toBeUndefined();
    expect(result.state.story.act).toBeGreaterThanOrEqual(3);
    expect(result.seenEvents).toBeGreaterThanOrEqual(40);
    expect(result.state.story.seen.has("a0_05_agent")).toBe(true);
  }, 60_000);

  it("keeps idle-only 100h stable and intentionally incomplete", () => {
    const result = runCampaignSim({ strategy: "idle_only", hours: 100 });

    expect(result.completeH).toBeUndefined();
    expect(result.state.aurora.completed).toBe(false);
    expect(result.state.story.act).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(result.state.lifetime.loc.e)).toBe(true);
    expect(Number.isFinite(result.state.res.money.e)).toBe(true);
  }, 30_000);

  it("keeps expanded player profiles on real simulation paths", () => {
    for (const strategy of ["active", "casual", "offline-heavy", "story-rush"] as const) {
      const result = runCampaignSim({ strategy, hours: 20 });

      expect(result.state.stats["stats.locRate.sampleCount"]).toBeGreaterThan(0);
      expect(result.state.story.act).toBeGreaterThanOrEqual(1);
      expect(Number.isFinite(result.state.lifetime.loc.e)).toBe(true);
      expect(Number.isFinite(result.state.res.money.e)).toBe(true);
    }
  }, 60_000);
});

describe("M10 endless sim", () => {
  it("runs five ITERATION resets without overflowing Big exponents", () => {
    const result = runEndlessSmokeSim(5);

    expect(result.state.prestige.iteration).toBe(5);
    expect(result.state.res.paradox).toBe(31);
    expect(result.maxExponent).toBeLessThan(9e15);
  }, 30_000);
});
