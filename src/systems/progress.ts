import type { GameState } from "../core/state";
import { Big } from "../core/bignum";
import { OMEGA } from "../data/constants";
import { GENERATORS } from "../data/generators";
import { FULL_REWRITE_INSIGHT_COUNT } from "../data/prestige";
import {
  AURORA_REQUIRED_DEDICATED_SERVERS,
  getAuroraReadyServerCount,
  getAvailableAuroraServers,
  getCurrentAuroraPhase
} from "./aurora";
import { getNextEra, getEraCost, canBuyEra } from "./eras";
import { createExitPreview, createIterationPreview, createRewritePreview } from "./prestige";
import {
  getEffectiveComputeUse,
  getGeneratorCost,
  isGeneratorUnlocked,
  type DerivedCache
} from "./production";
import {
  getProject,
  getProjectCost,
  getVisibleProjectOffers,
  hasActiveProjectBuild
} from "./projects";
import { canSpendBig } from "./resources";

export type ProgressBottleneckKind =
  | "aurora"
  | "compute"
  | "debt"
  | "loc"
  | "money"
  | "none"
  | "omega"
  | "project"
  | "story";

export type ProgressGoalKind =
  | "buyInsight"
  | "buyEra"
  | "buyGenerator"
  | "completeOmega"
  | "exit"
  | "fixBugs"
  | "fundAurora"
  | "iterate"
  | "prompt"
  | "rewrite"
  | "shipProject"
  | "startProject"
  | "wait";

export interface ProgressBottleneck {
  readonly kind: ProgressBottleneckKind;
  readonly targetId?: string;
}

export interface ProgressGoal {
  readonly kind: ProgressGoalKind;
  readonly targetId?: string;
}

export type OmegaReadinessStatus = "forming" | "hidden" | "ready" | "slow" | "strong";

export type OmegaReadinessItemKind =
  | "era"
  | "exit"
  | "incident"
  | "insight"
  | "loc"
  | "project"
  | "rewrites";

export interface OmegaReadinessItem {
  readonly complete: boolean;
  readonly current?: number;
  readonly etaS?: number;
  readonly kind: OmegaReadinessItemKind;
  readonly missingLoc?: Big;
  readonly recommended: boolean;
  readonly target?: number;
}

export interface OmegaReadinessDiagnostics {
  readonly etaS?: number;
  readonly items: readonly OmegaReadinessItem[];
  readonly ready: boolean;
  readonly recommendedGoal: ProgressGoal;
  readonly status: OmegaReadinessStatus;
  readonly visible: boolean;
}

export interface ProgressDiagnostics {
  readonly bottleneck: ProgressBottleneck;
  readonly nextGoal: ProgressGoal;
  readonly omega: OmegaReadinessDiagnostics;
}

type ProgressSuggestion = Pick<ProgressDiagnostics, "bottleneck" | "nextGoal">;

