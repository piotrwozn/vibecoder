import type { EventBus } from "../core/bus";
import { Big } from "../core/bignum";
import type { BankWarningLevel, GameState } from "../core/state";
import { addNonNegativeBig, isPositiveBig, spendBig } from "./resources";

export const BANK_WARNING_1_THRESHOLD = Big.fromNumber(1_000);
export const BANK_WARNING_2_THRESHOLD = Big.fromNumber(5_000);
export const BANK_DEFAULT_THRESHOLD = Big.fromNumber(10_000);
const BANK_THRESHOLD_LOG10_PER_ERA_AFTER_MUSE = 5;

const BANK_WARNING_1_EVENT = "bank_overdraft_warning_1";
const BANK_WARNING_2_EVENT = "bank_overdraft_warning_2";
const BANK_DEFAULT_EVENT = "bank_overdraft_default";

export function isBankrupt(state: GameState): boolean {
  return state.bank.defaulted;
}

export function accrueBankOverdraft(state: GameState, unpaidBill: Big, bus?: EventBus): boolean {
  if (!addNonNegativeBig(state.bank.overdraft, unpaidBill)) {
    return syncBankThresholds(state, bus);
  }

  return syncBankThresholds(state, bus) || true;
}

export function repayBankOverdraft(state: GameState, bus?: EventBus): boolean {
  if (!isPositiveBig(state.bank.overdraft) || !isPositiveBig(state.res.money)) {
    return false;
  }

  const payment = Big.min(state.res.money, state.bank.overdraft);
  if (!spendBig(state.res.money, payment)) {
    return false;
  }

  Big.subIn(state.bank.overdraft, payment);
  if (!isPositiveBig(state.bank.overdraft)) {
    state.bank.overdraft.set(0, 0);
  }

  bus?.emit("res:changed", "money");
  return true;
}

export function syncBankThresholds(state: GameState, bus?: EventBus): boolean {
  let changed = false;
  const thresholds = getBankThresholds(state);

  if (state.bank.overdraft.gte(thresholds.warning1) && state.bank.warningsIssued < 1) {
    state.bank.warningsIssued = 1;
    changed = enqueueBankNotice(state, BANK_WARNING_1_EVENT, bus) || true;
  }

  if (state.bank.overdraft.gte(thresholds.warning2) && state.bank.warningsIssued < 2) {
    state.bank.warningsIssued = 2;
    changed = enqueueBankNotice(state, BANK_WARNING_2_EVENT, bus) || true;
  }

  if (state.bank.overdraft.gte(thresholds.default) && !state.bank.defaulted) {
    state.bank.defaulted = true;
    state.bank.defaultedAtS = state.meta.playtimeS;
    changed = enqueueBankNotice(state, BANK_DEFAULT_EVENT, bus) || true;
  }

  if (state.bank.overdraft.lt(thresholds.default) && state.bank.defaulted) {
    state.bank.defaulted = false;
    delete state.bank.defaultedAtS;
    changed = true;
  }

  return changed;
}

export function getBankThresholds(state: GameState): {
  readonly default: Big;
  readonly warning1: Big;
  readonly warning2: Big;
} {
  const scale = getBankThresholdScale(state);

  return {
    default: Big.mul(BANK_DEFAULT_THRESHOLD, scale),
    warning1: Big.mul(BANK_WARNING_1_THRESHOLD, scale),
    warning2: Big.mul(BANK_WARNING_2_THRESHOLD, scale)
  };
}

export function getBankWarningLevelForOverdraft(overdraft: Big): BankWarningLevel {
  if (overdraft.gte(BANK_WARNING_2_THRESHOLD)) {
    return 2;
  }

  if (overdraft.gte(BANK_WARNING_1_THRESHOLD)) {
    return 1;
  }

  return 0;
}

function enqueueBankNotice(state: GameState, eventId: string, bus?: EventBus): boolean {
  if (state.story.seen.has(eventId)) {
    return false;
  }

  state.story.inbox.push({ id: createInboxEntryId(state, eventId), eventId });
  state.story.seen.add(eventId);
  bus?.emit("story:message", { eventId });
  return true;
}

function getBankThresholdScale(state: GameState): Big {
  const scaledEra = Math.max(0, state.era - 2);
  if (scaledEra <= 0) {
    return Big.one();
  }

  return Big.fromLog10(scaledEra * BANK_THRESHOLD_LOG10_PER_ERA_AFTER_MUSE);
}

function createInboxEntryId(state: GameState, eventId: string): string {
  const usedIds = new Set(state.story.inbox.map((entry) => entry.id));
  let ordinal = state.story.inbox.length + 1;
  let id = `${eventId}.${ordinal}`;

  while (usedIds.has(id)) {
    ordinal += 1;
    id = `${eventId}.${ordinal}`;
  }

  return id;
}
