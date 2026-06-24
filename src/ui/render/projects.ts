import { setText, el, text } from "../dom";
import { t } from "../../i18n/i18n";
import type {
  ActiveBuildView,
  AppActions,
  ProductView,
  ProjectOfferView,
  ProjectsView,
  RefactorView
} from "./view-types";

interface ProjectOfferNodes {
  readonly buildTime: Text;
  readonly compute: Text;
  readonly cost: Text;
  readonly hostedButton: HTMLButtonElement;
  readonly hostingCost: Text;
  readonly level: Text;
  readonly payout: Text;
  readonly revenue: Text;
  readonly root: HTMLElement;
  readonly selfHostedButton: HTMLButtonElement;
  readonly tag: Text;
}

interface ActiveBuildNodes {
  readonly compute: Text;
  readonly deployment: Text;
  readonly progress: HTMLElement;
  readonly remaining: Text;
  readonly root: HTMLElement;
}

interface ProductNodes {
  readonly compute: Text;
  readonly deployment: Text;
  readonly deploymentButton: HTMLButtonElement;
  readonly fix: HTMLButtonElement;
  readonly hostingCost: Text;
  readonly level: Text;
  readonly revenue: Text;
  readonly root: HTMLElement;
  readonly status: Text;
}

interface RefactorNodes {
  readonly buildTime: Text;
  readonly button: HTMLButtonElement;
  readonly cost: Text;
  readonly debt: Text;
  readonly effect: Text;
}

interface ProjectSummaryNodes {
  readonly income: Text;
  readonly nextUnlock: Text;
}

const projectOffers = new Map<string, ProjectOfferNodes>();
const activeBuilds = new Map<string, ActiveBuildNodes>();
const products = new Map<string, ProductNodes>();
let refactorNodes: RefactorNodes | undefined;
let projectSummaryNodes: ProjectSummaryNodes | undefined;

export function resetProjectsRenderCache(): void {
  projectOffers.clear();
  activeBuilds.clear();
  products.clear();
  refactorNodes = undefined;
  projectSummaryNodes = undefined;
}

export function createProjectsScreen(view: ProjectsView, actions: AppActions): HTMLElement {
  const screen = el("section", { className: "main-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.projects")));

  const summary = el("div", { className: "project-summary" });
  const income = text(view.incomeRate);
  const nextUnlock = text(view.nextUnlock);
  summary.append(
    createSummaryItem("ui.projects.income", income),
    createSummaryItem("ui.projects.nextUnlock", nextUnlock)
  );
  projectSummaryNodes = { income, nextUnlock };

  const refactor = createRefactorPanel(view.refactor, actions);
  const board = el("section", { className: "project-board" });

  for (const offer of view.offers) {
    board.append(createProjectOffer(offer, actions));
  }

  const activeTitle = el("h2", { className: "section-title" });
  activeTitle.append(text(t("ui.projects.active")));
  const activeList = el("section", { className: "active-build-list" });

  for (const build of view.activeBuilds) {
    activeList.append(createActiveBuild(build));
  }

  const portfolioTitle = el("h2", { className: "section-title" });
  portfolioTitle.append(text(t("ui.projects.portfolio")));
  const portfolioList = el("section", { className: "portfolio-list" });

  for (const product of view.portfolio) {
    portfolioList.append(createProduct(product, actions));
  }

  screen.append(
    title,
    summary,
    refactor,
    board,
    activeTitle,
    activeList,
    portfolioTitle,
    portfolioList
  );
  return screen;
}

export function updateProjects(
  view: ProjectsView,
  screens: { readonly projects: HTMLElement },
  actions: AppActions
): void {
  updateProjectSummary(view);
  updateRefactor(view.refactor);
  syncProjectOffers(view.offers, screens.projects, actions);
  syncActiveBuilds(view.activeBuilds, screens.projects);
  syncProducts(view.portfolio, screens.projects, actions);
}

export function updateProjectSummaryIncome(income: { data: string }, view: ProjectsView): void {
  if (income.data !== view.incomeRate) {
    income.data = view.incomeRate;
  }
}

