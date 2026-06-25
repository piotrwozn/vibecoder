import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { deserializeGameState } from "../src/core/save";
import { createDefaultGameState } from "../src/core/state";
import { SAVE_VERSION } from "../src/core/migrations";
import {
  acceptEndlessContract,
  chooseEndlessDecision,
  getEndlessContractCost,
  getEndlessEffects,
  refreshEndlessOffers,
  startEndlessChallenge,
  tickEndless
} from "../src/systems/endless";

describe("endless mode", () => {
  it("unlocks after Aurora completion and generates procedural offers", () => {
    const state = createDefaultGameState();
    state.aurora.completed = true;

    expect(tickEndless(state, 1)).toBe(true);
    expect(state.endless.unlocked).toBe(true);
    expect(state.endless.offers).toHaveLength(3);
    expect(state.endless.seasonEndsAtS).toBeGreaterThan(state.meta.playtimeS);
  });

  it("accepts and completes an endless contract with rewards and tier progress", () => {
    const state = createDefaultGameState();
    state.aurora.completed = true;
    tickEndless(state, 1);
    const offer = state.endless.offers[0]!;
    state.res.loc = getEndlessContractCost(offer);

    const accepted = acceptEndlessContract(state, offer.id);

    expect(accepted.ok).toBe(true);
    expect(state.endless.active?.id).toBe(offer.id);
    expect(state.res.loc.eq0()).toBe(true);

    tickEndless(state, offer.workS + 1);

    expect(state.endless.active).toBeUndefined();
    expect(state.endless.completedContracts).toBe(1);
    expect(state.endless.tier).toBeGreaterThan(offer.tier);
    expect(state.res.money.gt(Big.zero())).toBe(true);
    expect(state.res.rp).toBeGreaterThan(0);
    expect(state.endless.empireScore.gt(Big.zero())).toBe(true);
  });

  it("blocks refresh while a contract is active", () => {
    const state = createDefaultGameState();
    state.aurora.completed = true;
    tickEndless(state, 1);
    const offer = state.endless.offers[0]!;
    state.res.loc = getEndlessContractCost(offer);

    expect(acceptEndlessContract(state, offer.id).ok).toBe(true);
    expect(refreshEndlessOffers(state).reason).toBe("active");
  });

  it("starts challenge runs as an endless reset with fresh offers", () => {
    const state = createDefaultGameState();
    state.aurora.completed = true;
    tickEndless(state, 1);
    state.endless.tier = 42;
    state.endless.completedContracts = 12;
    state.endless.milestones.push({ id: "tier_10" });

    const result = startEndlessChallenge(state, "no_failed_deploy");

    expect(result.ok).toBe(true);
    expect(state.endless.activeChallenge).toBe("no_failed_deploy");
    expect(state.endless.decision).toBe("reset");
    expect(state.endless.tier).toBe(1);
    expect(state.endless.completedContracts).toBe(0);
    expect(state.endless.milestones).toEqual([]);
    expect(state.endless.offers).toHaveLength(3);
  });

  it("completes challenge runs and awards endless currencies", () => {
    const state = createDefaultGameState();
    state.aurora.completed = true;
    tickEndless(state, 1);
    expect(startEndlessChallenge(state, "no_agents").ok).toBe(true);
    state.endless.tier = 19;
    state.endless.offers = [];
    tickEndless(state, 1);
    const offer = state.endless.offers[0]!;
    state.res.loc = getEndlessContractCost(offer);

    expect(acceptEndlessContract(state, offer.id).ok).toBe(true);
    tickEndless(state, offer.workS + 1);

    expect(state.endless.activeChallenge).toBeUndefined();
    expect(state.endless.challengeCompletions.find((entry) => entry.id === "no_agents")).toEqual(
      expect.objectContaining({ completed: true })
    );
    expect(state.endless.currencies.modelResearch).toBeGreaterThan(0);
    expect(state.endless.currencies.legacyPoints).toBeGreaterThan(0);
  });

  it("handles continue/reset endless decisions without touching campaign state", () => {
    const state = createDefaultGameState();
    state.aurora.completed = true;
    tickEndless(state, 1);
    state.endless.tier = 20;
    state.res.money = Big.fromNumber(123);

    expect(chooseEndlessDecision(state, "continue").ok).toBe(true);
    expect(state.endless.decision).toBe("continue");
    expect(chooseEndlessDecision(state, "reset").ok).toBe(true);

    expect(state.endless.decision).toBe("reset");
    expect(state.endless.tier).toBe(1);
    expect(state.endless.currencies.legacyPoints).toBeGreaterThan(0);
    expect(state.res.money.toNumber()).toBe(123);
  });

  it("rotates local endless events and applies their effects", () => {
    const state = createDefaultGameState();
    state.aurora.completed = true;
    tickEndless(state, 1);
    state.meta.playtimeS = state.endless.nextEventAtS;

    expect(tickEndless(state, 1)).toBe(true);
    expect(state.endless.activeEvent).toBeDefined();
    expect(getEndlessEffects(state)).not.toEqual({
      bugChanceMultiplier: 1,
      debtFactorMultiplier: 1,
      hostingCostMultiplier: 1,
      payoutMultiplier: 1,
      rpMultiplier: 1,
      workMultiplier: 1
    });
  });

  it("applies season effects only after endless unlock", () => {
    const state = createDefaultGameState();

    expect(getEndlessEffects(state).payoutMultiplier).toBe(1);

    state.endless.unlocked = true;
    state.endless.seasonId = "enterprise";

    expect(getEndlessEffects(state).payoutMultiplier).toBeGreaterThan(1);
    expect(getEndlessEffects(state).workMultiplier).toBeGreaterThan(1);
  });

  it("migrates v14 saves with default endless state", () => {
    const decoded = deserializeGameState(JSON.stringify({ v: 14 }), {
      edition: "full",
      nowMs: 1_000
    });

    expect(decoded.reset).toBe(false);
    expect(decoded.state.v).toBe(SAVE_VERSION);
    expect(decoded.state.endless.unlocked).toBe(false);
    expect(decoded.state.endless.tier).toBe(1);
    expect(decoded.state.endless.offers).toEqual([]);
    expect(decoded.state.endless.currencies.legacyPoints).toBe(0);
    expect(decoded.state.endless.challengeCompletions).toEqual([]);
    expect(decoded.state.endless.decision).toBe("continue");
  });
});
