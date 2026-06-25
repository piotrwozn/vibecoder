import { t } from "../i18n/i18n";
import {
  APP_IDS,
  type AppId,
  type SceneId,
  type WindowFrame,
  type WindowState
} from "../core/ui-state";
import { el, setText, text } from "./dom";
import {
  createAgentsScreen,
  resetAgentsRenderCache,
  syncAutomationToggles,
  syncGeneratorRows,
  updateComputeBreakdown,
  updateFullGame
} from "./render/agents";
import { createAppIcon, getShortcutApp, screenLinks } from "./render/app-icons";
import { createAuroraScreen, resetAuroraRenderCache, updateAurora } from "./render/aurora";
import { createCommsPanels, updateComms, type CommsNodes } from "./render/comms";
import { createEndlessScreen, resetEndlessRenderCache, updateEndless } from "./render/endless";
import {
  createHardwareScreen,
  createUpgradesScreen,
  resetHardwareUpgradeRenderCache,
  syncHardwareRows,
  syncUpgradeRows,
  updateHardwareAuroraCounter
} from "./render/hardware-upgrades";
import { createProjectsScreen, resetProjectsRenderCache, updateProjects } from "./render/projects";
import { createRoadmapScreen, resetRoadmapRenderCache, updateRoadmap } from "./render/roadmap";
import { createResearchScreen, resetResearchRenderCache, updateResearch } from "./render/research";
import { createRewriteScreen, resetRewriteRenderCache, updateRewrite } from "./render/rewrite";
import {
  createAchievementsScreen,
  createStatsScreen,
  resetStatsAchievementRenderCaches,
  updateAchievements,
  updateStats
} from "./render/stats-achievements";
import { createSettingsScreen, resetSettingsRenderCache, updateSettings } from "./render/settings";
import { createToasts } from "./render/toasts";
import { clampWindow, isWindowVisible, type WindowBounds } from "./wm/window-manager";
import type {
  AppActions,
  AppShell,
  AppearanceView,
  CommsChannel,
  DevFloorView,
  EndingModalView,
  GameOverView,
  LazyTooltip,
  ModelView,
  OfflineView,
  ResourceView,
  SettingsNotation,
  SettingsView,
  ToastOptions,
  ToastTone,
  TutorialView,
  VibexCodeLineView,
  VibexView
} from "./render/view-types";

export { getAppIconPath } from "./render/app-icons";
export { getMissingAutomationToggleIds } from "./render/agents";
export { isCommsStructureChanged, shouldSkipCommsUpdate } from "./render/comms";
export { updateProjectSummaryIncome } from "./render/projects";
export { updateEditableSettingValue } from "./render/settings";
export type {
  ActiveBuildView,
  AchievementCardView,
  AchievementsView,
  AppActions,
  AppShell,
  AppearanceView,
  AuroraNodeView,
  AuroraView,
  AutomationToggleView,
  CommsChoiceView,
  CommsMessageView,
  CommsView,
  ComputeBreakdownView,
  ComputeRowView,
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
  GeneratorBuyQuantity,
  GeneratorRowView,
  HardwareRowView,
  InsightNodeView,
  IterationPreviewView,
  LazyTooltip,
  ModelView,
  OfflineView,
  ParadoxItemView,
  ParadoxView,
  ProductView,
  ProjectOfferView,
  ProjectsView,
  PromptClickView,
  RoadmapActivityView,
  RoadmapIncidentResponseView,
  RoadmapIncidentView,
  RoadmapPriorityView,
  RoadmapRunStyleView,
  RoadmapView,
  RefactorView,
  ResearchNodeView,
  ResearchView,
  ResourceView,
  RewritePreviewView,
  RewriteView,
  RunModifierView,
  SaveDiagnosticsView,
  SettingsView,
  ShellUiView,
  StatsRowView,
  StatsView,
  ToastOptions,
  ToastTone,
  TutorialView,
  UpgradeRowView,
  VibexFileView,
  VibexPromptSource,
  VibexSendView,
  VibexView
} from "./render/view-types";

interface ResourceCounterNodes {
  readonly root: HTMLElement;
  tooltip: LazyTooltip;
  readonly value: Text;
}

interface ResourceCounterSet {
  readonly bank: ResourceCounterNodes;
  readonly compute: ResourceCounterNodes;
  readonly hype: ResourceCounterNodes;
  readonly loc: ResourceCounterNodes;
  readonly locRate: ResourceCounterNodes;
  readonly money: ResourceCounterNodes;
  readonly moneyRate: ResourceCounterNodes;
  readonly rp: ResourceCounterNodes;
}

interface ModelNodes {
  readonly button: HTMLButtonElement;
  readonly cost: Text;
  readonly status: Text;
  readonly value: Text;
}

interface BootNodes {
  readonly continueLabel: Text;
  currentLang: string;
  hasSave: boolean;
  newGameConfirming: boolean;
  readonly credits: HTMLElement;
  readonly destroy: () => void;
  readonly langButton: HTMLButtonElement;
  readonly langLabel: Text;
  readonly root: HTMLElement;
  readonly settings: HTMLElement;
  readonly settingsNodes: BootSettingsNodes;
  readonly startLabel: Text;
}

interface BootSettingsNodes {
  readonly destroy: () => void;
  readonly langValue: Text;
  readonly root: HTMLElement;
}

type BootSettingsTab = "audio" | "gameplay" | "video";
type BootVisualTheme = "crt" | "violet" | "amber";

interface DesktopNodes {
  currentScene: SceneId;
  readonly destroy: () => void;
  readonly iconNodes: Record<AppId, DesktopIconNodes>;
  readonly root: HTMLElement;
  readonly taskbarNodes: TaskbarNodes;
  readonly tutorialNodes: TutorialNodes;
  readonly windowNodes: Record<AppId, WindowNodes>;
  readonly windowsLayer: HTMLElement;
  currentWindows: Record<AppId, WindowState>;
}

interface WindowBoundsCache {
  readonly bounds: WindowBounds;
  readonly layer: HTMLElement;
}

interface DesktopIconNodes {
  readonly badge: HTMLElement;
  readonly button: HTMLButtonElement;
  readonly label: string;
}

interface TaskbarNodes {
  activeAppId?: AppId;
  readonly items: Record<AppId, TaskbarItemNodes>;
  readonly root: HTMLElement;
}

interface TaskbarItemNodes {
  readonly button: HTMLButtonElement;
  readonly label: string;
}

interface WindowNodes {
  readonly content: HTMLElement;
  hideTimer: number | undefined;
  lastFrame: WindowFrame | undefined;
  lastZ: number | undefined;
  readonly root: HTMLElement;
  readonly title: Text;
  wasVisible: boolean;
}

interface TutorialNodes {
  readonly back: HTMLButtonElement;
  readonly body: Text;
  readonly finish: HTMLButtonElement;
  readonly next: HTMLButtonElement;
  readonly progress: Text;
  readonly root: HTMLElement;
  readonly skip: HTMLButtonElement;
  readonly title: Text;
}

interface OfflineNodes {
  readonly duration: Text;
  readonly hype: Text;
  readonly loc: Text;
  readonly money: Text;
  readonly root: HTMLElement;
}

interface EndingModalNodes {
  readonly root: HTMLElement;
  signature: string;
}

interface GameOverNodes {
  readonly root: HTMLElement;
  signature: string;
}

interface TerminalViewNodes {
  readonly addLog: (message: string, options?: TerminalLogOptions) => Text;
  readonly cannedPrompt: Text;
  readonly cannedResponse: Text;
  readonly flowBar: HTMLElement;
  readonly flowText: Text;
  readonly input: HTMLTextAreaElement;
  readonly logRoot: HTMLElement;
  readonly prompt: HTMLButtonElement;
  responseToken: number;
  readonly root: HTMLElement;
  readonly showParticle: (value: string) => void;
}

interface VibexNodes {
  readonly cannedPrompt: Text;
  readonly cannedResponse: Text;
  readonly codeRows: HTMLElement[];
  readonly codeStream: HTMLElement;
  readonly codeTexts: Text[];
  readonly fileRows: Map<string, HTMLElement>;
  readonly fileTexts: Map<string, Text>;
  lastCodeSequence: number;
  readonly root: HTMLElement;
  readonly terminal: TerminalViewNodes;
}

interface TerminalLogRow {
  readonly root: HTMLElement;
  readonly text: Text;
}

interface TerminalLogOptions {
  readonly priority?: boolean;
}

interface TerminalParticle {
  readonly root: HTMLElement;
  readonly text: Text;
}

const TERMINAL_LOG_CAPACITY = 200;
const TERMINAL_LOG_RATE_LIMIT = 10;
const CLICK_PARTICLE_POOL_SIZE = 10;

const BOOT_ZOOM_MS = 1800;
const BOOT_FADE_MS = 180;

const endingClasses = [
  "app-shell--ending-fork",
  "app-shell--ending-merge",
  "app-shell--ending-unplug"
] as const;
const terminalThemeClasses = [
  "terminal--theme-crt",
  "terminal--theme-glitch",
  "terminal--theme-void"
] as const;

let modelNodes: ModelNodes | undefined;
let offlineNodes: OfflineNodes | undefined;
let cachedWindowBounds: WindowBoundsCache | undefined;

export function mountApp(root: HTMLElement, view: DevFloorView, actions: AppActions): AppShell {
  resetRenderCaches();

  const shell = el("div", { className: "app-shell" });
  const counters = createResourceCounters(view.resources);
  const screens = createScreens(view, actions);
  const offline = createOfflineModal(view.offline, actions);
  const terminal = createTerminal(view.vibex, actions);
  const vibex = createVibexWorkspace(view.vibex, terminal);
  const vibexModel = createModelPanel(view.model, actions);
  const comms = createCommsPanels(view.comms, actions);
  const desktop = createDesktop(view, counters, screens, vibex, vibexModel, comms, actions);
  const boot = createBootScene(view, actions);
  const ending = createEndingModal(view.ending, actions);
  const gameOver = createGameOverModal(view.gameOver, actions);
  const toasts = createToasts();
  shell.append(boot.root, desktop.root, toasts.root, offline, ending.root, gameOver.root);
  const keydownHandler = (event: KeyboardEvent): void => {
    handleShortcut(event, desktop, vibex.terminal, actions);
  };
  window.addEventListener("keydown", keydownHandler);

  root.replaceChildren(shell);
  invalidateWindowBoundsCache();
  updateAppearance(shell, vibex.terminal.root, view.appearance);

  return {
    destroy(): void {
      window.removeEventListener("keydown", keydownHandler);
      desktop.destroy();
      boot.destroy();
    },

    updateDevFloor(nextView: DevFloorView): void {
      updateAppearance(shell, vibex.terminal.root, nextView.appearance);
      updateBootScene(boot, nextView);
      updateResourceCounters(counters, nextView.resources);
      updateDesktop(desktop, nextView);

      if (isAppVisible(nextView.ui.windows, "vibex")) {
        setText(vibex.terminal.flowText, nextView.flowMeter);
        vibex.terminal.flowBar.style.transform = `scaleX(${nextView.flowProgress.toFixed(3)})`;
        vibex.terminal.root.classList.toggle("terminal--flow", nextView.flowActive);
        updateModel(nextView.model);
        updateVibex(vibex, nextView.vibex);
      }

      if (isAppVisible(nextView.ui.windows, "agents")) {
        syncGeneratorRows(nextView.generators, screens.agents, actions);
        updateComputeBreakdown(nextView.compute);
        syncAutomationToggles(nextView.automation, screens.agents, actions);
      }

      if (isAppVisible(nextView.ui.windows, "hardware")) {
        syncHardwareRows(nextView.hardware, screens.hardware, actions);
        updateHardwareAuroraCounter(nextView.aurora);
      }

      if (isAppVisible(nextView.ui.windows, "upgrades")) {
        syncUpgradeRows(nextView.upgrades, screens.upgrades, actions);
      }

      if (isAppVisible(nextView.ui.windows, "projects")) {
        updateProjects(nextView.projects, screens, actions);
      }

      if (isAppVisible(nextView.ui.windows, "roadmap")) {
        updateRoadmap(screens.roadmap, nextView.roadmap, actions);
      }

      if (isAppVisible(nextView.ui.windows, "endless")) {
        updateEndless(screens.endless, nextView.endless, actions);
      }

      if (isAppVisible(nextView.ui.windows, "aurora")) {
        updateAurora(nextView.aurora);
      }

      if (isAppVisible(nextView.ui.windows, "research")) {
        updateResearch(nextView.research);
      }

      if (isAppVisible(nextView.ui.windows, "rewrite")) {
        updateRewrite(nextView.rewrite);
      }

      if (isAppVisible(nextView.ui.windows, "stats")) {
        updateStats(nextView.stats);
      }

      if (isAppVisible(nextView.ui.windows, "achievements")) {
        updateAchievements(nextView.achievements, screens);
      }

      if (isAppVisible(nextView.ui.windows, "settings")) {
        updateSettings(nextView.settings);
      }

      updateFullGame(nextView.fullGame);
      updateVisibleCommsApps(comms, nextView, actions);
      updateOffline(nextView.offline);
      updateEndingModal(ending, nextView.ending, actions);
      updateGameOverModal(gameOver, nextView.gameOver, actions);
    },

    updateFrameAlpha(alpha: number): void {
      void alpha;
    },

    addTerminalLog(message: string): void {
      vibex.terminal.addLog(message);
    },

    showToast(message: string, tone: ToastTone = "accent", options?: ToastOptions): void {
      toasts.show(message, tone, options);
    }
  };
}

