import type { EventBus } from "../core/bus";
import { Big } from "../core/bignum";
import type { GameState } from "../core/state";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_LOC_BONUS,
  type AchievementCondition,
  type AchievementDefinition
} from "../data/achievements";
import { RESEARCH } from "../data/research";
import type { DerivedCache } from "./production";

export interface AchievementState {
  readonly definition: AchievementDefinition;
  readonly unlocked: boolean;
  readonly unlockedAtS?: number;
}

const ACHIEVEMENT_STAT_PREFIX = "achievements.";
const ACHIEVEMENT_UNLOCKED_SUFFIX = ".unlockedAt";
const FLOW_ACTIVE_SINCE_STAT = "achievements.flow.activeSince";
const FULL_RESEARCH_BRANCH_SIZE = 10;

type CompiledAchievementCondition =
  | {
      readonly kind: "bigStatGte";
      readonly stat: "lifetime.loc" | "lifetime.money";
      readonly value: Big;
    }
  | { readonly kind: "ending"; readonly choice: "fork" | "merge" | "unplug" }
  | { readonly kind: "eraGte"; readonly value: number }
  | { readonly kind: "exitsGte"; readonly value: number }
  | { readonly kind: "flowActiveFor"; readonly seconds: number }
  | { readonly kind: "generatorTotalGte"; readonly value: number }
  | { readonly kind: "hypeAtCap" }
  | { readonly kind: "iterationsGte"; readonly value: number }
  | { readonly kind: "researchAll" }
  | { readonly kind: "researchCountGte"; readonly value: number }
  | { readonly kind: "researchFullBranch" }
  | { readonly kind: "rewritesGte"; readonly value: number }
  | {
      readonly kind: "statGte";
      readonly stat: "bugs.fixed" | "projects.refactored" | "projects.shipped";
      readonly value: number;
    }
  | { readonly kind: "zeroDebtWithLifetimeLoc"; readonly value: Big };

interface CompiledAchievement {
  readonly condition: CompiledAchievementCondition;
  readonly definition: AchievementDefinition;
}

const COMPILED_ACHIEVEMENTS = ACHIEVEMENTS.map(
  (definition): CompiledAchievement => ({
    condition: compileCondition(definition.condition),
    definition
  })
);

const RESEARCH_BRANCH_IDS = ["throughput", "quality", "automation"].map((branch) =>
  RESEARCH.filter((research) => research.branch === branch).map((research) => research.id)
);

export function tickAchievements(
  state: GameState,
  cache: Pick<DerivedCache, "hype">,
  bus?: EventBus
): boolean {
  updateFlowActiveSince(state);

  let unlockedAny = false;

  for (const achievement of COMPILED_ACHIEVEMENTS) {
    if (isAchievementUnlocked(state, achievement.definition.id)) {
      continue;
    }

    if (!isAchievementConditionMet(state, cache, achievement.condition)) {
      continue;
    }

    state.stats[getAchievementStatKey(achievement.definition.id)] = state.meta.playtimeS;
    bus?.emit("unlock", { id: achievement.definition.id, kind: "achievement" });
    unlockedAny = true;
  }

  return unlockedAny;
}

export function getAchievementStates(state: GameState): readonly AchievementState[] {
  return ACHIEVEMENTS.map((definition) => {
    const unlockedAtS = getAchievementUnlockedAtS(state, definition.id);
    return {
      definition,
      unlocked: unlockedAtS !== undefined,
      unlockedAtS
    };
  });
}

export function getUnlockedAchievementCount(state: GameState): number {
  return ACHIEVEMENTS.reduce(
    (count, achievement) => count + (isAchievementUnlocked(state, achievement.id) ? 1 : 0),
    0
  );
}

export function calculateAchievementMultiplier(state: GameState): number {
  return 1 + getUnlockedAchievementCount(state) * ACHIEVEMENT_LOC_BONUS;
}

