import type { EventBus } from "../core/bus";
import { Big } from "../core/bignum";
import { nextRandomIndex } from "../core/rng";
import type {
  ActiveEndlessContract,
  EndlessChallengeId,
  EndlessContractOffer,
  EndlessDecision,
  GameState
} from "../core/state";
import {
  ENDLESS_CHALLENGES,
  ENDLESS_COSMETICS,
  ENDLESS_EVENTS,
  ENDLESS_EVENT_INTERVAL_S,
  ENDLESS_BASE_LOC_COST,
  ENDLESS_BASE_MONEY_REWARD,
  ENDLESS_BASE_WORK_S,
  ENDLESS_CONTRACT_OFFER_COUNT,
  ENDLESS_INDUSTRIES,
  ENDLESS_MILESTONES,
  ENDLESS_MODIFIERS,
  ENDLESS_MODULES,
  ENDLESS_PRODUCT_TYPES,
  ENDLESS_RISKS,
  ENDLESS_SCALES,
  ENDLESS_SEASON_DURATION_S,
  ENDLESS_SEASONS,
  ENDLESS_SOFT_CAPS,
  ENDLESS_UNLOCK_REPUTATION,
  getEndlessChallenge,
  getEndlessEvent,
  getEndlessSeason
} from "../data/endless";
import { PROJECTS } from "../data/projects";
import { addNonNegativeBig, addNonNegativeNumber, canSpendBig, spendBig } from "./resources";

const ENDLESS_COMPLETE_STAT = "endless.contracts.completed";
const ENDLESS_FAILED_RISK_STAT = "endless.risks.triggered";

export interface EndlessEffects {
  bugChanceMultiplier: number;
  debtFactorMultiplier: number;
  hostingCostMultiplier: number;
  payoutMultiplier: number;
  rpMultiplier: number;
  workMultiplier: number;
}

export interface EndlessActionResult {
  readonly id: string;
  readonly ok: boolean;
  readonly reason?: "active" | "completed" | "locked" | "missing" | "unaffordable";
}

export function tickEndless(state: GameState, dtS: number, bus?: EventBus): boolean {
  let changed = ensureEndlessUnlocked(state, bus);

  if (!state.endless.unlocked) {
    return changed;
  }

  changed = rotateSeasonIfNeeded(state, bus) || changed;
  changed = tickEndlessEvent(state, bus) || changed;
  changed = updateEndlessSoftCaps(state) || changed;
  changed = unlockEndlessCosmetics(state, bus) || changed;
  changed = ensureEndlessOffers(state) || changed;

  const active = state.endless.active;
  if (active === undefined || !Number.isFinite(dtS) || dtS <= 0) {
    return changed;
  }

  const nextActive = {
    ...active,
    elapsedS: Math.min(active.workS, active.elapsedS + dtS)
  };
  state.endless.active = nextActive;

  if (nextActive.elapsedS >= nextActive.workS) {
    completeEndlessContract(state, nextActive, bus);
  }

  return true;
}

export function acceptEndlessContract(
  state: GameState,
  id: string,
  bus?: EventBus
): EndlessActionResult {
  ensureEndlessUnlocked(state, bus);

  if (!state.endless.unlocked) {
    return { id, ok: false, reason: "locked" };
  }

  if (state.endless.active !== undefined) {
    return { id, ok: false, reason: "active" };
  }

  ensureEndlessOffers(state);
  const offer = state.endless.offers.find((entry) => entry.id === id);

  if (offer === undefined) {
    return { id, ok: false, reason: "missing" };
  }

  const costLoc = getEndlessContractCost(offer);
  if (!canSpendBig(state.res.loc, costLoc)) {
    return { id, ok: false, reason: "unaffordable" };
  }

  spendBig(state.res.loc, costLoc);
  state.endless.active = {
    ...offer,
    acceptedAtS: state.meta.playtimeS,
    costLoc,
    elapsedS: 0
  };
  state.endless.offers = state.endless.offers.filter((entry) => entry.id !== id);
  bus?.emit("res:changed", "loc");
  return { id, ok: true };
}

