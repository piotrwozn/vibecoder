import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState, type GameState } from "../src/core/state";
import {
  AURORA_HOSTING_PER_SERVER_S,
  AURORA_PHASES,
  AURORA_REQUIRED_DEDICATED_SERVERS,
  AURORA_SEED_AVAILABLE_FLAG,
  AURORA_SERVER_COMPONENT_IDS
} from "../src/data/aurora";
import {
  dedicateAuroraServer,
  fundAuroraPhase,
  getAuroraReadyServerCount,
  releaseAuroraHost,
  rentAuroraHost,
  tickAurora
} from "../src/systems/aurora";
import {
  createBillingBreakdown,
  getAuroraDedicatedServerPowerRate,
  getNetMoneyRate,
  POWER_OVERDRAW_STAT,
  tickBilling
} from "../src/systems/billing";
import { recomputeComputeCap } from "../src/systems/compute";
import {
  createDerivedCache,
  recomputeDerivedCache,
  type DerivedCache
} from "../src/systems/production";
import {
  getVisibleProjectOffers,
  refreshProjectBoard,
  startProject,
  tickProjects
} from "../src/systems/projects";
import { tickStory } from "../src/systems/story";
import {
  ITERATION_HOLD_STAT,
  performExit,
  performIteration,
  performRewrite
} from "../src/systems/prestige";

