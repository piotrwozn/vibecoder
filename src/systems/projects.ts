import type { EventBus } from "../core/bus";
import { Big } from "../core/bignum";
import type {
  ActiveBuild,
  GameState,
  Product,
  ProjectDeploymentMode,
  ProjectOffer
} from "../core/state";
import { REFACTOR_COMPLETED_STAT } from "../data/conditions";
import { C } from "../data/constants";
import { BUILD_MOMENTUM } from "../data/momentum";
import {
  PROJECTS,
  PROJECT_MAX_LEVEL,
  PROJECT_REVENUE_LEVEL_BONUS,
  REFACTOR_PROJECT,
  type ProjectDefinition
} from "../data/projects";
import { isDemoLocked } from "./demo";
import { addShipHype } from "./hype";
import { unlockAurora } from "./aurora";
import { getAvailableCompute } from "./compute";
import { hasPendingIncident } from "./debt";
import { addBuildMomentum } from "./momentum";
import {
  getAngelNetworkMultiplierAt,
  recomputeDerivedCache,
  type DerivedCache
} from "./production";
import { recordProjectChainProgress } from "./project-chains";
import {
  addNonNegativeBig,
  addNonNegativeNumber,
  canSpendBig,
  isPositiveBig,
  isPositiveFinite,
  spendBig
} from "./resources";
import { checkCondition } from "./unlocks";

const PROJECT_STARTED_STAT = "projects.started";
const PROJECT_SHIPPED_STAT = "projects.shipped";
const PROJECT_STARTED_PREFIX = "project.started.";
const PROJECT_GLOBAL_COST_GROWTH = C.PROJECT_GLOBAL_COST_GROWTH;
const PROJECT_TEMPLATE_COST_GROWTH = C.PROJECT_TEMPLATE_COST_GROWTH;
const PROJECT_BY_ID = new Map(PROJECTS.map((project) => [project.id, project]));

export interface StartProjectResult {
  readonly cost: Big;
  readonly id: string;
  readonly ok: boolean;
  readonly reason?:
    | "busy"
    | "compute"
    | "demoLocked"
    | "locked"
    | "maxLevel"
    | "unaffordable"
    | "missing";
}

export interface SetProjectDeploymentResult {
  readonly id: string;
  readonly mode: ProjectDeploymentMode;
  readonly ok: boolean;
  readonly reason?: "compute" | "missing" | "same";
}

interface StandardCompletionResult {
  readonly level: number;
  readonly payout: Big;
  readonly reachedMaxLevel: boolean;
  readonly upgraded: boolean;
}

export function ensureProjectBoard(state: GameState): void {
  if (state.projects.board.length > 0) {
    syncProjectBoard(state);
    return;
  }

  refreshProjectBoard(state);
}

export function refreshProjectBoard(state: GameState): void {
  state.projects.board = createProjectBoardOffers(state);
  state.projects.boardRefreshAt = state.meta.playtimeS + C.PROJECT_REFRESH_S;
}

