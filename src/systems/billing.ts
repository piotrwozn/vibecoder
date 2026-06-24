import type { EventBus } from "../core/bus";
import { Big } from "../core/bignum";
import type { GameState } from "../core/state";
import { AURORA_HOSTING_PER_SERVER_S, AURORA_SERVER_COMPONENT_IDS } from "../data/aurora";
import { HARDWARE_POWER_RATES } from "../data/billing";
import { accrueBankOverdraft, repayBankOverdraft } from "./bank";
import { getIncidentEffects } from "./incidents";
import { getProjectHostingRate } from "./projects";
import type { DerivedCache } from "./production";
import { getSprintEffects } from "./roadmap";
import { isPositiveBig, isPositiveFinite, spendBig } from "./resources";
import { getRunStyleEffects } from "./run-styles";
import { getStoryDecisionEffects } from "./story-decisions";

export interface BillingBreakdown {
  readonly auroraHosting: Big;
  readonly auroraPower: Big;
  readonly hardwarePower: Big;
  readonly projectHosting: Big;
  readonly total: Big;
}

export const POWER_OVERDRAW_STAT = "billing.powerOverdrawAt";

export function createBillingBreakdown(state: GameState, cache?: DerivedCache): BillingBreakdown {
  const hardwarePower = getHardwarePowerRate(state);
  const auroraPower = getAuroraDedicatedPowerRate(state);
  const auroraHosting = getAuroraHostingRate(state);
  const projectHosting = cache === undefined ? Big.zero() : getProjectHostingRate(state, cache);

  return {
    auroraHosting,
    auroraPower,
    hardwarePower,
    projectHosting,
    total: Big.add(Big.add(Big.add(hardwarePower, auroraPower), auroraHosting), projectHosting)
  };
}

function getBillingRate(state: GameState, cache?: DerivedCache): Big {
  return createBillingBreakdown(state, cache).total;
}

export function getAuroraRecurringRate(state: GameState, cache?: DerivedCache): Big {
  const breakdown = createBillingBreakdown(state, cache);
  return Big.add(breakdown.auroraPower, breakdown.auroraHosting);
}

export function getNetMoneyRate(grossIncome: Big, state: GameState, cache?: DerivedCache): Big {
  return Big.sub(grossIncome, getBillingRate(state, cache));
}

