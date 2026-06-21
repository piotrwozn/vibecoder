import type { EventBus } from "../core/bus";
import { Big } from "../core/bignum";
import type { GameState } from "../core/state";
import { PRESTIGE } from "../data/constants";
import { STARTING_ERA } from "../data/eras";
import { GENERATORS } from "../data/generators";
import {
  EQUITY_PERKS,
  INSIGHT_NODES,
  PARADOX_ITEMS,
  RUN_MODIFIERS,
  getEquityPerk,
  getInsightNode,
  getParadoxItem,
  getRunModifier,
  type EquityPerkDefinition,
  type EquityPerkState,
  type InsightEffect,
  type InsightNodeDefinition,
  type ParadoxItemDefinition,
  type ParadoxItemState,
  type RunModifierDefinition,
  type RunModifierId
} from "../data/prestige";
import { recomputeComputeCap } from "./compute";
import {
  calculateParadoxGain,
  getIterationSoftcapThreshold,
  isIterationUnlocked
} from "./iteration";
import { refreshProjectBoard } from "./projects";
import { recomputeDerivedCache, type DerivedCache } from "./production";

export type InsightNodeState = "available" | "bought" | "locked" | "unaffordable";

export const ANGEL_NETWORK_UNTIL_STAT = "prestige.angelNetworkUntil";
export const ACTIVE_RUN_MODIFIER_PREFIX = "prestige.runModifier.active.";
export const NEXT_RUN_MODIFIER_PREFIX = "prestige.runModifier.next.";

export interface BuyInsightNodeResult {
  readonly costInsight: number;
  readonly id: string;
  readonly ok: boolean;
  readonly reason?: "bought" | "locked" | "missing" | "unaffordable";
}

export interface RewritePreview {
  readonly availableInsight: number;
  readonly canRewrite: boolean;
  readonly currentMultiplier: number;
  readonly insightAfter: Big;
  readonly lostAgents: number;
  readonly lostHardware: number;
  readonly lostLoc: Big;
  readonly lostMoney: Big;
  readonly lostProducts: number;
  readonly lostUpgrades: number;
  readonly requiredInsight: number;
  readonly speedup: number;
  readonly startEra: number;
  readonly startGenerators: Readonly<Record<string, number>>;
  readonly startMoney: Big;
  readonly targetMultiplier: number;
}

export interface RewriteResult {
  readonly gain: number;
  readonly ok: boolean;
  readonly preview: RewritePreview;
  readonly reason?: "threshold";
}

export interface ExitPreview {
  readonly canExit: boolean;
  readonly currentEquity: number;
  readonly currentMultiplier: number;
  readonly equityAfter: number;
  readonly gain: number;
  readonly requiredInsight: number;
  readonly rewardMultiplier: number;
  readonly targetMultiplier: number;
  readonly totalInsightEarned: number;
}

export interface ExitResult {
  readonly gain: number;
  readonly ok: boolean;
  readonly preview: ExitPreview;
  readonly reason?: "locked" | "threshold";
}

export interface BuyEquityPerkResult {
  readonly costEquity: number;
  readonly id: string;
  readonly ok: boolean;
  readonly reason?: "bought" | "locked" | "missing" | "unaffordable";
}

export interface SelectRunModifierResult {
  readonly id?: RunModifierId;
  readonly ok: boolean;
  readonly reason?: "locked" | "missing";
}

export interface IterationPreview {
  readonly canIterate: boolean;
  readonly currentIteration: number;
  readonly currentMultiplier: number;
  readonly currentParadox: number;
  readonly holdRequiredS: number;
  readonly holdS: number;
  readonly locRate: Big;
  readonly nextIteration: number;
  readonly paradoxAfter: number;
  readonly paradoxGain: number;
  readonly softcapThreshold: Big;
  readonly targetMultiplier: number;
  readonly unlocked: boolean;
}

export interface IterationResult {
  readonly gain: number;
  readonly ok: boolean;
  readonly preview: IterationPreview;
  readonly reason?: "locked" | "threshold";
}

export interface BuyParadoxItemResult {
  readonly costParadox: number;
  readonly id: string;
  readonly ok: boolean;
  readonly reason?: "bought" | "locked" | "missing" | "unaffordable";
}

export const REWRITE_BOOT_S = 3;
export const REWRITE_BOOT_UNTIL_STAT = "prestige.rewriteBootUntil";
export const ITERATION_HOLD_STAT = "prestige.iterationHoldS";

