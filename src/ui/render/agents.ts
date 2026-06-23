import { setText, el, text } from "../dom";
import { t } from "../../i18n/i18n";
import type {
  AppActions,
  AutomationToggleView,
  ComputeBreakdownView,
  ComputeRowView,
  DevFloorView,
  FullGameView,
  GeneratorRowView
} from "./view-types";

interface ComputeBreakdownNodes {
  readonly cap: Text;
  readonly list: HTMLElement;
  readonly remaining: Text;
  readonly used: Text;
}

interface ComputeRowNodes {
  readonly name: Text;
  readonly root: HTMLElement;
  readonly used: Text;
}

interface GeneratorRowNodes {
  readonly buy1: HTMLButtonElement;
  readonly buy10: HTMLButtonElement;
  readonly buyMax: HTMLButtonElement;
  readonly cost1: Text;
  readonly cost10: Text;
  readonly milestone: Text;
  readonly milestoneBar: HTMLElement;
  readonly name: Text;
  readonly owned: Text;
  readonly rate: Text;
  readonly root: HTMLElement;
}

interface AutomationToggleNodes {
  readonly checkbox: HTMLInputElement;
  readonly detail: Text;
  readonly root: HTMLElement;
}

interface FullGameNodes {
  readonly root: HTMLElement;
}

const generatorRows = new Map<string, GeneratorRowNodes>();
const computeRows = new Map<string, ComputeRowNodes>();
const automationToggles = new Map<string, AutomationToggleNodes>();
let computeBreakdownNodes: ComputeBreakdownNodes | undefined;
let fullGameNodes: FullGameNodes | undefined;

export function resetAgentsRenderCache(): void {
  generatorRows.clear();
  computeRows.clear();
  automationToggles.clear();
  computeBreakdownNodes = undefined;
  fullGameNodes = undefined;
}

export function createAgentsScreen(view: DevFloorView, actions: AppActions): HTMLElement {
  const screen = el("section", { className: "main-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.agents")));

  const fullGame = createFullGamePanel(view.fullGame, actions);
  const compute = createComputeBreakdown(view.compute);
  const agentList = el("section", { className: "agent-list" });
  const header = el("div", { className: "agent-list__header" });
  header.append(
    createColumnLabel("ui.devfloor.agent"),
    createColumnLabel("ui.devfloor.owned"),
    createColumnLabel("ui.devfloor.rate"),
    createColumnLabel("ui.devfloor.cost"),
    createColumnLabel("ui.devfloor.milestone"),
    createColumnLabel("ui.devfloor.buy")
  );

  agentList.append(header);

  for (const generator of view.generators) {
    agentList.append(createGeneratorRow(generator, actions));
  }

  const automationTitle = el("h2", { className: "section-title" });
  automationTitle.append(text(t("ui.devfloor.automation")));
  const automationList = el("section", { className: "automation-list" });

  for (const rule of view.automation) {
    automationList.append(createAutomationToggle(rule, actions));
  }

  screen.append(title, fullGame, compute, agentList, automationTitle, automationList);
  return screen;
}

export function syncGeneratorRows(
  views: readonly GeneratorRowView[],
  screen: HTMLElement,
  actions: AppActions
): void {
  const list = screen.querySelector<HTMLElement>(".agent-list");
  const visibleIds = new Set(views.map((view) => view.id));

  if (list !== null) {
    for (const view of views) {
      if (!generatorRows.has(view.id)) {
        list.append(createGeneratorRow(view, actions));
      }
    }
  }

  for (const view of views) {
    updateGeneratorRow(view);
  }

  for (const [id, row] of generatorRows) {
    row.root.hidden = !visibleIds.has(id);
  }
}

export function updateComputeBreakdown(view: ComputeBreakdownView): void {
  if (computeBreakdownNodes === undefined) {
    return;
  }

  setText(computeBreakdownNodes.used, view.used);
  setText(computeBreakdownNodes.cap, view.cap);
  setText(computeBreakdownNodes.remaining, view.remaining);

  const visibleIds = new Set<string>();
  for (const row of view.rows) {
    visibleIds.add(row.id);
    let nodes = computeRows.get(row.id);

    if (nodes === undefined) {
      computeBreakdownNodes.list.append(createComputeRow(row));
      nodes = computeRows.get(row.id);
    }

    if (nodes !== undefined) {
      nodes.root.hidden = false;
      setText(nodes.name, row.name);
      setText(nodes.used, row.used);
    }
  }

  for (const [id, nodes] of computeRows) {
    nodes.root.hidden = !visibleIds.has(id);
  }
}