export function createProgressDiagnostics(
  state: GameState,
  cache: DerivedCache
): ProgressDiagnostics {
  const omega = createOmegaReadinessDiagnostics(state, cache);

  if (hasActiveProjectBuild(state)) {
    return {
      bottleneck: { kind: "project", targetId: state.projects.active[0]?.projectId },
      nextGoal: { kind: "shipProject", targetId: state.projects.active[0]?.projectId },
      omega
    };
  }

  const aurora = createAuroraDiagnostics(state);
  if (aurora !== undefined) {
    return { ...aurora, omega };
  }

  if (state.bugs.length > 0 && cache.debt.factor < 0.75) {
    return {
      bottleneck: { kind: "debt", targetId: state.bugs[0]?.productId },
      nextGoal: { kind: "fixBugs", targetId: state.bugs[0]?.productId },
      omega
    };
  }

  const iteration = createIterationPreview(state, cache);
  if (iteration.canIterate) {
    return {
      bottleneck: { kind: "none" },
      nextGoal: { kind: "iterate" },
      omega
    };
  }

  if (createExitPreview(state).canExit) {
    return {
      bottleneck: { kind: "none" },
      nextGoal: { kind: "exit" },
      omega
    };
  }

  if (createRewritePreview(state).canRewrite) {
    return {
      bottleneck: { kind: "none" },
      nextGoal: { kind: "rewrite" },
      omega
    };
  }

  const omegaProgress = createOmegaProgressDiagnostics(state, cache, omega);
  if (omegaProgress !== undefined) {
    return omegaProgress;
  }

  const generator = createGeneratorDiagnostics(state, cache);
  if (generator !== undefined) {
    return { ...generator, omega };
  }

  const project = createProjectDiagnostics(state, cache);
  if (project !== undefined) {
    return { ...project, omega };
  }

  const era = createEraDiagnostics(state);
  if (era !== undefined) {
    return { ...era, omega };
  }

  if (cache.locRate.eq0()) {
    return {
      bottleneck: { kind: "loc" },
      nextGoal: { kind: "prompt" },
      omega
    };
  }

  return {
    bottleneck: { kind: "none" },
    nextGoal: { kind: "wait" },
    omega
  };
}

export function createOmegaReadinessDiagnostics(
  state: GameState,
  cache: DerivedCache
): OmegaReadinessDiagnostics {
  const visible =
    state.story.act >= 5 ||
    state.era >= 9 ||
    state.story.flags.has("omega_requests") ||
    state.story.flags.has("omega_approved") ||
    state.story.seen.has("a4_14_omega_training") ||
    state.prestige.endingChoice !== undefined;
  const locTarget = Big.from(OMEGA.LIFETIME_LOC_TARGET);
  const missingLoc = Big.max(Big.zero(), Big.sub(locTarget, state.lifetime.loc));
  const locEtaS = estimateEtaS(missingLoc, cache.locRate);
  const recommendedInsightNodes = Math.ceil(
    FULL_REWRITE_INSIGHT_COUNT * OMEGA.RECOMMENDED_INSIGHT_COMPLETION
  );
  const projectShipped = getProjectShippedCount(state, OMEGA.PROJECT_ID) > 0;
  const criticalIncidentActive = state.incidents.active.some((incident) => incident.severity >= 3);
  const items: OmegaReadinessItem[] = [
    {
      kind: "era",
      complete: state.era >= 10,
      current: state.era,
      target: 10,
      recommended: false
    },
    {
      kind: "project",
      complete: projectShipped,
      current: getProjectShippedCount(state, OMEGA.PROJECT_ID),
      target: 1,
      recommended: false
    },
    {
      kind: "loc",
      complete: state.lifetime.loc.gte(locTarget),
      etaS: locEtaS,
      missingLoc,
      recommended: false
    },
    {
      kind: "incident",
      complete: !criticalIncidentActive,
      current: state.incidents.active.filter((incident) => incident.severity >= 3).length,
      target: 0,
      recommended: false
    },
    {
      kind: "insight",
      complete: state.owned.insightNodes.size >= recommendedInsightNodes,
      current: state.owned.insightNodes.size,
      target: recommendedInsightNodes,
      recommended: true
    },
    {
      kind: "rewrites",
      complete: state.prestige.rewrites >= OMEGA.RECOMMENDED_REWRITES,
      current: state.prestige.rewrites,
      target: OMEGA.RECOMMENDED_REWRITES,
      recommended: true
    },
    {
      kind: "exit",
      complete: state.prestige.exits > 0,
      current: state.prestige.exits,
      target: 1,
      recommended: true
    }
  ];
  const requiredComplete = items.filter((item) => !item.recommended).every((item) => item.complete);
  const recommendedComplete = items
    .filter((item) => item.recommended)
    .every((item) => item.complete);
  const firstIncomplete = items.find((item) => !item.complete);

  return {
    etaS: locEtaS,
    items,
    ready: requiredComplete,
    recommendedGoal: getOmegaRecommendedGoal(firstIncomplete),
    status: getOmegaReadinessStatus(visible, requiredComplete, recommendedComplete),
    visible
  };
}

