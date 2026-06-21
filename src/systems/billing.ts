import type { EventBus } from "../core/bus";
import { Big } from "../core/bignum";
import type { GameState } from "../core/state";
import { AURORA_HOSTING_PER_SERVER_S, AURORA_SERVER_COMPONENT_IDS } from "../data/aurora";
import { HARDWARE_POWER_RATES } from "../data/billing";

export interface BillingBreakdown {
  readonly auroraHosting: Big;
  readonly auroraPower: Big;
  readonly hardwarePower: Big;
  readonly total: Big;
}

export function createBillingBreakdown(state: GameState): BillingBreakdown {
  const hardwarePower = getHardwarePowerRate(state);
  const auroraPower = getAuroraDedicatedPowerRate(state);
  const auroraHosting = getAuroraHostingRate(state);

  return {
    auroraHosting,
    auroraPower,
    hardwarePower,
    total: Big.add(Big.add(hardwarePower, auroraPower), auroraHosting)
  };
}

export function getBillingRate(state: GameState): Big {
  return createBillingBreakdown(state).total;
}

export function getAuroraRecurringRate(state: GameState): Big {
  const breakdown = createBillingBreakdown(state);
  return Big.add(breakdown.auroraPower, breakdown.auroraHosting);
}

export function getNetMoneyRate(grossIncome: Big, state: GameState): Big {
  return Big.sub(grossIncome, getBillingRate(state));
}

export function tickBilling(state: GameState, dtS: number, bus?: EventBus): boolean {
  const breakdown = createBillingBreakdown(state);
  const bill = Big.mul(breakdown.total, Big.fromNumber(dtS));
  const auroraBill = Big.mul(
    Big.add(breakdown.auroraPower, breakdown.auroraHosting),
    Big.fromNumber(dtS)
  );
  const auroraBillingPaused = auroraBill.gt(Big.zero()) && state.res.money.lt(auroraBill);

  state.aurora.billingPaused = auroraBillingPaused;

  if (bill.eq0() || state.res.money.eq0()) {
    return auroraBillingPaused;
  }

  const paid = Big.min(state.res.money, bill);
  Big.subIn(state.res.money, paid);
  bus?.emit("res:changed", "money");
  return true;
}

export function getHardwarePowerRate(state: GameState): Big {
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
  if (state.aurora.dedicatedServers <= 0) {
    return Big.zero();
  }

  return Big.mul(
    getAuroraDedicatedServerPowerRate(),
    Big.fromNumber(state.aurora.dedicatedServers)
  );
}

function getAuroraHostingRate(state: GameState): Big {
  if (state.aurora.hostedServers <= 0) {
    return Big.zero();
  }

  return Big.mul(AURORA_HOSTING_PER_SERVER_S, Big.fromNumber(state.aurora.hostedServers));
}