type PrestigeResetLayer = "exit" | "iteration" | "rewrite";

const PROJECT_STARTED_STAT = "projects.started";
const PROJECT_STARTED_PREFIX = "project.started.";
const BUG_SPAWNED_AT_PREFIX = "bugs.spawnedAt.";
const LOC_RATE_SAMPLE_PREFIX = "stats.locRate.sample.";
const LOC_RATE_SAMPLE_COUNT_STAT = "stats.locRate.sampleCount";
const LOC_RATE_SAMPLE_INDEX_STAT = "stats.locRate.sampleIndex";
const LOC_RATE_SAMPLE_LAST_AT_STAT = "stats.locRate.lastSampleAt";
const RUN_STAT_RESET_KEYS = [
  PROJECT_STARTED_STAT,
  LOC_RATE_SAMPLE_COUNT_STAT,
  LOC_RATE_SAMPLE_INDEX_STAT,
  LOC_RATE_SAMPLE_LAST_AT_STAT
] as const;
const RUN_STAT_RESET_PREFIXES = [
  BUG_SPAWNED_AT_PREFIX,
  PROJECT_STARTED_PREFIX,
  LOC_RATE_SAMPLE_PREFIX
] as const;
const RESET_LAYER_STAT_KEYS: Readonly<Record<PrestigeResetLayer, readonly string[]>> = {
  exit: [ITERATION_HOLD_STAT, REWRITE_BOOT_UNTIL_STAT],
  iteration: [ANGEL_NETWORK_UNTIL_STAT, ITERATION_HOLD_STAT, REWRITE_BOOT_UNTIL_STAT],
  rewrite: []
};
export const PARADOX_ECHO_FLAG_PREFIX = "paradox.echo.";

export function getInsightTree(): readonly InsightNodeDefinition[] {
  return INSIGHT_NODES;
}

export function getEquityPerks(): readonly EquityPerkDefinition[] {
  return EQUITY_PERKS;
}

export function getRunModifiers(): readonly RunModifierDefinition[] {
  return RUN_MODIFIERS;
}

export function getParadoxItems(): readonly ParadoxItemDefinition[] {
  return PARADOX_ITEMS;
}

export function buyInsightNode(
  state: GameState,
  cache: DerivedCache,
  id: string,
  bus?: EventBus
): BuyInsightNodeResult {
  const node = getInsightNode(id);

  if (node === undefined) {
    return { costInsight: 0, id, ok: false, reason: "missing" };
  }

  if (state.owned.insightNodes.has(id)) {
    return { costInsight: node.costInsight, id, ok: false, reason: "bought" };
  }

  if (!isInsightNodeUnlocked(state, node)) {
    return { costInsight: node.costInsight, id, ok: false, reason: "locked" };
  }

  const cost = Big.fromNumber(node.costInsight);
  if (state.res.insight.lt(cost)) {
    return { costInsight: node.costInsight, id, ok: false, reason: "unaffordable" };
  }

  Big.subIn(state.res.insight, cost);
  state.owned.insightNodes.add(id);
  recomputeDerivedCache(state, cache);
  bus?.emit("res:changed", "insight");
  bus?.emit("bought", { kind: "insight", id });
  bus?.emit("production:changed", { locRate: cache.locRate });

  return { costInsight: node.costInsight, id, ok: true };
}

export function buyEquityPerk(
  state: GameState,
  cache: DerivedCache,
  id: string,
  bus?: EventBus
): BuyEquityPerkResult {
  const perk = getEquityPerk(id);

  if (perk === undefined) {
    return { costEquity: 0, id, ok: false, reason: "missing" };
  }

  if (state.owned.equityPerks.has(id)) {
    return { costEquity: perk.costEquity, id, ok: false, reason: "bought" };
  }

  if (!isEquityPerkUnlocked()) {
    return { costEquity: perk.costEquity, id, ok: false, reason: "locked" };
  }

  if (state.res.equity < perk.costEquity) {
    return { costEquity: perk.costEquity, id, ok: false, reason: "unaffordable" };
  }

  state.res.equity -= perk.costEquity;
  state.owned.equityPerks.add(id);
  recomputeDerivedCache(state, cache);
  bus?.emit("res:changed", "equity");
  bus?.emit("bought", { kind: "equity", id });
  bus?.emit("production:changed", { locRate: cache.locRate });

  return { costEquity: perk.costEquity, id, ok: true };
}

