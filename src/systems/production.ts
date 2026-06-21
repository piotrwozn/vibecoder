import type { EventBus } from "../core/bus";
import { Big, type BigInput } from "../core/bignum";
import type { GameState } from "../core/state";
import { C, PRESTIGE } from "../data/constants";
import { GENERATORS, type GeneratorDefinition } from "../data/generators";
import {
  EQUITY_PERKS,
  INSIGHT_NODES,
  type EquityEffect,
  type InsightEffect
} from "../data/prestige";
import { RESEARCH, type AutomationUnlock, type ResearchEffect } from "../data/research";
import { UPGRADES, type UpgradeEffect } from "../data/upgrades";
import { canFitCompute, getAvailableCompute } from "./compute";
import { calculateDebtEfficiency, hasPendingIncident } from "./debt";
import { isDemoLocked } from "./demo";
import {
  applyIterationSoftcap,
  calculateIterationCostMultiplier,
  calculateIterationProductionMultiplier
} from "./iteration";
import { calculateAchievementMultiplier } from "./achievements";

export type BuyQuantity = 1 | 10 | "max";

export interface GeneratorMilestoneState {
  readonly count: number;
  readonly multiplier: Big;
  readonly nextAt: number;
}

export interface GeneratorCacheEntry {
  computeUse: number;
  cost1: Big;
  cost10: Big;
  maxAffordable: number;
  milestone: GeneratorMilestoneState;
  rate: Big;
  unlocked: boolean;
}

export interface DerivedCache {
  automation: {
    autoBuy: boolean;
    autoBuyHardware: boolean;
    autoFix: boolean;
    autoFixDelayS: number;
    autoPrompt: boolean;
    autoPromptRate: number;
    autoRefactor: boolean;
    autoRefreshProjects: boolean;
    autoShip: boolean;
  };
  click: {
    flowDurationS: number;
    flowGain: number;
    flowMultiplier: number;
    multiplier: number;
    synergy: number;
  };
  compute: {
    available: number;
    cap: number;
    useMultiplier: number;
    used: number;
  };
  debt: {
    bugChanceCap: number;
    bugChanceMultiplier: number;
    bugPenalty: number;
    factor: number;
    quality: number;
    refactorMultiplier: number;
  };
  generatorEntries: Record<string, GeneratorCacheEntry>;
  costs: {
    generatorMultiplier: Big;
    projectMultiplier: Big;
  };
  hype: {
    cap: number;
    floor: number;
    shipMultiplier: number;
    tauS: number;
  };
  locRate: Big;
  multipliers: {
    achievements: number;
    debt: number;
    era: number;
    insightNodes: number;
    prestige: number;
    research: number;
    upgrades: number;
  };
  offline: {
    capH: number;
  };
  project: {
    boardSlots: number;
    buildTimeMultiplier: number;
    goldenClientChance: number;
    payoutMultiplier: number;
    qaMultiplier: number;
    refactorInstant: boolean;
    revenueMultiplier: number;
    rpMultiplier: number;
  };
}

export interface BuyGeneratorResult {
  readonly cost: Big;
  readonly id: string;
  readonly ok: boolean;
  readonly quantity: number;
  readonly reason?: "compute" | "demoLocked" | "locked" | "unaffordable" | "zero";
}

interface GeneratorSynergyEffect {
  readonly multiplierPerSource: number;
  readonly sourceGeneratorId: string;
  readonly targetGeneratorId: string;
}

