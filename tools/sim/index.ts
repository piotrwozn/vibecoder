import { Big } from "../../src/core/bignum.ts";
import { createDefaultGameState, type GameState } from "../../src/core/state.ts";
import { PRESTIGE } from "../../src/data/constants.ts";
import { GENERATORS, type GeneratorDefinition } from "../../src/data/generators.ts";
import type { HardwareDefinition } from "../../src/data/hardware.ts";
import { INSIGHT_NODES } from "../../src/data/prestige.ts";
import { RESEARCH } from "../../src/data/research.ts";
import { buyUpgrade, getVisibleUpgrades } from "../../src/systems/upgrades.ts";
import {
  buyHardware,
  getAvailableHardware,
  getHardwareCost,
  isHardwareMaxed
} from "../../src/systems/compute.ts";
import { calculateDebtEfficiency, tickDebt } from "../../src/systems/debt.ts";
import { buyNextEra } from "../../src/systems/eras.ts";
import { tickHype } from "../../src/systems/hype.ts";
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
import { STORY_EVENTS, chooseStoryOption, tickStory } from "../../src/systems/story.ts";

const COMPLETE_MIN_H = 45;
const COMPLETE_MAX_H = 70;
const DT_S = 1;
const IDLE_LOGIN_INTERVAL_S = 8 * 60 * 60;
const SHIPPED_STAT = "projects.shipped";
const CAMPAIGN_EVENT_COUNT = STORY_EVENTS.filter((event) => event.act !== 9).length;

type Strategy = "idle_only" | "maxer" | "sane";