export function syncAutomationToggles(
  views: readonly AutomationToggleView[],
  screen: HTMLElement,
  actions: AppActions
): void {
  const list = screen.querySelector<HTMLElement>(".automation-list");

  if (list !== null) {
    const missingIds = new Set(getMissingAutomationToggleIds(views, automationToggles.keys()));

    for (const view of views) {
      if (missingIds.has(view.id)) {
        list.append(createAutomationToggle(view, actions));
      }
    }
  }

  for (const view of views) {
    updateAutomationToggle(view);
  }
}

export function getMissingAutomationToggleIds(
  views: readonly Pick<AutomationToggleView, "id">[],
  existingIds: Iterable<string>
): string[] {
  const existing = new Set(existingIds);
  return views.filter((view) => !existing.has(view.id)).map((view) => view.id);
}

export function updateFullGame(view: FullGameView): void {
  if (fullGameNodes === undefined) {
    return;
  }

  fullGameNodes.root.hidden = !view.visible;
}

function createComputeBreakdown(view: ComputeBreakdownView): HTMLElement {
  const section = el("section", { className: "compute-breakdown" });
  const title = el("h2", { className: "section-title" });
  title.append(text(t("ui.agents.compute")));
  const summary = el("div", { className: "compute-breakdown__summary" });
  const used = text(view.used);
  const cap = text(view.cap);
  const remaining = text(view.remaining);
  summary.append(
    createComputeMetric("ui.agents.computeUsed", used),
    createComputeMetric("ui.agents.computeCap", cap),
    createComputeMetric("ui.agents.computeRemaining", remaining)
  );

  const list = el("section", { className: "compute-breakdown__list" });
  for (const row of view.rows) {
    list.append(createComputeRow(row));
  }

  computeBreakdownNodes = { cap, list, remaining, used };
  section.append(title, summary, list);
  return section;
}

function createComputeMetric(labelKey: string, value: Text): HTMLElement {
  const metric = el("span", { className: "compute-breakdown__metric" });
  const label = el("span", { className: "compute-breakdown__label" });
  label.append(text(t(labelKey)));
  const number = el("strong", { className: "compute-breakdown__value" });
  number.append(value);
  metric.append(label, number);
  return metric;
}

function createComputeRow(view: ComputeRowView): HTMLElement {
  const root = el("div", { className: "compute-breakdown__row" });
  const name = text(view.name);
  const used = text(view.used);
  const nameNode = el("span", { className: "compute-breakdown__agent" });
  const usedNode = el("strong", { className: "compute-breakdown__used" });
  nameNode.append(name);
  usedNode.append(used);
  root.append(nameNode, usedNode);
  computeRows.set(view.id, { name, root, used });
  return root;
}

function createFullGamePanel(view: FullGameView, actions: AppActions): HTMLElement {
  const root = el("section", { className: "full-game-panel" });
  const title = el("h2", { className: "full-game-panel__title" });
  title.append(text(t("ui.demo.fullGameTitle")));
  const copy = el("p", { className: "full-game-panel__copy" });
  copy.append(text(t("ui.demo.fullGameCopy")));
  const exportArea = el("textarea", { className: "full-game-panel__textarea" });
  exportArea.readOnly = true;
  exportArea.placeholder = t("ui.demo.exportPlaceholder");
  const exportButton = createSettingsButton("ui.demo.exportSave", () => {
    exportArea.value = actions.exportSave();
    exportArea.select();
  });

  root.append(title, copy, exportArea, exportButton);
  fullGameNodes = { root };
  updateFullGame(view);
  return root;
}

