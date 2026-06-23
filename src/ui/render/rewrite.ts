import { setText, el, text } from "../dom";
import { t } from "../../i18n/i18n";
import type {
  AppActions,
  EquityPerkView,
  ExitView,
  InsightNodeView,
  ParadoxItemView,
  ParadoxView,
  RewriteView,
  RunModifierView
} from "./view-types";

interface InsightNodeNodes {
  readonly button: HTMLButtonElement;
  readonly cost: Text;
  readonly effect: Text;
  readonly root: HTMLElement;
  readonly state: Text;
}

interface EquityPerkNodes {
  readonly button: HTMLButtonElement;
  readonly cost: Text;
  readonly effect: Text;
  readonly root: HTMLElement;
  readonly state: Text;
}

interface RunModifierNodes {
  readonly button: HTMLButtonElement;
  readonly description: Text;
  readonly root: HTMLElement;
}

interface ParadoxItemNodes {
  readonly button: HTMLButtonElement;
  readonly cost: Text;
  readonly effect: Text;
  readonly root: HTMLElement;
  readonly state: Text;
}

interface RewriteNodes {
  readonly afterInsight: Text;
  readonly boot: HTMLElement;
  readonly bootOverlay: HTMLElement;
  readonly button: HTMLButtonElement;
  readonly currentMultiplier: Text;
  readonly gain: Text;
  readonly insight: Text;
  readonly lostAgents: Text;
  readonly lostHardware: Text;
  readonly lostLoc: Text;
  readonly lostMoney: Text;
  readonly lostProducts: Text;
  readonly lostUpgrades: Text;
  readonly nextInsight: Text;
  readonly nextMilestone: Text;
  readonly requiredInsight: Text;
  readonly speedup: Text;
  readonly startEra: Text;
  readonly startGenerators: Text;
  readonly startMoney: Text;
  readonly targetMultiplier: Text;
}

interface ExitNodes {
  readonly button: HTMLButtonElement;
  readonly currentEquity: Text;
  readonly currentMultiplier: Text;
  readonly equityAfter: Text;
  readonly gain: Text;
  readonly requiredInsight: Text;
  readonly rewardMultiplier: Text;
  readonly root: HTMLElement;
  readonly targetMultiplier: Text;
  readonly totalInsightEarned: Text;
}

interface ParadoxNodes {
  readonly button: HTMLButtonElement;
  readonly currentIteration: Text;
  readonly currentMultiplier: Text;
  readonly currentParadox: Text;
  readonly hold: Text;
  readonly locRate: Text;
  readonly nextIteration: Text;
  readonly paradoxAfter: Text;
  readonly paradoxGain: Text;
  readonly root: HTMLElement;
  readonly ruleSlots: Text;
  readonly softcapThreshold: Text;
  readonly targetMultiplier: Text;
  readonly theme: Text;
}

const insightNodes = new Map<string, InsightNodeNodes>();
const equityPerks = new Map<string, EquityPerkNodes>();
const runModifiers = new Map<string, RunModifierNodes>();
const paradoxItems = new Map<string, ParadoxItemNodes>();
let exitNodes: ExitNodes | undefined;
let paradoxNodes: ParadoxNodes | undefined;
let rewriteNodes: RewriteNodes | undefined;

export function resetRewriteRenderCache(): void {
  insightNodes.clear();
  equityPerks.clear();
  runModifiers.clear();
  paradoxItems.clear();
  exitNodes = undefined;
  paradoxNodes = undefined;
  rewriteNodes = undefined;
}

