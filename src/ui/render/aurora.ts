import { setText, el, text } from "../dom";
import { t } from "../../i18n/i18n";
import type { AppActions, AuroraNodeView, AuroraView } from "./view-types";

interface AuroraNodes {
  readonly availableServers: Text;
  readonly costLoc: Text;
  readonly costMoney: Text;
  readonly dedicate: HTMLButtonElement;
  readonly dedicatedServers: Text;
  readonly fund: HTMLButtonElement;
  readonly host: HTMLButtonElement;
  readonly hostedServers: Text;
  readonly hostingRate: Text;
  readonly phaseName: Text;
  readonly progressBar: HTMLElement;
  readonly progressLabel: Text;
  readonly readyServers: Text;
  readonly releaseHost: HTMLButtonElement;
  readonly requiredServers: Text;
  readonly status: Text;
  readonly timeRemaining: Text;
}

interface AuroraNodeNodes {
  readonly root: HTMLElement;
  readonly state: Text;
}

const auroraNodeRows = new Map<string, AuroraNodeNodes>();
let auroraNodes: AuroraNodes | undefined;

export function resetAuroraRenderCache(): void {
  auroraNodeRows.clear();
  auroraNodes = undefined;
}

export function createAuroraScreen(view: AuroraView, actions: AppActions): HTMLElement {
  const screen = el("section", { className: "main-screen aurora-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.aurora")));

  const progressLabel = text(view.progressLabel);
  const progressBar = el("div", { className: "aurora-progress__bar" });
  const progressFill = el("div", { className: "aurora-progress__fill" });
  progressFill.style.transform = `scaleX(${view.progress.toFixed(3)})`;
  progressBar.append(progressFill);
  const progress = el("section", { className: "aurora-progress" });
  progress.append(progressLabel, progressBar);

  const phaseName = text(view.phaseName);
  const status = text(view.statusLabel);
  const costLoc = text(view.costLoc);
  const costMoney = text(view.costMoney);
  const timeRemaining = text(view.timeRemaining);
  const requiredServers = text(view.requiredServers);
  const availableServers = text(view.availableServers);
  const readyServers = text(view.readyServers);
  const dedicatedServers = text(view.dedicatedServers);
  const hostedServers = text(view.hostedServers);
  const hostingRate = text(view.hostingRate);

  const summary = el("section", { className: "aurora-summary" });
  summary.append(
    createProjectMeta("ui.aurora.phase", phaseName),
    createProjectMeta("ui.aurora.status", status),
    createProjectMeta("ui.aurora.costLoc", costLoc),
    createProjectMeta("ui.aurora.costMoney", costMoney),
    createProjectMeta("ui.aurora.time", timeRemaining),
    createProjectMeta("ui.aurora.requiredServers", requiredServers),
    createProjectMeta("ui.aurora.availableServers", availableServers),
    createProjectMeta("ui.aurora.readyServers", readyServers),
    createProjectMeta("ui.aurora.dedicatedServers", dedicatedServers),
    createProjectMeta("ui.aurora.hostedServers", hostedServers),
    createProjectMeta("ui.aurora.hostingRate", hostingRate)
  );

  const actionsRow = el("div", { className: "aurora-actions" });
  const fund = createProjectButton("ui.aurora.fund", actions.fundAuroraPhase);
  const dedicate = createProjectButton("ui.aurora.dedicateServer", actions.dedicateAuroraServer);
  const host = createProjectButton("ui.aurora.rentHost", actions.rentAuroraHost);
  const releaseHost = createProjectButton("ui.aurora.releaseHost", actions.releaseAuroraHost);
  actionsRow.append(fund, dedicate, host, releaseHost);

  const graphTitle = el("h2", { className: "section-title" });
  graphTitle.append(text(t("ui.aurora.graph")));
  const graph = el("section", { className: "aurora-graph" });
  for (const node of view.nodes) {
    graph.append(createAuroraNode(node));
  }

  auroraNodes = {
    availableServers,
    costLoc,
    costMoney,
    dedicate,
    dedicatedServers,
    fund,
    host,
    hostedServers,
    hostingRate,
    phaseName,
    progressBar: progressFill,
    progressLabel,
    readyServers,
    releaseHost,
    requiredServers,
    status,
    timeRemaining
  };
  updateAurora(view);

  screen.append(title, progress, summary, actionsRow, graphTitle, graph);
  return screen;
}

export function updateAurora(view: AuroraView): void {
  if (auroraNodes === undefined) {
    return;
  }

  setText(auroraNodes.progressLabel, view.progressLabel);
  auroraNodes.progressBar.style.transform = `scaleX(${view.progress.toFixed(3)})`;
  setText(auroraNodes.phaseName, view.phaseName);
  setText(auroraNodes.status, view.statusLabel);
  setText(auroraNodes.costLoc, view.costLoc);
  setText(auroraNodes.costMoney, view.costMoney);
  setText(auroraNodes.timeRemaining, view.timeRemaining);
  setText(auroraNodes.requiredServers, view.requiredServers);
  setText(auroraNodes.availableServers, view.availableServers);
  setText(auroraNodes.readyServers, view.readyServers);
  setText(auroraNodes.dedicatedServers, view.dedicatedServers);
  setText(auroraNodes.hostedServers, view.hostedServers);
  setText(auroraNodes.hostingRate, view.hostingRate);
  auroraNodes.fund.disabled = !view.canFund;
  auroraNodes.dedicate.disabled = !view.canDedicate;
  auroraNodes.host.disabled = !view.canHost;
  auroraNodes.releaseHost.disabled = !view.canReleaseHost;

  for (const node of view.nodes) {
    const row = auroraNodeRows.get(node.id);
    if (row === undefined) {
      continue;
    }

    row.root.dataset.state = node.state;
    setText(row.state, t(`ui.aurora.nodeState.${node.state}`));
  }
}

function createAuroraNode(view: AuroraNodeView): HTMLElement {
  const root = el("article", { className: "aurora-node" });
  root.dataset.state = view.state;
  const name = el("strong", { className: "aurora-node__name" });
  name.append(text(view.name));
  const stateText = text(t(`ui.aurora.nodeState.${view.state}`));
  const state = el("span", { className: "aurora-node__state" });
  state.append(stateText);
  root.append(name, state);
  auroraNodeRows.set(view.id, { root, state: stateText });
  return root;
}

function createProjectButton(labelKey: string, onClick: () => void): HTMLButtonElement {
  const button = el("button", {
    className: "project-card__button",
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