export function getAchievementStatKey(id: string): string {
  return `${ACHIEVEMENT_STAT_PREFIX}${id}${ACHIEVEMENT_UNLOCKED_SUFFIX}`;
}

function isAchievementUnlocked(state: GameState, id: string): boolean {
  return getAchievementUnlockedAtS(state, id) !== undefined;
}

function getAchievementUnlockedAtS(state: GameState, id: string): number | undefined {
  const value = state.stats[getAchievementStatKey(id)];
  return typeof value === "number" ? value : undefined;
}

function isAchievementConditionMet(
  state: GameState,
  cache: Pick<DerivedCache, "hype">,
  condition: CompiledAchievementCondition
): boolean {
  switch (condition.kind) {
    case "bigStatGte":
      return getBigAchievementStat(state, condition.stat).gte(condition.value);
    case "ending":
      return (
        state.prestige.endingChoice === condition.choice ||
        state.story.flags.has(`achievement.ending_${condition.choice}`)
      );
    case "eraGte":
      return state.era >= condition.value;
    case "exitsGte":
      return state.prestige.exits >= condition.value;
    case "flowActiveFor":
      return getFlowActiveForS(state) >= condition.seconds;
    case "generatorTotalGte":
      return getTotalGeneratorCount(state) >= condition.value;
    case "hypeAtCap":
      return state.res.hype >= cache.hype.cap;
    case "iterationsGte":
      return state.prestige.iteration >= condition.value;
    case "researchAll":
      return state.owned.research.size >= RESEARCH.length;
    case "researchCountGte":
      return state.owned.research.size >= condition.value;
    case "researchFullBranch":
      return hasFullResearchBranch(state);
    case "rewritesGte":
      return state.prestige.rewrites >= condition.value;
    case "statGte":
      return getNumericStat(state, condition.stat) >= condition.value;
    case "zeroDebtWithLifetimeLoc":
      return state.res.debt.eq0() && state.lifetime.loc.gt(condition.value);
  }
}

function compileCondition(condition: AchievementCondition): CompiledAchievementCondition {
  switch (condition.kind) {
    case "bigStatGte":
      return { ...condition, value: Big.from(condition.value) };
    case "zeroDebtWithLifetimeLoc":
      return { ...condition, value: Big.from(condition.value) };
    default:
      return condition;
  }
}

function updateFlowActiveSince(state: GameState): void {
  if (state.flow.activeUntil <= state.meta.playtimeS) {
    delete state.stats[FLOW_ACTIVE_SINCE_STAT];
    return;
  }

  if (typeof state.stats[FLOW_ACTIVE_SINCE_STAT] !== "number") {
    state.stats[FLOW_ACTIVE_SINCE_STAT] = state.meta.playtimeS;
  }
}

function getFlowActiveForS(state: GameState): number {
  const activeSince = state.stats[FLOW_ACTIVE_SINCE_STAT];

  if (typeof activeSince !== "number" || state.flow.activeUntil <= state.meta.playtimeS) {
    return 0;
  }

  return state.meta.playtimeS - activeSince;
}

function getBigAchievementStat(state: GameState, key: "lifetime.loc" | "lifetime.money"): Big {
  switch (key) {
    case "lifetime.loc":
      return state.lifetime.loc;
    case "lifetime.money":
      return state.lifetime.money;
  }
}

function getNumericStat(state: GameState, key: string): number {
  const value = state.stats[key];
  return typeof value === "number" ? value : 0;
}

function getTotalGeneratorCount(state: GameState): number {
  let total = 0;

  for (const id in state.owned.generators) {
    total += state.owned.generators[id] ?? 0;
  }

  return total;
}

function hasFullResearchBranch(state: GameState): boolean {
  for (const branchIds of RESEARCH_BRANCH_IDS) {
    let owned = 0;

    for (const id of branchIds) {
      if (state.owned.research.has(id)) {
        owned += 1;
      }
    }

    if (owned >= FULL_RESEARCH_BRANCH_SIZE) {
      return true;
    }
  }

  return false;
}
