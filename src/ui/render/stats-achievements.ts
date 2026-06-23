import { t } from "../../i18n/i18n";
import { el, setText, text } from "../dom";
import type { AchievementCardView, AchievementsView, StatsRowView, StatsView } from "./view-types";

interface StatsRowNodes {
  readonly value: Text;
}

interface StatsNodes {
  readonly empty: HTMLElement;
  readonly path: SVGPathElement;
  readonly svg: SVGSVGElement;
}

interface AchievementCardNodes {
  readonly category: Text;
  readonly description: Text;
  readonly root: HTMLElement;
  readonly status: Text;
  readonly title: Text;
}

interface AchievementsNodes {
  readonly bonus: Text;
  readonly grid: HTMLElement;
  readonly unlocked: Text;
}

const statsRows = new Map<string, StatsRowNodes>();
const achievementCards = new Map<string, AchievementCardNodes>();
let statsNodes: StatsNodes | undefined;
let achievementsNodes: AchievementsNodes | undefined;

export function resetStatsAchievementRenderCaches(): void {
  statsRows.clear();
  achievementCards.clear();
  statsNodes = undefined;
  achievementsNodes = undefined;
}

export function createStatsScreen(view: StatsView): HTMLElement {
  const screen = el("section", { className: "main-screen stats-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.stats")));

  const sparkline = createStatsSparkline(view);
  const sections = el("section", { className: "stats-sections" });
  sections.append(
    createStatsSection("ui.stats.lifetime", view.lifetimeRows),
    createStatsSection("ui.stats.run", view.runRows),
    createStatsSection("ui.stats.records", view.recordsRows)
  );

  screen.append(title, sparkline, sections);
  updateStats(view);
  return screen;
}

function createStatsSparkline(view: StatsView): HTMLElement {
  const panel = el("section", { className: "stats-sparkline" });
  const title = el("h2", { className: "section-title" });
  title.append(text(t("ui.stats.sparkline")));
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "stats-sparkline__svg");
  svg.setAttribute("viewBox", "0 0 300 80");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", view.sparklineLabel);
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("class", "stats-sparkline__path");
  svg.append(path);
  const empty = el("p", { className: "stats-sparkline__empty" });
  empty.append(text(t("ui.stats.sparklineEmpty")));
  panel.append(title, svg, empty);
  statsNodes = { empty, path, svg };
  return panel;
}

function createStatsSection(titleKey: string, rows: readonly StatsRowView[]): HTMLElement {
  const section = el("section", { className: "stats-section" });
  const title = el("h2", { className: "section-title" });
  title.append(text(t(titleKey)));
  const list = el("div", { className: "stats-list" });

  for (const row of rows) {
    list.append(createStatsRow(row));
  }

  section.append(title, list);
  return section;
}

function createStatsRow(row: StatsRowView): HTMLElement {
  const root = el("div", { className: "stats-row" });
  const label = el("span", { className: "stats-row__label" });
  label.append(text(row.label));
  const value = text(row.value);
  const valueNode = el("strong", { className: "stats-row__value" });
  valueNode.append(value);
  root.append(label, valueNode);
  statsRows.set(row.id, { value });
  return root;
}

export function createAchievementsScreen(view: AchievementsView): HTMLElement {
  const screen = el("section", { className: "main-screen achievements-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.achievements")));

  const summary = el("section", { className: "achievement-summary" });
  const unlocked = text(view.unlocked);
  const bonus = text(view.bonus);
  summary.append(
    createAchievementSummaryItem("ui.achievements.unlocked", unlocked),
    createAchievementSummaryItem("ui.achievements.bonus", bonus)
  );

  const grid = el("section", { className: "achievement-grid" });
  for (const card of view.cards) {
    grid.append(createAchievementCard(card));
  }

  achievementsNodes = { bonus, grid, unlocked };
  screen.append(title, summary, grid);
  updateAchievements(view, { achievements: screen });
  return screen;
}

function createAchievementSummaryItem(labelKey: string, value: Text): HTMLElement {
  const item = el("div", { className: "achievement-summary__item" });
  const label = el("span", { className: "project-meta__label" });
  label.append(text(t(labelKey)));
  const output = el("strong", { className: "project-meta__value" });
  output.append(value);
  item.append(label, output);
  return item;
}

function createAchievementCard(view: AchievementCardView): HTMLElement {
  const root = el("article", { className: "achievement-card" });
  const category = text(view.category);
  const categoryNode = el("span", { className: "achievement-card__category" });
  categoryNode.append(category);
  const title = text(view.name);
  const titleNode = el("h2", { className: "achievement-card__title" });
  titleNode.append(title);
  const description = text(view.description);
  const descriptionNode = el("p", { className: "achievement-card__description" });
  descriptionNode.append(description);
  const status = text(view.status);
  const statusNode = el("span", { className: "achievement-card__status" });
  statusNode.append(status);
  root.append(categoryNode, titleNode, descriptionNode, statusNode);
  achievementCards.set(view.id, { category, description, root, status, title });
  updateAchievementCard(view);
  return root;
}

export function updateStats(view: StatsView): void {
  for (const row of [...view.lifetimeRows, ...view.runRows, ...view.recordsRows]) {
    const nodes = statsRows.get(row.id);

    if (nodes !== undefined) {
      setText(nodes.value, row.value);
    }
  }

  if (statsNodes === undefined) {
    return;
  }

  statsNodes.svg.toggleAttribute("hidden", view.sparklineEmpty);
  statsNodes.empty.hidden = !view.sparklineEmpty;
  statsNodes.svg.setAttribute("aria-label", view.sparklineLabel);
  statsNodes.path.setAttribute("d", view.sparklinePath);
}

export function updateAchievements(
  view: AchievementsView,
  screens: { readonly achievements: HTMLElement }
): void {
  if (achievementsNodes !== undefined) {
    setText(achievementsNodes.unlocked, view.unlocked);
    setText(achievementsNodes.bonus, view.bonus);

    for (const card of view.cards) {
      if (!achievementCards.has(card.id)) {
        achievementsNodes.grid.append(createAchievementCard(card));
      }
    }
  }

  for (const card of view.cards) {
    updateAchievementCard(card);
  }

  screens.achievements.classList.toggle(
    "achievements-screen--complete",
    view.cards.every((card) => card.unlocked)
  );
}

function updateAchievementCard(view: AchievementCardView): void {
  const nodes = achievementCards.get(view.id);

  if (nodes === undefined) {
    return;
  }

  nodes.root.classList.toggle("achievement-card--unlocked", view.unlocked);
  nodes.root.classList.toggle("achievement-card--locked", !view.unlocked);
  setText(nodes.category, view.category);
  setText(nodes.title, view.name);
  setText(nodes.description, view.description);
  setText(nodes.status, view.status);
}