interface EffectAccumulator {
  readonly generatorIdMultipliers: Record<string, number>;
  readonly generatorSynergies: GeneratorSynergyEffect[];
  autoBuy: boolean;
  autoBuyHardware: boolean;
  autoFix: boolean;
  autoFixDelayS: number;
  autoPrompt: boolean;
  autoPromptRate: number;
  autoRefactor: boolean;
  autoRefreshProjects: boolean;
  autoShip: boolean;
  bugChanceCap: number;
  bugChanceMultiplier: number;
  bugPenalty: number;
  buildTimeMultiplier: number;
  clickMultiplier: number;
  clickSynergy: number;
  computeUseMultiplier: number;
  debtFactor: number;
  flowDurationS: number;
  flowGain: number;
  flowMultiplier: number;
  generatorEraMultipliers: Record<number, number>;
  generatorCostMultiplier: number;
  globalUpgradeMultiplier: number;
  goldenClientChance: number;
  hypeCap: number;
  hypeFloor: number;
  hypeShipMultiplier: number;
  incidentPenaltyMultiplier: number;
  hypeTauS: number;
  offlineCapH: number;
  olderEraMultiplier: number;
  payoutMultiplier: number;
  projectBoardSlots: number;
  qaMultiplier: number;
  quality: number;
  refactorInstant: boolean;
  refactorDebtMultiplier: number;
  prestigeNodeMultiplier: number;
  researchMultiplier: number;
  revenueMultiplier: number;
  rpMultiplier: number;
}

export function createDerivedCache(): DerivedCache {
  return {
    automation: {
      autoBuy: false,
      autoBuyHardware: false,
      autoFix: false,
      autoFixDelayS: C.AUTO_FIX_DELAY_S,
      autoPrompt: false,
      autoPromptRate: 0,
      autoRefactor: false,
      autoRefreshProjects: false,
      autoShip: false
    },
    click: {
      flowDurationS: C.FLOW_DURATION,
      flowGain: C.FLOW_GAIN,
      flowMultiplier: C.FLOW_MULT,
      multiplier: 1,
      synergy: C.CLICK_SYNERGY
    },
    compute: {
      available: 0,
      cap: 0,
      useMultiplier: 1,
      used: 0
    },
    debt: {
      bugChanceCap: C.BUG_P_MAX,
      bugChanceMultiplier: 1,
      bugPenalty: C.BUG_PENALTY,
      factor: C.DEBT_FACTOR,
      quality: 0,
      refactorMultiplier: C.REFACTOR_DEBT_MULT
    },
    generatorEntries: {},
    costs: {
      generatorMultiplier: Big.one(),
      projectMultiplier: Big.one()
    },
    hype: {
      cap: C.HYPE_CAP,
      floor: 1,
      shipMultiplier: 1,
      tauS: C.HYPE_TAU
    },
    locRate: Big.zero(),
    multipliers: {
      achievements: 1,
      debt: 1,
      era: 1,
      insightNodes: 1,
      prestige: 1,
      research: 1,
      upgrades: 1
    },
    offline: {
      capH: C.OFFLINE_CAP_H
    },
    project: {
      boardSlots: C.PROJECT_BOARD_BASE_SLOTS,
      buildTimeMultiplier: 1,
      goldenClientChance: 0,
      payoutMultiplier: 1,
      qaMultiplier: 1,
      refactorInstant: false,
      revenueMultiplier: 1,
      rpMultiplier: 1
    }
  };
}