export function startProject(
  state: GameState,
  projectId: string,
  cache: DerivedCache,
  deploymentModeOrBus: ProjectDeploymentMode | EventBus = "selfHosted",
  maybeBus?: EventBus
): StartProjectResult {
  const deploymentMode =
    typeof deploymentModeOrBus === "string" ? deploymentModeOrBus : "selfHosted";
  const bus = typeof deploymentModeOrBus === "string" ? maybeBus : deploymentModeOrBus;
  const project = getProject(projectId);

  if (project === undefined) {
    return { cost: Big.zero(), id: projectId, ok: false, reason: "missing" };
  }

  if (isDemoLocked(state, project)) {
    return { cost: Big.zero(), id: projectId, ok: false, reason: "demoLocked" };
  }

  if (!isProjectUnlocked(state, project)) {
    return { cost: Big.zero(), id: projectId, ok: false, reason: "locked" };
  }

  if (hasActiveProjectBuild(state)) {
    return { cost: Big.zero(), id: projectId, ok: false, reason: "busy" };
  }

  if (project.kind === "standard" && getOwnedProductLevel(state, project.id) >= PROJECT_MAX_LEVEL) {
    return { cost: Big.zero(), id: projectId, ok: false, reason: "maxLevel" };
  }

  const cost = getProjectCost(project, cache, state);

  if (!canSpendBig(state.res.loc, cost)) {
    return { cost, id: projectId, ok: false, reason: "unaffordable" };
  }

  const nextLevel = getProjectNextLevel(state, project);
  const computeUse = getProjectBuildComputeUse(state, project, nextLevel, deploymentMode);
  if (deploymentMode === "selfHosted" && computeUse > getAvailableCompute(state, cache)) {
    return { cost, id: projectId, ok: false, reason: "compute" };
  }

  const activeBuild = createActiveBuild(state, project, cache, cost, deploymentMode, computeUse);
  spendBig(state.res.loc, cost);
  state.projects.active.push(activeBuild);
  recomputeDerivedCache(state, cache);
  if (project.kind === "standard" || project.kind === "unlock") {
    state.stats[PROJECT_STARTED_STAT] = getNumericStat(state, PROJECT_STARTED_STAT) + 1;
    state.stats[getProjectStartedStatKey(project.id)] =
      getNumericStat(state, getProjectStartedStatKey(project.id)) + 1;
  }

  bus?.emit("res:changed", "loc");
  bus?.emit("res:changed", "computeUsed");
  return { cost, id: projectId, ok: true };
}

export function hasActiveProjectBuild(state: GameState): boolean {
  return state.projects.active.length > 0;
}

export function tickProjectBuilds(
  state: GameState,
  cache: DerivedCache,
  dtS: number,
  bus?: EventBus
): boolean {
  return tickActiveBuilds(state, cache, dtS, bus);
}

export function tickProjects(
  state: GameState,
  cache: DerivedCache,
  dtS: number,
  bus?: EventBus
): boolean {
  let changed = tickProjectIncome(state, cache, dtS, bus);
  changed = tickActiveBuilds(state, cache, dtS, bus) || changed;
  if (state.projects.boardRefreshAt > 0 && state.meta.playtimeS >= state.projects.boardRefreshAt) {
    refreshProjectBoard(state);
    changed = true;
  }
  return changed;
}

export function tickProjectIncome(
  state: GameState,
  cache: DerivedCache,
  dtS: number,
  bus?: EventBus
): boolean {
  if (!isPositiveFinite(dtS)) {
    return false;
  }

  const incomeRate = getProjectIncomeRate(state, cache);

  if (!isPositiveBig(incomeRate)) {
    return false;
  }

  const income = Big.mul(incomeRate, Big.fromNumber(dtS));
  if (!addNonNegativeBig(state.res.money, income)) {
    return false;
  }

  addNonNegativeBig(state.lifetime.money, income);
  bus?.emit("res:changed", "money");
  return true;
}

export function getProjectCost(
  project: ProjectDefinition,
  cache: DerivedCache,
  state?: GameState
): Big {
  const iterationCost = cache.costs.projectMultiplier;

  switch (project.kind) {
    case "refactor":
      return Big.mul(
        Big.mul(cache.locRate, Big.fromNumber(C.REFACTOR_COST_SECONDS)),
        iterationCost
      );
    case "unlock":
    case "standard":
      return Big.mul(
        Big.mul(project.costLoC, getProjectStartCostMultiplier(project, state)),
        iterationCost
      );
  }
}

function getProjectStartCostMultiplier(project: ProjectDefinition, state?: GameState): Big {
  if (state === undefined) {
    return Big.one();
  }

  const globalMultiplier =
    1 + getNumericStat(state, PROJECT_STARTED_STAT) * PROJECT_GLOBAL_COST_GROWTH;
  const templateMultiplier =
    1 + getNumericStat(state, getProjectStartedStatKey(project.id)) * PROJECT_TEMPLATE_COST_GROWTH;
  return Big.fromNumber(globalMultiplier * templateMultiplier);
}

