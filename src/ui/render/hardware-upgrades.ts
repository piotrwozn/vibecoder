import { setText, el, text } from "../dom";
import { t } from "../../i18n/i18n";
import type { AppActions, AuroraView, HardwareRowView, UpgradeRowView } from "./view-types";

interface HardwareRowNodes {
  readonly buy: HTMLButtonElement;
  readonly cap: Text;
  readonly cost: Text;
  readonly level: Text;
  readonly power: Text;
  readonly requirement: Text;
  readonly root: HTMLElement;
  readonly slot: Text;
}

interface HardwareAuroraCounterNodes {
  readonly root: HTMLElement;
  readonly value: Text;
}

interface UpgradeRowNodes {
  readonly button: HTMLButtonElement;
  readonly cost: Text;
  readonly effect: Text;
  readonly root: HTMLElement;
  readonly state: Text;
}

const hardwareRows = new Map<string, HardwareRowNodes>();
const upgradeRows = new Map<string, UpgradeRowNodes>();
let hardwareAuroraCounterNodes: HardwareAuroraCounterNodes | undefined;

export function resetHardwareUpgradeRenderCache(): void {
  hardwareRows.clear();
  upgradeRows.clear();
  hardwareAuroraCounterNodes = undefined;
}

export function createHardwareScreen(
  view: readonly HardwareRowView[],
  aurora: AuroraView,
  actions: AppActions
): HTMLElement {
  const screen = el("section", { className: "main-screen hardware-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.hardware")));
  const auroraCounter = createHardwareAuroraCounter(aurora);
  const pcRows = view.filter((hardware) => hardware.phase === "pc");
  const serverRows = view.filter((hardware) => hardware.phase === "server");
  const pcSection = createHardwareSection("pc", pcRows, actions);
  const serverSection = createHardwareSection("server", serverRows, actions);
  serverSection.hidden = serverRows.length === 0;

  screen.append(title, auroraCounter, pcSection, serverSection);
  return screen;
}

export function createUpgradesScreen(
  view: readonly UpgradeRowView[],
  actions: AppActions
): HTMLElement {
  const screen = el("section", { className: "main-screen upgrades-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.upgrades")));
  const upgradeList = el("section", { className: "upgrade-list" });

  for (const upgrade of view) {
    upgradeList.append(createUpgradeRow(upgrade, actions));
  }

  screen.append(title, upgradeList);
  return screen;
}

export function syncHardwareRows(
  views: readonly HardwareRowView[],
  screen: HTMLElement,
  actions: AppActions
): void {
  const visibleIds = new Set(views.map((view) => view.id));
  const phases: readonly HardwareRowView["phase"][] = ["pc", "server"];

  for (const phase of phases) {
    const phaseRows = views.filter((view) => view.phase === phase);
    const section = screen.querySelector<HTMLElement>(`.hardware-section[data-phase="${phase}"]`);
    const list = screen.querySelector<HTMLElement>(`.hardware-list[data-phase="${phase}"]`);

    if (section !== null) {
      section.hidden = phase === "server" && phaseRows.length === 0;
    }

    if (list !== null) {
      for (const view of phaseRows) {
        if (!hardwareRows.has(view.id)) {
          list.append(createHardwareRow(view, actions));
        }
      }
    }
  }

  for (const view of views) {
    updateHardwareRow(view);
  }

  for (const [id, row] of hardwareRows) {
    row.root.hidden = !visibleIds.has(id);
  }
}

export function updateHardwareAuroraCounter(view: AuroraView): void {
  if (hardwareAuroraCounterNodes === undefined) {
    return;
  }

  hardwareAuroraCounterNodes.root.hidden = !view.unlocked || view.readyServerCount <= 0;
  setText(hardwareAuroraCounterNodes.value, view.readyServers);
}

export function syncUpgradeRows(
  views: readonly UpgradeRowView[],
  screen: HTMLElement,
  actions: AppActions
): void {
  const list = screen.querySelector<HTMLElement>(".upgrade-list");
  const visibleIds = new Set(views.map((view) => view.id));

  if (list !== null) {
    for (const view of views) {
      if (!upgradeRows.has(view.id)) {
        list.append(createUpgradeRow(view, actions));
      }
    }
  }

  for (const view of views) {
    updateUpgradeRow(view);
  }

  for (const [id, row] of upgradeRows) {
    row.root.hidden = !visibleIds.has(id);
  }
}