export function recomputeDerivedCache(state: GameState, cache: DerivedCache): DerivedCache {
  const effects = collectEffects(state);
  const era = C.ERA_MULT ** (state.era - 1);
  const debt = calculateDebtEfficiency(state);
  const prestige = calculatePrestigeMultiplierBig(state);
  const achievements = calculateAchievementMultiplier(state);
  const iterationCost = calculateIterationCostMultiplier(state.prestige.iteration);
  const iterationProduction = calculateIterationProductionMultiplier(state.prestige.iteration);
  const boundedGlobalMultiplier =
    era *
    debt *
    achievements *
    effects.prestigeNodeMultiplier *
    effects.researchMultiplier *
    effects.globalUpgradeMultiplier;
  const globalMultiplier = Big.mul(
    Big.mul(prestige, iterationProduction),
    Big.fromNumber(boundedGlobalMultiplier)
  );
  let locRate = Big.zero();
  let computeUsed = 0;

  cache.automation = {
    autoBuy: effects.autoBuy,
    autoBuyHardware: effects.autoBuyHardware,
    autoFix: effects.autoFix,
    autoFixDelayS: effects.autoFixDelayS,
    autoPrompt: effects.autoPrompt,
    autoPromptRate: effects.autoPromptRate,
    autoRefactor: effects.autoRefactor,
    autoRefreshProjects: effects.autoRefreshProjects,
    autoShip: effects.autoShip
  };
  cache.click = {
    flowDurationS: effects.flowDurationS,
    flowGain: effects.flowGain,
    flowMultiplier: effects.flowMultiplier,
    multiplier: effects.clickMultiplier,
    synergy: effects.clickSynergy
  };
  cache.costs = {
    generatorMultiplier: Big.mul(Big.fromNumber(effects.generatorCostMultiplier), iterationCost),
    projectMultiplier: iterationCost.copy()
  };
  cache.debt = {
    bugChanceCap: effects.bugChanceCap,
    bugChanceMultiplier: effects.bugChanceMultiplier,
    bugPenalty: effects.bugPenalty,
    factor: effects.debtFactor,
    quality: Math.min(C.QUALITY_MAX, effects.quality),
    refactorMultiplier: effects.refactorDebtMultiplier
  };
  cache.hype = {
    cap: effects.hypeCap,
    floor: effects.hypeFloor,
    shipMultiplier: effects.hypeShipMultiplier,
    tauS: effects.hypeTauS
  };
  cache.multipliers = {
    achievements,
    debt,
    era,
    insightNodes: effects.prestigeNodeMultiplier,
    prestige: prestige.toNumber(),
    research: effects.researchMultiplier,
    upgrades: effects.globalUpgradeMultiplier
  };
  cache.offline = {
    capH: effects.offlineCapH
  };
  cache.project = {
    boardSlots: effects.projectBoardSlots,
    buildTimeMultiplier: effects.buildTimeMultiplier,
    goldenClientChance: effects.goldenClientChance,
    payoutMultiplier: effects.payoutMultiplier,
    qaMultiplier: effects.qaMultiplier,
    refactorInstant: effects.refactorInstant,
    revenueMultiplier: effects.revenueMultiplier,
    rpMultiplier: effects.rpMultiplier
  };

  cache.compute = {
    available: 0,
    cap: state.res.computeCap,
    useMultiplier: effects.computeUseMultiplier,
    used: 0
  };

  for (const generator of GENERATORS) {
    const owned = getOwnedGeneratorCount(state, generator.id);
    const milestone = getMilestoneState(owned);
    const unlocked = isGeneratorUnlocked(state, generator);
    const generatorMultiplier = getGeneratorEffectMultiplier(generator, state, effects);
    const milestoneOwned = Big.mul(Big.fromNumber(owned), milestone.multiplier);
    const rate = Big.mul(
      Big.mul(generator.baseRate, milestoneOwned),
      Big.mul(globalMultiplier, Big.fromNumber(generatorMultiplier))
    );
    const computeUse = getEffectiveComputeUse(generator, cache);
    computeUsed += owned * computeUse;

    cache.generatorEntries[generator.id] = {
      computeUse,
      cost1: getGeneratorCost(generator, owned, 1, cache.costs.generatorMultiplier),
      cost10: getGeneratorCost(generator, owned, 10, cache.costs.generatorMultiplier),
      maxAffordable: unlocked ? getGeneratorMaxAffordable(state, generator, owned, cache) : 0,
      milestone,
      rate,
      unlocked
    };

    locRate = Big.add(locRate, rate);
  }

  cache.compute = {
    ...cache.compute,
    available: Math.max(0, state.res.computeCap - computeUsed),
    used: computeUsed
  };
  state.res.computeUsed = computeUsed;
  cache.locRate = applyIterationSoftcap(locRate, state.prestige.iteration);
  return cache;
}

