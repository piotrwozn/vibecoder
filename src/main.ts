import { createEventBus } from "./core/bus";
import { Big } from "./core/bignum";
import { formatBig, formatTime, type NumberNotation } from "./core/format";
import { OFFLINE_CATCH_UP_MS, startLoop } from "./core/loop";
import {
  exportGameState,
  importGameState,
  loadGameState,
  saveGameState,
  shouldBlockPersistenceAfterLoad
} from "./core/save";
import { createDefaultGameState } from "./core/state";
import { TUTORIAL_STEPS, type AppId, type TutorialStep, type WindowFrame } from "./core/ui-state";
import { createViewInvalidation, markResourceEvent } from "./core/view-invalidation";
import { ACHIEVEMENTS, ACHIEVEMENT_LOC_BONUS } from "./data/achievements";
import { AURORA_PHASES } from "./data/aurora";
import { C } from "./data/constants";
import { createDevPerfPanel, type DevPerfPanel } from "./dev/perf-panel";
import { GENERATORS } from "./data/generators";
import { VIBEX_CODE_FILES } from "./data/vibex";
import { REFACTOR_PROJECT, type ProjectDefinition } from "./data/projects";
import type {
  EquityPerkDefinition,
  EquityPerkState,
  InsightNodeDefinition,
  ParadoxItemDefinition,
  ParadoxItemState,
  RunModifierDefinition,
  RunModifierId
} from "./data/prestige";
import type { ResearchDefinition } from "./data/research";
import type { UpgradeDefinition } from "./data/upgrades";
import type { StoryChannel } from "./data/story/types";
import { hasMessage, loadLocale, t } from "./i18n/i18n";
import { createVibexAiClient, type VibexAiSnapshot } from "./platform/ai";
import { createDesktopPlatform, isTauriRuntime } from "./platform/desktop";
import { createWebPlatform } from "./platform/web";
import {
  getAchievementStates,
  getUnlockedAchievementCount,
  tickAchievements
} from "./systems/achievements";
import {
  AUTO_FIX_ID,
  AUTO_BUY_PREFIX,
  AUTO_PROMPT_ID,
  getAutoRewriteRuleMultiplier,
  getAutomationToggles,
  isAutoRewriteRuleId,
  setAutomationEnabled,
  tickAutomation
} from "./systems/automation";
import {
  buyHardware as purchaseHardware,
  canFitCompute,
  getAvailableHardware,
  getHardware,
  getHardwareCapGain,
  getHardwareCost,
  getHardwareTierGateRequirement,
  isHardwareMaxed
} from "./systems/compute";
import {
  AURORA_REQUIRED_DEDICATED_SERVERS,
  dedicateAuroraServer as dedicateAuroraServerToProject,
  fundAuroraPhase as fundAuroraPhaseStep,
  getAuroraProgress,
  getAuroraReadyServerCount,
  getAvailableAuroraServers,
  getCurrentAuroraPhase,
  rentAuroraHost as rentAuroraHosting,
  tickAurora
} from "./systems/aurora";
import {
  createBillingBreakdown,
  getHardwarePowerRatePerLevel,
  getNetMoneyRate,
  tickBilling
} from "./systems/billing";
import { fixBug as repairBug, tickDebt } from "./systems/debt";
import { isDemoLocked } from "./systems/demo";
import { tickHype } from "./systems/hype";
import { isIterationUnlocked } from "./systems/iteration";
import { applyOfflineProgress, type OfflineProgressResult } from "./systems/offline";
import { performPromptClick, tickPromptFlow, isFlowActive } from "./systems/prompt";
import {
  advanceVibexCode,
  createVibexCannedBag,
  createVibexCodeState,
  drawVibexCannedPair,
  getVibexCodeFrame,
  getVibexFileLabelKey,
  getVibexManualFallbackKey
} from "./systems/vibex";
import { getLocRateSamples, tickStats } from "./systems/stats";
import { buyNextEra, canBuyEra, getCurrentEra, getEraCost, getNextEra } from "./systems/eras";
import {
  buyEquityPerk as purchaseEquityPerk,
  buyInsightNode as purchaseInsightNode,
  buyParadoxItem as purchaseParadoxItem,
  createExitPreview,
  createIterationPreview,
  createRewritePreview,
  getActiveRunModifier,
  getActiveParadoxTheme,
  getEquityPerkState,
  getEquityPerks,
  getInsightNodeState,
  getInsightTree,
  getOwnedParadoxRuleSlots,
  getParadoxItemState,
  getParadoxItems,
  getRunModifiers,
  getSelectedRunModifier,
  isRewriteBooting,
  performExit,
  performIteration,
  performRewrite,
  selectRunModifier as chooseRunModifier,
  tickIterationHold,
  type ExitPreview,
  type InsightNodeState,
  type IterationPreview,
  type RewritePreview
} from "./systems/prestige";
import {
  ensureProjectBoard,
  getProject,
  getProjectBuildTime,
  getProjectCost,
  getProjectIncomeRate,
  getProjectPayout,
  getProjectRevenue,
  getProductRevenue,
  getVisibleProjectOffers,
  hasActiveProjectBuild,
  refreshProjectBoard,
  startProject as startProjectBuild,
  tickProjects
} from "./systems/projects";
import {
  buyGenerator,
  createDerivedCache,
  getGeneratorCost,
  getGeneratorMaxAffordable,
  recomputeDerivedCache,
  tickProduction,
  type BuyQuantity,
  type DerivedCache
} from "./systems/production";
import {
  buyResearch as purchaseResearch,
  getResearchTree,
  getResearchState,
  type ResearchState
} from "./systems/research";
import {
  chooseStoryOption,
  getStoryEvent,
  getUnreadStoryCount,
  isStoryInboxEntryUnread,
  markStoryInboxRead,
  tickStory
} from "./systems/story";
import {
  buyUpgrade as purchaseUpgrade,
  getUpgradeCost,
  getUpgradeState,
  getVisibleUpgrades,
  type UpgradeState
} from "./systems/upgrades";
import {
  mountApp,
  getAppIconPath,
  type ActiveBuildView,
  type AppearanceView,
  type AchievementCardView,
  type AchievementsView,
  type AppActions,
  type AppShell,
  type AuroraNodeView,
  type AuroraView,
  type AutomationToggleView,
  type CommsMessageView,
  type CommsView,
  type DevFloorView,
  type EndingModalView,
  type EquityPerkView,
  type ExitPreviewView,
  type ExitView,
  type FullGameView,
  type GeneratorBuyQuantity,
  type GeneratorRowView,
  type HardwareRowView,
  type ModelView,
  type OfflineView,
  type ParadoxItemView,
  type ParadoxView,
  type ProductView,
  type ProjectOfferView,
  type ProjectsView,
  type InsightNodeView,
  type RewritePreviewView,
  type RewriteView,
  type ResearchNodeView,
  type ResearchView,
  type RunModifierView,
  type SettingsView,
  type VibexPromptSource,
  type VibexSendView,
  type VibexView,
  type StatsRowView,
  type StatsView,
  type TutorialView,
  type UpgradeRowView
} from "./ui/render";
import { createAudioController } from "./ui/audio";
import {
  closeWindow,
  focusWindow,
  isWindowVisible,
  minimizeWindow,
  moveWindow,
  openWindow,
  resetWindowLayout as resetPersistedWindowLayout,
  resizeWindow,
  shouldBuildAppView,
  toggleMaximizedWindow,
  type WindowBounds
} from "./ui/wm/window-manager";
import "./ui/theme.css";
import "./ui/layout.css";

