import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState } from "../src/core/state";
import { AURORA_PHASES } from "../src/data/aurora";
import { acceptEndlessContract, getEndlessContractCost, tickEndless } from "../src/systems/endless";
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
    state.owned.hardware.h_cpu = 1;
    state.owned.hardware.h_gpu = 1;
    const cache = createDerivedCache();
    recomputeDerivedCache(state, cache);

    const result = applyOfflineProgress(state, cache, 60 * 60 * 1000);

    expect(result.money.toNumber()).toBe(0);
    expect(state.res.money.toNumber()).toBe(0);
    expect(state.bank.overdraft.gt(Big.zero())).toBe(true);
  });

  it("uses neutral offline hype for both hosted income and hosted billing", () => {
    const state = createDefaultGameState(0);
    state.meta.lastSimTickMs = 0;
    state.res.hype = 4;
    state.projects.portfolio.push({
      id: "p_landing.1",
      bugged: false,
      computeUse: 100,
      deploymentMode: "hosted",
      level: 1,
      projectId: "p_landing",
      revenue: Big.fromNumber(100),
      shippedAtS: 0
    });
    const cache = createDerivedCache();
    recomputeDerivedCache(state, cache);

    applyOfflineProgress(state, cache, 10_000);

    expect(state.bank.overdraft.eq0()).toBe(true);
    expect(state.res.money.toNumber()).toBeCloseTo(150);
  });

  it("charges recurring hardware power while offline", () => {
    const state = createDefaultGameState(0);
    state.meta.lastSimTickMs = 0;
    state.res.money = Big.fromNumber(100);
    state.owned.hardware.h_cpu = 1;
    const cache = createDerivedCache();
    recomputeDerivedCache(state, cache);

    const result = applyOfflineProgress(state, cache, 60 * 60 * 1000);

    expect(result.money.toNumber()).toBe(0);
    expect(state.res.money.toNumber()).toBe(0);
    expect(state.bank.overdraft.toNumber()).toBeCloseTo(7_100);
  });

  it("advances active project builds and credits remaining offline revenue", () => {
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
    expect(result.money.gt(Big.fromNumber(660))).toBe(true);
    expect(state.res.money.eq(result.money)).toBe(true);
  });

  it("advances a funded Aurora phase during offline catch-up", () => {
    const state = createDefaultGameState(0);
    const phase = AURORA_PHASES[0]!;
    state.meta.lastSimTickMs = 0;
    state.res.money = Big.from("1e12");
    state.aurora.dedicatedServers = 1;
    state.aurora.unlocked = true;
    state.aurora.phaseActive = true;
    state.aurora.status = "ready";
    const cache = createDerivedCache();
    recomputeDerivedCache(state, cache);

    applyOfflineProgress(state, cache, phase.workS * 1000);

    expect(state.aurora.currentPhase).toBe(1);
    expect(state.aurora.phaseActive).toBe(false);
    expect(state.aurora.phaseElapsedS).toBe(0);
    expect(state.aurora.status).toBe("funding");
  });

  it("advances active endless contracts during offline catch-up", () => {
    const state = createDefaultGameState(0);
    state.meta.lastSimTickMs = 0;
    state.aurora.completed = true;
    tickEndless(state, 1);
    const offer = state.endless.offers[0]!;
    state.res.loc = getEndlessContractCost(offer);
    const cache = createDerivedCache();
    recomputeDerivedCache(state, cache);

    expect(acceptEndlessContract(state, offer.id).ok).toBe(true);

    const result = applyOfflineProgress(state, cache, (offer.workS + 1) * 1000);

    expect(state.endless.active).toBeUndefined();
    expect(state.endless.completedContracts).toBe(1);
    expect(state.res.money.gt(Big.zero())).toBe(true);
    expect(result.money.eq(state.res.money)).toBe(true);
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
