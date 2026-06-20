import { describe, expect, it } from "vitest";

import { runCampaignSim, runEndlessSmokeSim } from "../tools/sim/index.ts";

describe("M9 campaign sim", () => {
  it("runs real strategy-specific ticks instead of a scripted completion", () => {
    const sane = runCampaignSim({ strategy: "sane", hours: 5 });
    const idle = runCampaignSim({ strategy: "idle_only", hours: 5 });

    expect(sane.completeH).toBeUndefined();
    expect(sane.cache.locRate.eq0()).toBe(false);
    expect(sane.state.story.act).toBeGreaterThan(idle.state.story.act);
    expect(sane.state.lifetime.loc.gt(idle.state.lifetime.loc)).toBe(true);
  });

  it("finishes sane 80h inside the target window with all campaign events", () => {
    const result = runCampaignSim({ strategy: "sane", hours: 80 });

    expect(result.completeH).toBeGreaterThanOrEqual(45);
    expect(result.completeH).toBeLessThanOrEqual(70);
    expect(result.missingEvents).toEqual([]);
    expect(result.seenEvents).toBe(73);
  }, 20_000);

  it("finishes maxer 80h without skipping the Act 0 agent event", () => {
    const result = runCampaignSim({ strategy: "maxer", hours: 80 });

    expect(result.completeH).toBeDefined();
    expect(result.missingEvents).toEqual([]);
    expect(result.state.story.seen.has("a0_05_agent")).toBe(true);
    expect(result.seenEvents).toBe(73);
  }, 20_000);

  it("keeps idle-only 80h stable and intentionally incomplete", () => {
    const result = runCampaignSim({ strategy: "idle_only", hours: 80 });

    expect(result.completeH).toBeUndefined();
    expect(result.state.prestige.endingChoice).toBeUndefined();
    expect(result.state.story.act).toBeGreaterThanOrEqual(3);
    expect(Number.isFinite(result.state.lifetime.loc.e)).toBe(true);
    expect(Number.isFinite(result.state.res.money.e)).toBe(true);
  }, 20_000);
});

describe("M10 endless sim", () => {
  it("runs five ITERATION resets without overflowing Big exponents", () => {
    const result = runEndlessSmokeSim(5);

    expect(result.state.prestige.iteration).toBe(5);
    expect(result.state.res.paradox).toBe(31);
    expect(result.maxExponent).toBeLessThan(9e15);
  });
});