const root = document.querySelector<HTMLElement>("#app");

if (root === null) {
  throw new Error("Missing #app root");
}

const appRoot = root;
const platform = isTauriRuntime() ? createDesktopPlatform() : createWebPlatform();

const loaded = await loadGameState(platform);
let state = loaded.state;
let bootLocaleRepaired = false;
try {
  await loadLocale(state.settings.lang);
} catch {
  state.settings.lang = "en";
  bootLocaleRepaired = true;
  await loadLocale("en");
}
document.documentElement.lang = state.settings.lang;
platform.setTitle(t("app.title"));
syncSceneAfterLoad();
const bus = createEventBus();
const cache = createDerivedCache();
ensureProjectBoard(state);
recomputeDerivedCache(state, cache);
const audio = createAudioController(state.settings);
let offlineSummary = applyOfflineOnReturn(Date.now());
let autosaveTimer: number | undefined;
let commsViewCache: CommsView | undefined;
let commsViewDirty = true;
let devPerfPanel: DevPerfPanel | undefined;
let persistenceBlocked = shouldBlockPersistenceAfterLoad(loaded);

const SHIPPED_STAT = "projects.shipped";
const BUGS_FIXED_STAT = "bugs.fixed";
const REFACTORED_STAT = "projects.refactored";
const HYPE_MAX_STAT = "hype.max";
const SPARKLINE_WIDTH = 300;
const SPARKLINE_HEIGHT = 80;
const SPARKLINE_PADDING = 6;
const MS_PER_HOUR = 60 * 60 * 1000;
let lastDevFloorView: DevFloorView | undefined;
const vibexAi = createVibexAiClient(platform.edition, () => updateVisibleView());
let vibexCannedBag = createVibexCannedBag(state.rngSeed);
let currentVibexCanned = drawVibexCannedPair(vibexCannedBag);
let currentVibexAssistant = createIdleVibexAssistant();
let vibexCodeState = createVibexCodeState(state.rngSeed);
let currentVibexCodeFrame = getVibexCodeFrame(vibexCodeState);
let localeChangeToken = 0;

type VibexAssistantState =
  | {
      readonly kind: "keys";
      readonly promptKey: string;
      readonly responseKey: string;
    }
  | {
      readonly kind: "text";
      readonly prompt: string;
      readonly response: string;
    };

const invalidation = createViewInvalidation();
bus.on("res:changed", (resource) => {
  markResourceEvent(invalidation, resource);
});
bus.on("production:changed", () => {
  invalidation.markResourceChanged();
});

for (const event of ["bought", "unlock", "era:changed", "prestige"] as const) {
  bus.on(event, () => {
    invalidation.markStructuralChanged();
  });
}
bus.on("bug:fixed", () => {
  invalidation.markResourceChanged();
});
bus.on("bug:spawned", () => {
  invalidation.markResourceChanged();
});
if (isDevPerfPanelEnabled()) {
  devPerfPanel = createDevPerfPanel({
    warp: runDevTimeWarp
  });
  document.body.append(devPerfPanel.root);
}

