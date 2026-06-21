import { Big } from "../core/bignum";
import type { GameState } from "../core/state";
import { C } from "../data/constants";
import { getNetMoneyRate } from "./billing";
import type { DerivedCache } from "./production";
import { getProjectIncomeRate } from "./projects";

const SECONDS_PER_HOUR = 60 * 60;

export interface OfflineProgressResult {
  readonly cappedS: number;
  readonly elapsedS: number;
  readonly hypeAfter: number;
  readonly hypeBefore: number;
  readonly loc: Big;
  readonly money: Big;
}

export function applyOfflineProgress(
  state: GameState,
  cache: DerivedCache,
  nowMs: number
): OfflineProgressResult {
  const elapsedS = Math.max(0, (nowMs - state.meta.lastSimTickMs) / 1000);
  const cappedS = Math.min(elapsedS, cache.offline.capH * SECONDS_PER_HOUR);
  const loc = Big.mul(cache.locRate, Big.fromNumber(cappedS));
  const grossMoneyRate = getProjectIncomeRate(state, cache, 1);
  const money = Big.mul(
    Big.max(Big.zero(), getNetMoneyRate(grossMoneyRate, state)),
    Big.fromNumber(cappedS)
  );
  const hypeBefore = state.res.hype;
  const hypeAfter =
    elapsedS > 0 ? Math.max(cache.hype.floor, hypeBefore * C.OFFLINE_HYPE_KEEP) : hypeBefore;

  if (!loc.eq0()) {
    Big.addIn(state.res.loc, loc);
    Big.addIn(state.lifetime.loc, loc);
    Big.addIn(state.lifetime.locSinceExit, loc);
  }

  if (!money.eq0()) {
    Big.addIn(state.res.money, money);
    Big.addIn(state.lifetime.money, money);
  }

  state.res.hype = hypeAfter;
  state.meta.playtimeS += cappedS;
  state.meta.lastSimTickMs = nowMs;

  return {
    cappedS,
    elapsedS,
    hypeAfter,
    hypeBefore,
    loc,
    money
  };
}