function getProjectStartedStatKey(projectId: string): string {
  return `${PROJECT_STARTED_PREFIX}${projectId}`;
}

export function getProjectPayout(
  project: ProjectDefinition,
  cache: DerivedCache,
  state?: GameState
): Big {
  const liveMultiplier = state === undefined ? 1 : getAngelNetworkMultiplierAt(state);
  return Big.mul(
    getBaseProjectPayout(project),
    Big.fromNumber(cache.project.payoutMultiplier * liveMultiplier)
  );
}

export function getProjectRevenue(
  project: ProjectDefinition,
  cache: DerivedCache,
  level = 1,
  state?: GameState,
  playtimeS = state?.meta.playtimeS
): Big {
  return Big.mul(
    getProjectPortfolioRevenue(project, level),
    getPortfolioIncomeMultiplier(cache, state?.res.hype ?? 1, state, playtimeS)
  );
}

export function getProjectLevel(state: GameState, project: ProjectDefinition): number {
  if (project.kind !== "standard") {
    return 0;
  }

  return getOwnedProductLevel(state, project.id);
}

export function getProjectMaxLevel(project: ProjectDefinition): number {
  if (project.kind !== "standard") {
    return 1;
  }

  return PROJECT_MAX_LEVEL;
}

export function getProjectTotalComputeUse(project: ProjectDefinition, level = 1): number {
  if (project.kind !== "standard" || project.recurringRevenue === false) {
    return 0;
  }

  const baseCompute = Math.ceil(2 + project.era * 1.4 + Math.max(0, project.valueRatio - 0.5) * 4);
  return Math.ceil(baseCompute * (1 + Math.max(0, level - 1) * 0.55));
}

export function getProjectBuildComputeUse(
  state: GameState,
  project: ProjectDefinition,
  level = getProjectNextLevel(state, project),
  deploymentMode: ProjectDeploymentMode = "selfHosted"
): number {
  if (deploymentMode === "hosted") {
    return 0;
  }

  const totalCompute = getProjectTotalComputeUse(project, level);
  if (totalCompute <= 0) {
    return 0;
  }

  const product = getUpgradeableProductByProjectId(state, project.id);
  if (product === undefined || product.deploymentMode !== "selfHosted") {
    return totalCompute;
  }

  return Math.max(0, totalCompute - product.computeUse);
}

export function getProjectExpectedHostingRate(
  project: ProjectDefinition,
  cache: DerivedCache,
  level = 1,
  state?: GameState,
  playtimeS = state?.meta.playtimeS
): Big {
  const computeUse = getProjectTotalComputeUse(project, level);
  if (computeUse <= 0) {
    return Big.zero();
  }

  return Big.mul(
    getProjectRevenue(project, cache, level, state, playtimeS),
    Big.fromNumber(getProductHostingCostRatio(computeUse))
  );
}

export function getProjectNextLevel(state: GameState, project: ProjectDefinition): number {
  if (project.kind !== "standard") {
    return 1;
  }

  const ownedLevel = getOwnedProductLevel(state, project.id);

  if (ownedLevel <= 0) {
    return 1;
  }

  return Math.min(ownedLevel + 1, getProjectMaxLevel(project));
}

export function getProductRevenue(
  product: Product,
  cache: DerivedCache,
  hype = 1,
  state?: GameState,
  playtimeS = state?.meta.playtimeS
): Big {
  const bugPenalty = product.bugged ? cache.debt.bugPenalty : 1;
  return Big.mul(
    getProductGrossRevenue(product, cache, hype, state, playtimeS),
    Big.fromNumber(bugPenalty)
  );
}

export function getProductGrossRevenue(
  product: Product,
  cache: DerivedCache,
  hype = 1,
  state?: GameState,
  playtimeS = state?.meta.playtimeS
): Big {
  return Big.mul(
    getProductPortfolioRevenue(product),
    getPortfolioIncomeMultiplier(cache, hype, state, playtimeS)
  );
}

