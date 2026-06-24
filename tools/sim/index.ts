import { Big } from "../../src/core/bignum.ts";
import { createDefaultGameState, type GameState } from "../../src/core/state.ts";
import { PRESTIGE } from "../../src/data/constants.ts";
import { GENERATORS, type GeneratorDefinition } from "../../src/data/generators.ts";
import type { HardwareDefinition } from "../../src/data/hardware.ts";
import { INSIGHT_NODES } from "../../src/data/prestige.ts";
import { RESEARCH } from "../../src/data/research.ts";
import { buyUpgrade, getUpgradeCost, getVisibleUpgrades } from "../../src/systems/upgrades.ts";
import { tickAchievements } from "../../src/systems/achievements.ts";
import { tickAutomation } from "../../src/systems/automation.ts";
import {
  AURORA_REQUIRED_DEDICATED_SERVERS,
  dedicateAuroraServer,
  fundAuroraPhase,
  getAuroraReadyServerCount,
  getAvailableAuroraServers,
  getCurrentAuroraPhase,
  rentAuroraHost,
  tickAurora
} from "../../src/systems/aurora.ts";
import { tickBilling } from "../../src/systems/billing.ts";
import { isBankrupt } from "../../src/systems/bank.ts";
import {
  buyHardware,
  getAvailableHardware,
  getHardwareCost,
  getHardwareTierGateRequirement,
  isHardwareMaxed
} from "../../src/systems/compute.ts";
import { calculateDebtEfficiency, fixBug, tickDebt } from "../../src/systems/debt.ts";
import { buyNextEra, getEraCost, getNextEra } from "../../src/systems/eras.ts";
import { tickHype } from "../../src/systems/hype.ts";
import { tickBuildMomentum } from "../../src/systems/momentum.ts";
import { tickPromptFlow, performPromptClick } from "../../src/systems/prompt.ts";
import {
  buyGenerator,
  createDerivedCache,
  getEffectiveComputeUse,
  getGeneratorCost,
  isGeneratorUnlocked,
  recomputeDerivedCache,
  tickProduction,
  type DerivedCache
} from "../../src/systems/production.ts";
import {
  getProject,
  getProjectBuildTime,
  getProjectPayout,
  getVisibleProjectOffers,
  refreshProjectBoard,
  startProject,
  tickProjects
} from "../../src/systems/projects.ts";
import { buyResearch } from "../../src/systems/research.ts";
import {
  buyInsightNode,
  calculateAvailableInsightGain,
  createExitPreview,
  createIterationPreview,
  performExit,
  performIteration,
  performRewrite
} from "../../src/systems/prestige.ts";
import { tickIterationHold } from "../../src/systems/prestige.ts";
import { createOmegaReadinessDiagnostics } from "../../src/systems/progress.ts";
import { tickProductionIncidents } from "../../src/systems/incidents.ts";
import { tickRoadmap } from "../../src/systems/roadmap.ts";
import { tickStats } from "../../src/systems/stats.ts";
import { STORY_EVENTS, chooseStoryOption, tickStory } from "../../src/systems/story.ts";

const DT_S = 1;
const IDLE_LOGIN_INTERVAL_S = 8 * 60 * 60;
const PROJECT_DECISION_INTERVAL_S = 30;
const SIM_REFACTOR_COOLDOWN_S = 15 * 60;
const SIM_ERA_RESERVE_RATIO = 0.5;
export const SIM_FIRST_EXIT_MIN_EQUITY_GAIN = 3;
const SIM_LAST_REFACTOR_AT_STAT = "sim.lastRefactorAt";
const SHIPPED_STAT = "projects.shipped";
const MAIN_CAMPAIGN_EVENTS = STORY_EVENTS.filter(
  (event) => event.act !== 9 && !isAuroraStoryEvent(event.id)
);
const CAMPAIGN_EVENT_COUNT = MAIN_CAMPAIGN_EVENTS.length;

export type Strategy =
  | "active"
  | "casual"
  | "idle_only"
  | "maxer"
  | "offline-heavy"
  | "sane"
  | "story-rush";

interface SimArgs {
  readonly continueAfterOmega?: boolean;
  readonly endlessIterations?: number;
  readonly hours: number;
  readonly strategy: Strategy;
}