function createOmegaProgressDiagnostics(
  state: GameState,
  cache: DerivedCache,
  omega: OmegaReadinessDiagnostics
): ProgressDiagnostics | undefined {
  if (!omega.visible || omega.ready || state.story.act < 5) {
    return undefined;
  }

  const incomplete = omega.items.find((item) => !item.recommended && !item.complete);

  switch (incomplete?.kind) {
    case "era":
      return {
        bottleneck: { kind: "story", targetId: "omega" },
        nextGoal: { kind: "buyEra" },
        omega
      };
    case "project": {
      const offer = getVisibleProjectOffers(state, cache).find(
        (entry) => entry.projectId === OMEGA.PROJECT_ID
      );
      return {
        bottleneck:
          offer === undefined
            ? { kind: "omega", targetId: OMEGA.PROJECT_ID }
            : { kind: "loc", targetId: OMEGA.PROJECT_ID },
        nextGoal: { kind: "startProject", targetId: OMEGA.PROJECT_ID },
        omega
      };
    }
    case "loc":
      return {
        bottleneck: { kind: "loc", targetId: "omega" },
        nextGoal: { kind: "completeOmega", targetId: "loc" },
        omega
      };
    case "incident":
      return {
        bottleneck: { kind: "debt", targetId: "omega" },
        nextGoal: { kind: "fixBugs", targetId: "omega" },
        omega
      };
    case "exit":
    case "insight":
    case "rewrites":
    case undefined:
      return undefined;
  }
}

function getOmegaReadinessStatus(
  visible: boolean,
  requiredComplete: boolean,
  recommendedComplete: boolean
): OmegaReadinessStatus {
  if (!visible) {
    return "hidden";
  }

  if (requiredComplete) {
    return recommendedComplete ? "ready" : "strong";
  }

  return recommendedComplete ? "forming" : "slow";
}

function getOmegaRecommendedGoal(item: OmegaReadinessItem | undefined): ProgressGoal {
  switch (item?.kind) {
    case "era":
      return { kind: "buyEra" };
    case "exit":
      return { kind: "exit" };
    case "incident":
      return { kind: "fixBugs", targetId: "omega" };
    case "insight":
      return { kind: "buyInsight" };
    case "loc":
      return { kind: "completeOmega", targetId: "loc" };
    case "project":
      return { kind: "startProject", targetId: OMEGA.PROJECT_ID };
    case "rewrites":
      return { kind: "rewrite" };
    case undefined:
      return { kind: "completeOmega" };
  }
}

function estimateEtaS(missing: Big, rate: Big): number | undefined {
  if (missing.lte(Big.zero())) {
    return 0;
  }

  if (rate.lte(Big.zero())) {
    return undefined;
  }

  const seconds = Big.div(missing, rate).toNumber();
  return Number.isFinite(seconds) ? Math.ceil(seconds) : undefined;
}

function getProjectShippedCount(state: GameState, projectId: string): number {
  const value = state.stats[`project.${projectId}.shipped`];
  return typeof value === "number" ? value : 0;
}