let app: AppShell;
const appActions: AppActions = {
  changeGlitch(enabled: boolean): void {
    state.settings.glitch = enabled;
    updateVisibleView();
    void persistNow();
  },

  changeLang(lang: string): void {
    void changeLanguage(lang);
  },

  buyEra(): void {
    const result = buyNextEra(state, bus);
    if (result.ok) {
      refreshProjectBoard(state);
      recomputeDerivedCache(state, cache);
      invalidation.markStructuralChanged();
      void persistNow();
    } else {
      invalidation.markVisibleChanged(false);
    }
  },

  buyEquityPerk(id: string): void {
    const result = purchaseEquityPerk(state, cache, id, bus);
    invalidation.markVisibleChanged(result.ok);

    if (result.ok) {
      void persistNow();
    }
  },

  buyInsightNode(id: string): void {
    const result = purchaseInsightNode(state, cache, id, bus);
    invalidation.markVisibleChanged(result.ok);

    if (result.ok) {
      void persistNow();
    }
  },

  buyParadoxItem(id: string): void {
    const result = purchaseParadoxItem(state, cache, id, bus);
    invalidation.markVisibleChanged(result.ok);

    if (result.ok) {
      markCommsViewDirty();
      void persistNow();
    }
  },

  buyResearch(id: string): void {
    const result = purchaseResearch(state, cache, id, bus);
    invalidation.markVisibleChanged(result.ok);
  },

  buyGenerator(id: string, quantity: GeneratorBuyQuantity): void {
    const result = buyGenerator(state, cache, id, quantity as BuyQuantity, bus);
    invalidation.markVisibleChanged(result.ok);
  },

  buyHardware(id: string): void {
    const result = purchaseHardware(state, id, bus);
    invalidation.markVisibleChanged(result.ok);
  },

  dedicateAuroraServer(): void {
    const result = dedicateAuroraServerToProject(state, bus);
    invalidation.markVisibleChanged(result.ok);

    if (result.ok) {
      void persistNow();
    }
  },

  fundAuroraPhase(): void {
    const result = fundAuroraPhaseStep(state, bus);
    invalidation.markVisibleChanged(result.ok);

    if (result.ok) {
      void persistNow();
    }
  },

  rentAuroraHost(): void {
    const result = rentAuroraHosting(state, bus);
    invalidation.markVisibleChanged(result.ok);

    if (result.ok) {
      void persistNow();
    }
  },

  buyUpgrade(id: string): void {
    const result = purchaseUpgrade(state, cache, id, bus);
    invalidation.markVisibleChanged(result.ok);
  },

  fixBug(productId: string): void {
    const result = repairBug(state, productId, bus);
    invalidation.markVisibleChanged(result.ok);
  },

  changeAutosaveS(seconds: number): void {
    state.settings.autosaveS = seconds;
    scheduleAutosave();
    updateVisibleView();
    void persistNow();
  },

  changeDoNotDisturb(enabled: boolean): void {
    state.settings.doNotDisturb = enabled;
    markCommsViewDirty();
    updateVisibleView();
    void persistNow();
  },

  changeNotation(notation: NumberNotation): void {
    state.settings.notation = notation;
    updateVisibleView();
    void persistNow();
  },

  changeReducedFx(enabled: boolean): void {
    state.settings.reducedFx = enabled;
    updateVisibleView();
    void persistNow();
  },

  changeSkipIntro(enabled: boolean): void {
    state.settings.skipIntro = enabled;
    updateVisibleView();
    void persistNow();
  },

  changeSound(enabled: boolean): void {
    state.settings.sound = enabled;
    audio.setSettings(state.settings);
    updateVisibleView();
    void persistNow();
  },

  changeVibexLocalAi(enabled: boolean): void {
    state.settings.vibexLocalAi = enabled;
    updateVisibleView();
    void persistNow();
    if (enabled) {
      void vibexAi.downloadModel().then(() => {
        updateVisibleView();
      });
    } else {
      vibexAi.dispose();
    }
  },

  changeVolume(volume: number): void {
    state.settings.volume = Math.min(1, Math.max(0, volume));
    audio.setSettings(state.settings);
    updateVisibleView();
    void persistNow();
  },

  closeApp(appId: AppId): void {
    closeWindow(state.ui.windows, appId);
    updateVisibleView();
    void persistNow();
  },

  dismissOffline(): void {
    offlineSummary = undefined;
    updateVisibleView();
  },

  downloadVibexModel(): void {
    updateVisibleView();
    void vibexAi.downloadModel().then(() => {
      updateVisibleView();
    });
  },

  exportSave(): string {
    state.meta.lastSeen = Date.now();
    return exportGameState(state);
  },

  focusApp(appId: AppId): void {
    focusWindow(state.ui.windows, appId);
    updateVisibleView();
  },

  importSave(payload: string): boolean {
    const result = importGameState(payload, { edition: platform.edition, nowMs: Date.now() });

    if (!result.ok || result.reset) {
      audio.play("error");
      app.showToast(t("ui.toast.importFailed"), "danger");
      return false;
    }

    persistenceBlocked = false;
    installState(result.state);
    void persistNow();
    return true;
  },

  maximizeApp(appId: AppId, bounds: WindowBounds): void {
    toggleMaximizedWindow(state.ui.windows, appId, bounds);
    updateVisibleView();
    void persistNow();
  },

  minimizeApp(appId: AppId): void {
    minimizeWindow(state.ui.windows, appId);
    updateVisibleView();
    void persistNow();
  },

  moveApp(appId: AppId, frame: Pick<WindowFrame, "x" | "y">, bounds: WindowBounds): void {
    moveWindow(state.ui.windows, appId, frame, bounds);
    updateVisibleView();
    void persistNow();
  },

  openApp(appId: AppId, bounds: WindowBounds): void {
    if (appId === "aurora" && !state.aurora.unlocked) {
      return;
    }

    openWindow(state.ui.windows, appId, bounds);
    markCommsAppRead(appId);
    state.ui.scene = "desktop";
    updateVisibleView();
    void persistNow();
  },

  playBootSound(): void {
    audio.play("boot");
  },

  playUiClick(): void {
    audio.play("click");
  },

  prompt(): { readonly loc: string } {
    const gained = performPromptClick(state, cache, state.meta.playtimeS, bus);
    audio.play("click");
    return { loc: formatLinesOfCode(gained) };
  },

  sendVibexPrompt(promptText: string, source: VibexPromptSource = "manual"): VibexSendView {
    const gained = performPromptClick(state, cache, state.meta.playtimeS, bus);
    const codeFrame = advanceVibexCode(vibexCodeState);
    currentVibexCodeFrame = codeFrame;
    audio.play("click");

    const trimmedPrompt = promptText.trim();
    const userTriggered = source === "manual";
    const eraModel = getCurrentEraModel();
    const aiSnapshot = vibexAi.snapshot();
    const loc = formatLinesOfCode(gained);
    let pendingGeneration: Promise<string | undefined> | undefined;
    let pendingResponse: Promise<string> | undefined;
    let prompt = trimmedPrompt;
    let response = t("vibex.ai.typing");
    const manualFallbackResponse =
      trimmedPrompt.length > 0
        ? createVibexManualFallbackResponse(trimmedPrompt, eraModel, codeFrame.sequence)
        : "";

    if (
      trimmedPrompt.length > 0 &&
      state.settings.vibexLocalAi &&
      aiSnapshot.status !== "unavailable"
    ) {
      pendingGeneration = generateVibexAiResponse(trimmedPrompt, eraModel, aiSnapshot.status);
    }

    if (pendingGeneration === undefined) {
      if (trimmedPrompt.length > 0) {
        response = manualFallbackResponse;
        if (userTriggered) {
          currentVibexAssistant = {
            kind: "text",
            prompt,
            response
          };
        }
      } else {
        currentVibexCanned = drawVibexCannedPair(vibexCannedBag);
        prompt = t(currentVibexCanned.promptKey);
        response = t(currentVibexCanned.responseKey);
        if (userTriggered) {
          currentVibexAssistant = {
            kind: "text",
            prompt,
            response
          };
        }
      }
    } else {
      if (userTriggered) {
        currentVibexAssistant = {
          kind: "text",
          prompt,
          response
        };
      }
      pendingResponse = pendingGeneration.then((generatedResponse) => {
        const finalResponse = generatedResponse ?? manualFallbackResponse;
        if (userTriggered) {
          currentVibexAssistant = {
            kind: "text",
            prompt,
            response: finalResponse
          };
        }
        updateVisibleView();
        return finalResponse;
      });
    }

    updateVisibleView();

    return {
      committed: codeFrame.committed,
      loc,
      pendingResponse,
      prompt,
      response
    };
  },

  chooseStoryChoice(eventId: string, choiceId: string): void {
    const result = chooseStoryOption(state, eventId, choiceId, cache, bus);
    invalidation.markVisibleChanged(result.ok);

    if (result.ok) {
      void persistNow();
    }
  },

  exit(): void {
    void persistNow();
    const result = performExit(state, cache, bus);
    invalidation.markVisibleChanged(result.ok);

    if (result.ok) {
      void persistNow();
    }
  },

  iterate(): void {
    void persistNow();
    const result = performIteration(state, cache, bus);
    invalidation.markVisibleChanged(result.ok);

    if (result.ok) {
      markCommsViewDirty();
      void persistNow();
    }
  },

  rewrite(): void {
    void persistNow();
    const result = performRewrite(state, cache, bus);
    invalidation.markVisibleChanged(result.ok);

    if (result.ok) {
      void persistNow();
    }
  },

  resetWindowLayout(): void {
    resetPersistedWindowLayout(state.ui.windows);
    updateVisibleView();
    void persistNow();
  },

  replayTutorial(): void {
    state.ui.scene = "desktop";
    state.ui.tutorial = {
      active: true,
      completed: false,
      step: "welcome"
    };
    updateVisibleView();
    void persistNow();
  },

  resetSettings(): void {
    const defaults = createDefaultGameState(Date.now(), platform.edition).settings;
    state.settings = { ...defaults };
    audio.setSettings(state.settings);
    markCommsViewDirty();
    scheduleAutosave();
    updateVisibleView();
    void persistNow();
  },

  resizeApp(appId: AppId, frame: WindowFrame, bounds: WindowBounds): void {
    resizeWindow(state.ui.windows, appId, frame, bounds);
    updateVisibleView();
    void persistNow();
  },

  startProject(id: string): void {
    const result = startProjectBuild(state, id, cache, bus);
    invalidation.markVisibleChanged(result.ok);
  },

  startDesktop(): void {
    state.ui.scene = "desktop";
    state.ui.bootSeen = true;
    if (!state.ui.tutorial.completed) {
      state.ui.tutorial.active = true;
    }
    updateVisibleView();
    void persistNow();
  },

  startRefactor(): void {
    const result = startProjectBuild(state, REFACTOR_PROJECT.id, cache, bus);
    invalidation.markVisibleChanged(result.ok);
  },

  selectRunModifier(id: string | undefined): void {
    const result = chooseRunModifier(state, id as RunModifierId | undefined);
    invalidation.markVisibleChanged(result.ok);

    if (result.ok) {
      void persistNow();
    }
  },

  toggleAutomation(id: string, enabled: boolean): void {
    setAutomationEnabled(state, id, enabled);
    invalidation.markVisibleChanged(true);
    void persistNow();
  },

  tutorialBack(): void {
    moveTutorialStep(-1);
  },

  tutorialNext(): void {
    if (state.ui.tutorial.step === "done") {
      completeTutorial();
    } else {
      moveTutorialStep(1);
    }
  },

  tutorialSkip(): void {
    completeTutorial();
  },

  quitToTitle(): void {
    state.ui.scene = "boot";
    state.ui.bootSeen = true;
    state.ui.tutorial.active = false;
    updateVisibleView();
    void persistNow();
  },

  wipeSave(): void {
    persistenceBlocked = false;
    installState(createDefaultGameState(Date.now(), platform.edition));
    void persistNow();
  }
};

