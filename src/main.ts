import { createEventBus } from "./core/bus";
import { createAppActions } from "./app/actions";
import { bootstrapApp } from "./app/bootstrap";
import { createCommsController } from "./app/comms";
import { createAppFormatters } from "./app/formatters";
import { startVibecoderLoop } from "./app/game-loop";
import { createPersistenceController } from "./app/persistence";
import { createSaveFailureNotifier } from "./app/save-failure";
import { createViewModelBuilder } from "./app/view-models";
import { createVibexSession } from "./app/vibex-session";
import { OFFLINE_THRESHOLD_MS } from "./core/loop";
import { shouldBlockPersistenceAfterLoad } from "./core/save";
import { TUTORIAL_STEPS, type AppId, type TutorialStep } from "./core/ui-state";
import {
  createViewInvalidation,
  flushViewInvalidation,
  markResourceEvent
} from "./core/view-invalidation";
import { createDevPerfPanel, type DevPerfPanel } from "./dev/perf-panel";
import { loadLocale, t } from "./i18n/i18n";
import { createVibexAiClient } from "./platform/ai";
import { applyOfflineProgress, type OfflineProgressResult } from "./systems/offline";
import { ensureProjectBoard } from "./systems/projects";
import { createDerivedCache, recomputeDerivedCache } from "./systems/production";
import { getUnreadStoryCount } from "./systems/story";
import { mountApp, type AppActions, type AppShell } from "./ui/render";
import { createAudioController } from "./ui/audio";
import { closeWindow, isWindowVisible, openWindow } from "./ui/wm/window-manager";
import "./ui/theme.css";
import "./ui/layout.css";

declare global {
  interface Window {
    __VIBECODER_HANDLE_CLOSE_REQUEST__?: () => void;
  }
}

const { appRoot, bootLocaleRepaired, loaded, platform } = await bootstrapApp();
let state = loaded.state;
document.documentElement.lang = state.settings.lang;
platform.setTitle(t("app.title"));
recordInitialSaveDiagnostics();
syncSceneAfterLoad();
const bus = createEventBus();
const cache = createDerivedCache();
ensureProjectBoard(state);
recomputeDerivedCache(state, cache);
const audio = createAudioController(state.settings);
let offlineSummary = applyOfflineOnReturn(Date.now());
let devPerfPanel: DevPerfPanel | undefined;

const MS_PER_HOUR = 60 * 60 * 1000;
const formatters = createAppFormatters(() => state);
const { formatLinesOfCode, formatMoney } = formatters;
const vibexAi = createVibexAiClient(platform.edition, () => updateVisibleView());
const vibexSession = createVibexSession(state.vibex);
let localeChangeToken = 0;

void platform
  .listBackups?.()
  .then((backups) => {
    state.stats["save.backupCount"] = backups.length;
    updateVisibleView();
  })
  .catch(() => {});

const invalidation = createViewInvalidation();
bus.on("res:changed", (resource) => {
  markResourceEvent(invalidation, resource);
});
bus.on("production:changed", () => {
  invalidation.markResourceChanged();
});

for (const event of [
  "bought",
  "unlock",
  "era:changed",
  "prestige",
  "incident:spawned",
  "incident:resolved",
  "momentum:changed",
  "project-chain:completed",
  "roadmap:sprint-started",
  "roadmap:sprint-completed"
] as const) {
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
const saveFailureNotifier = createSaveFailureNotifier(() => {
  app.showToast(t("ui.toast.saveFailed"), "danger");
});
const persistence = createPersistenceController({
  blocked: shouldBlockPersistenceAfterLoad(loaded),
  getState: () => state,
  platform,
  saveFailureNotifier
});
const comms = createCommsController({
  app: () => app,
  getState: () => state,
  persistNow,
  updateVisibleView
});
const viewModels = createViewModelBuilder({
  cache,
  comms,
  formatters,
  getOfflineSummary: () => offlineSummary,
  getState: () => state,
  vibexAi,
  vibexSession
});
const appActions: AppActions = createAppActions({
  app: () => app,
  audio,
  bus,
  cache,
  changeLanguage,
  comms,
  completeTutorial,
  dismissOffline(): void {
    offlineSummary = undefined;
    updateVisibleView();
  },
  formatters: {
    formatLinesOfCode
  },
  flushActionInvalidation,
  getState: () => state,
  installState,
  invalidation,
  moveTutorialStep,
  persistence,
  persistNow,
  platform,
  scheduleAutosave,
  syncVibexSeeds,
  updateVisibleView,
  vibexAi,
  vibexSession
});
app = mountApp(appRoot, viewModels.createDevFloorView(cache, true), appActions);

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
  const appId = comms.getStoryMessageAppId(eventId);
  const hadUnread = appId !== undefined && getUnreadStoryCount(state, appId) > 0;

  if (appId !== undefined && isWindowVisible(state.ui.windows[appId])) {
    comms.markAppRead(appId);
  }

  if (hadUnread && !state.settings.doNotDisturb) {
    audio.play("message");
    comms.showStoryToast(appId);
  }

  comms.markDirty();
  invalidation.markVisibleChanged(true);
});

bus.on("bug:fixed", ({ productId }) => {
  app.addTerminalLog(t("ui.terminal.bugFixedLog", { name: viewModels.getProductName(productId) }));
});

