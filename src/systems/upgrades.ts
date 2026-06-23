import type { EventBus } from "../core/bus";
import { Big } from "../core/bignum";
import type { GameState } from "../core/state";
import { UPGRADES, getUpgrade, type UpgradeDefinition } from "../data/upgrades";
import { isDemoLocked } from "./demo";
import { calculateIterationCostMultiplier } from "./iteration";
import { recomputeDerivedCache, type DerivedCache } from "./production";
import { canSpendBig, spendBig } from "./resources";
import { checkCondition } from "./unlocks";

export interface BuyUpgradeResult {
  readonly cost: Big;
  readonly id: string;
  readonly ok: boolean;
  readonly reason?: "bought" | "demoLocked" | "locked" | "missing" | "unaffordable";
}

export type UpgradeState = "available" | "bought" | "locked" | "unaffordable";

export function getUpgradeCost(state: GameState, upgrade: UpgradeDefinition): Big {
  return Big.mul(upgrade.cost, calculateIterationCostMultiplier(state.prestige.iteration));
}

export function buyUpgrade(
  state: GameState,
  cache: DerivedCache,
  id: string,
  bus?: EventBus
): BuyUpgradeResult {
  const upgrade = getUpgrade(id);

  if (upgrade === undefined) {
    return { cost: Big.zero(), id, ok: false, reason: "missing" };
  }

  const cost = getUpgradeCost(state, upgrade);

  if (state.owned.upgrades.has(id)) {
    return { cost, id, ok: false, reason: "bought" };
  }

  if (isDemoLocked(state, upgrade)) {
    return { cost, id, ok: false, reason: "demoLocked" };
  }

  if (!isUpgradeUnlocked(state, upgrade)) {
    return { cost, id, ok: false, reason: "locked" };
  }

  if (!canSpendBig(state.res.money, cost)) {
    return { cost, id, ok: false, reason: "unaffordable" };
  }

  spendBig(state.res.money, cost);
  state.owned.upgrades.add(id);
  recomputeDerivedCache(state, cache);
  bus?.emit("res:changed", "money");
  bus?.emit("res:changed", "computeUsed");
  bus?.emit("bought", { kind: "upgrade", id });
  bus?.emit("production:changed", { locRate: cache.locRate });

  return { cost, id, ok: true };
}

export function getUpgradeState(state: GameState, upgrade: UpgradeDefinition): UpgradeState {
  if (state.owned.upgrades.has(upgrade.id)) {
    return "bought";
  }

  if (!isUpgradeUnlocked(state, upgrade)) {
    return "locked";
  }

  return canSpendBig(state.res.money, getUpgradeCost(state, upgrade))
    ? "available"
    : "unaffordable";
}

export function getVisibleUpgrades(state: GameState): readonly UpgradeDefinition[] {
  return UPGRADES.filter(
    (upgrade) => state.owned.upgrades.has(upgrade.id) || isUpgradeUnlocked(state, upgrade)
  );
}

function isUpgradeUnlocked(state: GameState, upgrade: UpgradeDefinition): boolean {
  return !isDemoLocked(state, upgrade) && checkCondition(state, upgrade.unlock);
}
