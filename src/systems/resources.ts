import { Big } from "../core/bignum";
import type { EventBus } from "../core/bus";
import type { GameState } from "../core/state";

const ZERO = Big.zero();

export function isFiniteBig(value: Big): boolean {
  return Number.isFinite(value.m) && Number.isFinite(value.e);
}

export function isNonNegativeBig(value: Big): boolean {
  return isFiniteBig(value) && value.gte(ZERO);
}

export function isPositiveBig(value: Big): boolean {
  return isFiniteBig(value) && value.gt(ZERO);
}

export function canSpendBig(balance: Big, cost: Big): boolean {
  return isNonNegativeBig(balance) && isNonNegativeBig(cost) && balance.gte(cost);
}

export function spendBig(balance: Big, cost: Big): boolean {
  if (!canSpendBig(balance, cost)) {
    return false;
  }

  if (cost.eq0()) {
    clampBigToZero(balance);
    return true;
  }

  Big.subIn(balance, cost);
  clampBigToZero(balance);
  return true;
}

export function addNonNegativeBig(balance: Big, delta: Big): boolean {
  if (!isNonNegativeBig(delta) || delta.eq0()) {
    clampBigToZero(balance);
    return false;
  }

  clampBigToZero(balance);
  Big.addIn(balance, delta);
  clampBigToZero(balance);
  return true;
}

export function canSpendNumber(balance: number, cost: number): boolean {
  return (
    Number.isFinite(balance) &&
    balance >= 0 &&
    Number.isFinite(cost) &&
    cost >= 0 &&
    balance >= cost
  );
}

export function spendNumber(balance: number, cost: number): number | undefined {
  if (!canSpendNumber(balance, cost)) {
    return undefined;
  }

  return Math.max(0, balance - cost);
}

export function addNonNegativeNumber(balance: number, delta: number): number {
  const current = Number.isFinite(balance) && balance >= 0 ? balance : 0;

  if (!Number.isFinite(delta) || delta <= 0) {
    return current;
  }

  return current + delta;
}

export function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function clampNonNegativeDuration(value: number): number {
  return isPositiveFinite(value) ? value : 0;
}

export function clampCoreResources(state: GameState, bus?: EventBus): boolean {
  const changedMoney = clampBigToZero(state.res.money);
  const changedLoc = clampBigToZero(state.res.loc);
  const nextRp = clampNumberToZero(state.res.rp);
  const changedRp = nextRp !== state.res.rp;

  if (changedRp) {
    state.res.rp = nextRp;
  }

  if (changedMoney) {
    bus?.emit("res:changed", "money");
  }

  if (changedLoc) {
    bus?.emit("res:changed", "loc");
  }

  if (changedRp) {
    bus?.emit("res:changed", "rp");
  }

  return changedMoney || changedLoc || changedRp;
}

function clampBigToZero(value: Big): boolean {
  if (!isFiniteBig(value) || value.lt(ZERO)) {
    value.set(0, 0);
    return true;
  }

  return false;
}

function clampNumberToZero(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}