interface Milestone {
  readonly act: number;
  readonly atH: number;
  readonly label: string;
}

interface CampaignSimResult {
  readonly auroraCompleteH?: number;
  readonly completeH?: number;
  readonly milestones: readonly Milestone[];
  readonly missingEvents: readonly string[];
  readonly omegaCompleteH?: number;
  readonly seenEvents: number;
  readonly state: GameState;
  readonly cache: DerivedCache;
}

interface EndlessSmokeResult {
  readonly cache: DerivedCache;
  readonly maxExponent: number;
  readonly state: GameState;
}

if (isCliEntry()) {
  let args: SimArgs;

  try {
    args = readArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  if (args.endlessIterations !== undefined) {
    const result = runEndlessSmokeSim(args.endlessIterations);
    console.log("iterations,paradox,max_e,act");
    console.log(
      [
        result.state.prestige.iteration,
        result.state.res.paradox,
        result.maxExponent,
        result.state.story.act
      ].join(",")
    );
    console.log(
      `endless: iterations=${result.state.prestige.iteration} target=${args.endlessIterations} max_e=${result.maxExponent}`
    );
    process.exit(result.state.prestige.iteration >= args.endlessIterations ? 0 : 1);
  }

  const result = runCampaignSim(args);
  const complete = result.completeH !== undefined;
  const maxExponent = getMaxBigExponent(result.state, result.cache);

  console.log("time_h,loc_s,money,era,rewrites,exits,iteration,act,max_e");
  console.log(
    [
      (result.state.meta.playtimeS / 3600).toFixed(2),
      result.cache.locRate.toString(),
      result.state.res.money.toString(),
      result.state.era,
      result.state.prestige.rewrites,
      result.state.prestige.exits,
      result.state.prestige.iteration,
      result.state.story.act,
      maxExponent
    ].join(",")
  );
  console.log(
    `sim: strategy=${args.strategy} hours=${args.hours} complete=${complete ? "yes" : "no"} complete_h=${
      result.completeH === undefined ? "n/a" : result.completeH.toFixed(2)
    } omega_h=${result.omegaCompleteH === undefined ? "n/a" : result.omegaCompleteH.toFixed(2)} aurora_h=${
      result.auroraCompleteH === undefined ? "n/a" : result.auroraCompleteH.toFixed(2)
    } events=${result.seenEvents}/${CAMPAIGN_EVENT_COUNT} missing=${result.missingEvents.length} max_e=${maxExponent}`
  );
  const omega = createOmegaReadinessDiagnostics(result.state, result.cache);
  console.log(
    `omega: visible=${omega.visible ? "yes" : "no"} ready=${omega.ready ? "yes" : "no"} status=${
      omega.status
    } eta_h=${
      !omega.visible || omega.etaS === undefined ? "n/a" : (omega.etaS / 3600).toFixed(2)
    } next=${omega.recommendedGoal.kind}`
  );

  for (const milestone of result.milestones) {
    console.log(
      `milestone: ${milestone.label} at ${milestone.atH.toFixed(2)}h act=${milestone.act}`
    );
  }

  const criticalMissingEvents = getCriticalMissingEvents(result.missingEvents);
  if (
    args.strategy === "sane" &&
    complete &&
    result.completeH !== undefined &&
    (result.completeH < 150 || result.completeH > 260 || criticalMissingEvents.length > 0)
  ) {
    console.error(
      `sim: FAIL complete_h=${result.completeH?.toFixed(2) ?? "n/a"} missing=${criticalMissingEvents.join(",")}`
    );
    process.exit(1);
  }
}

export function runEndlessSmokeSim(iterations: number): EndlessSmokeResult {
  const state = createDefaultGameState(0, "full", 1);
  const cache = createDerivedCache();
  let maxExponent = 0;

  state.prestige.endingChoice = "fork";
  state.prestige.exits = 1;
  state.story.flags.add("omega_approved");
  state.story.flags.add("iteration_unlocked");
  state.story.act = 9;
  state.owned.paradoxItems.add("x_start_insight");
  state.res.computeCap = 1_000;
  state.res.loc = Big.fromLog10(80);
  refreshEndlessSmokeRunway(state);
  seedEndlessInsight(state, iterations);
  recomputeDerivedCache(state, cache);

  while (state.prestige.iteration < iterations) {
    recomputeDerivedCache(state, cache);

    for (let second = 0; second < PRESTIGE.ITER_HOLD_S * PRESTIGE.PARADOX_BASE; second += DT_S) {
      state.meta.playtimeS += DT_S;
      refreshEndlessSmokeRunway(state);
      tickEndlessStrategy(state, cache);
      refreshEndlessSmokeRunway(state);
      tickSimSystems(state, cache, DT_S);
      maxExponent = Math.max(maxExponent, getMaxBigExponent(state, cache));

      if (createIterationPreview(state, cache).canIterate) {
        break;
      }
    }

    if (!performIteration(state, cache).ok) {
      break;
    }
  }

  return {
    cache,
    maxExponent: Math.max(maxExponent, getMaxBigExponent(state, cache)),
    state
  };
}

function refreshEndlessSmokeRunway(state: GameState): void {
  const runway = Big.fromLog10(300);
  if (state.res.money.lt(runway)) {
    state.res.money = runway.copy();
  }

  state.bank.defaulted = false;
  delete state.bank.defaultedAtS;
  state.bank.overdraft.set(0, 0);
  state.bank.warningsIssued = 0;
}

function seedEndlessInsight(state: GameState, iterations: number): void {
  const seedExponent =
    PRESTIGE.ITER_SOFTCAP_BASE_E +
    PRESTIGE.ITER_SOFTCAP_STEP_E * (iterations + PRESTIGE.PARADOX_BASE * 4);
  state.res.insight = Big.max(state.res.insight, Big.fromLog10(seedExponent));
}

function tickEndlessStrategy(state: GameState, cache: DerivedCache): void {
  performPromptClick(state, cache);
  fixVisibleBugs(state, cache);
  buyAffordableEraAndHardware(state, cache);
  buyAffordableUpgrades(state, cache);
  buyAffordableResearch(state, cache);
  buyAffordableInsight(state, cache);
  startUsefulProjects(state, cache);
  buyBestGenerators(state, cache, "maxer");
  buyAffordableEraAndHardware(state, cache);
}

export function runCampaignSim(args: SimArgs): CampaignSimResult {
  const state = createDefaultGameState(0, "full", 1);
  const cache = createDerivedCache();
  const milestones: Milestone[] = [];
  let omegaCompleteH: number | undefined;
  let auroraCompleteH: number | undefined;
  let completeH: number | undefined;

  recomputeDerivedCache(state, cache);

  for (let second = 1; second <= args.hours * 3600; second += DT_S) {
    state.meta.playtimeS = second;
    tickStrategy(state, cache, args.strategy);
    tickSimSystems(state, cache, DT_S);
    choosePendingStory(state, cache);
    maybeIteration(state, cache);
    if (second % 60 === 0) {
      recomputeDerivedCache(state, cache);
    }
    recordMilestones(state, milestones);

    if (state.prestige.endingChoice !== undefined && omegaCompleteH === undefined) {
      omegaCompleteH = state.meta.playtimeS / 3600;
      completeH = omegaCompleteH;

      if (args.continueAfterOmega !== true) {
        break;
      }
    }

    if (state.aurora.completed && auroraCompleteH === undefined) {
      auroraCompleteH = state.meta.playtimeS / 3600;
    }
  }

  const requiredEvents = MAIN_CAMPAIGN_EVENTS;
  const missingEvents = requiredEvents
    .filter((event) => !state.story.seen.has(event.id))
    .map((event) => event.id);

  return {
    cache,
    auroraCompleteH,
    completeH,
    milestones,
    missingEvents,
    omegaCompleteH,
    seenEvents: requiredEvents.length - missingEvents.length,
    state
  };
}

function tickSimSystems(state: GameState, cache: DerivedCache, dtS: number): void {
  if (isBankrupt(state)) {
    return;
  }

  tickBuildMomentum(state, dtS);
  tickPromptFlow(state, dtS);
  tickProduction(state, cache, dtS);
  tickProjects(state, cache, dtS);
  tickBilling(state, cache, dtS);

  if (isBankrupt(state)) {
    return;
  }

  tickAurora(state, dtS);
  tickRoadmap(state);
  tickProductionIncidents(state);
  tickHype(state, dtS, cache);
  tickDebt(state, cache, dtS);
  tickAutomation(state, cache, dtS);
  tickStory(state, dtS, cache);
  tickIterationHold(state, cache, dtS);
  tickStats(state, cache);
  tickAchievements(state, cache);
}

function tickStrategy(state: GameState, cache: DerivedCache, strategy: Strategy): void {
  const active = state.story.act >= 5 || isStrategyActive(state.meta.playtimeS, strategy);

  progressAuroraStrategy(state, cache, strategy);

  if (active) {
    performPromptClick(state, cache);
    fixVisibleBugs(state, cache);
  }

  if (active && state.meta.playtimeS % PROJECT_DECISION_INTERVAL_S === 0) {
    startUsefulProjects(state, cache);
  }

  const decisionIntervalS = state.story.act >= 5 ? 10 : getDecisionIntervalS(strategy);
  if (state.meta.playtimeS % decisionIntervalS !== 0) {
    return;
  }

  if (state.story.act >= 5 && state.era < 10) {
    buyAffordableEraAndHardware(state, cache);
    buyAffordableUpgrades(state, cache);
    buyAffordableResearch(state, cache);
    buyAffordableInsight(state, cache);
    maybeRewrite(state, cache);
    maybeExit(state, cache);
    buyAffordableEraAndHardware(state, cache);
    startUsefulProjects(state, cache);
    buyBestGenerators(state, cache, strategy);
    buyAffordableEraAndHardware(state, cache);
    return;
  }

  if (state.story.act >= 5) {
    buyAffordableEraAndHardware(state, cache);
  }

  buyAffordableUpgrades(state, cache);
  buyAffordableResearch(state, cache);
  buyAffordableInsight(state, cache);
  maybeRewrite(state, cache);
  maybeExit(state, cache);
  startUsefulProjects(state, cache);
  buyBestGenerators(state, cache, strategy);
  if (state.story.act < 5) {
    buyAffordableEraAndHardware(state, cache);
  }
}

function fixVisibleBugs(state: GameState, cache: DerivedCache): void {
  for (const bug of [...state.bugs]) {
    if (fixBug(state, bug.productId).ok) {
      recomputeDerivedCache(state, cache);
    }
  }
}

function isAuroraStoryEvent(eventId: string): boolean {
  return eventId.includes("_aurora_");
}

function progressAuroraStrategy(state: GameState, cache: DerivedCache, strategy: Strategy): void {
  if (strategy === "idle_only" || state.prestige.endingChoice === undefined) {
    return;
  }

  if (!state.aurora.unlocked) {
    if (state.projects.active.length === 0) {
      startProject(state, "p_aurora_seed", cache);
    }
    return;
  }

  if (state.aurora.completed || state.aurora.phaseActive) {
    return;
  }

  while (
    state.aurora.dedicatedServers < AURORA_REQUIRED_DEDICATED_SERVERS &&
    getAuroraReadyServerCount(state) > 0
  ) {
    if (!dedicateAuroraServer(state).ok) {
      break;
    }

    recomputeDerivedCache(state, cache);
  }

  const phase = getCurrentAuroraPhase(state);
  if (phase === undefined) {
    fundAuroraPhase(state);
    return;
  }

  if (state.res.loc.lt(phase.costLoc) || state.res.money.lt(phase.costMoney)) {
    return;
  }

  while (getAvailableAuroraServers(state) < phase.requiredServers) {
    if (!rentAuroraHost(state).ok) {
      return;
    }
  }

  fundAuroraPhase(state);
}

function isStrategyActive(playtimeS: number, strategy: Strategy): boolean {
  switch (strategy) {
    case "active":
      return playtimeS % 2 < 1;
    case "casual":
      return playtimeS % 8 < 1;
    case "maxer":
      return true;
    case "idle_only":
      return playtimeS % IDLE_LOGIN_INTERVAL_S < 60;
    case "offline-heavy":
      return playtimeS % (2 * 60 * 60) < 90;
    case "sane":
      return playtimeS % 3 < 1;
    case "story-rush":
      return true;
  }
}

function getDecisionIntervalS(strategy: Strategy): number {
  switch (strategy) {
    case "maxer":
    case "story-rush":
      return 30;
    case "active":
      return 60;
    case "casual":
      return 300;
    case "offline-heavy":
      return 240;
    case "idle_only":
    case "sane":
      return 180;
  }
}

function buyAffordableEraAndHardware(state: GameState, cache: DerivedCache): void {
  buyAffordableEras(state, cache);

  const maxPurchases = Math.max(1, getAvailableHardware(state).length);

  for (let purchase = 0; purchase < maxPurchases; purchase += 1) {
    if (!needsHardwareForAffordableGenerator(state, cache) && !shouldCompletePcHardware(state)) {
      return;
    }

    const hardware = getBestAffordableHardware(state);
    if (hardware !== undefined) {
      if (buyHardware(state, hardware.id).ok) {
        recomputeDerivedCache(state, cache);
      }
    } else {
      return;
    }
  }
}

function getBestAffordableHardware(state: GameState): HardwareDefinition | undefined {
  const affordable = getAvailableHardware(state)
    .filter((entry) => !isHardwareMaxed(entry, state.owned.hardware[entry.id] ?? 0))
    .filter((entry) => canSpendMoneyForSim(state, getHardwareCostForSim(state, entry)))
    .sort(
      (left, right) => getHardwareScoreForSim(state, right) - getHardwareScoreForSim(state, left)
    );

  for (const hardware of affordable) {
    const tierGate = getHardwareTierGateRequirement(state, hardware);

    if (tierGate === undefined) {
      return hardware;
    }

    const gateHardware = getAvailableHardware(state).find(
      (entry) => entry.id === tierGate.hardwareId
    );

    if (
      gateHardware !== undefined &&
      !isHardwareMaxed(gateHardware, state.owned.hardware[gateHardware.id] ?? 0) &&
      canSpendMoneyForSim(state, getHardwareCostForSim(state, gateHardware))
    ) {
      return gateHardware;
    }
  }

  return undefined;
}

function shouldCompletePcHardware(state: GameState): boolean {
  return (
    !state.hardware.pcComplete &&
    state.era >= 3 &&
    getAvailableHardware(state).some(
      (entry) =>
        entry.phase === "pc" &&
        !isHardwareMaxed(entry, state.owned.hardware[entry.id] ?? 0) &&
        canSpendMoneyForSim(state, getHardwareCostForSim(state, entry))
    )
  );
}

function needsHardwareForAffordableGenerator(state: GameState, cache: DerivedCache): boolean {
  return GENERATORS.some((generator) => {
    if (!isGeneratorUnlocked(state, generator)) {
      return false;
    }

    const owned = state.owned.generators[generator.id] ?? 0;
    const cost = getGeneratorCost(generator, owned, 1, cache.costs.generatorMultiplier);
    return (
      canSpendMoneyForSim(state, cost) &&
      cache.compute.available < getEffectiveComputeUse(generator, cache)
    );
  });
}

function buyAffordableEras(state: GameState, cache: DerivedCache): void {
  if (state.story.act === 4 && state.era >= 7 && state.projects.portfolio.length < 20) {
    return;
  }

  while (buyNextEra(state).ok) {
    if (state.story.act === 4 && state.era >= 7 && state.projects.portfolio.length < 20) {
      return;
    }

    refreshProjectBoard(state);
    recomputeDerivedCache(state, cache);
  }
}

function getHardwareCostForSim(state: GameState, hardware: HardwareDefinition): Big {
  return getHardwareCost(
    hardware,
    state.owned.hardware[hardware.id] ?? 0,
    state.prestige.iteration
  );
}

function getHardwareScoreForSim(state: GameState, hardware: HardwareDefinition): number {
  return (
    Math.log10(Math.max(1, hardware.capPerLevel)) - getHardwareCostForSim(state, hardware).log10()
  );
}

function buyAffordableUpgrades(state: GameState, cache: DerivedCache): void {
  for (const upgrade of getVisibleUpgrades(state)) {
    if (
      canSpendMoneyForSim(state, getUpgradeCost(state, upgrade)) &&
      buyUpgrade(state, cache, upgrade.id).ok
    ) {
      return;
    }
  }
}

function buyAffordableResearch(state: GameState, cache: DerivedCache): void {
  for (const research of RESEARCH) {
    if (buyResearch(state, cache, research.id).ok) {
      return;
    }
  }
}

function buyAffordableInsight(state: GameState, cache: DerivedCache): void {
  for (const node of INSIGHT_NODES) {
    if (buyInsightNode(state, cache, node.id).ok) {
      return;
    }
  }
}

function maybeRewrite(state: GameState, cache: DerivedCache): void {
  if (state.prestige.endingChoice !== undefined && !state.aurora.completed) {
    return;
  }

  if (state.story.act >= 9) {
    return;
  }

  const insightEarnedThisExit = state.lifetime.insightSinceExit;

  if (state.story.act === 1 && insightEarnedThisExit > 0 && state.res.money.lt(Big.from("1e6"))) {
    return;
  }

  if (
    state.story.act === 2 &&
    insightEarnedThisExit >= PRESTIGE.REWRITE_MIN_FIRST * 2 &&
    state.res.money.lt(Big.from("1e9"))
  ) {
    return;
  }

  if (
    state.story.act === 3 &&
    insightEarnedThisExit >= PRESTIGE.EXIT_MIN_INSIGHT &&
    state.res.money.lt(Big.from("1e13"))
  ) {
    return;
  }

  const available = calculateAvailableInsightGain(state);
  const targetGain =
    insightEarnedThisExit <= 0
      ? PRESTIGE.REWRITE_MIN_FIRST
      : Math.max(1, insightEarnedThisExit * 0.5);

  if (available >= targetGain) {
    performRewrite(state, cache);
  }
}

function maybeExit(state: GameState, cache: DerivedCache): void {
  if (state.prestige.endingChoice !== undefined && !state.aurora.completed) {
    return;
  }

  if (state.story.act >= 9) {
    return;
  }

  const preview = createExitPreview(state);

  if (
    state.prestige.exits === 0 &&
    preview.canExit &&
    preview.gain >= SIM_FIRST_EXIT_MIN_EQUITY_GAIN
  ) {
    performExit(state, cache);
  }
}

function maybeIteration(state: GameState, cache: DerivedCache): void {
  if (state.prestige.endingChoice !== undefined && !state.aurora.completed) {
    return;
  }

  if (createIterationPreview(state, cache).canIterate) {
    performIteration(state, cache);
  }
}

function startUsefulProjects(state: GameState, cache: DerivedCache): void {
  if (state.projects.active.length > 0) {
    return;
  }

  const waitingForAct4Incident =
    state.story.act === 4 && !state.story.seen.has("a4_04_codebase_dreams");
  const debtEfficiency = calculateDebtEfficiency(state);
  const needsFirstRefactor = !state.story.seen.has("a1_04_first_refactor") && debtEfficiency < 0.8;
  const lastRefactorAt = getNumericStat(state, SIM_LAST_REFACTOR_AT_STAT);
  const needsEmergencyRefactor =
    debtEfficiency < 0.35 && state.meta.playtimeS - lastRefactorAt >= SIM_REFACTOR_COOLDOWN_S;

  if (
    state.story.act < 9 &&
    !waitingForAct4Incident &&
    (needsFirstRefactor || needsEmergencyRefactor)
  ) {
    if (startProject(state, "p_refactor", cache).ok) {
      state.stats[SIM_LAST_REFACTOR_AT_STAT] = state.meta.playtimeS;
      return;
    }
  }

  if (cache.project.boardSlots <= 0) {
    return;
  }

  const offers = getVisibleProjectOffers(state, cache)
    .map((offer) => getProject(offer.projectId))
    .filter((project) => project !== undefined)
    .filter((project) => Number.isFinite(getProjectScore(project!, state, cache)))
    .sort(
      (left, right) => getProjectScore(right!, state, cache) - getProjectScore(left!, state, cache)
    );

  for (const project of offers) {
    if (project === undefined) {
      break;
    }

    const result = startProject(state, project.id, cache);
    if (result.ok) {
      return;
    }

    if (result.reason === "compute" && startProject(state, project.id, cache, "hosted").ok) {
      return;
    }
  }
}

function getProjectScore(
  project: NonNullable<ReturnType<typeof getProject>>,
  state: GameState,
  cache: DerivedCache
): number {
  if (
    project.kind === "standard" &&
    project.recurringRevenue === false &&
    getNumericStat(state, `project.${project.id}.shipped`) > 0
  ) {
    return Number.NEGATIVE_INFINITY;
  }

  const payout = getProjectPayout(project, cache);
  if (payout.eq0()) {
    return Number.NEGATIVE_INFINITY;
  }

  return payout.log10() - Math.log10(Math.max(1, getProjectBuildTime(project, cache)));
}

function buyBestGenerators(state: GameState, cache: DerivedCache, strategy: Strategy): void {
  const maxBuys =
    strategy === "maxer" || strategy === "story-rush" ? 80 : strategy === "active" ? 50 : 30;

  for (let buy = 0; buy < maxBuys; buy += 1) {
    const generator = getBestGeneratorToBuy(state, cache);
    if (generator === undefined || !buyGenerator(state, cache, generator.id, "max").ok) {
      return;
    }
  }
}

function getBestGeneratorToBuy(
  state: GameState,
  cache: DerivedCache
): GeneratorDefinition | undefined {
  let best: GeneratorDefinition | undefined;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const generator of GENERATORS) {
    if (!isGeneratorUnlocked(state, generator)) {
      continue;
    }

    if (shouldDelayDebtReducers(state) && generator.debtReductionPerSecond !== undefined) {
      continue;
    }

    const owned = state.owned.generators[generator.id] ?? 0;
    const cost = getGeneratorCost(generator, owned, 1, cache.costs.generatorMultiplier);
    const entry = cache.generatorEntries[generator.id];
    if (
      entry === undefined ||
      cost.lte(Big.zero()) ||
      !canSpendMoneyForSim(state, cost) ||
      cache.compute.available < getEffectiveComputeUse(generator, cache)
    ) {
      continue;
    }

    const rate = entry.rate.eq0() ? generator.baseRate : entry.rate;
    const score =
      cache.compute.available < cache.compute.cap * 0.25
        ? rate.log10() - Math.log10(Math.max(1, getEffectiveComputeUse(generator, cache)))
        : rate.log10() - cost.log10();
    if (score > bestScore) {
      best = generator;
      bestScore = score;
    }
  }

  return best;
}