export function refreshEndlessOffers(state: GameState, bus?: EventBus): EndlessActionResult {
  ensureEndlessUnlocked(state, bus);

  if (!state.endless.unlocked) {
    return { id: "offers", ok: false, reason: "locked" };
  }

  if (state.endless.active !== undefined) {
    return { id: "offers", ok: false, reason: "active" };
  }

  state.endless.offers = createEndlessOffers(state);
  return { id: "offers", ok: true };
}

export function chooseEndlessDecision(
  state: GameState,
  decision: EndlessDecision,
  bus?: EventBus
): EndlessActionResult {
  ensureEndlessUnlocked(state, bus);

  if (!state.endless.unlocked) {
    return { id: decision, ok: false, reason: "locked" };
  }

  if (state.endless.active !== undefined) {
    return { id: decision, ok: false, reason: "active" };
  }

  state.endless.decision = decision;

  if (decision === "reset") {
    applyEndlessPrestigeReset(state, bus);
  }

  return { id: decision, ok: true };
}

export function startEndlessChallenge(
  state: GameState,
  id: EndlessChallengeId,
  bus?: EventBus
): EndlessActionResult {
  ensureEndlessUnlocked(state, bus);

  if (!state.endless.unlocked) {
    return { id, ok: false, reason: "locked" };
  }

  if (state.endless.active !== undefined) {
    return { id, ok: false, reason: "active" };
  }

  if (!ENDLESS_CHALLENGES.some((challenge) => challenge.id === id)) {
    return { id, ok: false, reason: "missing" };
  }

  state.endless.activeChallenge = id;
  state.endless.decision = "reset";
  resetEndlessRunState(state);
  state.endless.offers = createEndlessOffers(state);
  bus?.emit("endless:challenge", { id });
  return { id, ok: true };
}

export function getEndlessEffects(state: GameState): EndlessEffects {
  const effects: EndlessEffects = {
    bugChanceMultiplier: 1,
    debtFactorMultiplier: 1,
    hostingCostMultiplier: 1,
    payoutMultiplier: 1,
    rpMultiplier: 1,
    workMultiplier: 1
  };

  if (!state.endless.unlocked) {
    return effects;
  }

  for (const effect of getEndlessSeason(state.endless.seasonId).effects) {
    applyEndlessEffect(effects, effect.kind, effect.multiplier);
  }

  if (state.endless.activeChallenge !== undefined) {
    for (const effect of getEndlessChallenge(state.endless.activeChallenge).effects) {
      applyEndlessEffect(effects, effect.kind, effect.multiplier);
    }
  }

  if (state.endless.activeEvent !== undefined) {
    for (const effect of getEndlessEvent(state.endless.activeEvent.id).effects) {
      applyEndlessEffect(effects, effect.kind, effect.multiplier);
    }
  }

  applySoftCapEffects(state, effects);
  applyCurrencyMitigation(state, effects);
  return effects;
}

export function getEndlessContractCost(contract: EndlessContractOffer): Big {
  return Big.mul(ENDLESS_BASE_LOC_COST, Big.fromLog10(contract.tier * 0.38));
}

export function getEndlessContractProgress(contract: ActiveEndlessContract): number {
  return contract.workS <= 0 ? 1 : Math.min(1, contract.elapsedS / contract.workS);
}

export function getEndlessMilestoneIds(state: GameState): ReadonlySet<string> {
  return new Set(state.endless.milestones.map((milestone) => milestone.id));
}

export function isEndlessUnlockReady(state: GameState): boolean {
  return (
    state.endless.unlocked ||
    state.aurora.completed ||
    state.prestige.iteration > 0 ||
    (state.res.rp >= ENDLESS_UNLOCK_REPUTATION && hasShippedLateGameProject(state))
  );
}

function ensureEndlessUnlocked(state: GameState, bus?: EventBus): boolean {
  if (state.endless.unlocked || !isEndlessUnlockReady(state)) {
    return false;
  }

  state.endless.unlocked = true;
  state.endless.tier = Math.max(1, state.endless.tier);
  rotateSeason(state);
  state.endless.nextEventAtS = state.meta.playtimeS + ENDLESS_EVENT_INTERVAL_S;
  state.endless.offers = createEndlessOffers(state);
  bus?.emit("unlock", { kind: "story", id: "endless" });
  return true;
}