export function tickProduction(
  state: GameState,
  cache: DerivedCache,
  dtS: number,
  bus?: EventBus
): void {
  if (cache.locRate.eq0()) {
    return;
  }

  const produced = Big.mul(cache.locRate, Big.fromNumber(dtS));
  Big.addIn(state.res.loc, produced);
  Big.addIn(state.lifetime.loc, produced);
  Big.addIn(state.lifetime.locSinceExit, produced);
  bus?.emit("res:changed", "loc");
}

export function buyGenerator(
  state: GameState,
  cache: DerivedCache,
  id: string,
  quantity: BuyQuantity,
  bus?: EventBus,
  spendBudget = state.res.money
): BuyGeneratorResult {
  const generator = getGenerator(id);

  if (generator === undefined) {
    return { cost: Big.zero(), id, ok: false, quantity: 0, reason: "locked" };
  }

  if (isDemoLocked(state, generator)) {
    return { cost: Big.zero(), id, ok: false, quantity: 0, reason: "demoLocked" };
  }

  if (!isGeneratorUnlocked(state, generator)) {
    return { cost: Big.zero(), id, ok: false, quantity: 0, reason: "locked" };
  }

  const owned = getOwnedGeneratorCount(state, id);
  const count =
    quantity === "max"
      ? getGeneratorMaxAffordable(state, generator, owned, cache, spendBudget)
      : quantity;

  if (count <= 0) {
    return { cost: Big.zero(), id, ok: false, quantity: 0, reason: "zero" };
  }

  if (!canFitCompute(state, generator.computeUse, count, cache)) {
    return { cost: Big.zero(), id, ok: false, quantity: count, reason: "compute" };
  }

  const costMultiplier = cache.costs.generatorMultiplier;
  const cost = getGeneratorCost(generator, owned, count, costMultiplier);

  if (state.res.money.lt(cost) || cost.gt(spendBudget)) {
    return { cost, id, ok: false, quantity: count, reason: "unaffordable" };
  }

  Big.subIn(state.res.money, cost);
  state.owned.generators[id] = owned + count;
  recomputeDerivedCache(state, cache);
  bus?.emit("res:changed", "money");
  bus?.emit("res:changed", "computeUsed");
  bus?.emit("bought", { kind: "generator", id });
  bus?.emit("production:changed", { locRate: cache.locRate });

  return { cost, id, ok: true, quantity: count };
}

export function getGeneratorCost(
  generator: GeneratorDefinition,
  owned: number,
  quantity: number,
  costMultiplier: BigInput = 1
): Big {
  return Big.bulkCost(
    Big.mul(generator.baseCost, Big.from(costMultiplier)),
    generator.growth,
    owned,
    quantity
  );
}

export function getGeneratorMaxAffordable(
  state: GameState,
  generator: GeneratorDefinition,
  owned: number,
  cache?: DerivedCache,
  budget = state.res.money
): number {
  const baseCost = Big.mul(generator.baseCost, Big.from(cache?.costs.generatorMultiplier ?? 1));
  const moneyAffordable = Big.maxAffordable(baseCost, generator.growth, owned, budget);
  const computeUse = getEffectiveComputeUse(generator, cache);
  const computeAffordable =
    computeUse <= 0 ? moneyAffordable : Math.floor(getAvailableCompute(state, cache) / computeUse);
  return Math.max(0, Math.min(moneyAffordable, computeAffordable));
}

export function getEffectiveComputeUse(
  generator: GeneratorDefinition,
  cache?: DerivedCache
): number {
  return generator.computeUse * (cache?.compute.useMultiplier ?? 1);
}

export function getMilestoneState(owned: number): GeneratorMilestoneState {
  const count = countMilestones(owned);
  return {
    count,
    multiplier: Big.powNumber(2, count),
    nextAt: getNextMilestone(owned)
  };
}

export function getOwnedGeneratorCount(state: GameState, id: string): number {
  return state.owned.generators[id] ?? 0;
}

