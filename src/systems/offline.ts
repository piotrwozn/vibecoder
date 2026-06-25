import { Big } from "../core/bignum";
import type { GameState } from "../core/state";
import { tickAurora } from "./aurora";
import { isBankrupt } from "./bank";
import { tickBilling } from "./billing";
import { tickEndless } from "./endless";
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
  const loc = isNonNegativeBig(rawLoc) ? rawLoc : Big.zero();
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

  const playtimeBefore = state.meta.playtimeS;
  const money = applyOfflineEconomy(state, cache, cappedS);

  // Achievements intentionally reconcile on the first live tick after offline catch-up.
  // The unlock UI coalesces those notifications into one batched toast per animation frame.
  state.res.hype = hypeAfter;
  state.meta.playtimeS = playtimeBefore + cappedS;
  state.meta.lastSimTickMs = effectiveNowMs;

  return {
    cappedS,
    elapsedS,
    hypeAfter,
    hypeBefore,
    loc,
    money
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

function applyOfflineIncomeAndBilling(state: GameState, cache: DerivedCache, cappedS: number): Big {
  let remainingS = cappedS;
  let cursorS = state.meta.playtimeS;
  const moneyBefore = state.res.money.copy();

  while (remainingS > 0 && !isBankrupt(state)) {
    const nextSegmentS = getOfflineSegmentS(state, cursorS, remainingS);
    // Offline income uses neutral hype while the saved hype value still decays during catch-up.
    const grossMoneyRate = getProjectIncomeRate(state, cache, 1, cursorS);
    const segmentMoney = Big.mul(grossMoneyRate, Big.fromNumber(nextSegmentS));

    if (addNonNegativeBig(state.res.money, segmentMoney)) {
      addNonNegativeBig(state.lifetime.money, segmentMoney);
    }

    state.meta.playtimeS = cursorS;
    tickOfflineBilling(state, cache, nextSegmentS);
    cursorS += nextSegmentS;
    remainingS -= nextSegmentS;
  }

  state.meta.playtimeS = cursorS;
  return Big.max(Big.zero(), Big.sub(state.res.money, moneyBefore));
}

function tickOfflineBilling(state: GameState, cache: DerivedCache, dtS: number): void {
  const savedHype = state.res.hype;
  state.res.hype = 1;

  try {
    tickBilling(state, cache, dtS);
  } finally {
    state.res.hype = savedHype;
  }
}

function applyOfflineEconomy(state: GameState, cache: DerivedCache, cappedS: number): Big {
  let remainingS = cappedS;
  let totalMoney = Big.zero();

  while (remainingS > 0 && !isBankrupt(state)) {
    const buildCompletionS = getNextBuildCompletionS(state);
    const segmentS =
      buildCompletionS === undefined ? remainingS : Math.min(remainingS, buildCompletionS);
    const advancedS = segmentS > 0 ? segmentS : Math.min(remainingS, Number.EPSILON);
    const incomeMoney = applyOfflineIncomeAndBilling(state, cache, advancedS);

    if (incomeMoney.gt(Big.zero())) {
      totalMoney = Big.add(totalMoney, incomeMoney);
    }

    const moneyBeforeLongRunningSystems = state.res.money.copy();
    tickAurora(state, advancedS);
    tickEndless(state, advancedS);
    const longRunningSystemMoney = Big.sub(state.res.money, moneyBeforeLongRunningSystems);

    if (longRunningSystemMoney.gt(Big.zero())) {
      totalMoney = Big.add(totalMoney, longRunningSystemMoney);
    }

    const moneyBeforeBuilds = state.res.money.copy();
    tickProjectBuilds(state, cache, advancedS);
    const buildMoney = Big.sub(state.res.money, moneyBeforeBuilds);

    if (buildMoney.gt(Big.zero())) {
      totalMoney = Big.add(totalMoney, buildMoney);
    }

    remainingS -= advancedS;
  }

  return totalMoney;
}

function getNextBuildCompletionS(state: GameState): number | undefined {
  let nextS: number | undefined;

  for (const build of state.projects.active) {
    const remainingS = Math.max(0, build.buildS - build.elapsedS);
    nextS = nextS === undefined ? remainingS : Math.min(nextS, remainingS);
  }

  return nextS;
}

function getOfflineSegmentS(state: GameState, cursorS: number, remainingS: number): number {
  const angelUntilS = getAngelNetworkUntilS(state);
  if (angelUntilS === undefined || cursorS >= angelUntilS || cursorS + remainingS <= angelUntilS) {
    return remainingS;
  }

  return Math.max(0, angelUntilS - cursorS);
}
