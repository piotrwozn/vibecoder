import { Big } from "../core/bignum";
import { formatBig, formatTime } from "../core/format";
import type { GameState } from "../core/state";
import { TUTORIAL_STEPS, type TutorialStep } from "../core/ui-state";
import { ACHIEVEMENTS, ACHIEVEMENT_LOC_BONUS } from "../data/achievements";
import { AURORA_PHASES } from "../data/aurora";
import { C } from "../data/constants";
import {
  ENDLESS_CHALLENGES,
  ENDLESS_COSMETICS,
  ENDLESS_INDUSTRIES,
  ENDLESS_MILESTONES,
  ENDLESS_MODIFIERS,
  ENDLESS_MODULES,
  ENDLESS_PRODUCT_TYPES,
  ENDLESS_RISKS,
  ENDLESS_SCALES,
  ENDLESS_SOFT_CAPS,
  getEndlessChallenge,
  getEndlessEvent,
  getEndlessSeason
} from "../data/endless";
import { GENERATORS } from "../data/generators";
import { getIncidentDefinition, getIncidentResponse } from "../data/incidents";
import { PROJECTS, REFACTOR_PROJECT, type ProjectDefinition } from "../data/projects";
import type {
  EquityPerkDefinition,
  EquityPerkState,
  InsightNodeDefinition,
  ParadoxItemDefinition,
  ParadoxItemState,
  RunModifierDefinition
} from "../data/prestige";
import type { ResearchDefinition } from "../data/research";
import { RUN_STYLES } from "../data/run-styles";
import { SPRINT_PRIORITIES } from "../data/roadmap";
import type { UpgradeDefinition } from "../data/upgrades";
import { t } from "../i18n/i18n";
import type { VibexAiClient } from "../platform/ai";
import { getAchievementStates, getUnlockedAchievementCount } from "../systems/achievements";
import {
  AURORA_REQUIRED_DEDICATED_SERVERS,
  getAuroraProgress,
  getAuroraReadyServerCount,
  getAvailableAuroraServers,
  getCurrentAuroraPhase
} from "../systems/aurora";
import {
  createBillingBreakdown,
  getHardwarePowerRatePerLevel,
  getNetMoneyRate
} from "../systems/billing";
import {
  AUTO_BUY_PREFIX,
  AUTO_BUY_HARDWARE_ID,
  AUTO_FIX_ID,
  AUTO_PROMPT_ID,
  AUTO_REFACTOR_ID,
  AUTO_REFRESH_PROJECTS_ID,
  AUTO_SHIP_ID,
  getAutoRewriteRuleMultiplier,
  getAutomationToggles,
  isAutoRewriteRuleId
} from "../systems/automation";
import {
  canFitCompute,
  getAvailableHardware,
  getHardware,
  getHardwareCapGain,
  getHardwareCost,
  getHardwareTierGateRequirement,
  isHardwareMaxed
} from "../systems/compute";
import { isDemoLocked } from "../systems/demo";
import {
  getEndlessContractCost,
  getEndlessContractProgress,
  getEndlessMilestoneIds,
  isEndlessUnlockReady
} from "../systems/endless";
import { canBuyEra, getCurrentEra, getEraCost, getNextEra } from "../systems/eras";
import { isIterationUnlocked } from "../systems/iteration";
import type { OfflineProgressResult } from "../systems/offline";
import {
  createExitPreview,
  createIterationPreview,
  createRewritePreview,
  getActiveParadoxTheme,
  getActiveRunModifier,
  getEquityPerks,
  getEquityPerkState,
  getInsightNodeState,
  getInsightTree,
  getOwnedParadoxRuleSlots,
  getParadoxItems,
  getParadoxItemState,
  getRunModifiers,
  getSelectedRunModifier,
  isRewriteBooting,
  type ExitPreview,
  type InsightNodeState,
  type IterationPreview,
  type RewritePreview
} from "../systems/prestige";
import { calculateIncidentResponseCost } from "../systems/incidents";
import { getBuildMomentum, getBuildMomentumEffects } from "../systems/momentum";
import { isFlowActive } from "../systems/prompt";
import { getProjectChainSummary } from "../systems/project-chains";
import {
  createProgressDiagnostics,
  type OmegaReadinessDiagnostics,
  type OmegaReadinessItem,
  type ProgressBottleneck,
  type ProgressGoal
} from "../systems/progress";
import {
  getSprintCooldownRemainingS,
  getSprintTimeRemainingS,
  isSprintActive
} from "../systems/roadmap";
import {
  getProject,
  getProjectBuildTime,
  getProjectBuildComputeUse,
  getProjectCost,
  getProjectExpectedHostingRate,
  getProjectIncomeRate,
  getProjectLevel,
  getProjectMaxLevel,
  getProjectNextLevel,
  getProjectPayout,
  getProjectRevenue,
  getProductHostingRate,
  getProductNetRevenue,
  getVisibleProjectOffers,
  hasActiveProjectBuild
} from "../systems/projects";
import {
  getGeneratorCost,
  getGeneratorMaxAffordable,
  type DerivedCache
} from "../systems/production";
import { canSpendBig, canSpendNumber } from "../systems/resources";
import { getResearchState, getResearchTree, type ResearchState } from "../systems/research";
import { isRunStyleUnlocked } from "../systems/run-styles";
import { getLocRateSamples } from "../systems/stats";
import { getStoryEvent } from "../systems/story";
import {
  getUpgradeCost,
  getUpgradeState,
  getVisibleUpgrades,
  type UpgradeState
} from "../systems/upgrades";
import type {
  ActiveBuildView,
  AchievementCardView,
  AchievementsView,
  AppearanceView,
  AuroraNodeView,
  AuroraView,
  AutomationToggleView,
  DevFloorView,
  EndlessActiveContractView,
  EndlessChallengeView,
  EndlessMilestoneView,
  EndlessOfferView,
  EndlessView,
  EndingModalView,
  EquityPerkView,
  ExitPreviewView,
  ExitView,
  FullGameView,
  GameOverView,
  GeneratorRowView,
  HardwareRowView,
  InsightNodeView,
  ModelView,
  OfflineView,
  ParadoxItemView,
  ParadoxView,
  ProductView,
  ProjectOfferView,
  ProjectsView,
  RoadmapActivityView,
  RoadmapIncidentResponseView,
  RoadmapIncidentView,
  RoadmapPriorityView,
  RoadmapRunStyleView,
  RoadmapView,
  ResearchNodeView,
  ResearchView,
  RewritePreviewView,
  RewriteView,
  RunModifierView,
  SettingsView,
  StatsRowView,
  StatsView,
  TutorialView,
  UpgradeRowView,
  VibexView
} from "../ui/render";
import { shouldBuildAppView } from "../ui/wm/window-manager";
import type { AppFormatters } from "./formatters";
import type { CommsController } from "./comms";
import type { VibexSession } from "./vibex-session";

const SHIPPED_STAT = "projects.shipped";
const BUGS_FIXED_STAT = "bugs.fixed";
const REFACTORED_STAT = "projects.refactored";
const HYPE_MAX_STAT = "hype.max";

export interface ViewModelBuilder {
  createDevFloorView(derived: DerivedCache, includeClosedApps?: boolean): DevFloorView;
  getProductName(productId: string): string;
  getProjectName(projectId: string): string;
  getUnlockToastName(kind: string, id: string): string;
  reset(): void;
}

export interface ViewModelBuilderRuntime {
  readonly cache: DerivedCache;
  readonly comms: CommsController;
  readonly formatters: AppFormatters;
  readonly getOfflineSummary: () => OfflineProgressResult | undefined;
  readonly hasPersistedSave: () => boolean;
  readonly getState: () => GameState;
  readonly vibexAi: VibexAiClient;
  readonly vibexSession: VibexSession;
}