export function getProductHostingCostRatio(computeUse: number): number {
  if (!Number.isFinite(computeUse) || computeUse <= 0) {
    return 0;
  }

  return Math.min(0.85, 0.12 + computeUse * 0.018);
}

export function getProductHostingRate(
  product: Product,
  cache: DerivedCache,
  hype = 1,
  state?: GameState,
  playtimeS = state?.meta.playtimeS
): Big {
  if (product.deploymentMode !== "hosted" || product.computeUse <= 0) {
    return Big.zero();
  }

  return Big.mul(
    getProductGrossRevenue(product, cache, hype, state, playtimeS),
    Big.fromNumber(getProductHostingCostRatio(product.computeUse))
  );
}

export function getProductNetRevenue(
  product: Product,
  cache: DerivedCache,
  hype = 1,
  state?: GameState,
  playtimeS = state?.meta.playtimeS
): Big {
  return Big.sub(
    getProductRevenue(product, cache, hype, state, playtimeS),
    getProductHostingRate(product, cache, hype, state, playtimeS)
  );
}

export function getProjectIncomeRate(
  state: GameState,
  cache: DerivedCache,
  hype = state.res.hype,
  playtimeS = state.meta.playtimeS
): Big {
  let productRevenue = Big.zero();

  for (const product of state.projects.portfolio) {
    productRevenue = Big.add(
      productRevenue,
      getProductRevenue(product, cache, hype, state, playtimeS)
    );
  }

  return productRevenue;
}

export function getProjectHostingRate(
  state: GameState,
  cache: DerivedCache,
  hype = state.res.hype,
  playtimeS = state.meta.playtimeS
): Big {
  let hostingRate = Big.zero();

  for (const product of state.projects.portfolio) {
    hostingRate = Big.add(
      hostingRate,
      getProductHostingRate(product, cache, hype, state, playtimeS)
    );
  }

  return hostingRate;
}

export function setProductDeploymentMode(
  state: GameState,
  productId: string,
  mode: ProjectDeploymentMode,
  cache: DerivedCache,
  bus?: EventBus
): SetProjectDeploymentResult {
  const productIndex = state.projects.portfolio.findIndex((product) => product.id === productId);

  if (productIndex < 0) {
    return { id: productId, mode, ok: false, reason: "missing" };
  }

  const product = state.projects.portfolio[productIndex];
  if (product === undefined) {
    return { id: productId, mode, ok: false, reason: "missing" };
  }

  if (product.deploymentMode === mode) {
    return { id: productId, mode, ok: false, reason: "same" };
  }

  if (mode === "selfHosted" && product.computeUse > getAvailableCompute(state, cache)) {
    return { id: productId, mode, ok: false, reason: "compute" };
  }

  state.projects.portfolio[productIndex] = {
    ...product,
    deploymentMode: mode
  };
  recomputeDerivedCache(state, cache);
  bus?.emit("res:changed", "computeUsed");
  return { id: productId, mode, ok: true };
}

export function getProject(id: string): ProjectDefinition | undefined {
  if (id === REFACTOR_PROJECT.id) {
    return REFACTOR_PROJECT;
  }

  return PROJECT_BY_ID.get(id);
}

export function getVisibleProjectOffers(
  state: GameState,
  cache?: DerivedCache
): readonly ProjectOffer[] {
  ensureProjectBoard(state);
  return state.projects.board
    .filter((offer) => {
      const project = getProject(offer.projectId);
      return project !== undefined && isProjectBoardCandidate(state, project);
    })
    .slice(0, cache?.project.boardSlots ?? C.PROJECT_BOARD_BASE_SLOTS);
}