function createProjectOffer(view: ProjectOfferView, actions: AppActions): HTMLElement {
  const root = el("article", { className: "project-card" });
  root.dataset.projectId = view.id;
  const name = el("h2", { className: "project-card__title" });
  name.append(text(view.name));
  const tag = text(view.tag);
  const level = text(view.level);
  const cost = text(view.cost);
  const payout = text(view.payout);
  const revenue = text(view.revenue);
  const compute = text(view.compute);
  const hostingCost = text(view.hostingCost);
  const buildTime = text(view.buildTime);
  const selfHostedButton = createProjectButton("ui.projects.buildSelfHosted", () =>
    actions.startProject(view.id, "selfHosted")
  );
  const hostedButton = createProjectButton("ui.projects.buildHosted", () =>
    actions.startProject(view.id, "hosted")
  );
  const buttons = el("div", { className: "project-card__actions" });
  buttons.append(selfHostedButton, hostedButton);

  root.append(
    name,
    createProjectMeta("ui.projects.tag", tag),
    createProjectMeta("ui.projects.level", level),
    createProjectMeta("ui.projects.cost", cost),
    createProjectMeta("ui.projects.compute", compute),
    createProjectMeta("ui.projects.hosting", hostingCost),
    createProjectMeta("ui.projects.payout", payout),
    createProjectMeta("ui.projects.revenue", revenue),
    createProjectMeta("ui.projects.time", buildTime),
    buttons
  );

  projectOffers.set(view.id, {
    buildTime,
    compute,
    cost,
    hostedButton,
    hostingCost,
    level,
    payout,
    revenue,
    root,
    selfHostedButton,
    tag
  });
  updateProjectOffer(view);
  return root;
}

function createActiveBuild(view: ActiveBuildView): HTMLElement {
  const root = el("div", { className: "active-build" });
  const name = el("strong", { className: "active-build__name" });
  name.append(text(view.name));
  const deployment = text(view.deployment);
  const compute = text(view.compute);
  const remaining = text(view.remaining);
  const track = el("div", { className: "active-build__track" });
  const progress = el("div", { className: "active-build__bar" });
  track.append(progress);
  root.append(
    name,
    createValueCell(deployment),
    createValueCell(compute),
    createValueCell(remaining),
    track
  );
  activeBuilds.set(view.id, { compute, deployment, progress, remaining, root });
  updateActiveBuild(view);
  return root;
}

function createProduct(view: ProductView, actions: AppActions): HTMLElement {
  const root = el("div", { className: "product-row" });
  root.dataset.productId = view.id;
  const name = el("strong", { className: "product-row__name" });
  name.append(text(view.name));
  const level = text(view.level);
  const deployment = text(view.deployment);
  const revenue = text(view.revenue);
  const hostingCost = text(view.hostingCost);
  const compute = text(view.compute);
  const status = text(view.status);
  const deploymentButton = createProjectButton("ui.projects.switchDeployment", () =>
    actions.setProjectDeploymentMode(view.id, view.switchDeploymentMode)
  );
  const fix = createProjectButton("ui.projects.fixBug", () => actions.fixBug(view.id));
  root.append(
    name,
    createValueCell(level),
    createValueCell(deployment),
    createValueCell(revenue),
    createValueCell(hostingCost),
    createValueCell(compute),
    createValueCell(status),
    deploymentButton,
    fix
  );
  products.set(view.id, {
    compute,
    deployment,
    deploymentButton,
    fix,
    hostingCost,
    level,
    revenue,
    root,
    status
  });
  updateProduct(view);
  return root;
}

function createRefactorPanel(view: RefactorView, actions: AppActions): HTMLElement {
  const root = el("section", { className: "refactor-panel" });
  const title = el("h2", { className: "refactor-panel__title" });
  title.append(text(t("ui.projects.refactor")));
  const debt = text(view.debt);
  const cost = text(view.cost);
  const effect = text(view.effect);
  const buildTime = text(view.buildTime);
  const button = createProjectButton("ui.projects.refactorAction", actions.startRefactor);

  root.append(
    title,
    createProjectMeta("ui.projects.debt", debt),
    createProjectMeta("ui.projects.cost", cost),
    createProjectMeta("ui.projects.effect", effect),
    createProjectMeta("ui.projects.time", buildTime),
    button
  );

  refactorNodes = { buildTime, button, cost, debt, effect };
  updateRefactor(view);
  return root;
}

function updateProjectSummary(view: ProjectsView): void {
  if (projectSummaryNodes === undefined) {
    return;
  }

  updateProjectSummaryIncome(projectSummaryNodes.income, view);
  updateProjectSummaryNextUnlock(projectSummaryNodes.nextUnlock, view);
}