function createGeneratorRow(view: GeneratorRowView, actions: AppActions): HTMLElement {
  const root = el("div", { className: "agent-row" });
  root.dataset.generatorId = view.id;
  const name = el("strong", { className: "agent-row__name" });
  const nameText = text(view.name);
  name.append(nameText);

  const owned = text(view.owned);
  const rate = text(view.rate);
  const cost1 = text(view.cost1);
  const cost10 = text(view.cost10);
  const milestone = text(view.milestoneLabel);
  const milestoneTrack = el("div", { className: "agent-row__milestone-track" });
  const milestoneBar = el("div", { className: "agent-row__milestone-bar" });
  milestoneTrack.append(milestoneBar);

  const buy1 = createBuyButton("ui.devfloor.buy1", () => actions.buyGenerator(view.id, 1));
  const buy10 = createBuyButton("ui.devfloor.buy10", () => actions.buyGenerator(view.id, 10));
  const buyMax = createBuyButton("ui.devfloor.buyMax", () => actions.buyGenerator(view.id, "max"));

  root.append(
    name,
    createValueCell(owned),
    createValueCell(rate),
    createCostCell(cost1, cost10),
    createMilestoneCell(milestone, milestoneTrack),
    createButtonCell(buy1, buy10, buyMax)
  );

  generatorRows.set(view.id, {
    buy1,
    buy10,
    buyMax,
    cost1,
    cost10,
    milestone,
    milestoneBar,
    name: nameText,
    owned,
    rate,
    root
  });
  updateGeneratorRow(view);

  return root;
}

function createAutomationToggle(view: AutomationToggleView, actions: AppActions): HTMLElement {
  const root = el("label", { className: "automation-toggle" });
  const checkbox = el("input", { className: "automation-toggle__checkbox" });
  checkbox.type = "checkbox";
  checkbox.addEventListener("change", () => {
    actions.toggleAutomation(view.id, checkbox.checked);
  });

  const copy = el("span", { className: "automation-toggle__copy" });
  const label = el("strong", { className: "automation-toggle__label" });
  label.append(text(view.label));
  const detail = text(view.detail);
  const detailNode = el("span", { className: "automation-toggle__detail" });
  detailNode.append(detail);
  copy.append(label, detailNode);
  root.append(checkbox, copy);
  automationToggles.set(view.id, { checkbox, detail, root });
  updateAutomationToggle(view);
  return root;
}

function updateGeneratorRow(view: GeneratorRowView): void {
  const row = generatorRows.get(view.id);

  if (row === undefined) {
    return;
  }

  row.root.classList.toggle("agent-row--locked", view.locked);
  setText(row.name, view.name);
  setText(row.owned, view.owned);
  setText(row.rate, view.rate);
  setText(row.cost1, view.cost1);
  setText(row.cost10, view.cost10);
  setText(row.milestone, view.milestoneLabel);
  row.milestoneBar.style.transform = `scaleX(${view.milestoneProgress.toFixed(3)})`;
  updateButton(row.buy1, view.canBuy1, view.buy1Title);
  updateButton(row.buy10, view.canBuy10, view.buy10Title);
  updateButton(row.buyMax, view.canBuyMax, view.buyMaxTitle);
}

function updateAutomationToggle(view: AutomationToggleView): void {
  const nodes = automationToggles.get(view.id);

  if (nodes === undefined) {
    return;
  }

  setText(nodes.detail, view.detail);
  nodes.checkbox.disabled = view.disabled;
  nodes.root.classList.toggle("automation-toggle--locked", view.disabled);

  if (document.activeElement !== nodes.checkbox) {
    nodes.checkbox.checked = view.enabled;
  }
}

function createColumnLabel(labelKey: string): HTMLElement {
  const label = el("span", { className: "agent-list__label" });
  label.append(text(t(labelKey)));
  return label;
}

function createValueCell(value: Text): HTMLElement {
  const cell = el("span", { className: "agent-row__value" });
  cell.append(value);
  return cell;
}

function createCostCell(cost1: Text, cost10: Text): HTMLElement {
  const cell = el("span", { className: "agent-row__cost" });
  const separator = el("span", { className: "agent-row__cost-separator" });
  separator.append(text(t("ui.devfloor.costSeparator")));
  cell.append(cost1, separator, cost10);
  return cell;
}

function createMilestoneCell(label: Text, track: HTMLElement): HTMLElement {
  const cell = el("span", { className: "agent-row__milestone" });
  const labelNode = el("span", { className: "agent-row__milestone-label" });
  labelNode.append(label);
  cell.append(labelNode, track);
  return cell;
}

function createButtonCell(...buttons: HTMLButtonElement[]): HTMLElement {
  const cell = el("span", { className: "agent-row__buttons" });
  cell.append(...buttons);
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

function updateButton(button: HTMLButtonElement, enabled: boolean, title: string): void {
  button.disabled = !enabled;
  button.title = title;
}