describe("M17 Aurora Project", () => {
  it("unlocks the Aurora app only after the OMEGA ending seed project ships", () => {
    const { cache, state } = createFullState();
    state.era = 10;
    state.res.loc = Big.from("1e25");

    expect(startProject(state, "p_aurora_seed", cache).ok).toBe(false);

    state.story.act = 5;
    state.prestige.endingChoice = "merge";
    state.story.flags.add("iteration_unlocked");
    refreshProjectBoard(state);

    expect(startProject(state, "p_aurora_seed", cache).ok).toBe(false);
    expect(
      getVisibleProjectOffers(state, cache).some((offer) => offer.projectId === "p_aurora_seed")
    ).toBe(false);

    state.meta.playtimeS = 1;
    expect(tickStory(state, 1, cache)).toBe(true);
    expect(state.story.flags.has(AURORA_SEED_AVAILABLE_FLAG)).toBe(false);

    state.story.flags.add("achievement.ending_merge");
    state.meta.playtimeS = 2;
    expect(tickStory(state, 1, cache)).toBe(true);
    expect(state.story.flags.has(AURORA_SEED_AVAILABLE_FLAG)).toBe(true);
    refreshProjectBoard(state);

    expect(startProject(state, "p_aurora_seed", cache).ok).toBe(true);
    tickProjects(state, cache, 300);

    expect(state.aurora.unlocked).toBe(true);
    expect(state.story.flags.has("aurora_unlocked")).toBe(true);
    refreshProjectBoard(state);
    expect(
      getVisibleProjectOffers(state, cache).some((offer) => offer.projectId === "p_aurora_seed")
    ).toBe(false);
  });

  it("dedicates one Aurora-grade server by removing the exact hardware bundle from compute", () => {
    const { state } = createFullState();
    unlockForAurora(state);
    state.owned.hardware.h_dyson_frame = 1;
    for (const id of AURORA_SERVER_COMPONENT_IDS) {
      state.owned.hardware[id] = 1;
    }

    const beforeCap = recomputeComputeCap(state);
    expect(getAuroraReadyServerCount(state)).toBe(1);
    expect(dedicateAuroraServer(state).ok).toBe(true);

    for (const id of AURORA_SERVER_COMPONENT_IDS) {
      expect(state.owned.hardware[id]).toBe(0);
    }
    expect(state.owned.hardware.h_dyson_frame).toBe(1);
    expect(state.aurora.dedicatedServers).toBe(1);
    expect(state.story.flags.has("aurora_dedicated_started")).toBe(true);
    expect(state.res.computeCap).toBeLessThan(beforeCap);
  });

  it("keeps dedicated Aurora servers through REWRITE, EXIT, and ITERATION", () => {
    const { cache, state } = createFullState();
    unlockForAurora(state);
    state.aurora.dedicatedServers = 2;

    seedRewrite(state);
    expect(performRewrite(state, cache).ok).toBe(true);
    expect(state.aurora.dedicatedServers).toBe(2);

    seedExit(state);
    expect(performExit(state, cache).ok).toBe(true);
    expect(state.aurora.dedicatedServers).toBe(2);

    seedIteration(state);
    expect(performIteration(state, cache).ok).toBe(true);
    expect(state.aurora.dedicatedServers).toBe(2);
  });

  it("charges hosting rent, avoids hosting rent for own servers, and pauses progress when bills cannot be paid", () => {
    const { state } = createFullState();
    unlockForAurora(state);
    state.aurora.dedicatedServers = 1;
    expect(createBillingBreakdown(state).auroraHosting.eq0()).toBe(true);
    expect(createBillingBreakdown(state).auroraPower.gt(Big.zero())).toBe(true);
    expect(getAuroraDedicatedServerPowerRate().toNumber()).toBeCloseTo(260_280);

    expect(rentAuroraHost(state).ok).toBe(true);
    expect(createBillingBreakdown(state).auroraHosting.eq(AURORA_HOSTING_PER_SERVER_S)).toBe(true);
    expect(state.story.flags.has("aurora_hosting_started")).toBe(true);

    state.res.money = Big.zero();
    state.aurora.phaseActive = true;
    const beforeElapsed = state.aurora.phaseElapsedS;

    expect(tickBilling(state, 1)).toBe(true);
    expect(state.res.money.eq0()).toBe(true);
    expect(state.bank.overdraft.eq0()).toBe(true);
    expect(state.aurora.billingPaused).toBe(true);
    expect(tickAurora(state, 1)).toBe(false);
    expect(state.aurora.phaseElapsedS).toBe(beforeElapsed);
  });

  it("pauses Aurora progress when only the separate bills are affordable", () => {
    const { state } = createFullState();
    unlockForAurora(state);
    state.owned.hardware[AURORA_SERVER_COMPONENT_IDS[0]!] = 1;
    state.aurora.dedicatedServers = 1;
    state.aurora.phaseActive = true;
    const breakdown = createBillingBreakdown(state);
    const auroraBill = Big.add(breakdown.auroraPower, breakdown.auroraHosting);
    state.res.money = Big.add(Big.max(breakdown.hardwarePower, auroraBill), Big.one());
    const beforeElapsed = state.aurora.phaseElapsedS;

    expect(breakdown.hardwarePower.gt(Big.zero())).toBe(true);
    expect(auroraBill.gt(Big.zero())).toBe(true);
    expect(state.res.money.gte(breakdown.hardwarePower)).toBe(true);
    expect(state.res.money.gte(auroraBill)).toBe(true);
    expect(state.res.money.lt(Big.add(breakdown.hardwarePower, auroraBill))).toBe(true);

    expect(tickBilling(state, 1)).toBe(true);
    expect(state.res.money.gt(Big.zero())).toBe(true);
    expect(state.bank.overdraft.eq0()).toBe(true);
    expect(state.aurora.billingPaused).toBe(true);
    expect(tickAurora(state, 1)).toBe(false);
    expect(state.aurora.phaseElapsedS).toBe(beforeElapsed);
  });

  it("caps rented Aurora hosts at the required quorum", () => {
    const { state } = createFullState();
    unlockForAurora(state);

    for (let index = 0; index < AURORA_REQUIRED_DEDICATED_SERVERS; index += 1) {
      expect(rentAuroraHost(state).ok).toBe(true);
    }

    expect(rentAuroraHost(state)).toMatchObject({ ok: false, reason: "servers" });
    expect(state.aurora.hostedServers).toBe(AURORA_REQUIRED_DEDICATED_SERVERS);
  });

  it("releases rented hosts and stops Aurora recurring bills after completion", () => {
    const { state } = createFullState();
    unlockForAurora(state);
    state.aurora.dedicatedServers = 1;

    expect(rentAuroraHost(state).ok).toBe(true);
    expect(rentAuroraHost(state).ok).toBe(true);
    expect(createBillingBreakdown(state).auroraHosting.toNumber()).toBeCloseTo(
      AURORA_HOSTING_PER_SERVER_S.toNumber() * 2
    );

    expect(releaseAuroraHost(state).ok).toBe(true);
    expect(state.aurora.hostedServers).toBe(1);
    expect(createBillingBreakdown(state).auroraHosting.eq(AURORA_HOSTING_PER_SERVER_S)).toBe(true);

    state.aurora.completed = true;

    expect(createBillingBreakdown(state).auroraHosting.eq0()).toBe(true);
    expect(createBillingBreakdown(state).auroraPower.eq0()).toBe(true);
    expect(tickBilling(state, 1)).toBe(false);
  });

  it("runs Aurora progress once a phase is funded and enough servers are available", () => {
    const { state } = createFullState();
    const phase = AURORA_PHASES[0]!;
    unlockForAurora(state);
    state.res.loc = phase.costLoc.copy();
    state.res.money = phase.costMoney.copy();

    expect(fundAuroraPhase(state).ok).toBe(true);
    expect(state.story.flags.has("aurora_phase_started")).toBe(true);
    expect(tickAurora(state, phase.workS)).toBe(true);
    expect(state.aurora.currentPhase).toBe(1);
  });

  it("keeps the final Aurora phases on the post-refactor endgame curve", () => {
    const delegation = AURORA_PHASES.find((phase) => phase.id === "delegation_layer");
    const goLive = AURORA_PHASES.find((phase) => phase.id === "aurora_go_live");

    expect(delegation?.costLoc.eq(Big.from("1e31"))).toBe(true);
    expect(delegation?.costMoney.eq(Big.from("6e33"))).toBe(true);
    expect(goLive?.costLoc.eq(Big.from("3e31"))).toBe(true);
    expect(goLive?.costMoney.eq(Big.from("1.2e34"))).toBe(true);
  });

  it("charges 10 money per second for one full PC tier", () => {
    const { state } = createFullState();
    for (const id of ["h_cpu", "h_ram", "h_ssd", "h_psu_pc", "h_cooling_pc", "h_gpu"]) {
      state.owned.hardware[id] = 1;
    }

    expect(createBillingBreakdown(state).hardwarePower.eq(Big.fromNumber(10))).toBe(true);
  });

  it("shows negative net money rate while billing keeps money non-negative", () => {
    const { state } = createFullState();
    for (const id of ["h_cpu", "h_ram", "h_ssd", "h_psu_pc", "h_cooling_pc", "h_gpu"]) {
      state.owned.hardware[id] = 1;
    }

    expect(getNetMoneyRate(Big.zero(), state).toNumber()).toBeCloseTo(-10);

    state.res.money = Big.fromNumber(1);
    expect(tickBilling(state, 1)).toBe(true);
    expect(state.res.money.eq0()).toBe(true);
    expect(state.bank.overdraft.toNumber()).toBeCloseTo(9);
    expect(state.stats[POWER_OVERDRAW_STAT]).toBe(0);
  });

  it("pauses hardware power billing when the bill would overdraw money", () => {
    const { state } = createFullState();
    state.owned.hardware.h_cpu = 1;
    state.res.money = Big.fromNumber(0.5);
    state.meta.playtimeS = 12;

    expect(tickBilling(state, 1)).toBe(true);
    expect(state.res.money.eq0()).toBe(true);
    expect(state.bank.overdraft.gt(Big.zero())).toBe(true);
    expect(state.stats[POWER_OVERDRAW_STAT]).toBe(12);

    state.res.money = Big.fromNumber(10);
    expect(tickBilling(state, 1)).toBe(true);
    expect(state.bank.overdraft.eq0()).toBe(true);
    expect(state.stats[POWER_OVERDRAW_STAT]).toBeUndefined();
  });

  it("does not bank-default after prestiging with a dedicated Aurora server", () => {
    const { cache, state } = createFullState();
    unlockForAurora(state);
    state.aurora.dedicatedServers = 1;
    state.res.money = Big.from("1e12");
    seedRewrite(state);
    recomputeDerivedCache(state, cache);

    expect(performRewrite(state, cache).ok).toBe(true);
    expect(state.res.money.eq0()).toBe(true);
    expect(tickBilling(state, 0.1)).toBe(true);

    expect(state.bank.defaulted).toBe(false);
    expect(state.bank.overdraft.eq0()).toBe(true);
    expect(state.aurora.billingPaused).toBe(true);
  });
});

function createFullState(): { cache: DerivedCache; state: GameState } {
  const state = createDefaultGameState(0, "full");
  const cache = createDerivedCache();
  recomputeDerivedCache(state, cache);
  return { cache, state };
}

function unlockForAurora(state: GameState): void {
  state.aurora.unlocked = true;
  state.aurora.status = "funding";
  state.story.flags.add("aurora_unlocked");
}

function seedRewrite(state: GameState): void {
  state.lifetime.locSinceExit = Big.from("1e20");
}

function seedExit(state: GameState): void {
  state.story.flags.add("exit_unlocked");
  state.lifetime.insightSinceExit = 1_000;
}

function seedIteration(state: GameState): void {
  state.prestige.endingChoice = "fork";
  state.story.flags.add("iteration_unlocked");
  state.story.flags.add("achievement.ending_fork");
  state.stats[ITERATION_HOLD_STAT] = 600;
  state.res.money = Big.from("1e60");
}