export function buyParadoxItem(
  state: GameState,
  cache: DerivedCache,
  id: string,
  bus?: EventBus
): BuyParadoxItemResult {
  const item = getParadoxItem(id);

  if (item === undefined) {
    return { costParadox: 0, id, ok: false, reason: "missing" };
  }

  if (state.owned.paradoxItems.has(id)) {
    return { costParadox: item.costParadox, id, ok: false, reason: "bought" };
  }

  if (!isParadoxShopUnlocked(state)) {
    return { costParadox: item.costParadox, id, ok: false, reason: "locked" };
  }

  if (state.res.paradox < item.costParadox) {
    return { costParadox: item.costParadox, id, ok: false, reason: "unaffordable" };
  }

  state.res.paradox -= item.costParadox;
  state.owned.paradoxItems.add(id);

  if (item.kind === "echo" && item.echoEventId !== undefined) {
    state.story.flags.add(getParadoxEchoFlag(item.echoEventId));
  }

  recomputeDerivedCache(state, cache);
  bus?.emit("res:changed", "paradox");
  bus?.emit("bought", { kind: "paradox", id });
  bus?.emit("production:changed", { locRate: cache.locRate });

  return { costParadox: item.costParadox, id, ok: true };
}

export function getEquityPerkState(state: GameState, perk: EquityPerkDefinition): EquityPerkState {
  if (state.owned.equityPerks.has(perk.id)) {
    return "bought";
  }

  if (!isEquityPerkUnlocked()) {
    return "locked";
  }

  return state.res.equity >= perk.costEquity ? "available" : "unaffordable";
}

export function getParadoxItemState(
  state: GameState,
  item: ParadoxItemDefinition
): ParadoxItemState {
  if (state.owned.paradoxItems.has(item.id)) {
    return "bought";
  }

  if (!isParadoxShopUnlocked(state)) {
    return "locked";
  }

  return state.res.paradox >= item.costParadox ? "available" : "unaffordable";
}

export function isParadoxShopUnlocked(state: GameState): boolean {
  return isIterationUnlocked(state);
}

export function isEquityPerkUnlocked(): boolean {
  return true;
}

export function getInsightNodeState(
  state: GameState,
  node: InsightNodeDefinition
): InsightNodeState {
  if (state.owned.insightNodes.has(node.id)) {
    return "bought";
  }

  if (!isInsightNodeUnlocked(state, node)) {
    return "locked";
  }

  return state.res.insight.gte(Big.fromNumber(node.costInsight)) ? "available" : "unaffordable";
}

export function isInsightNodeUnlocked(state: GameState, node: InsightNodeDefinition): boolean {
  if (node.requires !== undefined && !state.owned.insightNodes.has(node.requires)) {
    return false;
  }

  if (node.requiresAnyTierGte !== undefined) {
    const requiredTier = node.requiresAnyTierGte;
    return INSIGHT_NODES.some(
      (entry) =>
        entry.branch !== "core" &&
        entry.tier >= requiredTier &&
        state.owned.insightNodes.has(entry.id)
    );
  }

  return true;
}

export function createRewritePreview(state: GameState): RewritePreview {
  const availableInsight = calculateAvailableInsightGain(state);
  const requiredInsight = calculateRewriteRequirement(state);
  const currentMultiplier = calculateInsightMultiplier(state.res.insight);
  const insightAfter = Big.add(state.res.insight, Big.fromNumber(availableInsight));
  const targetMultiplier = calculateInsightMultiplier(insightAfter);

  return {
    availableInsight,
    canRewrite: availableInsight > 0 && availableInsight >= requiredInsight,
    currentMultiplier,
    insightAfter,
    lostAgents: getTotalOwned(state.owned.generators),
    lostHardware: getTotalOwned(state.owned.hardware),
    lostLoc: state.res.loc.copy(),
    lostMoney: state.res.money.copy(),
    lostProducts: state.projects.portfolio.length,
    lostUpgrades: state.owned.upgrades.size,
    requiredInsight,
    speedup: currentMultiplier <= 0 ? 1 : targetMultiplier / currentMultiplier,
    startEra: getRewriteStartEra(state),
    startGenerators: getRewriteStartGenerators(state),
    startMoney: getRewriteStartMoney(state),
    targetMultiplier
  };
}

