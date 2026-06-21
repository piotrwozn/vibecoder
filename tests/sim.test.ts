import { describe, expect, it } from "vitest";

import { runCampaignSim, runEndlessSmokeSim } from "../tools/sim/index.ts";

describe("M9 campaign sim", () => {
  it("runs real strategy-specific ticks instead of a scripted completion", () => {
    const sane = runCampaignSim({ strategy: "sane", hours: 5 });
    const idle = runCampaignSim({ strategy: "idle_only", hours: 5 });

    expect(sane.completeH).toBeUndefined();
    expect(sane.cache.locRate.eq0()).toBe(false);
    expect(sane.state.story.act).toBeGreaterThanOrEqual(idle.state.story.act);
    expect(sane.state.lifetime.loc.gt(idle.state.lifetime.loc)).toBe(true);
  });

  it("keeps the slower sane 100h route stable without reaching OMEGA", () => {
    const result = runCampaignSim({ strategy: "sane", hours: 100 });
    const firstRewrite = result.milestones.find((milestone) => milestone.label === "First REWRITE");
    const act1Finale = result.milestones.find((milestone) => milestone.label === "Act 1 finale");

    expect(firstRewrite?.atH).toBeGreaterThanOrEqual(9);
    expect(act1Finale?.atH).toBeGreaterThanOrEqual(20);
    expect(result.state.story.act).toBeGreaterThanOrEqual(2);
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
    expect(result.seenEvents).toBeGreaterThanOrEqual(30);
    expect(Number.isFinite(result.state.lifetime.loc.e)).toBe(true);
    expect(Number.isFinite(result.state.res.money.e)).toBe(true);
  }, 60_000);

  it("maxer stays stable through 80h without skipping the Act 0 agent event", () => {
    const result = runCampaignSim({ strategy: "maxer", hours: 80 });

    expect(result.omegaCompleteH).toBeUndefined();
    expect(result.state.story.act).toBeGreaterThanOrEqual(2);
    expect(result.state.story.seen.has("a0_05_agent")).toBe(true);
  }, 60_000);

  it("keeps idle-only 100h stable and intentionally incomplete", () => {
    const result = runCampaignSim({ strategy: "idle_only", hours: 100 });

    expect(result.completeH).toBeUndefined();
    expect(result.state.aurora.completed).toBe(false);
    expect(result.state.story.act).toBeGreaterThanOrEqual(2);
    expect(Number.isFinite(result.state.lifetime.loc.e)).toBe(true);
    expect(Number.isFinite(result.state.res.money.e)).toBe(true);
  }, 30_000);
});

describe("M10 endless sim", () => {
  it("runs five ITERATION resets without overflowing Big exponents", () => {
    const result = runEndlessSmokeSim(5);

    expect(result.state.prestige.iteration).toBe(5);
    expect(result.state.res.paradox).toBe(31);
    expect(result.maxExponent).toBeLessThan(9e15);
  }, 30_000);
});
