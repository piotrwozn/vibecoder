import { Big } from "../core/bignum";
import type { GameState } from "../core/state";
import { isBankrupt, repayBankOverdraft } from "./bank";
import { getNetMoneyRate } from "./billing";
import { getAngelNetworkUntilS, type DerivedCache } from "./production";
import { getProjectIncomeRate, tickProjectBuilds } from "./projects";
import { addNonNegativeBig, isNonNegativeBig } from "./resources";

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
  nowMs: number,
  maxElapsedMs?: number
): OfflineProgressResult {
  const effectiveNowMs = clampOfflineNowMs(state.meta.lastSimTickMs, nowMs, maxElapsedMs);
  const elapsedS = Number.isFinite(effectiveNowMs)
    ? Math.max(0, (effectiveNowMs - state.meta.lastSimTickMs) / 1000)
    : 0;
  const offlineCapH =
    Number.isFinite(cache.offline.capH) && cache.offline.capH > 0 ? cache.offline.capH : 0;
  const cappedS = Math.min(elapsedS, offlineCapH * SECONDS_PER_HOUR);
  if (isBankrupt(state)) {
    state.meta.lastSimTickMs = effectiveNowMs;
    return {
      cappedS: 0,
      elapsedS,
      hypeAfter: state.res.hype,
      hypeBefore: state.res.hype,
      loc: Big.zero(),
      money: Big.zero()
    };
  }

  const rawLoc = Big.mul(cache.locRate, Big.fromNumber(cappedS));
  const rawMoney = calculateOfflineMoney(state, cache, cappedS);
  const loc = isNonNegativeBig(rawLoc) ? rawLoc : Big.zero();
  const money = isNonNegativeBig(rawMoney) ? rawMoney : Big.zero();
  const hypeBefore = state.res.hype;
  const hypeAfter =
    cappedS > 0
      ? cache.hype.floor + (hypeBefore - cache.hype.floor) * Math.exp(-cappedS / cache.hype.tauS)
      : hypeBefore;

  if (!loc.eq0()) {
    addNonNegativeBig(state.res.loc, loc);
    addNonNegativeBig(state.lifetime.loc, loc);
    addNonNegativeBig(state.lifetime.locSinceExit, loc);
  }

  if (!money.eq0()) {
    addNonNegativeBig(state.res.money, money);
    addNonNegativeBig(state.lifetime.money, money);
    repayBankOverdraft(state);
  }

  // Achievements intentionally reconcile on the first live tick after offline catch-up.
  // The unlock UI coalesces those notifications into one batched toast per animation frame.
  state.res.hype = hypeAfter;
  state.meta.playtimeS += cappedS;
  const moneyBeforeBuilds = state.res.money.copy();
  tickProjectBuilds(state, cache, cappedS);
  const buildMoney = Big.sub(state.res.money, moneyBeforeBuilds);
  const totalMoney = buildMoney.gt(Big.zero()) ? Big.add(money, buildMoney) : money;
  state.meta.lastSimTickMs = effectiveNowMs;

  return {
    cappedS,
    elapsedS,
    hypeAfter,
    hypeBefore,
    loc,
    money: totalMoney
  };
}

export function clampOfflineNowMs(
  lastSimTickMs: number,
  nowMs: number,
  maxElapsedMs?: number
): number {
  if (!Number.isFinite(nowMs)) {
    return lastSimTickMs;
  }

  if (maxElapsedMs === undefined || !Number.isFinite(maxElapsedMs) || maxElapsedMs < 0) {
    return nowMs;
  }

  return Math.min(nowMs, lastSimTickMs + maxElapsedMs);
}

function calculateOfflineMoney(state: GameState, cache: DerivedCache, cappedS: number): Big {
  let remainingS = cappedS;
  let cursorS = state.meta.playtimeS;
  const money = Big.zero();

  while (remainingS > 0) {
    const nextSegmentS = getOfflineSegmentS(state, cursorS, remainingS);
    // Offline income uses neutral hype while the saved hype value still decays during catch-up.
    const grossMoneyRate = getProjectIncomeRate(state, cache, 1, cursorS);
    const segmentMoney = Big.mul(
      Big.max(Big.zero(), getNetMoneyRate(grossMoneyRate, state, cache)),
      Big.fromNumber(nextSegmentS)
    );
    Big.addIn(money, segmentMoney);
    cursorS += nextSegmentS;
    remainingS -= nextSegmentS;
  }

  return money;
}

function getOfflineSegmentS(state: GameState, cursorS: number, remainingS: number): number {
  const angelUntilS = getAngelNetworkUntilS(state);
  if (angelUntilS === undefined || cursorS >= angelUntilS || cursorS + remainingS <= angelUntilS) {
    return remainingS;
  }

  return Math.max(0, angelUntilS - cursorS);
}