export function isGeneratorUnlocked(state: GameState, generator: GeneratorDefinition): boolean {
  if (isDemoLocked(state, generator)) {
    return false;
  }

  if (isActiveRunModifier(state, "indie") && generator.era > 3) {
    return false;
  }

  if (state.era < generator.era) {
    return false;
  }

  if (generator.previousId === undefined) {
    return true;
  }

  return getOwnedGeneratorCount(state, generator.previousId) > 0;
}

export function getGenerator(id: string): GeneratorDefinition | undefined {
  return GENERATORS.find((generator) => generator.id === id);
}

function collectEffects(state: GameState): EffectAccumulator {
  const effects = createEffectAccumulator();

  for (const upgrade of UPGRADES) {
    if (!state.owned.upgrades.has(upgrade.id)) {
      continue;
    }

    for (const effect of upgrade.effects) {
      applyUpgradeEffect(effects, effect);
    }
  }

  for (const research of RESEARCH) {
    if (!state.owned.research.has(research.id)) {
      continue;
    }

    for (const effect of research.effects) {
      applyResearchEffect(effects, effect);
    }
  }

  for (const node of INSIGHT_NODES) {
    if (!state.owned.insightNodes.has(node.id)) {
      continue;
    }

    for (const effect of node.effects) {
      applyInsightEffect(effects, effect);
    }
  }

  for (const perk of EQUITY_PERKS) {
    if (!state.owned.equityPerks.has(perk.id)) {
      continue;
    }

    for (const effect of perk.effects) {
      applyEquityEffect(effects, effect);
    }
  }

  if (isAngelNetworkActive(state)) {
    effects.payoutMultiplier *= 10;
    effects.revenueMultiplier *= 10;
  }

  if (effects.goldenClientChance > 0) {
    effects.payoutMultiplier *= 1 + effects.goldenClientChance * 2;
  }

  if (isActiveRunModifier(state, "debt_storm")) {
    effects.debtFactor *= 3;
  }

  if (isActiveRunModifier(state, "blackout")) {
    effects.offlineCapH = 0;
  }

  if (hasPendingIncident(state)) {
    effects.revenueMultiplier *= 1 - 0.5 * effects.incidentPenaltyMultiplier;
  }

  effects.quality = Math.min(C.QUALITY_MAX, effects.quality);
  return effects;
}

function createEffectAccumulator(): EffectAccumulator {
  return {
    generatorIdMultipliers: {},
    generatorSynergies: [],
    autoBuy: false,
    autoBuyHardware: false,
    autoFix: false,
    autoFixDelayS: C.AUTO_FIX_DELAY_S,
    autoPrompt: false,
    autoPromptRate: 0,
    autoRefactor: false,
    autoRefreshProjects: false,
    autoShip: false,
    bugChanceCap: C.BUG_P_MAX,
    bugChanceMultiplier: 1,
    bugPenalty: C.BUG_PENALTY,
    buildTimeMultiplier: 1,
    clickMultiplier: 1,
    clickSynergy: C.CLICK_SYNERGY,
    computeUseMultiplier: 1,
    debtFactor: C.DEBT_FACTOR,
    flowDurationS: C.FLOW_DURATION,
    flowGain: C.FLOW_GAIN,
    flowMultiplier: C.FLOW_MULT,
    generatorEraMultipliers: {},
    generatorCostMultiplier: 1,
    globalUpgradeMultiplier: 1,
    goldenClientChance: 0,
    hypeCap: C.HYPE_CAP,
    hypeFloor: 1,
    hypeShipMultiplier: 1,
    incidentPenaltyMultiplier: 1,
    hypeTauS: C.HYPE_TAU,
    offlineCapH: C.OFFLINE_CAP_H,
    olderEraMultiplier: 1,
    payoutMultiplier: 1,
    projectBoardSlots: C.PROJECT_BOARD_BASE_SLOTS,
    qaMultiplier: 1,
    quality: 0,
    refactorInstant: false,
    refactorDebtMultiplier: C.REFACTOR_DEBT_MULT,
    prestigeNodeMultiplier: 1,
    researchMultiplier: 1,
    revenueMultiplier: 1,
    rpMultiplier: 1
  };
}