function tickActiveBuilds(
  state: GameState,
  cache: DerivedCache,
  dtS: number,
  bus?: EventBus
): boolean {
  if (state.projects.active.length === 0 || !isPositiveFinite(dtS)) {
    return false;
  }

  const remainingBuilds: ActiveBuild[] = [];
  let completed = false;

  for (const build of state.projects.active) {
    const nextElapsedS = Math.min(build.buildS, build.elapsedS + dtS);
    const nextBuild = { ...build, elapsedS: nextElapsedS };

    if (nextElapsedS >= build.buildS) {
      completeBuild(state, cache, nextBuild, bus);
      completed = true;
    } else {
      remainingBuilds.push(nextBuild);
    }
  }

  state.projects.active = remainingBuilds;
  if (completed) {
    recomputeDerivedCache(state, cache);
    bus?.emit("res:changed", "computeUsed");
  }
  return true;
}

function completeBuild(
  state: GameState,
  cache: DerivedCache,
  build: ActiveBuild,
  bus?: EventBus
): void {
  const project = getProject(build.projectId);

  if (project === undefined) {
    return;
  }

  if (project.kind === "refactor") {
    Big.mulIn(state.res.debt, Big.fromNumber(cache.debt.refactorMultiplier));
    state.stats[REFACTOR_COMPLETED_STAT] = getNumericStat(state, REFACTOR_COMPLETED_STAT) + 1;
    addBuildMomentum(state, BUILD_MOMENTUM.GAINS.REFACTOR_COMPLETED, bus);
    bus?.emit("res:changed", "debt");
    return;
  }

  let completion: StandardCompletionResult | undefined;

  if (project.kind === "standard") {
    completion = completeStandardBuild(state, project, build);
    if (completion.reachedMaxLevel) {
      rotateCompletedProjectOffer(state, project.id);
    }
  }

  if (project.kind === "unlock") {
    applyProjectCompletionEffect(state, project, bus);
  }

  state.stats[PROJECT_SHIPPED_STAT] = getNumericStat(state, PROJECT_SHIPPED_STAT) + 1;
  state.stats[`project.${project.id}.shipped`] =
    getNumericStat(state, `project.${project.id}.shipped`) + 1;
  addBuildMomentum(state, BUILD_MOMENTUM.GAINS.PROJECT_SHIPPED, bus);
  recordProjectChainProgress(state, project.id, bus);
  grantProjectRp(state, project, cache, bus);
  addShipHype(state, project.era, project.hypeBonus ?? 0, cache, bus);

  bus?.emit("res:changed", "money");
  bus?.emit("shipped", {
    level: completion?.level,
    payout: completion?.payout ?? build.payout,
    projectId: project.id,
    upgraded: completion?.upgraded
  });
}

function createActiveBuild(
  state: GameState,
  project: ProjectDefinition,
  cache: DerivedCache,
  cost: Big,
  deploymentMode: ProjectDeploymentMode,
  computeUse: number
): ActiveBuild {
  const started = getNumericStat(state, PROJECT_STARTED_STAT);

  const nextLevel = getProjectNextLevel(state, project);
  const isFirstShip = project.kind === "standard" && getOwnedProductLevel(state, project.id) === 0;

  return {
    id: `${project.id}.${started + 1}`,
    buildS: getProjectBuildTime(project, cache),
    computeUse,
    cost,
    deploymentMode,
    elapsedS: 0,
    payout:
      project.kind === "standard" && isFirstShip
        ? getProjectPayout(project, cache, state)
        : Big.zero(),
    projectId: project.id,
    revenue:
      project.kind === "standard" ? getProjectPortfolioRevenue(project, nextLevel) : Big.zero()
  };
}

export function getProjectBuildTime(project: ProjectDefinition, cache: DerivedCache): number {
  if (project.kind === "refactor") {
    return cache.project.refactorInstant ? 0 : project.buildS;
  }

  return project.buildS * cache.project.buildTimeMultiplier;
}

function getBaseProjectPayout(project: ProjectDefinition): Big {
  return Big.mul(project.costLoC, Big.fromNumber(project.valueRatio));
}