function resetRenderCaches(): void {
  resetAgentsRenderCache();
  resetAuroraRenderCache();
  resetHardwareUpgradeRenderCache();
  resetProjectsRenderCache();
  resetRoadmapRenderCache();
  resetEndlessRenderCache();
  resetResearchRenderCache();
  resetRewriteRenderCache();
  resetStatsAchievementRenderCaches();
  modelNodes = undefined;
  resetSettingsRenderCache();
  offlineNodes = undefined;
}

function createBootScene(view: DevFloorView, actions: AppActions): BootNodes {
  const root = el("section", { className: "boot-scene" });
  const room = el("div", { className: "boot-scene__room" });
  const mugSteam = createBootMugSteam();
  const monitor = el("div", { className: "boot-scene__monitor" });
  const screen = el("div", { className: "boot-scene__screen" });
  const stickyNotes = createBootStickyNotes();
  const title = el("h1", { className: "boot-scene__title" });
  title.append(text(t("app.title")));
  const terminalLine = el("p", { className: "boot-scene__terminal-line" });
  terminalLine.append(text(t("ui.boot.terminalLine")));
  const statusLine = el("p", { className: "boot-scene__status-line" });
  statusLine.append(text(t("ui.boot.statusLine")));

  const startLabel = text("");
  const start = el("button", {
    className: "boot-scene__button boot-scene__button--primary",
    title: t("ui.boot.start")
  });
  start.type = "button";
  start.append(startLabel);
  const continueButton = el("button", {
    className: "boot-scene__button boot-scene__button--secondary boot-scene__button--continue",
    title: t("ui.boot.continue")
  });
  continueButton.type = "button";
  const continueLabel = text("");
  continueButton.append(continueLabel);

  const bootSettings = createBootSettings(view.settings, actions);
  const settings = createBootPanel("ui.boot.settingsTitle", bootSettings.root);
  settings.classList.add("boot-panel--settings");
  const credits = createBootPanel("ui.boot.creditsTitle", createBootCredits());
  const settingsButton = createBootToggle("ui.boot.settings", settings);
  settingsButton.classList.add("boot-scene__button--secondary", "boot-scene__button--settings");
  settingsButton.addEventListener("click", () => {
    root.classList.toggle("boot-scene--settings-open", !settings.hidden);
    if (!settings.hidden) {
      credits.hidden = true;
    }
  });
  settings.querySelectorAll<HTMLElement>("[data-boot-settings-close]").forEach((button) => {
    button.addEventListener("click", () => {
      settings.hidden = true;
      root.classList.remove("boot-scene--settings-open");
    });
  });
  const langLabel = text(t("ui.boot.languageValue", { lang: view.settings.lang.toUpperCase() }));
  const langButton = el("button", {
    className: "boot-scene__button boot-scene__button--link boot-scene__button--language",
    title: t("ui.boot.language")
  });
  langButton.type = "button";
  langButton.append(langLabel);
  langButton.addEventListener("click", () => {
    actions.changeLang(nodes.currentLang === "en" ? "pl" : "en");
  });
  const creditsButton = createBootToggle("ui.boot.credits", credits);
  creditsButton.classList.add("boot-scene__button--link", "boot-scene__button--credits");
  const buttons = el("div", { className: "boot-scene__actions" });
  buttons.append(start, continueButton, settingsButton, langButton, creditsButton);
  screen.append(stickyNotes, title, terminalLine, statusLine, buttons, settings, credits);
  monitor.append(screen);
  room.append(mugSteam, monitor);
  root.append(room);
  root.addEventListener(
    "click",
    (event) => {
      if (shouldPlayBootMenuClick(event)) {
        actions.playUiClick();
      }
    },
    { capture: true }
  );

  let transitionTimer: number | undefined;
  const finish = (): void => {
    if (transitionTimer !== undefined) {
      window.clearTimeout(transitionTimer);
      transitionTimer = undefined;
    }

    root.classList.remove("boot-scene--entering", "boot-scene--fade");
    actions.startDesktop();
  };

  const beginBootTransition = (event: Event): void => {
    event.stopPropagation();
    nodes.newGameConfirming = false;
    if (transitionTimer !== undefined) {
      return;
    }

    actions.playBootSound();
    const reduced = root.classList.contains("boot-scene--reduced-motion") || prefersReducedMotion();
    root.classList.add(reduced ? "boot-scene--fade" : "boot-scene--entering");
    transitionTimer = window.setTimeout(finish, reduced ? BOOT_FADE_MS : BOOT_ZOOM_MS);
  };
  const handleSecondaryBootAction = (event: Event): void => {
    event.stopPropagation();

    if (!nodes.hasSave) {
      beginBootTransition(event);
      return;
    }

    if (!nodes.newGameConfirming) {
      nodes.newGameConfirming = true;
      setText(nodes.continueLabel, t("ui.boot.confirmNewGame"));
      continueButton.title = t("ui.boot.confirmNewGame");
      return;
    }

    nodes.newGameConfirming = false;
    actions.startNewGame();
  };
  start.addEventListener("click", beginBootTransition);
  continueButton.addEventListener("click", handleSecondaryBootAction);
  root.addEventListener("click", () => {
    if (transitionTimer !== undefined) {
      finish();
    }
  });
  const escapeHandler = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && transitionTimer !== undefined) {
      event.preventDefault();
      finish();
    }
  };
  window.addEventListener("keydown", escapeHandler);

  const nodes: BootNodes = {
    continueLabel,
    credits,
    currentLang: view.settings.lang,
    destroy: () => {
      window.removeEventListener("keydown", escapeHandler);
      bootSettings.destroy();
      if (transitionTimer !== undefined) {
        window.clearTimeout(transitionTimer);
        transitionTimer = undefined;
      }
    },
    langButton,
    langLabel,
    hasSave: view.ui.hasSave,
    newGameConfirming: false,
    root,
    settings,
    settingsNodes: bootSettings,
    startLabel
  };
  updateBootScene(nodes, view);
  return nodes;
}

function shouldPlayBootMenuClick(event: Event): boolean {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const control = target.closest<HTMLElement>("button, input, select, textarea, [role='button']");

  if (control === null || control.closest(".boot-scene") === null) {
    return false;
  }

  if ("disabled" in control && typeof control.disabled === "boolean") {
    return !control.disabled;
  }

  return true;
}

function createBootMugSteam(): HTMLElement {
  const steam = el("span", { className: "boot-mug-steam" });
  steam.setAttribute("aria-hidden", "true");
  steam.append(
    el("span", { className: "boot-mug-steam__trail boot-mug-steam__trail--a" }),
    el("span", { className: "boot-mug-steam__trail boot-mug-steam__trail--b" }),
    el("span", { className: "boot-mug-steam__trail boot-mug-steam__trail--c" })
  );
  return steam;
}

function createBootStickyNotes(): HTMLElement {
  const notes = el("div", { className: "boot-sticky-notes" });
  notes.setAttribute("aria-hidden", "true");
  notes.append(
    el("span", { className: "boot-sticky-note boot-sticky-note--yellow" }),
    el("span", { className: "boot-sticky-note boot-sticky-note--pink" }),
    el("span", { className: "boot-sticky-note boot-sticky-note--blue" })
  );
  return notes;
}

function updateBootScene(nodes: BootNodes, view: DevFloorView): void {
  nodes.root.hidden = view.ui.scene !== "boot";
  if (nodes.root.hidden) {
    return;
  }

  nodes.currentLang = view.settings.lang;
  const saveModeChanged = nodes.hasSave !== view.ui.hasSave;
  nodes.hasSave = view.ui.hasSave;
  if (saveModeChanged) {
    nodes.newGameConfirming = false;
  }
  setText(nodes.startLabel, t(view.ui.hasSave ? "ui.boot.continue" : "ui.boot.start"));
  setText(
    nodes.continueLabel,
    t(
      view.ui.hasSave
        ? nodes.newGameConfirming
          ? "ui.boot.confirmNewGame"
          : "ui.boot.startNewGame"
        : "ui.boot.continue"
    )
  );
  setText(nodes.langLabel, t("ui.boot.languageValue", { lang: view.settings.lang.toUpperCase() }));
  nodes.langButton.title = t("ui.boot.language");
  nodes.root
    .querySelector<HTMLButtonElement>(".boot-scene__button--primary")
    ?.setAttribute("title", t(view.ui.hasSave ? "ui.boot.continue" : "ui.boot.start"));
  nodes.root
    .querySelector<HTMLButtonElement>(".boot-scene__button--continue")
    ?.setAttribute(
      "title",
      t(
        view.ui.hasSave
          ? nodes.newGameConfirming
            ? "ui.boot.confirmNewGame"
            : "ui.boot.startNewGame"
          : "ui.boot.continue"
      )
    );
  setText(nodes.settingsNodes.langValue, view.settings.lang.toUpperCase());
  const bootLangLabel = nodes.settingsNodes.root.querySelector<HTMLElement>(
    "[data-boot-lang-label='1']"
  );
  const bootLangRow = nodes.settingsNodes.root.querySelector<HTMLElement>(
    "[data-boot-setting='language']"
  );
  if (bootLangLabel !== null) {
    bootLangLabel.textContent = t("ui.settings.language");
  }
  if (bootLangRow !== null) {
    bootLangRow.title = t("ui.settings.language");
  }
  syncBootSettings(nodes.settingsNodes.root, view.settings);
  nodes.root.classList.toggle("boot-scene--reduced-motion", view.appearance.reducedFx);
}

function createBootToggle(labelKey: string, panel: HTMLElement): HTMLButtonElement {
  const button = el("button", {
    className: "boot-scene__button",
    title: t(labelKey)
  });
  button.type = "button";
  button.append(text(t(labelKey)));
  button.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
  });
  return button;
}

function createBootPanel(titleKey: string, content: HTMLElement): HTMLElement {
  const panel = el("section", { className: "boot-panel" });
  panel.hidden = true;
  const title = el("h2", { className: "boot-panel__title" });
  title.append(text(t(titleKey)));
  panel.append(title, content);
  return panel;
}