async function generateVibexAiResponse(
  prompt: string,
  eraModel: string,
  status: VibexAiSnapshot["status"]
): Promise<string | undefined> {
  if (status !== "ready") {
    const loaded = await vibexAi.downloadModel();

    if (!loaded) {
      return undefined;
    }
  }

  return vibexAi.generate(prompt, eraModel);
}

app = mountApp(appRoot, createDevFloorView(cache, true), appActions);

if (loaded.reset) {
  app.showToast(
    t(
      loaded.resetReason === "newer-version"
        ? "ui.toast.saveNewerVersion"
        : "ui.toast.saveUnreadable"
    ),
    "danger"
  );
}

bus.on("story:message", ({ eventId }) => {
  const appId = getStoryMessageAppId(eventId);
  const hadUnread = appId !== undefined && getUnreadStoryCount(state, appId) > 0;

  if (appId !== undefined && isWindowVisible(state.ui.windows[appId])) {
    markCommsAppRead(appId);
  }

  if (hadUnread && !state.settings.doNotDisturb) {
    audio.play("message");
    showStoryToast(appId);
  }

  markCommsViewDirty();
  invalidation.markVisibleChanged(true);
});

bus.on("bug:fixed", ({ productId }) => {
  app.addTerminalLog(t("ui.terminal.bugFixedLog", { name: getProductName(productId) }));
});

bus.on("bug:spawned", ({ productId }) => {
  audio.play("error");
  app.addTerminalLog(t("ui.terminal.bugLog", { name: getProductName(productId) }));
});

bus.on("shipped", ({ payout, projectId }) => {
  const name = getProjectName(projectId);
  audio.play("ship");
  app.addTerminalLog(t("ui.terminal.shipLog", { name }));
  app.showToast(t("ui.toast.shipped", { name, payout: formatMoney(payout) }), "gold");
});

bus.on("unlock", ({ id, kind }) => {
  audio.play("unlock");
  app.showToast(t("ui.toast.unlock", { name: getUnlockToastName(kind, id) }), "accent");
});

if (((loaded.repaired || bootLocaleRepaired) && !loaded.reset) || offlineSummary !== undefined) {
  void persistNow();
}

scheduleAutosave();
window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    void persistNow();
  }
});
window.addEventListener("beforeunload", () => {
  void persistNow();
});

startLoop({
  catchUp(): void {
    offlineSummary = applyOfflineOnReturn(Date.now());
    updateVisibleView();
    void persistNow();
  },
  metrics:
    devPerfPanel === undefined
      ? undefined
      : {
          frame: devPerfPanel.recordFrame,
          tick: devPerfPanel.recordTick
        },

  tick(dtS): void {
    const wasBooting = isRewriteBooting(state);
    state.meta.playtimeS += dtS;
    state.meta.lastSimTickMs = Date.now();
    invalidation.markVisibleChanged(tickPromptFlow(state, dtS));
    tickProduction(state, cache, dtS, bus);
    invalidation.markVisibleChanged(tickProjects(state, cache, dtS, bus));
    invalidation.markVisibleChanged(tickBilling(state, dtS, bus));
    invalidation.markVisibleChanged(tickAurora(state, dtS, bus));
    invalidation.markVisibleChanged(tickHype(state, dtS, cache, bus));
    invalidation.markVisibleChanged(tickDebt(state, cache, dtS, bus));
    invalidation.markVisibleChanged(tickAutomation(state, cache, dtS, bus));
    invalidation.markVisibleChanged(tickStory(state, dtS, cache, bus));
    invalidation.markVisibleChanged(tickIterationHold(state, cache, dtS, bus));
    invalidation.markVisibleChanged(tickStats(state, cache));
    invalidation.markVisibleChanged(tickAchievements(state, cache, bus));
    invalidation.markVisibleChanged(wasBooting && !isRewriteBooting(state));
  },
  render(alpha): void {
    app.updateFrameAlpha(alpha);

    const dirty = invalidation.consume();
    if (dirty.cache) {
      recomputeDerivedCache(state, cache);
    }

    if (dirty.view) {
      updateVisibleView();
    }
  }
});

