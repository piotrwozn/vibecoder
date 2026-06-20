import type { EventBus } from "../core/bus";
import { Big } from "../core/bignum";
import type { GameState } from "../core/state";
import { C, PRESTIGE } from "../data/constants";
import { GENERATORS } from "../data/generators";
import { fixBug, getBugSpawnedAtStatKey } from "./debt";
import { buyGenerator, isGeneratorUnlocked, type DerivedCache } from "./production";
import {
  calculateAvailableInsightGain,
  calculateRewriteRequirement,
  getOwnedParadoxRuleSlots,
  performRewrite
} from "./prestige";

export const AUTO_PROMPT_ID = "autoPrompt";
export const AUTO_FIX_ID = "autoFix";
export const AUTO_REWRITE_ID = "autoRewrite";
export const AUTO_BUY_PREFIX = "autoBuy:";

const AUTO_REWRITE_RULES = [
  { id: AUTO_REWRITE_ID, requiredSlots: 1, thresholdMultiplier: 1 },
  {
    id: `${AUTO_REWRITE_ID}:surplus`,
    requiredSlots: 2,
    thresholdMultiplier: PRESTIGE.PARADOX_BASE
  },
  {
    id: `${AUTO_REWRITE_ID}:deep`,
    requiredSlots: 3,
    thresholdMultiplier: PRESTIGE.PARADOX_BASE ** 2
  }
] as const;

export interface AutomationToggle {
  readonly enabled: boolean;
  readonly id: string;
  readonly unlocked: boolean;
}

export function getAutoBuyRuleId(generatorId: string): string {
  return `${AUTO_BUY_PREFIX}${generatorId}`;
}

export function getAutoRewriteRuleMultiplier(id: string): number | undefined {
  return AUTO_REWRITE_RULES.find((rule) => rule.id === id)?.thresholdMultiplier;
}

export function isAutoRewriteRuleId(id: string): boolean {
  return getAutoRewriteRuleMultiplier(id) !== undefined;
}

export function isAutomationEnabled(state: GameState, id: string): boolean {
  return state.automation[id]?.enabled === true;
}

export function setAutomationEnabled(state: GameState, id: string, enabled: boolean): void {
  state.automation[id] = { enabled };
}

export function tickAutomation(
  state: GameState,
  cache: DerivedCache,
  dtS: number,
  bus?: EventBus
): boolean {
  let changed = tickAutoPrompt(state, cache, dtS, bus);
  changed = tickAutoBuy(state, cache, bus) || changed;
  changed = tickAutoFix(state, cache, bus) || changed;
  changed = tickAutoRewrite(state, cache, bus) || changed;
  return changed;
}

export function getAutomationToggles(
  state: GameState,
  cache: DerivedCache
): readonly AutomationToggle[] {
  const toggles: AutomationToggle[] = [
    {
      id: AUTO_PROMPT_ID,
      enabled: isAutomationEnabled(state, AUTO_PROMPT_ID),
      unlocked: cache.automation.autoPrompt
    }
  ];

  for (const generator of GENERATORS) {
    if (!isGeneratorUnlocked(state, generator)) {
      continue;
    }

    const id = getAutoBuyRuleId(generator.id);
    toggles.push({
      id,
      enabled: isAutomationEnabled(state, id),
      unlocked: cache.automation.autoBuy
    });
  }

  toggles.push({
    id: AUTO_FIX_ID,
    enabled: isAutomationEnabled(state, AUTO_FIX_ID),
    unlocked: cache.automation.autoFix
  });

  const ruleSlots = getOwnedParadoxRuleSlots(state);
  for (const rule of AUTO_REWRITE_RULES) {
    toggles.push({
      id: rule.id,
      enabled: isAutomationEnabled(state, rule.id),
      unlocked: ruleSlots >= rule.requiredSlots
    });
  }

  return toggles;
}

function tickAutoPrompt(
  state: GameState,
  cache: DerivedCache,
  dtS: number,
  bus?: EventBus
): boolean {
  if (
    !cache.automation.autoPrompt ||
    !isAutomationEnabled(state, AUTO_PROMPT_ID) ||
    cache.locRate.eq0()
  ) {
    return false;
  }

  const loc = Big.mul(cache.locRate, Big.fromNumber(cache.automation.autoPromptRate * dtS));

  if (loc.eq0()) {
    return false;
  }

  Big.addIn(state.res.loc, loc);
  Big.addIn(state.lifetime.loc, loc);
  Big.addIn(state.lifetime.locSinceExit, loc);
  bus?.emit("res:changed", "loc");
  return true;
}

function tickAutoBuy(state: GameState, cache: DerivedCache, bus?: EventBus): boolean {
  if (!cache.automation.autoBuy) {
    return false;
  }

  let changed = false;
  const reserveFloor = Big.mul(state.res.money, Big.fromNumber(C.AUTO_BUY_KEEP_CASH_RATIO));

  for (const generator of GENERATORS) {
    const ruleId = getAutoBuyRuleId(generator.id);

    if (!isAutomationEnabled(state, ruleId) || !isGeneratorUnlocked(state, generator)) {
      continue;
    }

    const spendBudget = Big.sub(state.res.money, reserveFloor);
    if (spendBudget.lte(Big.zero())) {
      break;
    }

    const result = buyGenerator(state, cache, generator.id, "max", bus, spendBudget);
    changed = result.ok || changed;
  }

  return changed;
}

function tickAutoFix(state: GameState, cache: DerivedCache, bus?: EventBus): boolean {
  if (
    !cache.automation.autoFix ||
    !isAutomationEnabled(state, AUTO_FIX_ID) ||
    state.bugs.length === 0
  ) {
    return false;
  }

  let changed = false;

  for (const bug of [...state.bugs]) {
    const statKey = getBugSpawnedAtStatKey(bug.productId);
    const seenAt = state.stats[statKey];

    if (typeof seenAt !== "number") {
      state.stats[statKey] = state.meta.playtimeS;
      continue;
    }

    if (state.meta.playtimeS - seenAt < cache.automation.autoFixDelayS) {
      continue;
    }

    const result = fixBug(state, bug.productId, bus);
    changed = result.ok || changed;
  }

  return changed;
}

function tickAutoRewrite(state: GameState, cache: DerivedCache, bus?: EventBus): boolean {
  const ruleSlots = getOwnedParadoxRuleSlots(state);
  if (ruleSlots <= 0) {
    return false;
  }

  const availableInsight = calculateAvailableInsightGain(state);
  const requiredInsight = calculateRewriteRequirement(state);

  for (const rule of AUTO_REWRITE_RULES) {
    if (
      ruleSlots >= rule.requiredSlots &&
      isAutomationEnabled(state, rule.id) &&
      availableInsight >= requiredInsight * rule.thresholdMultiplier
    ) {
      return performRewrite(state, cache, bus).ok;
    }
  }

  return false;
}