function canSpendMoneyForSim(state: GameState, cost: Big): boolean {
  if (state.res.money.lt(cost)) {
    return false;
  }

  const reserve = getEraReserveForSim(state);

  if (reserve.eq0()) {
    return true;
  }

  if (state.res.money.lt(reserve)) {
    return true;
  }

  return Big.sub(state.res.money, cost).gte(reserve);
}

function getEraReserveForSim(state: GameState): Big {
  if (getNumericStat(state, SHIPPED_STAT) < 3) {
    return Big.zero();
  }

  const nextEra = getNextEra(state);
  const nextCost = nextEra === undefined ? undefined : getEraCost(state, nextEra);

  return nextCost === undefined
    ? Big.zero()
    : Big.mul(nextCost, Big.fromNumber(SIM_ERA_RESERVE_RATIO));
}

function shouldDelayDebtReducers(state: GameState): boolean {
  return !state.story.seen.has("a4_04_codebase_dreams");
}

function choosePendingStory(state: GameState, cache: DerivedCache): void {
  const choices: Readonly<Record<string, string>> = {
    a1_10_act_end: "accept",
    a2_06_demo_day_incident: "hotfix",
    a3_02_takeover_offer: "sell",
    a3_09_incident_two: "reroute",
    a4_04_codebase_dreams: "audit",
    a5_12_final_choice: "merge",
    a5_17_aurora_complete: "continue"
  };

  for (const [eventId, choiceId] of Object.entries(choices)) {
    chooseStoryOption(state, eventId, choiceId, cache);
  }
}