function createBootSettings(view: SettingsView, actions: AppActions): BootSettingsNodes {
  const root = el("div", { className: "boot-settings" });
  const teardowns: Array<() => void> = [];
  root.dataset.theme = "crt";
  const subtitle = el("p", { className: "boot-settings__subtitle" });
  subtitle.append(text(t("ui.boot.settings.subtitle")));
  const badge = el("span", { className: "boot-settings__badge" });
  const badgeLabel = text("");
  badge.append(badgeLabel);
  const back = createBootSettingsAction("ui.boot.settings.back");
  back.dataset.bootSettingsClose = "1";

  const tabRail = el("div", { className: "boot-settings__tab-rail" });
  const panels = {
    audio: createBootSettingsAudioPanel(view, actions),
    gameplay: createBootSettingsGameplayPanel(view, actions),
    video: createBootSettingsVideoPanel(view, actions, root, teardowns)
  } satisfies Record<BootSettingsTab, HTMLElement>;
  const footer = el("div", { className: "boot-settings__footer" });
  const reset = createBootSettingsAction("ui.boot.settings.reset");
  reset.classList.add("boot-settings__action--danger");
  reset.addEventListener("click", () => {
    actions.resetSettings();
    resetBootVisualSettings(root);
  });
  const footerStatus = el("span", { className: "boot-settings__footer-status" });
  const footerStatusLabel = text("");
  footerStatus.append(footerStatusLabel);
  const apply = createBootSettingsAction("ui.boot.settings.apply");
  apply.classList.add("boot-settings__action--apply");
  apply.dataset.bootSettingsClose = "1";
  footer.append(reset, footerStatus, apply);

  const tabButtons = {
    audio: createBootSettingsTab("ui.boot.settings.tab.audio"),
    gameplay: createBootSettingsTab("ui.boot.settings.tab.gameplay"),
    video: createBootSettingsTab("ui.boot.settings.tab.video")
  } satisfies Record<BootSettingsTab, HTMLButtonElement>;

  const setTab = (tab: BootSettingsTab): void => {
    root.dataset.tab = tab;
    setText(
      badgeLabel,
      t("ui.boot.settings.tabBadge", {
        tab: t(`ui.boot.settings.tab.${tab}`).toUpperCase()
      })
    );
    setText(footerStatusLabel, t(`ui.boot.settings.footer.${tab}`));

    for (const candidate of Object.keys(panels) as BootSettingsTab[]) {
      panels[candidate].hidden = candidate !== tab;
      tabButtons[candidate].classList.toggle("boot-settings__tab--active", candidate === tab);
      tabButtons[candidate].setAttribute("aria-selected", String(candidate === tab));
    }
  };

  for (const tab of Object.keys(tabButtons) as BootSettingsTab[]) {
    tabButtons[tab].addEventListener("click", () => {
      setTab(tab);
    });
  }

  tabRail.append(tabButtons.video, tabButtons.audio, tabButtons.gameplay);
  root.append(back, subtitle, badge, tabRail, panels.video, panels.audio, panels.gameplay, footer);
  setTab("video");

  const langValue =
    panels.gameplay.querySelector<HTMLElement>("[data-boot-lang-value]")?.firstChild;

  return {
    destroy: () => {
      for (const teardown of teardowns) {
        teardown();
      }
    },
    langValue:
      langValue === null || langValue === undefined
        ? text(view.lang.toUpperCase())
        : (langValue as Text),
    root
  };
}

function createBootSettingsVideoPanel(
  view: SettingsView,
  actions: AppActions,
  settingsRoot: HTMLElement,
  teardowns: Array<() => void>
): HTMLElement {
  const panel = createBootSettingsPanel("video", "ui.boot.settings.panel.video");
  const appearance = createBootSettingsPanel("appearance", "ui.boot.settings.panel.appearance");
  const fullscreen = el("div", { className: "boot-settings__fullscreen-row" });
  const fullscreenLabel = el("span", { className: "boot-settings__row-label" });
  fullscreenLabel.append(text(t("ui.boot.settings.fullscreen")));
  const fullscreenOff = createBootSettingsAction("ui.boot.settings.off");
  const fullscreenOn = createBootSettingsAction("ui.boot.settings.on");
  const displayMode = createBootInfoRow(
    "ui.boot.settings.displayMode",
    t("ui.boot.settings.windowed")
  );
  displayMode.dataset.bootSetting = "displayMode";
  const displayOutput = displayMode.querySelector<HTMLElement>(".boot-settings__row-value");
  const setFullscreenUi = (enabled: boolean): void => {
    fullscreenOff.classList.toggle("boot-settings__pill--active", !enabled);
    fullscreenOn.classList.toggle("boot-settings__pill--active", enabled);
    displayMode.setAttribute("aria-pressed", String(enabled));
    if (displayOutput !== null) {
      displayOutput.textContent = t(
        enabled ? "ui.boot.settings.displayFullscreen" : "ui.boot.settings.windowed"
      );
    }
  };
  const applyFullscreen = (enabled: boolean): void => {
    setFullscreenUi(enabled);
    void (enabled ? enterBrowserFullscreen() : exitBrowserFullscreen()).catch(() => {
      setFullscreenUi(isBrowserFullscreen());
    });
  };
  const fullscreenChangeHandler = (): void => {
    setFullscreenUi(isBrowserFullscreen());
  };
  document.addEventListener("fullscreenchange", fullscreenChangeHandler);
  teardowns.push(() => {
    document.removeEventListener("fullscreenchange", fullscreenChangeHandler);
  });
  fullscreenOff.classList.add("boot-settings__pill--active");
  fullscreenOff.addEventListener("click", () => {
    applyFullscreen(false);
  });
  fullscreenOn.addEventListener("click", () => {
    applyFullscreen(true);
  });
  displayMode.addEventListener("click", () => {
    applyFullscreen(displayMode.getAttribute("aria-pressed") !== "true");
  });
  fullscreen.append(fullscreenLabel, fullscreenOff, fullscreenOn);
  setFullscreenUi(isBrowserFullscreen());
  panel.append(fullscreen, displayMode, createBootUiScaleRow(settingsRoot));
  appearance.append(
    createBootThemeChoices(settingsRoot),
    createBootToggleRow("ui.boot.settings.crtFilter", view.glitch, actions.changeGlitch, "glitch"),
    createBootToggleRow(
      "ui.boot.settings.reducedMotion",
      view.reducedFx,
      actions.changeReducedFx,
      "reducedFx"
    )
  );

  const root = el("div", { className: "boot-settings__panels" });
  root.dataset.tabPanel = "video";
  root.append(panel, appearance);
  return root;
}

function createBootSettingsAudioPanel(view: SettingsView, actions: AppActions): HTMLElement {
  const mix = createBootSettingsPanel("audio-mix", "ui.boot.settings.panel.audioMix");
  const notifications = createBootSettingsPanel(
    "notifications",
    "ui.boot.settings.panel.notifications"
  );
  mix.append(
    createBootToggleRow("ui.settings.sound", view.sound, actions.changeSound, "sound"),
    createBootRangeControlRow("ui.settings.volume", view.volume, actions.changeVolume, "volume"),
    createBootCycleRow("ui.boot.settings.outputBus", [
      t("ui.boot.settings.outputBusValue"),
      t("ui.boot.settings.outputBusHeadphones"),
      t("ui.boot.settings.outputBusMonitor")
    ])
  );
  notifications.append(
    createBootToggleRow(
      "ui.settings.doNotDisturb",
      view.doNotDisturb,
      actions.changeDoNotDisturb,
      "doNotDisturb"
    ),
    createBootToggleRow("ui.boot.settings.uiBleeps", view.sound, actions.changeSound, "sound"),
    createBootToggleRow(
      "ui.boot.settings.messagePulse",
      !view.doNotDisturb,
      (enabled) => {
        actions.changeDoNotDisturb(!enabled);
      },
      "messagePulse"
    )
  );

  const root = el("div", { className: "boot-settings__panels" });
  root.dataset.tabPanel = "audio";
  root.append(mix, notifications);
  return root;
}

function createBootSettingsGameplayPanel(view: SettingsView, actions: AppActions): HTMLElement {
  const run = createBootSettingsPanel("run", "ui.boot.settings.panel.run");
  const flow = createBootSettingsPanel("flow", "ui.boot.settings.panel.flow");
  let notation = view.notation;
  const langValue = text(view.lang.toUpperCase());
  const langRow = createBootInfoRow("ui.settings.language", "");
  langRow.dataset.bootSetting = "language";
  langRow
    .querySelector<HTMLElement>(".boot-settings__row-label")
    ?.setAttribute("data-boot-lang-label", "1");
  const langOutput = langRow.querySelector<HTMLElement>(".boot-settings__row-value");
  langOutput?.replaceChildren(langValue);
  langOutput?.setAttribute("data-boot-lang-value", "1");
  langRow.addEventListener("click", () => {
    actions.changeLang(langValue.data.toLowerCase() === "en" ? "pl" : "en");
  });
  const notationRow = createBootInfoRow("ui.settings.notation", getNotationLabel(notation));
  notationRow.dataset.bootSetting = "notation";
  notationRow.dataset.notation = notation;
  const notationOutput = notationRow.querySelector<HTMLElement>(".boot-settings__row-value");
  notationRow.addEventListener("click", () => {
    notation = notationRow.dataset.notation === "sci" ? "suffix" : "sci";
    notationRow.dataset.notation = notation;
    if (notationOutput !== null) {
      notationOutput.textContent = getNotationLabel(notation);
    }
    actions.changeNotation(notation);
  });
  run.append(langRow, notationRow, createBootAutosaveRow(view.autosaveS, actions.changeAutosaveS));
  flow.append(
    createBootToggleRow(
      "ui.settings.skipIntro",
      view.skipIntro,
      actions.changeSkipIntro,
      "skipIntro"
    ),
    createBootToggleRow("ui.settings.glitch", view.glitch, actions.changeGlitch, "glitch"),
    createBootToggleRow(
      "ui.settings.reducedFx",
      view.reducedFx,
      actions.changeReducedFx,
      "reducedFx"
    ),
    createBootToggleRow(
      "ui.settings.vibexLocalAi",
      view.vibexLocalAi,
      actions.changeVibexLocalAi,
      "vibexLocalAi"
    )
  );

  const root = el("div", { className: "boot-settings__panels" });
  root.dataset.tabPanel = "gameplay";
  root.append(run, flow);
  return root;
}

function createBootSettingsPanel(modifier: string, titleKey: string): HTMLElement {
  const panel = el("section", {
    className: `boot-settings__panel boot-settings__panel--${modifier}`
  });
  const title = el("h3", { className: "boot-settings__panel-title" });
  title.append(text(t(titleKey)));
  panel.append(title);
  return panel;
}

function createBootSettingsAction(labelKey: string): HTMLButtonElement {
  const button = el("button", { className: "boot-settings__action", title: t(labelKey) });
  button.type = "button";
  button.append(text(t(labelKey)));
  return button;
}

function createBootSettingsTab(labelKey: string): HTMLButtonElement {
  const button = el("button", { className: "boot-settings__tab", title: t(labelKey) });
  button.type = "button";
  button.setAttribute("role", "tab");
  button.append(text(t(labelKey)));
  return button;
}

function createBootInfoRow(labelKey: string, value: string): HTMLButtonElement {
  const row = el("button", {
    className: "boot-settings__row boot-settings__row--info",
    title: t(labelKey)
  });
  row.type = "button";
  const label = el("span", { className: "boot-settings__row-label" });
  label.append(text(t(labelKey)));
  const output = el("span", { className: "boot-settings__row-value" });
  output.append(text(value));
  row.append(label, output);
  return row;
}

function createBootToggleRow(
  labelKey: string,
  checked: boolean,
  onChange: (enabled: boolean) => void,
  syncKey?: string
): HTMLButtonElement {
  const row = createBootInfoRow(labelKey, "");
  row.classList.remove("boot-settings__row--info");
  if (syncKey !== undefined) {
    row.dataset.bootToggle = syncKey;
  }
  const value = row.querySelector<HTMLElement>(".boot-settings__row-value");
  const track = el("span", { className: "boot-settings__toggle-track" });
  const knob = el("span", { className: "boot-settings__toggle-knob" });
  track.setAttribute("aria-hidden", "true");
  knob.setAttribute("aria-hidden", "true");
  track.append(knob);

  row.append(track);
  row.addEventListener("click", () => {
    const enabled = row.getAttribute("aria-pressed") !== "true";
    setBootToggleRow(row, enabled, value);
    onChange(enabled);
  });
  setBootToggleRow(row, checked, value);
  return row;
}

function setBootToggleRow(
  row: HTMLElement,
  enabled: boolean,
  value = row.querySelector<HTMLElement>(".boot-settings__row-value")
): void {
  row.classList.toggle("boot-settings__row--on", enabled);
  row.setAttribute("aria-pressed", String(enabled));
  if (value !== null) {
    value.textContent = t(enabled ? "ui.boot.settings.on" : "ui.boot.settings.off");
  }
}

function createBootCycleRow(labelKey: string, values: readonly string[]): HTMLButtonElement {
  const row = createBootInfoRow(labelKey, values[0] ?? "");
  row.dataset.bootCycleIndex = "0";
  row.addEventListener("click", () => {
    const current = Number(row.dataset.bootCycleIndex ?? "0");
    const next = values.length === 0 ? 0 : (current + 1) % values.length;
    row.dataset.bootCycleIndex = String(next);
    const output = row.querySelector<HTMLElement>(".boot-settings__row-value");
    if (output !== null) {
      output.textContent = values[next] ?? "";
    }
  });
  return row;
}