export function performRewrite(
  state: GameState,
  cache: DerivedCache,
  bus?: EventBus
): RewriteResult {
  const preview = createRewritePreview(state);

  if (!preview.canRewrite) {
    return { gain: 0, ok: false, preview, reason: "threshold" };
  }

  if (preview.availableInsight <= 0) {
    return { gain: 0, ok: false, preview, reason: "threshold" };
  }

  const gainedInsight = Big.fromNumber(preview.availableInsight);
  Big.addIn(state.res.insight, gainedInsight);
  state.lifetime.insightSinceExit += preview.availableInsight;
  state.prestige.rewrites += 1;

  const keepAutomation = shouldKeepAutomationOnRewrite(state);
  const preservedAutomation = keepAutomation ? state.automation : {};
  const startGenerators = preview.startGenerators;
  const startMoney = preview.startMoney;
  const startEra = preview.startEra;
  const prioritySetting = state.projects.prioritySetting;

  state.res.loc = Big.zero();
  state.res.money = startMoney.copy();
  state.res.debt = Big.zero();
  state.res.hype = 1;
  state.res.computeUsed = 0;
  state.era = startEra;

  resetOwnedGenerators(state, startGenerators);
  state.owned.hardware = {};
  state.hardware.pcComplete = false;
  state.owned.upgrades = new Set();
  state.projects = {
    active: [],
    board: [],
    boardRefreshAt: 0,
    portfolio: [],
    prioritySetting
  };
  state.bugs = [];
  state.flow = {
    activeUntil: 0,
    meter: 0
  };
  state.automation = preservedAutomation;
  applyPrestigeResetSpec(state, "rewrite");
  state.stats[REWRITE_BOOT_UNTIL_STAT] = state.meta.playtimeS + REWRITE_BOOT_S;

  recomputeComputeCap(state);
  refreshProjectBoard(state);
  recomputeDerivedCache(state, cache);

  bus?.emit("res:changed", "loc");
  bus?.emit("res:changed", "money");
  bus?.emit("res:changed", "debt");
  bus?.emit("res:changed", "hype");
  bus?.emit("res:changed", "insight");
  bus?.emit("res:changed", "computeCap");
  bus?.emit("res:changed", "computeUsed");
  bus?.emit("era:changed", state.era);
  bus?.emit("prestige", { layer: 1 });
  bus?.emit("production:changed", { locRate: cache.locRate });

  return { gain: preview.availableInsight, ok: true, preview };
}

export function createExitPreview(state: GameState): ExitPreview {
  const rewardMultiplier = getActiveRunModifierEquityMultiplier(state);
  const baseGain = calculateBaseEquityGain(state);
  const gain = Math.floor(baseGain * rewardMultiplier);
  const equityAfter = state.res.equity + gain;
  const currentMultiplier = calculateEquityMultiplier(state, state.res.equity);
  const targetMultiplier = calculateEquityMultiplier(state, equityAfter);
  const totalInsightEarned = state.lifetime.insightSinceExit;
  const unlocked = state.story.flags.has("exit_unlocked");
  const thresholdMet = totalInsightEarned >= PRESTIGE.EXIT_MIN_INSIGHT;

  return {
    canExit: unlocked && thresholdMet && gain > 0,
    currentEquity: state.res.equity,
    currentMultiplier,
    equityAfter,
    gain,
    requiredInsight: PRESTIGE.EXIT_MIN_INSIGHT,
    rewardMultiplier,
    targetMultiplier,
    totalInsightEarned
  };
}