function scheduleAutosave(): void {
  if (autosaveTimer !== undefined) {
    window.clearInterval(autosaveTimer);
  }

  autosaveTimer = window.setInterval(() => {
    void persistNow();
  }, state.settings.autosaveS * 1000);
}

function persistNow(): Promise<boolean> {
  if (persistenceBlocked) {
    return Promise.resolve(false);
  }

  return saveGameState(platform, state, Date.now());
}

function installState(nextState: typeof state): void {
  state = nextState;
  syncSceneAfterLoad();
  ensureProjectBoard(state);
  recomputeDerivedCache(state, cache);
  audio.setSettings(state.settings);
  offlineSummary = undefined;
  resetVibexTransientState();
  markCommsViewDirty();
  scheduleAutosave();
  invalidation.markStructuralChanged();
  updateVisibleView();
}

function resetVibexTransientState(): void {
  vibexCannedBag = createVibexCannedBag(state.rngSeed);
  currentVibexCanned = drawVibexCannedPair(vibexCannedBag);
  currentVibexAssistant = createIdleVibexAssistant();
  vibexCodeState = createVibexCodeState(state.rngSeed);
  currentVibexCodeFrame = getVibexCodeFrame(vibexCodeState);
}

function createIdleVibexAssistant(): VibexAssistantState {
  return {
    kind: "keys",
    promptKey: "vibex.aiAssistant.idlePrompt",
    responseKey: "vibex.aiAssistant.idleResponse"
  };
}

function getCurrentVibexAssistant(): { readonly prompt: string; readonly response: string } {
  if (currentVibexAssistant.kind === "keys") {
    return {
      prompt: t(currentVibexAssistant.promptKey),
      response: t(currentVibexAssistant.responseKey)
    };
  }

  return {
    prompt: currentVibexAssistant.prompt,
    response: currentVibexAssistant.response
  };
}

function syncSceneAfterLoad(): void {
  if (!state.aurora.unlocked) {
    closeWindow(state.ui.windows, "aurora");
  }

  if (state.ui.scene === "boot" && state.ui.bootSeen && state.settings.skipIntro) {
    state.ui.scene = "desktop";
  }

  if (state.ui.scene === "desktop" && !state.ui.tutorial.completed) {
    state.ui.tutorial.active = true;
  }
}

function moveTutorialStep(offset: -1 | 1): void {
  if (!state.ui.tutorial.active || state.ui.tutorial.completed) {
    return;
  }

  const index = getTutorialStepIndex(state.ui.tutorial.step);
  const nextIndex = Math.min(TUTORIAL_STEPS.length - 1, Math.max(0, index + offset));
  const nextStep = TUTORIAL_STEPS[nextIndex];

  if (nextStep === undefined || nextStep === state.ui.tutorial.step) {
    return;
  }

  state.ui.tutorial.step = nextStep;
  openTutorialStepTarget(nextStep);
  updateVisibleView();
  void persistNow();
}

function completeTutorial(): void {
  state.ui.tutorial = {
    active: false,
    completed: true,
    step: "done"
  };
  updateVisibleView();
  void persistNow();
}

function openTutorialStepTarget(step: TutorialStep): void {
  const appId = getTutorialStepApp(step);

  if (appId === undefined) {
    return;
  }

  openWindow(state.ui.windows, appId, getNotificationWindowBounds());
  markCommsAppRead(appId);
  state.ui.scene = "desktop";
}

function getTutorialStepApp(step: TutorialStep): AppId | undefined {
  switch (step) {
    case "vibex":
      return "vibex";
    case "projects":
      return "projects";
    case "agents":
      return "agents";
    case "hardware":
      return "hardware";
    case "comms":
      return "chat";
    case "settings":
      return "settings";
    case "welcome":
    case "resources":
    case "done":
      return undefined;
  }
}

function getTutorialStepIndex(step: TutorialStep): number {
  return Math.max(0, TUTORIAL_STEPS.indexOf(step));
}

function applyOfflineOnReturn(nowMs: number): OfflineProgressResult | undefined {
  if (nowMs - state.meta.lastSimTickMs <= OFFLINE_CATCH_UP_MS) {
    return undefined;
  }

  const result = applyOfflineProgress(state, cache, nowMs);
  return result.elapsedS > 0 ? result : undefined;
}

function updateVisibleView(): void {
  app.updateDevFloor(createDevFloorView(cache));
}

function remountVisibleView(): void {
  app.destroy();
  lastDevFloorView = undefined;
  app = mountApp(appRoot, createDevFloorView(cache, true), appActions);
}

async function changeLanguage(lang: string): Promise<void> {
  const nextLang = lang === "pl" ? "pl" : "en";
  const token = ++localeChangeToken;
  state.settings.lang = nextLang;
  await loadLocale(nextLang);

  if (token !== localeChangeToken) {
    return;
  }

  document.documentElement.lang = nextLang;
  platform.setTitle(t("app.title"));
  remountVisibleView();
  void persistNow();
}

function isDevPerfPanelEnabled(): boolean {
  return import.meta.env.DEV && new URLSearchParams(window.location.search).get("dev") === "1";
}

function runDevTimeWarp(hours: number): void {
  const nowMs = Date.now();
  state.meta.lastSimTickMs = nowMs - hours * MS_PER_HOUR;
  offlineSummary = applyOfflineProgress(state, cache, nowMs);
  recomputeDerivedCache(state, cache);
  invalidation.markStructuralChanged();
  updateVisibleView();
  void persistNow();
}