bus.on("bug:spawned", ({ productId }) => {
  audio.play("error");
  app.addTerminalLog(t("ui.terminal.bugLog", { name: viewModels.getProductName(productId) }));
});

bus.on("incident:spawned", ({ type }) => {
  audio.play("error");
  const name = t(`incident.${type}.name`);
  app.addTerminalLog(t("ui.terminal.incidentLog", { name }));
  app.showToast(t("ui.toast.incidentSpawned", { name }), "danger");
});

bus.on("incident:resolved", ({ type }) => {
  const name = t(`incident.${type}.name`);
  app.addTerminalLog(t("ui.terminal.incidentResolvedLog", { name }));
  app.showToast(t("ui.toast.incidentResolved", { name }), "accent");
});

bus.on("roadmap:sprint-started", ({ priority }) => {
  app.addTerminalLog(
    t("ui.terminal.sprintStartedLog", { name: t(`roadmap.sprint.${priority}.name`) })
  );
});

bus.on("roadmap:sprint-completed", ({ priority }) => {
  app.addTerminalLog(
    t("ui.terminal.sprintCompletedLog", { name: t(`roadmap.sprint.${priority}.name`) })
  );
});

bus.on("shipped", ({ level, payout, projectId, upgraded }) => {
  const name = viewModels.getProjectName(projectId);
  audio.play("ship");
  app.addTerminalLog(t("ui.terminal.shipLog", { name }));
  app.showToast(
    upgraded === true
      ? t("ui.toast.projectUpgraded", { level: level ?? 1, name })
      : t("ui.toast.shipped", { name, payout: formatMoney(payout) }),
    "gold"
  );
});

let unlockToastFrame: number | undefined;
const pendingUnlockNames: string[] = [];

function flushUnlockToasts(): void {
  unlockToastFrame = undefined;
  const names = Array.from(new Set(pendingUnlockNames.splice(0)));
  if (names.length === 0) {
    return;
  }

  audio.play("unlock");
  app.showToast(
    names.length === 1
      ? t("ui.toast.unlock", { name: names[0] ?? "" })
      : t("ui.toast.unlockMany", { names: names.join(", ") }),
    "accent"
  );
}

bus.on("unlock", ({ id, kind }) => {
  pendingUnlockNames.push(viewModels.getUnlockToastName(kind, id));
  unlockToastFrame ??= window.requestAnimationFrame(flushUnlockToasts);
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
window.__VIBECODER_HANDLE_CLOSE_REQUEST__ = () => {
  void persistNow().finally(() => {
    platform.quit?.();
  });
};

startVibecoderLoop({
  app: () => app,
  bus,
  cache,
  catchUp(elapsedMs): void {
    offlineSummary = applyOfflineOnReturn(Date.now(), elapsedMs);
    updateVisibleView();
    void persistNow();
  },
  devPerfPanel,
  getState: () => state,
  invalidation,
  updateVisibleView
});

function scheduleAutosave(): void {
  persistence.scheduleAutosave();
}

async function persistNow(): Promise<boolean> {
  return persistence.persistNow();
}

function installState(nextState: typeof state): void {
  state = nextState;
  syncSceneAfterLoad();
  ensureProjectBoard(state);
  recomputeDerivedCache(state, cache);
  audio.setSettings(state.settings);
  offlineSummary = undefined;
  resetVibexTransientState();
  comms.markDirty();
  scheduleAutosave();
  invalidation.markStructuralChanged();
  updateVisibleView();
}

function resetVibexTransientState(): void {
  vibexSession.reset(state.vibex);
  syncVibexSeeds();
}

function syncVibexSeeds(): void {
  vibexSession.syncSeeds(state.vibex);
}

function recordInitialSaveDiagnostics(): void {
  if (!loaded.repaired) {
    return;
  }

  if (loaded.warnings.some((warning) => warning.includes("restored from backup"))) {
    state.stats["save.restoredAt"] = state.meta.lastSeen;
  } else {
    state.stats["save.repairedAt"] = state.meta.lastSeen;
  }
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

  openWindow(state.ui.windows, appId, comms.getNotificationWindowBounds());
  comms.markAppRead(appId);
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

function applyOfflineOnReturn(
  nowMs: number,
  maxElapsedMs?: number
): OfflineProgressResult | undefined {
  const effectiveNowMs =
    maxElapsedMs === undefined
      ? nowMs
      : Math.min(nowMs, state.meta.lastSimTickMs + Math.max(0, maxElapsedMs));
  if (effectiveNowMs - state.meta.lastSimTickMs <= OFFLINE_THRESHOLD_MS) {
    return undefined;
  }

  const result = applyOfflineProgress(state, cache, nowMs, maxElapsedMs);
  return result.elapsedS > 0 ? result : undefined;
}

function updateVisibleView(): void {
  app.updateDevFloor(viewModels.createDevFloorView(cache));
}

function flushActionInvalidation(): void {
  flushViewInvalidation(invalidation, {
    recomputeCache(): void {
      recomputeDerivedCache(state, cache);
    },
    updateView(): void {
      updateVisibleView();
    }
  });
}

function remountVisibleView(): void {
  app.destroy();
  viewModels.reset();
  app = mountApp(appRoot, viewModels.createDevFloorView(cache, true), appActions);
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
  comms.markDirty();
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