export function performExit(state: GameState, cache: DerivedCache, bus?: EventBus): ExitResult {
  const preview = createExitPreview(state);

  if (!state.story.flags.has("exit_unlocked")) {
    return { gain: 0, ok: false, preview, reason: "locked" };
  }

  if (!preview.canExit) {
    return { gain: 0, ok: false, preview, reason: "threshold" };
  }

  const keepResearch = hasEquityPerk(state, "q_founder_instinct");
  const preservedResearch = keepResearch ? new Set(state.owned.research) : new Set<string>();
  const preservedRp = keepResearch ? state.res.rp : 0;
  const nextRunModifier = getSelectedRunModifier(state);
  const startEra = getExitStartEra(state);
  const prioritySetting = state.projects.prioritySetting;
  const startInsight = getParadoxStartInsight(state);

  state.res.equity += preview.gain;
  state.res.insight = startInsight;
  state.res.rp = preservedRp;
  state.res.loc = Big.zero();
  state.res.money = Big.zero();
  state.res.debt = Big.zero();
  state.res.hype = 1;
  state.res.computeUsed = 0;
  state.era = startEra;
  state.lifetime.locSinceExit = Big.zero();
  state.lifetime.insightSinceExit = 0;
  state.prestige.exits += 1;

  resetOwnedGenerators(state, {});
  state.owned.hardware = {};
  state.hardware.pcComplete = false;
  state.owned.upgrades = new Set();
  state.owned.research = preservedResearch;
  state.owned.insightNodes = new Set();
  state.projects = {
    active: [],
    board: [],
    boardRefreshAt: 0,
    portfolio: [],
    prioritySetting
  };
  state.bugs = [];
  state.flow = {
    activeUntil: 0,
    meter: 0
  };
  state.automation = {};
  applyPrestigeResetSpec(state, "exit");
  applyPostExitRunModifier(state, nextRunModifier);

  if (hasEquityPerk(state, "q_angel_network")) {
    state.stats[ANGEL_NETWORK_UNTIL_STAT] = state.meta.playtimeS + 60 * 60;
  } else {
    delete state.stats[ANGEL_NETWORK_UNTIL_STAT];
  }

  recomputeComputeCap(state);
  refreshProjectBoard(state);
  recomputeDerivedCache(state, cache);

  bus?.emit("res:changed", "loc");
  bus?.emit("res:changed", "money");
  bus?.emit("res:changed", "debt");
  bus?.emit("res:changed", "hype");
  bus?.emit("res:changed", "insight");
  bus?.emit("res:changed", "equity");
  bus?.emit("res:changed", "rp");
  bus?.emit("res:changed", "computeCap");
  bus?.emit("res:changed", "computeUsed");
  bus?.emit("era:changed", state.era);
  bus?.emit("prestige", { layer: 2 });
  bus?.emit("production:changed", { locRate: cache.locRate });

  return { gain: preview.gain, ok: true, preview };
}

export function tickIterationHold(
  state: GameState,
  cache: DerivedCache,
  dtS: number,
  bus?: EventBus
): boolean {
  const previousHoldS = getIterationHoldS(state);
  const unlocked = isIterationUnlocked(state);
  if (!unlocked) {
    if (previousHoldS === 0) {
      return false;
    }

    delete state.stats[ITERATION_HOLD_STAT];
    bus?.emit("production:changed", { locRate: cache.locRate });
    return true;
  }

  const threshold = getIterationSoftcapThreshold(state.prestige.iteration);
  const nextHoldS = cache.locRate.gte(threshold)
    ? Math.min(PRESTIGE.ITER_HOLD_S, previousHoldS + dtS)
    : 0;

  if (nextHoldS === previousHoldS) {
    return false;
  }

  if (nextHoldS > 0) {
    state.stats[ITERATION_HOLD_STAT] = nextHoldS;
  } else {
    delete state.stats[ITERATION_HOLD_STAT];
  }

  bus?.emit("production:changed", { locRate: cache.locRate });
  return true;
}

export function createIterationPreview(state: GameState, cache: DerivedCache): IterationPreview {
  const unlocked = isIterationUnlocked(state);
  const holdS = getIterationHoldS(state);
  const paradoxGain = calculateParadoxGain(state.prestige.iteration);
  const currentMultiplier = calculateParadoxMultiplier(state, state.res.paradox);
  const paradoxAfter = state.res.paradox + paradoxGain;
  const targetMultiplier = calculateParadoxMultiplier(state, paradoxAfter);

  return {
    canIterate: unlocked && holdS >= PRESTIGE.ITER_HOLD_S,
    currentIteration: state.prestige.iteration,
    currentMultiplier,
    currentParadox: state.res.paradox,
    holdRequiredS: PRESTIGE.ITER_HOLD_S,
    holdS,
    locRate: cache.locRate.copy(),
    nextIteration: state.prestige.iteration + 1,
    paradoxAfter,
    paradoxGain,
    softcapThreshold: getIterationSoftcapThreshold(state.prestige.iteration),
    targetMultiplier,
    unlocked
  };
}