function createDevFloorView(derived: DerivedCache, includeClosedApps = false): DevFloorView {
  const previous = lastDevFloorView;
  const buildVibex = shouldBuildAppView(state.ui.windows, "vibex", includeClosedApps);
  const buildAgents = shouldBuildAppView(state.ui.windows, "agents", includeClosedApps);
  const buildHardware = shouldBuildAppView(state.ui.windows, "hardware", includeClosedApps);
  const buildUpgrades = shouldBuildAppView(state.ui.windows, "upgrades", includeClosedApps);
  const buildProjects = shouldBuildAppView(state.ui.windows, "projects", includeClosedApps);
  const buildAurora = shouldBuildAppView(state.ui.windows, "aurora", includeClosedApps);
  const buildResearch = shouldBuildAppView(state.ui.windows, "research", includeClosedApps);
  const buildRewrite = shouldBuildAppView(state.ui.windows, "rewrite", includeClosedApps);
  const buildStats = shouldBuildAppView(state.ui.windows, "stats", includeClosedApps);
  const buildAchievements = shouldBuildAppView(state.ui.windows, "achievements", includeClosedApps);
  const flowActive = buildVibex ? isFlowActive(state) : (previous?.flowActive ?? false);
  const view: DevFloorView = {
    appearance: createAppearanceView(),
    achievements: buildAchievements
      ? createAchievementsView()
      : (previous?.achievements ?? createAchievementsView()),
    automation: buildAgents ? createAutomationViews(derived) : (previous?.automation ?? []),
    aurora: buildAurora ? createAuroraView() : (previous?.aurora ?? createAuroraView()),
    comms: getCommsView(),
    compute: buildAgents
      ? createComputeBreakdownView(derived)
      : (previous?.compute ?? createComputeBreakdownView(derived)),
    ending: createEndingModalView(),
    flowActive,
    flowMeter: flowActive ? "100%" : `${Math.floor(state.flow.meter * 100)}%`,
    flowProgress: flowActive ? 1 : state.flow.meter,
    fullGame: buildAgents ? createFullGameView() : (previous?.fullGame ?? createFullGameView()),
    generators: buildAgents
      ? GENERATORS.filter(
          (generator) => generator.era <= state.era && !isDemoLocked(state, generator)
        ).map((generator) => createGeneratorView(derived, generator.id))
      : (previous?.generators ?? []),
    hardware: buildHardware ? createHardwareViews() : (previous?.hardware ?? []),
    model: buildVibex ? createModelView() : (previous?.model ?? createModelView()),
    offline: createOfflineView(),
    projects: buildProjects ? createProjectsView() : (previous?.projects ?? createProjectsView()),
    research: buildResearch ? createResearchView() : (previous?.research ?? createResearchView()),
    rewrite: buildRewrite ? createRewriteView() : (previous?.rewrite ?? createRewriteView()),
    resources: {
      compute: `${formatCompute(derived.compute.used)}/${formatCompute(derived.compute.cap)}`,
      hype: `${state.res.hype.toFixed(1)}x`,
      loc: formatBig(state.res.loc, state.settings.notation),
      locRate: formatPerSecond(derived.locRate),
      locRateTooltip: createLocRateTooltip(derived),
      money: formatMoney(state.res.money),
      moneyRate: formatMoneyRate(getNetMoneyRate(getProjectIncomeRate(state, cache), state)),
      moneyRateTooltip: createMoneyRateTooltip(),
      rp: formatRp(state.res.rp)
    },
    settings: createSettingsView(),
    stats: buildStats ? createStatsView(derived) : (previous?.stats ?? createStatsView(derived)),
    tutorial: createTutorialView(),
    ui: {
      bootSeen: state.ui.bootSeen,
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
    volume: state.settings.volume.toFixed(2)
  };
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
  const activeFileId = currentVibexCodeFrame.fileId;
  const ai = vibexAi.snapshot();
  const assistant = getCurrentVibexAssistant();

  return {
    aiCanDownload: ai.canDownload,
    aiEnabled: state.settings.vibexLocalAi,
    aiModelSize: ai.modelSizeLabel,
    aiProgress: formatVibexAiProgress(ai),
    aiStatus: formatVibexAiStatus(ai),
    cannedPrompt: assistant.prompt,
    cannedResponse: assistant.response,
    codeLines: currentVibexCodeFrame.lineKeys.map((lineKey, index) => ({
      id: `${currentVibexCodeFrame.sequence}:${index}`,
      text: t(lineKey)
    })),
    codeSequence: currentVibexCodeFrame.sequence,
    files: VIBEX_CODE_FILES.map((file, index) => ({
      active: file.id === activeFileId,
      id: file.id,
      label: t(getVibexFileLabelKey(vibexCodeState, index))
    }))
  };
}

function createVibexManualFallbackResponse(
  prompt: string,
  eraModel: string,
  sequence: number
): string {
  return t(getVibexManualFallbackKey(sequence), {
    model: eraModel,
    prompt: prompt.slice(0, 72)
  });
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

  return {
    lifetimeRows: [
      createStatsRow("lifetime.loc", "ui.stats.lifetimeLoc", formatLoc(state.lifetime.loc)),
      createStatsRow("lifetime.money", "ui.stats.lifetimeMoney", formatMoney(state.lifetime.money)),
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
      createStatsRow("record.generators", "ui.stats.totalAgents", String(getTotalGeneratorCount()))
    ],
    runRows: [
      createStatsRow("run.playtime", "ui.stats.playtime", formatTime(state.meta.playtimeS)),
      createStatsRow("run.loc", "ui.stats.runLoc", formatLoc(state.lifetime.locSinceExit)),
      createStatsRow("run.rate", "ui.stats.currentLocRate", formatPerSecond(derived.locRate)),
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
    next.unlock !== undefined && !canBuyEra(state, next) && state.res.money.gte(nextCost);

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

function getCurrentEraModel(): string {
  return t(getCurrentEra(state).modelKey);
}

function createFullGameView(): FullGameView {
  const next = getNextEra(state);
  const nextCost = next === undefined ? undefined : getEraCost(state, next);
  const nextDemoLocked =
    next !== undefined &&
    nextCost !== undefined &&
    isDemoLocked(state, next) &&
    state.res.money.gte(nextCost);

  return {
    visible: state.meta.edition === "demo" && (state.story.act >= 2 || nextDemoLocked)
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
        state.story.choices[entry.id] === undefined
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
    lines: getStoryLines(event.textKey),
    visible: true
  };
}

function markCommsViewDirty(): void {
  commsViewDirty = true;
}

function getCommsView(): CommsView {
  if (commsViewCache === undefined || commsViewDirty) {
    commsViewCache = createCommsView();
    commsViewDirty = false;
  }

  return commsViewCache;
}

function createCommsView(): CommsView {
  return {
    messages: state.story.inbox
      .map((entry, index): CommsMessageView | undefined => {
        const event = getStoryEvent(entry.eventId);

        if (event === undefined) {
          return undefined;
        }

        const selectedChoiceId = state.story.choices[event.id];
        const latestEventIndex = getLatestInboxIndex(event.id);

        return {
          entryId: `${index}.${entry.eventId}`,
          eventId: entry.eventId,
          channel: getCommsChannel(event.channel),
          choices: (event.choices ?? []).map((choice) => ({
            id: choice.id,
            label: t(choice.textKey),
            selected: selectedChoiceId === choice.id
          })),
          lines: getStoryLines(event.textKey),
          pendingChoice:
            event.choices !== undefined &&
            selectedChoiceId === undefined &&
            index === latestEventIndex,
          speaker: t(`story.speaker.${event.speaker}`),
          unread: isStoryInboxEntryUnread(state, entry, index)
        };
      })
      .filter((message): message is CommsMessageView => message !== undefined),
    quiet: state.settings.doNotDisturb || state.settings.reducedFx,
    unreadByChannel: {
      chat: getUnreadStoryCount(state, "chat"),
      mail: getUnreadStoryCount(state, "mail"),
      feed: getUnreadStoryCount(state, "feed")
    },
    unreadCount: getUnreadStoryCount(state)
  };
}

function markCommsAppRead(appId: AppId): void {
  const channel = getCommsAppChannel(appId);

  if (channel === undefined) {
    return;
  }

  if (markStoryInboxRead(state, channel)) {
    markCommsViewDirty();
  }
}

function showStoryToast(appId: AppId | undefined): void {
  const channel = appId === undefined ? undefined : getCommsAppChannel(appId);

  if (appId === undefined || channel === undefined) {
    return;
  }

  app.showToast(t(getStoryToastKey(channel)), "accent", {
    iconPath: getAppIconPath(appId),
    onClick: () => {
      openWindow(state.ui.windows, appId, getNotificationWindowBounds());
      markCommsAppRead(appId);
      state.ui.scene = "desktop";
      updateVisibleView();
      void persistNow();
    }
  });
}

function getStoryMessageAppId(eventId: string): CommsMessageView["channel"] | undefined {
  const event = getStoryEvent(eventId);
  return event === undefined ? undefined : getCommsChannel(event.channel);
}

function getCommsAppChannel(appId: AppId): CommsMessageView["channel"] | undefined {
  if (appId === "chat" || appId === "mail" || appId === "feed") {
    return appId;
  }

  return undefined;
}

function getStoryToastKey(channel: CommsMessageView["channel"]): string {
  switch (channel) {
    case "chat":
      return "ui.toast.newChat";
    case "mail":
      return "ui.toast.newMail";
    case "feed":
      return "ui.toast.newFeed";
  }
}

function getNotificationWindowBounds(): WindowBounds {
  return {
    height: Math.max(1, (window.innerHeight || 800) - 112),
    width: Math.max(1, window.innerWidth || 1280)
  };
}

function getCommsChannel(channel: StoryChannel): CommsMessageView["channel"] {
  if (channel === "chat" || channel === "mail") {
    return channel;
  }

  return "feed";
}

function getStoryLines(textKey: string): readonly string[] {
  const lines: string[] = [];

  for (let index = 1; hasMessage(`${textKey}.${index}`); index += 1) {
    lines.push(t(`${textKey}.${index}`));
  }

  return lines.length > 0 ? lines : [t(textKey)];
}

function getLatestInboxIndex(eventId: string): number {
  for (let index = state.story.inbox.length - 1; index >= 0; index -= 1) {
    if (state.story.inbox[index]?.eventId === eventId) {
      return index;
    }
  }

  return -1;
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
    state.res.money.gte(cost1) &&
    canFitCompute(state, generator.computeUse, 1, derived);
  const canBuy10 =
    unlocked &&
    state.res.money.gte(cost10) &&
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
      state.res.money.gte(cost1),
      canFitCompute(state, generator.computeUse, 1, derived)
    ),
    buy10Title: getGeneratorBuyTitle(
      unlocked,
      state.res.money.gte(cost10),
      canFitCompute(state, generator.computeUse, 10, derived)
    ),
    buyMaxTitle: maxAffordable > 0 ? t("ui.devfloor.buyMax") : t("ui.devfloor.cannotBuy"),
    locked: !unlocked
  };
}

function createComputeBreakdownView(derived: DerivedCache): DevFloorView["compute"] {
  return {
    cap: formatCompute(derived.compute.cap),
    remaining: formatCompute(Math.max(0, derived.compute.cap - derived.compute.used)),
    rows: GENERATORS.filter(
      (generator) => generator.era <= state.era && !isDemoLocked(state, generator)
    ).map((generator) => {
      const owned = state.owned.generators[generator.id] ?? 0;
      return {
        id: generator.id,
        name: t(generator.nameKey),
        used: formatCompute(owned * generator.computeUse)
      };
    }),
    used: formatCompute(derived.compute.used)
  };
}

function createHardwareViews(): readonly HardwareRowView[] {
  return getAvailableHardware(state).map((hardware) => {
    const owned = state.owned.hardware[hardware.id] ?? 0;
    const maxed = isHardwareMaxed(hardware, owned);
    const cost = maxed ? undefined : getHardwareCost(hardware, owned, state.prestige.iteration);
    const tierGate = getHardwareTierGateRequirement(state, hardware);
    const requiredHardware = tierGate === undefined ? undefined : getHardware(tierGate.hardwareId);

    return {
      id: hardware.id,
      active: owned > 0,
      canBuy: cost !== undefined && tierGate === undefined && state.res.money.gte(cost),
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
        name: project === undefined ? build.projectId : t(project.nameKey),
        progress: build.buildS <= 0 ? 1 : Math.min(1, build.elapsedS / build.buildS),
        remaining: formatTime(remainingS)
      };
    }),
    incomeRate: formatMoneyRate(getProjectIncomeRate(state, cache)),
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
        id: product.id,
        name: project === undefined ? product.projectId : t(project.nameKey),
        revenue: formatMoneyRate(getProductRevenue(product, cache)),
        status: t(product.bugged ? "ui.projects.statusBugged" : "ui.projects.statusOk")
      };
    }),
    refactor: {
      buildTime: formatTime(REFACTOR_PROJECT.buildS),
      canStart:
        canStartProject && state.res.loc.gte(getProjectCost(REFACTOR_PROJECT, cache, state)),
      cost: formatLoc(getProjectCost(REFACTOR_PROJECT, cache, state)),
      debt: formatBig(state.res.debt, state.settings.notation),
      effect: t("ui.projects.refactorEffect", {
        mult: formatMultiplier(cache.debt.refactorMultiplier)
      })
    }
  };
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
    state.res.loc.gte(phase.costLoc) &&
    state.res.money.gte(phase.costMoney);

  return {
    availableServers: t("ui.aurora.serverCount", { count: availableServers }),
    canDedicate:
      state.aurora.unlocked &&
      !state.aurora.completed &&
      state.aurora.dedicatedServers < AURORA_REQUIRED_DEDICATED_SERVERS &&
      readyServers > 0,
    canFund,
    canHost: state.aurora.unlocked && !state.aurora.completed,
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
  const payout = getProjectPayout(project, cache);
  const revenue = getProjectRevenue(project, cache);
  const canStartProject = !hasActiveProjectBuild(state);

  return {
    id: project.id,
    name: t(project.nameKey),
    buildTime: formatTime(getProjectBuildTime(project, cache)),
    canStart: canStartProject && state.res.loc.gte(cost),
    cost: formatLoc(cost),
    payout: formatMoney(payout),
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

  if (project.rpReward !== undefined) {
    return t("ui.projects.tagRp", { rp: project.rpReward });
  }

  return t("ui.projects.tagStandard");
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

function getGeneratorBuyTitle(unlocked: boolean, affordable: boolean, computeOk: boolean): string {
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
    upgrades: formatMultiplier(derived.multipliers.upgrades),
    achievements: formatMultiplier(derived.multipliers.achievements)
  });
}