export function createRewriteScreen(view: RewriteView, actions: AppActions): HTMLElement {
  const screen = el("section", { className: "main-screen rewrite-screen" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.app.rewrite")));

  const bootOverlay = createRewriteBootOverlay();
  const forecast = el("section", { className: "rewrite-forecast" });
  const boot = el("p", { className: "rewrite-boot" });
  boot.append(text(t("ui.rewrite.booting")));
  const insight = text(view.insight);
  const gain = text(view.preview.gain);
  const requiredInsight = text(view.preview.requiredInsight);
  const afterInsight = text(view.preview.afterInsight);
  const currentMultiplier = text(view.preview.currentMultiplier);
  const targetMultiplier = text(view.preview.targetMultiplier);
  const speedup = text(view.preview.speedup);
  const nextMilestone = text(view.preview.nextMilestone);
  const nextInsight = text(view.preview.nextInsight);
  const startMoney = text(view.preview.startMoney);
  const startEra = text(view.preview.startEra);
  const startGenerators = text(view.preview.startGenerators);
  const button = createProjectButton("ui.rewrite.action", actions.rewrite);

  forecast.append(
    boot,
    createRewriteMeta("ui.rewrite.insight", insight),
    createRewriteMeta("ui.rewrite.gain", gain),
    createRewriteMeta("ui.rewrite.required", requiredInsight),
    createRewriteMeta("ui.rewrite.after", afterInsight),
    createRewriteMeta("ui.rewrite.currentMult", currentMultiplier),
    createRewriteMeta("ui.rewrite.nextMult", targetMultiplier),
    createRewriteMeta("ui.rewrite.speedup", speedup),
    createRewriteMeta("ui.rewrite.nextMilestone", nextMilestone),
    createRewriteMeta("ui.rewrite.nextInsight", nextInsight),
    createRewriteMeta("ui.rewrite.startMoney", startMoney),
    createRewriteMeta("ui.rewrite.startEra", startEra),
    createRewriteMeta("ui.rewrite.startGenerators", startGenerators),
    button
  );

  const lossesTitle = el("h2", { className: "section-title" });
  lossesTitle.append(text(t("ui.rewrite.losses")));
  const losses = el("section", { className: "rewrite-losses" });
  const lostLoc = text(view.preview.lostLoc);
  const lostMoney = text(view.preview.lostMoney);
  const lostAgents = text(view.preview.lostAgents);
  const lostHardware = text(view.preview.lostHardware);
  const lostProducts = text(view.preview.lostProducts);
  const lostUpgrades = text(view.preview.lostUpgrades);
  losses.append(
    createRewriteMeta("ui.resource.loc", lostLoc),
    createRewriteMeta("ui.resource.money", lostMoney),
    createRewriteMeta("ui.devfloor.agent", lostAgents),
    createRewriteMeta("ui.devfloor.hardware", lostHardware),
    createRewriteMeta("ui.projects.portfolio", lostProducts),
    createRewriteMeta("ui.devfloor.upgrades", lostUpgrades)
  );

  const treeTitle = el("h2", { className: "section-title" });
  treeTitle.append(text(t("ui.rewrite.insightTree")));
  const tree = el("section", { className: "insight-tree" });

  for (const branch of ["velocity", "capital", "craft", "core"]) {
    const column = el("section", { className: `insight-branch insight-branch--${branch}` });
    const branchTitle = el("h3", { className: "insight-branch__title" });
    branchTitle.append(text(t(`ui.insight.branch.${branch}`)));
    column.append(branchTitle);

    for (const node of view.nodes.filter((entry) => entry.branch === branch)) {
      column.append(createInsightNode(node, actions));
    }

    tree.append(column);
  }

  const exitSection = createExitSection(view.exit, actions);
  const paradoxSection = createParadoxSection(view.paradox, actions);

  rewriteNodes = {
    afterInsight,
    boot,
    bootOverlay,
    button,
    currentMultiplier,
    gain,
    insight,
    lostAgents,
    lostHardware,
    lostLoc,
    lostMoney,
    lostProducts,
    lostUpgrades,
    nextInsight,
    nextMilestone,
    requiredInsight,
    speedup,
    startEra,
    startGenerators,
    startMoney,
    targetMultiplier
  };
  updateRewrite(view);

  screen.append(
    title,
    bootOverlay,
    forecast,
    lossesTitle,
    losses,
    treeTitle,
    tree,
    exitSection,
    paradoxSection
  );
  return screen;
}

export function updateRewrite(view: RewriteView): void {
  if (rewriteNodes === undefined) {
    return;
  }

  setText(rewriteNodes.insight, view.insight);
  setText(rewriteNodes.gain, view.preview.gain);
  setText(rewriteNodes.requiredInsight, view.preview.requiredInsight);
  setText(rewriteNodes.afterInsight, view.preview.afterInsight);
  setText(rewriteNodes.currentMultiplier, view.preview.currentMultiplier);
  setText(rewriteNodes.targetMultiplier, view.preview.targetMultiplier);
  setText(rewriteNodes.speedup, view.preview.speedup);
  setText(rewriteNodes.nextMilestone, view.preview.nextMilestone);
  setText(rewriteNodes.nextInsight, view.preview.nextInsight);
  setText(rewriteNodes.startMoney, view.preview.startMoney);
  setText(rewriteNodes.startEra, view.preview.startEra);
  setText(rewriteNodes.startGenerators, view.preview.startGenerators);
  setText(rewriteNodes.lostLoc, view.preview.lostLoc);
  setText(rewriteNodes.lostMoney, view.preview.lostMoney);
  setText(rewriteNodes.lostAgents, view.preview.lostAgents);
  setText(rewriteNodes.lostHardware, view.preview.lostHardware);
  setText(rewriteNodes.lostProducts, view.preview.lostProducts);
  setText(rewriteNodes.lostUpgrades, view.preview.lostUpgrades);
  rewriteNodes.boot.hidden = !view.preview.booting;
  if (view.preview.booting) {
    rewriteNodes.bootOverlay.hidden = rewriteNodes.bootOverlay.dataset.skipped === "1";
  } else {
    rewriteNodes.bootOverlay.hidden = true;
    delete rewriteNodes.bootOverlay.dataset.skipped;
  }
  rewriteNodes.button.disabled = !view.preview.canRewrite;

  for (const node of view.nodes) {
    updateInsightNode(node);
  }

  updateExit(view.exit);
  updateParadox(view.paradox);
}

function createRewriteBootOverlay(): HTMLElement {
  const overlay = el("section", { className: "rewrite-boot-overlay" });
  overlay.hidden = true;
  overlay.setAttribute("aria-live", "polite");

  const cascade = el("div", { className: "rewrite-boot-overlay__cascade" });
  for (let index = 1; index <= 6; index += 1) {
    const line = el("span", { className: "rewrite-boot-overlay__line" });
    line.append(text(t(`ui.rewrite.bootLine${index}`)));
    cascade.append(line);
  }

  const consoleNode = el("div", { className: "rewrite-boot-overlay__console" });
  const title = el("h2", { className: "rewrite-boot-overlay__title" });
  title.append(text(t("ui.rewrite.bootTitle")));
  const command = el("p", { className: "rewrite-boot-overlay__command" });
  command.append(text(t("ui.rewrite.bootCommand")));
  const cursor = el("span", { className: "rewrite-boot-overlay__cursor" });
  cursor.append(text(t("ui.rewrite.bootCursor")));
  command.append(cursor);
  const skip = createSettingsButton("ui.rewrite.skipBoot", () => {
    overlay.dataset.skipped = "1";
    overlay.hidden = true;
  });
  skip.classList.add("rewrite-boot-overlay__skip");
  consoleNode.append(title, command, skip);
  overlay.append(cascade, consoleNode);
  return overlay;
}

function createExitSection(view: ExitView, actions: AppActions): HTMLElement {
  const section = el("section", { className: "exit-section" });
  section.hidden = !view.unlocked;
  const title = el("h2", { className: "section-title" });
  title.append(text(t("ui.exit.title")));

  const forecast = el("section", { className: "rewrite-forecast exit-forecast" });
  const currentEquity = text(view.preview.currentEquity);
  const gain = text(view.preview.gain);
  const requiredInsight = text(view.preview.requiredInsight);
  const totalInsightEarned = text(view.preview.totalInsightEarned);
  const equityAfter = text(view.preview.equityAfter);
  const currentMultiplier = text(view.preview.currentMultiplier);
  const targetMultiplier = text(view.preview.targetMultiplier);
  const rewardMultiplier = text(view.preview.rewardMultiplier);
  const button = createProjectButton("ui.exit.action", actions.exit);

  forecast.append(
    createRewriteMeta("ui.exit.equity", currentEquity),
    createRewriteMeta("ui.exit.gain", gain),
    createRewriteMeta("ui.exit.required", requiredInsight),
    createRewriteMeta("ui.exit.earnedInsight", totalInsightEarned),
    createRewriteMeta("ui.exit.after", equityAfter),
    createRewriteMeta("ui.exit.currentMult", currentMultiplier),
    createRewriteMeta("ui.exit.nextMult", targetMultiplier),
    createRewriteMeta("ui.exit.rewardMult", rewardMultiplier),
    button
  );

  const perksTitle = el("h3", { className: "section-title" });
  perksTitle.append(text(t("ui.exit.perks")));
  const perks = el("section", { className: "equity-perk-list" });
  for (const perk of view.perks) {
    perks.append(createEquityPerk(perk, actions));
  }

  const modifiersTitle = el("h3", { className: "section-title" });
  modifiersTitle.append(text(t("ui.exit.runModifiers")));
  const modifiers = el("section", { className: "run-modifier-list" });
  for (const modifier of view.runModifiers) {
    modifiers.append(createRunModifier(modifier, actions));
  }

  exitNodes = {
    button,
    currentEquity,
    currentMultiplier,
    equityAfter,
    gain,
    requiredInsight,
    rewardMultiplier,
    root: section,
    targetMultiplier,
    totalInsightEarned
  };

  section.append(title, forecast, perksTitle, perks, modifiersTitle, modifiers);
  return section;
}

function createParadoxSection(view: ParadoxView, actions: AppActions): HTMLElement {
  const section = el("section", { className: "paradox-section" });
  section.hidden = !view.unlocked;
  const title = el("h2", { className: "section-title" });
  title.append(text(t("ui.paradox.title")));

  const forecast = el("section", { className: "rewrite-forecast paradox-forecast" });
  const currentIteration = text(view.preview.currentIteration);
  const nextIteration = text(view.preview.nextIteration);
  const locRate = text(view.preview.locRate);
  const softcapThreshold = text(view.preview.softcapThreshold);
  const hold = text(view.preview.hold);
  const currentParadox = text(view.preview.currentParadox);
  const paradoxGain = text(view.preview.paradoxGain);
  const paradoxAfter = text(view.preview.paradoxAfter);
  const currentMultiplier = text(view.preview.currentMultiplier);
  const targetMultiplier = text(view.preview.targetMultiplier);
  const button = createProjectButton("ui.paradox.action", actions.iterate);

  forecast.append(
    createRewriteMeta("ui.paradox.iteration", currentIteration),
    createRewriteMeta("ui.paradox.nextIteration", nextIteration),
    createRewriteMeta("ui.paradox.locRate", locRate),
    createRewriteMeta("ui.paradox.threshold", softcapThreshold),
    createRewriteMeta("ui.paradox.hold", hold),
    createRewriteMeta("ui.paradox.paradox", currentParadox),
    createRewriteMeta("ui.paradox.gain", paradoxGain),
    createRewriteMeta("ui.paradox.after", paradoxAfter),
    createRewriteMeta("ui.paradox.currentMult", currentMultiplier),
    createRewriteMeta("ui.paradox.nextMult", targetMultiplier),
    button
  );

  const meta = el("section", { className: "rewrite-losses paradox-meta" });
  const ruleSlots = text(view.ruleSlots);
  const theme = text(view.theme);
  meta.append(
    createRewriteMeta("ui.paradox.ruleSlots", ruleSlots),
    createRewriteMeta("ui.paradox.theme", theme)
  );

  const shopTitle = el("h3", { className: "section-title" });
  shopTitle.append(text(t("ui.paradox.shop")));
  const shop = el("section", { className: "paradox-item-list" });
  for (const item of view.items) {
    shop.append(createParadoxItem(item, actions));
  }

  paradoxNodes = {
    button,
    currentIteration,
    currentMultiplier,
    currentParadox,
    hold,
    locRate,
    nextIteration,
    paradoxAfter,
    paradoxGain,
    root: section,
    ruleSlots,
    softcapThreshold,
    targetMultiplier,
    theme
  };

  section.append(title, forecast, meta, shopTitle, shop);
  return section;
}

function createInsightNode(view: InsightNodeView, actions: AppActions): HTMLElement {
  const root = el("article", { className: "insight-node" });
  const title = el("h3", { className: "insight-node__title" });
  title.append(text(view.name));
  const effect = text(view.effect);
  const cost = text(view.cost);
  const state = text(view.stateLabel);
  const button = createProjectButton("ui.insight.buy", () => actions.buyInsightNode(view.id));

  root.append(
    title,
    createProjectMeta("ui.research.effect", effect),
    createProjectMeta("ui.research.cost", cost),
    createProjectMeta("ui.research.state", state),
    button
  );
  insightNodes.set(view.id, { button, cost, effect, root, state });
  updateInsightNode(view);
  return root;
}

function createEquityPerk(view: EquityPerkView, actions: AppActions): HTMLElement {
  const root = el("div", { className: "upgrade-row equity-perk-row" });
  const name = el("strong", { className: "upgrade-row__name" });
  name.append(text(view.name));
  const effect = text(view.effect);
  const cost = text(view.cost);
  const state = text(view.stateLabel);
  const button = createBuyButton("ui.exit.buyPerk", () => actions.buyEquityPerk(view.id));

  root.append(name, createValueCell(effect), createValueCell(cost), createValueCell(state), button);
  equityPerks.set(view.id, { button, cost, effect, root, state });
  updateEquityPerk(view);
  return root;
}

function createRunModifier(view: RunModifierView, actions: AppActions): HTMLElement {
  const root = el("div", { className: "run-modifier-row" });
  const name = el("strong", { className: "run-modifier-row__name" });
  name.append(text(view.name));
  const description = text(view.description);
  const button = createBuyButton("ui.exit.selectModifier", () =>
    actions.selectRunModifier(view.id)
  );

  root.append(name, createValueCell(description), button);
  runModifiers.set(view.id, { button, description, root });
  updateRunModifier(view);
  return root;
}

function createParadoxItem(view: ParadoxItemView, actions: AppActions): HTMLElement {
  const root = el("div", { className: "upgrade-row paradox-item-row" });
  const name = el("strong", { className: "upgrade-row__name" });
  name.append(text(view.name));
  const effect = text(view.effect);
  const cost = text(view.cost);
  const state = text(view.stateLabel);
  const button = createBuyButton("ui.paradox.buyItem", () => actions.buyParadoxItem(view.id));

  root.append(name, createValueCell(effect), createValueCell(cost), createValueCell(state), button);
  paradoxItems.set(view.id, { button, cost, effect, root, state });
  updateParadoxItem(view);
  return root;
}

function updateInsightNode(view: InsightNodeView): void {
  const node = insightNodes.get(view.id);

  if (node === undefined) {
    return;
  }

  setText(node.effect, view.effect);
  setText(node.cost, view.cost);
  setText(node.state, view.stateLabel);
  node.root.dataset.state = view.state;
  node.button.disabled = !view.canBuy;
}

function updateExit(view: ExitView): void {
  if (exitNodes !== undefined) {
    exitNodes.root.hidden = !view.unlocked;
    setText(exitNodes.currentEquity, view.preview.currentEquity);
    setText(exitNodes.gain, view.preview.gain);
    setText(exitNodes.requiredInsight, view.preview.requiredInsight);
    setText(exitNodes.totalInsightEarned, view.preview.totalInsightEarned);
    setText(exitNodes.equityAfter, view.preview.equityAfter);
    setText(exitNodes.currentMultiplier, view.preview.currentMultiplier);
    setText(exitNodes.targetMultiplier, view.preview.targetMultiplier);
    setText(exitNodes.rewardMultiplier, view.preview.rewardMultiplier);
    exitNodes.button.disabled = !view.preview.canExit;
  }

  for (const perk of view.perks) {
    updateEquityPerk(perk);
  }

  for (const modifier of view.runModifiers) {
    updateRunModifier(modifier);
  }
}

function updateEquityPerk(view: EquityPerkView): void {
  const node = equityPerks.get(view.id);

  if (node === undefined) {
    return;
  }

  setText(node.effect, view.effect);
  setText(node.cost, view.cost);
  setText(node.state, view.stateLabel);
  node.root.dataset.state = view.state;
  node.button.disabled = !view.canBuy;
}

function updateRunModifier(view: RunModifierView): void {
  const node = runModifiers.get(view.id);

  if (node === undefined) {
    return;
  }

  setText(node.description, view.description);
  node.root.classList.toggle("run-modifier-row--active", view.active);
  node.root.classList.toggle("run-modifier-row--selected", view.selected);
  node.root.classList.toggle("run-modifier-row--locked", !view.unlocked);
  node.button.disabled = !view.unlocked || view.selected;
  node.button.textContent = t(
    view.selected ? "ui.exit.selectedModifier" : "ui.exit.selectModifier"
  );
}

function updateParadox(view: ParadoxView): void {
  if (paradoxNodes !== undefined) {
    paradoxNodes.root.hidden = !view.unlocked;
    setText(paradoxNodes.currentIteration, view.preview.currentIteration);
    setText(paradoxNodes.nextIteration, view.preview.nextIteration);
    setText(paradoxNodes.locRate, view.preview.locRate);
    setText(paradoxNodes.softcapThreshold, view.preview.softcapThreshold);
    setText(paradoxNodes.hold, view.preview.hold);
    setText(paradoxNodes.currentParadox, view.preview.currentParadox);
    setText(paradoxNodes.paradoxGain, view.preview.paradoxGain);
    setText(paradoxNodes.paradoxAfter, view.preview.paradoxAfter);
    setText(paradoxNodes.currentMultiplier, view.preview.currentMultiplier);
    setText(paradoxNodes.targetMultiplier, view.preview.targetMultiplier);
    setText(paradoxNodes.ruleSlots, view.ruleSlots);
    setText(paradoxNodes.theme, view.theme);
    paradoxNodes.button.disabled = !view.preview.canIterate;
  }

  for (const item of view.items) {
    updateParadoxItem(item);
  }
}

function updateParadoxItem(view: ParadoxItemView): void {
  const node = paradoxItems.get(view.id);

  if (node === undefined) {
    return;
  }

  setText(node.effect, view.effect);
  setText(node.cost, view.cost);
  setText(node.state, view.stateLabel);
  node.root.dataset.state = view.state;
  node.button.disabled = !view.canBuy;
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

function createProjectMeta(labelKey: string, value: Text): HTMLElement {
  const row = el("div", { className: "project-meta" });
  const label = el("span", { className: "project-meta__label" });
  label.append(text(t(labelKey)));
  const output = el("strong", { className: "project-meta__value" });
  output.append(value);
  row.append(label, output);
  return row;
}

function createRewriteMeta(labelKey: string, value: Text): HTMLElement {
  const row = el("div", { className: "rewrite-meta" });
  const label = el("span", { className: "project-meta__label" });
  label.append(text(t(labelKey)));
  const output = el("strong", { className: "project-meta__value" });
  output.append(value);
  row.append(label, output);
  return row;
}