function hasShippedLateGameProject(state: GameState): boolean {
  return state.projects.portfolio.some((product) => {
    const project = PROJECTS.find((entry) => entry.id === product.projectId);
    return project !== undefined && project.era >= 7;
  });
}

function ensureEndlessOffers(state: GameState): boolean {
  if (state.endless.offers.length > 0) {
    return false;
  }

  state.endless.offers = createEndlessOffers(state);
  return true;
}

function rotateSeasonIfNeeded(state: GameState, bus?: EventBus): boolean {
  if (state.endless.seasonEndsAtS > state.meta.playtimeS) {
    return false;
  }

  rotateSeason(state);
  bus?.emit("endless:season", { id: state.endless.seasonId });
  return true;
}

function rotateSeason(state: GameState): void {
  const seasonIndex =
    (state.endless.completedContracts + state.prestige.iteration) % ENDLESS_SEASONS.length;
  state.endless.seasonId = ENDLESS_SEASONS[seasonIndex]?.id ?? "bug_storm";
  state.endless.seasonEndsAtS = state.meta.playtimeS + ENDLESS_SEASON_DURATION_S;
}

function tickEndlessEvent(state: GameState, bus?: EventBus): boolean {
  const active = state.endless.activeEvent;

  if (active !== undefined && active.activeUntilS > state.meta.playtimeS) {
    return false;
  }

  if (active !== undefined) {
    state.endless.activeEvent = undefined;
  }

  if (state.endless.nextEventAtS <= 0) {
    state.endless.nextEventAtS = state.meta.playtimeS + ENDLESS_EVENT_INTERVAL_S;
    return true;
  }

  if (state.meta.playtimeS < state.endless.nextEventAtS) {
    return active !== undefined;
  }

  const picked = nextRandomIndex(state.endless.offerSeed, ENDLESS_EVENTS.length);
  state.endless.offerSeed = picked.seed;
  const event = ENDLESS_EVENTS[picked.index]!;
  state.endless.activeEvent = {
    activeUntilS: state.meta.playtimeS + event.durationS,
    id: event.id,
    startedAtS: state.meta.playtimeS
  };
  state.endless.nextEventAtS = state.meta.playtimeS + ENDLESS_EVENT_INTERVAL_S;
  bus?.emit("endless:event", { id: event.id });
  return true;
}

function updateEndlessSoftCaps(state: GameState): boolean {
  const next = ENDLESS_SOFT_CAPS.filter((cap) => state.endless.tier >= cap.threshold).map(
    (cap) => cap.id
  );

  if (
    next.length === state.endless.softCaps.length &&
    next.every((id, index) => id === state.endless.softCaps[index])
  ) {
    return false;
  }

  state.endless.softCaps = next;
  return true;
}

function createEndlessOffers(state: GameState): EndlessContractOffer[] {
  const offers: EndlessContractOffer[] = [];
  let seed = state.endless.offerSeed;

  for (let index = 0; index < ENDLESS_CONTRACT_OFFER_COUNT; index += 1) {
    const generated = createEndlessOffer(state, seed, index);
    offers.push(generated.offer);
    seed = generated.seed;
  }

  state.endless.offerSeed = seed;
  return offers;
}

