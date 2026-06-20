import type { EventBus } from "../core/bus";
import { Big } from "../core/bignum";
import type { ActiveBuild, GameState, Product, ProjectOffer } from "../core/state";
import { REFACTOR_COMPLETED_STAT } from "../data/conditions";
import { C } from "../data/constants";
import { PROJECTS, REFACTOR_PROJECT, type ProjectDefinition } from "../data/projects";
import { isDemoLocked } from "./demo";
import { addShipHype } from "./hype";
import type { DerivedCache } from "./production";

const PROJECT_STARTED_STAT = "projects.started";
const PROJECT_SHIPPED_STAT = "projects.shipped";

export interface StartProjectResult {
  readonly cost: Big;
  readonly id: string;
  readonly ok: boolean;
  readonly reason?: "demoLocked" | "locked" | "unaffordable" | "missing";
}

export function ensureProjectBoard(state: GameState): void {
  if (state.projects.board.length > 0) {
    return;
  }

  refreshProjectBoard(state);
}

export function refreshProjectBoard(state: GameState): void {
  state.projects.board = PROJECTS.filter(
    (project) => project.kind === "standard" && isProjectUnlocked(state, project)
  )
    .sort((left, right) => right.era - left.era)
    .map((project) => ({
      id: project.id,
      projectId: project.id
    }));
  state.projects.boardRefreshAt = state.meta.playtimeS + C.PROJECT_REFRESH_S;
}

export function startProject(
  state: GameState,
  projectId: string,
  cache: DerivedCache,
  bus?: EventBus
): StartProjectResult {
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

  const cost = getProjectCost(project, cache);

  if (state.res.loc.lt(cost)) {
    return { cost, id: projectId, ok: false, reason: "unaffordable" };
  }

  const activeBuild = createActiveBuild(state, project, cache, cost);
  Big.subIn(state.res.loc, cost);
  state.projects.active.push(activeBuild);
  state.stats[PROJECT_STARTED_STAT] = getNumericStat(state, PROJECT_STARTED_STAT) + 1;

  bus?.emit("res:changed", "loc");
  return { cost, id: projectId, ok: true };
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
  const incomeRate = getProjectIncomeRate(state, cache);

  if (incomeRate.eq0()) {
    return false;
  }

  const income = Big.mul(incomeRate, Big.fromNumber(dtS));
  Big.addIn(state.res.money, income);
  Big.addIn(state.lifetime.money, income);
  bus?.emit("res:changed", "money");
  return true;
}

export function getProjectCost(project: ProjectDefinition, cache: DerivedCache): Big {
  const iterationCost = Big.fromNumber(cache.costs.projectMultiplier);

  switch (project.kind) {
    case "open_source":
      return Big.mul(Big.mul(cache.locRate, Big.fromNumber(45)), iterationCost);
    case "refactor":
      return Big.mul(
        Big.mul(cache.locRate, Big.fromNumber(C.REFACTOR_COST_SECONDS)),
        iterationCost
      );
    case "standard":
      return Big.mul(project.costLoC, iterationCost);
  }
}

export function getProjectPayout(project: ProjectDefinition, cache: DerivedCache): Big {
  return Big.mul(getBaseProjectPayout(project), Big.fromNumber(cache.project.payoutMultiplier));
}

export function getProjectRevenue(project: ProjectDefinition, cache: DerivedCache): Big {
  return Big.mul(getBaseProjectRevenue(project), Big.fromNumber(cache.project.revenueMultiplier));
}

export function getProjectIncomeRate(
  state: GameState,
  cache: DerivedCache,
  hype = state.res.hype
): Big {
  let productRevenue = Big.zero();

  for (const product of state.projects.portfolio) {
    const bugPenalty = product.bugged ? cache.debt.bugPenalty : 1;
    productRevenue = Big.add(productRevenue, Big.mul(product.revenue, Big.fromNumber(bugPenalty)));
  }

  if (productRevenue.eq0()) {
    return productRevenue;
  }

  const multiplier = hype * cache.multipliers.prestige * cache.project.revenueMultiplier;
  return Big.mul(productRevenue, Big.fromNumber(multiplier));
}

