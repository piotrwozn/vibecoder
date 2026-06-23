import type { EventBus } from "../core/bus";
import type { GameState, SprintPriority } from "../core/state";
import { BUILD_MOMENTUM } from "../data/momentum";
import { getSprintPriority } from "../data/roadmap";
import { addBuildMomentum } from "./momentum";

export interface SprintEffects {
  readonly auroraBillingMultiplier: number;
  readonly auroraSpeedMultiplier: number;
  readonly autoFixDelayMultiplier: number;
  readonly autoPromptMultiplier: number;
  readonly bugChanceMultiplier: number;
  readonly debtFactorMultiplier: number;
  readonly hypeShipMultiplier: number;
  readonly payoutMultiplier: number;
  readonly revenueMultiplier: number;
  readonly rpMultiplier: number;
}

export interface StartSprintResult {
  readonly ok: boolean;
  readonly priority: SprintPriority;
  readonly reason?: "active" | "cooldown" | "missing";
}

export function startSprint(
  state: GameState,
  priority: SprintPriority,
  bus?: EventBus
): StartSprintResult {
  const definition = getSprintPriority(priority);

  if (definition === undefined) {
    return { ok: false, priority, reason: "missing" };
  }

  if (isSprintActive(state)) {
    return { ok: false, priority, reason: "active" };
  }

  if (state.meta.playtimeS < state.roadmap.cooldownUntilS) {
    return { ok: false, priority, reason: "cooldown" };
  }

  state.roadmap.active = priority;
  state.roadmap.startedAtS = state.meta.playtimeS;
  state.roadmap.endsAtS = state.meta.playtimeS + definition.durationS;
  state.roadmap.cooldownUntilS = state.roadmap.endsAtS + definition.cooldownS;
  bus?.emit("roadmap:sprint-started", { priority });
  return { ok: true, priority };
}

export function tickRoadmap(state: GameState, bus?: EventBus): boolean {
  if (state.roadmap.active === undefined) {
    return false;
  }

  const priority = state.roadmap.active;

  if (priority === undefined || state.meta.playtimeS < state.roadmap.endsAtS) {
    return false;
  }

  state.roadmap.active = undefined;
  state.roadmap.completed += 1;
  addBuildMomentum(state, BUILD_MOMENTUM.GAINS.SPRINT_COMPLETED, bus);
  bus?.emit("roadmap:sprint-completed", { priority });
  return true;
}

export function isSprintActive(state: GameState): boolean {
  return state.roadmap.active !== undefined && state.meta.playtimeS < state.roadmap.endsAtS;
}

export function getSprintTimeRemainingS(state: GameState): number {
  return isSprintActive(state) ? Math.max(0, state.roadmap.endsAtS - state.meta.playtimeS) : 0;
}

export function getSprintCooldownRemainingS(state: GameState): number {
  if (isSprintActive(state)) {
    return 0;
  }

  return Math.max(0, state.roadmap.cooldownUntilS - state.meta.playtimeS);
}

export function getSprintEffects(state: GameState): SprintEffects {
  const effects = createNeutralSprintEffects();

  if (!isSprintActive(state)) {
    return effects;
  }

  switch (state.roadmap.active) {
    case "stability":
      return {
        ...effects,
        bugChanceMultiplier: 0.65,
        debtFactorMultiplier: 0.8
      };
    case "growth":
      return {
        ...effects,
        hypeShipMultiplier: 1.35
      };
    case "revenue":
      return {
        ...effects,
        payoutMultiplier: 1.15,
        revenueMultiplier: 1.25
      };
    case "research":
      return {
        ...effects,
        rpMultiplier: 1.35
      };
    case "automation":
      return {
        ...effects,
        autoFixDelayMultiplier: 0.7,
        autoPromptMultiplier: 1.25
      };
    case "aurora":
      return {
        ...effects,
        auroraBillingMultiplier: 0.85,
        auroraSpeedMultiplier: 1.25
      };
    case undefined:
      return effects;
  }
}

function createNeutralSprintEffects(): SprintEffects {
  return {
    auroraBillingMultiplier: 1,
    auroraSpeedMultiplier: 1,
    autoFixDelayMultiplier: 1,
    autoPromptMultiplier: 1,
    bugChanceMultiplier: 1,
    debtFactorMultiplier: 1,
    hypeShipMultiplier: 1,
    payoutMultiplier: 1,
    revenueMultiplier: 1,
    rpMultiplier: 1
  };
}