function createEndlessOffer(
  state: GameState,
  seed: number,
  index: number
): { readonly offer: EndlessContractOffer; readonly seed: number } {
  const product = pickOne(ENDLESS_PRODUCT_TYPES, seed);
  const industry = pickOne(ENDLESS_INDUSTRIES, product.seed);
  const scale = pickOne(ENDLESS_SCALES, industry.seed);
  const modules = pickMany(ENDLESS_MODULES, scale.seed, 3 + (state.endless.tier % 4));
  const modifiers = pickMany(ENDLESS_MODIFIERS, modules.seed, 1 + (state.endless.tier % 3));
  const risks = pickMany(ENDLESS_RISKS, modifiers.seed, 1 + Math.floor(state.endless.tier / 10));
  const tier = Math.max(1, state.endless.tier + index);
  const seasonEffects = getEndlessEffects(state);
  const complexity =
    product.entry.weight *
    industry.entry.weight *
    scale.entry.weight *
    modules.entries.reduce((multiplier, module) => multiplier * module.workMultiplier, 1) *
    modifiers.entries.reduce((multiplier, modifier) => multiplier * modifier.weight, 1);
  const riskScore = risks.entries.reduce((sum, risk) => sum + risk.risk, 0);
  const rewardMultiplier =
    complexity *
    (1 + riskScore * 0.18) *
    (1 + Math.max(0, tier - 1) * 0.08) *
    seasonEffects.payoutMultiplier;
  const rewardMoney = Big.mul(
    Big.mul(ENDLESS_BASE_MONEY_REWARD, Big.fromLog10(tier * 0.42)),
    Big.fromNumber(rewardMultiplier)
  );
  const rewardRp = Math.max(1, Math.floor((tier + riskScore) * 0.5 * seasonEffects.rpMultiplier));

  return {
    offer: {
      id: `endless.${state.endless.completedContracts + 1}.${index + 1}.${tier}`,
      industryId: industry.entry.id,
      modifierIds: modifiers.entries.map((entry) => entry.id),
      moduleIds: modules.entries.map((entry) => entry.id),
      productTypeId: product.entry.id,
      rewardMoney,
      rewardRp,
      riskIds: risks.entries.map((entry) => entry.id),
      riskScore,
      scaleId: scale.entry.id,
      tier,
      workS: Math.max(
        30,
        ENDLESS_BASE_WORK_S *
          seasonEffects.workMultiplier *
          complexity *
          (1 + Math.max(0, tier - 1) * 0.04)
      )
    },
    seed: risks.seed
  };
}

function completeEndlessContract(
  state: GameState,
  contract: ActiveEndlessContract,
  bus?: EventBus
): void {
  state.endless.active = undefined;
  state.endless.completedContracts += 1;
  state.endless.tier = Math.max(state.endless.tier + 1, contract.tier + 1);
  addNonNegativeBig(state.res.money, contract.rewardMoney);
  addNonNegativeBig(state.lifetime.money, contract.rewardMoney);
  state.res.rp = addNonNegativeNumber(state.res.rp, contract.rewardRp);
  state.endless.legacyScore += Math.max(1, Math.floor(contract.tier / 2));
  grantEndlessCurrencies(state, contract);
  addNonNegativeBig(
    state.endless.empireScore,
    Big.mul(contract.rewardMoney, Big.fromNumber(1 + contract.riskScore * 0.1))
  );
  state.stats[ENDLESS_COMPLETE_STAT] = getNumericStat(state, ENDLESS_COMPLETE_STAT) + 1;
  applyEndlessRisk(state, contract, bus);
  unlockMilestones(state, bus);
  completeChallengeIfReady(state, bus);
  unlockEndlessCosmetics(state, bus);
  state.endless.offers = createEndlessOffers(state);
  bus?.emit("res:changed", "money");
  bus?.emit("res:changed", "rp");
  bus?.emit("endless:completed", { id: contract.id, tier: contract.tier });
}

function grantEndlessCurrencies(state: GameState, contract: ActiveEndlessContract): void {
  const scaleBonus = contract.scaleId === "global" ? 2 : contract.scaleId === "enterprise" ? 1 : 0;
  const hasAi = contract.moduleIds.includes("ai") || contract.moduleIds.includes("ml_model");
  const hasAutomation =
    contract.productTypeId === "automation_platform" ||
    contract.moduleIds.includes("ci_cd") ||
    contract.moduleIds.includes("performance");
  const hasTrust =
    contract.scaleId === "enterprise" ||
    contract.moduleIds.includes("security") ||
    contract.moduleIds.includes("compliance");

  state.endless.currencies.legacyPoints += Math.max(1, Math.floor(contract.tier / 10));
  state.endless.currencies.influence += Math.max(
    0,
    contract.productTypeId === "devtool" || state.endless.seasonId === "open_source"
      ? 1 + scaleBonus
      : scaleBonus
  );
  state.endless.currencies.modelResearch += hasAi ? 1 + Math.floor(contract.tier / 25) : 0;
  state.endless.currencies.stabilityScore += contract.riskScore <= 3 ? 2 : 1;
  state.endless.currencies.automationRank += hasAutomation ? 2 : 1;
  state.endless.currencies.enterpriseTrust += hasTrust ? 2 + scaleBonus : 0;
}

