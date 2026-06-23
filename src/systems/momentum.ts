import type { EventBus } from "../core/bus";
import type { GameState } from "../core/state";
import {
  BUILD_MOMENTUM,
  BUILD_MOMENTUM_DECAY_ACCUM_STAT,
  BUILD_MOMENTUM_STAT
} from "../data/momentum";

export interface BuildMomentumEffects {
  readonly buildTimeMultiplier: number;
  readonly locMultiplier: number;
  readonly payoutMultiplier: number;
  readonly revenueMultiplier: number;
  readonly rpMultiplier: number;
}

export function getBuildMomentum(state: GameState): number {
  return clampMomentum(getNumericStat(state, BUILD_MOMENTUM_STAT));
}

export function getBuildMomentumEffects(state: GameState): BuildMomentumEffects {
  const ratio = (getBuildMomentum(state) / BUILD_MOMENTUM.MAX) * getMomentumEffectScale(state);

  return {
    buildTimeMultiplier: 1 - ratio * BUILD_MOMENTUM.BUILD_TIME_REDUCTION_MAX,
    locMultiplier: 1 + ratio * BUILD_MOMENTUM.LOC_MULTIPLIER_MAX,
    payoutMultiplier: 1 + ratio * BUILD_MOMENTUM.PROJECT_PAYOUT_MULTIPLIER_MAX,
    revenueMultiplier: 1 + ratio * BUILD_MOMENTUM.PROJECT_REVENUE_MULTIPLIER_MAX,
    rpMultiplier: 1 + ratio * BUILD_MOMENTUM.RP_MULTIPLIER_MAX
  };
}

function getMomentumEffectScale(state: GameState): number {
  if (state.story.act >= 4 || state.prestige.iteration > 0) {
    return 1;
  }

  return 0;
}

export function addBuildMomentum(state: GameState, delta: number, bus?: EventBus): number {
  if (!Number.isFinite(delta) || delta === 0) {
    return getBuildMomentum(state);
  }

  return setBuildMomentum(state, getBuildMomentum(state) + delta, bus);
}

export function tickBuildMomentum(state: GameState, dtS: number, bus?: EventBus): boolean {
  const current = getBuildMomentum(state);

  if (current <= 0 || dtS <= 0) {
    if (getNumericStat(state, BUILD_MOMENTUM_DECAY_ACCUM_STAT) > 0) {
      delete state.stats[BUILD_MOMENTUM_DECAY_ACCUM_STAT];
    }
    return false;
  }

  const accumulated = getNumericStat(state, BUILD_MOMENTUM_DECAY_ACCUM_STAT) + dtS;
  if (accumulated < BUILD_MOMENTUM.DECAY_INTERVAL_S) {
    state.stats[BUILD_MOMENTUM_DECAY_ACCUM_STAT] = accumulated;
    return false;
  }

  delete state.stats[BUILD_MOMENTUM_DECAY_ACCUM_STAT];
  const decay = (BUILD_MOMENTUM.DECAY_PER_HOUR * accumulated) / 3600;
  const next = setBuildMomentum(state, current - decay, bus);
  return next !== current;
}

function setBuildMomentum(state: GameState, value: number, bus?: EventBus): number {
  const previous = getBuildMomentum(state);
  const next = clampMomentum(value);

  if (Math.abs(next - previous) < 0.001) {
    return previous;
  }

  if (next <= 0) {
    delete state.stats[BUILD_MOMENTUM_STAT];
  } else {
    state.stats[BUILD_MOMENTUM_STAT] = Number(next.toFixed(4));
  }

  bus?.emit("momentum:changed", { delta: next - previous, value: next });
  return next;
}

function clampMomentum(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(BUILD_MOMENTUM.MAX, value));
}

function getNumericStat(state: GameState, key: string): number {
  const value = state.stats[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