function applyEquityEffect(effects: EffectAccumulator, effect: EquityEffect): void {
  switch (effect.kind) {
    case "generatorCostMultiplier":
      effects.generatorCostMultiplier *= effect.multiplier;
      break;
    case "goldenGut":
      effects.projectBoardSlots += 1;
      effects.payoutMultiplier *= 3;
      break;
    case "hypeFloorMultiplier":
      effects.hypeFloor *= effect.multiplier;
      break;
    case "incidentPenaltyMultiplier":
      effects.incidentPenaltyMultiplier *= effect.multiplier;
      break;
    case "rpGainMultiplier":
      effects.rpMultiplier *= effect.multiplier;
      break;
    case "unlockAllAutomation":
      effects.autoBuy = true;
      effects.autoBuyHardware = true;
      effects.autoFix = true;
      effects.autoPrompt = true;
      effects.autoRefactor = true;
      effects.autoRefreshProjects = true;
      effects.autoShip = true;
      effects.autoPromptRate = Math.max(effects.autoPromptRate, C.AUTO_PROMPT_LOC_RATE_FRACTION);
      break;
    case "angelNetwork":
    case "compounding":
    case "headStart":
    case "keepResearchOnExit":
    case "museMemory":
    case "runModifiers":
    case "serialFounder":
    case "startMoneyMultiplier":
    case "rewriteMinGainRatio":
      break;
  }
}

function applyInsightEffect(effects: EffectAccumulator, effect: InsightEffect): void {
  switch (effect.kind) {
    case "bugPenalty":
      effects.bugPenalty = Math.max(effects.bugPenalty, effect.value);
      break;
    case "debtFactorMultiplier":
      effects.debtFactor *= effect.multiplier;
      break;
    case "flowMultiplier":
      effects.flowMultiplier = Math.max(effects.flowMultiplier, effect.value);
      break;
    case "generatorCostMultiplier":
      effects.generatorCostMultiplier *= effect.multiplier;
      break;
    case "goldenClientChance":
      effects.goldenClientChance += effect.chance;
      break;
    case "hypeTauAdd":
      effects.hypeTauS += effect.seconds;
      break;
    case "locMultiplier":
      effects.prestigeNodeMultiplier *= effect.multiplier;
      break;
    case "offlineCapHoursAdd":
      effects.offlineCapH += effect.hours;
      break;
    case "payoutMultiplier":
      effects.payoutMultiplier *= effect.multiplier;
      break;
    case "projectBoardSlotsAdd":
      effects.projectBoardSlots += effect.slots;
      break;
    case "qaMultiplier":
      effects.qaMultiplier *= effect.multiplier;
      break;
    case "qualityAdd":
      effects.quality += effect.value;
      break;
    case "refactorInstant":
      effects.refactorInstant = true;
      break;
    case "revenueMultiplier":
      effects.revenueMultiplier *= effect.multiplier;
      break;
    case "keepAutomation":
    case "startEra":
    case "startGenerator":
    case "startMoney":
    case "startMoneyRatio":
      break;
  }
}