function completeChallengeIfReady(state: GameState, bus?: EventBus): void {
  const activeChallenge = state.endless.activeChallenge;
  if (activeChallenge === undefined) {
    return;
  }

  const challenge = getEndlessChallenge(activeChallenge);
  const existing = state.endless.challengeCompletions.find((entry) => entry.id === activeChallenge);

  if (state.endless.tier < challenge.completionTier) {
    if (existing !== undefined && state.endless.tier > existing.bestTier) {
      state.endless.challengeCompletions = state.endless.challengeCompletions.map((entry) =>
        entry.id === activeChallenge ? { ...entry, bestTier: state.endless.tier } : entry
      );
    } else if (existing === undefined) {
      state.endless.challengeCompletions.push({
        bestTier: state.endless.tier,
        completed: false,
        id: activeChallenge
      });
    }
    return;
  }

  addEndlessCurrencyReward(state, challenge.reward);
  state.endless.challengeCompletions =
    existing === undefined
      ? [
          ...state.endless.challengeCompletions,
          { bestTier: state.endless.tier, completed: true, id: activeChallenge }
        ]
      : state.endless.challengeCompletions.map((entry) =>
          entry.id === activeChallenge
            ? { ...entry, bestTier: Math.max(entry.bestTier, state.endless.tier), completed: true }
            : entry
        );
  state.endless.activeChallenge = undefined;
  bus?.emit("unlock", { kind: "endless", id: `challenge.${activeChallenge}` });
}

function addEndlessCurrencyReward(
  state: GameState,
  reward: Partial<Record<keyof GameState["endless"]["currencies"], number>>
): void {
  for (const [key, value] of Object.entries(reward) as [
    keyof GameState["endless"]["currencies"],
    number
  ][]) {
    state.endless.currencies[key] += Math.max(0, Math.floor(value));
  }
}

function applyEndlessRisk(state: GameState, contract: ActiveEndlessContract, bus?: EventBus): void {
  const roll = nextRandomIndex(state.endless.offerSeed, 10_000);
  state.endless.offerSeed = roll.seed;
  const chance = Math.min(
    0.85,
    contract.riskScore * 0.035 * getEndlessEffects(state).bugChanceMultiplier
  );

  if (roll.value > chance) {
    return;
  }

  const debtMultiplier = contract.riskIds.reduce((multiplier, riskId) => {
    const risk = ENDLESS_RISKS.find((entry) => entry.id === riskId);
    return multiplier * (risk?.debtMultiplier ?? 1);
  }, 1);
  const debt = Big.mul(contract.costLoc, Big.fromNumber(0.08 * debtMultiplier));
  Big.addIn(state.res.debt, debt);
  state.stats[ENDLESS_FAILED_RISK_STAT] = getNumericStat(state, ENDLESS_FAILED_RISK_STAT) + 1;
  bus?.emit("res:changed", "debt");
}

function unlockMilestones(state: GameState, bus?: EventBus): void {
  const unlocked = getEndlessMilestoneIds(state);

  for (const milestone of ENDLESS_MILESTONES) {
    if (state.endless.tier < milestone.target || unlocked.has(milestone.id)) {
      continue;
    }

    state.endless.milestones.push({ id: milestone.id });
    state.endless.legacyScore += milestone.target;
    bus?.emit("unlock", { kind: "endless", id: milestone.id });
  }
}