function recordMilestones(state: GameState, milestones: Milestone[]): void {
  const shipped = getNumericStat(state, SHIPPED_STAT);
  maybeMilestone(state, milestones, "Tutorial done", shipped >= 3);
  maybeMilestone(state, milestones, "First REWRITE", state.prestige.rewrites >= 1);
  maybeMilestone(state, milestones, "Act 1 finale", state.story.act >= 2);
  maybeMilestone(state, milestones, "Act 2 finale", state.story.act >= 3);
  maybeMilestone(state, milestones, "First EXIT", state.prestige.exits >= 1);
  maybeMilestone(state, milestones, "Act 3 finale", state.story.act >= 4);
  maybeMilestone(state, milestones, "Act 4 finale", state.story.act >= 5);
  maybeMilestone(state, milestones, "OMEGA finale", state.prestige.endingChoice !== undefined);
  maybeMilestone(state, milestones, "Aurora unlocked", state.aurora.unlocked);
  maybeMilestone(state, milestones, "Aurora complete", state.aurora.completed);
  maybeMilestone(state, milestones, "Iteration 1", state.prestige.iteration >= 1);
  maybeMilestone(state, milestones, "Iteration 5", state.prestige.iteration >= 5);
}

function maybeMilestone(
  state: GameState,
  milestones: Milestone[],
  label: string,
  reached: boolean
): void {
  if (!reached || milestones.some((milestone) => milestone.label === label)) {
    return;
  }

  milestones.push({
    act: state.story.act,
    atH: state.meta.playtimeS / 3600,
    label
  });
}