interface SimArgs {
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
  readonly completeH?: number;
  readonly milestones: readonly Milestone[];
  readonly missingEvents: readonly string[];
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
  const args = readArgs(process.argv.slice(2));

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
  const complete = result.state.prestige.endingChoice !== undefined;
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
    } events=${result.seenEvents}/${CAMPAIGN_EVENT_COUNT} missing=${result.missingEvents.length} max_e=${maxExponent}`
  );

  for (const milestone of result.milestones) {
    console.log(
      `milestone: ${milestone.label} at ${milestone.atH.toFixed(2)}h act=${milestone.act}`
    );
  }

  if (
    args.strategy === "sane" &&
    args.hours >= COMPLETE_MAX_H &&
    (!complete ||
      result.completeH === undefined ||
      result.completeH < COMPLETE_MIN_H ||
      result.completeH > COMPLETE_MAX_H ||
      result.missingEvents.length > 0)
  ) {
    console.error(
      `sim: FAIL complete_h=${result.completeH?.toFixed(2) ?? "n/a"} missing=${result.missingEvents.join(",")}`
    );
    process.exit(1);
  }
}

export function runEndlessSmokeSim(iterations: number): EndlessSmokeResult {
  const state = createDefaultGameState(0, "full");
  const cache = createDerivedCache();
  let maxExponent = 0;

  state.prestige.endingChoice = "fork";
  state.story.flags.add("iteration_unlocked");
  state.story.act = 9;
  state.owned.paradoxItems.add("x_start_insight");
  seedEndlessInsight(state, iterations);
  recomputeDerivedCache(state, cache);

  while (state.prestige.iteration < iterations) {
    seedEndlessRunResources(state, iterations);
    recomputeDerivedCache(state, cache);

    for (let second = 0; second < PRESTIGE.ITER_HOLD_S * PRESTIGE.PARADOX_BASE; second += DT_S) {
      state.meta.playtimeS += DT_S;
      tickEndlessStrategy(state, cache);
      tickProduction(state, cache, DT_S);
      tickProjects(state, cache, DT_S);
      tickHype(state, DT_S, cache);
      tickDebt(state, cache, DT_S);
      tickIterationHold(state, cache, DT_S);
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

function seedEndlessInsight(state: GameState, iterations: number): void {
  const seedExponent =
    PRESTIGE.ITER_SOFTCAP_BASE_E +
    PRESTIGE.ITER_SOFTCAP_STEP_E * (iterations + PRESTIGE.PARADOX_BASE);
  state.res.insight = Big.max(state.res.insight, Big.fromLog10(seedExponent));
}

function seedEndlessRunResources(state: GameState, iterations: number): void {
  const seedExponent =
    PRESTIGE.ITER_SOFTCAP_BASE_E +
    PRESTIGE.ITER_SOFTCAP_STEP_E * (iterations + PRESTIGE.PARADOX_BASE) +
    PRESTIGE.ITER_COST_E_PER_K * (state.prestige.iteration + PRESTIGE.PARADOX_BASE);
  state.res.money = Big.max(state.res.money, Big.fromLog10(seedExponent));
}

function tickEndlessStrategy(state: GameState, cache: DerivedCache): void {
  buyAffordableEraAndHardware(state, cache);
  buyAffordableUpgrades(state, cache);
  buyAffordableResearch(state, cache);
  buyAffordableInsight(state, cache);
  startUsefulProjects(state, cache);
  buyBestGenerators(state, cache, "maxer");
  buyAffordableEraAndHardware(state, cache);
}

export function runCampaignSim(args: SimArgs): CampaignSimResult {
  const state = createDefaultGameState(0, "full");
  const cache = createDerivedCache();
  const milestones: Milestone[] = [];
  let completeH: number | undefined;

  recomputeDerivedCache(state, cache);

  for (let second = 1; second <= args.hours * 3600; second += DT_S) {
    state.meta.playtimeS = second;
    tickStrategy(state, cache, args.strategy);
    tickPromptFlow(state, DT_S);
    tickProduction(state, cache, DT_S);
    tickProjects(state, cache, DT_S);
    tickHype(state, DT_S, cache);
    tickDebt(state, cache, DT_S);
    tickStory(state, DT_S, cache);
    tickIterationHold(state, cache, DT_S);
    choosePendingStory(state, cache);
    maybeIteration(state, cache);
    if (second % 60 === 0) {
      recomputeDerivedCache(state, cache);
    }
    recordMilestones(state, milestones);

    if (state.prestige.endingChoice !== undefined && completeH === undefined) {
      completeH = state.meta.playtimeS / 3600;
    }
  }

  const requiredEvents = STORY_EVENTS.filter((event) => event.act !== 9);
  const missingEvents = requiredEvents
    .filter((event) => !state.story.seen.has(event.id))
    .map((event) => event.id);

  return {
    cache,
    completeH,
    milestones,
    missingEvents,
    seenEvents: requiredEvents.length - missingEvents.length,
    state
  };
}

function tickStrategy(state: GameState, cache: DerivedCache, strategy: Strategy): void {
  const active = state.story.act >= 5 || isStrategyActive(state.meta.playtimeS, strategy);

  if (active) {
    performPromptClick(state, cache);
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

function isStrategyActive(playtimeS: number, strategy: Strategy): boolean {
  switch (strategy) {
    case "maxer":
      return true;
    case "idle_only":
      return playtimeS % IDLE_LOGIN_INTERVAL_S < 60;
    case "sane":
      return playtimeS % 3 < 1;
  }
}

function getDecisionIntervalS(strategy: Strategy): number {
  return strategy === "maxer" ? 30 : 180;
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
  return getAvailableHardware(state)
    .filter((entry) => !isHardwareMaxed(entry, state.owned.hardware[entry.id] ?? 0))
    .filter((entry) => state.res.money.gte(getHardwareCostForSim(state, entry)))
    .sort(
      (left, right) => getHardwareScoreForSim(state, right) - getHardwareScoreForSim(state, left)
    )[0];
}

function shouldCompletePcHardware(state: GameState): boolean {
  return (
    !state.hardware.pcComplete &&
    state.era >= 3 &&
    getAvailableHardware(state).some(
      (entry) =>
        entry.phase === "pc" &&
        !isHardwareMaxed(entry, state.owned.hardware[entry.id] ?? 0) &&
        state.res.money.gte(getHardwareCostForSim(state, entry))
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
      state.res.money.gte(cost) &&
      cache.compute.available < getEffectiveComputeUse(generator, cache)
    );
  });
}

function buyAffordableEras(state: GameState, cache: DerivedCache): void {
  while (buyNextEra(state).ok) {
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
    if (buyUpgrade(state, cache, upgrade.id).ok) {
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
  if (state.story.act >= 9) {
    return;
  }

  if (state.story.act === 1 && state.prestige.rewrites > 0 && state.res.money.lt(Big.from("1e6"))) {
    return;
  }

  if (
    state.story.act === 2 &&
    state.prestige.rewrites >= 2 &&
    state.res.money.lt(Big.from("1e9"))
  ) {
    return;
  }

  const available = calculateAvailableInsightGain(state);
  const targetGain =
    state.prestige.rewrites === 0
      ? PRESTIGE.REWRITE_MIN_FIRST
      : Math.max(1, state.lifetime.insightSinceExit * 0.5);

  if (available >= targetGain) {
    performRewrite(state, cache);
  }
}

function maybeExit(state: GameState, cache: DerivedCache): void {
  if (state.story.act >= 9) {
    return;
  }

  const preview = createExitPreview(state);

  if (state.prestige.exits === 0 && preview.canExit && preview.gain >= 10) {
    performExit(state, cache);
  }
}

function maybeIteration(state: GameState, cache: DerivedCache): void {
  if (createIterationPreview(state, cache).canIterate) {
    performIteration(state, cache);
  }
}

function startUsefulProjects(state: GameState, cache: DerivedCache): void {
  const waitingForAct4Incident =
    state.story.act === 4 && !state.story.seen.has("a4_04_codebase_dreams");

  if (state.story.act < 9 && !waitingForAct4Incident && calculateDebtEfficiency(state) < 0.8) {
    startProject(state, "p_refactor", cache);
  }

  if (state.projects.active.length >= cache.project.boardSlots) {
    return;
  }

  const offers = getVisibleProjectOffers(state, cache)
    .map((offer) => getProject(offer.projectId))
    .filter((project) => project !== undefined)
    .sort((left, right) => getProjectScore(right!, cache) - getProjectScore(left!, cache));

  for (const project of offers) {
    if (project === undefined || state.projects.active.length >= cache.project.boardSlots) {
      break;
    }

    startProject(state, project.id, cache);
  }
}

function getProjectScore(
  project: NonNullable<ReturnType<typeof getProject>>,
  cache: DerivedCache
): number {
  const payout = getProjectPayout(project, cache);
  if (payout.eq0()) {
    return Number.NEGATIVE_INFINITY;
  }

  return payout.log10() - Math.log10(Math.max(1, getProjectBuildTime(project, cache)));
}

function buyBestGenerators(state: GameState, cache: DerivedCache, strategy: Strategy): void {
  const maxBuys = strategy === "maxer" ? 80 : 30;

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
      state.res.money.lt(cost) ||
      cache.compute.available < getEffectiveComputeUse(generator, cache)
    ) {
      continue;
    }

    const rate = entry.rate.eq0() ? generator.baseRate : entry.rate;
    const score = rate.log10() - cost.log10();
    if (score > bestScore) {
      best = generator;
      bestScore = score;
    }
  }

  return best;
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
    a5_12_final_choice: "merge"
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
  maybeMilestone(state, milestones, "Act 5 finale", state.prestige.endingChoice !== undefined);
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

function readArgs(values: readonly string[]): SimArgs {
  let hours = 80;
  let strategy: Strategy = "sane";
  let endlessIterations: number | undefined;

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    const next = values[index + 1];

    if (value === "--hours" && next !== undefined) {
      hours = Number(next);
      index += 1;
      continue;
    }

    if (value === "--strategy" && next !== undefined) {
      strategy = readStrategy(next);
      index += 1;
      continue;
    }

    if (value === "--endless-iterations" && next !== undefined) {
      endlessIterations = Number(next);
      index += 1;
    }
  }

  if (!Number.isFinite(hours) || hours < 0) {
    hours = 80;
  }

  if (
    endlessIterations !== undefined &&
    (!Number.isFinite(endlessIterations) || endlessIterations < 0)
  ) {
    endlessIterations = undefined;
  }

  return { endlessIterations, hours, strategy };
}

function readStrategy(value: string): Strategy {
  if (value === "idle_only" || value === "maxer" || value === "sane") {
    return value;
  }

  return "sane";
}

function isCliEntry(): boolean {
  return process.argv[1]?.replace(/\\/g, "/").endsWith("tools/sim/index.ts") === true;
}
