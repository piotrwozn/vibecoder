import { t } from "../../i18n/i18n";
import { el, text } from "../dom";
import type { AppActions, EndlessOfferView, EndlessView } from "./view-types";

let lastEndlessSignature: string | undefined;

export function resetEndlessRenderCache(): void {
  lastEndlessSignature = undefined;
}

export function createEndlessScreen(view: EndlessView, actions: AppActions): HTMLElement {
  const screen = el("section", { className: "main-screen endless-screen" });
  updateEndless(screen, view, actions);
  return screen;
}

export function updateEndless(root: HTMLElement, view: EndlessView, actions: AppActions): void {
  const signature = JSON.stringify(view);
  if (root.dataset.endlessSignature === signature && lastEndlessSignature === signature) {
    return;
  }
  root.dataset.endlessSignature = signature;
  lastEndlessSignature = signature;

  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.endless")));

  if (!view.unlocked) {
    root.replaceChildren(title, createLockedSection(view));
    return;
  }

  root.replaceChildren(
    title,
    createSummarySection(view, actions),
    createDecisionSection(view, actions),
    createEventSection(view),
    createActiveSection(view),
    createOfferSection(view.offers, actions),
    createCurrencySection(view),
    createChallengeSection(view, actions),
    createMilestoneSection(view)
  );
}

function createLockedSection(view: EndlessView): HTMLElement {
  const section = el("section", { className: "roadmap-section endless-section" });
  const copy = el("p", { className: "roadmap-empty" });
  copy.append(text(view.unlockHint));
  section.append(createSectionTitle("ui.endless.locked"), copy);
  return section;
}

function createSummarySection(view: EndlessView, actions: AppActions): HTMLElement {
  const section = el("section", { className: "roadmap-section endless-section" });
  const summary = el("div", { className: "roadmap-summary" });
  summary.append(
    createMetric("ui.endless.tier", view.tier),
    createMetric("ui.endless.completed", view.completed),
    createMetric("ui.endless.legacyScore", view.legacyScore),
    createMetric("ui.endless.empireScore", view.empireScore),
    createMetric("ui.endless.decision", view.decision),
    createMetric("ui.endless.season", view.seasonName),
    createMetric("ui.endless.seasonRemaining", view.seasonRemaining),
    createMetric("ui.endless.activeChallenge", view.activeChallenge ?? t("ui.endless.none"))
  );

  const description = el("p", { className: "roadmap-empty" });
  description.append(text(view.seasonDescription));
  const refresh = el("button", {
    className: "project-card__button",
    title: t("ui.endless.refresh")
  });
  refresh.type = "button";
  refresh.disabled = !view.canRefresh;
  refresh.append(text(t("ui.endless.refresh")));
  refresh.addEventListener("click", actions.refreshEndlessOffers);

  section.append(createSectionTitle("ui.endless.summary"), summary, description, refresh);
  return section;
}

function createDecisionSection(view: EndlessView, actions: AppActions): HTMLElement {
  const section = el("section", { className: "roadmap-section endless-section" });
  const controls = el("div", { className: "project-actions" });
  const continueButton = el("button", {
    className: "project-card__button",
    title: t("ui.endless.continue")
  });
  const resetButton = el("button", {
    className: "project-card__button",
    title: t("ui.endless.reset")
  });

  continueButton.type = "button";
  continueButton.append(text(t("ui.endless.continue")));
  continueButton.addEventListener("click", () => actions.chooseEndlessDecision("continue"));

  resetButton.type = "button";
  resetButton.disabled = view.active !== undefined;
  resetButton.append(text(t("ui.endless.reset")));
  resetButton.addEventListener("click", () => actions.chooseEndlessDecision("reset"));

  controls.append(continueButton, resetButton);
  section.append(createSectionTitle("ui.endless.decisionTitle"), controls);
  return section;
}

function createEventSection(view: EndlessView): HTMLElement {
  const section = el("section", { className: "roadmap-section endless-section" });
  section.append(createSectionTitle("ui.endless.event"));

  if (view.activeEvent === undefined) {
    const empty = el("p", { className: "roadmap-empty" });
    empty.append(text(t("ui.endless.noEvent")));
    section.append(empty);
    return section;
  }

  const card = el("article", { className: "roadmap-card roadmap-card--active" });
  const name = el("strong", { className: "roadmap-card__title" });
  name.append(text(view.activeEvent.name));
  const detail = el("span", { className: "roadmap-card__detail" });
  detail.append(text(view.activeEvent.description));
  card.append(name, detail, createMeta("ui.endless.remaining", view.activeEvent.remaining));
  section.append(card);
  return section;
}

function createActiveSection(view: EndlessView): HTMLElement {
  const section = el("section", { className: "roadmap-section endless-section" });
  section.append(createSectionTitle("ui.endless.active"));

  if (view.active === undefined) {
    const empty = el("p", { className: "roadmap-empty" });
    empty.append(text(t("ui.endless.noActive")));
    section.append(empty);
    return section;
  }

  const active = el("article", { className: "active-build endless-active" });
  const name = el("strong", { className: "active-build__name" });
  name.append(text(view.active.name));
  const track = el("div", { className: "active-build__track" });
  const bar = el("div", { className: "active-build__bar" });
  bar.style.transform = `scaleX(${view.active.progress.toFixed(3)})`;
  track.append(bar);
  active.append(
    name,
    createValueCell(view.active.progressLabel),
    createValueCell(view.active.remaining),
    createValueCell(view.active.reward),
    createValueCell(view.active.risks),
    track
  );
  section.append(active);
  return section;
}

