import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState } from "../src/core/state";
import { applyOfflineProgress } from "../src/systems/offline";
import { createDerivedCache, recomputeDerivedCache } from "../src/systems/production";
import { startProject } from "../src/systems/projects";

describe("M4 offline progress", () => {
  it("applies the one-hour closed form exactly from saved rates", () => {
    const state = createDefaultGameState(0);
    state.meta.lastSimTickMs = 0;
    state.res.hype = 4;
    const cache = createDerivedCache();
    state.projects.portfolio.push({
      id: "p_landing.1",
      bugged: false,
      computeUse: 0,
      deploymentMode: "selfHosted",
      level: 1,
      projectId: "p_landing",
      revenue: Big.fromNumber(5),
      shippedAtS: 0
    });
    recomputeDerivedCache(state, cache);
    cache.locRate = Big.fromNumber(2);

    const result = applyOfflineProgress(state, cache, 60 * 60 * 1000);

    expect(result.elapsedS).toBe(60 * 60);
    expect(result.cappedS).toBe(60 * 60);
    expect(state.res.loc.toNumber()).toBe(2 * 60 * 60);
    expect(state.lifetime.loc.toNumber()).toBe(2 * 60 * 60);
    expect(state.res.money.toNumber()).toBe(5 * 60 * 60);
    expect(state.lifetime.money.toNumber()).toBe(5 * 60 * 60);
    expect(state.res.hype).toBeCloseTo(1 + (4 - 1) * Math.exp((-60 * 60) / cache.hype.tauS));
    expect(state.meta.playtimeS).toBe(60 * 60);
    expect(state.meta.lastSimTickMs).toBe(60 * 60 * 1000);
  });

  it("uses the last sim tick, not autosave lastSeen, as the offline anchor", () => {
    const state = createDefaultGameState(0);
    state.meta.lastSimTickMs = 0;
    state.meta.lastSeen = 2 * 60 * 60 * 1000 - 10_000;
    const cache = createDerivedCache();
    cache.locRate = Big.fromNumber(1);

    const result = applyOfflineProgress(state, cache, 2 * 60 * 60 * 1000);

    expect(result.elapsedS).toBe(2 * 60 * 60);
    expect(result.cappedS).toBe(2 * 60 * 60);
  });

  it("clamps in-session wall-clock jumps to the monotonic catch-up elapsed time", () => {
    const state = createDefaultGameState(0);
    state.meta.lastSimTickMs = 1_000;
    const cache = createDerivedCache();
    cache.locRate = Big.fromNumber(1);

    const result = applyOfflineProgress(state, cache, 2 * 60 * 60 * 1000, 60_000);

    expect(result.elapsedS).toBe(60);
    expect(result.cappedS).toBe(60);
    expect(state.res.loc.toNumber()).toBe(60);
    expect(state.meta.lastSimTickMs).toBe(61_000);
  });

  it("credits net money after recurring billing and never goes negative", () => {
    const state = createDefaultGameState(0);
    state.meta.lastSimTickMs = 0;
    state.projects.portfolio.push({
      id: "p_landing.1",
      bugged: false,
      computeUse: 0,
      deploymentMode: "selfHosted",
      level: 1,
      projectId: "p_landing",
      revenue: Big.fromNumber(5),
      shippedAtS: 0
    });
    state.aurora.hostedServers = 1;
    const cache = createDerivedCache();
    recomputeDerivedCache(state, cache);

    const result = applyOfflineProgress(state, cache, 60 * 60 * 1000);

    expect(result.money.toNumber()).toBe(0);
    expect(state.res.money.toNumber()).toBe(0);
  });

  it("advances active project builds and reports their payout while offline", () => {
    const state = createDefaultGameState(0);
    state.meta.lastSimTickMs = 0;
    state.res.loc = Big.fromNumber(10_000);
    const cache = createDerivedCache();
    recomputeDerivedCache(state, cache);

    expect(startProject(state, "p_landing", cache).ok).toBe(true);

    const result = applyOfflineProgress(state, cache, 60 * 60 * 1000);

    expect(state.projects.active).toHaveLength(0);
    expect(state.projects.portfolio).toHaveLength(1);
    expect(state.projects.portfolio[0]?.projectId).toBe("p_landing");
    expect(result.money.toNumber()).toBe(660);
    expect(state.res.money.toNumber()).toBe(660);
  });

  it("segments offline income when the angel network expires during the offline window", () => {
    const state = createDefaultGameState(0);
    state.meta.lastSimTickMs = 0;
    state.stats["prestige.angelNetworkUntil"] = 30 * 60;
    state.projects.portfolio.push({
      id: "p_landing.1",
      bugged: false,
      computeUse: 0,
      deploymentMode: "selfHosted",
      level: 1,
      projectId: "p_landing",
      revenue: Big.fromNumber(1),
      shippedAtS: 0
    });
    const cache = createDerivedCache();
    recomputeDerivedCache(state, cache);

    const result = applyOfflineProgress(state, cache, 60 * 60 * 1000);

    expect(result.money.toNumber()).toBeCloseTo(10 * 30 * 60 + 30 * 60);
    expect(state.res.money.toNumber()).toBeCloseTo(10 * 30 * 60 + 30 * 60);
  });
});