function createBootRangeControlRow(
  labelKey: string,
  value: string,
  onChange: (value: number) => void,
  syncKey?: string
): HTMLElement {
  const row = el("label", { className: "boot-settings__row boot-settings__row--range" });
  const label = el("span", { className: "boot-settings__row-label" });
  label.append(text(t(labelKey)));
  const input = el("input", { className: "boot-settings__range" });
  input.type = "range";
  input.min = "0";
  input.max = "1";
  input.step = "0.01";
  input.value = value;
  if (syncKey !== undefined) {
    input.dataset.bootRange = syncKey;
  }
  const output = el("span", { className: "boot-settings__row-value" });
  input.addEventListener("input", () => {
    const nextValue = Number(input.value);
    if (Number.isFinite(nextValue)) {
      setBootRangeValue(input, output, input.value);
      onChange(nextValue);
    }
  });
  setBootRangeValue(input, output, value);
  row.append(label, input, output);
  return row;
}

function setBootRangeValue(input: HTMLInputElement, output: HTMLElement, value: string): void {
  input.value = value;
  const percentage = Math.round(Number(input.value) * 100);
  output.textContent = String(percentage);
  input.style.setProperty("--range-value", `${percentage}%`);
}

function createBootUiScaleRow(settingsRoot: HTMLElement): HTMLElement {
  const row = el("label", { className: "boot-settings__row boot-settings__row--range" });
  const label = el("span", { className: "boot-settings__row-label" });
  label.append(text(t("ui.boot.settings.uiScale")));
  const input = el("input", { className: "boot-settings__range" });
  input.type = "range";
  input.min = "0.9";
  input.max = "1.1";
  input.step = "0.05";
  input.value = "1";
  input.dataset.bootUiScale = "1";
  const output = el("span", { className: "boot-settings__row-value" });
  const sync = (): void => {
    const scale = Number(input.value);
    const nextScale = Number.isFinite(scale) ? scale : 1;
    const percentage = Math.round(nextScale * 100);
    settingsRoot.style.setProperty("--boot-settings-scale", String(nextScale));
    input.style.setProperty("--range-value", `${Math.round((nextScale - 0.9) * 500)}%`);
    output.textContent = t("ui.boot.settings.uiScaleValue", { value: String(percentage) });
  };
  input.addEventListener("input", sync);
  sync();
  row.append(label, input, output);
  return row;
}

function createBootThemeChoices(settingsRoot: HTMLElement): HTMLElement {
  const choices = el("div", { className: "boot-settings__themes" });
  for (const theme of ["crt", "violet", "amber"] as readonly BootVisualTheme[]) {
    const item = el("button", {
      className: `boot-settings__theme boot-settings__theme--${theme}`,
      title: t(`ui.boot.settings.theme.${theme}`)
    });
    item.type = "button";
    item.dataset.bootTheme = theme;
    item.classList.toggle("boot-settings__theme--active", theme === "crt");
    item.addEventListener("click", () => {
      setBootVisualTheme(settingsRoot, theme);
    });
    const swatch = el("span", { className: "boot-settings__theme-swatch" });
    swatch.setAttribute("aria-hidden", "true");
    const label = el("span", { className: "boot-settings__theme-label" });
    label.append(text(t(`ui.boot.settings.theme.${theme}`)));
    item.append(swatch, label);
    choices.append(item);
  }
  setBootVisualTheme(settingsRoot, "crt");
  return choices;
}

function createBootAutosaveRow(value: string, onChange: (seconds: number) => void): HTMLElement {
  const row = el("label", { className: "boot-settings__row boot-settings__row--number" });
  const label = el("span", { className: "boot-settings__row-label" });
  label.append(text(t("ui.settings.autosave")));
  const input = el("input", { className: "boot-settings__number" });
  input.type = "number";
  input.min = "1";
  input.step = "1";
  input.value = value;
  input.dataset.bootNumber = "autosaveS";
  const output = el("span", { className: "boot-settings__row-value" });
  let lastValidValue = value;
  const syncOutput = (): void => {
    output.textContent = t("ui.boot.settings.seconds", { seconds: input.value });
  };
  const commit = (repairInvalid: boolean): void => {
    const seconds = Number(input.value);
    if (Number.isFinite(seconds) && seconds > 0) {
      input.value = String(Math.round(seconds));
      lastValidValue = input.value;
      syncOutput();
      onChange(Number(input.value));
      return;
    }

    if (repairInvalid) {
      input.value = lastValidValue;
      syncOutput();
    }
  };
  input.addEventListener("input", () => {
    commit(false);
  });
  input.addEventListener("change", () => {
    commit(true);
  });
  syncOutput();
  row.append(label, input, output);
  return row;
}

function setBootVisualTheme(settingsRoot: HTMLElement, theme: BootVisualTheme): void {
  settingsRoot.dataset.theme = theme;
  settingsRoot
    .querySelectorAll<HTMLElement>("[data-boot-theme]")
    .forEach((item) =>
      item.classList.toggle("boot-settings__theme--active", item.dataset.bootTheme === theme)
    );
}

function resetBootVisualSettings(settingsRoot: HTMLElement): void {
  setBootVisualTheme(settingsRoot, "crt");
  settingsRoot.style.setProperty("--boot-settings-scale", "1");
  const scaleInput = settingsRoot.querySelector<HTMLInputElement>("[data-boot-ui-scale]");
  if (scaleInput !== null) {
    scaleInput.value = "1";
    scaleInput.dispatchEvent(new window.Event("input"));
  }
}

function syncBootSettings(root: HTMLElement, view: SettingsView): void {
  syncBootToggleRows(root, "doNotDisturb", view.doNotDisturb);
  syncBootToggleRows(root, "glitch", view.glitch);
  syncBootToggleRows(root, "messagePulse", !view.doNotDisturb);
  syncBootToggleRows(root, "reducedFx", view.reducedFx);
  syncBootToggleRows(root, "skipIntro", view.skipIntro);
  syncBootToggleRows(root, "sound", view.sound);
  syncBootToggleRows(root, "vibexLocalAi", view.vibexLocalAi);
  syncBootRangeRows(root, "volume", view.volume);
  syncBootNumberRows(root, "autosaveS", view.autosaveS);
  syncBootNotationRow(root, view.notation);
}

function syncBootToggleRows(root: HTMLElement, key: string, enabled: boolean): void {
  root.querySelectorAll<HTMLElement>(`[data-boot-toggle="${key}"]`).forEach((row) => {
    setBootToggleRow(row, enabled);
  });
}

function syncBootRangeRows(root: HTMLElement, key: string, value: string): void {
  root.querySelectorAll<HTMLInputElement>(`[data-boot-range="${key}"]`).forEach((input) => {
    const output = input
      .closest(".boot-settings__row")
      ?.querySelector<HTMLElement>(".boot-settings__row-value");
    if (output !== null && output !== undefined && document.activeElement !== input) {
      setBootRangeValue(input, output, value);
    }
  });
}

function syncBootNumberRows(root: HTMLElement, key: string, value: string): void {
  root.querySelectorAll<HTMLInputElement>(`[data-boot-number="${key}"]`).forEach((input) => {
    if (document.activeElement === input) {
      return;
    }

    input.value = value;
    const output = input
      .closest(".boot-settings__row")
      ?.querySelector<HTMLElement>(".boot-settings__row-value");
    if (output !== null && output !== undefined) {
      output.textContent = t("ui.boot.settings.seconds", { seconds: value });
    }
  });
}

function syncBootNotationRow(root: HTMLElement, notation: SettingsNotation): void {
  root.querySelectorAll<HTMLButtonElement>('[data-boot-setting="notation"]').forEach((row) => {
    row.dataset.notation = notation;
    const output = row.querySelector<HTMLElement>(".boot-settings__row-value");
    if (output !== null) {
      output.textContent = getNotationLabel(notation);
    }
  });
}

function isBrowserFullscreen(): boolean {
  return document.fullscreenElement !== null && document.fullscreenElement !== undefined;
}

function getNotationLabel(notation: SettingsNotation): string {
  return t(notation === "sci" ? "ui.settings.notationSci" : "ui.settings.notationSuffix");
}

async function enterBrowserFullscreen(): Promise<void> {
  if (!isBrowserFullscreen() && document.documentElement.requestFullscreen !== undefined) {
    await document.documentElement.requestFullscreen();
  }
}

async function exitBrowserFullscreen(): Promise<void> {
  if (isBrowserFullscreen() && document.exitFullscreen !== undefined) {
    await document.exitFullscreen();
  }
}

function createBootCredits(): HTMLElement {
  const credits = el("p", { className: "boot-panel__copy" });
  credits.append(text(t("ui.boot.creditsCopy")));
  return credits;
}

function createDesktop(
  view: DevFloorView,
  counters: ResourceCounterSet,
  screens: ScreenNodes,
  vibex: VibexNodes,
  vibexModel: HTMLElement,
  comms: Record<CommsChannel, CommsNodes>,
  actions: AppActions
): DesktopNodes {
  const root = el("section", { className: "desktop" });
  const wallpaper = el("div", { className: "desktop__wallpaper" });
  const icons = createDesktopIcons(actions);
  const windowsLayer = el("section", { className: "desktop__windows" });
  const destroyBoundsInvalidation = connectWindowBoundsInvalidation(windowsLayer, actions);
  const notes = createStickyNotes(counters);
  const taskbar = createTaskbar(actions);
  const tutorial = createTutorialOverlay(view.tutorial, actions);
  const desktop: DesktopNodes = {
    currentScene: view.ui.scene,
    currentWindows: view.ui.windows,
    destroy: destroyBoundsInvalidation,
    iconNodes: icons.nodes,
    root,
    taskbarNodes: taskbar,
    tutorialNodes: tutorial,
    windowNodes: {} as Record<AppId, WindowNodes>,
    windowsLayer
  };

  for (const appId of APP_IDS) {
    const content = getWindowContent(appId, screens, vibex, vibexModel, comms);
    const windowNodes = createWindow(appId, content, view, desktop, actions);
    desktop.windowNodes[appId] = windowNodes;
    windowsLayer.append(windowNodes.root);
  }

  root.append(wallpaper, icons.root, windowsLayer, notes, taskbar.root, tutorial.root);
  updateDesktop(desktop, view);
  return desktop;
}

function createDesktopIcons(actions: AppActions): {
  readonly nodes: Record<AppId, DesktopIconNodes>;
  readonly root: HTMLElement;
} {
  const root = el("nav", {
    ariaLabel: t("ui.desktop.ariaLabel"),
    className: "desktop-icons"
  });
  const nodes = {} as Record<AppId, DesktopIconNodes>;

  for (const link of screenLinks) {
    const label = t(link.key);
    const button = el("button", {
      ariaLabel: label,
      className: "desktop-icon",
      title:
        link.shortcut === undefined
          ? label
          : t("ui.desktop.iconTitle", { key: link.shortcut, label })
    });
    button.dataset.appId = link.appId;
    const iconLabel = el("span", { className: "desktop-icon__label" });
    const badge = el("span", { className: "desktop-icon__badge" });
    button.type = "button";
    badge.hidden = true;
    iconLabel.append(text(label));
    button.append(createAppIcon(link), iconLabel, badge);
    button.addEventListener("click", () => {
      actions.openApp(link.appId, getViewportWindowBounds());
    });
    root.append(button);
    nodes[link.appId] = { badge, button, label };
  }

  return { nodes, root };
}

function createTaskbar(actions: AppActions): TaskbarNodes {
  const root = el("nav", {
    ariaLabel: t("ui.taskbar.ariaLabel"),
    className: "taskbar"
  });
  const items = {} as Record<AppId, TaskbarItemNodes>;

  for (const link of screenLinks) {
    const label = t(link.key);
    const button = el("button", {
      ariaLabel: label,
      className: "taskbar-item",
      title: label
    });
    button.type = "button";
    button.dataset.appId = link.appId;
    button.hidden = true;
    const labelNode = el("span", { className: "taskbar-item__label" });
    labelNode.append(text(label));
    button.append(createAppIcon(link), labelNode);
    button.addEventListener("click", () => {
      actions.openApp(link.appId, getViewportWindowBounds());
    });
    root.append(button);
    items[link.appId] = { button, label };
  }

  return { items, root };
}

