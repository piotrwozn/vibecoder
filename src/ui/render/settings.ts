import { t } from "../../i18n/i18n";
import { el, setText, text } from "../dom";
import type { AppActions, SettingsNotation, SettingsView } from "./view-types";

interface SettingsNodes {
  readonly autosaveS: HTMLInputElement;
  readonly downloadVibexModel: HTMLButtonElement;
  readonly doNotDisturb: HTMLInputElement;
  readonly glitch: HTMLInputElement;
  readonly localAiProgress: Text;
  readonly localAiStatus: Text;
  readonly notation: HTMLSelectElement;
  readonly reducedFx: HTMLInputElement;
  readonly saveBackupCount: Text;
  readonly saveEdition: Text;
  readonly saveLastAutosave: Text;
  readonly saveStatus: Text;
  readonly saveVersion: Text;
  readonly skipIntro: HTMLInputElement;
  readonly sound: HTMLInputElement;
  readonly vibexLocalAi: HTMLInputElement;
  readonly volume: HTMLInputElement;
}

let settingsNodes: SettingsNodes | undefined;

export function resetSettingsRenderCache(): void {
  settingsNodes = undefined;
}

export function createSettingsScreen(view: SettingsView, actions: AppActions): HTMLElement {
  const screen = el("section", { className: "main-screen settings-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.settings")));

  const langValue = el("span", { className: "settings-control__value" });
  langValue.append(text(t("ui.boot.languageValue", { lang: view.lang.toUpperCase() })));

  const notation = el("select", { className: "settings-control__field" });
  notation.append(
    createOption("sci", "ui.settings.notationSci"),
    createOption("suffix", "ui.settings.notationSuffix")
  );
  notation.value = view.notation;
  notation.addEventListener("change", () => {
    actions.changeNotation(notation.value === "suffix" ? "suffix" : "sci");
  });

  const autosaveS = el("input", { className: "settings-control__field" });
  autosaveS.type = "number";
  autosaveS.value = view.autosaveS;
  autosaveS.defaultValue = view.autosaveS;
  autosaveS.addEventListener("change", () => {
    const seconds = Number(autosaveS.value);

    if (Number.isFinite(seconds) && seconds >= 1) {
      actions.changeAutosaveS(Math.trunc(seconds));
    } else {
      autosaveS.value = autosaveS.defaultValue;
    }
  });

  const sound = el("input", { className: "settings-control__checkbox" });
  sound.type = "checkbox";
  sound.checked = view.sound;
  sound.addEventListener("change", () => {
    actions.changeSound(sound.checked);
  });

  const doNotDisturb = el("input", { className: "settings-control__checkbox" });
  doNotDisturb.type = "checkbox";
  doNotDisturb.checked = view.doNotDisturb;
  doNotDisturb.addEventListener("change", () => {
    actions.changeDoNotDisturb(doNotDisturb.checked);
  });

  const volume = el("input", { className: "settings-control__field" });
  volume.type = "range";
  volume.min = "0";
  volume.max = "1";
  volume.step = "0.01";
  volume.value = view.volume;
  volume.defaultValue = view.volume;
  volume.addEventListener("input", () => {
    const value = Number(volume.value);

    if (Number.isFinite(value)) {
      actions.changeVolume(value);
    }
  });

  const reducedFx = el("input", { className: "settings-control__checkbox" });
  reducedFx.type = "checkbox";
  reducedFx.checked = view.reducedFx;
  reducedFx.addEventListener("change", () => {
    actions.changeReducedFx(reducedFx.checked);
  });

  const glitch = el("input", { className: "settings-control__checkbox" });
  glitch.type = "checkbox";
  glitch.checked = view.glitch;
  glitch.addEventListener("change", () => {
    actions.changeGlitch(glitch.checked);
  });

  const skipIntro = el("input", { className: "settings-control__checkbox" });
  skipIntro.type = "checkbox";
  skipIntro.checked = view.skipIntro;
  skipIntro.addEventListener("change", () => {
    actions.changeSkipIntro(skipIntro.checked);
  });

  const vibexLocalAi = el("input", { className: "settings-control__checkbox" });
  vibexLocalAi.type = "checkbox";
  vibexLocalAi.checked = view.vibexLocalAi;
  vibexLocalAi.addEventListener("change", () => {
    actions.changeVibexLocalAi(vibexLocalAi.checked);
  });

  const localAiStatus = text(view.localAiStatus);
  const localAiStatusValue = el("span", { className: "settings-control__value" });
  localAiStatusValue.append(localAiStatus);

  const localAiProgress = text(
    t("ui.settings.vibexModelMeta", {
      progress: view.localAiProgress,
      size: view.localAiModelSize
    })
  );
  const localAiProgressValue = el("span", { className: "settings-control__value" });
  localAiProgressValue.append(localAiProgress);

  const downloadVibexModel = createSettingsButton("ui.settings.vibexDownloadModel", () => {
    actions.downloadVibexModel();
  });
  downloadVibexModel.disabled = !view.localAiCanDownload;

  const licenseNote = el("p", { className: "settings-note" });
  licenseNote.append(text(t("ui.settings.vibexLicense")));

  const wipeCheck = el("input", { className: "settings-control__checkbox" });
  wipeCheck.type = "checkbox";
  const wipeButton = createSettingsButton("ui.settings.wipe", () => {
    if (wipeCheck.checked) {
      actions.wipeSave();
      wipeCheck.checked = false;
    }
  });
  const resetWindowsButton = createSettingsButton("ui.settings.resetWindows", () => {
    actions.resetWindowLayout();
  });
  const replayTutorialButton = createSettingsButton("ui.settings.replayTutorial", () => {
    actions.replayTutorial();
  });
  const quitButton = createSettingsButton("ui.settings.quitToTitle", () => {
    actions.quitToTitle();
  });

  const controls = el("section", { className: "settings-list" });
  controls.append(
    createSettingsControl("ui.settings.language", langValue),
    createSettingsControl("ui.settings.notation", notation),
    createSettingsControl("ui.settings.autosave", autosaveS),
    createSettingsControl("ui.settings.sound", sound),
    createSettingsControl("ui.settings.doNotDisturb", doNotDisturb),
    createSettingsControl("ui.settings.volume", volume),
    createSettingsControl("ui.settings.reducedFx", reducedFx),
    createSettingsControl("ui.settings.glitch", glitch),
    createSettingsControl("ui.settings.skipIntro", skipIntro),
    createSettingsControl("ui.settings.vibexLocalAi", vibexLocalAi),
    createSettingsControl("ui.settings.vibexAiStatus", localAiStatusValue),
    createSettingsControl("ui.settings.vibexModel", localAiProgressValue),
    createSettingsControl("ui.settings.vibexDownload", downloadVibexModel),
    createSettingsControl("ui.settings.wipeConfirm", wipeCheck)
  );

  const saveVersion = text(view.save.version);
  const saveEdition = text(view.save.edition);
  const saveLastAutosave = text(view.save.lastAutosave);
  const saveBackupCount = text(view.save.backupCount);
  const saveStatus = text(view.save.status);
  const savePanel = el("section", { className: "settings-save" });
  const saveTitle = el("h2", { className: "section-title" });
  saveTitle.append(text(t("ui.settings.saveDiagnostics")));
  const saveGrid = el("div", { className: "settings-save__grid" });
  saveGrid.append(
    createSettingsValue("ui.settings.saveVersion", saveVersion),
    createSettingsValue("ui.settings.saveEdition", saveEdition),
    createSettingsValue("ui.settings.saveLastAutosave", saveLastAutosave),
    createSettingsValue("ui.settings.saveBackups", saveBackupCount),
    createSettingsValue("ui.settings.saveStatus", saveStatus)
  );
  const exportArea = el("textarea", { className: "settings-save__textarea" });
  exportArea.placeholder = t("ui.settings.exportPlaceholder");
  const importArea = el("textarea", { className: "settings-save__textarea" });
  importArea.placeholder = t("ui.settings.importPlaceholder");
  const exportButton = createSettingsButton("ui.settings.exportSave", () => {
    exportArea.value = actions.exportSave();
    exportArea.select();
  });
  const importButton = createSettingsButton("ui.settings.importSave", () => {
    actions.importSave(importArea.value);
  });
  const saveButtons = el("div", { className: "settings-actions__buttons" });
  saveButtons.append(exportButton, importButton);
  savePanel.append(saveTitle, saveGrid, exportArea, importArea, saveButtons);

  const actionsPanel = el("section", { className: "settings-actions" });
  const actionsTitle = el("h2", { className: "section-title" });
  actionsTitle.append(text(t("ui.settings.gameControls")));
  const actionsRow = el("div", { className: "settings-actions__buttons" });
  actionsRow.append(resetWindowsButton, replayTutorialButton, quitButton, wipeButton);
  actionsPanel.append(actionsTitle, actionsRow);

  settingsNodes = {
    autosaveS,
    downloadVibexModel,
    doNotDisturb,
    glitch,
    localAiProgress,
    localAiStatus,
    notation,
    reducedFx,
    saveBackupCount,
    saveEdition,
    saveLastAutosave,
    saveStatus,
    saveVersion,
    skipIntro,
    sound,
    vibexLocalAi,
    volume
  };
  screen.append(title, controls, licenseNote, savePanel, actionsPanel);
  return screen;
}

