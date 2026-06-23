import type { EventBus } from "../core/bus";
import type { GameState } from "../core/state";
import { BUILD_MOMENTUM } from "../data/momentum";
import { PROJECT_CHAINS, type ProjectChainDefinition } from "../data/project-chains";
import { addBuildMomentum } from "./momentum";

const PROJECT_SHIPPED_PREFIX = "project.";
const PROJECT_SHIPPED_SUFFIX = ".shipped";
const PROJECT_CHAIN_COMPLETED_PREFIX = "projectChain.completed.";
const PROJECT_CHAIN_COMPLETED_STAT = "projectChains.completed";

export interface ProjectChainProgress {
  readonly completed: boolean;
  readonly completedProjectIds: readonly string[];
  readonly definition: ProjectChainDefinition;
  readonly progress: number;
  readonly total: number;
}

export interface ProjectChainEffects {
  readonly buildTimeMultiplier: number;
  readonly locMultiplier: number;
  readonly payoutMultiplier: number;
  readonly revenueMultiplier: number;
  readonly rpMultiplier: number;
}

export interface ProjectChainSummary {
  readonly completedChains: number;
  readonly next?: ProjectChainProgress;
  readonly totalChains: number;
}

export function recordProjectChainProgress(
  state: GameState,
  projectId: string,
  bus?: EventBus
): readonly ProjectChainDefinition[] {
  const completedChains: ProjectChainDefinition[] = [];

  for (const chain of PROJECT_CHAINS) {
    if (!chain.projectIds.includes(projectId) || isProjectChainRewardClaimed(state, chain.id)) {
      continue;
    }

    const progress = getProjectChainProgress(state, chain);

    if (!progress.completed) {
      continue;
    }

    state.story.flags.add(getProjectChainCompletedFlag(chain.id));
    state.stats[PROJECT_CHAIN_COMPLETED_STAT] =
      getNumericStat(state, PROJECT_CHAIN_COMPLETED_STAT) + 1;
    state.stats[`projectChain.${chain.id}.completedAtS`] = state.meta.playtimeS;

    addBuildMomentum(
      state,
      chain.reward.momentum ?? BUILD_MOMENTUM.GAINS.PROJECT_CHAIN_COMPLETED,
      bus
    );
    bus?.emit("project-chain:completed", { chainId: chain.id });
    completedChains.push(chain);
  }

  return completedChains;
}

export function getProjectChainProgress(
  state: GameState,
  chain: ProjectChainDefinition
): ProjectChainProgress {
  const completedProjectIds = chain.projectIds.filter((projectId) =>
    hasProjectShipped(state, projectId)
  );
  const total = chain.projectIds.length;

  return {
    completed: total > 0 && completedProjectIds.length >= total,
    completedProjectIds,
    definition: chain,
    progress: total <= 0 ? 1 : completedProjectIds.length / total,
    total
  };
}

export function getProjectChainEffects(state: GameState): ProjectChainEffects {
  let buildTimeMultiplier = 1;
  let locMultiplier = 1;
  let payoutMultiplier = 1;
  let revenueMultiplier = 1;
  let rpMultiplier = 1;

  if (state.story.act < 4 && state.prestige.iteration <= 0) {
    return {
      buildTimeMultiplier,
      locMultiplier,
      payoutMultiplier,
      revenueMultiplier,
      rpMultiplier
    };
  }

  for (const chain of PROJECT_CHAINS) {
    if (!isProjectChainRewardClaimed(state, chain.id)) {
      continue;
    }

    buildTimeMultiplier *= chain.reward.buildTimeMultiplier ?? 1;
    locMultiplier *= chain.reward.locMultiplier ?? 1;
    payoutMultiplier *= chain.reward.payoutMultiplier ?? 1;
    revenueMultiplier *= chain.reward.revenueMultiplier ?? 1;
    rpMultiplier *= chain.reward.rpMultiplier ?? 1;
  }

  return {
    buildTimeMultiplier,
    locMultiplier,
    payoutMultiplier,
    revenueMultiplier,
    rpMultiplier
  };
}

export function getProjectChainSummary(state: GameState): ProjectChainSummary {
  const progress = PROJECT_CHAINS.map((chain) => getProjectChainProgress(state, chain));

  return {
    completedChains: progress.filter((entry) =>
      isProjectChainRewardClaimed(state, entry.definition.id)
    ).length,
    next: progress.find((entry) => !isProjectChainRewardClaimed(state, entry.definition.id)),
    totalChains: PROJECT_CHAINS.length
  };
}

export function getProjectChainCompletedFlag(chainId: string): string {
  return `${PROJECT_CHAIN_COMPLETED_PREFIX}${chainId}`;
}

function isProjectChainRewardClaimed(state: GameState, chainId: string): boolean {
  return state.story.flags.has(getProjectChainCompletedFlag(chainId));
}

function hasProjectShipped(state: GameState, projectId: string): boolean {
  return (
    getNumericStat(state, `${PROJECT_SHIPPED_PREFIX}${projectId}${PROJECT_SHIPPED_SUFFIX}`) > 0
  );
}

function getNumericStat(state: GameState, key: string): number {
  const value = state.stats[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