function getBaseProjectRevenue(project: ProjectDefinition): Big {
  return Big.mul(getBaseProjectPayout(project), Big.fromNumber(C.REVENUE_RATIO));
}

function getProjectPortfolioRevenue(project: ProjectDefinition, level = 1): Big {
  if (project.recurringRevenue === false) {
    return Big.zero();
  }

  const levelMultiplier = 1 + Math.max(0, level - 1) * PROJECT_REVENUE_LEVEL_BONUS;
  return Big.mul(getBaseProjectRevenue(project), Big.fromNumber(levelMultiplier));
}

function getProductPortfolioRevenue(product: Product): Big {
  const project = getProject(product.projectId);

  if (project?.recurringRevenue === false) {
    return Big.zero();
  }

  return product.revenue;
}

export function getPortfolioIncomeMultiplier(
  cache: DerivedCache,
  hype: number,
  state?: GameState,
  playtimeS = state?.meta.playtimeS
): Big {
  const boundedMultiplier = Big.fromNumber(
    hype * getLiveProjectRevenueMultiplier(cache, state, playtimeS)
  );
  return Big.mul(cache.multipliers.prestigeBig, boundedMultiplier);
}

function getLiveProjectRevenueMultiplier(
  cache: DerivedCache,
  state?: GameState,
  playtimeS?: number
): number {
  if (state === undefined) {
    return cache.project.revenueMultiplier;
  }

  let multiplier = cache.project.revenueMultiplier * getAngelNetworkMultiplierAt(state, playtimeS);
  if (hasPendingIncident(state)) {
    multiplier *= 1 - 0.5 * cache.project.incidentPenaltyMultiplier;
  }
  return multiplier;
}

function createProduct(state: GameState, project: ProjectDefinition, build: ActiveBuild): Product {
  return {
    id: `${build.projectId}.${state.projects.portfolio.length + 1}`,
    bugged: false,
    computeUse: getProjectTotalComputeUse(project, 1),
    deploymentMode: build.deploymentMode,
    level: 1,
    projectId: build.projectId,
    revenue: build.revenue,
    shippedAtS: state.meta.playtimeS
  };
}

function completeStandardBuild(
  state: GameState,
  project: ProjectDefinition,
  build: ActiveBuild
): StandardCompletionResult {
  const productIndex = findUpgradeableProductIndexByProjectId(state, project.id);

  if (productIndex < 0) {
    addNonNegativeBig(state.res.money, build.payout);
    addNonNegativeBig(state.lifetime.money, build.payout);
    state.projects.portfolio.push(createProduct(state, project, build));
    return {
      level: 1,
      payout: build.payout,
      reachedMaxLevel: getProjectMaxLevel(project) <= 1,
      upgraded: false
    };
  }

  const product = state.projects.portfolio[productIndex];

  if (product === undefined) {
    return {
      level: 0,
      payout: Big.zero(),
      reachedMaxLevel: false,
      upgraded: false
    };
  }

  const nextLevel = Math.min(product.level + 1, getProjectMaxLevel(project));
  state.projects.portfolio[productIndex] = {
    ...product,
    computeUse: getProjectTotalComputeUse(project, nextLevel),
    deploymentMode: build.deploymentMode,
    level: nextLevel,
    revenue: getProjectPortfolioRevenue(project, nextLevel)
  };

  return {
    level: nextLevel,
    payout: Big.zero(),
    reachedMaxLevel: nextLevel >= getProjectMaxLevel(project),
    upgraded: true
  };
}

export function getOwnedProductLevel(state: GameState, projectId: string): number {
  let level = 0;

  for (const product of state.projects.portfolio) {
    if (product.projectId === projectId) {
      level = Math.max(level, product.level);
    }
  }

  return level;
}

function getUpgradeableProductByProjectId(
  state: GameState,
  projectId: string
): Product | undefined {
  const index = findUpgradeableProductIndexByProjectId(state, projectId);
  return index < 0 ? undefined : state.projects.portfolio[index];
}

