import type { EventBus } from "../core/bus";
import { Big } from "../core/bignum";
import type { NumberNotation } from "../core/format";
import { importGameState } from "../core/save";
import {
  createDefaultGameState,
  type GameState,
  type IncidentResponseId,
  type ProjectDeploymentMode,
  type RunStyleId,
  type SprintPriority
} from "../core/state";
import type { AppId, WindowFrame } from "../core/ui-state";
import type { ViewInvalidation } from "../core/view-invalidation";
import { REFACTOR_PROJECT } from "../data/projects";
import type { RunModifierId } from "../data/prestige";
import { t } from "../i18n/i18n";
import type { VibexAiClient, VibexAiSnapshot } from "../platform/ai";
import type { Platform } from "../platform/platform";
import {
  dedicateAuroraServer as dedicateAuroraServerToProject,
  fundAuroraPhase as fundAuroraPhaseStep,
  releaseAuroraHost as releaseAuroraHosting,
  rentAuroraHost as rentAuroraHosting
} from "../systems/aurora";
import { setAutomationEnabled } from "../systems/automation";
import { isBankrupt, repayBankOverdraft } from "../systems/bank";
import { buyHardware as purchaseHardware } from "../systems/compute";
import { fixBug as repairBug } from "../systems/debt";
import { buyNextEra, getCurrentEra } from "../systems/eras";
import {
  buyEquityPerk as purchaseEquityPerk,
  buyInsightNode as purchaseInsightNode,
  buyParadoxItem as purchaseParadoxItem,
  performExit,
  performIteration,
  performRewrite,
  selectRunModifier as chooseRunModifier
} from "../systems/prestige";
import { resolveProductionIncident } from "../systems/incidents";
import { performPromptClick } from "../systems/prompt";
import { startSprint } from "../systems/roadmap";
import {
  refreshProjectBoard,
  setProductDeploymentMode as changeProductDeploymentMode,
  startProject as startProjectBuild
} from "../systems/projects";
import { buyGenerator, type BuyQuantity, type DerivedCache } from "../systems/production";
import { buyResearch as purchaseResearch } from "../systems/research";
import { selectRunStyle as chooseRunStyle } from "../systems/run-styles";
import { chooseStoryOption } from "../systems/story";
import { buyUpgrade as purchaseUpgrade } from "../systems/upgrades";
import type { AudioController } from "../ui/audio";
import type {
  AppActions,
  AppShell,
  GeneratorBuyQuantity,
  VibexPromptSource,
  VibexSendView
} from "../ui/render";
import {
  closeWindow,
  fitOpenWindowsToBounds as fitPersistedOpenWindowsToBounds,
  focusWindow,
  minimizeWindow,
  moveWindow,
  openWindow,
  resetWindowLayout as resetPersistedWindowLayout,
  resizeWindow,
  toggleMaximizedWindow,
  type WindowBounds
} from "../ui/wm/window-manager";
import { exportCurrentGameState } from "./export-save";
import type { AppFormatters } from "./formatters";
import type { CommsController } from "./comms";
import type { PersistenceController } from "./persistence";
import type { VibexSession } from "./vibex-session";

export interface AppActionsRuntime {
  readonly app: () => AppShell;
  readonly audio: AudioController;
  readonly bus: EventBus;
  readonly cache: DerivedCache;
  readonly changeLanguage: (lang: string) => Promise<void>;
  readonly comms: CommsController;
  readonly completeTutorial: () => void;
  readonly dismissOffline: () => void;
  readonly formatters: Pick<AppFormatters, "formatLinesOfCode">;
  readonly flushActionInvalidation: () => void;
  readonly getState: () => GameState;
  readonly installState: (state: GameState) => void;
  readonly invalidation: ViewInvalidation;
  readonly moveTutorialStep: (offset: -1 | 1) => void;
  readonly persistence: PersistenceController;
  readonly persistNow: () => Promise<boolean>;
  readonly platform: Platform;
  readonly scheduleAutosave: () => void;
  readonly syncVibexSeeds: () => void;
  readonly updateVisibleView: () => void;
  readonly vibexAi: VibexAiClient;
  readonly vibexSession: VibexSession;
}

