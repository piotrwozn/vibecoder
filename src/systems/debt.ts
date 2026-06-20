import type { EventBus } from "../core/bus";
import { Big } from "../core/bignum";
import { nextRandom, nextRandomIndex } from "../core/rng";
import type { GameState, Product } from "../core/state";
import { C } from "../data/constants";
import { GENERATORS } from "../data/generators";
import { getProject } from "./projects";
import type { DerivedCache } from "./production";

const BUGS_FIXED_STAT = "bugs.fixed";
const BUG_SPAWNED_AT_PREFIX = "bugs.spawnedAt.";
const INCIDENT_EVENT_IDS = [
  "a2_06_demo_day_incident",
  "a3_09_incident_two",
  "a4_04_codebase_dreams"
] as const;

export interface FixBugResult {
  readonly ok: boolean;
  readonly productId: string;
  readonly reason?: "missing" | "not-bugged";
}

export interface IncidentTickResult {
  readonly active: boolean;
  readonly triggered: boolean;
}

export function tickDebt(
  state: GameState,
  cache: DerivedCache,
  dtS: number,
  bus?: EventBus
): boolean {
  let changed = accrueDebt(state, cache, dtS, bus);
  changed = rollBugChecks(state, cache, dtS, bus) || changed;
  return changed;
}

export function calculateDebtEfficiency(state: GameState): number {
  const ratio = calculateDebtRatio(state);
  return 1 / (1 + ratio) ** C.DEBT_EFF_EXP;
}

export function calculateDebtRatio(state: GameState): number {
  const d0 = calculateDebtD0(state);
  return Big.div(state.res.debt, Big.fromNumber(d0)).toNumber();
}

export function calculateDebtD0(state: GameState): number {
  const eraMultiplier = C.ERA_MULT ** (state.era - 1);
  return C.DEBT_D0_BASE * eraMultiplier ** 2;
}

export function fixBug(state: GameState, productId: string, bus?: EventBus): FixBugResult {
  const productIndex = state.projects.portfolio.findIndex((product) => product.id === productId);

  if (productIndex < 0) {
    return { ok: false, productId, reason: "missing" };
  }

  const product = state.projects.portfolio[productIndex];
  if (product === undefined || !product.bugged) {
    return { ok: false, productId, reason: "not-bugged" };
  }

  state.projects.portfolio[productIndex] = { ...product, bugged: false };
  state.bugs = state.bugs.filter((bug) => bug.productId !== productId);
  delete state.stats[`${BUG_SPAWNED_AT_PREFIX}${productId}`];
  state.stats[BUGS_FIXED_STAT] = getNumericStat(state, BUGS_FIXED_STAT) + 1;
  bus?.emit("bug:fixed", { productId });
  return { ok: true, productId };
}

export function tickIncidents(state: GameState): IncidentTickResult {
  return { active: hasPendingIncident(state), triggered: false };
}

export function hasPendingIncident(state: GameState): boolean {
  return INCIDENT_EVENT_IDS.some(
    (eventId) => state.story.seen.has(eventId) && state.story.choices[eventId] === undefined
  );
}

export function getBugSpawnedAtStatKey(productId: string): string {
  return `${BUG_SPAWNED_AT_PREFIX}${productId}`;
}

function accrueDebt(state: GameState, cache: DerivedCache, dtS: number, bus?: EventBus): boolean {
  const gain = cache.locRate.eq0()
    ? Big.zero()
    : Big.mul(
        Big.mul(cache.locRate, Big.fromNumber(cache.debt.factor * (1 - cache.debt.quality))),
        Big.fromNumber(dtS)
      );
  const nextDebt = Big.add(state.res.debt, gain);
  const reductionRate = getPassiveDebtReductionRate(state, cache);

  if (reductionRate > 0 && !nextDebt.eq0()) {
    const reduction = Big.mul(nextDebt, Big.fromNumber(Math.min(1, reductionRate * dtS)));
    if (reduction.gte(nextDebt)) {
      nextDebt.set(0, 0);
    } else {
      Big.subIn(nextDebt, reduction);
    }
  }

  if (nextDebt.eq(state.res.debt)) {
    return false;
  }

  state.res.debt = nextDebt;
  bus?.emit("res:changed", "debt");
  bus?.emit("production:changed", { locRate: cache.locRate });
  return true;
}

function getPassiveDebtReductionRate(state: GameState, cache: DerivedCache): number {
  let rate = 0;

  for (const generator of GENERATORS) {
    if (generator.debtReductionPerSecond === undefined) {
      continue;
    }

    rate +=
      (state.owned.generators[generator.id] ?? 0) *
      generator.debtReductionPerSecond *
      cache.project.qaMultiplier;
  }

  return rate;
}

function rollBugChecks(
  state: GameState,
  cache: DerivedCache,
  dtS: number,
  bus?: EventBus
): boolean {
  const previousS = Math.max(0, state.meta.playtimeS - dtS);
  const previousCheck = Math.floor(previousS / C.BUG_CHECK_INTERVAL);
  const currentCheck = Math.floor(state.meta.playtimeS / C.BUG_CHECK_INTERVAL);
  let changed = false;

  for (let check = previousCheck + 1; check <= currentCheck; check += 1) {
    changed = trySpawnBug(state, cache, bus) || changed;
  }

  return changed;
}

function trySpawnBug(state: GameState, cache: DerivedCache, bus?: EventBus): boolean {
  if (state.bugs.length >= C.BUG_MAX_ACTIVE) {
    return false;
  }

  const candidates = getBugCandidates(state.projects.portfolio);
  if (candidates.length === 0) {
    return false;
  }

  const probability = Math.min(
    cache.debt.bugChanceCap,
    (calculateDebtRatio(state) / 20) * cache.debt.bugChanceMultiplier
  );
  const roll = nextRandom(state.rngSeed);
  state.rngSeed = roll.seed;

  if (roll.value >= probability) {
    return false;
  }

  const selected = nextRandomIndex(state.rngSeed, candidates.length);
  state.rngSeed = selected.seed;
  const product = candidates[selected.index];

  if (product === undefined) {
    return false;
  }

  const productIndex = state.projects.portfolio.findIndex((entry) => entry.id === product.id);
  if (productIndex < 0) {
    return false;
  }

  state.projects.portfolio[productIndex] = { ...product, bugged: true };
  state.bugs.push({ productId: product.id });
  state.stats[getBugSpawnedAtStatKey(product.id)] = state.meta.playtimeS;
  bus?.emit("bug:spawned", { productId: product.id });
  return true;
}

function getBugCandidates(portfolio: readonly Product[]): Product[] {
  return portfolio.filter((product) => {
    const project = getProject(product.projectId);
    return !product.bugged && project?.bugResistant !== true;
  });
}

function getNumericStat(state: GameState, key: string): number {
  const value = state.stats[key];
  return typeof value === "number" ? value : 0;
}