export function performIteration(
  state: GameState,
  cache: DerivedCache,
  bus?: EventBus
): IterationResult {
  const preview = createIterationPreview(state, cache);

  if (!preview.unlocked) {
    return { gain: 0, ok: false, preview, reason: "locked" };
  }

  if (!preview.canIterate) {
    return { gain: 0, ok: false, preview, reason: "threshold" };
  }

  const preservedParadoxItems = new Set(state.owned.paradoxItems);
  const preservedAutomation = Object.fromEntries(
    Object.entries(state.automation).filter(
      ([id]) => id === "autoRewrite" || id.startsWith("autoRewrite:")
    )
  );
  const startInsight = getParadoxStartInsight(state);
  const prioritySetting = state.projects.prioritySetting;

  state.res.paradox += preview.paradoxGain;
  state.res.equity = 0;
  state.res.insight = startInsight;
  state.res.rp = 0;
  state.res.loc = Big.zero();
  state.res.money = Big.zero();
  state.res.debt = Big.zero();
  state.res.hype = 1;
  state.res.computeUsed = 0;
  state.era = STARTING_ERA.index;
  state.lifetime.locSinceExit = Big.zero();
  state.lifetime.insightSinceExit = 0;
  state.prestige.iteration += 1;
  state.story.act = state.aurora.unlocked && !state.aurora.completed ? 5 : 9;

  resetOwnedGenerators(state, getIterationStartGenerators());
  state.owned.hardware = {};
  state.hardware.pcComplete = false;
  state.owned.upgrades = new Set();
  state.owned.research = new Set();
  state.owned.insightNodes = new Set();
  state.owned.equityPerks = new Set();
  state.owned.paradoxItems = preservedParadoxItems;
  state.projects = {
    active: [],
    board: [],
    boardRefreshAt: 0,
    portfolio: [],
    prioritySetting
  };
  state.bugs = [];
  state.flow = {
    activeUntil: 0,
    meter: 0
  };
  state.automation = preservedAutomation;
  applyPrestigeResetSpec(state, "iteration");
  clearRunModifierFlags(state, ACTIVE_RUN_MODIFIER_PREFIX);
  clearRunModifierFlags(state, NEXT_RUN_MODIFIER_PREFIX);

  recomputeComputeCap(state);
  refreshProjectBoard(state);
  recomputeDerivedCache(state, cache);

  bus?.emit("res:changed", "loc");
  bus?.emit("res:changed", "money");
  bus?.emit("res:changed", "debt");
  bus?.emit("res:changed", "hype");
  bus?.emit("res:changed", "insight");
  bus?.emit("res:changed", "equity");
  bus?.emit("res:changed", "paradox");
  bus?.emit("res:changed", "rp");
  bus?.emit("res:changed", "computeCap");
  bus?.emit("res:changed", "computeUsed");
  bus?.emit("era:changed", state.era);
  bus?.emit("prestige", { layer: 3 });
  bus?.emit("production:changed", { locRate: cache.locRate });

  return { gain: preview.paradoxGain, ok: true, preview };
}

export function calculateBaseEquityGain(state: GameState): number {
  const scaledInsight = state.lifetime.insightSinceExit / PRESTIGE.EQUITY_DIV;
  return Math.floor(scaledInsight ** PRESTIGE.EQUITY_EXP);
}

export function calculateEquityMultiplier(state: GameState, equity = state.res.equity): number {
  const exponent = PRESTIGE.EQUITY_MULT_EXP + getCompoundingExponentBonus(state);
  return 1 + PRESTIGE.EQUITY_MULT_K * equity ** exponent;
}

export function calculateParadoxMultiplier(state: GameState, paradox = state.res.paradox): number {
  const exponent = state.owned.paradoxItems.has("x_paradox_engine")
    ? PRESTIGE.PARADOX_ENGINE_MULT_EXP
    : PRESTIGE.PARADOX_MULT_EXP;

  return (1 + paradox) ** exponent;
}

export function hasEquityPerk(state: GameState, id: string): boolean {
  return state.owned.equityPerks.has(id);
}

export function getOwnedParadoxRuleSlots(state: GameState): number {
  let slots = 0;

  for (const item of PARADOX_ITEMS) {
    if (item.kind === "ruleSlot" && state.owned.paradoxItems.has(item.id)) {
      slots += 1;
    }
  }

  return slots;
}

export function getActiveParadoxTheme(state: GameState): string | undefined {
  for (const item of PARADOX_ITEMS) {
    if (
      item.kind === "theme" &&
      item.theme !== undefined &&
      state.owned.paradoxItems.has(item.id)
    ) {
      return item.theme;
    }
  }

  return undefined;
}