function updateProjectSummaryNextUnlock(nextUnlock: { data: string }, view: ProjectsView): void {
  if (nextUnlock.data !== view.nextUnlock) {
    nextUnlock.data = view.nextUnlock;
  }
}

function syncProjectOffers(
  views: readonly ProjectOfferView[],
  screen: HTMLElement,
  actions: AppActions
): void {
  const board = screen.querySelector<HTMLElement>(".project-board");

  if (board === null) {
    return;
  }

  const visibleIds = new Set(views.map((view) => view.id));

  for (const view of views) {
    const row = projectOffers.get(view.id);
    if (row === undefined) {
      board.append(createProjectOffer(view, actions));
    } else {
      updateProjectOffer(view);
    }
  }

  for (const [id, row] of projectOffers) {
    row.root.hidden = !visibleIds.has(id);
  }
}

function updateProjectOffer(view: ProjectOfferView): void {
  const row = projectOffers.get(view.id);

  if (row === undefined) {
    return;
  }

  setText(row.tag, view.tag);
  setText(row.level, view.level);
  setText(row.cost, view.cost);
  setText(row.compute, view.compute);
  setText(row.hostingCost, view.hostingCost);
  setText(row.payout, view.payout);
  setText(row.revenue, view.revenue);
  setText(row.buildTime, view.buildTime);
  row.selfHostedButton.disabled = !view.canStartSelfHosted;
  row.hostedButton.disabled = !view.canStartHosted;
}

function syncActiveBuilds(views: readonly ActiveBuildView[], screen: HTMLElement): void {
  const list = screen.querySelector<HTMLElement>(".active-build-list");

  if (list === null) {
    return;
  }

  for (const [id, nodes] of activeBuilds) {
    if (!views.some((view) => view.id === id)) {
      nodes.root.remove();
      activeBuilds.delete(id);
    }
  }

  for (const view of views) {
    const nodes = activeBuilds.get(view.id);
    if (nodes === undefined) {
      list.append(createActiveBuild(view));
    } else {
      updateActiveBuild(view);
    }
  }
}

function updateActiveBuild(view: ActiveBuildView): void {
  const nodes = activeBuilds.get(view.id);

  if (nodes === undefined) {
    return;
  }

  setText(nodes.remaining, view.remaining);
  setText(nodes.deployment, view.deployment);
  setText(nodes.compute, view.compute);
  nodes.progress.style.transform = `scaleX(${view.progress.toFixed(3)})`;
}

function syncProducts(
  views: readonly ProductView[],
  screen: HTMLElement,
  actions: AppActions
): void {
  const list = screen.querySelector<HTMLElement>(".portfolio-list");

  if (list === null) {
    return;
  }

  const visibleIds = new Set(views.map((view) => view.id));

  for (const view of views) {
    const nodes = products.get(view.id);
    if (nodes === undefined) {
      list.append(createProduct(view, actions));
    } else {
      updateProduct(view);
    }
  }

  for (const [id, nodes] of products) {
    nodes.root.hidden = !visibleIds.has(id);
  }
}

function updateProduct(view: ProductView): void {
  const nodes = products.get(view.id);

  if (nodes === undefined) {
    return;
  }

  setText(nodes.level, view.level);
  setText(nodes.deployment, view.deployment);
  setText(nodes.revenue, view.revenue);
  setText(nodes.hostingCost, view.hostingCost);
  setText(nodes.compute, view.compute);
  setText(nodes.status, view.status);
  setText(nodes.deploymentButton.firstChild as Text, view.switchDeploymentLabel);
  nodes.deploymentButton.disabled = !view.canSwitchDeployment;
  nodes.fix.disabled = !view.canFix;
}

function updateRefactor(view: RefactorView): void {
  if (refactorNodes === undefined) {
    return;
  }

  setText(refactorNodes.debt, view.debt);
  setText(refactorNodes.cost, view.cost);
  setText(refactorNodes.effect, view.effect);
  setText(refactorNodes.buildTime, view.buildTime);
  refactorNodes.button.disabled = !view.canStart;
}

function createValueCell(value: Text): HTMLElement {
  const cell = el("span", { className: "agent-row__value" });
  cell.append(value);
  return cell;
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

function createSummaryItem(labelKey: string, value: Text): HTMLElement {
  const item = el("div", { className: "project-summary__item" });
  const label = el("span", { className: "project-meta__label" });
  label.append(text(t(labelKey)));
  const output = el("strong", { className: "project-meta__value" });
  output.append(value);
  item.append(label, output);
  return item;
}
