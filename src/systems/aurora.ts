import type { EventBus } from "../core/bus";
import { Big } from "../core/bignum";
import type { GameState } from "../core/state";
import {
  AURORA_COMPLETED_FLAG,
  AURORA_DEDICATED_STARTED_FLAG,
  AURORA_HOSTING_STARTED_FLAG,
  AURORA_PHASES,
  AURORA_PHASE_STARTED_FLAG,
  AURORA_REQUIRED_DEDICATED_SERVERS,
  AURORA_SERVER_COMPONENT_IDS,
  AURORA_SERVER_GLOBAL_REQUIREMENT_ID,
  AURORA_UNLOCK_FLAG,
  type AuroraPhaseDefinition
} from "../data/aurora";
import { recomputeComputeCap } from "./compute";
import { getAuroraRecurringRate } from "./billing";
import { getSprintEffects } from "./roadmap";
import { canSpendBig, isPositiveFinite, spendBig } from "./resources";
import { getRunStyleEffects } from "./run-styles";
import { getStoryDecisionEffects } from "./story-decisions";

export interface AuroraActionResult {
  readonly ok: boolean;
  readonly reason?: "active" | "complete" | "locked" | "missing" | "servers" | "unaffordable";
}

export function unlockAurora(state: GameState, bus?: EventBus): boolean {
  if (state.aurora.unlocked) {
    return false;
  }

  state.aurora.unlocked = true;
  state.aurora.status = "funding";
  state.story.flags.add(AURORA_UNLOCK_FLAG);
  bus?.emit("unlock", { id: "aurora", kind: "story" });
  return true;
}

export function getCurrentAuroraPhase(state: GameState): AuroraPhaseDefinition | undefined {
  return AURORA_PHASES[state.aurora.currentPhase];
}

export function getAuroraProgress(state: GameState): number {
  let progress = 0;

  for (let index = 0; index < state.aurora.currentPhase; index += 1) {
    progress += AURORA_PHASES[index]?.percent ?? 0;
  }

  const phase = getCurrentAuroraPhase(state);
  if (phase !== undefined && phase.workS > 0) {
    progress += phase.percent * Math.min(1, state.aurora.phaseElapsedS / phase.workS);
  }

  return state.aurora.completed ? 100 : Math.min(100, progress);
}

export function getAvailableAuroraServers(state: GameState): number {
  return state.aurora.dedicatedServers + state.aurora.hostedServers;
}

export function getAuroraReadyServerCount(state: GameState): number {
  if ((state.owned.hardware[AURORA_SERVER_GLOBAL_REQUIREMENT_ID] ?? 0) < 1) {
    return 0;
  }

  return Math.min(
    ...AURORA_SERVER_COMPONENT_IDS.map((hardwareId) => state.owned.hardware[hardwareId] ?? 0)
  );
}

export function dedicateAuroraServer(state: GameState, bus?: EventBus): AuroraActionResult {
  if (!state.aurora.unlocked) {
    return { ok: false, reason: "locked" };
  }

  if (state.aurora.completed) {
    return { ok: false, reason: "complete" };
  }

  if (getAuroraReadyServerCount(state) <= 0) {
    return { ok: false, reason: "servers" };
  }

  for (const hardwareId of AURORA_SERVER_COMPONENT_IDS) {
    state.owned.hardware[hardwareId] = Math.max(0, (state.owned.hardware[hardwareId] ?? 0) - 1);
  }

  state.aurora.dedicatedServers += 1;
  state.story.flags.add(AURORA_DEDICATED_STARTED_FLAG);
  recomputeComputeCap(state);
  refreshAuroraFlags(state);
  refreshAuroraStatus(state);
  bus?.emit("res:changed", "computeCap");
  bus?.emit("bought", { id: "aurora.dedicated_server", kind: "hardware" });
  return { ok: true };
}

export function rentAuroraHost(state: GameState, bus?: EventBus): AuroraActionResult {
  if (!state.aurora.unlocked) {
    return { ok: false, reason: "locked" };
  }

  if (state.aurora.completed) {
    return { ok: false, reason: "complete" };
  }

  if (getAvailableAuroraServers(state) >= AURORA_REQUIRED_DEDICATED_SERVERS) {
    return { ok: false, reason: "servers" };
  }

  state.aurora.hostedServers += 1;
  state.story.flags.add(AURORA_HOSTING_STARTED_FLAG);
  refreshAuroraFlags(state);
  refreshAuroraStatus(state);
  bus?.emit("res:changed", "money");
  return { ok: true };
}

export function releaseAuroraHost(state: GameState, bus?: EventBus): AuroraActionResult {
  if (!state.aurora.unlocked) {
    return { ok: false, reason: "locked" };
  }

  if (state.aurora.hostedServers <= 0) {
    return { ok: false, reason: "servers" };
  }

  state.aurora.hostedServers -= 1;
  refreshAuroraStatus(state);
  bus?.emit("res:changed", "money");
  return { ok: true };
}