export function getParadoxEchoFlag(eventId: string): string {
  return `${PARADOX_ECHO_FLAG_PREFIX}${eventId}`;
}

export function selectRunModifier(
  state: GameState,
  id: RunModifierId | undefined
): SelectRunModifierResult {
  if (!hasEquityPerk(state, "q_board_seat")) {
    return { id, ok: false, reason: "locked" };
  }

  if (id !== undefined && getRunModifier(id) === undefined) {
    return { id, ok: false, reason: "missing" };
  }

  clearRunModifierFlags(state, NEXT_RUN_MODIFIER_PREFIX);

  if (id !== undefined) {
    state.story.flags.add(`${NEXT_RUN_MODIFIER_PREFIX}${id}`);
  }

  return { id, ok: true };
}

export function getSelectedRunModifier(state: GameState): RunModifierId | undefined {
  return getRunModifierFromFlags(state, NEXT_RUN_MODIFIER_PREFIX);
}

export function getActiveRunModifier(state: GameState): RunModifierId | undefined {
  return getRunModifierFromFlags(state, ACTIVE_RUN_MODIFIER_PREFIX);
}

export function isRunModifierActive(state: GameState, id: RunModifierId): boolean {
  return state.story.flags.has(`${ACTIVE_RUN_MODIFIER_PREFIX}${id}`);
}

export function calculateAvailableInsightGain(state: GameState): number {
  return Math.max(0, calculateTotalInsightPotential(state) - state.lifetime.insightSinceExit);
}

export function calculateTotalInsightPotential(state: GameState): number {
  const scaledLoc = Big.div(state.lifetime.locSinceExit, Big.fromNumber(PRESTIGE.INSIGHT_DIV));
  return Big.floor(Big.pow(scaledLoc, PRESTIGE.INSIGHT_EXP)).toNumber();
}

export function calculateRewriteRequirement(state: GameState): number {
  if (state.prestige.rewrites === 0 || state.lifetime.insightSinceExit <= 0) {
    return PRESTIGE.REWRITE_MIN_FIRST;
  }

  return state.lifetime.insightSinceExit * getRewriteMinGainRatio(state);
}

export function calculateInsightMultiplier(insight: Big): number {
  return Big.pow(Big.add(Big.one(), insight), PRESTIGE.INSIGHT_MULT_EXP).toNumber();
}

export function isRewriteBooting(state: GameState): boolean {
  const bootUntil = state.stats[REWRITE_BOOT_UNTIL_STAT];
  return typeof bootUntil === "number" && state.meta.playtimeS < bootUntil;
}

export function getRewriteStartEra(state: GameState): number {
  let era: number = STARTING_ERA.index;

  for (const effect of getOwnedInsightEffects(state)) {
    if (effect.kind === "startEra") {
      era = Math.max(era, effect.era);
    }
  }

  return era;
}

export function getRewriteStartMoney(state: GameState): Big {
  const money = Big.zero();

  for (const effect of getOwnedInsightEffects(state)) {
    switch (effect.kind) {
      case "startMoney":
        Big.addIn(money, Big.from(effect.amount));
        break;
      case "startMoneyRatio":
        Big.addIn(money, Big.mul(state.res.money, Big.fromNumber(effect.fraction)));
        break;
    }
  }

  return Big.mul(money, Big.fromNumber(getEquityStartMoneyMultiplier(state)));
}

export function shouldKeepAutomationOnRewrite(state: GameState): boolean {
  return getOwnedInsightEffects(state).some((effect) => effect.kind === "keepAutomation");
}

function getRewriteStartGenerators(state: GameState): Record<string, number> {
  const generators = createEmptyGeneratorRecord();

  for (const effect of getOwnedInsightEffects(state)) {
    if (effect.kind === "startGenerator") {
      generators[effect.generatorId] = (generators[effect.generatorId] ?? 0) + effect.count;
    }
  }

  return generators;
}

function getIterationStartGenerators(): Record<string, number> {
  const firstGenerator = GENERATORS[0];
  return firstGenerator === undefined ? {} : { [firstGenerator.id]: 1 };
}

function getOwnedInsightEffects(state: GameState): InsightEffect[] {
  const effects: InsightEffect[] = [];

  for (const node of INSIGHT_NODES) {
    if (state.owned.insightNodes.has(node.id)) {
      effects.push(...node.effects);
    }
  }

  return effects;
}