function createTutorialOverlay(view: TutorialView, actions: AppActions): TutorialNodes {
  const root = el("section", {
    ariaLabel: t("ui.tutorial.ariaLabel"),
    className: "tutorial-overlay"
  });
  const card = el("article", { className: "tutorial-card" });
  const progress = text("");
  const progressNode = el("span", { className: "tutorial-card__progress" });
  progressNode.append(progress);
  const title = text("");
  const titleNode = el("h2", { className: "tutorial-card__title" });
  titleNode.append(title);
  const body = text("");
  const bodyNode = el("p", { className: "tutorial-card__body" });
  bodyNode.append(body);
  const actionsRow = el("div", { className: "tutorial-card__actions" });
  const back = createTutorialButton("ui.tutorial.back", actions.tutorialBack);
  const skip = createTutorialButton("ui.tutorial.skip", actions.tutorialSkip);
  const next = createTutorialButton("ui.tutorial.next", actions.tutorialNext);
  const finish = createTutorialButton("ui.tutorial.finish", actions.tutorialNext);
  next.classList.add("tutorial-card__button--primary");
  finish.classList.add("tutorial-card__button--primary");
  actionsRow.append(back, skip, next, finish);
  card.append(progressNode, titleNode, bodyNode, actionsRow);
  root.append(card);

  const nodes = { back, body, finish, next, progress, root, skip, title };
  updateTutorialOverlay(nodes, view);
  return nodes;
}

function createTutorialButton(labelKey: string, onClick: () => void): HTMLButtonElement {
  const button = el("button", {
    className: "tutorial-card__button",
    title: t(labelKey)
  });
  button.type = "button";
  button.append(text(t(labelKey)));
  button.addEventListener("click", onClick);
  return button;
}

function updateTutorialOverlay(nodes: TutorialNodes, view: TutorialView): void {
  nodes.root.hidden = !view.active;

  if (!view.active) {
    delete nodes.root.dataset.step;
    return;
  }

  nodes.root.dataset.step = view.step;
  setText(
    nodes.progress,
    t("ui.tutorial.progress", { current: view.index + 1, total: view.total })
  );
  setText(nodes.title, t(`ui.tutorial.${view.step}.title`));
  setText(nodes.body, t(`ui.tutorial.${view.step}.body`));
  nodes.back.disabled = view.index === 0;
  nodes.next.hidden = view.step === "done";
  nodes.skip.hidden = view.step === "done";
  nodes.finish.hidden = view.step !== "done";
  setTextContent(nodes.back, t("ui.tutorial.back"));
  setTextContent(nodes.next, t("ui.tutorial.next"));
  setTextContent(nodes.skip, t("ui.tutorial.skip"));
  setTextContent(nodes.finish, t("ui.tutorial.finish"));
}

function createStickyNotes(counters: ResourceCounterSet): HTMLElement {
  const notes = el("aside", {
    ariaLabel: t("ui.notes.ariaLabel"),
    className: "sticky-notes"
  });
  notes.append(
    createStickyNote("sticky-note--money", [
      createResourceCounter("ui.resource.money", counters.money),
      createResourceCounter("ui.resource.bank", counters.bank),
      createResourceCounter("ui.notes.moneyRate", counters.moneyRate)
    ]),
    createStickyNote("sticky-note--loc", [
      createResourceCounter("ui.resource.loc", counters.loc),
      createResourceCounter("ui.resource.locRate", counters.locRate),
      createNoteFootnote("ui.notes.locDefinition")
    ]),
    createStickyNote("sticky-note--system", [
      createResourceCounter("ui.resource.rp", counters.rp),
      createResourceCounter("ui.resource.compute", counters.compute),
      createResourceCounter("ui.resource.hype", counters.hype)
    ])
  );
  return notes;
}

function createStickyNote(className: string, children: readonly HTMLElement[]): HTMLElement {
  const note = el("section", { className: `sticky-note ${className}` });
  note.append(...children);
  return note;
}

function createNoteFootnote(labelKey: string): HTMLElement {
  const footnote = el("span", { className: "sticky-note__footnote" });
  footnote.append(text(t(labelKey)));
  return footnote;
}

function getWindowContent(
  appId: AppId,
  screens: ScreenNodes,
  vibex: VibexNodes,
  vibexModel: HTMLElement,
  comms: Record<CommsChannel, CommsNodes>
): HTMLElement {
  switch (appId) {
    case "vibex": {
      const content = el("section", { className: "vibex-window" });
      content.append(vibexModel, vibex.root);
      return content;
    }
    case "agents":
      return screens.agents;
    case "hardware":
      return screens.hardware;
    case "upgrades":
      return screens.upgrades;
    case "projects":
      return screens.projects;
    case "roadmap":
      return screens.roadmap;
    case "endless":
      return screens.endless;
    case "aurora":
      return screens.aurora;
    case "research":
      return screens.research;
    case "rewrite":
      return screens.rewrite;
    case "stats":
      return screens.stats;
    case "achievements":
      return screens.achievements;
    case "chat":
      return comms.chat.root;
    case "mail":
      return comms.mail.root;
    case "feed":
      return comms.feed.root;
    case "settings":
      return screens.settings;
  }
}

function createWindow(
  appId: AppId,
  content: HTMLElement,
  view: DevFloorView,
  desktop: DesktopNodes,
  actions: AppActions
): WindowNodes {
  const root = el("section", { className: "desktop-window" });
  root.dataset.appId = appId;
  const titlebar = el("header", { className: "desktop-window__titlebar" });
  const titleWrap = el("div", { className: "desktop-window__title" });
  const link = screenLinks.find((entry) => entry.appId === appId);
  if (link !== undefined) {
    titleWrap.append(createAppIcon(link));
  }
  const title = text(getWindowTitle(appId, view));
  titleWrap.append(title);
  const controls = el("div", { className: "desktop-window__controls" });
  controls.append(
    createWindowControl("ui.window.minimize", "ui.window.minimizeGlyph", () => {
      actions.minimizeApp(appId);
    }),
    createWindowControl("ui.window.maximize", "ui.window.maximizeGlyph", () => {
      actions.maximizeApp(appId, getDesktopBounds(desktop.windowsLayer));
    }),
    createWindowControl("ui.window.close", "ui.window.closeGlyph", () => {
      actions.closeApp(appId);
    })
  );
  titlebar.append(titleWrap, controls);
  titlebar.addEventListener("pointerdown", (event) => {
    beginWindowDrag(event, appId, root, desktop, actions);
  });

  const body = el("section", { className: "desktop-window__body" });
  body.append(content);
  root.addEventListener("pointerdown", (event) => {
    if (
      isInteractiveWindowTarget(event.target) ||
      getInteractiveWindowTargetAtPoint(body, event.clientX, event.clientY) !== undefined
    ) {
      return;
    }

    actions.focusApp(appId);
  });
  root.addEventListener("click", (event) => {
    if (isInteractiveWindowTarget(event.target)) {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target !== root && target !== body && !content.contains(target)) {
      return;
    }

    const control = getInteractiveWindowTargetAtPoint(body, event.clientX, event.clientY);
    if (control === undefined) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    activateWindowControl(control);
  });
  const resize = el("span", {
    ariaLabel: t("ui.window.resize"),
    className: "desktop-window__resize",
    title: t("ui.window.resize")
  });
  resize.addEventListener("pointerdown", (event) => {
    beginWindowResize(event, appId, root, desktop, actions);
  });

  root.append(titlebar, body, resize);
  return {
    content: body,
    hideTimer: undefined,
    lastFrame: undefined,
    lastZ: undefined,
    root,
    title,
    wasVisible: false
  };
}

function createWindowControl(
  titleKey: string,
  glyphKey: string,
  onClick: () => void
): HTMLButtonElement {
  const button = el("button", {
    ariaLabel: t(titleKey),
    className: "desktop-window__control",
    title: t(titleKey)
  });
  button.type = "button";
  button.append(text(t(glyphKey)));
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  return button;
}

function updateDesktop(nodes: DesktopNodes, view: DevFloorView): void {
  nodes.currentScene = view.ui.scene;
  nodes.root.hidden = view.ui.scene !== "desktop";
  nodes.currentWindows = view.ui.windows;
  if (view.tutorial.active) {
    nodes.root.dataset.tutorialStep = view.tutorial.step;
  } else {
    delete nodes.root.dataset.tutorialStep;
  }
  updateTutorialOverlay(nodes.tutorialNodes, view.tutorial);
  updateDesktopWindows(nodes, view);
  updateDesktopIcons(nodes, view);
  updateTaskbar(nodes, view);
}

function updateVisibleCommsApps(
  nodes: Record<CommsChannel, CommsNodes>,
  view: DevFloorView,
  actions: AppActions
): void {
  for (const channel of ["chat", "mail", "feed"] as const) {
    if (isAppVisible(view.ui.windows, channel)) {
      updateComms(nodes[channel], view.comms, actions);
    }
  }
}

function updateDesktopWindows(nodes: DesktopNodes, view: DevFloorView): void {
  const bounds = getDesktopBounds(nodes.windowsLayer);
  const activeZ = getTopVisibleZ(view.ui.windows);

  for (const appId of APP_IDS) {
    const windowState = view.ui.windows[appId];
    const node = nodes.windowNodes[appId];
    const visible = isWindowVisible(windowState) && isAppAvailable(view, appId);
    const minimizing = node.wasVisible && windowState.open && windowState.minimized && !visible;
    const becameVisible = visible && !node.wasVisible;
    setText(node.title, getWindowTitle(appId, view));
    updateWindowVisibility(node, visible, minimizing, view.appearance.reducedFx);
    if (becameVisible) {
      node.content.scrollTop = 0;
      node.content.scrollLeft = 0;
    }
    node.root.classList.toggle("desktop-window--maximized", windowState.maximized);
    node.root.classList.toggle("desktop-window--active", visible && windowState.z === activeZ);

    if (visible && !isWindowPointerActive(node.root)) {
      applyWindowFrame(node, getRenderedWindowFrame(windowState, bounds), windowState.z);
    }

    node.wasVisible = visible;
  }
}

function updateWindowVisibility(
  node: WindowNodes,
  visible: boolean,
  minimizing: boolean,
  reducedFx: boolean
): void {
  if (visible) {
    if (node.hideTimer !== undefined) {
      window.clearTimeout(node.hideTimer);
      node.hideTimer = undefined;
    }
    node.root.hidden = false;
    node.root.classList.remove("desktop-window--minimizing");
    return;
  }

  if (minimizing && !reducedFx) {
    if (node.hideTimer !== undefined) {
      window.clearTimeout(node.hideTimer);
    }
    node.root.hidden = false;
    node.root.classList.add("desktop-window--minimizing");
    node.hideTimer = window.setTimeout(() => {
      if (node.root.classList.contains("desktop-window--minimizing")) {
        node.root.hidden = true;
        node.root.classList.remove("desktop-window--minimizing");
      }
      node.hideTimer = undefined;
    }, 170);
    return;
  }

  if (node.hideTimer !== undefined) {
    window.clearTimeout(node.hideTimer);
    node.hideTimer = undefined;
  }
  node.root.hidden = true;
  node.root.classList.remove("desktop-window--minimizing");
}

function updateDesktopIcons(nodes: DesktopNodes, view: DevFloorView): void {
  for (const appId of APP_IDS) {
    const icon = nodes.iconNodes[appId];
    const available = isAppAvailable(view, appId);
    const channel = getCommsChannelForApp(appId);
    const unread = channel === undefined ? 0 : view.comms.unreadByChannel[channel];

    icon.button.hidden = !available;
    icon.badge.hidden = unread === 0;
    setTextContent(icon.badge, unread === 0 ? "" : String(unread));
    icon.button.classList.toggle(
      "desktop-icon--pulse",
      unread > 0 && !view.settings.doNotDisturb && !view.appearance.reducedFx
    );
    icon.button.classList.toggle(
      "desktop-icon--glitch",
      view.appearance.glitch && !view.appearance.reducedFx
    );
    icon.button.setAttribute(
      "aria-label",
      unread === 0 ? icon.label : t("ui.desktop.unreadBadge", { count: unread, label: icon.label })
    );
  }
}