function findUpgradeableProductIndexByProjectId(state: GameState, projectId: string): number {
  for (let index = state.projects.portfolio.length - 1; index >= 0; index -= 1) {
    const product = state.projects.portfolio[index];

    if (
      product !== undefined &&
      product.projectId === projectId &&
      product.level < PROJECT_MAX_LEVEL
    ) {
      return index;
    }
  }

  return -1;
}

function syncProjectBoard(state: GameState): void {
  const candidates = createProjectBoardOffers(state);
  const candidateIds = new Set(candidates.map((offer) => offer.projectId));
  const nextBoard = state.projects.board.filter((offer) => candidateIds.has(offer.projectId));

  if (!sameProjectOffers(state.projects.board, nextBoard)) {
    state.projects.board = nextBoard;
  }
}

function createProjectBoardOffers(state: GameState): ProjectOffer[] {
  return PROJECTS.filter((project) => isProjectBoardCandidate(state, project))
    .sort((left, right) => right.era - left.era)
    .map((project) => ({
      id: project.id,
      projectId: project.id
    }));
}

function isProjectBoardCandidate(state: GameState, project: ProjectDefinition): boolean {
  if (project.kind === "standard" && getOwnedProductLevel(state, project.id) >= PROJECT_MAX_LEVEL) {
    return false;
  }

  return (
    (project.kind === "standard" || project.kind === "unlock") && isProjectUnlocked(state, project)
  );
}

function rotateCompletedProjectOffer(state: GameState, projectId: string): void {
  const candidates = createProjectBoardOffers(state);
  const candidateIds = new Set(candidates.map((offer) => offer.projectId));
  const completedOffer = candidates.find((offer) => offer.projectId === projectId);

  if (completedOffer === undefined) {
    syncProjectBoard(state);
    return;
  }

  const kept = state.projects.board.filter(
    (offer) => offer.projectId !== projectId && candidateIds.has(offer.projectId)
  );
  const keptIds = new Set(kept.map((offer) => offer.projectId));
  const missing = candidates.filter(
    (offer) => offer.projectId !== projectId && !keptIds.has(offer.projectId)
  );
  const nextBoard = [...kept, ...missing, completedOffer];

  if (!sameProjectOffers(state.projects.board, nextBoard)) {
    state.projects.board = nextBoard;
  }
}

function sameProjectOffers(left: readonly ProjectOffer[], right: readonly ProjectOffer[]): boolean {
  return (
    left.length === right.length &&
    left.every((offer, index) => {
      const other = right[index];
      return other !== undefined && offer.id === other.id && offer.projectId === other.projectId;
    })
  );
}

function grantProjectRp(
  state: GameState,
  project: ProjectDefinition,
  cache: DerivedCache,
  bus?: EventBus
): void {
  if (project.rpReward === undefined || project.rpFirst === undefined) {
    return;
  }

  const shipped = getNumericStat(state, `project.${project.id}.shipped`);

  if (shipped <= project.rpFirst) {
    const nextRp = addNonNegativeNumber(
      state.res.rp,
      Math.floor(project.rpReward * cache.project.rpMultiplier)
    );
    if (nextRp !== state.res.rp) {
      state.res.rp = nextRp;
      bus?.emit("res:changed", "rp");
    }
  }
}

function applyProjectCompletionEffect(
  state: GameState,
  project: ProjectDefinition,
  bus?: EventBus
): void {
  switch (project.completionEffect) {
    case "unlockAurora":
      unlockAurora(state, bus);
      break;
    case undefined:
      break;
  }
}

function isProjectUnlocked(state: GameState, project: ProjectDefinition): boolean {
  if (project.completionEffect === "unlockAurora" && state.aurora.unlocked) {
    return false;
  }

  return (
    !isDemoLocked(state, project) &&
    project.era <= state.era &&
    (project.unlock === undefined || checkCondition(state, project.unlock))
  );
}

function getNumericStat(state: GameState, key: string): number {
  const value = state.stats[key];
  return typeof value === "number" ? value : 0;
}