function createHardwareAuroraCounter(view: AuroraView): HTMLElement {
  const root = el("div", { className: "hardware-aurora-counter" });
  const label = el("span", { className: "project-meta__label" });
  label.append(text(t("ui.hardware.auroraReady")));
  const value = text(view.readyServers);
  const output = el("strong", { className: "project-meta__value" });
  output.append(value);
  root.append(label, output);
  hardwareAuroraCounterNodes = { root, value };
  updateHardwareAuroraCounter(view);
  return root;
}

function createHardwareSection(
  phase: HardwareRowView["phase"],
  rows: readonly HardwareRowView[],
  actions: AppActions
): HTMLElement {
  const section = el("section", { className: "hardware-section" });
  section.dataset.phase = phase;
  const title = el("h2", { className: "section-title hardware-section__title" });
  title.append(text(t(phase === "pc" ? "ui.hardware.pcTitle" : "ui.hardware.serverTitle")));
  const list = el("section", { className: "hardware-list" });
  list.dataset.phase = phase;

  for (const row of rows) {
    list.append(createHardwareRow(row, actions));
  }

  section.append(title, list);
  return section;
}

function createHardwareRow(view: HardwareRowView, actions: AppActions): HTMLElement {
  const root = el("div", { className: "hardware-row" });
  const name = el("strong", { className: "hardware-row__name" });
  name.append(text(view.name));
  const slot = text(view.slotLabel);
  const level = text(view.levelLabel);
  const cost = text(view.cost);
  const capText = text(view.capAdd);
  const powerText = text(view.powerCost);
  const requirementText = text(view.psuRequirement);
  const detail = el("span", { className: "hardware-row__detail" });
  const cap = el("span", { className: "hardware-row__cap" });
  const power = el("span", { className: "hardware-row__power" });
  const requirement = el("span", { className: "hardware-row__requirement" });
  cap.append(capText);
  power.append(powerText);
  requirement.append(requirementText);
  detail.append(cap, power, requirement);
  const buy = createBuyButton("ui.devfloor.buy1", () => actions.buyHardware(view.id));

  root.append(
    name,
    createValueCell(slot),
    createValueCell(level),
    createValueCell(cost),
    detail,
    buy
  );
  hardwareRows.set(view.id, {
    buy,
    cap: capText,
    cost,
    level,
    power: powerText,
    requirement: requirementText,
    root,
    slot
  });
  updateHardwareRow(view);
  return root;
}

function createUpgradeRow(view: UpgradeRowView, actions: AppActions): HTMLElement {
  const root = el("div", { className: "upgrade-row" });
  root.dataset.upgradeId = view.id;
  const name = el("strong", { className: "upgrade-row__name" });
  name.append(text(view.name));
  const effect = text(view.effect);
  const cost = text(view.cost);
  const state = text(view.stateLabel);
  const button = createBuyButton("ui.devfloor.buy", () => actions.buyUpgrade(view.id));

  root.append(name, createValueCell(effect), createValueCell(cost), createValueCell(state), button);
  upgradeRows.set(view.id, { button, cost, effect, root, state });
  updateUpgradeRow(view);
  return root;
}

function updateHardwareRow(view: HardwareRowView): void {
  const row = hardwareRows.get(view.id);

  if (row === undefined) {
    return;
  }

  row.root.dataset.phase = view.phase;
  row.root.dataset.slot = view.slot;
  row.root.classList.toggle("hardware-row--active", view.active);
  row.root.classList.toggle("hardware-row--enclosure", view.isEnclosure);
  setText(row.slot, view.slotLabel);
  setText(row.level, view.levelLabel);
  setText(row.cost, view.cost);
  setText(row.cap, view.capAdd);
  setText(row.power, view.powerCost);
  setText(row.requirement, view.psuRequirement);
  if (row.requirement.parentElement !== null) {
    row.requirement.parentElement.hidden = view.psuRequirement === "";
  }
  row.root.classList.toggle("hardware-row--blocked", view.psuRequirement !== "");
  row.buy.disabled = !view.canBuy;
}

function updateUpgradeRow(view: UpgradeRowView): void {
  const row = upgradeRows.get(view.id);

  if (row === undefined) {
    return;
  }

  setText(row.effect, view.effect);
  setText(row.cost, view.cost);
  setText(row.state, view.stateLabel);
  row.root.dataset.state = view.state;
  row.button.disabled = !view.canBuy;
}

function createValueCell(value: Text): HTMLElement {
  const cell = el("span", { className: "agent-row__value" });
  cell.append(value);
  return cell;
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