function updateTaskbar(nodes: DesktopNodes, view: DevFloorView): void {
  const activeZ = getTopVisibleZ(view.ui.windows);
  let activeAppId: AppId | undefined;

  for (const appId of APP_IDS) {
    const item = nodes.taskbarNodes.items[appId];
    const windowState = view.ui.windows[appId];
    const available = isAppAvailable(view, appId);
    const open = windowState.open;
    const visible = isWindowVisible(windowState) && available;
    const active = visible && windowState.z === activeZ;

    item.button.hidden = !open || !available;
    item.button.classList.toggle("taskbar-item--active", active);
    item.button.classList.toggle("taskbar-item--minimized", open && windowState.minimized);
    item.button.classList.toggle(
      "taskbar-item--glitch",
      open && view.appearance.glitch && !view.appearance.reducedFx
    );
    item.button.setAttribute(
      "aria-label",
      open && windowState.minimized
        ? t("ui.taskbar.restoreLabel", { label: item.label })
        : item.label
    );

    if (active) {
      activeAppId = appId;
    }
  }

  if (activeAppId !== undefined && activeAppId !== nodes.taskbarNodes.activeAppId) {
    nodes.taskbarNodes.items[activeAppId].button.scrollIntoView?.({
      block: "nearest",
      inline: "nearest"
    });
  }

  nodes.taskbarNodes.activeAppId = activeAppId;
}

function isAppAvailable(view: DevFloorView, appId: AppId): boolean {
  return appId !== "aurora" || view.aurora.unlocked;
}

function getWindowTitle(appId: AppId, view: DevFloorView): string {
  if (appId === "vibex") {
    return t("ui.window.vibexTitle", { model: view.model.current });
  }

  return t(`ui.app.${appId}`);
}

function getCommsChannelForApp(appId: AppId): CommsChannel | undefined {
  if (appId === "chat" || appId === "mail" || appId === "feed") {
    return appId;
  }

  return undefined;
}