function createOfferSection(offers: readonly EndlessOfferView[], actions: AppActions): HTMLElement {
  const section = el("section", { className: "roadmap-section endless-section" });
  const title = createSectionTitle("ui.endless.offers");
  const list = el("section", { className: "project-board endless-offers" });

  if (offers.length === 0) {
    const empty = el("p", { className: "roadmap-empty" });
    empty.append(text(t("ui.endless.noOffers")));
    section.append(title, empty);
    return section;
  }

  for (const offer of offers) {
    list.append(createOfferCard(offer, actions));
  }

  section.append(title, list);
  return section;
}

function createCurrencySection(view: EndlessView): HTMLElement {
  const section = el("section", { className: "roadmap-section endless-section" });
  const summary = el("div", { className: "roadmap-summary" });
  for (const currency of view.currencies) {
    summary.append(createMetricFromLabel(currency.label, currency.value));
  }

  section.append(createSectionTitle("ui.endless.currencies"), summary);

  if (view.softCaps.length > 0) {
    const list = el("ul", { className: "roadmap-list" });
    for (const cap of view.softCaps) {
      const item = el("li", { className: "roadmap-empty" });
      item.append(text(cap));
      list.append(item);
    }
    section.append(createSectionTitle("ui.endless.softCaps"), list);
  }

  if (view.cosmetics.length > 0) {
    const cosmetics = el("p", { className: "roadmap-empty" });
    cosmetics.append(text(view.cosmetics.join(", ")));
    section.append(createSectionTitle("ui.endless.cosmetics"), cosmetics);
  }

  return section;
}

function createChallengeSection(view: EndlessView, actions: AppActions): HTMLElement {
  const section = el("section", { className: "roadmap-section endless-section" });
  const list = el("section", { className: "project-board endless-offers" });

  for (const challenge of view.challenges) {
    const card = el("article", { className: "project-card endless-offer" });
    card.dataset.challengeId = challenge.id;
    card.classList.toggle("roadmap-card--active", challenge.active);
    const name = el("h2", { className: "project-card__title" });
    name.append(text(challenge.name));
    const button = el("button", {
      className: "project-card__button",
      title: t("ui.endless.startChallenge")
    });
    button.type = "button";
    button.disabled = !challenge.canStart;
    button.append(text(challenge.active ? t("ui.endless.active") : t("ui.endless.startChallenge")));
    button.addEventListener("click", () => actions.startEndlessChallenge(challenge.id));
    card.append(
      name,
      createMeta(
        "ui.endless.status",
        challenge.completed ? t("ui.endless.completed") : t("ui.endless.open")
      ),
      createMeta("ui.endless.bestTier", challenge.bestTier),
      createMeta("ui.endless.rewardLabel", challenge.reward),
      createValueCell(challenge.description),
      button
    );
    list.append(card);
  }

  section.append(createSectionTitle("ui.endless.challenges"), list);
  return section;
}

function createOfferCard(view: EndlessOfferView, actions: AppActions): HTMLElement {
  const card = el("article", { className: "project-card endless-offer" });
  card.dataset.contractId = view.id;
  const name = el("h2", { className: "project-card__title" });
  name.append(text(view.name));
  const button = el("button", { className: "project-card__button", title: t("ui.endless.accept") });
  button.type = "button";
  button.disabled = !view.canAccept;
  button.append(text(t("ui.endless.accept")));
  button.addEventListener("click", () => {
    actions.acceptEndlessContract(view.id);
  });
  card.append(
    name,
    createMeta("ui.endless.tier", view.tier),
    createMeta("ui.endless.cost", view.cost),
    createMeta("ui.endless.work", view.work),
    createMeta("ui.endless.rewardLabel", view.reward),
    createMeta("ui.endless.modules", view.modules),
    createMeta("ui.endless.modifiers", view.modifiers),
    createMeta("ui.endless.risks", view.risks),
    button
  );
  return card;
}

function createMilestoneSection(view: EndlessView): HTMLElement {
  const section = el("section", { className: "roadmap-section endless-section" });
  section.append(createSectionTitle("ui.endless.milestones"));
  const list = el("div", { className: "roadmap-grid" });

  for (const milestone of view.milestones) {
    const card = el("article", { className: "roadmap-card" });
    card.dataset.milestoneId = milestone.id;
    card.classList.toggle("roadmap-card--active", milestone.reached);
    const target = el("strong", { className: "roadmap-card__title" });
    target.append(text(milestone.target));
    const detail = el("span", { className: "roadmap-card__detail" });
    detail.append(text(milestone.description));
    card.append(target, detail);
    list.append(card);
  }

  section.append(list);
  return section;
}

function createMetric(labelKey: string, value: string): HTMLElement {
  const metric = el("span", { className: "roadmap-metric" });
  metric.append(createMeta(labelKey, value));
  return metric;
}

function createMetricFromLabel(labelText: string, value: string): HTMLElement {
  const metric = el("span", { className: "roadmap-metric" });
  const row = el("div", { className: "project-meta" });
  const label = el("span", { className: "project-meta__label" });
  label.append(text(labelText));
  const output = el("strong", { className: "project-meta__value" });
  output.append(text(value));
  row.append(label, output);
  metric.append(row);
  return metric;
}

function createMeta(labelKey: string, value: string): HTMLElement {
  const row = el("div", { className: "project-meta" });
  const label = el("span", { className: "project-meta__label" });
  label.append(text(t(labelKey)));
  const output = el("strong", { className: "project-meta__value" });
  output.append(text(value));
  row.append(label, output);
  return row;
}

function createValueCell(value: string): HTMLElement {
  const cell = el("span", { className: "agent-row__value" });
  cell.append(text(value));
  return cell;
}

function createSectionTitle(labelKey: string): HTMLElement {
  const title = el("h2", { className: "section-title" });
  title.append(text(t(labelKey)));
  return title;
}