export function updateSettings(view: SettingsView): void {
  if (settingsNodes === undefined) {
    return;
  }

  const activeElement = document.activeElement;
  updateEditableSettingValue(
    settingsNodes.autosaveS,
    view.autosaveS,
    activeElement === settingsNodes.autosaveS
  );

  if (activeElement !== settingsNodes.notation) {
    settingsNodes.notation.value = view.notation;
  }

  if (activeElement !== settingsNodes.sound) {
    settingsNodes.sound.checked = view.sound;
  }

  if (activeElement !== settingsNodes.doNotDisturb) {
    settingsNodes.doNotDisturb.checked = view.doNotDisturb;
  }

  if (activeElement !== settingsNodes.glitch) {
    settingsNodes.glitch.checked = view.glitch;
  }

  if (activeElement !== settingsNodes.skipIntro) {
    settingsNodes.skipIntro.checked = view.skipIntro;
  }

  if (activeElement !== settingsNodes.vibexLocalAi) {
    settingsNodes.vibexLocalAi.checked = view.vibexLocalAi;
  }

  setText(settingsNodes.localAiStatus, view.localAiStatus);
  setText(settingsNodes.saveBackupCount, view.save.backupCount);
  setText(settingsNodes.saveEdition, view.save.edition);
  setText(settingsNodes.saveLastAutosave, view.save.lastAutosave);
  setText(settingsNodes.saveStatus, view.save.status);
  setText(settingsNodes.saveVersion, view.save.version);
  setText(
    settingsNodes.localAiProgress,
    t("ui.settings.vibexModelMeta", {
      progress: view.localAiProgress,
      size: view.localAiModelSize
    })
  );
  settingsNodes.downloadVibexModel.disabled = !view.localAiCanDownload;

  updateEditableSettingValue(
    settingsNodes.volume,
    view.volume,
    activeElement === settingsNodes.volume
  );

  if (activeElement !== settingsNodes.reducedFx) {
    settingsNodes.reducedFx.checked = view.reducedFx;
  }
}

export function updateEditableSettingValue(
  input: { defaultValue: string; value: string },
  value: string,
  focused: boolean
): void {
  input.defaultValue = value;

  if (!focused) {
    input.value = value;
  }
}

function createSettingsButton(labelKey: string, onClick: () => void): HTMLButtonElement {
  const button = el("button", { className: "settings-button" });
  button.type = "button";
  button.append(text(t(labelKey)));
  button.addEventListener("click", onClick);
  return button;
}

function createSettingsControl(labelKey: string, control: HTMLElement): HTMLElement {
  const root = el("label", { className: "settings-control" });
  const label = el("span", { className: "settings-control__label" });
  label.append(text(t(labelKey)));
  root.append(label, control);
  return root;
}

function createSettingsValue(labelKey: string, value: Text): HTMLElement {
  const root = el("div", { className: "settings-save__value" });
  const label = el("span", { className: "settings-control__label" });
  label.append(text(t(labelKey)));
  const output = el("strong", { className: "settings-control__value" });
  output.append(value);
  root.append(label, output);
  return root;
}

function createOption(value: SettingsNotation, labelKey: string): HTMLOptionElement {
  const option = el("option");
  option.value = value;
  option.append(text(t(labelKey)));
  return option;
}