export function fundAuroraPhase(state: GameState, bus?: EventBus): AuroraActionResult {
  if (!state.aurora.unlocked) {
    return { ok: false, reason: "locked" };
  }

  if (state.aurora.completed) {
    return { ok: false, reason: "complete" };
  }

  if (state.aurora.phaseActive) {
    return { ok: false, reason: "active" };
  }

  const phase = getCurrentAuroraPhase(state);
  if (phase === undefined) {
    completeAurora(state, bus);
    return { ok: true };
  }

  if (!hasRequiredServers(state, phase)) {
    state.aurora.status = "servers";
    return { ok: false, reason: "servers" };
  }

  if (
    !canSpendBig(state.res.loc, phase.costLoc) ||
    !canSpendBig(state.res.money, phase.costMoney)
  ) {
    state.aurora.status = "funding";
    return { ok: false, reason: "unaffordable" };
  }

  spendBig(state.res.loc, phase.costLoc);
  spendBig(state.res.money, phase.costMoney);
  state.aurora.phaseActive = true;
  state.aurora.phaseElapsedS = 0;
  state.aurora.status = "ready";
  state.story.flags.add(AURORA_PHASE_STARTED_FLAG);
  bus?.emit("res:changed", "loc");
  bus?.emit("res:changed", "money");
  return { ok: true };
}

export function tickAurora(state: GameState, dtS: number, bus?: EventBus): boolean {
  if (!state.aurora.unlocked || state.aurora.completed || !isPositiveFinite(dtS)) {
    return false;
  }

  const phase = getCurrentAuroraPhase(state);
  if (phase === undefined) {
    completeAurora(state, bus);
    return true;
  }

  if (!state.aurora.phaseActive) {
    refreshAuroraStatus(state);
    return false;
  }

  if (!hasRequiredServers(state, phase)) {
    state.aurora.status = "servers";
    return false;
  }

  if (state.aurora.billingPaused && getAuroraRecurringRate(state).gt(Big.zero())) {
    state.aurora.status = "billing";
    return false;
  }

  const serverRatio = Math.max(
    0,
    getAuroraServerRatio(state, phase) * getAuroraSpeedMultiplier(state)
  );
  if (serverRatio <= 0) {
    return false;
  }

  state.aurora.phaseElapsedS = Math.min(
    phase.workS,
    state.aurora.phaseElapsedS + dtS * serverRatio
  );
  state.aurora.status = "ready";

  if (state.aurora.phaseElapsedS >= phase.workS) {
    state.aurora.currentPhase += 1;
    state.aurora.phaseActive = false;
    state.aurora.phaseElapsedS = 0;

    if (getCurrentAuroraPhase(state) === undefined) {
      completeAurora(state, bus);
    } else {
      refreshAuroraStatus(state);
    }
  }

  return true;
}

function refreshAuroraStatus(state: GameState): void {
  if (!state.aurora.unlocked) {
    state.aurora.status = "locked";
    return;
  }

  if (state.aurora.completed) {
    state.aurora.status = "complete";
    return;
  }

  const phase = getCurrentAuroraPhase(state);
  if (phase !== undefined && !hasRequiredServers(state, phase)) {
    state.aurora.status = "servers";
    return;
  }

  state.aurora.status = state.aurora.phaseActive ? "ready" : "funding";
}

function refreshAuroraFlags(state: GameState): void {
  if (getAvailableAuroraServers(state) > 0) {
    state.story.flags.add("aurora_billing_started");
  }

  if (getAvailableAuroraServers(state) >= AURORA_REQUIRED_DEDICATED_SERVERS) {
    state.story.flags.add("aurora_server_quorum");
  }
}

function hasRequiredServers(state: GameState, phase: AuroraPhaseDefinition): boolean {
  return getAvailableAuroraServers(state) >= phase.requiredServers;
}

function getAuroraServerRatio(state: GameState, phase: AuroraPhaseDefinition): number {
  if (phase.requiredServers <= 0) {
    return 1;
  }

  return Math.min(1, getAvailableAuroraServers(state) / phase.requiredServers);
}

function getAuroraSpeedMultiplier(state: GameState): number {
  return (
    getSprintEffects(state).auroraSpeedMultiplier *
    getRunStyleEffects(state).auroraSpeedMultiplier *
    getStoryDecisionEffects(state).auroraSpeedMultiplier
  );
}

function completeAurora(state: GameState, bus?: EventBus): void {
  state.aurora.completed = true;
  state.aurora.phaseActive = false;
  state.aurora.phaseElapsedS = 0;
  state.aurora.currentPhase = AURORA_PHASES.length;
  state.aurora.status = "complete";
  state.story.flags.add(AURORA_COMPLETED_FLAG);
  state.stats["aurora.completed"] = state.meta.playtimeS;
  bus?.emit("unlock", { id: "aurora.complete", kind: "story" });
}

export { AURORA_REQUIRED_DEDICATED_SERVERS };