function applyResearchEffect(effects: EffectAccumulator, effect: ResearchEffect): void {
  switch (effect.kind) {
    case "autoFixDelay":
      effects.autoFixDelayS = Math.min(effects.autoFixDelayS, effect.seconds);
      break;
    case "autoPromptRate":
      effects.autoPromptRate = Math.max(effects.autoPromptRate, effect.fraction);
      break;
    case "bugChanceMultiplier":
      effects.bugChanceMultiplier *= effect.multiplier;
      break;
    case "bugPenalty":
      effects.bugPenalty = Math.max(effects.bugPenalty, effect.value);
      break;
    case "buildTimeMultiplier":
      effects.buildTimeMultiplier *= effect.multiplier;
      break;
    case "clickSynergy":
      effects.clickSynergy = Math.max(effects.clickSynergy, effect.value);
      break;
    case "debtFactorMultiplier":
      effects.debtFactor *= effect.multiplier;
      break;
    case "flowDuration":
      effects.flowDurationS = Math.max(effects.flowDurationS, effect.seconds);
      break;
    case "locMultiplier":
      effects.researchMultiplier *= effect.multiplier;
      break;
    case "offlineCapHours":
      effects.offlineCapH = Math.max(effects.offlineCapH, effect.hours);
      break;
    case "olderEraGeneratorMultiplier":
      effects.olderEraMultiplier *= effect.multiplier;
      break;
    case "projectBoardSlots":
      effects.projectBoardSlots = Math.max(effects.projectBoardSlots, effect.slots);
      break;
    case "qualityAdd":
      effects.quality += effect.value;
      break;
    case "qaMultiplier":
      effects.qaMultiplier *= effect.multiplier;
      break;
    case "refactorDebtMultiplier":
      effects.refactorDebtMultiplier = Math.min(effects.refactorDebtMultiplier, effect.multiplier);
      break;
    case "unlockAutomation":
      applyAutomationUnlock(effects, effect.automation);
      break;
  }
}

function applyUpgradeEffect(effects: EffectAccumulator, effect: UpgradeEffect): void {
  switch (effect.kind) {
    case "autoFixDelay":
      effects.autoFixDelayS = Math.min(effects.autoFixDelayS, effect.seconds);
      break;
    case "bugChanceCapMultiplier":
      effects.bugChanceCap *= effect.multiplier;
      break;
    case "clickMultiplier":
      effects.clickMultiplier *= effect.multiplier;
      break;
    case "clickSynergy":
      effects.clickSynergy = Math.max(effects.clickSynergy, effect.value);
      break;
    case "computeUseMultiplier":
      effects.computeUseMultiplier *= effect.multiplier;
      break;
    case "debtFactorMultiplier":
      effects.debtFactor *= effect.multiplier;
      break;
    case "flowGainMultiplier":
      effects.flowGain *= effect.multiplier;
      break;
    case "generatorEraMultiplier":
      effects.generatorEraMultipliers[effect.era] =
        (effects.generatorEraMultipliers[effect.era] ?? 1) * effect.multiplier;
      break;
    case "generatorMultiplier":
      effects.generatorIdMultipliers[effect.generatorId] =
        (effects.generatorIdMultipliers[effect.generatorId] ?? 1) * effect.multiplier;
      break;
    case "generatorSynergy":
      effects.generatorSynergies.push(effect);
      break;
    case "globalGeneratorMultiplier":
      effects.globalUpgradeMultiplier *= effect.multiplier;
      break;
    case "hypeCap":
      effects.hypeCap = Math.max(effects.hypeCap, effect.value);
      break;
    case "hypeFloor":
      effects.hypeFloor = Math.max(effects.hypeFloor, effect.value);
      break;
    case "hypeShipMultiplier":
      effects.hypeShipMultiplier *= effect.multiplier;
      break;
    case "hypeTau":
      effects.hypeTauS = Math.max(effects.hypeTauS, effect.seconds);
      break;
    case "payoutMultiplier":
      effects.payoutMultiplier *= effect.multiplier;
      break;
    case "qualityAdd":
      effects.quality += effect.value;
      break;
    case "revenueMultiplier":
      effects.revenueMultiplier *= effect.multiplier;
      break;
  }
}

function applyAutomationUnlock(effects: EffectAccumulator, unlock: AutomationUnlock): void {
  switch (unlock) {
    case "autoBuy":
      effects.autoBuy = true;
      break;
    case "autoBuyHardware":
      effects.autoBuyHardware = true;
      break;
    case "autoFix":
      effects.autoFix = true;
      break;
    case "autoPrompt":
      effects.autoPrompt = true;
      effects.autoPromptRate = Math.max(effects.autoPromptRate, C.AUTO_PROMPT_LOC_RATE_FRACTION);
      break;
    case "autoRefactor":
      effects.autoRefactor = true;
      break;
    case "autoRefreshProjects":
      effects.autoRefreshProjects = true;
      break;
    case "autoShip":
      effects.autoShip = true;
      break;
  }
}

