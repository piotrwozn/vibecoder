import { setText, el, text } from "../dom";
import { t } from "../../i18n/i18n";
import type { AppActions, ResearchNodeView, ResearchView } from "./view-types";

interface ResearchNodeNodes {
  readonly button: HTMLButtonElement;
  readonly cost: Text;
  readonly effect: Text;
  readonly root: HTMLElement;
  readonly state: Text;
}

interface ResearchSummaryNodes {
  readonly rp: Text;
}

const researchNodes = new Map<string, ResearchNodeNodes>();
let researchSummaryNodes: ResearchSummaryNodes | undefined;

export function resetResearchRenderCache(): void {
  researchNodes.clear();
  researchSummaryNodes = undefined;
}

export function createResearchScreen(view: ResearchView, actions: AppActions): HTMLElement {
  const screen = el("section", { className: "main-screen research-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.research")));

  const summary = el("div", { className: "research-summary" });
  summary.append(createSummaryBadge("ui.research.rp", view.rp));

  const tree = el("section", { className: "research-tree" });
  tree.append(createResearchConnections());

  for (const branch of ["throughput", "quality", "automation"]) {
    const column = el("section", { className: `research-branch research-branch--${branch}` });
    const branchTitle = el("h2", { className: "research-branch__title" });
    branchTitle.append(text(t(`ui.research.branch.${branch}`)));
    column.append(branchTitle);

    for (const node of view.nodes.filter((entry) => entry.branch === branch)) {
      column.append(createResearchNode(node, actions));
    }

    tree.append(column);
  }

  screen.append(title, summary, tree);
  return screen;
}

export function updateResearch(view: ResearchView): void {
  if (researchSummaryNodes !== undefined) {
    setText(researchSummaryNodes.rp, view.rp);
  }

  for (const node of view.nodes) {
    updateResearchNode(node);
  }
}

function createResearchNode(view: ResearchNodeView, actions: AppActions): HTMLElement {
  const root = el("article", { className: "research-node" });
  const title = el("h3", { className: "research-node__title" });
  title.append(text(view.name));
  const effect = text(view.effect);
  const cost = text(view.cost);
  const state = text(view.stateLabel);
  const button = createProjectButton("ui.research.buy", () => actions.buyResearch(view.id));

  root.append(
    title,
    createProjectMeta("ui.research.effect", effect),
    createProjectMeta("ui.research.cost", cost),
    createProjectMeta("ui.research.state", state),
    button
  );
  researchNodes.set(view.id, { button, cost, effect, root, state });
  updateResearchNode(view);
  return root;
}

function updateResearchNode(view: ResearchNodeView): void {
  const node = researchNodes.get(view.id);

  if (node === undefined) {
    return;
  }

  setText(node.effect, view.effect);
  setText(node.cost, view.cost);
  setText(node.state, view.stateLabel);
  node.root.dataset.state = view.state;
  node.button.disabled = !view.canBuy;
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

function createSummaryBadge(labelKey: string, value: string): HTMLElement {
  const item = el("div", { className: "research-summary__item" });
  const label = el("span", { className: "project-meta__label" });
  label.append(text(t(labelKey)));
  const output = el("strong", { className: "project-meta__value" });
  const valueNode = text(value);
  output.append(valueNode);
  item.append(label, output);
  researchSummaryNodes = { rp: valueNode };
  return item;
}

function createResearchConnections(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "research-tree__connections");
  svg.setAttribute("viewBox", "0 0 300 1000");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  for (const x of [50, 150, 250]) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(x));
    line.setAttribute("x2", String(x));
    line.setAttribute("y1", "68");
    line.setAttribute("y2", "948");
    line.setAttribute("class", "research-tree__line");
    svg.append(line);
  }

  return svg;
}