function createAuroraDiagnostics(state: GameState): ProgressSuggestion | undefined {
  if (!state.aurora.unlocked || state.aurora.completed) {
    return undefined;
  }

  if (state.aurora.phaseActive) {
    return {
      bottleneck: { kind: "aurora", targetId: "phase-active" },
      nextGoal: { kind: "wait", targetId: "aurora" }
    };
  }

  if (
    state.aurora.dedicatedServers < AURORA_REQUIRED_DEDICATED_SERVERS &&
    getAuroraReadyServerCount(state) > 0
  ) {
    return {
      bottleneck: { kind: "aurora", targetId: "dedicated-servers" },
      nextGoal: { kind: "fundAurora", targetId: "dedicate-server" }
    };
  }

  const phase = getCurrentAuroraPhase(state);
  if (phase === undefined) {
    return {
      bottleneck: { kind: "none" },
      nextGoal: { kind: "fundAurora", targetId: "complete" }
    };
  }

  if (getAvailableAuroraServers(state) < phase.requiredServers) {
    return {
      bottleneck: { kind: "aurora", targetId: "servers" },
      nextGoal: { kind: "fundAurora", targetId: "servers" }
    };
  }

  if (!canSpendBig(state.res.loc, phase.costLoc)) {
    return {
      bottleneck: { kind: "loc", targetId: phase.id },
      nextGoal: { kind: "fundAurora", targetId: phase.id }
    };
  }

  if (!canSpendBig(state.res.money, phase.costMoney)) {
    return {
      bottleneck: { kind: "money", targetId: phase.id },
      nextGoal: { kind: "fundAurora", targetId: phase.id }
    };
  }

  return {
    bottleneck: { kind: "none" },
    nextGoal: { kind: "fundAurora", targetId: phase.id }
  };
}

function createProjectDiagnostics(
  state: GameState,
  cache: DerivedCache
): ProgressSuggestion | undefined {
  const offer = getVisibleProjectOffers(state, cache)[0];
  if (offer === undefined) {
    return undefined;
  }

  const project = getProject(offer.projectId);
  if (project === undefined) {
    return undefined;
  }

  const cost = getProjectCost(project, cache, state);
  return {
    bottleneck: canSpendBig(state.res.loc, cost)
      ? { kind: "none" }
      : { kind: "loc", targetId: project.id },
    nextGoal: { kind: "startProject", targetId: project.id }
  };
}

function createGeneratorDiagnostics(
  state: GameState,
  cache: DerivedCache
): ProgressSuggestion | undefined {
  const candidates = GENERATORS.filter((generator) => isGeneratorUnlocked(state, generator))
    .map((generator) => {
      const owned = state.owned.generators[generator.id] ?? 0;
      const cost = getGeneratorCost(generator, owned, 1, cache.costs.generatorMultiplier);
      return {
        cost,
        generator,
        computeUse: getEffectiveComputeUse(generator, cache)
      };
    })
    .filter((entry) => canSpendBig(state.res.money, entry.cost));

  const computeBlocked = candidates.find((entry) => cache.compute.available < entry.computeUse);
  if (computeBlocked !== undefined) {
    return {
      bottleneck: { kind: "compute", targetId: computeBlocked.generator.id },
      nextGoal: { kind: "buyGenerator", targetId: computeBlocked.generator.id }
    };
  }

  const affordable = candidates.find((entry) => cache.compute.available >= entry.computeUse);
  if (affordable !== undefined) {
    return {
      bottleneck: { kind: "none" },
      nextGoal: { kind: "buyGenerator", targetId: affordable.generator.id }
    };
  }

  return undefined;
}

function createEraDiagnostics(state: GameState): ProgressSuggestion | undefined {
  const nextEra = getNextEra(state);
  const cost = nextEra === undefined ? undefined : getEraCost(state, nextEra);

  if (nextEra === undefined || cost === undefined) {
    return undefined;
  }

  if (canBuyEra(state, nextEra)) {
    return {
      bottleneck: { kind: "none" },
      nextGoal: { kind: "buyEra", targetId: nextEra.id }
    };
  }

  if (!canSpendBig(state.res.money, cost)) {
    return {
      bottleneck: { kind: "money", targetId: nextEra.id },
      nextGoal: { kind: "buyEra", targetId: nextEra.id }
    };
  }

  return {
    bottleneck: { kind: "story", targetId: nextEra.id },
    nextGoal: { kind: "buyEra", targetId: nextEra.id }
  };
}