function unlockEndlessCosmetics(state: GameState, bus?: EventBus): boolean {
  const milestoneIds = getEndlessMilestoneIds(state);
  const owned = new Set(state.endless.cosmetics);
  let changed = false;

  for (const cosmetic of ENDLESS_COSMETICS) {
    if (owned.has(cosmetic.id) || !milestoneIds.has(cosmetic.requiredMilestoneId)) {
      continue;
    }

    state.endless.cosmetics.push(cosmetic.id);
    owned.add(cosmetic.id);
    changed = true;
    bus?.emit("unlock", { kind: "endless", id: `cosmetic.${cosmetic.id}` });
  }

  return changed;
}

function applyEndlessPrestigeReset(state: GameState, bus?: EventBus): void {
  state.endless.currencies.legacyPoints += Math.max(1, Math.floor(state.endless.tier / 4));
  state.endless.legacyScore += Math.max(1, Math.floor(state.endless.tier / 2));
  resetEndlessRunState(state);
  state.endless.offers = createEndlessOffers(state);
  bus?.emit("unlock", { kind: "endless", id: "prestige.reset" });
}

function resetEndlessRunState(state: GameState): void {
  state.endless.active = undefined;
  state.endless.completedContracts = 0;
  state.endless.milestones = [];
  state.endless.offers = [];
  state.endless.seasonEndsAtS = 0;
  state.endless.softCaps = [];
  state.endless.tier = 1;
  rotateSeason(state);
}

function applyEndlessEffect(
  effects: EndlessEffects,
  kind: keyof EndlessEffects,
  multiplier: number
): void {
  effects[kind] *= multiplier;
}

function applySoftCapEffects(state: GameState, effects: EndlessEffects): void {
  for (const cap of ENDLESS_SOFT_CAPS) {
    if (!state.endless.softCaps.includes(cap.id)) {
      continue;
    }

    const pressure = Math.min(3, Math.max(0, state.endless.tier - cap.threshold) / cap.threshold);
    switch (cap.id) {
      case "coordination":
        effects.workMultiplier *= 1 + pressure * 0.08;
        effects.debtFactorMultiplier *= 1 + pressure * 0.04;
        break;
      case "cloud_cost":
        effects.hostingCostMultiplier *= 1 + pressure * 0.12;
        break;
      case "context":
        effects.bugChanceMultiplier *= 1 + pressure * 0.09;
        effects.workMultiplier *= 1 + pressure * 0.05;
        break;
      case "governance":
        effects.payoutMultiplier *= 1 / (1 + pressure * 0.06);
        effects.rpMultiplier *= 1 + pressure * 0.04;
        break;
    }
  }
}

function applyCurrencyMitigation(state: GameState, effects: EndlessEffects): void {
  const currencies = state.endless.currencies;
  effects.workMultiplier *= Math.max(0.72, 1 - currencies.automationRank * 0.001);
  effects.hostingCostMultiplier *= Math.max(0.72, 1 - currencies.stabilityScore * 0.0008);
  effects.bugChanceMultiplier *= Math.max(0.72, 1 - currencies.enterpriseTrust * 0.0007);
  effects.rpMultiplier *= 1 + currencies.influence * 0.001;
  effects.payoutMultiplier *= 1 + currencies.legacyPoints * 0.0005;
  effects.debtFactorMultiplier *= Math.max(0.76, 1 - currencies.modelResearch * 0.0007);
}

function pickOne<T>(
  entries: readonly T[],
  seed: number
): { readonly entry: T; readonly seed: number } {
  const result = nextRandomIndex(seed, entries.length);
  return {
    entry: entries[result.index]!,
    seed: result.seed
  };
}

function pickMany<T extends { readonly id: string }>(
  entries: readonly T[],
  seed: number,
  count: number
): { readonly entries: readonly T[]; readonly seed: number } {
  const picked: T[] = [];
  const seen = new Set<string>();
  let nextSeed = seed;

  while (picked.length < Math.min(count, entries.length)) {
    const result = nextRandomIndex(nextSeed, entries.length);
    nextSeed = result.seed;
    const entry = entries[result.index]!;

    if (seen.has(entry.id)) {
      continue;
    }

    seen.add(entry.id);
    picked.push(entry);
  }

  return { entries: picked, seed: nextSeed };
}

function getNumericStat(state: GameState, key: string): number {
  const value = state.stats[key];
  return typeof value === "number" ? value : 0;
}