export function getProject(id: string): ProjectDefinition | undefined {
  if (id === REFACTOR_PROJECT.id) {
    return REFACTOR_PROJECT;
  }

  return PROJECTS.find((project) => project.id === id);
}

export function getVisibleProjectOffers(
  state: GameState,
  cache?: DerivedCache
): readonly ProjectOffer[] {
  ensureProjectBoard(state);
  return state.projects.board
    .filter((offer) => {
      const project = getProject(offer.projectId);
      return project !== undefined && !isDemoLocked(state, project);
    })
    .slice(0, cache?.project.boardSlots ?? C.PROJECT_BOARD_BASE_SLOTS);
}

function tickActiveBuilds(
  state: GameState,
  cache: DerivedCache,
  dtS: number,
  bus?: EventBus
): boolean {
  if (state.projects.active.length === 0) {
    return false;
  }

  const remainingBuilds: ActiveBuild[] = [];

  for (const build of state.projects.active) {
    const nextElapsedS = Math.min(build.buildS, build.elapsedS + dtS);
    const nextBuild = { ...build, elapsedS: nextElapsedS };

    if (nextElapsedS >= build.buildS) {
      completeBuild(state, cache, nextBuild, bus);
    } else {
      remainingBuilds.push(nextBuild);
    }
  }

  state.projects.active = remainingBuilds;
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
    bus?.emit("res:changed", "debt");
    return;
  }

  if (project.kind === "standard") {
    Big.addIn(state.res.money, build.payout);
    Big.addIn(state.lifetime.money, build.payout);
    state.projects.portfolio.push(createProduct(state, build));
  }

  state.stats[PROJECT_SHIPPED_STAT] = getNumericStat(state, PROJECT_SHIPPED_STAT) + 1;
  state.stats[`project.${project.id}.shipped`] =
    getNumericStat(state, `project.${project.id}.shipped`) + 1;
  grantProjectRp(state, project, cache);
  addShipHype(state, project.era, project.hypeBonus ?? 0, cache, bus);

  bus?.emit("res:changed", "money");
  bus?.emit("shipped", { projectId: project.id, payout: build.payout });
}

function createActiveBuild(
  state: GameState,
  project: ProjectDefinition,
  cache: DerivedCache,
  cost: Big
): ActiveBuild {
  const started = getNumericStat(state, PROJECT_STARTED_STAT);

  return {
    id: `${project.id}.${started + 1}`,
    buildS: getProjectBuildTime(project, cache),
    cost,
    elapsedS: 0,
    payout: project.kind === "standard" ? getProjectPayout(project, cache) : Big.zero(),
    projectId: project.id,
    revenue: project.kind === "standard" ? getBaseProjectRevenue(project) : Big.zero()
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

function createProduct(state: GameState, build: ActiveBuild): Product {
  return {
    id: `${build.projectId}.${state.projects.portfolio.length + 1}`,
    bugged: false,
    projectId: build.projectId,
    revenue: build.revenue,
    shippedAtS: state.meta.playtimeS
  };
}

function grantProjectRp(state: GameState, project: ProjectDefinition, cache: DerivedCache): void {
  if (project.rpReward === undefined || project.rpFirst === undefined) {
    if (project.kind === "open_source" && project.rpReward !== undefined) {
      state.res.rp += Math.floor(project.rpReward * cache.project.rpMultiplier);
    }

    return;
  }

  const shipped = getNumericStat(state, `project.${project.id}.shipped`);

  if (shipped <= project.rpFirst) {
    state.res.rp += Math.floor(project.rpReward * cache.project.rpMultiplier);
  }
}

function isProjectUnlocked(state: GameState, project: ProjectDefinition): boolean {
  return (
    !isDemoLocked(state, project) &&
    project.era <= state.era &&
    (project.unlock === undefined ||
      (project.unlock.flag !== undefined && state.story.flags.has(project.unlock.flag)))
  );
}

function getNumericStat(state: GameState, key: string): number {
  const value = state.stats[key];
  return typeof value === "number" ? value : 0;
}
