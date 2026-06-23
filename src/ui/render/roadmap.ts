import { t } from "../../i18n/i18n";
import { el, text } from "../dom";
import type { AppActions, RoadmapIncidentView, RoadmapView } from "./view-types";

let lastRoadmapSignature: string | undefined;

export function resetRoadmapRenderCache(): void {
  lastRoadmapSignature = undefined;
}

export function createRoadmapScreen(view: RoadmapView, actions: AppActions): HTMLElement {
  const screen = el("section", { className: "main-screen roadmap-screen" });
  updateRoadmap(screen, view, actions);
  return screen;
}

export function updateRoadmap(root: HTMLElement, view: RoadmapView, actions: AppActions): void {
  const signature = JSON.stringify(view);
  if (root.dataset.roadmapSignature === signature && lastRoadmapSignature === signature) {
    return;
  }
  root.dataset.roadmapSignature = signature;
  lastRoadmapSignature = signature;

  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.roadmap")));

  root.replaceChildren(
    title,
    createSprintSection(view, actions),
    createIncidentSection(view.incidents, actions),
    createRunStyleSection(view, actions),
    createActivitySection(view)
  );
}

function createSprintSection(view: RoadmapView, actions: AppActions): HTMLElement {
  const section = el("section", { className: "roadmap-section roadmap-section--sprints" });
  const title = createSectionTitle("ui.roadmap.sprints");
  const summary = el("div", { className: "roadmap-summary" });
  summary.append(
    createMetric("ui.roadmap.activeSprint", view.activeSprint),
    createMetric("ui.roadmap.remaining", view.sprintRemaining),
    createMetric("ui.roadmap.cooldown", view.cooldown)
  );

  const list = el("div", { className: "roadmap-grid" });
  for (const priority of view.priorities) {
    const button = el("button", {
      className: "roadmap-card roadmap-card--button",
      title: priority.description
    });
    button.type = "button";
    button.disabled = priority.disabled || priority.active;
    button.dataset.sprintPriority = priority.id;
    button.classList.toggle("roadmap-card--active", priority.active);
    const name = el("strong", { className: "roadmap-card__title" });
    name.append(text(priority.label));
    const detail = el("span", { className: "roadmap-card__detail" });
    detail.append(text(priority.description));
    button.append(name, detail);
    button.addEventListener("click", () => {
      actions.selectSprintPriority(priority.id);
    });
    list.append(button);
  }

  section.append(title, summary, list);
  return section;
}

function createIncidentSection(
  incidents: readonly RoadmapIncidentView[],
  actions: AppActions
): HTMLElement {
  const section = el("section", { className: "roadmap-section roadmap-section--incidents" });
  section.append(createSectionTitle("ui.roadmap.incidents"));

  if (incidents.length === 0) {
    const empty = el("p", { className: "roadmap-empty" });
    empty.append(text(t("ui.roadmap.noIncidents")));
    section.append(empty);
    return section;
  }

  for (const incident of incidents) {
    section.append(createIncidentCard(incident, actions));
  }

  return section;
}

function createIncidentCard(incident: RoadmapIncidentView, actions: AppActions): HTMLElement {
  const card = el("article", { className: "roadmap-incident" });
  card.dataset.incidentId = incident.id;
  const header = el("div", { className: "roadmap-incident__header" });
  const name = el("strong", { className: "roadmap-incident__title" });
  name.append(text(incident.label));
  const meta = el("span", { className: "roadmap-incident__meta" });
  meta.append(text(`${incident.severity} - ${incident.timeRemaining}`));
  header.append(name, meta);
  const description = el("p", { className: "roadmap-incident__description" });
  description.append(text(incident.description));
  const responses = el("div", { className: "roadmap-incident__responses" });

  for (const response of incident.responses) {
    const button = el("button", {
      className: "roadmap-response",
      title: response.description
    });
    button.type = "button";
    button.disabled = response.disabled;
    const label = el("strong", { className: "roadmap-response__label" });
    label.append(text(response.label));
    const cost = el("span", { className: "roadmap-response__cost" });
    cost.append(text(response.cost));
    button.append(label, cost);
    button.addEventListener("click", () => {
      actions.resolveIncident(incident.id, response.id);
    });
    responses.append(button);
  }

  card.append(header, description, responses);
  return card;
}

function createRunStyleSection(view: RoadmapView, actions: AppActions): HTMLElement {
  const section = el("section", { className: "roadmap-section roadmap-section--run-styles" });
  section.append(createSectionTitle("ui.roadmap.runStyles"));
  const list = el("div", { className: "roadmap-grid" });

  for (const style of view.runStyles) {
    const button = el("button", {
      className: "roadmap-card roadmap-card--button",
      title: style.unlocked ? style.description : t("ui.roadmap.runStyleLocked")
    });
    button.type = "button";
    button.disabled = !style.unlocked || style.selected;
    button.dataset.runStyle = style.id;
    button.classList.toggle("roadmap-card--active", style.selected);
    const name = el("strong", { className: "roadmap-card__title" });
    name.append(text(style.label));
    const detail = el("span", { className: "roadmap-card__detail" });
    detail.append(text(style.unlocked ? style.description : t("ui.roadmap.runStyleLocked")));
    const cost = el("span", { className: "roadmap-card__cost" });
    cost.append(text(style.cost));
    button.append(name, detail, cost);
    button.addEventListener("click", () => {
      actions.selectRunStyle(style.id);
    });
    list.append(button);
  }

  section.append(list);
  return section;
}

function createActivitySection(view: RoadmapView): HTMLElement {
  const section = el("section", { className: "roadmap-section roadmap-section--activity" });
  section.append(createSectionTitle("ui.roadmap.activity"));
  const list = el("div", { className: "roadmap-activity" });

  for (const item of view.activity) {
    const row = el("article", {
      className: `roadmap-activity__row roadmap-activity__row--${item.tone}`
    });
    row.dataset.activityId = item.id;
    const label = el("strong", { className: "roadmap-activity__label" });
    label.append(text(item.label));
    const detail = el("span", { className: "roadmap-activity__detail" });
    detail.append(text(item.detail));
    row.append(label, detail);
    list.append(row);
  }

  section.append(list);
  return section;
}

function createMetric(labelKey: string, value: string): HTMLElement {
  const metric = el("span", { className: "roadmap-metric" });
  const label = el("span", { className: "project-meta__label" });
  label.append(text(t(labelKey)));
  const output = el("strong", { className: "project-meta__value" });
  output.append(text(value));
  metric.append(label, output);
  return metric;
}

function createSectionTitle(labelKey: string): HTMLElement {
  const title = el("h2", { className: "section-title" });
  title.append(text(t(labelKey)));
  return title;
}