function beginWindowDrag(
  event: PointerEvent,
  appId: AppId,
  root: HTMLElement,
  desktop: DesktopNodes,
  actions: AppActions
): void {
  if (
    event.button !== 0 ||
    (event.target instanceof HTMLElement && event.target.closest("button"))
  ) {
    return;
  }

  const windowState = desktop.currentWindows[appId];
  if (windowState.maximized) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  actions.focusApp(appId);

  const activeWindowState = desktop.currentWindows[appId];
  const bounds = getDesktopBounds(desktop.windowsLayer);
  const startFrame = getRenderedWindowFrame(activeWindowState, bounds);
  const startX = event.clientX;
  const startY = event.clientY;
  let nextFrame: WindowFrame = startFrame;
  let active = true;
  const captureTarget = getPointerCaptureTarget(event);

  root.classList.add("desktop-window--dragging");
  capturePointer(captureTarget, event.pointerId);

  const move = (moveEvent: PointerEvent): void => {
    nextFrame = getRenderedWindowFrame(
      {
        ...activeWindowState,
        ...startFrame,
        maximized: false,
        x: startFrame.x + moveEvent.clientX - startX,
        y: startFrame.y + moveEvent.clientY - startY
      },
      bounds
    );
    applyWindowFrame(root, nextFrame, activeWindowState.z);
  };
  const end = (): void => {
    if (!active) {
      return;
    }

    active = false;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
    window.removeEventListener("blur", end);
    captureTarget?.removeEventListener("lostpointercapture", end);
    releasePointer(captureTarget, event.pointerId);
    root.classList.remove("desktop-window--dragging");
    actions.moveApp(appId, { x: nextFrame.x, y: nextFrame.y }, bounds);
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
  window.addEventListener("blur", end);
  captureTarget?.addEventListener("lostpointercapture", end);
}

function beginWindowResize(
  event: PointerEvent,
  appId: AppId,
  root: HTMLElement,
  desktop: DesktopNodes,
  actions: AppActions
): void {
  if (event.button !== 0) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  actions.focusApp(appId);
  const bounds = getDesktopBounds(desktop.windowsLayer);
  const windowState = desktop.currentWindows[appId];
  const startFrame = getRenderedWindowFrame(windowState, bounds);
  const startX = event.clientX;
  const startY = event.clientY;
  let nextFrame: WindowFrame = startFrame;
  let active = true;
  const captureTarget = getPointerCaptureTarget(event);

  root.classList.add("desktop-window--resizing");
  capturePointer(captureTarget, event.pointerId);

  const move = (moveEvent: PointerEvent): void => {
    nextFrame = {
      ...startFrame,
      h: startFrame.h + moveEvent.clientY - startY,
      w: startFrame.w + moveEvent.clientX - startX
    };
    applyWindowFrame(
      root,
      getRenderedWindowFrame({ ...windowState, ...nextFrame }, bounds),
      windowState.z
    );
  };
  const end = (): void => {
    if (!active) {
      return;
    }

    active = false;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
    window.removeEventListener("blur", end);
    captureTarget?.removeEventListener("lostpointercapture", end);
    releasePointer(captureTarget, event.pointerId);
    root.classList.remove("desktop-window--resizing");
    actions.resizeApp(appId, nextFrame, bounds);
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
  window.addEventListener("blur", end);
  captureTarget?.addEventListener("lostpointercapture", end);
}

function getPointerCaptureTarget(event: PointerEvent): HTMLElement | undefined {
  return event.currentTarget instanceof HTMLElement ? event.currentTarget : undefined;
}

function capturePointer(target: HTMLElement | undefined, pointerId: number): void {
  if (target === undefined) {
    return;
  }

  try {
    target.setPointerCapture(pointerId);
  } catch {
    // Some test/browser surfaces expose pointer events without capture support.
  }
}

function releasePointer(target: HTMLElement | undefined, pointerId: number): void {
  if (target === undefined) {
    return;
  }

  try {
    target.releasePointerCapture(pointerId);
  } catch {
    // Pointer capture can already be released by the browser.
  }
}

function applyWindowFrame(target: HTMLElement | WindowNodes, frame: WindowFrame, z: number): void {
  const root = target instanceof HTMLElement ? target : target.root;

  if (!(target instanceof HTMLElement)) {
    if (
      target.lastZ === z &&
      target.lastFrame !== undefined &&
      sameWindowFrame(target.lastFrame, frame)
    ) {
      return;
    }

    target.lastFrame = { ...frame };
    target.lastZ = z;
  }

  root.style.transform = `translate3d(${frame.x.toFixed(0)}px, ${frame.y.toFixed(0)}px, 0)`;
  root.style.width = `${frame.w.toFixed(0)}px`;
  root.style.height = `${frame.h.toFixed(0)}px`;
  root.style.zIndex = String(z);
}

function sameWindowFrame(left: WindowFrame, right: WindowFrame): boolean {
  return left.x === right.x && left.y === right.y && left.w === right.w && left.h === right.h;
}

function isWindowPointerActive(root: HTMLElement): boolean {
  return (
    root.classList.contains("desktop-window--dragging") ||
    root.classList.contains("desktop-window--resizing")
  );
}

function getRenderedWindowFrame(windowState: WindowState, bounds: WindowBounds): WindowFrame {
  const copy: WindowState = {
    ...windowState,
    restore: windowState.restore === undefined ? undefined : { ...windowState.restore }
  };
  clampWindow(copy, bounds);
  return { h: copy.h, w: copy.w, x: copy.x, y: copy.y };
}

function connectWindowBoundsInvalidation(layer: HTMLElement, actions: AppActions): () => void {
  invalidateWindowBoundsCache(layer);
  let lastBounds: WindowBounds | undefined;
  const invalidate = (): void => {
    invalidateWindowBoundsCache(layer);
    const bounds = getDesktopBounds(layer);

    if (sameWindowBounds(lastBounds, bounds)) {
      return;
    }

    lastBounds = { ...bounds };
    actions.fitOpenWindowsToBounds(bounds);
  };
  let observer: ResizeObserver | undefined;

  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(invalidate);
    observer.observe(layer);
  }

  window.addEventListener("resize", invalidate);

  return () => {
    observer?.disconnect();
    window.removeEventListener("resize", invalidate);
    invalidateWindowBoundsCache(layer);
  };
}

function sameWindowBounds(left: WindowBounds | undefined, right: WindowBounds): boolean {
  return left !== undefined && left.height === right.height && left.width === right.width;
}

function invalidateWindowBoundsCache(layer?: HTMLElement): void {
  if (layer === undefined || cachedWindowBounds?.layer === layer) {
    cachedWindowBounds = undefined;
  }
}

function getDesktopBounds(layer: HTMLElement): WindowBounds {
  if (cachedWindowBounds?.layer === layer) {
    return cachedWindowBounds.bounds;
  }

  const rect = layer.getBoundingClientRect();
  const fallbackWidth = window.innerWidth || 1280;
  const fallbackHeight = Math.max(1, (window.innerHeight || 800) - 112);
  const bounds = {
    height: Math.max(1, rect.height || fallbackHeight),
    width: Math.max(1, rect.width || fallbackWidth)
  };
  cachedWindowBounds = { bounds, layer };
  return bounds;
}

function getViewportWindowBounds(): WindowBounds {
  return {
    height: Math.max(1, (window.innerHeight || 800) - 112),
    width: Math.max(1, window.innerWidth || 1280)
  };
}

function isAppVisible(windows: Record<AppId, WindowState>, appId: AppId): boolean {
  return isWindowVisible(windows[appId]);
}

function getTopVisibleZ(windows: Record<AppId, WindowState>): number {
  return Math.max(
    0,
    ...APP_IDS.map((appId) => (isWindowVisible(windows[appId]) ? windows[appId].z : 0))
  );
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function createResourceCounters(resources: ResourceView): ResourceCounterSet {
  const bank = createResourceCounterNodes(resources.bank, resources.bankTooltip);
  bank.root.hidden = !resources.bankVisible;

  return {
    bank,
    compute: createResourceCounterNodes(resources.compute),
    hype: createResourceCounterNodes(resources.hype),
    loc: createResourceCounterNodes(resources.loc),
    locRate: createResourceCounterNodes(resources.locRate, resources.locRateTooltip),
    money: createResourceCounterNodes(resources.money),
    moneyRate: createResourceCounterNodes(resources.moneyRate, resources.moneyRateTooltip),
    rp: createResourceCounterNodes(resources.rp)
  };
}

function createResourceCounterNodes(
  value: string,
  tooltip: LazyTooltip = ""
): ResourceCounterNodes {
  const root = el("div", { className: "resource-counter" });
  const nodes: ResourceCounterNodes = { root, tooltip, value: text(value) };
  root.addEventListener("mouseenter", () => {
    if (typeof nodes.tooltip === "function") {
      root.title = nodes.tooltip();
    }
  });
  setResourceCounterTooltip(nodes, tooltip);
  return nodes;
}

function updateResourceCounters(counters: ResourceCounterSet, resources: ResourceView): void {
  counters.bank.root.hidden = !resources.bankVisible;
  setResourceCounterTooltip(counters.bank, resources.bankTooltip);
  setText(counters.bank.value, resources.bank);
  setText(counters.compute.value, resources.compute);
  setText(counters.hype.value, resources.hype);
  setText(counters.loc.value, resources.loc);
  setText(counters.locRate.value, resources.locRate);
  setResourceCounterTooltip(counters.locRate, resources.locRateTooltip);
  setText(counters.money.value, resources.money);
  setText(counters.moneyRate.value, resources.moneyRate);
  setResourceCounterTooltip(counters.moneyRate, resources.moneyRateTooltip);
  setText(counters.rp.value, resources.rp);
}

function setResourceCounterTooltip(nodes: ResourceCounterNodes, tooltip: LazyTooltip): void {
  nodes.tooltip = tooltip;
  if (typeof tooltip === "string") {
    nodes.root.title = tooltip;
  } else {
    nodes.root.removeAttribute("title");
  }
}

function updateModel(view: ModelView): void {
  if (modelNodes === undefined) {
    return;
  }

  setText(modelNodes.value, view.current);
  setText(modelNodes.status, view.status);
  setText(modelNodes.cost, view.nextCost);
  modelNodes.button.disabled = !view.canBuy;
  modelNodes.button.hidden = view.maxed;
}

function createModelPanel(view: ModelView, actions: AppActions): HTMLElement {
  const panel = el("aside", { className: "model-panel" });
  const label = el("span", { className: "model-panel__label" });
  label.append(text(t("ui.model.label")));

  const value = el("strong", { className: "model-panel__value" });
  const valueText = text(view.current);
  value.append(valueText);

  const status = text(view.status);
  const statusNode = el("span", { className: "model-panel__status" });
  statusNode.append(status);
  const cost = text(view.nextCost);
  const costNode = el("span", { className: "model-panel__cost" });
  costNode.append(cost);
  const button = createBuyButton("ui.model.upgrade", actions.buyEra);
  panel.append(label, value, statusNode, costNode, button);
  modelNodes = { button, cost, status, value: valueText };
  updateModel(view);
  return panel;
}

function createScreens(view: DevFloorView, actions: AppActions): ScreenNodes {
  const agents = createAgentsScreen(view, actions);
  const hardwareScreen = createHardwareScreen(view.hardware, view.aurora, actions);
  const upgradesScreen = createUpgradesScreen(view.upgrades, actions);
  const projectsScreen = createProjectsScreen(view.projects, actions);
  const roadmapScreen = createRoadmapScreen(view.roadmap, actions);
  const endlessScreen = createEndlessScreen(view.endless, actions);
  const auroraScreen = createAuroraScreen(view.aurora, actions);
  const researchScreen = createResearchScreen(view.research, actions);
  const rewriteScreen = createRewriteScreen(view.rewrite, actions);
  const statsScreen = createStatsScreen(view.stats);
  const achievementsScreen = createAchievementsScreen(view.achievements);
  const settingsScreen = createSettingsScreen(view.settings, actions);
  return {
    achievements: achievementsScreen,
    agents,
    aurora: auroraScreen,
    endless: endlessScreen,
    hardware: hardwareScreen,
    projects: projectsScreen,
    roadmap: roadmapScreen,
    research: researchScreen,
    rewrite: rewriteScreen,
    settings: settingsScreen,
    stats: statsScreen,
    upgrades: upgradesScreen
  };
}

interface ScreenNodes {
  readonly achievements: HTMLElement;
  readonly agents: HTMLElement;
  readonly aurora: HTMLElement;
  readonly endless: HTMLElement;
  readonly hardware: HTMLElement;
  readonly projects: HTMLElement;
  readonly roadmap: HTMLElement;
  readonly research: HTMLElement;
  readonly rewrite: HTMLElement;
  readonly settings: HTMLElement;
  readonly stats: HTMLElement;
  readonly upgrades: HTMLElement;
}

function updateAppearance(shell: HTMLElement, terminal: HTMLElement, view: AppearanceView): void {
  for (const className of endingClasses) {
    shell.classList.remove(className);
  }

  for (const className of terminalThemeClasses) {
    terminal.classList.remove(className);
  }

  if (view.ending !== undefined) {
    shell.classList.add(`app-shell--ending-${view.ending}`);
  }

  shell.classList.toggle("app-shell--glitch", view.glitch);
  shell.classList.toggle("app-shell--reduced-motion", view.reducedFx);

  if (view.theme !== undefined) {
    terminal.classList.add(`terminal--theme-${view.theme}`);
  }

  if (view.glitch) {
    terminal.classList.add("terminal--theme-glitch");
  }
}

function createOfflineModal(view: OfflineView, actions: AppActions): HTMLElement {
  const root = el("section", { className: "offline-modal" });
  root.hidden = !view.visible;

  const panel = el("div", { className: "offline-modal__panel" });
  const title = el("h2", { className: "offline-modal__title" });
  title.append(text(t("ui.offline.title")));

  const duration = text(view.duration);
  const loc = text(view.loc);
  const money = text(view.money);
  const hype = text(view.hype);
  const close = createSettingsButton("ui.offline.close", actions.dismissOffline);

  panel.append(
    title,
    createProjectMeta("ui.offline.duration", duration),
    createProjectMeta("ui.offline.loc", loc),
    createProjectMeta("ui.offline.money", money),
    createProjectMeta("ui.offline.hype", hype),
    close
  );
  root.append(panel);
  offlineNodes = { duration, hype, loc, money, root };
  return root;
}

function createVibexWorkspace(view: VibexView, terminal: TerminalViewNodes): VibexNodes {
  const root = el("section", { className: "vibex-workspace" });
  const filePanel = el("aside", { className: "vibex-files" });
  const fileTitle = el("h2", { className: "vibex-pane-title" });
  fileTitle.append(text(t("vibex.files.title")));
  const fileList = el("div", { className: "vibex-files__list" });
  const fileRows = new Map<string, HTMLElement>();
  const fileTexts = new Map<string, Text>();

  for (const file of view.files) {
    const row = el("div", { className: "vibex-file" });
    const label = text(file.label);
    row.dataset.fileId = file.id;
    row.append(label);
    row.classList.toggle("vibex-file--active", file.active);
    fileRows.set(file.id, row);
    fileTexts.set(file.id, label);
    fileList.append(row);
  }

  filePanel.append(fileTitle, fileList);

  const codePane = el("section", { className: "vibex-code" });
  const codeTitle = el("h2", { className: "vibex-pane-title" });
  codeTitle.append(text(t("vibex.code.title")));
  const stream = el("div", { className: "vibex-code__stream" });
  const codeRows: HTMLElement[] = [];
  const codeTexts: Text[] = [];

  view.codeLines.forEach((line, index) => {
    appendVibexCodeLine(stream, codeRows, codeTexts, line, index);
  });

  codePane.append(codeTitle, stream);
  const codeStack = el("section", { className: "vibex-code-stack" });
  const terminalPanel = el("section", { className: "vibex-terminal-panel" });
  const terminalTitle = el("h2", { className: "vibex-pane-title" });
  terminalTitle.append(text(t("ui.terminal.title")));
  terminalPanel.append(terminalTitle, terminal.logRoot);
  codeStack.append(codePane, terminalPanel);
  root.append(filePanel, codeStack, terminal.root);

  return {
    cannedPrompt: terminal.cannedPrompt,
    cannedResponse: terminal.cannedResponse,
    codeRows,
    codeStream: stream,
    codeTexts,
    fileRows,
    fileTexts,
    lastCodeSequence: view.codeSequence,
    root,
    terminal
  };
}

function updateVibex(nodes: VibexNodes, view: VibexView): void {
  setText(nodes.cannedPrompt, view.cannedPrompt);
  setText(nodes.cannedResponse, view.cannedResponse);

  for (const file of view.files) {
    nodes.fileRows.get(file.id)?.classList.toggle("vibex-file--active", file.active);
    const label = nodes.fileTexts.get(file.id);
    if (label !== undefined) {
      setText(label, file.label);
    }
  }

  if (nodes.lastCodeSequence === view.codeSequence) {
    return;
  }

  nodes.lastCodeSequence = view.codeSequence;

  view.codeLines.forEach((line, index) => {
    if (nodes.codeRows[index] === undefined) {
      appendVibexCodeLine(nodes.codeStream, nodes.codeRows, nodes.codeTexts, line, index);
      return;
    }

    const row = nodes.codeRows[index]!;
    row.hidden = false;
    row.dataset.lineId = line.id;
    setText(nodes.codeTexts[index]!, line.text);
    animateVibexCodeLine(row, index);
  });

  nodes.codeRows.slice(view.codeLines.length).forEach((row) => {
    row.hidden = true;
  });
}

function appendVibexCodeLine(
  stream: HTMLElement,
  rows: HTMLElement[],
  texts: Text[],
  line: VibexCodeLineView,
  index: number
): void {
  const row = el("div", { className: "vibex-code-line vibex-code-line--active" });
  const lineText = text(line.text);

  row.dataset.lineId = line.id;
  row.append(lineText);
  animateVibexCodeLine(row, index);
  rows.push(row);
  texts.push(lineText);
  stream.append(row);
}

function animateVibexCodeLine(row: HTMLElement, index: number): void {
  row.style.setProperty("--vibex-line-index", String(index));
  row.classList.remove("vibex-code-line--active");
  void row.offsetWidth;
  row.classList.add("vibex-code-line--active");
}

function createTerminal(view: VibexView, actions: AppActions): TerminalViewNodes {
  const terminal = el("section", { className: "terminal vibex-terminal" });
  const header = el("div", { className: "terminal__header" });
  header.append(text(t("vibex.aiAssistant.title")));
  const log = createTerminalLog();

  const canned = el("section", { className: "vibex-canned" });
  const cannedPromptLabel = el("span", { className: "vibex-canned__label" });
  cannedPromptLabel.append(text(t("vibex.canned.promptLabel")));
  const cannedPrompt = el("p", { className: "vibex-canned__prompt" });
  const cannedPromptText = text(view.cannedPrompt);
  cannedPrompt.append(cannedPromptText);
  const cannedResponseLabel = el("span", { className: "vibex-canned__label" });
  cannedResponseLabel.append(text(t("vibex.canned.responseLabel")));
  const cannedResponse = el("p", { className: "vibex-canned__response" });
  const cannedResponseText = text(view.cannedResponse);
  cannedResponse.append(cannedResponseText);
  canned.append(cannedPromptLabel, cannedPrompt, cannedResponseLabel, cannedResponse);

  const input = el("textarea", { className: "vibex-terminal__input" });
  input.placeholder = t("vibex.input.placeholder");

  const prompt = el("button", { className: "terminal__prompt" });
  prompt.type = "button";
  prompt.append(text(t("vibex.send")));

  const flowRow = el("div", { className: "terminal__counter" });
  const label = el("span", { className: "terminal__counter-label" });
  label.append(text(t("ui.terminal.flow")));
  const flowValue = el("strong", { className: "terminal__counter-value" });
  const flowText = text("");
  flowValue.append(flowText);
  flowRow.append(label, flowValue);

  const frameTrack = el("div", { className: "terminal__frame-track" });
  const flowBar = el("div", { className: "terminal__frame-bar" });
  frameTrack.append(flowBar);
  const particles = createPromptParticles();

  terminal.append(header, canned, input, flowRow, frameTrack, prompt, particles.root);
  const nodes: TerminalViewNodes = {
    addLog: log.addLog,
    cannedPrompt: cannedPromptText,
    cannedResponse: cannedResponseText,
    flowBar,
    flowText,
    input,
    logRoot: log.root,
    prompt,
    responseToken: 0,
    root: terminal,
    showParticle: particles.show
  };
  prompt.addEventListener("click", () => {
    runVibexSend(actions, nodes);
  });
  return nodes;
}

function runVibexSend(actions: AppActions, nodes: TerminalViewNodes): void {
  const result = actions.sendVibexPrompt(nodes.input.value, "manual");
  nodes.responseToken += 1;
  const responseToken = nodes.responseToken;
  nodes.input.value = "";
  setText(nodes.cannedPrompt, result.prompt);
  setText(nodes.cannedResponse, result.response);

  if (result.pendingResponse !== undefined) {
    void result.pendingResponse.then((response) => {
      if (responseToken === nodes.responseToken) {
        setText(nodes.cannedResponse, response);
      }
    });
  }

  nodes.addLog(t("ui.terminal.promptLog", { loc: result.loc }));
  if (result.committed) {
    nodes.addLog(t("vibex.log.committed"), { priority: true });
  }
  nodes.showParticle(result.loc);
}

function runVibexAutoPrompt(
  actions: AppActions,
  nodes: {
    readonly addLog: (message: string, options?: TerminalLogOptions) => Text;
    readonly showParticle: (value: string) => void;
  }
): void {
  const result = actions.sendVibexPrompt("", "auto");

  nodes.addLog(t("ui.terminal.promptLog", { loc: result.loc }));

  if (result.committed) {
    nodes.addLog(t("vibex.log.committed"), { priority: true });
  }

  nodes.showParticle(result.loc);
}

function handleShortcut(
  event: KeyboardEvent,
  desktop: DesktopNodes,
  terminal: TerminalViewNodes,
  actions: AppActions
): void {
  if (event.defaultPrevented || desktop.currentScene !== "desktop") {
    return;
  }

  if (event.ctrlKey && event.key === "Tab") {
    event.preventDefault();
    cycleWindowFocus(desktop, actions);
    return;
  }

  if (
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    event.key === "Escape" &&
    offlineNodes !== undefined &&
    !offlineNodes.root.hidden
  ) {
    event.preventDefault();
    actions.dismissOffline();
    return;
  }

  if (event.altKey || event.ctrlKey || event.metaKey || isEditableShortcutTarget(event.target)) {
    return;
  }

  if (event.key === "Escape") {
    const appId = getActiveWindowApp(desktop);

    if (appId !== undefined) {
      event.preventDefault();
      actions.minimizeApp(appId);
    }

    return;
  }

  if (event.key === " " && !isButtonShortcutTarget(event.target)) {
    event.preventDefault();
    runVibexAutoPrompt(actions, {
      addLog: terminal.addLog,
      showParticle: terminal.showParticle
    });
    return;
  }

  if (event.key >= "1" && event.key <= "8") {
    const appId = getShortcutApp(event.key);

    if (appId !== undefined) {
      event.preventDefault();
      actions.openApp(appId, getDesktopBounds(desktop.windowsLayer));
    }

    return;
  }

  if (event.key.toLowerCase() === "b") {
    const generatorId = getFocusedGeneratorId(event.target);

    if (generatorId !== undefined && isAppVisible(desktop.currentWindows, "agents")) {
      event.preventDefault();
      actions.buyGenerator(generatorId, "max");
    }
  }
}

function cycleWindowFocus(desktop: DesktopNodes, actions: AppActions): void {
  const visibleApps = APP_IDS.filter((appId) => isAppVisible(desktop.currentWindows, appId)).sort(
    (left, right) => desktop.currentWindows[left].z - desktop.currentWindows[right].z
  );

  if (visibleApps.length === 0) {
    return;
  }

  const active = getActiveWindowApp(desktop);
  const activeIndex = active === undefined ? -1 : visibleApps.indexOf(active);
  const nextApp = visibleApps[(activeIndex + 1) % visibleApps.length];

  if (nextApp !== undefined) {
    actions.focusApp(nextApp);
  }
}

function getActiveWindowApp(desktop: DesktopNodes): AppId | undefined {
  let activeApp: AppId | undefined;
  let activeZ = -1;

  for (const appId of APP_IDS) {
    const windowState = desktop.currentWindows[appId];

    if (isWindowVisible(windowState) && windowState.z > activeZ) {
      activeApp = appId;
      activeZ = windowState.z;
    }
  }

  return activeApp;
}

function getFocusedGeneratorId(target: EventTarget | null): string | undefined {
  if (!(target instanceof Element)) {
    return undefined;
  }

  return target.closest<HTMLElement>(".agent-row")?.dataset.generatorId;
}

function isEditableShortcutTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches("input, select, textarea"))
  );
}

function isButtonShortcutTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest("button") !== null;
}

function isInteractiveWindowTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest("button, input, select, textarea, [role='button']") !== null
  );
}

function getInteractiveWindowTargetAtPoint(
  container: HTMLElement,
  x: number,
  y: number
): HTMLElement | undefined {
  const controls = Array.from(
    container.querySelectorAll<HTMLElement>("button, input, select, textarea, [role='button']")
  );

  for (let index = controls.length - 1; index >= 0; index -= 1) {
    const control = controls[index];
    if (control === undefined) {
      continue;
    }

    if (control.closest("[hidden]") !== null || control.matches(":disabled")) {
      continue;
    }

    const style = window.getComputedStyle(control);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.pointerEvents === "none"
    ) {
      continue;
    }

    const rect = control.getBoundingClientRect();
    if (
      rect.width > 0 &&
      rect.height > 0 &&
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    ) {
      return control;
    }
  }

  return undefined;
}

function activateWindowControl(control: HTMLElement): void {
  if (control instanceof HTMLButtonElement) {
    control.click();
    return;
  }

  if (control instanceof HTMLInputElement) {
    if (control.type === "checkbox" || control.type === "radio") {
      control.click();
      return;
    }

    control.focus();
    return;
  }

  if (control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) {
    control.focus();
    return;
  }

  control.click();
}

function createTerminalLog(): {
  readonly addLog: (message: string, options?: TerminalLogOptions) => Text;
  readonly root: HTMLElement;
} {
  const root = el("section", { className: "terminal-log" });
  const rows: TerminalLogRow[] = [];
  let nextIndex = 0;
  let windowStartedAtMs = 0;
  let windowCount = 0;
  let throttledCount = 0;
  let lastRow: TerminalLogRow | undefined;

  for (let i = 0; i < TERMINAL_LOG_CAPACITY; i += 1) {
    const row = el("div", { className: "terminal-log__row" });
    const rowText = text("");
    row.hidden = true;
    row.append(rowText);
    root.append(row);
    rows.push({ root: row, text: rowText });
  }

  return {
    root,

    addLog(message: string, options?: TerminalLogOptions): Text {
      const nowMs = performance.now();
      if (nowMs - windowStartedAtMs >= 1000) {
        windowStartedAtMs = nowMs;
        windowCount = 0;
        throttledCount = 0;
      }

      if (options?.priority === true && windowCount >= TERMINAL_LOG_RATE_LIMIT) {
        windowStartedAtMs = nowMs;
        windowCount = 0;
        throttledCount = 0;
      }

      if (windowCount >= TERMINAL_LOG_RATE_LIMIT) {
        throttledCount += 1;
        if (lastRow !== undefined) {
          setText(lastRow.text, t("ui.terminal.logOverflow", { count: throttledCount }));
          return lastRow.text;
        }
        return rows[0]!.text;
      }

      const row = rows[nextIndex];
      if (row === undefined) {
        return rows[0]!.text;
      }

      setText(row.text, message);
      row.root.hidden = false;
      root.append(row.root);
      lastRow = row;
      nextIndex = (nextIndex + 1) % TERMINAL_LOG_CAPACITY;
      windowCount += 1;
      return row.text;
    }
  };
}

function createPromptParticles(): {
  readonly root: HTMLElement;
  readonly show: (value: string) => void;
} {
  const root = el("div", { className: "terminal-particles" });
  const particles: TerminalParticle[] = [];
  let nextIndex = 0;

  for (let i = 0; i < CLICK_PARTICLE_POOL_SIZE; i += 1) {
    const particle = el("span", { className: "terminal-particle" });
    const particleText = text("");
    particle.hidden = true;
    particle.append(particleText);
    particle.addEventListener("animationend", () => {
      particle.hidden = true;
      particle.classList.remove("terminal-particle--active");
    });
    root.append(particle);
    particles.push({ root: particle, text: particleText });
  }

  return {
    root,

    show(value: string): void {
      const particle = particles[nextIndex];
      if (particle === undefined) {
        return;
      }

      setText(particle.text, t("ui.terminal.promptParticle", { loc: value }));
      particle.root.hidden = false;
      particle.root.classList.remove("terminal-particle--active");
      particle.root.style.left = `${20 + nextIndex * 6}%`;
      void particle.root.offsetWidth;
      particle.root.classList.add("terminal-particle--active");
      nextIndex = (nextIndex + 1) % CLICK_PARTICLE_POOL_SIZE;
    }
  };
}

function createEndingModal(view: EndingModalView, actions: AppActions): EndingModalNodes {
  const root = el("section", { className: "ending-modal" });
  const nodes = { root, signature: "" };
  updateEndingModal(nodes, view, actions);
  return nodes;
}

function createGameOverModal(view: GameOverView, actions: AppActions): GameOverNodes {
  const root = el("section", { className: "ending-modal game-over-modal" });
  const nodes = { root, signature: "" };
  updateGameOverModal(nodes, view, actions);
  return nodes;
}

function setTextContent(node: HTMLElement, value: string): void {
  if (node.textContent !== value) {
    node.textContent = value;
  }
}

function createResourceCounter(labelKey: string, counter: ResourceCounterNodes): HTMLElement {
  const label = el("span", { className: "resource-counter__label" });
  label.append(text(t(labelKey)));

  const currentValue = el("strong", { className: "resource-counter__value" });
  currentValue.append(counter.value);

  counter.root.append(label, currentValue);
  return counter.root;
}

function updateOffline(view: OfflineView): void {
  if (offlineNodes === undefined) {
    return;
  }

  offlineNodes.root.hidden = !view.visible;
  setText(offlineNodes.duration, view.duration);
  setText(offlineNodes.loc, view.loc);
  setText(offlineNodes.money, view.money);
  setText(offlineNodes.hype, view.hype);
}

function updateEndingModal(
  nodes: EndingModalNodes,
  view: EndingModalView,
  actions: AppActions
): void {
  nodes.root.hidden = !view.visible;

  if (!view.visible) {
    if (nodes.signature !== "hidden") {
      nodes.root.replaceChildren();
      nodes.signature = "hidden";
    }
    return;
  }

  const signature = getEndingModalSignature(view);
  if (nodes.signature === signature) {
    return;
  }

  const dialog = el("div", { className: "ending-modal__dialog" });
  const title = el("h2", { className: "ending-modal__title" });
  title.append(text(t("ui.ending.title")));
  const copy = el("div", { className: "ending-modal__copy" });
  for (const line of view.lines) {
    const paragraph = el("p", { className: "ending-modal__line" });
    paragraph.append(text(line));
    copy.append(paragraph);
  }

  const choices = el("div", { className: "ending-modal__choices" });
  for (const choice of view.choices) {
    const button = el("button", {
      className: "project-card__button",
      title: choice.label
    });
    button.type = "button";
    button.append(text(choice.label));
    button.addEventListener("click", () => {
      actions.chooseStoryChoice(view.eventId, choice.id);
    });
    button.disabled = choice.selected;
    choices.append(button);
  }

  dialog.append(title, copy, choices);
  nodes.root.replaceChildren(dialog);
  nodes.signature = signature;
}

function updateGameOverModal(nodes: GameOverNodes, view: GameOverView, actions: AppActions): void {
  nodes.root.hidden = !view.visible;

  if (!view.visible) {
    if (nodes.signature !== "hidden") {
      nodes.root.replaceChildren();
      nodes.signature = "hidden";
    }
    return;
  }

  const signature = getGameOverSignature(view);
  if (nodes.signature === signature) {
    return;
  }

  const dialog = el("div", { className: "ending-modal__dialog game-over-modal__dialog" });
  const title = el("h2", { className: "ending-modal__title" });
  title.append(text(t("ui.bankruptcy.title")));
  const copy = el("div", { className: "ending-modal__copy" });
  for (const line of view.lines) {
    const paragraph = el("p", { className: "ending-modal__line" });
    paragraph.append(text(line));
    copy.append(paragraph);
  }

  const overdraft = text(view.overdraft);
  const exportArea = el("textarea", { className: "settings-save__textarea" });
  exportArea.readOnly = true;
  exportArea.placeholder = t("ui.bankruptcy.exportPlaceholder");
  const exportButton = createSettingsButton("ui.bankruptcy.exportSave", () => {
    exportArea.value = actions.exportSave();
    exportArea.select();
  });
  const quitButton = createSettingsButton("ui.bankruptcy.quitToTitle", actions.quitToTitle);
  const wipeButton = createSettingsButton("ui.bankruptcy.wipeSave", actions.wipeSave);
  const choices = el("div", { className: "ending-modal__choices game-over-modal__choices" });
  choices.append(exportButton, quitButton, wipeButton);

  dialog.append(
    title,
    copy,
    createProjectMeta("ui.bankruptcy.overdraft", overdraft),
    exportArea,
    choices
  );
  nodes.root.replaceChildren(dialog);
  nodes.signature = signature;
}

function getGameOverSignature(view: GameOverView): string {
  return [view.overdraft, ...view.lines].join("|");
}

function getEndingModalSignature(view: EndingModalView): string {
  return [
    view.eventId,
    ...view.lines,
    ...view.choices.map((choice) =>
      [choice.id, choice.label, choice.selected ? "1" : "0"].join(":")
    )
  ].join("|");
}

function createBuyButton(labelKey: string, onClick: () => void): HTMLButtonElement {
  const button = el("button", {
    className: "agent-row__button",
    title: t(labelKey)
  });
  button.type = "button";
  button.append(text(t(labelKey)));
  button.addEventListener("click", onClick);
  return button;
}

function createSettingsButton(labelKey: string, onClick: () => void): HTMLButtonElement {
  const button = el("button", {
    className: "settings-button",
    title: t(labelKey)
  });
  button.type = "button";
  button.append(text(t(labelKey)));
  button.addEventListener("click", onClick);
  return button;
}

function createProjectMeta(labelKey: string, value: Text): HTMLElement {
  const row = el("div", { className: "project-meta" });
  const label = el("span", { className: "project-meta__label" });
  label.append(text(t(labelKey)));
  const output = el("strong", { className: "project-meta__value" });
  output.append(value);
  row.append(label, output);
  return row;
}