function getCriticalMissingEvents(missingEvents: readonly string[]): readonly string[] {
  return missingEvents.filter((eventId) => !eventId.startsWith("d_strategy_"));
}

function getNumericStat(state: GameState, key: string): number {
  const value = state.stats[key];
  return typeof value === "number" ? value : 0;
}

function getMaxBigExponent(...values: readonly unknown[]): number {
  let maxExponent = 0;
  const stack = [...values];
  const seen = new Set<object>();

  while (stack.length > 0) {
    const value = stack.pop();

    if (value instanceof Big) {
      maxExponent = Math.max(maxExponent, value.e);
      continue;
    }

    if (typeof value !== "object" || value === null || seen.has(value)) {
      continue;
    }

    seen.add(value);

    if (Array.isArray(value)) {
      stack.push(...value);
      continue;
    }

    stack.push(...Object.values(value as Record<string, unknown>));
  }

  return maxExponent;
}

export function readArgs(values: readonly string[]): SimArgs {
  let hours = 80;
  let strategy: Strategy = "sane";
  let endlessIterations: number | undefined;
  let continueAfterOmega = false;

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    const next = values[index + 1];

    if (value === "--continue-after-omega") {
      continueAfterOmega = true;
      continue;
    }

    if (value === "--hours") {
      if (next === undefined) {
        throw new Error("sim: --hours requires a positive number");
      }
      hours = Number(next);
      index += 1;
      continue;
    }

    if (value === "--strategy") {
      if (next === undefined) {
        throw new Error("sim: --strategy requires a strategy name");
      }
      strategy = readStrategy(next);
      index += 1;
      continue;
    }

    if (value === "--endless-iterations") {
      if (next === undefined) {
        throw new Error("sim: --endless-iterations requires a positive integer");
      }
      endlessIterations = Number(next);
      index += 1;
      continue;
    }

    throw new Error(`sim: unknown argument ${value ?? ""}`);
  }

  if (!Number.isFinite(hours) || hours <= 0) {
    throw new Error("sim: --hours must be a positive number");
  }

  if (
    endlessIterations !== undefined &&
    (!Number.isInteger(endlessIterations) || endlessIterations <= 0)
  ) {
    throw new Error("sim: --endless-iterations must be a positive integer");
  }

  return { continueAfterOmega, endlessIterations, hours, strategy };
}

function readStrategy(value: string): Strategy {
  if (
    value === "active" ||
    value === "casual" ||
    value === "idle_only" ||
    value === "maxer" ||
    value === "offline-heavy" ||
    value === "sane" ||
    value === "story-rush"
  ) {
    return value;
  }

  throw new Error(`sim: unknown strategy ${value}`);
}

function isCliEntry(): boolean {
  return process.argv[1]?.replace(/\\/g, "/").endsWith("tools/sim/index.ts") === true;
}