export function createViewModelBuilder(runtime: ViewModelBuilderRuntime): ViewModelBuilder {
  const cache = runtime.cache;
  const comms = runtime.comms;
  const vibexAi = runtime.vibexAi;
  const vibexSession = runtime.vibexSession;
  const {
    createSparklinePath,
    formatCompute,
    formatCount,
    formatEquity,
    formatHardwareLevel,
    formatHardwarePowerRate,
    formatInsight,
    formatInsightAmount,
    formatLoc,
    formatMoney,
    formatMoneyRate,
    formatMultiplier,
    formatParadox,
    formatParadoxAmount,
    formatPerSecond,
    formatProjectLevel,
    formatRp,
    formatStartGenerators,
    formatVibexAiProgress,
    formatVibexAiStatus,
    getNumericStat,
    getTotalGeneratorCount
  } = runtime.formatters;
  let state = runtime.getState();
  let offlineSummary = runtime.getOfflineSummary();
  let lastDevFloorView: DevFloorView | undefined;

  function syncRuntime(): void {
    state = runtime.getState();
    offlineSummary = runtime.getOfflineSummary();
  }

  function getTutorialStepIndex(step: TutorialStep): number {
    return Math.max(0, TUTORIAL_STEPS.indexOf(step));
  }

  function createDevFloorView(derived: DerivedCache, includeClosedApps = false): DevFloorView {
    const previous = lastDevFloorView;
    const buildVibex = shouldBuildAppView(state.ui.windows, "vibex", includeClosedApps);
    const buildAgents = shouldBuildAppView(state.ui.windows, "agents", includeClosedApps);
    const buildHardware = shouldBuildAppView(state.ui.windows, "hardware", includeClosedApps);
    const buildUpgrades = shouldBuildAppView(state.ui.windows, "upgrades", includeClosedApps);
    const buildProjects = shouldBuildAppView(state.ui.windows, "projects", includeClosedApps);
    const buildRoadmap = shouldBuildAppView(state.ui.windows, "roadmap", includeClosedApps);
    const buildEndless = shouldBuildAppView(state.ui.windows, "endless", includeClosedApps);
    const buildResearch = shouldBuildAppView(state.ui.windows, "research", includeClosedApps);
    const buildRewrite = shouldBuildAppView(state.ui.windows, "rewrite", includeClosedApps);
    const buildStats = shouldBuildAppView(state.ui.windows, "stats", includeClosedApps);
    const buildAchievements = shouldBuildAppView(
      state.ui.windows,
      "achievements",
      includeClosedApps
    );
    const flowActive = buildVibex ? isFlowActive(state) : (previous?.flowActive ?? false);
    const grossIncome = getProjectIncomeRate(state, cache);
    const billingBreakdown = createBillingBreakdown(state, cache);
    const netIncome = getNetMoneyRate(grossIncome, state, cache);
    const view: DevFloorView = {
      appearance: createAppearanceView(),
      achievements: buildAchievements
        ? createAchievementsView()
        : (previous?.achievements ?? createAchievementsView()),
      automation: buildAgents ? createAutomationViews(derived) : (previous?.automation ?? []),
      aurora: createAuroraView(),
      comms: comms.getView(),
      compute: buildAgents
        ? createComputeBreakdownView(derived)
        : (previous?.compute ?? createComputeBreakdownView(derived)),
      ending: createEndingModalView(),
      endless: buildEndless ? createEndlessView() : (previous?.endless ?? createEndlessView()),
      flowActive,
      flowMeter: flowActive ? "100%" : `${Math.floor(state.flow.meter * 100)}%`,
      flowProgress: flowActive ? 1 : state.flow.meter,
      fullGame: buildAgents ? createFullGameView() : (previous?.fullGame ?? createFullGameView()),
      gameOver: createGameOverView(),
      generators: buildAgents
        ? GENERATORS.filter(
            (generator) => generator.era <= state.era && !isDemoLocked(state, generator)
          ).map((generator) => createGeneratorView(derived, generator.id))
        : (previous?.generators ?? []),
      hardware: buildHardware ? createHardwareViews() : (previous?.hardware ?? []),
      model: buildVibex ? createModelView() : (previous?.model ?? createModelView()),
      offline: createOfflineView(),
      projects: buildProjects ? createProjectsView() : (previous?.projects ?? createProjectsView()),
      roadmap: buildRoadmap
        ? createRoadmapView(derived)
        : (previous?.roadmap ?? createRoadmapView(derived)),
      research: buildResearch ? createResearchView() : (previous?.research ?? createResearchView()),
      rewrite: buildRewrite ? createRewriteView() : (previous?.rewrite ?? createRewriteView()),
      resources: {
        bank: formatMoney(state.bank.overdraft),
        bankTooltip: t("ui.tooltip.bankOverdraft"),
        bankVisible: state.bank.overdraft.gt(Big.zero()),
        compute: `${formatCompute(derived.compute.used)}/${formatCompute(derived.compute.cap)}`,
        hype: `${state.res.hype.toFixed(1)}x`,
        loc: formatBig(state.res.loc, state.settings.notation),
        locRate: formatPerSecond(derived.locRate),
        locRateTooltip: () => createLocRateTooltip(derived),
        money: formatMoney(state.res.money),
        moneyRate: formatMoneyRate(netIncome),
        moneyRateTooltip: () => createMoneyRateTooltip(grossIncome, billingBreakdown, netIncome),
        rp: formatRp(state.res.rp)
      },
      settings: createSettingsView(),
      stats: buildStats ? createStatsView(derived) : (previous?.stats ?? createStatsView(derived)),
      tutorial: createTutorialView(),
      ui: {
        bootSeen: state.ui.bootSeen,
        hasSave: runtime.hasPersistedSave(),
        scene: state.ui.scene,
        windows: state.ui.windows
      },
      upgrades: buildUpgrades ? createUpgradeViews() : (previous?.upgrades ?? []),
      vibex: buildVibex ? createVibexView() : (previous?.vibex ?? createVibexView())
    };
    lastDevFloorView = view;
    return view;
  }

  function createAppearanceView(): AppearanceView {
    const theme = getActiveParadoxTheme(state);

    return {
      ending: state.prestige.endingChoice,
      glitch: state.settings.glitch,
      reducedFx: state.settings.reducedFx,
      theme: theme === "crt" || theme === "glitch" || theme === "void" ? theme : undefined
    };
  }

  function createSettingsView(): SettingsView {
    const ai = vibexAi.snapshot();

    return {
      autosaveS: String(state.settings.autosaveS),
      doNotDisturb: state.settings.doNotDisturb,
      glitch: state.settings.glitch,
      localAiCanDownload: ai.canDownload,
      localAiModelSize: ai.modelSizeLabel,
      localAiProgress: formatVibexAiProgress(ai),
      localAiStatus: formatVibexAiStatus(ai),
      lang: state.settings.lang,
      notation: state.settings.notation,
      reducedFx: state.settings.reducedFx,
      skipIntro: state.settings.skipIntro,
      sound: state.settings.sound,
      vibexLocalAi: state.settings.vibexLocalAi,
      volume: state.settings.volume.toFixed(2),
      save: {
        backupCount: String(getNumericStat("save.backupCount")),
        edition: state.meta.edition,
        lastAutosave: new Date(state.meta.lastSeen).toISOString(),
        status: getSaveStatus(),
        version: `v${state.v}`
      }
    };
  }

  function getSaveStatus(): string {
    if (getNumericStat("save.restoredAt") > 0) {
      return t("ui.settings.saveStatusRestored");
    }

    if (getNumericStat("save.repairedAt") > 0) {
      return t("ui.settings.saveStatusRepaired");
    }

    return t("ui.settings.saveStatusOk");
  }

  function createTutorialView(): TutorialView {
    return {
      active: state.ui.tutorial.active,
      completed: state.ui.tutorial.completed,
      index: getTutorialStepIndex(state.ui.tutorial.step),
      step: state.ui.tutorial.step,
      total: TUTORIAL_STEPS.length
    };
  }

  function createVibexView(): VibexView {
    const codeFrame = vibexSession.getCodeFrame();
    const ai = vibexAi.snapshot();
    const assistant = vibexSession.getAssistant();

    return {
      aiCanDownload: ai.canDownload,
      aiEnabled: state.settings.vibexLocalAi,
      aiModelSize: ai.modelSizeLabel,
      aiProgress: formatVibexAiProgress(ai),
      aiStatus: formatVibexAiStatus(ai),
      cannedPrompt: assistant.prompt,
      cannedResponse: assistant.response,
      codeLines: codeFrame.lineKeys.map((lineKey, index) => ({
        id: `${codeFrame.sequence}:${index}`,
        text: t(lineKey)
      })),
      codeSequence: codeFrame.sequence,
      files: vibexSession.getFileTabs()
    };
  }

  function createAchievementsView(): AchievementsView {
    const unlocked = getUnlockedAchievementCount(state);

    return {
      bonus: formatMultiplier(1 + unlocked * ACHIEVEMENT_LOC_BONUS),
      cards: getAchievementStates(state).map((entry): AchievementCardView => {
        const unlockedAtS = entry.unlockedAtS ?? 0;
        return {
          id: entry.definition.id,
          category: t(`achievement.category.${entry.definition.category}`),
          name: entry.unlocked ? t(entry.definition.nameKey) : t("ui.unlock.hidden"),
          description: entry.unlocked ? t(entry.definition.descriptionKey) : t("ui.unlock.hidden"),
          status: entry.unlocked
            ? t("ui.achievements.statusUnlocked", { time: formatTime(unlockedAtS) })
            : t("ui.achievements.statusLocked"),
          unlocked: entry.unlocked
        };
      }),
      unlocked: t("ui.achievements.progress", {
        total: ACHIEVEMENTS.length,
        unlocked
      })
    };
  }

  function createStatsView(derived: DerivedCache): StatsView {
    const samples = getLocRateSamples(state);
    const progress = createProgressDiagnostics(state, derived);

    return {
      lifetimeRows: [
        createStatsRow("lifetime.loc", "ui.stats.lifetimeLoc", formatLoc(state.lifetime.loc)),
        createStatsRow(
          "lifetime.money",
          "ui.stats.lifetimeMoney",
          formatMoney(state.lifetime.money)
        ),
        createStatsRow("lifetime.shipped", "ui.stats.shipped", formatCount(SHIPPED_STAT)),
        createStatsRow("lifetime.bugs", "ui.stats.bugsFixed", formatCount(BUGS_FIXED_STAT))
      ],
      recordsRows: [
        createStatsRow(
          "record.era",
          "ui.stats.highestEra",
          t("ui.stats.eraValue", { era: state.era })
        ),
        createStatsRow(
          "record.hype",
          "ui.stats.peakHype",
          formatMultiplier(getNumericStat(HYPE_MAX_STAT))
        ),
        createStatsRow(
          "record.achievements",
          "ui.stats.achievements",
          `${getUnlockedAchievementCount(state)}/${ACHIEVEMENTS.length}`
        ),
        createStatsRow(
          "record.generators",
          "ui.stats.totalAgents",
          String(getTotalGeneratorCount())
        )
      ],
      runRows: [
        createStatsRow("run.playtime", "ui.stats.playtime", formatTime(state.meta.playtimeS)),
        createStatsRow("run.loc", "ui.stats.runLoc", formatLoc(state.lifetime.locSinceExit)),
        createStatsRow("run.rate", "ui.stats.currentLocRate", formatPerSecond(derived.locRate)),
        createStatsRow("run.buildMomentum", "ui.stats.buildMomentum", formatBuildMomentum()),
        createStatsRow("run.projectChains", "ui.stats.projectChains", formatProjectChains()),
        createStatsRow("run.nextGoal", "ui.stats.nextGoal", formatProgressGoal(progress.nextGoal)),
        createStatsRow(
          "run.bottleneck",
          "ui.stats.bottleneck",
          formatProgressBottleneck(progress.bottleneck)
        ),
        createStatsRow(
          "run.omegaReadiness",
          "ui.stats.omegaReadiness",
          formatOmegaReadiness(progress.omega)
        ),
        createStatsRow("run.omegaEta", "ui.stats.omegaEta", formatOmegaEta(progress.omega)),
        createStatsRow(
          "run.omegaAdvice",
          "ui.stats.omegaAdvice",
          formatOmegaAdvice(progress.omega)
        ),
        createStatsRow("run.refactors", "ui.stats.refactors", formatCount(REFACTORED_STAT)),
        createStatsRow(
          "run.prestige",
          "ui.stats.prestige",
          t("ui.stats.prestigeValue", {
            exits: state.prestige.exits,
            iterations: state.prestige.iteration,
            rewrites: state.prestige.rewrites
          })
        )
      ],
      sparklineEmpty: samples.length < 2,
      sparklineLabel: t("ui.stats.sparklineAria", { count: samples.length }),
      sparklinePath: createSparklinePath(samples)
    };
  }

  function createStatsRow(id: string, labelKey: string, value: string): StatsRowView {
    return {
      id,
      label: t(labelKey),
      value
    };
  }

  function formatBuildMomentum(): string {
    const effects = getBuildMomentumEffects(state);
    return t("ui.momentum.value", {
      loc: formatMultiplier(effects.locMultiplier),
      project: formatMultiplier(effects.payoutMultiplier),
      value: Math.round(getBuildMomentum(state))
    });
  }

  function formatProjectChains(): string {
    const summary = getProjectChainSummary(state);

    if (summary.next === undefined) {
      return t("ui.projectChains.complete", {
        completed: summary.completedChains,
        total: summary.totalChains
      });
    }

    return t("ui.projectChains.progress", {
      completed: summary.completedChains,
      current: summary.next.completedProjectIds.length,
      name: t(summary.next.definition.nameKey),
      total: summary.totalChains,
      required: summary.next.total
    });
  }

  function formatProgressGoal(goal: ProgressGoal): string {
    const target = formatProgressTarget(goal.targetId);

    switch (goal.kind) {
      case "buyEra":
        return t("ui.progress.goal.buyEra", { target });
      case "buyInsight":
        return t("ui.progress.goal.buyInsight");
      case "buyGenerator":
        return t("ui.progress.goal.buyGenerator", { target });
      case "completeOmega":
        return t("ui.progress.goal.completeOmega", { target });
      case "exit":
        return t("ui.progress.goal.exit");
      case "fixBugs":
        return t("ui.progress.goal.fixBugs", { target });
      case "fundAurora":
        return t("ui.progress.goal.fundAurora", { target });
      case "iterate":
        return t("ui.progress.goal.iterate");
      case "prompt":
        return t("ui.progress.goal.prompt");
      case "rewrite":
        return t("ui.progress.goal.rewrite");
      case "shipProject":
        return t("ui.progress.goal.shipProject", { target });
      case "startProject":
        return t("ui.progress.goal.startProject", { target });
      case "wait":
        return t("ui.progress.goal.wait");
    }
  }

  function formatProgressBottleneck(bottleneck: ProgressBottleneck): string {
    const target = formatProgressTarget(bottleneck.targetId);

    switch (bottleneck.kind) {
      case "aurora":
        return t("ui.progress.bottleneck.aurora", { target });
      case "compute":
        return t("ui.progress.bottleneck.compute", { target });
      case "debt":
        return t("ui.progress.bottleneck.debt", { target });
      case "loc":
        return t("ui.progress.bottleneck.loc", { target });
      case "money":
        return t("ui.progress.bottleneck.money", { target });
      case "none":
        return t("ui.progress.bottleneck.none");
      case "omega":
        return t("ui.progress.bottleneck.omega", { target });
      case "project":
        return t("ui.progress.bottleneck.project", { target });
      case "story":
        return t("ui.progress.bottleneck.story", { target });
    }
  }

  function formatProgressTarget(targetId: string | undefined): string {
    if (targetId === undefined || targetId.length === 0) {
      return t("ui.progress.target.none");
    }

    const generator = GENERATORS.find((entry) => entry.id === targetId);
    if (generator !== undefined) {
      return t(generator.nameKey);
    }

    if (targetId === "omega") {
      return t("ui.omega.name");
    }

    if (targetId === "loc") {
      return t("ui.resource.loc");
    }

    return getProjectName(targetId);
  }

  function formatOmegaReadiness(omega: OmegaReadinessDiagnostics): string {
    if (!omega.visible) {
      return t("ui.omega.status.hidden");
    }

    return t(`ui.omega.status.${omega.status}`);
  }

  function formatOmegaEta(omega: OmegaReadinessDiagnostics): string {
    if (!omega.visible) {
      return t("ui.omega.eta.hidden");
    }

    if (omega.etaS === undefined) {
      return t("ui.omega.eta.unknown");
    }

    return formatTime(omega.etaS);
  }

  function formatOmegaAdvice(omega: OmegaReadinessDiagnostics): string {
    const item = omega.items.find((entry) => !entry.complete);

    if (!omega.visible) {
      return t("ui.omega.advice.progressStory");
    }

    if (item === undefined) {
      return t("ui.omega.advice.ready");
    }

    return formatOmegaAdviceItem(item);
  }

  function formatOmegaAdviceItem(item: OmegaReadinessItem): string {
    const missingLoc = item.missingLoc === undefined ? "" : formatLoc(item.missingLoc);

    switch (item.kind) {
      case "era":
        return t("ui.omega.advice.era", {
          current: item.current ?? 0,
          target: item.target ?? 10
        });
      case "exit":
        return t("ui.omega.advice.exit");
      case "incident":
        return t("ui.omega.advice.incident");
      case "insight":
        return t("ui.omega.advice.insight", {
          current: item.current ?? 0,
          target: item.target ?? 0
        });
      case "loc":
        return t("ui.omega.advice.loc", { missing: missingLoc });
      case "project":
        return t("ui.omega.advice.project");
      case "rewrites":
        return t("ui.omega.advice.rewrites", {
          current: item.current ?? 0,
          target: item.target ?? 0
        });
    }
  }

  function createModelView(): ModelView {
    const current = getCurrentEra(state);
    const next = getNextEra(state);
    const nextCost = next === undefined ? undefined : getEraCost(state, next);

    if (next === undefined || nextCost === undefined) {
      return {
        canBuy: false,
        current: t(current.modelKey),
        maxed: true,
        nextCost: "",
        nextModel: "",
        status: t("ui.model.max")
      };
    }

    const demoLocked = isDemoLocked(state, next);
    const locked =
      next.unlock !== undefined &&
      !canBuyEra(state, next) &&
      canSpendBig(state.res.money, nextCost);

    return {
      canBuy: canBuyEra(state, next),
      current: t(current.modelKey),
      maxed: false,
      nextCost: formatMoney(nextCost),
      nextModel: t(next.modelKey),
      status: demoLocked
        ? t("ui.model.demoLocked", { model: t(next.modelKey) })
        : locked
          ? t("ui.model.locked", { model: t(next.modelKey) })
          : t("ui.model.next", { model: t(next.modelKey) })
    };
  }

  function createFullGameView(): FullGameView {
    const next = getNextEra(state);
    const nextCost = next === undefined ? undefined : getEraCost(state, next);
    const nextDemoLocked =
      next !== undefined &&
      nextCost !== undefined &&
      isDemoLocked(state, next) &&
      canSpendBig(state.res.money, nextCost);

    return {
      visible: state.meta.edition === "demo" && (state.story.act >= 2 || nextDemoLocked)
    };
  }

  function createGameOverView(): GameOverView {
    return {
      lines: [t("ui.bankruptcy.body.1"), t("ui.bankruptcy.body.2")],
      overdraft: formatMoney(state.bank.overdraft),
      visible: state.bank.defaulted
    };
  }

  function createOfflineView(): OfflineView {
    if (offlineSummary === undefined) {
      return {
        duration: "",
        hype: "",
        loc: "",
        money: "",
        visible: false
      };
    }

    return {
      duration: formatTime(offlineSummary.elapsedS),
      hype: formatMultiplier(offlineSummary.hypeAfter),
      loc: formatLoc(offlineSummary.loc),
      money: formatMoney(offlineSummary.money),
      visible: true
    };
  }

  function createEndingModalView(): EndingModalView {
    const event = ["a5_12_final_choice", "a5_17_aurora_complete"]
      .map((id) => getStoryEvent(id))
      .find(
        (entry) =>
          entry !== undefined &&
          state.story.seen.has(entry.id) &&
          entry.choices !== undefined &&
          state.story.choices[entry.id] === undefined &&
          (entry.id !== "a5_12_final_choice" || state.prestige.endingChoice === undefined)
      );

    if (event === undefined) {
      return {
        choices: [],
        eventId: "a5_12_final_choice",
        lines: [],
        visible: false
      };
    }

    return {
      choices: (event.choices ?? []).map((choice) => ({
        id: choice.id,
        label: t(choice.textKey),
        selected: false
      })),
      eventId: event.id,
      lines: comms.getStoryLines(event.textKey),
      visible: true
    };
  }

  function createGeneratorView(derived: DerivedCache, id: string): GeneratorRowView {
    const generator = GENERATORS.find((entry) => entry.id === id);

    if (generator === undefined) {
      throw new Error(`Missing generator: ${id}`);
    }

    const entry = derived.generatorEntries[generator.id];
    const owned = state.owned.generators[generator.id] ?? 0;
    const cost1 = entry?.cost1 ?? getGeneratorCost(generator, owned, 1);
    const cost10 = entry?.cost10 ?? getGeneratorCost(generator, owned, 10);
    const maxAffordable = entry?.unlocked
      ? getGeneratorMaxAffordable(state, generator, owned, derived)
      : 0;
    const milestone = entry?.milestone;
    const nextAt = milestone?.nextAt ?? 10;
    const currentMultiplier = formatBig(milestone?.multiplier ?? 1, state.settings.notation);
    const unlocked = Boolean(entry?.unlocked);
    const hidden = !unlocked;
    const canBuy1 =
      unlocked &&
      canSpendBig(state.res.money, cost1) &&
      canFitCompute(state, generator.computeUse, 1, derived);
    const canBuy10 =
      unlocked &&
      canSpendBig(state.res.money, cost10) &&
      canFitCompute(state, generator.computeUse, 10, derived);

    return {
      id: generator.id,
      name: hidden ? t("ui.unlock.hidden") : t(generator.nameKey),
      owned: String(owned),
      rate: hidden ? t("ui.unlock.hidden") : formatPerSecond(entry?.rate ?? Big.zero()),
      cost1: hidden ? t("ui.unlock.hidden") : formatMoney(cost1),
      cost10: hidden ? t("ui.unlock.hidden") : formatMoney(cost10),
      milestoneLabel: hidden
        ? t("ui.unlock.hidden")
        : t("ui.devfloor.milestoneProgress", {
            mult: currentMultiplier,
            next: nextAt,
            owned
          }),
      milestoneProgress: Math.min(1, owned / nextAt),
      canBuy1,
      canBuy10,
      canBuyMax: unlocked && maxAffordable > 0,
      buy1Title: getGeneratorBuyTitle(
        unlocked,
        canSpendBig(state.res.money, cost1),
        canFitCompute(state, generator.computeUse, 1, derived)
      ),
      buy10Title: getGeneratorBuyTitle(
        unlocked,
        canSpendBig(state.res.money, cost10),
        canFitCompute(state, generator.computeUse, 10, derived)
      ),
      buyMaxTitle: maxAffordable > 0 ? t("ui.devfloor.buyMax") : t("ui.devfloor.cannotBuy"),
      locked: !unlocked
    };
  }

  function createComputeBreakdownView(derived: DerivedCache): DevFloorView["compute"] {
    const generatorRows = GENERATORS.filter(
      (generator) => generator.era <= state.era && !isDemoLocked(state, generator)
    ).map((generator) => {
      const owned = state.owned.generators[generator.id] ?? 0;
      return {
        id: generator.id,
        name: t(generator.nameKey),
        used: formatCompute(owned * generator.computeUse)
      };
    });
    const activeBuildRows = state.projects.active
      .filter((build) => build.deploymentMode === "selfHosted" && build.computeUse > 0)
      .map((build) => ({
        id: `build:${build.id}`,
        name: t("ui.projects.computeBuild", { name: getProjectName(build.projectId) }),
        used: formatCompute(build.computeUse)
      }));
    const productRows = state.projects.portfolio
      .filter((product) => product.deploymentMode === "selfHosted" && product.computeUse > 0)
      .map((product) => ({
        id: `product:${product.id}`,
        name: t("ui.projects.computeProduct", { name: getProjectName(product.projectId) }),
        used: formatCompute(product.computeUse)
      }));

    return {
      cap: formatCompute(derived.compute.cap),
      remaining: formatCompute(Math.max(0, derived.compute.cap - derived.compute.used)),
      rows: [...generatorRows, ...activeBuildRows, ...productRows],
      used: formatCompute(derived.compute.used)
    };
  }

  function createHardwareViews(): readonly HardwareRowView[] {
    return getAvailableHardware(state).map((hardware) => {
      const owned = state.owned.hardware[hardware.id] ?? 0;
      const maxed = isHardwareMaxed(hardware, owned);
      const cost = maxed ? undefined : getHardwareCost(hardware, owned, state.prestige.iteration);
      const tierGate = getHardwareTierGateRequirement(state, hardware);
      const requiredHardware =
        tierGate === undefined ? undefined : getHardware(tierGate.hardwareId);

      return {
        id: hardware.id,
        active: owned > 0,
        canBuy: cost !== undefined && tierGate === undefined && canSpendBig(state.res.money, cost),
        capAdd:
          getHardwareCapGain(hardware, owned) === 0
            ? t("ui.hardware.zeroCap")
            : t("ui.hardware.capPerLevel", {
                cap: formatCompute(getHardwareCapGain(hardware, owned))
              }),
        cost: cost === undefined ? t("ui.hardware.maxed") : formatMoney(cost),
        isEnclosure: hardware.isEnclosure,
        levelLabel: formatHardwareLevel(owned, hardware.maxLevel),
        name: t(hardware.nameKey),
        phase: hardware.phase,
        powerCost: t("ui.hardware.powerCost", {
          rate: formatHardwarePowerRate(getHardwarePowerRatePerLevel(hardware.id))
        }),
        psuRequirement:
          tierGate === undefined || requiredHardware === undefined
            ? ""
            : t("ui.hardware.psuRequirement", {
                level: tierGate.requiredLevel,
                name: t(requiredHardware.nameKey)
              }),
        slot: hardware.slot,
        slotLabel: t(`hardware.slot.${hardware.slot}`)
      };
    });
  }

  function createUpgradeViews(): readonly UpgradeRowView[] {
    return getVisibleUpgrades(state).map((upgrade) => createUpgradeView(upgrade));
  }

  function createUpgradeView(upgrade: UpgradeDefinition): UpgradeRowView {
    const upgradeState = getUpgradeState(state, upgrade);

    return {
      id: upgrade.id,
      name: t(upgrade.nameKey),
      effect: t(upgrade.effectKey),
      cost: formatMoney(getUpgradeCost(state, upgrade)),
      state: upgradeState,
      stateLabel: getUpgradeStateLabel(upgradeState),
      canBuy: upgradeState === "available"
    };
  }

  function createAutomationViews(derived: DerivedCache): readonly AutomationToggleView[] {
    return getAutomationToggles(state, derived).map((rule) => {
      const disabled = !rule.unlocked;

      return {
        id: rule.id,
        enabled: rule.enabled && !disabled,
        disabled,
        label: getAutomationLabel(rule.id),
        detail: disabled ? t("ui.automation.locked") : getAutomationDetail(rule.id, derived)
      };
    });
  }

  function createResearchView(): ResearchView {
    return {
      rp: formatRp(state.res.rp),
      nodes: getResearchTree().map((research) => createResearchNodeView(research))
    };
  }

  function createResearchNodeView(research: ResearchDefinition): ResearchNodeView {
    const researchState = getResearchState(state, research);

    return {
      id: research.id,
      branch: research.branch,
      tier: research.tier,
      name: t(research.nameKey),
      effect: t(research.effectKey),
      cost: formatRp(research.costRp),
      state: researchState,
      stateLabel: getResearchStateLabel(researchState),
      canBuy: researchState === "available"
    };
  }

  function createRewriteView(): RewriteView {
    const preview = createRewritePreview(state);

    return {
      exit: createExitView(),
      insight: formatInsight(state.res.insight),
      nodes: getInsightTree().map((node) => createInsightNodeView(node)),
      paradox: createParadoxView(),
      preview: createRewritePreviewView(preview)
    };
  }

  function createRewritePreviewView(preview: RewritePreview): RewritePreviewView {
    const nextInsightNode =
      preview.nextInsightNodeId === undefined
        ? undefined
        : getInsightTree().find((node) => node.id === preview.nextInsightNodeId);

    return {
      afterInsight: formatInsight(preview.insightAfter),
      booting: isRewriteBooting(state),
      canRewrite: preview.canRewrite,
      currentMultiplier: formatMultiplier(preview.currentMultiplier),
      gain: formatInsightAmount(preview.availableInsight),
      lostAgents: String(preview.lostAgents),
      lostHardware: String(preview.lostHardware),
      lostLoc: formatLoc(preview.lostLoc),
      lostMoney: formatMoney(preview.lostMoney),
      lostProducts: String(preview.lostProducts),
      lostUpgrades: String(preview.lostUpgrades),
      nextInsight:
        nextInsightNode === undefined
          ? t("ui.rewrite.nextInsightNone")
          : t("ui.rewrite.nextInsightValue", { node: t(nextInsightNode.nameKey) }),
      nextMilestone:
        preview.nextMilestone === undefined
          ? t("ui.rewrite.nextMilestoneNone")
          : t("ui.rewrite.nextMilestoneValue", {
              count: preview.nextMilestone.count,
              milestone: t(preview.nextMilestone.nameKey)
            }),
      requiredInsight: formatInsightAmount(preview.requiredInsight),
      speedup: formatMultiplier(preview.speedup),
      startEra: t("ui.rewrite.era", { era: preview.startEra }),
      startGenerators: formatStartGenerators(preview.startGenerators),
      startMoney: formatMoney(preview.startMoney),
      targetMultiplier: formatMultiplier(preview.targetMultiplier)
    };
  }

  function createInsightNodeView(node: InsightNodeDefinition): InsightNodeView {
    const nodeState = getInsightNodeState(state, node);

    return {
      id: node.id,
      branch: node.branch,
      tier: node.tier,
      name: t(node.nameKey),
      effect: t(node.effectKey),
      cost: formatInsightAmount(node.costInsight),
      state: nodeState,
      stateLabel: getInsightNodeStateLabel(nodeState),
      canBuy: nodeState === "available"
    };
  }

  function createExitView(): ExitView {
    return {
      unlocked: state.story.flags.has("exit_unlocked"),
      perks: getEquityPerks().map((perk) => createEquityPerkView(perk)),
      preview: createExitPreviewView(createExitPreview(state)),
      runModifiers: getRunModifiers().map((modifier) => createRunModifierView(modifier))
    };
  }

  function createExitPreviewView(preview: ExitPreview): ExitPreviewView {
    return {
      canExit: preview.canExit,
      currentEquity: formatEquity(preview.currentEquity),
      currentMultiplier: formatMultiplier(preview.currentMultiplier),
      equityAfter: formatEquity(preview.equityAfter),
      gain: formatEquity(preview.gain),
      requiredInsight: formatInsightAmount(preview.requiredInsight),
      rewardMultiplier: formatMultiplier(preview.rewardMultiplier),
      targetMultiplier: formatMultiplier(preview.targetMultiplier),
      totalInsightEarned: formatInsightAmount(preview.totalInsightEarned)
    };
  }

  function createEquityPerkView(perk: EquityPerkDefinition): EquityPerkView {
    const perkState = getEquityPerkState(state, perk);

    return {
      id: perk.id,
      name: t(perk.nameKey),
      effect: t(perk.effectKey),
      cost: formatEquity(perk.costEquity),
      state: perkState,
      stateLabel: getEquityPerkStateLabel(perkState),
      canBuy: perkState === "available"
    };
  }

  function createRunModifierView(modifier: RunModifierDefinition): RunModifierView {
    const active = getActiveRunModifier(state) === modifier.id;
    const selected = getSelectedRunModifier(state) === modifier.id;
    const unlocked = state.owned.equityPerks.has("q_board_seat");

    return {
      id: modifier.id,
      active,
      description: t(modifier.descriptionKey),
      name: t(modifier.nameKey),
      selected,
      unlocked
    };
  }

  function createParadoxView(): ParadoxView {
    const theme = getActiveParadoxTheme(state);

    return {
      items: getParadoxItems().map((item) => createParadoxItemView(item)),
      preview: createIterationPreviewView(createIterationPreview(state, cache)),
      ruleSlots: String(getOwnedParadoxRuleSlots(state)),
      theme: theme === undefined ? t("ui.paradox.themeNone") : t(`ui.paradox.theme.${theme}`),
      unlocked: isIterationUnlocked(state)
    };
  }

  function createIterationPreviewView(preview: IterationPreview): ParadoxView["preview"] {
    return {
      canIterate: preview.canIterate,
      currentIteration: String(preview.currentIteration),
      currentMultiplier: formatMultiplier(preview.currentMultiplier),
      currentParadox: formatParadox(preview.currentParadox),
      hold: t("ui.paradox.holdValue", {
        current: formatTime(preview.holdS),
        required: formatTime(preview.holdRequiredS)
      }),
      locRate: formatPerSecond(preview.locRate),
      nextIteration: String(preview.nextIteration),
      paradoxAfter: formatParadox(preview.paradoxAfter),
      paradoxGain: formatParadoxAmount(preview.paradoxGain),
      softcapThreshold: formatPerSecond(preview.softcapThreshold),
      targetMultiplier: formatMultiplier(preview.targetMultiplier)
    };
  }

  function createParadoxItemView(item: ParadoxItemDefinition): ParadoxItemView {
    const itemState = getParadoxItemState(state, item);

    return {
      id: item.id,
      name: t(item.nameKey),
      effect: t(item.effectKey),
      cost: formatParadoxAmount(item.costParadox),
      state: itemState,
      stateLabel: getParadoxItemStateLabel(itemState),
      canBuy: itemState === "available"
    };
  }

  function createProjectsView(): ProjectsView {
    const canStartProject = !hasActiveProjectBuild(state);

    return {
      activeBuilds: state.projects.active.map((build): ActiveBuildView => {
        const project = getProject(build.projectId);
        const remainingS = Math.max(0, build.buildS - build.elapsedS);

        return {
          id: build.id,
          compute: formatCompute(build.computeUse),
          deployment: t(`ui.projects.deployment.${build.deploymentMode}`),
          name: project === undefined ? build.projectId : t(project.nameKey),
          progress: build.buildS <= 0 ? 1 : Math.min(1, build.elapsedS / build.buildS),
          remaining: formatTime(remainingS)
        };
      }),
      incomeRate: formatMoneyRate(
        getNetMoneyRate(getProjectIncomeRate(state, cache), state, cache)
      ),
      nextUnlock: createProjectNextUnlockLabel(),
      offers: getVisibleProjectOffers(state, cache).map((offer): ProjectOfferView => {
        const project = getProject(offer.projectId);

        if (project === undefined) {
          throw new Error(`Missing project: ${offer.projectId}`);
        }

        return createProjectOfferView(project);
      }),
      portfolio: state.projects.portfolio.map((product): ProductView => {
        const project = getProject(product.projectId);

        return {
          canFix: product.bugged,
          canSwitchDeployment:
            product.deploymentMode === "selfHosted" ||
            product.computeUse <= cache.compute.available,
          compute: formatCompute(product.computeUse),
          deployment: t(`ui.projects.deployment.${product.deploymentMode}`),
          hostingCost: formatMoneyRate(
            getProductHostingRate(product, cache, state.res.hype, state)
          ),
          id: product.id,
          level:
            project === undefined
              ? String(product.level)
              : formatProjectLevel(product.level, getProjectMaxLevel(project)),
          name: project === undefined ? product.projectId : t(project.nameKey),
          revenue: formatMoneyRate(getProductNetRevenue(product, cache, state.res.hype, state)),
          status: t(product.bugged ? "ui.projects.statusBugged" : "ui.projects.statusOk"),
          switchDeploymentLabel: t(
            product.deploymentMode === "hosted"
              ? "ui.projects.switchSelfHosted"
              : "ui.projects.switchHosted"
          ),
          switchDeploymentMode: product.deploymentMode === "hosted" ? "selfHosted" : "hosted"
        };
      }),
      refactor: {
        buildTime: formatTime(getProjectBuildTime(REFACTOR_PROJECT, cache)),
        canStart:
          canStartProject &&
          canSpendBig(state.res.loc, getProjectCost(REFACTOR_PROJECT, cache, state)),
        cost: formatLoc(getProjectCost(REFACTOR_PROJECT, cache, state)),
        debt: formatBig(state.res.debt, state.settings.notation),
        effect: t("ui.projects.refactorEffect", {
          mult: formatMultiplier(cache.debt.refactorMultiplier)
        })
      }
    };
  }

  function createProjectNextUnlockLabel(): string {
    const next = getNextEra(state);

    if (next === undefined || !PROJECTS.some((project) => project.era === next.index)) {
      return t("ui.projects.nextUnlockMax");
    }

    const model = t(next.modelKey);
    const cost = getEraCost(state, next);

    if (isDemoLocked(state, next)) {
      return t("ui.projects.nextUnlockDemo", { model });
    }

    if (canBuyEra(state, next)) {
      return t("ui.projects.nextUnlockReady", { model });
    }

    if (next.unlock !== undefined && (cost === undefined || canSpendBig(state.res.money, cost))) {
      return t("ui.projects.nextUnlockLocked", { model });
    }

    if (cost === undefined) {
      return t("ui.projects.nextUnlockReady", { model });
    }

    return t("ui.projects.nextUnlockCost", { cost: formatMoney(cost), model });
  }

  function createEndlessView(): EndlessView {
    const season = getEndlessSeason(state.endless.seasonId);
    const active = state.endless.active;
    const activeEvent = state.endless.activeEvent;

    return {
      active: active === undefined ? undefined : createEndlessActiveView(active),
      activeChallenge:
        state.endless.activeChallenge === undefined
          ? undefined
          : t(getEndlessChallenge(state.endless.activeChallenge).nameKey),
      activeEvent:
        activeEvent === undefined
          ? undefined
          : {
              description: t(getEndlessEvent(activeEvent.id).descriptionKey),
              name: t(getEndlessEvent(activeEvent.id).nameKey),
              remaining: formatTime(Math.max(0, activeEvent.activeUntilS - state.meta.playtimeS))
            },
      canRefresh: state.endless.unlocked && active === undefined,
      challenges: createEndlessChallengeViews(),
      cosmetics: state.endless.cosmetics.map((id) =>
        t(ENDLESS_COSMETICS.find((cosmetic) => cosmetic.id === id)?.nameKey ?? "ui.endless.unknown")
      ),
      completed: formatCountValue(state.endless.completedContracts),
      currencies: createEndlessCurrencyViews(),
      decision: t(`ui.endless.decision.${state.endless.decision}`),
      empireScore: formatBig(state.endless.empireScore, state.settings.notation),
      legacyScore: formatCountValue(state.endless.legacyScore),
      milestones: createEndlessMilestoneViews(),
      offers: state.endless.offers.map((offer): EndlessOfferView => {
        const cost = getEndlessContractCost(offer);

        return {
          id: offer.id,
          canAccept:
            state.endless.unlocked && active === undefined && canSpendBig(state.res.loc, cost),
          cost: formatLoc(cost),
          modules: formatEndlessComponentList(offer.moduleIds, ENDLESS_MODULES),
          modifiers: formatEndlessComponentList(offer.modifierIds, ENDLESS_MODIFIERS),
          name: createEndlessContractName(offer.productTypeId, offer.industryId, offer.scaleId),
          reward: formatEndlessReward(offer.rewardMoney, offer.rewardRp),
          risks: formatEndlessComponentList(offer.riskIds, ENDLESS_RISKS),
          tier: t("ui.endless.tierValue", { tier: offer.tier }),
          work: formatTime(offer.workS)
        };
      }),
      seasonDescription: t(season.descriptionKey),
      seasonName: t(season.nameKey),
      seasonRemaining: formatTime(Math.max(0, state.endless.seasonEndsAtS - state.meta.playtimeS)),
      softCaps: state.endless.softCaps.map((id) =>
        t(ENDLESS_SOFT_CAPS.find((cap) => cap.id === id)?.descriptionKey ?? "ui.endless.unknown")
      ),
      tier: t("ui.endless.tierValue", { tier: state.endless.tier }),
      unlocked: state.endless.unlocked,
      unlockHint: isEndlessUnlockReady(state)
        ? t("ui.endless.unlockReady")
        : t("ui.endless.unlockHint")
    };
  }

  function createEndlessCurrencyViews(): EndlessView["currencies"] {
    const currencies = state.endless.currencies;
    const rows: readonly [keyof GameState["endless"]["currencies"], number][] = [
      ["legacyPoints", currencies.legacyPoints],
      ["influence", currencies.influence],
      ["modelResearch", currencies.modelResearch],
      ["stabilityScore", currencies.stabilityScore],
      ["automationRank", currencies.automationRank],
      ["enterpriseTrust", currencies.enterpriseTrust]
    ];

    return rows.map(([id, value]) => ({
      label: t(`ui.endless.currency.${id}`),
      value: formatCountValue(value)
    }));
  }

  function createEndlessChallengeViews(): readonly EndlessChallengeView[] {
    return ENDLESS_CHALLENGES.map((challenge): EndlessChallengeView => {
      const progress = state.endless.challengeCompletions.find(
        (entry) => entry.id === challenge.id
      );
      return {
        active: state.endless.activeChallenge === challenge.id,
        bestTier: t("ui.endless.tierValue", { tier: progress?.bestTier ?? 0 }),
        canStart: state.endless.unlocked && state.endless.active === undefined,
        completed: progress?.completed ?? false,
        description: t(challenge.descriptionKey),
        id: challenge.id,
        name: t(challenge.nameKey),
        reward: formatEndlessChallengeReward(challenge.reward)
      };
    });
  }

  function formatEndlessChallengeReward(
    reward: Partial<Record<keyof GameState["endless"]["currencies"], number>>
  ): string {
    const parts = Object.entries(reward)
      .filter(([, value]) => typeof value === "number" && value > 0)
      .map(([key, value]) =>
        t("ui.endless.challengeRewardPart", {
          label: t(`ui.endless.currency.${key}`),
          value: formatCountValue(value as number)
        })
      );

    return parts.length === 0 ? t("ui.endless.none") : parts.join(", ");
  }

  function createEndlessActiveView(
    active: NonNullable<GameState["endless"]["active"]>
  ): EndlessActiveContractView {
    const progress = getEndlessContractProgress(active);

    return {
      name: createEndlessContractName(active.productTypeId, active.industryId, active.scaleId),
      progress,
      progressLabel: `${Math.floor(progress * 100)}%`,
      remaining: formatTime(Math.max(0, active.workS - active.elapsedS)),
      reward: formatEndlessReward(active.rewardMoney, active.rewardRp),
      risks: formatEndlessComponentList(active.riskIds, ENDLESS_RISKS)
    };
  }

  function createEndlessMilestoneViews(): readonly EndlessMilestoneView[] {
    const reachedIds = getEndlessMilestoneIds(state);

    return ENDLESS_MILESTONES.map(
      (milestone): EndlessMilestoneView => ({
        id: milestone.id,
        description: t(milestone.descriptionKey),
        reached: reachedIds.has(milestone.id),
        target: t("ui.endless.tierValue", { tier: milestone.target })
      })
    );
  }

  function createEndlessContractName(
    productTypeId: string,
    industryId: string,
    scaleId: string
  ): string {
    return t("ui.endless.contractName", {
      industry: formatEndlessComponent(industryId, ENDLESS_INDUSTRIES),
      product: formatEndlessComponent(productTypeId, ENDLESS_PRODUCT_TYPES),
      scale: formatEndlessComponent(scaleId, ENDLESS_SCALES)
    });
  }

  function formatEndlessReward(money: Big, rp: number): string {
    return t("ui.endless.reward", {
      money: formatMoney(money),
      rp: formatRp(rp)
    });
  }

  function formatEndlessComponentList(
    ids: readonly string[],
    definitions: readonly { readonly id: string; readonly nameKey: string }[]
  ): string {
    if (ids.length === 0) {
      return t("ui.endless.none");
    }

    return ids.map((id) => formatEndlessComponent(id, definitions)).join(", ");
  }

  function formatEndlessComponent(
    id: string,
    definitions: readonly { readonly id: string; readonly nameKey: string }[]
  ): string {
    return t(definitions.find((entry) => entry.id === id)?.nameKey ?? "ui.endless.unknown");
  }

  function formatCountValue(value: number): string {
    return new Intl.NumberFormat(state.settings.lang).format(value);
  }

  function createRoadmapView(derived: DerivedCache): RoadmapView {
    const activeSprint = state.roadmap.active;
    const cooldownS = getSprintCooldownRemainingS(state);
    const remainingS = getSprintTimeRemainingS(state);

    return {
      activeSprint:
        activeSprint === undefined
          ? t("ui.roadmap.noActiveSprint")
          : t(`roadmap.sprint.${activeSprint}.name`),
      activity: createRoadmapActivity(derived),
      cooldown: cooldownS > 0 ? formatRoadmapCountdown(cooldownS) : t("ui.roadmap.ready"),
      incidents: state.incidents.active.map((incident): RoadmapIncidentView => {
        const definition = getIncidentDefinition(incident.type);

        return {
          id: incident.id,
          description: definition === undefined ? incident.type : t(definition.descriptionKey),
          label: definition === undefined ? incident.type : t(definition.nameKey),
          responses: (definition?.responses ?? []).map((response) =>
            createIncidentResponseView(derived, incident.id, response)
          ),
          severity: t("ui.roadmap.incidentSeverity", { severity: incident.severity }),
          timeRemaining: formatRoadmapCountdown(incident.untilS - state.meta.playtimeS)
        };
      }),
      priorities: SPRINT_PRIORITIES.map((priority): RoadmapPriorityView => {
        const active = activeSprint === priority.id && isSprintActive(state);

        return {
          id: priority.id,
          active,
          description: t(priority.descriptionKey),
          disabled: !active && (isSprintActive(state) || cooldownS > 0),
          label: t(priority.nameKey)
        };
      }),
      runStyles: RUN_STYLES.map((style): RoadmapRunStyleView => {
        const unlocked = isRunStyleUnlocked(state, style.id);

        return {
          id: style.id,
          cost: t(style.costKey),
          description: t(style.effectKey),
          label: t(style.nameKey),
          selected: state.metaprogression.runStyle === style.id,
          unlocked
        };
      }),
      sprintRemaining: remainingS > 0 ? formatRoadmapCountdown(remainingS) : t("ui.roadmap.noTimer")
    };
  }

  function formatRoadmapCountdown(seconds: number): string {
    return formatTime(Math.ceil(Math.max(0, seconds)));
  }

  function createIncidentResponseView(
    derived: DerivedCache,
    incidentId: string,
    responseId: RoadmapIncidentResponseView["id"]
  ): RoadmapIncidentResponseView {
    const incident = state.incidents.active.find((entry) => entry.id === incidentId);
    const response = getIncidentResponse(responseId);

    if (incident === undefined) {
      return {
        id: responseId,
        cost: "",
        description: response === undefined ? responseId : t(response.descriptionKey),
        disabled: true,
        label: response === undefined ? responseId : t(response.nameKey)
      };
    }

    const cost = calculateIncidentResponseCost(state, derived, incident, responseId);
    return {
      id: responseId,
      cost: formatIncidentCost(cost),
      description: response === undefined ? responseId : t(response.descriptionKey),
      disabled:
        !canSpendBig(state.res.loc, cost.loc) ||
        !canSpendBig(state.res.money, cost.money) ||
        !canSpendNumber(state.res.rp, cost.rp),
      label: response === undefined ? responseId : t(response.nameKey)
    };
  }

  function formatIncidentCost(cost: {
    readonly loc: Big;
    readonly money: Big;
    readonly rp: number;
  }): string {
    const parts: string[] = [];

    if (!cost.loc.eq0()) {
      parts.push(formatLoc(cost.loc));
    }

    if (!cost.money.eq0()) {
      parts.push(formatMoney(cost.money));
    }

    if (cost.rp > 0) {
      parts.push(formatRp(cost.rp));
    }

    return parts.length === 0 ? t("ui.roadmap.noCost") : parts.join(" / ");
  }

  function createRoadmapActivity(derived: DerivedCache): readonly RoadmapActivityView[] {
    const activity: RoadmapActivityView[] = [];

    if (state.projects.active.length > 0) {
      const build = state.projects.active[0];
      activity.push({
        id: "build.active",
        label: t("ui.roadmap.activity.activeBuild"),
        detail:
          build === undefined
            ? ""
            : t("ui.roadmap.activity.activeBuildDetail", {
                name: getProjectName(build.projectId),
                time: formatTime(Math.max(0, build.buildS - build.elapsedS))
              }),
        tone: "info"
      });
    }

    if (state.bugs.length > 0) {
      activity.push({
        id: "bugs.active",
        label: t("ui.roadmap.activity.bugs"),
        detail: t("ui.roadmap.activity.bugsDetail", { count: state.bugs.length }),
        tone: "alert"
      });
    }

    if (state.incidents.active.length > 0) {
      activity.push({
        id: "incidents.active",
        label: t("ui.roadmap.activity.incidents"),
        detail: t("ui.roadmap.activity.incidentsDetail", { count: state.incidents.active.length }),
        tone: "alert"
      });
    }

    const momentumValue = getBuildMomentum(state);
    if (momentumValue > 0) {
      activity.push({
        id: "momentum.active",
        label: t("ui.roadmap.activity.momentum"),
        detail: t("ui.roadmap.activity.momentumDetail", {
          loc: formatMultiplier(getBuildMomentumEffects(state).locMultiplier),
          value: Math.round(momentumValue)
        }),
        tone: momentumValue >= 70 ? "success" : "info"
      });
    }

    const chainSummary = getProjectChainSummary(state);
    if (chainSummary.next !== undefined) {
      activity.push({
        id: "projectChains.next",
        label: t("ui.roadmap.activity.projectChains"),
        detail: t("ui.roadmap.activity.projectChainsDetail", {
          current: chainSummary.next.completedProjectIds.length,
          name: t(chainSummary.next.definition.nameKey),
          required: chainSummary.next.total
        }),
        tone: chainSummary.next.progress >= 1 ? "success" : "info"
      });
    }

    if (state.aurora.unlocked) {
      activity.push({
        id: "aurora.status",
        label: t("ui.roadmap.activity.aurora"),
        detail: t("ui.roadmap.activity.auroraDetail", {
          progress: getAuroraProgress(state).toFixed(1)
        }),
        tone: state.aurora.completed ? "success" : "info"
      });
    }

    activity.push({
      id: "changelog.latest",
      label: t("ui.roadmap.activity.changelog"),
      detail: t("ui.roadmap.activity.changelogDetail", {
        loc: formatPerSecond(derived.locRate),
        money: formatMoneyRate(getProjectIncomeRate(state, cache))
      }),
      tone: "success"
    });

    return activity.slice(0, 5);
  }

  function createAuroraView(): AuroraView {
    const phase = getCurrentAuroraPhase(state);
    const progress = getAuroraProgress(state);
    const availableServers = getAvailableAuroraServers(state);
    const readyServers = getAuroraReadyServerCount(state);
    const billing = createBillingBreakdown(state);
    const status = getAuroraStatusForView();
    const serverRatio =
      phase === undefined || phase.requiredServers <= 0
        ? 1
        : Math.min(1, availableServers / phase.requiredServers);
    const remainingS =
      phase === undefined
        ? 0
        : state.aurora.phaseActive
          ? Math.max(0, (phase.workS - state.aurora.phaseElapsedS) / Math.max(0.001, serverRatio))
          : phase.workS;
    const canFund =
      state.aurora.unlocked &&
      !state.aurora.completed &&
      !state.aurora.phaseActive &&
      phase !== undefined &&
      availableServers >= phase.requiredServers &&
      canSpendBig(state.res.loc, phase.costLoc) &&
      canSpendBig(state.res.money, phase.costMoney);

    return {
      availableServers: t("ui.aurora.serverCount", { count: availableServers }),
      canDedicate:
        state.aurora.unlocked &&
        !state.aurora.completed &&
        state.aurora.dedicatedServers < AURORA_REQUIRED_DEDICATED_SERVERS &&
        readyServers > 0,
      canFund,
      canHost:
        state.aurora.unlocked &&
        !state.aurora.completed &&
        availableServers < AURORA_REQUIRED_DEDICATED_SERVERS,
      canReleaseHost:
        state.aurora.unlocked && !state.aurora.completed && state.aurora.hostedServers > 0,
      completed: state.aurora.completed,
      costLoc: phase === undefined ? t("ui.aurora.done") : formatLoc(phase.costLoc),
      costMoney: phase === undefined ? t("ui.aurora.done") : formatMoney(phase.costMoney),
      dedicatedServers: t("ui.aurora.serverCount", { count: state.aurora.dedicatedServers }),
      hostedServers: t("ui.aurora.serverCount", { count: state.aurora.hostedServers }),
      hostingRate: formatMoneyRate(billing.auroraHosting),
      nodes: AURORA_PHASES.map((entry, index): AuroraNodeView => {
        const nodeState =
          state.aurora.completed || index < state.aurora.currentPhase
            ? "complete"
            : index === state.aurora.currentPhase
              ? "active"
              : "locked";

        return {
          id: entry.id,
          name: t(entry.nameKey),
          state: nodeState
        };
      }),
      phaseName:
        phase === undefined
          ? t(state.aurora.completed ? "ui.aurora.phaseComplete" : "ui.aurora.phaseNone")
          : t(phase.nameKey),
      progress: progress / 100,
      progressLabel: t("ui.aurora.progress", { percent: progress.toFixed(1) }),
      readyServerCount: readyServers,
      readyServers: t("ui.aurora.serverCount", { count: readyServers }),
      requiredServers:
        phase === undefined
          ? t("ui.aurora.done")
          : t("ui.aurora.serverCount", { count: phase.requiredServers }),
      statusLabel: t(`ui.aurora.status.${status}`),
      timeRemaining: formatTime(remainingS),
      unlocked: state.aurora.unlocked
    };
  }

  function getAuroraStatusForView(): AuroraView["nodes"][number]["state"] | string {
    const phase = getCurrentAuroraPhase(state);

    if (!state.aurora.unlocked) {
      return "locked";
    }

    if (state.aurora.completed || phase === undefined) {
      return "complete";
    }

    if (state.aurora.phaseActive && state.aurora.billingPaused) {
      return "billing";
    }

    if (getAvailableAuroraServers(state) < phase.requiredServers) {
      return "servers";
    }

    return state.aurora.phaseActive ? "ready" : "funding";
  }

  function createProjectOfferView(project: ProjectDefinition): ProjectOfferView {
    const cost = getProjectCost(project, cache, state);
    const level = getProjectLevel(state, project);
    const maxLevel = getProjectMaxLevel(project);
    const nextLevel = getProjectNextLevel(state, project);
    const atMaxLevel = project.kind === "standard" && level >= maxLevel;
    const payout = level === 0 ? getProjectPayout(project, cache, state) : Big.zero();
    const revenue = getProjectRevenue(project, cache, nextLevel, state);
    const computeUse = getProjectBuildComputeUse(state, project, nextLevel, "selfHosted");
    const canAffordBuild = canSpendBig(state.res.loc, cost);
    const canStartProject = !hasActiveProjectBuild(state);

    return {
      id: project.id,
      name: t(project.nameKey),
      buildTime: formatTime(getProjectBuildTime(project, cache)),
      canStart:
        canStartProject && !atMaxLevel && canAffordBuild && computeUse <= cache.compute.available,
      canStartHosted: canStartProject && !atMaxLevel && canAffordBuild,
      canStartSelfHosted:
        canStartProject && !atMaxLevel && canAffordBuild && computeUse <= cache.compute.available,
      compute: formatCompute(computeUse),
      cost: formatLoc(cost),
      hostingCost: formatMoneyRate(getProjectExpectedHostingRate(project, cache, nextLevel, state)),
      level:
        project.kind === "standard"
          ? formatProjectLevel(level, maxLevel)
          : t("ui.projects.levelNone"),
      payout: level === 0 ? formatMoney(payout) : t("ui.projects.payoutFirstOnly"),
      revenue: formatMoneyRate(revenue),
      tag: getProjectTag(project)
    };
  }

  function getProjectTag(project: ProjectDefinition): string {
    if (project.id === "p_llama_todo") {
      return t("ui.projects.tagTutorial");
    }

    if (project.kind === "unlock") {
      return t("ui.projects.tagUnlock");
    }

    if (hasRemainingProjectRpReward(project)) {
      return t("ui.projects.tagRp", { rp: project.rpReward ?? 0 });
    }

    return t("ui.projects.tagStandard");
  }

  function hasRemainingProjectRpReward(project: ProjectDefinition): boolean {
    if (project.rpReward === undefined || project.rpFirst === undefined) {
      return false;
    }

    return getNumericStat(`project.${project.id}.shipped`) < project.rpFirst;
  }

  function getProductName(productId: string): string {
    const product = state.projects.portfolio.find((entry) => entry.id === productId);
    return product === undefined ? productId : getProjectName(product.projectId);
  }

  function getProjectName(projectId: string): string {
    const project = getProject(projectId);
    return project === undefined ? projectId : t(project.nameKey);
  }

  function getUnlockToastName(kind: string, id: string): string {
    if (kind === "achievement") {
      const achievement = ACHIEVEMENTS.find((entry) => entry.id === id);
      return achievement === undefined ? id : t(achievement.nameKey);
    }

    if (kind === "story" && id === "aurora") {
      return t("ui.app.aurora");
    }

    if (kind === "story" && id === "aurora.complete") {
      return t("ui.aurora.phaseComplete");
    }

    return id;
  }

  function getGeneratorBuyTitle(
    unlocked: boolean,
    affordable: boolean,
    computeOk: boolean
  ): string {
    if (!unlocked) {
      return t("ui.devfloor.locked");
    }

    if (!computeOk) {
      return t("ui.devfloor.insufficientCompute");
    }

    if (!affordable) {
      return t("ui.devfloor.insufficientMoney");
    }

    return t("ui.devfloor.buy");
  }

  function getUpgradeStateLabel(stateValue: UpgradeState): string {
    return t(`ui.upgrade.state.${stateValue}`);
  }

  function getResearchStateLabel(stateValue: ResearchState): string {
    return t(`ui.research.state.${stateValue}`);
  }

  function getInsightNodeStateLabel(stateValue: InsightNodeState): string {
    return t(`ui.insight.state.${stateValue}`);
  }

  function getEquityPerkStateLabel(stateValue: EquityPerkState): string {
    return t(`ui.equity.state.${stateValue}`);
  }

  function getParadoxItemStateLabel(stateValue: ParadoxItemState): string {
    return t(`ui.paradox.state.${stateValue}`);
  }

  function getAutomationLabel(id: string): string {
    if (id === AUTO_PROMPT_ID) {
      return t("ui.automation.autoPrompt");
    }

    if (id === AUTO_FIX_ID) {
      return t("ui.automation.autoFix");
    }

    if (id === AUTO_REFRESH_PROJECTS_ID) {
      return t("ui.automation.autoRefreshProjects");
    }

    if (id === AUTO_SHIP_ID) {
      return t("ui.automation.autoShip");
    }

    if (id === AUTO_REFACTOR_ID) {
      return t("ui.automation.autoRefactor");
    }

    if (id === AUTO_BUY_HARDWARE_ID) {
      return t("ui.automation.autoBuyHardware");
    }

    if (isAutoRewriteRuleId(id)) {
      return t("ui.automation.autoRewrite");
    }

    if (id.startsWith(AUTO_BUY_PREFIX)) {
      const generatorId = id.slice(AUTO_BUY_PREFIX.length);
      const generator = GENERATORS.find((entry) => entry.id === generatorId);
      const name = generator === undefined ? generatorId : t(generator.nameKey);
      return t("ui.automation.autoBuy", { name });
    }

    return t("ui.automation.unknown");
  }

  function getAutomationDetail(id: string, derived: DerivedCache): string {
    if (id === AUTO_PROMPT_ID) {
      return t("ui.automation.autoPromptDetail", {
        percent: Math.round(derived.automation.autoPromptRate * 100)
      });
    }

    if (id === AUTO_FIX_ID) {
      return t("ui.automation.autoFixDetail", { seconds: derived.automation.autoFixDelayS });
    }

    if (id === AUTO_REFRESH_PROJECTS_ID) {
      return t("ui.automation.autoRefreshProjectsDetail");
    }

    if (id === AUTO_SHIP_ID) {
      return t("ui.automation.autoShipDetail");
    }

    if (id === AUTO_REFACTOR_ID) {
      return t("ui.automation.autoRefactorDetail");
    }

    if (id === AUTO_BUY_HARDWARE_ID) {
      return t("ui.automation.autoBuyHardwareDetail");
    }

    if (isAutoRewriteRuleId(id)) {
      return t("ui.automation.autoRewriteDetail", {
        mult: getAutoRewriteRuleMultiplier(id) ?? 1
      });
    }

    if (id.startsWith(AUTO_BUY_PREFIX)) {
      return t("ui.automation.autoBuyDetail", {
        percent: Math.round(C.AUTO_BUY_KEEP_CASH_RATIO * 100)
      });
    }

    return t("ui.automation.unknownDetail");
  }

  function createLocRateTooltip(derived: DerivedCache): string {
    return t("ui.tooltip.locRate", {
      total: formatPerSecond(derived.locRate),
      era: formatMultiplier(derived.multipliers.era),
      insightNodes: formatMultiplier(derived.multipliers.insightNodes),
      research: formatMultiplier(derived.multipliers.research),
      debt: formatMultiplier(derived.multipliers.debt),
      prestige: formatMultiplier(derived.multipliers.prestige),
      momentum: formatMultiplier(derived.multipliers.momentum),
      projectChains: formatMultiplier(derived.multipliers.projectChains),
      upgrades: formatMultiplier(derived.multipliers.upgrades),
      achievements: formatMultiplier(derived.multipliers.achievements)
    });
  }

  function createMoneyRateTooltip(
    gross: Big,
    billing: ReturnType<typeof createBillingBreakdown>,
    net: Big
  ): string {
    return t("ui.tooltip.moneyRate", {
      auroraHosting: formatMoneyRate(billing.auroraHosting),
      auroraPower: formatMoneyRate(billing.auroraPower),
      gross: formatMoneyRate(gross),
      hype: formatMultiplier(state.res.hype),
      net: formatMoneyRate(net),
      power: formatMoneyRate(billing.hardwarePower),
      prestige: formatMultiplier(cache.multipliers.prestige),
      projectHosting: formatMoneyRate(billing.projectHosting),
      revenue: formatMultiplier(cache.project.revenueMultiplier),
      total: formatMoneyRate(billing.total)
    });
  }

  return {
    createDevFloorView(derived: DerivedCache, includeClosedApps = false): DevFloorView {
      syncRuntime();
      return createDevFloorView(derived, includeClosedApps);
    },

    getProductName(productId: string): string {
      syncRuntime();
      return getProductName(productId);
    },

    getProjectName(projectId: string): string {
      syncRuntime();
      return getProjectName(projectId);
    },

    getUnlockToastName(kind: string, id: string): string {
      syncRuntime();
      return getUnlockToastName(kind, id);
    },

    reset(): void {
      lastDevFloorView = undefined;
    }
  };
}