export function createAppActions(runtime: AppActionsRuntime): AppActions {
  const getCurrentEraModel = (): string => t(getCurrentEra(runtime.getState()).modelKey);
  let vibexResponseToken = 0;

  const beginGameplayAction = (): boolean => {
    const state = runtime.getState();
    const repaid = repayBankOverdraft(state, runtime.bus);
    if (repaid) {
      runtime.invalidation.markVisibleChanged(true);
      void runtime.persistNow();
    }

    if (!isBankrupt(state)) {
      return true;
    }

    runtime.invalidation.markVisibleChanged(true);
    runtime.flushActionInvalidation();
    return false;
  };

  const blockedPromptResult = (promptText = ""): VibexSendView => ({
    committed: false,
    loc: runtime.formatters.formatLinesOfCode(Big.zero()),
    prompt: promptText.trim(),
    response: t("ui.bankruptcy.blockedResponse")
  });

  const generateVibexAiResponse = async (
    prompt: string,
    eraModel: string,
    status: VibexAiSnapshot["status"]
  ): Promise<string | undefined> => {
    if (status !== "ready") {
      const loaded = await runtime.vibexAi.downloadModel();

      if (!loaded) {
        return undefined;
      }
    }

    return runtime.vibexAi.generate(prompt, eraModel);
  };

  return {
    changeGlitch(enabled: boolean): void {
      const state = runtime.getState();
      state.settings.glitch = enabled;
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    changeLang(lang: string): void {
      void runtime.changeLanguage(lang);
    },

    buyEra(): void {
      if (!beginGameplayAction()) {
        return;
      }

      const state = runtime.getState();
      const result = buyNextEra(state, runtime.bus);
      if (result.ok) {
        refreshProjectBoard(state);
        runtime.invalidation.markStructuralChanged();
        void runtime.persistNow();
      } else {
        runtime.invalidation.markVisibleChanged(false);
      }
      runtime.flushActionInvalidation();
    },

    buyEquityPerk(id: string): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = purchaseEquityPerk(runtime.getState(), runtime.cache, id, runtime.bus);
      runtime.invalidation.markVisibleChanged(result.ok);

      if (result.ok) {
        void runtime.persistNow();
      }
      runtime.flushActionInvalidation();
    },

    buyInsightNode(id: string): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = purchaseInsightNode(runtime.getState(), runtime.cache, id, runtime.bus);
      runtime.invalidation.markVisibleChanged(result.ok);

      if (result.ok) {
        void runtime.persistNow();
      }
      runtime.flushActionInvalidation();
    },

    buyParadoxItem(id: string): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = purchaseParadoxItem(runtime.getState(), runtime.cache, id, runtime.bus);
      runtime.invalidation.markVisibleChanged(result.ok);

      if (result.ok) {
        runtime.comms.markDirty();
        void runtime.persistNow();
      }
      runtime.flushActionInvalidation();
    },

    buyResearch(id: string): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = purchaseResearch(runtime.getState(), runtime.cache, id, runtime.bus);
      runtime.invalidation.markVisibleChanged(result.ok);
      runtime.flushActionInvalidation();
    },

    buyGenerator(id: string, quantity: GeneratorBuyQuantity): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = buyGenerator(
        runtime.getState(),
        runtime.cache,
        id,
        quantity as BuyQuantity,
        runtime.bus
      );
      runtime.invalidation.markVisibleChanged(result.ok);
      runtime.flushActionInvalidation();
    },

    buyHardware(id: string): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = purchaseHardware(runtime.getState(), id, runtime.bus);
      runtime.invalidation.markVisibleChanged(result.ok);
      runtime.flushActionInvalidation();
    },

    dedicateAuroraServer(): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = dedicateAuroraServerToProject(runtime.getState(), runtime.bus);
      runtime.invalidation.markVisibleChanged(result.ok);

      if (result.ok) {
        void runtime.persistNow();
      }
      runtime.flushActionInvalidation();
    },

    fundAuroraPhase(): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = fundAuroraPhaseStep(runtime.getState(), runtime.bus);
      runtime.invalidation.markVisibleChanged(result.ok);

      if (result.ok) {
        void runtime.persistNow();
      }
      runtime.flushActionInvalidation();
    },

    rentAuroraHost(): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = rentAuroraHosting(runtime.getState(), runtime.bus);
      runtime.invalidation.markVisibleChanged(result.ok);

      if (result.ok) {
        void runtime.persistNow();
      }
      runtime.flushActionInvalidation();
    },

    releaseAuroraHost(): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = releaseAuroraHosting(runtime.getState(), runtime.bus);
      runtime.invalidation.markVisibleChanged(result.ok);

      if (result.ok) {
        void runtime.persistNow();
      }
      runtime.flushActionInvalidation();
    },

    buyUpgrade(id: string): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = purchaseUpgrade(runtime.getState(), runtime.cache, id, runtime.bus);
      runtime.invalidation.markVisibleChanged(result.ok);
      runtime.flushActionInvalidation();
    },

    fixBug(productId: string): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = repairBug(runtime.getState(), productId, runtime.bus);
      runtime.invalidation.markVisibleChanged(result.ok);
      runtime.flushActionInvalidation();
    },

    changeAutosaveS(seconds: number): void {
      const state = runtime.getState();
      state.settings.autosaveS = Number.isFinite(seconds) ? Math.max(1, Math.trunc(seconds)) : 1;
      runtime.scheduleAutosave();
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    changeDoNotDisturb(enabled: boolean): void {
      const state = runtime.getState();
      state.settings.doNotDisturb = enabled;
      runtime.comms.markDirty();
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    changeNotation(notation: NumberNotation): void {
      const state = runtime.getState();
      state.settings.notation = notation;
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    changeReducedFx(enabled: boolean): void {
      const state = runtime.getState();
      state.settings.reducedFx = enabled;
      runtime.comms.markDirty();
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    changeSkipIntro(enabled: boolean): void {
      const state = runtime.getState();
      state.settings.skipIntro = enabled;
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    changeSound(enabled: boolean): void {
      const state = runtime.getState();
      state.settings.sound = enabled;
      runtime.audio.setSettings(state.settings);
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    changeVibexLocalAi(enabled: boolean): void {
      const state = runtime.getState();
      state.settings.vibexLocalAi = enabled;
      runtime.updateVisibleView();
      void runtime.persistNow();
      if (enabled) {
        void runtime.vibexAi.downloadModel().then(() => {
          runtime.updateVisibleView();
        });
      } else {
        runtime.vibexAi.dispose();
      }
    },

    changeVolume(volume: number): void {
      const state = runtime.getState();
      state.settings.volume = Math.min(1, Math.max(0, volume));
      runtime.audio.setSettings(state.settings);
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    closeApp(appId: AppId): void {
      closeWindow(runtime.getState().ui.windows, appId);
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    dismissOffline(): void {
      runtime.dismissOffline();
    },

    downloadVibexModel(): void {
      runtime.updateVisibleView();
      void runtime.vibexAi.downloadModel().then(() => {
        runtime.updateVisibleView();
      });
    },

    exportSave(): string {
      return exportCurrentGameState(runtime.getState(), Date.now());
    },

    focusApp(appId: AppId): void {
      focusWindow(runtime.getState().ui.windows, appId);
      runtime.updateVisibleView();
    },

    importSave(payload: string): boolean {
      const result = importGameState(payload, {
        edition: runtime.platform.edition,
        nowMs: Date.now()
      });

      if (!result.ok || result.reset) {
        runtime.audio.play("error");
        runtime.app().showToast(t("ui.toast.importFailed"), "danger");
        return false;
      }

      runtime.persistence.unblock();
      runtime.installState(result.state);
      invalidateVibexResponses();
      void runtime.persistNow();
      return true;
    },

    maximizeApp(appId: AppId, bounds: WindowBounds): void {
      toggleMaximizedWindow(runtime.getState().ui.windows, appId, bounds);
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    minimizeApp(appId: AppId): void {
      minimizeWindow(runtime.getState().ui.windows, appId);
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    moveApp(appId: AppId, frame: Pick<WindowFrame, "x" | "y">, bounds: WindowBounds): void {
      moveWindow(runtime.getState().ui.windows, appId, frame, bounds);
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    fitOpenWindowsToBounds(bounds: WindowBounds): void {
      const changed = fitPersistedOpenWindowsToBounds(runtime.getState().ui.windows, bounds);

      if (!changed) {
        return;
      }

      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    openApp(appId: AppId, bounds: WindowBounds): void {
      const state = runtime.getState();
      if (appId === "aurora" && !state.aurora.unlocked) {
        return;
      }

      openWindow(state.ui.windows, appId, bounds);
      runtime.comms.markAppRead(appId);
      state.ui.scene = "desktop";
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    playBootSound(): void {
      runtime.audio.play("boot");
    },

    playUiClick(): void {
      runtime.audio.play("click");
    },

    prompt(): { readonly loc: string } {
      if (!beginGameplayAction()) {
        return { loc: runtime.formatters.formatLinesOfCode(Big.zero()) };
      }

      const state = runtime.getState();
      const gained = performPromptClick(state, runtime.cache, state.meta.playtimeS, runtime.bus);
      runtime.audio.play("click");
      return { loc: runtime.formatters.formatLinesOfCode(gained) };
    },

    sendVibexPrompt(promptText: string, source: VibexPromptSource = "manual"): VibexSendView {
      if (!beginGameplayAction()) {
        return blockedPromptResult(promptText);
      }

      const state = runtime.getState();
      const gained = performPromptClick(state, runtime.cache, state.meta.playtimeS, runtime.bus);
      const codeFrame = runtime.vibexSession.advanceCode();
      runtime.syncVibexSeeds();
      runtime.audio.play("click");

      const trimmedPrompt = promptText.trim();
      const userTriggered = source === "manual";
      const eraModel = getCurrentEraModel();
      const aiSnapshot = runtime.vibexAi.snapshot();
      const loc = runtime.formatters.formatLinesOfCode(gained);
      let pendingGeneration: Promise<string | undefined> | undefined;
      let pendingResponse: Promise<string> | undefined;
      const responseToken = userTriggered ? ++vibexResponseToken : vibexResponseToken;
      let prompt = trimmedPrompt;
      let response = t("vibex.ai.typing");
      const manualFallbackResponse =
        trimmedPrompt.length > 0
          ? runtime.vibexSession.createManualFallbackResponse(trimmedPrompt, eraModel)
          : "";

      if (
        trimmedPrompt.length > 0 &&
        state.settings.vibexLocalAi &&
        aiSnapshot.status !== "unavailable" &&
        aiSnapshot.status !== "error"
      ) {
        pendingGeneration = generateVibexAiResponse(trimmedPrompt, eraModel, aiSnapshot.status);
      }

      if (pendingGeneration === undefined) {
        if (trimmedPrompt.length > 0) {
          response = manualFallbackResponse;
          if (userTriggered) {
            runtime.vibexSession.setAssistant(prompt, response);
          }
        } else {
          const canned = runtime.vibexSession.drawCannedResponse();
          runtime.syncVibexSeeds();
          prompt = canned.prompt;
          response = canned.response;
          if (userTriggered) {
            runtime.vibexSession.setAssistant(prompt, response);
          }
        }
      } else {
        if (userTriggered) {
          runtime.vibexSession.setAssistant(prompt, response);
        }
        pendingResponse = pendingGeneration
          .then((generatedResponse) => generatedResponse ?? manualFallbackResponse)
          .catch(() => manualFallbackResponse)
          .then((finalResponse) => {
            if (userTriggered && responseToken === vibexResponseToken) {
              runtime.vibexSession.setAssistant(prompt, finalResponse);
              runtime.updateVisibleView();
            }
            return finalResponse;
          });
      }

      runtime.updateVisibleView();

      return {
        committed: codeFrame.committed,
        loc,
        pendingResponse,
        prompt,
        response
      };
    },

    chooseStoryChoice(eventId: string, choiceId: string): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = chooseStoryOption(
        runtime.getState(),
        eventId,
        choiceId,
        runtime.cache,
        runtime.bus
      );
      runtime.invalidation.markVisibleChanged(result.ok);

      if (result.ok) {
        void runtime.persistNow();
      }
      runtime.flushActionInvalidation();
    },

    exit(): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = performExit(runtime.getState(), runtime.cache, runtime.bus);
      runtime.invalidation.markVisibleChanged(result.ok);

      if (result.ok) {
        void runtime.persistNow();
      }
      runtime.flushActionInvalidation();
    },

    iterate(): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = performIteration(runtime.getState(), runtime.cache, runtime.bus);
      runtime.invalidation.markVisibleChanged(result.ok);

      if (result.ok) {
        runtime.comms.markDirty();
        void runtime.persistNow();
      }
      runtime.flushActionInvalidation();
    },

    rewrite(): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = performRewrite(runtime.getState(), runtime.cache, runtime.bus);
      runtime.invalidation.markVisibleChanged(result.ok);

      if (result.ok) {
        void runtime.persistNow();
      }
      runtime.flushActionInvalidation();
    },

    resetWindowLayout(): void {
      resetPersistedWindowLayout(runtime.getState().ui.windows);
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    resolveIncident(id: string, response: IncidentResponseId): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = resolveProductionIncident(
        runtime.getState(),
        runtime.cache,
        id,
        response,
        runtime.bus
      );
      runtime.invalidation.markVisibleChanged(result.ok);

      if (result.ok) {
        void runtime.persistNow();
      }
      runtime.flushActionInvalidation();
    },

    replayTutorial(): void {
      const state = runtime.getState();
      state.ui.scene = "desktop";
      state.ui.tutorial = {
        active: true,
        completed: false,
        step: "welcome"
      };
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    resetSettings(): void {
      const state = runtime.getState();
      const defaults = createDefaultGameState(Date.now(), runtime.platform.edition).settings;
      state.settings = { ...defaults, lang: state.settings.lang };
      runtime.audio.setSettings(state.settings);
      runtime.comms.markDirty();
      runtime.scheduleAutosave();
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    resizeApp(appId: AppId, frame: WindowFrame, bounds: WindowBounds): void {
      resizeWindow(runtime.getState().ui.windows, appId, frame, bounds);
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    setProjectDeploymentMode(productId: string, mode: ProjectDeploymentMode): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = changeProductDeploymentMode(
        runtime.getState(),
        productId,
        mode,
        runtime.cache,
        runtime.bus
      );

      if (result.ok) {
        runtime.invalidation.markStructuralChanged();
        void runtime.persistNow();
      } else {
        runtime.invalidation.markVisibleChanged(false);
      }
      runtime.flushActionInvalidation();
    },

    startNewGame(): void {
      runtime.persistence.unblock();
      const fresh = createDefaultGameState(Date.now(), runtime.platform.edition);
      fresh.ui.scene = "desktop";
      fresh.ui.bootSeen = true;
      fresh.ui.tutorial.active = true;
      runtime.installState(fresh);
      invalidateVibexResponses();
      void runtime.persistNow();
    },

    startProject(id: string, deploymentMode: ProjectDeploymentMode = "selfHosted"): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = startProjectBuild(
        runtime.getState(),
        id,
        runtime.cache,
        deploymentMode,
        runtime.bus
      );
      if (result.ok) {
        runtime.invalidation.markStructuralChanged();
        void runtime.persistNow();
      } else {
        runtime.invalidation.markVisibleChanged(false);
      }
      runtime.flushActionInvalidation();
    },

    startDesktop(): void {
      const state = runtime.getState();
      state.ui.scene = "desktop";
      state.ui.bootSeen = true;
      if (!state.ui.tutorial.completed) {
        state.ui.tutorial.active = true;
      }
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    startRefactor(): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = startProjectBuild(
        runtime.getState(),
        REFACTOR_PROJECT.id,
        runtime.cache,
        runtime.bus
      );
      runtime.invalidation.markVisibleChanged(result.ok);
      runtime.flushActionInvalidation();
    },

    selectRunModifier(id: string | undefined): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = chooseRunModifier(runtime.getState(), id as RunModifierId | undefined);
      runtime.invalidation.markVisibleChanged(result.ok);

      if (result.ok) {
        void runtime.persistNow();
      }
      runtime.flushActionInvalidation();
    },

    selectRunStyle(id: RunStyleId): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = chooseRunStyle(runtime.getState(), id);
      runtime.invalidation.markVisibleChanged(result.ok);

      if (result.ok) {
        void runtime.persistNow();
      }
      runtime.flushActionInvalidation();
    },

    selectSprintPriority(id: SprintPriority): void {
      if (!beginGameplayAction()) {
        return;
      }

      const result = startSprint(runtime.getState(), id, runtime.bus);
      runtime.invalidation.markVisibleChanged(result.ok);

      if (result.ok) {
        void runtime.persistNow();
      }
      runtime.flushActionInvalidation();
    },

    toggleAutomation(id: string, enabled: boolean): void {
      if (!beginGameplayAction()) {
        return;
      }

      setAutomationEnabled(runtime.getState(), id, enabled);
      runtime.invalidation.markVisibleChanged(true);
      void runtime.persistNow();
      runtime.flushActionInvalidation();
    },

    tutorialBack(): void {
      runtime.moveTutorialStep(-1);
    },

    tutorialNext(): void {
      const state = runtime.getState();
      if (state.ui.tutorial.step === "done") {
        runtime.completeTutorial();
      } else {
        runtime.moveTutorialStep(1);
      }
    },

    tutorialSkip(): void {
      runtime.completeTutorial();
    },

    quitToTitle(): void {
      const state = runtime.getState();
      state.ui.scene = "boot";
      state.ui.bootSeen = true;
      state.ui.tutorial.active = false;
      runtime.updateVisibleView();
      void runtime.persistNow();
    },

    wipeSave(): void {
      runtime.persistence.unblock();
      runtime.installState(createDefaultGameState(Date.now(), runtime.platform.edition));
      invalidateVibexResponses();
      void runtime.persistNow();
    }
  };

  function invalidateVibexResponses(): void {
    vibexResponseToken += 1;
  }
}
