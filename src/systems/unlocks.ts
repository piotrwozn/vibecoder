import { Big } from "../core/bignum";
import type { GameState } from "../core/state";
import { REFACTOR_COMPLETED_STAT, type Condition } from "../data/conditions";
import { calculateDebtRatio } from "./debt";
import { calculateAvailableInsightGain } from "./prestige";
import { getActEnteredAtStatKey } from "./story";

export type UnlockVisibility = "hidden" | "unlocked";
export type { Condition };

const SHIPPED_STAT = "projects.shipped";
const HYPE_MAX_STAT = "hype.max";
const SECONDS_PER_MINUTE = 60;

export function checkCondition(state: GameState, condition: Condition): boolean {
  if (
    condition.all !== undefined &&
    !condition.all.every((entry) => checkCondition(state, entry))
  ) {
    return false;
  }

  if (condition.any !== undefined && !condition.any.some((entry) => checkCondition(state, entry))) {
    return false;
  }

  if (condition.era !== undefined && state.era < condition.era) {
    return false;
  }

  if (condition.debtGte !== undefined && state.res.debt.lt(Big.from(condition.debtGte))) {
    return false;
  }

  if (condition.moneyGte !== undefined && state.res.money.lt(Big.from(condition.moneyGte))) {
    return false;
  }

  if (
    condition.locLifetimeGte !== undefined &&
    state.lifetime.loc.lt(Big.from(condition.locLifetimeGte))
  ) {
    return false;
  }

  if (condition.rewritesGte !== undefined && state.prestige.rewrites < condition.rewritesGte) {
    return false;
  }

  if (condition.exitsGte !== undefined && state.prestige.exits < condition.exitsGte) {
    return false;
  }

  if (
    condition.shipCountGte !== undefined &&
    getNumericStat(state, SHIPPED_STAT) < condition.shipCountGte
  ) {
    return false;
  }

  if (
    condition.generatorGte !== undefined &&
    (state.owned.generators[condition.generatorGte.id] ?? 0) < condition.generatorGte.count
  ) {
    return false;
  }

  if (
    condition.generatorTotalGte !== undefined &&
    getTotalGeneratorCount(state) < condition.generatorTotalGte
  ) {
    return false;
  }

  if (condition.upgrade !== undefined && !state.owned.upgrades.has(condition.upgrade)) {
    return false;
  }

  if (condition.research !== undefined && !state.owned.research.has(condition.research)) {
    return false;
  }

  if (condition.hypeGte !== undefined && state.res.hype < condition.hypeGte) {
    return false;
  }

  if (
    condition.hypeMaxGte !== undefined &&
    Math.max(state.res.hype, getNumericStat(state, HYPE_MAX_STAT)) < condition.hypeMaxGte
  ) {
    return false;
  }

  if (condition.debtRatioGte !== undefined && calculateDebtRatio(state) < condition.debtRatioGte) {
    return false;
  }

  if (
    condition.refactorGte !== undefined &&
    getNumericStat(state, REFACTOR_COMPLETED_STAT) < condition.refactorGte
  ) {
    return false;
  }

  if (
    condition.insightGainGte !== undefined &&
    calculateAvailableInsightGain(state) < condition.insightGainGte
  ) {
    return false;
  }

  if (
    condition.insightNodesGte !== undefined &&
    state.owned.insightNodes.size < condition.insightNodesGte
  ) {
    return false;
  }

  if (
    condition.insightSinceExitGte !== undefined &&
    state.lifetime.insightSinceExit < condition.insightSinceExitGte
  ) {
    return false;
  }

  if (
    condition.productCountGte !== undefined &&
    state.projects.portfolio.length < condition.productCountGte
  ) {
    return false;
  }

  if (
    condition.projectShipped !== undefined &&
    getNumericStat(state, `project.${condition.projectShipped}.shipped`) <= 0
  ) {
    return false;
  }

  if (condition.seen !== undefined && !state.story.seen.has(condition.seen)) {
    return false;
  }

  if (condition.flag !== undefined && !state.story.flags.has(condition.flag)) {
    return false;
  }

  if (
    condition.timeInActMinGte !== undefined &&
    state.meta.playtimeS - getActEnteredAtS(state) < condition.timeInActMinGte * SECONDS_PER_MINUTE
  ) {
    return false;
  }

  if (condition.iterationGte !== undefined && state.prestige.iteration < condition.iterationGte) {
    return false;
  }

  return true;
}

export function getUnlockVisibility(state: GameState, condition?: Condition): UnlockVisibility {
  return condition === undefined || checkCondition(state, condition) ? "unlocked" : "hidden";
}

function getNumericStat(state: GameState, key: string): number {
  const value = state.stats[key];
  return typeof value === "number" ? value : 0;
}

function getActEnteredAtS(state: GameState): number {
  return getNumericStat(state, getActEnteredAtStatKey(state.story.act));
}

function getTotalGeneratorCount(state: GameState): number {
  return Object.values(state.owned.generators).reduce((sum, count) => sum + count, 0);
}