export function tickBilling(state: GameState, dtS: number, bus?: EventBus): boolean;
export function tickBilling(
  state: GameState,
  cache: DerivedCache,
  dtS: number,
  bus?: EventBus
): boolean;
export function tickBilling(
  state: GameState,
  cacheOrDtS: DerivedCache | number,
  dtSOrBus?: EventBus | number,
  maybeBus?: EventBus
): boolean {
  const cache = typeof cacheOrDtS === "number" ? undefined : cacheOrDtS;
  const dtS = typeof cacheOrDtS === "number" ? cacheOrDtS : (dtSOrBus as number);
  const bus = typeof cacheOrDtS === "number" ? (dtSOrBus as EventBus | undefined) : maybeBus;
  if (!isPositiveFinite(dtS)) {
    return false;
  }

  let changed = repayBankOverdraft(state, bus);
  const previousAuroraBillingPaused = state.aurora.billingPaused;
  const breakdown = createBillingBreakdown(state, cache);
  const fullHardwareBill = Big.mul(breakdown.hardwarePower, Big.fromNumber(dtS));
  const hardwareWasPaused = state.stats[POWER_OVERDRAW_STAT] !== undefined;
  const hardwareBill =
    hardwareWasPaused && state.res.money.lt(fullHardwareBill) ? Big.zero() : fullHardwareBill;
  const fullAuroraBill = Big.mul(
    Big.add(breakdown.auroraPower, breakdown.auroraHosting),
    Big.fromNumber(dtS)
  );
  const moneyAfterHardwareGrace = Big.max(Big.zero(), Big.sub(state.res.money, hardwareBill));
  const auroraBill =
    isPositiveBig(fullAuroraBill) && moneyAfterHardwareGrace.lt(fullAuroraBill)
      ? Big.zero()
      : fullAuroraBill;
  const projectHostingBill = Big.mul(breakdown.projectHosting, Big.fromNumber(dtS));
  const totalBill = Big.add(Big.add(hardwareBill, auroraBill), projectHostingBill);
  const moneyBeforePayment = state.res.money.copy();
  const unpaidHardware = Big.max(Big.zero(), Big.sub(hardwareBill, moneyBeforePayment));
  const hardwarePaused =
    isPositiveBig(unpaidHardware) ||
    (hardwareWasPaused && hardwareBill.eq0() && isPositiveBig(fullHardwareBill));
  const auroraBillingPaused = isPositiveBig(fullAuroraBill) && auroraBill.eq0();

  if (hardwarePaused) {
    state.stats[POWER_OVERDRAW_STAT] = state.stats[POWER_OVERDRAW_STAT] ?? state.meta.playtimeS;
  } else {
    delete state.stats[POWER_OVERDRAW_STAT];
  }

  state.aurora.billingPaused = auroraBillingPaused;
  changed = changed || previousAuroraBillingPaused !== auroraBillingPaused;

  if (!isPositiveBig(totalBill)) {
    return changed || hardwarePaused || auroraBillingPaused;
  }

  const paid = Big.min(state.res.money, totalBill);
  if (isPositiveBig(paid) && spendBig(state.res.money, paid)) {
    bus?.emit("res:changed", "money");
    changed = true;
  }

  const unpaidBill = Big.sub(totalBill, paid);
  if (isPositiveBig(unpaidBill)) {
    changed = accrueBankOverdraft(state, unpaidBill, bus) || changed;
  }

  return changed || hardwarePaused || auroraBillingPaused;
}

function getHardwarePowerRate(state: GameState): Big {
  let rate = Big.zero();

  for (const entry of HARDWARE_POWER_RATES) {
    const level = state.owned.hardware[entry.hardwareId] ?? 0;
    if (level > 0) {
      rate = Big.add(rate, Big.mul(entry.ratePerLevel, Big.fromNumber(level)));
    }
  }

  return rate;
}

export function getAuroraDedicatedServerPowerRate(): Big {
  let rate = Big.zero();

  for (const hardwareId of AURORA_SERVER_COMPONENT_IDS) {
    const entry = HARDWARE_POWER_RATES.find((candidate) => candidate.hardwareId === hardwareId);
    if (entry !== undefined) {
      rate = Big.add(rate, entry.ratePerLevel);
    }
  }

  return rate;
}

export function getHardwarePowerRatePerLevel(hardwareId: string): Big {
  return (
    HARDWARE_POWER_RATES.find((candidate) => candidate.hardwareId === hardwareId)?.ratePerLevel ??
    Big.zero()
  );
}

function getAuroraDedicatedPowerRate(state: GameState): Big {
  if (state.aurora.completed || state.aurora.dedicatedServers <= 0) {
    return Big.zero();
  }

  return Big.mul(
    Big.mul(getAuroraDedicatedServerPowerRate(), Big.fromNumber(state.aurora.dedicatedServers)),
    Big.fromNumber(getAuroraBillingMultiplier(state))
  );
}

function getAuroraHostingRate(state: GameState): Big {
  if (state.aurora.completed || state.aurora.hostedServers <= 0) {
    return Big.zero();
  }

  return Big.mul(
    Big.mul(AURORA_HOSTING_PER_SERVER_S, Big.fromNumber(state.aurora.hostedServers)),
    Big.fromNumber(getAuroraBillingMultiplier(state))
  );
}

function getAuroraBillingMultiplier(state: GameState): number {
  return (
    getIncidentEffects(state).auroraBillingMultiplier *
    getSprintEffects(state).auroraBillingMultiplier *
    getRunStyleEffects(state).auroraBillingMultiplier *
    getStoryDecisionEffects(state).auroraBillingMultiplier
  );
}