function getCompoundingExponentBonus(state: GameState): number {
  let bonus = 0;

  for (const perk of EQUITY_PERKS) {
    if (!state.owned.equityPerks.has(perk.id)) {
      continue;
    }

    for (const effect of perk.effects) {
      if (effect.kind === "compounding") {
        bonus += effect.exponentAdd;
      }
    }
  }

  return bonus;
}

function getEquityStartMoneyMultiplier(state: GameState): number {
  let multiplier = 1;

  for (const perk of EQUITY_PERKS) {
    if (!state.owned.equityPerks.has(perk.id)) {
      continue;
    }

    for (const effect of perk.effects) {
      if (effect.kind === "startMoneyMultiplier") {
        multiplier *= effect.multiplier;
      }
    }
  }

  return multiplier;
}

function getParadoxStartInsight(state: GameState): Big {
  if (!state.owned.paradoxItems.has("x_start_insight")) {
    return Big.zero();
  }

  return Big.floor(
    Big.mul(state.res.insight, Big.fromNumber(PRESTIGE.PARADOX_START_INSIGHT_RATIO))
  );
}

function getRewriteMinGainRatio(state: GameState): number {
  let ratio: number = PRESTIGE.REWRITE_MIN_GAIN_RATIO;

  for (const perk of EQUITY_PERKS) {
    if (!state.owned.equityPerks.has(perk.id)) {
      continue;
    }

    for (const effect of perk.effects) {
      if (effect.kind === "rewriteMinGainRatio") {
        ratio = Math.min(ratio, effect.ratio);
      }
    }
  }

  return ratio;
}

function getExitStartEra(state: GameState): number {
  let era: number = STARTING_ERA.index;

  if (hasEquityPerk(state, "q_serial_founder")) {
    era = Math.max(era, getRewriteStartEra(state));
  }

  if (hasEquityPerk(state, "q_head_start")) {
    era = Math.max(era, Math.min(1 + state.prestige.exits + 1, 5));
  }

  return era;
}

function getActiveRunModifierEquityMultiplier(state: GameState): number {
  const modifier = getActiveRunModifier(state);

  if (modifier === undefined) {
    return 1;
  }

  return getRunModifier(modifier)?.equityMultiplier ?? 1;
}

function applyPostExitRunModifier(state: GameState, modifier: RunModifierId | undefined): void {
  clearRunModifierFlags(state, ACTIVE_RUN_MODIFIER_PREFIX);
  clearRunModifierFlags(state, NEXT_RUN_MODIFIER_PREFIX);

  if (modifier !== undefined) {
    state.story.flags.add(`${ACTIVE_RUN_MODIFIER_PREFIX}${modifier}`);
  }
}

function clearRunModifierFlags(state: GameState, prefix: string): void {
  for (const flag of [...state.story.flags]) {
    if (flag.startsWith(prefix)) {
      state.story.flags.delete(flag);
    }
  }
}

function getRunModifierFromFlags(state: GameState, prefix: string): RunModifierId | undefined {
  for (const modifier of RUN_MODIFIERS) {
    if (state.story.flags.has(`${prefix}${modifier.id}`)) {
      return modifier.id;
    }
  }

  return undefined;
}

function getIterationHoldS(state: GameState): number {
  const value = state.stats[ITERATION_HOLD_STAT];
  return typeof value === "number" ? value : 0;
}

function applyPrestigeResetSpec(state: GameState, layer: PrestigeResetLayer): void {
  for (const key of RUN_STAT_RESET_KEYS) {
    delete state.stats[key];
  }

  for (const key of RESET_LAYER_STAT_KEYS[layer]) {
    delete state.stats[key];
  }

  for (const key of Object.keys(state.stats)) {
    if (RUN_STAT_RESET_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      delete state.stats[key];
    }
  }
}

function resetOwnedGenerators(
  state: GameState,
  startGenerators: Readonly<Record<string, number>>
): void {
  state.owned.generators = createEmptyGeneratorRecord();

  for (const [id, count] of Object.entries(startGenerators)) {
    state.owned.generators[id] = count;
  }
}

function createEmptyGeneratorRecord(): Record<string, number> {
  const generators: Record<string, number> = {};

  for (const generator of GENERATORS) {
    generators[generator.id] = 0;
  }

  return generators;
}

function getTotalOwned(owned: Record<string, number>): number {
  return Object.values(owned).reduce((sum, count) => sum + count, 0);
}