function createMoneyRateTooltip(): string {
  const gross = getProjectIncomeRate(state, cache);
  const billing = createBillingBreakdown(state);
  return t("ui.tooltip.moneyRate", {
    auroraHosting: formatMoneyRate(billing.auroraHosting),
    auroraPower: formatMoneyRate(billing.auroraPower),
    gross: formatMoneyRate(gross),
    hype: formatMultiplier(state.res.hype),
    net: formatMoneyRate(getNetMoneyRate(gross, state)),
    power: formatMoneyRate(billing.hardwarePower),
    prestige: formatMultiplier(cache.multipliers.prestige),
    revenue: formatMultiplier(cache.project.revenueMultiplier),
    total: formatMoneyRate(getNetMoneyRate(gross, state))
  });
}

function createSparklinePath(samples: readonly Big[]): string {
  if (samples.length < 2) {
    return "";
  }

  const values = samples.map((sample) => (sample.eq0() ? 0 : sample.log10()));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const width = SPARKLINE_WIDTH - SPARKLINE_PADDING * 2;
  const height = SPARKLINE_HEIGHT - SPARKLINE_PADDING * 2;

  return values
    .map((value, index) => {
      const x = SPARKLINE_PADDING + (index / Math.max(1, values.length - 1)) * width;
      const y = SPARKLINE_PADDING + (1 - (value - min) / range) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function formatMultiplier(value: number): string {
  return `${value.toFixed(2)}x`;
}

function formatCount(statKey: string): string {
  return String(getNumericStat(statKey));
}

function formatLoc(value: Big): string {
  return t("ui.format.loc", { value: formatBig(value, state.settings.notation) });
}

function formatLinesOfCode(value: Big): string {
  return t("ui.format.linesOfCode", { value: formatBig(value, state.settings.notation) });
}

function formatMoney(value: Big): string {
  return t("ui.format.money", { value: formatBig(value, state.settings.notation) });
}

function formatMoneyRate(value: Big): string {
  return t("ui.format.perSecond", { value: formatMoney(value) });
}

function formatHardwarePowerRate(value: Big): string {
  const abs = value.abs();

  if (!abs.eq0() && abs.e < 0) {
    const precise = abs
      .toNumber()
      .toFixed(4)
      .replace(/\.?0+$/u, "");
    return t("ui.format.perSecond", {
      value: t("ui.format.money", { value: precise })
    });
  }

  return formatMoneyRate(value);
}

function formatPerSecond(value: Big): string {
  return t("ui.format.perSecond", { value: formatBig(value, state.settings.notation) });
}

function formatRp(value: number): string {
  return t("ui.format.rp", { value });
}

function formatInsight(value: Big): string {
  return t("ui.format.insight", { value: formatBig(value, state.settings.notation) });
}

function formatInsightAmount(value: number): string {
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return t("ui.format.insight", { value: formatted });
}

function formatEquity(value: number): string {
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return t("ui.format.equity", { value: formatted });
}

function formatParadox(value: number): string {
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return t("ui.format.paradox", { value: formatted });
}

function formatParadoxAmount(value: number): string {
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return t("ui.format.paradox", { value: formatted });
}

function formatStartGenerators(generators: Readonly<Record<string, number>>): string {
  const entries = Object.entries(generators).filter(([, count]) => count > 0);
  return entries.length === 0
    ? t("ui.rewrite.startGeneratorsNone")
    : entries
        .map(([id, count]) => {
          const generator = GENERATORS.find((entry) => entry.id === id);
          return `${count} ${generator === undefined ? id : t(generator.nameKey)}`;
        })
        .join(", ");
}

function formatCompute(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatHardwareLevel(level: number, maxLevel: number): string {
  return Number.isFinite(maxLevel)
    ? t("ui.hardware.levelFinite", { level, max: maxLevel })
    : t("ui.hardware.levelInfinite", { level });
}

function formatVibexAiProgress(ai: VibexAiSnapshot): string {
  if (ai.progress === undefined) {
    return "";
  }

  if (ai.progress.total <= 0) {
    return t("vibex.ai.progressUnknown");
  }

  return t("vibex.ai.progress", {
    percent: Math.floor((ai.progress.loaded / ai.progress.total) * 100)
  });
}

function formatVibexAiStatus(ai: VibexAiSnapshot): string {
  if (ai.status !== "error" || ai.errorMessage === undefined || ai.errorMessage.length === 0) {
    return t(`vibex.ai.status.${ai.status}`);
  }

  return t("vibex.ai.status.errorDetail", {
    message: truncateStatusMessage(ai.errorMessage)
  });
}

function truncateStatusMessage(message: string): string {
  const normalized = message.replace(/\s+/g, " ").trim();

  if (normalized.length <= 72) {
    return normalized;
  }

  return `${normalized.slice(0, 69)}...`;
}

function getNumericStat(key: string): number {
  const value = state.stats[key];
  return typeof value === "number" ? value : 0;
}

function getTotalGeneratorCount(): number {
  return Object.values(state.owned.generators).reduce((total, count) => total + count, 0);
}
