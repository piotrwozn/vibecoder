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
});

describe("M10 endless sim", () => {
  it("runs five ITERATION resets without overflowing Big exponents", () => {
    const result = runEndlessSmokeSim(5);

    expect(result.state.prestige.iteration).toBe(5);
    expect(result.state.res.paradox).toBe(31);
    expect(result.maxExponent).toBeLessThan(9e15);
  });
});
