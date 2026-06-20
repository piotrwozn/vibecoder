import type { EventBus } from "../core/bus";
import type { GameState } from "../core/state";
import { C } from "../data/constants";
import type { DerivedCache } from "./production";

const HYPE_SHIP_PER_TIER = 0.15;
const HYPE_MAX_STAT = "hype.max";

export function addShipHype(
  state: GameState,
  tier: number,
  bonus = 0,
  cache?: DerivedCache,
  bus?: EventBus
): number {
  const gain = (HYPE_SHIP_PER_TIER * tier + bonus) * (cache?.hype.shipMultiplier ?? 1);
  return addHype(state, gain, cache, bus);
}

export function addHype(
  state: GameState,
  gain: number,
  cache?: DerivedCache,
  bus?: EventBus
): number {
  const cap = cache?.hype.cap ?? C.HYPE_CAP;
  const nextHype = Math.min(cap, state.res.hype + gain);

  if (nextHype !== state.res.hype) {
    state.res.hype = nextHype;
    recordMaxHype(state);
    bus?.emit("res:changed", "hype");
  }

  return state.res.hype;
}

export function tickHype(
  state: GameState,
  dtS: number,
  cache?: DerivedCache,
  bus?: EventBus
): boolean {
  const floor = cache?.hype.floor ?? 1;

  if (state.res.hype <= floor) {
    if (state.res.hype < floor) {
      state.res.hype = floor;
      bus?.emit("res:changed", "hype");
      return true;
    }

    return false;
  }

  const tau = cache?.hype.tauS ?? C.HYPE_TAU;
  const cap = cache?.hype.cap ?? C.HYPE_CAP;
  const nextHype = floor + (state.res.hype - floor) * Math.exp(-dtS / tau);
  const clamped = Math.max(floor, Math.min(cap, nextHype));

  if (clamped === state.res.hype) {
    return false;
  }

  state.res.hype = clamped;
  recordMaxHype(state);
  bus?.emit("res:changed", "hype");
  return true;
}

function recordMaxHype(state: GameState): void {
  const current = state.stats[HYPE_MAX_STAT];
  const max = typeof current === "number" ? current : 0;

  if (state.res.hype > max) {
    state.stats[HYPE_MAX_STAT] = state.res.hype;
  }
}