function getGeneratorEffectMultiplier(
  generator: GeneratorDefinition,
  state: GameState,
  effects: EffectAccumulator
): number {
  let multiplier = effects.generatorIdMultipliers[generator.id] ?? 1;
  multiplier *= effects.generatorEraMultipliers[generator.era] ?? 1;

  if (generator.era < state.era) {
    multiplier *= effects.olderEraMultiplier;
  }

  for (const synergy of effects.generatorSynergies) {
    if (synergy.targetGeneratorId === generator.id) {
      multiplier *=
        1 + (state.owned.generators[synergy.sourceGeneratorId] ?? 0) * synergy.multiplierPerSource;
    }
  }

  return multiplier;
}

function countMilestones(owned: number): number {
  let count = 0;

  for (const milestone of C.MILESTONES) {
    if (owned >= milestone) {
      count += 1;
    }
  }

  const lastMilestone = getLastConfiguredMilestone();

  if (owned > lastMilestone) {
    count += Math.floor((owned - lastMilestone) / C.MILESTONE_STEP_AFTER);
  }

  return count;
}

function getNextMilestone(owned: number): number {
  for (const milestone of C.MILESTONES) {
    if (owned < milestone) {
      return milestone;
    }
  }

  const lastMilestone = getLastConfiguredMilestone();
  return (
    lastMilestone +
    (Math.floor((owned - lastMilestone) / C.MILESTONE_STEP_AFTER) + 1) * C.MILESTONE_STEP_AFTER
  );
}

function getLastConfiguredMilestone(): number {
  const lastMilestone = C.MILESTONES[C.MILESTONES.length - 1];

  if (lastMilestone === undefined) {
    throw new Error("At least one generator milestone is required");
  }

  return lastMilestone;
}

export function calculatePrestigeMultiplier(state: GameState): number {
  return calculatePrestigeMultiplierBig(state).toNumber();
}

export function calculatePrestigeMultiplierBig(state: GameState): Big {
  const insight = Big.add(Big.one(), state.res.insight);
  const insightMult = Big.pow(insight, PRESTIGE.INSIGHT_MULT_EXP);
  const equityMult = calculateOnePlusScaledPower(
    state.res.equity,
    PRESTIGE.EQUITY_MULT_K,
    getEquityMultiplierExponent(state)
  );
  const paradoxExponent = state.owned.paradoxItems.has("x_paradox_engine")
    ? PRESTIGE.PARADOX_ENGINE_MULT_EXP
    : PRESTIGE.PARADOX_MULT_EXP;
  const paradoxMult = Big.powNumber(1 + state.res.paradox, paradoxExponent);

  return Big.mul(Big.mul(insightMult, equityMult), paradoxMult);
}

function calculateOnePlusScaledPower(value: number, scale: number, exponent: number): Big {
  if (value <= 0 || scale <= 0) {
    return Big.one();
  }

  const termLog10 = Math.log10(scale) + Math.log10(value) * exponent;

  if (termLog10 < 12) {
    return Big.fromNumber(1 + 10 ** termLog10);
  }

  return Big.fromLog10(termLog10);
}

function getEquityMultiplierExponent(state: GameState): number {
  let exponent = PRESTIGE.EQUITY_MULT_EXP;

  for (const perk of EQUITY_PERKS) {
    if (!state.owned.equityPerks.has(perk.id)) {
      continue;
    }

    for (const effect of perk.effects) {
      if (effect.kind === "compounding") {
        exponent += effect.exponentAdd;
      }
    }
  }

  return exponent;
}

function isAngelNetworkActive(state: GameState): boolean {
  const until = state.stats["prestige.angelNetworkUntil"];
  return typeof until === "number" && state.meta.playtimeS < until;
}

function isActiveRunModifier(state: GameState, id: string): boolean {
  return state.story.flags.has(`prestige.runModifier.active.${id}`);
}
