import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { Big } from "../core/bignum.ts";
import { createDefaultGameState } from "../core/state.ts";
import { APP_IDS } from "../core/ui-state.ts";
import { ACHIEVEMENTS } from "../data/achievements.ts";
import {
  AURORA_COMPLETED_FLAG,
  AURORA_DEDICATED_STARTED_FLAG,
  AURORA_HOSTING_STARTED_FLAG,
  AURORA_PHASES,
  AURORA_PHASE_STARTED_FLAG,
  AURORA_SERVER_COMPONENT_IDS,
  AURORA_SERVER_GLOBAL_REQUIREMENT_ID,
  AURORA_UNLOCK_FLAG
} from "../data/aurora.ts";
import { HARDWARE_POWER_RATES } from "../data/billing.ts";
import type { Condition } from "../data/conditions.ts";
import { ERAS } from "../data/eras.ts";
import { GENERATORS } from "../data/generators.ts";
import { HARDWARE } from "../data/hardware.ts";
import { INCIDENT_RESPONSES, PRODUCTION_INCIDENTS } from "../data/incidents.ts";
import {
  EQUITY_PERKS,
  INSIGHT_NODES,
  PARADOX_ITEMS,
  REWRITE_MILESTONES,
  RUN_MODIFIERS,
  type InsightEffect
} from "../data/prestige.ts";
import { PROJECT_CHAINS } from "../data/project-chains.ts";
import { PROJECTS, REFACTOR_PROJECT } from "../data/projects.ts";
import { RESEARCH, type ResearchEffect } from "../data/research.ts";
import { SPRINT_PRIORITIES } from "../data/roadmap.ts";
import { RUN_STYLES } from "../data/run-styles.ts";
import { ACT0_EVENTS } from "../data/story/act0.ts";
import { ACT1_EVENTS } from "../data/story/act1.ts";
import { ACT2_EVENTS } from "../data/story/act2.ts";
import { ACT3_EVENTS } from "../data/story/act3.ts";
import { ACT4_EVENTS } from "../data/story/act4.ts";
import { ACT5_EVENTS } from "../data/story/act5.ts";
import { DECISION_EVENTS } from "../data/story/decisions.ts";
import { ENDGAME_EVENTS } from "../data/story/endgame.ts";
import { ECHO_EVENTS } from "../data/story/echoes.ts";
import type { StoryEffect } from "../data/story/types.ts";
import { UPGRADES, type UpgradeEffect } from "../data/upgrades.ts";
import {
  VIBEX_CANNED_PAIRS,
  VIBEX_CODE_FILES,
  VIBEX_FILE_LABEL_KEYS,
  VIBEX_MANUAL_FALLBACK_KEYS
} from "../data/vibex.ts";
import { getSprintEffects, startSprint } from "../systems/roadmap.ts";
import { getRunStyleEffects } from "../systems/run-styles.ts";
import { getStoryDecisionEffects } from "../systems/story-decisions.ts";
import { screenLinks } from "../ui/render/app-icons.ts";
import { validateI18nMessages } from "./validate-i18n.ts";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const failures: string[] = [];
const ALLOWED_RUNTIME_DEPENDENCIES = new Set(["@wllama/wllama"]);
const LOCAL_AI_IMPORT_RE = /\b(?:from\s+|import\s*\(\s*|import\s+)["']@wllama\/wllama(?:\/|["'])/;
const STORY_EVENTS = [
  ...ACT0_EVENTS,
  ...ACT1_EVENTS,
  ...ACT2_EVENTS,
  ...ACT3_EVENTS,
  ...ACT4_EVENTS,
  ...ACT5_EVENTS,
  ...DECISION_EVENTS,
  ...ENDGAME_EVENTS,
  ...ECHO_EVENTS
] as const;
const ZERO = Big.zero();

function readText(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

function collectFiles(dir: string): string[] {
  const absoluteDir = join(repoRoot, dir);

  if (!existsSync(absoluteDir)) {
    return [];
  }

  const entries = readdirSync(absoluteDir);
  const files: string[] = [];

  for (const entry of entries) {
    const absoluteEntry = join(absoluteDir, entry);
    const stat = statSync(absoluteEntry);

    if (stat.isDirectory()) {
      files.push(...collectFiles(relative(repoRoot, absoluteEntry)));
    } else {
      files.push(relative(repoRoot, absoluteEntry).replaceAll("\\", "/"));
    }
  }

  return files;
}

function fail(message: string): void {
  failures.push(message);
}

function validatePackage(): void {
  const pkg = JSON.parse(readText("package.json")) as PackageJson;
  const runtimeDependencies = Object.keys(pkg.dependencies ?? {}).filter(
    (name) => !ALLOWED_RUNTIME_DEPENDENCIES.has(name)
  );

  if (runtimeDependencies.length > 0) {
    fail(`runtime dependencies are forbidden: ${runtimeDependencies.join(", ")}`);
  }
}

function validateI18n(): void {
  const en = JSON.parse(readText("src/i18n/en.json")) as Record<string, unknown>;
  const pl = JSON.parse(readText("src/i18n/pl.json")) as Record<string, unknown>;

  for (const failure of validateI18nMessages(en, pl)) {
    fail(failure);
  }
}

function validateLayering(tsFiles: readonly string[]): void {
  for (const file of tsFiles) {
    const source = readText(file);

    if (file.startsWith("src/data/") && importsLayer(source, "(systems|ui|platform)")) {
      fail(`${file} imports across a forbidden data layer boundary`);
    }

    if (file.startsWith("src/systems/") && importsLayer(source, "ui")) {
      fail(`${file} imports UI from a system module`);
    }

    if (file.startsWith("src/systems/") && importsLayer(source, "platform")) {
      fail(`${file} imports platform from a system module`);
    }

    if (file.startsWith("src/systems/") && /\b(document|window)\b/.test(source)) {
      fail(`${file} touches DOM globals from a system module`);
    }

    if (file.startsWith("src/ui/") && importsLayer(source, "systems")) {
      fail(`${file} imports game systems from UI`);
    }

    if (!file.startsWith("src/platform/ai.") && LOCAL_AI_IMPORT_RE.test(source)) {
      fail(`${file} imports the M15 local-AI dependency outside platform/ai.*`);
    }
  }
}

function importsLayer(source: string, layerPattern: string): boolean {
  return new RegExp(`(?:from\\s+|import\\s*\\(\\s*|import\\s+)["'][^"']*/${layerPattern}/`).test(
    source
  );
}

function validateUiText(): void {
  const uiFiles = collectFiles("src/ui").filter((file) => file.endsWith(".ts"));

  for (const file of uiFiles) {
    const source = readText(file);

    if (/\binnerHTML\b/.test(source)) {
      fail(`${file} uses innerHTML`);
    }

    if (/\.textContent\s*=\s*["'`][^"'`]+["'`]/.test(source)) {
      fail(`${file} assigns user-facing text directly; use i18n text nodes`);
    }

    if (/createTextNode\(\s*["'`][^"'`]+["'`]\s*\)/.test(source)) {
      fail(`${file} creates a literal text node; use i18n`);
    }
  }
}

function validateContentDefinitions(): void {
  const en = JSON.parse(readText("src/i18n/en.json")) as Record<string, unknown>;
  const pl = JSON.parse(readText("src/i18n/pl.json")) as Record<string, unknown>;
  const generatorIds = new Set(GENERATORS.map((entry) => entry.id));
  const hardwareIds = new Set(HARDWARE.map((entry) => entry.id));
  const projectIds = new Set([...PROJECTS, REFACTOR_PROJECT].map((entry) => entry.id));
  const projectChainIds = new Set(PROJECT_CHAINS.map((entry) => entry.id));
  const researchIds = new Set(RESEARCH.map((entry) => entry.id));
  const runModifierIds = new Set(RUN_MODIFIERS.map((entry) => entry.id));
  const runStyleIds = new Set(RUN_STYLES.map((entry) => entry.id));
  const storyEventIds = new Set(STORY_EVENTS.map((entry) => entry.id));
  const upgradeIds = new Set(UPGRADES.map((entry) => entry.id));
  const insightNodeIds = new Set(INSIGHT_NODES.map((entry) => entry.id));
  const flagIds = collectKnownFlags({ projectChainIds, runModifierIds, runStyleIds });

  validateUniqueIds("generator", GENERATORS);
  validateUniqueIds("hardware", HARDWARE);
  validateUniqueIds("project", [...PROJECTS, REFACTOR_PROJECT]);
  validateUniqueIds("research", RESEARCH);
  validateUniqueIds("sprint priority", SPRINT_PRIORITIES);
  validateUniqueIds("story event", STORY_EVENTS);
  validateUniqueIds("upgrade", UPGRADES);
  validateUniqueIds("achievement", ACHIEVEMENTS);
  validateUniqueIds("production incident", PRODUCTION_INCIDENTS);
  validateUniqueIds("incident response", INCIDENT_RESPONSES);
  validateUniqueIds("run style", RUN_STYLES);
  validateUniqueIds("project chain", PROJECT_CHAINS);
  validateUniqueIds("insight node", INSIGHT_NODES);
  validateUniqueIds(
    "rewrite milestone",
    REWRITE_MILESTONES.map((entry) => ({ id: String(entry.count) }))
  );
  validateUniqueIds("equity perk", EQUITY_PERKS);
  validateUniqueIds("run modifier", RUN_MODIFIERS);
  validateUniqueIds("paradox item", PARADOX_ITEMS);
  validateUniqueIds("Vibex canned pair", VIBEX_CANNED_PAIRS);
  validateUniqueIds("Vibex file", VIBEX_CODE_FILES);

  for (const generator of GENERATORS) {
    requireMessage(generator.nameKey, `generator ${generator.id}`, en, pl);
    validatePositiveBig(`generator ${generator.id} baseCost`, generator.baseCost);
    validatePositiveBig(`generator ${generator.id} baseRate`, generator.baseRate);
    validateFinitePositive(`generator ${generator.id} growth`, generator.growth);
    validateFinitePositive(`generator ${generator.id} computeUse`, generator.computeUse);
    if (generator.previousId !== undefined && !generatorIds.has(generator.previousId)) {
      fail(`generator ${generator.id} references missing previousId ${generator.previousId}`);
    }
  }

  for (const hardware of HARDWARE) {
    requireMessage(hardware.nameKey, `hardware ${hardware.id}`, en, pl);
    validatePositiveBig(`hardware ${hardware.id} baseCost`, hardware.baseCost);
    validateFiniteNonNegative(`hardware ${hardware.id} capPerLevel`, hardware.capPerLevel);
    validatePositiveNumber(`hardware ${hardware.id} maxLevel`, hardware.maxLevel);
    for (const unlock of hardware.unlock) {
      if (unlock.kind === "hardware" && !hardwareIds.has(unlock.id)) {
        fail(`hardware ${hardware.id} references missing unlock hardware ${unlock.id}`);
      }
    }
  }

  for (const rate of HARDWARE_POWER_RATES) {
    if (!hardwareIds.has(rate.hardwareId)) {
      fail(`hardware power rate references missing hardware ${rate.hardwareId}`);
    }
    validateNonNegativeBig(`hardware power rate ${rate.hardwareId}`, rate.ratePerLevel);
  }

  for (const era of ERAS) {
    requireMessage(era.modelKey, `era ${era.id}`, en, pl);
    if (era.cost !== undefined) {
      validatePositiveBig(`era ${era.id} cost`, era.cost);
    }
    validateCondition(era.unlock, `era ${era.id}`, {
      generatorIds,
      flagIds,
      projectIds,
      researchIds,
      storyEventIds,
      upgradeIds
    });
  }

  for (const project of [...PROJECTS, REFACTOR_PROJECT]) {
    requireMessage(project.nameKey, `project ${project.id}`, en, pl);
    validateNonNegativeBig(`project ${project.id} costLoC`, project.costLoC);
    validateFiniteNonNegative(`project ${project.id} buildS`, project.buildS);
    validateFiniteNonNegative(`project ${project.id} valueRatio`, project.valueRatio);
    validateFiniteNonNegative(`project ${project.id} rpReward`, project.rpReward ?? 0);
    validateFiniteNonNegative(`project ${project.id} rpFirst`, project.rpFirst ?? 0);
    validateCondition(project.unlock, `project ${project.id}`, {
      generatorIds,
      flagIds,
      projectIds,
      researchIds,
      storyEventIds,
      upgradeIds
    });
  }

  for (const chain of PROJECT_CHAINS) {
    requireMessage(chain.nameKey, `project chain ${chain.id}`, en, pl, { requirePl: true });
    requireMessage(chain.descriptionKey, `project chain ${chain.id}`, en, pl, {
      requirePl: true
    });

    if (chain.projectIds.length === 0) {
      fail(`project chain ${chain.id} has no projects`);
    }

    for (const projectId of chain.projectIds) {
      if (!projectIds.has(projectId)) {
        fail(`project chain ${chain.id} references missing project ${projectId}`);
      }
    }

    validateFiniteNonNegative(
      `project chain ${chain.id} momentum reward`,
      chain.reward.momentum ?? 0
    );
    validateFinitePositive(
      `project chain ${chain.id} buildTimeMultiplier`,
      chain.reward.buildTimeMultiplier ?? 1
    );
    validateFinitePositive(
      `project chain ${chain.id} locMultiplier`,
      chain.reward.locMultiplier ?? 1
    );
    validateFinitePositive(
      `project chain ${chain.id} payoutMultiplier`,
      chain.reward.payoutMultiplier ?? 1
    );
    validateFinitePositive(
      `project chain ${chain.id} revenueMultiplier`,
      chain.reward.revenueMultiplier ?? 1
    );
    validateFinitePositive(
      `project chain ${chain.id} rpMultiplier`,
      chain.reward.rpMultiplier ?? 1
    );
  }

  for (const research of RESEARCH) {
    requireMessage(research.nameKey, `research ${research.id}`, en, pl);
    requireMessage(research.effectKey, `research ${research.id}`, en, pl);
    validateFinitePositive(`research ${research.id} costRp`, research.costRp);
    if (research.requires !== undefined && !researchIds.has(research.requires)) {
      fail(`research ${research.id} references missing prerequisite ${research.requires}`);
    }
    for (const effect of research.effects) {
      validateResearchEffect(`research ${research.id}`, effect);
    }
  }

  for (const sprint of SPRINT_PRIORITIES) {
    requireMessage(sprint.nameKey, `sprint ${sprint.id}`, en, pl, { requirePl: true });
    requireMessage(sprint.descriptionKey, `sprint ${sprint.id}`, en, pl, { requirePl: true });
    validateFinitePositive(`sprint ${sprint.id} durationS`, sprint.durationS);
    validateFiniteNonNegative(`sprint ${sprint.id} cooldownS`, sprint.cooldownS);
  }

  for (const upgrade of UPGRADES) {
    requireMessage(upgrade.nameKey, `upgrade ${upgrade.id}`, en, pl);
    requireMessage(upgrade.effectKey, `upgrade ${upgrade.id}`, en, pl);
    validatePositiveBig(`upgrade ${upgrade.id} cost`, upgrade.cost);
    validateCondition(upgrade.unlock, `upgrade ${upgrade.id}`, {
      generatorIds,
      flagIds,
      projectIds,
      researchIds,
      storyEventIds,
      upgradeIds
    });
    for (const effect of upgrade.effects) {
      validateUpgradeEffect(`upgrade ${upgrade.id}`, effect);
      if (effect.kind === "generatorMultiplier" && !generatorIds.has(effect.generatorId)) {
        fail(`upgrade ${upgrade.id} references missing generator ${effect.generatorId}`);
      }
      if (effect.kind === "generatorSynergy") {
        if (!generatorIds.has(effect.sourceGeneratorId)) {
          fail(
            `upgrade ${upgrade.id} references missing source generator ${effect.sourceGeneratorId}`
          );
        }
        if (!generatorIds.has(effect.targetGeneratorId)) {
          fail(
            `upgrade ${upgrade.id} references missing target generator ${effect.targetGeneratorId}`
          );
        }
      }
    }
  }

  for (const achievement of ACHIEVEMENTS) {
    requireMessage(achievement.nameKey, `achievement ${achievement.id}`, en, pl);
    requireMessage(achievement.descriptionKey, `achievement ${achievement.id}`, en, pl);
  }

  const incidentResponseIds = new Set(INCIDENT_RESPONSES.map((entry) => entry.id));

  for (const response of INCIDENT_RESPONSES) {
    requireMessage(response.nameKey, `incident response ${response.id}`, en, pl, {
      requirePl: true
    });
    requireMessage(response.descriptionKey, `incident response ${response.id}`, en, pl, {
      requirePl: true
    });
    validateFiniteNonNegative(`incident response ${response.id} costLocS`, response.costLocS ?? 0);
    validateFiniteNonNegative(
      `incident response ${response.id} costMoneyRatio`,
      response.costMoneyRatio ?? 0
    );
    validateFiniteNonNegative(`incident response ${response.id} costRp`, response.costRp ?? 0);
  }

  for (const incident of PRODUCTION_INCIDENTS) {
    requireMessage(incident.nameKey, `incident ${incident.id}`, en, pl, { requirePl: true });
    requireMessage(incident.descriptionKey, `incident ${incident.id}`, en, pl, {
      requirePl: true
    });
    validateCondition(incident.trigger, `incident ${incident.id}`, {
      generatorIds,
      flagIds,
      projectIds,
      researchIds,
      storyEventIds,
      upgradeIds
    });
    validateFinitePositive(`incident ${incident.id} durationS`, incident.durationS);
    validateFinitePositive(`incident ${incident.id} severity`, incident.severity);
    validateFiniteNonNegative(`incident ${incident.id} baseChance`, incident.baseChance);
    for (const responseId of incident.responses) {
      if (!incidentResponseIds.has(responseId)) {
        fail(`incident ${incident.id} references missing response ${responseId}`);
      }
    }
  }

  for (const style of RUN_STYLES) {
    requireMessage(style.nameKey, `run style ${style.id}`, en, pl, { requirePl: true });
    requireMessage(style.effectKey, `run style ${style.id}`, en, pl, { requirePl: true });
    requireMessage(style.costKey, `run style ${style.id}`, en, pl, { requirePl: true });
  }

  for (const node of INSIGHT_NODES) {
    requireMessage(node.nameKey, `insight node ${node.id}`, en, pl);
    requireMessage(node.effectKey, `insight node ${node.id}`, en, pl);
    validateFinitePositive(`insight node ${node.id} costInsight`, node.costInsight);
    validateFiniteNonNegative(`insight node ${node.id} tier`, node.tier);
    if (node.requires !== undefined && !insightNodeIds.has(node.requires)) {
      fail(`insight node ${node.id} references missing prerequisite ${node.requires}`);
    }
    for (const effect of node.effects) {
      validateInsightEffect(`insight node ${node.id}`, effect, generatorIds);
    }
  }

  for (const milestone of REWRITE_MILESTONES) {
    requireMessage(milestone.nameKey, `rewrite milestone ${milestone.count}`, en, pl);
    requireMessage(milestone.descriptionKey, `rewrite milestone ${milestone.count}`, en, pl);
    validateFinitePositive(`rewrite milestone ${milestone.count} count`, milestone.count);
  }

  for (const perk of EQUITY_PERKS) {
    requireMessage(perk.nameKey, `equity perk ${perk.id}`, en, pl);
    requireMessage(perk.effectKey, `equity perk ${perk.id}`, en, pl);
    validateFinitePositive(`equity perk ${perk.id} costEquity`, perk.costEquity);
  }

  for (const modifier of RUN_MODIFIERS) {
    requireMessage(modifier.nameKey, `run modifier ${modifier.id}`, en, pl);
    requireMessage(modifier.descriptionKey, `run modifier ${modifier.id}`, en, pl);
    validateFinitePositive(
      `run modifier ${modifier.id} equityMultiplier`,
      modifier.equityMultiplier
    );
  }

  for (const item of PARADOX_ITEMS) {
    requireMessage(item.nameKey, `paradox item ${item.id}`, en, pl);
    requireMessage(item.effectKey, `paradox item ${item.id}`, en, pl);
    validateFinitePositive(`paradox item ${item.id} costParadox`, item.costParadox);
    if (item.echoEventId !== undefined && !storyEventIds.has(item.echoEventId)) {
      fail(`paradox item ${item.id} references missing echo event ${item.echoEventId}`);
    }
  }

  validateVibexContent(en, pl);

  for (const event of STORY_EVENTS) {
    requireStoryMessage(event.textKey, `story event ${event.id}`, en);
    validateCondition(event.trigger, `story event ${event.id}`, {
      generatorIds,
      flagIds,
      projectIds,
      researchIds,
      storyEventIds,
      upgradeIds
    });
    validateStoryEffects(`story event ${event.id}`, event.effects ?? []);
    for (const choice of event.choices ?? []) {
      requireMessage(choice.textKey, `story choice ${event.id}.${choice.id}`, en, pl);
      validateStoryEffects(`story choice ${event.id}.${choice.id}`, choice.effects);
    }
  }

  validateStrategicEffectOutputs();

  for (const phase of AURORA_PHASES) {
    requireMessage(phase.nameKey, `Aurora phase ${phase.id}`, en, pl);
    validatePositiveBig(`Aurora phase ${phase.id} costLoc`, phase.costLoc);
    validatePositiveBig(`Aurora phase ${phase.id} costMoney`, phase.costMoney);
    validateFinitePositive(`Aurora phase ${phase.id} workS`, phase.workS);
    validateFiniteNonNegative(`Aurora phase ${phase.id} requiredServers`, phase.requiredServers);
  }

  const auroraPercent = AURORA_PHASES.reduce((sum, phase) => sum + phase.percent, 0);
  if (auroraPercent !== 100) {
    fail(`Aurora phases should sum to 100%, got ${auroraPercent}%`);
  }

  for (const hardwareId of [...AURORA_SERVER_COMPONENT_IDS, AURORA_SERVER_GLOBAL_REQUIREMENT_ID]) {
    if (!hardwareIds.has(hardwareId)) {
      fail(`Aurora references missing hardware ${hardwareId}`);
    }
  }

  validateAppLinks(en, pl);
}

function validateUniqueIds(label: string, entries: readonly { readonly id: string }[]): void {
  const seen = new Set<string>();

  for (const entry of entries) {
    if (seen.has(entry.id)) {
      fail(`duplicate ${label} id ${entry.id}`);
    }
    seen.add(entry.id);
  }
}

function collectKnownFlags(refs: {
  readonly projectChainIds: ReadonlySet<string>;
  readonly runModifierIds: ReadonlySet<string>;
  readonly runStyleIds: ReadonlySet<string>;
}): Set<string> {
  const flags = new Set<string>([
    AURORA_COMPLETED_FLAG,
    AURORA_DEDICATED_STARTED_FLAG,
    AURORA_HOSTING_STARTED_FLAG,
    AURORA_PHASE_STARTED_FLAG,
    AURORA_UNLOCK_FLAG,
    "aurora_billing_started",
    "aurora_seed_available",
    "aurora_server_quorum",
    "iteration_unlocked"
  ]);

  for (const event of STORY_EVENTS) {
    collectStoryEffectFlags(event.effects, flags);
    for (const choice of event.choices ?? []) {
      collectStoryEffectFlags(choice.effects, flags);
    }
  }

  for (const id of refs.projectChainIds) {
    flags.add(`projectChain.completed.${id}`);
  }

  for (const id of refs.runModifierIds) {
    flags.add(`prestige.runModifier.active.${id}`);
    flags.add(`prestige.runModifier.next.${id}`);
  }

  for (const id of refs.runStyleIds) {
    flags.add(`runStyle.${id}`);
  }

  for (const item of PARADOX_ITEMS) {
    if (item.echoEventId !== undefined) {
      flags.add(`paradox.echo.${item.echoEventId}`);
    }
  }

  return flags;
}

function collectStoryEffectFlags(
  effects: readonly { readonly flag?: string; readonly kind: string }[] | undefined,
  flags: Set<string>
): void {
  for (const effect of effects ?? []) {
    if ((effect.kind === "hypeAddOnce" || effect.kind === "setFlag") && effect.flag !== undefined) {
      flags.add(effect.flag);
    }

    if (effect.kind === "setEnding") {
      flags.add("iteration_unlocked");
    }
  }
}

function requireMessage(
  key: string,
  owner: string,
  en: Readonly<Record<string, unknown>>,
  pl: Readonly<Record<string, unknown>>,
  options: { readonly requirePl?: boolean } = {}
): void {
  if (typeof en[key] !== "string") {
    fail(`${owner} missing en i18n key ${key}`);
  }

  if (options.requirePl === true && typeof pl[key] !== "string") {
    fail(`${owner} missing pl i18n key ${key}`);
  }
}

function requireStoryMessage(
  key: string,
  owner: string,
  en: Readonly<Record<string, unknown>>
): void {
  if (typeof en[key] === "string") {
    return;
  }

  if (typeof en[`${key}.1`] === "string") {
    return;
  }

  fail(`${owner} missing en i18n key ${key} or ${key}.1`);
}

function validateInsightEffect(
  owner: string,
  effect: InsightEffect,
  generatorIds: ReadonlySet<string>
): void {
  switch (effect.kind) {
    case "startGenerator":
      if (!generatorIds.has(effect.generatorId)) {
        fail(`${owner} references missing start generator ${effect.generatorId}`);
      }
      validateFinitePositive(`${owner} start generator count`, effect.count);
      break;
    case "startEra":
      validateFinitePositive(`${owner} start era`, effect.era);
      break;
    case "startMoney":
      try {
        validatePositiveBig(`${owner} start money`, Big.from(effect.amount));
      } catch {
        fail(`${owner} start money must be a valid Big value`);
      }
      break;
    case "flowMultiplier":
      validateFinitePositive(`${owner} flow multiplier`, effect.value);
      break;
    case "goldenClientChance":
      validateFiniteNonNegative(`${owner} golden client chance`, effect.chance);
      break;
    case "hypeTauAdd":
      validateFiniteNonNegative(`${owner} hype tau add`, effect.seconds);
      break;
    case "offlineCapHoursAdd":
      validateFiniteNonNegative(`${owner} offline cap hours`, effect.hours);
      break;
    case "projectBoardSlotsAdd":
      validateFiniteNonNegative(`${owner} project board slots`, effect.slots);
      break;
    case "bugPenalty":
    case "qualityAdd":
      validateFiniteNonNegative(`${owner} ${effect.kind}`, effect.value);
      break;
    case "startMoneyRatio":
      validateFiniteNonNegative(`${owner} start money ratio`, effect.fraction);
      break;
    case "debtFactorMultiplier":
    case "generatorCostMultiplier":
    case "locMultiplier":
    case "payoutMultiplier":
    case "qaMultiplier":
    case "revenueMultiplier":
      validateFinitePositive(`${owner} ${effect.kind}`, effect.multiplier);
      break;
    case "keepAutomation":
    case "refactorInstant":
      break;
  }
}

function validateResearchEffect(owner: string, effect: ResearchEffect): void {
  switch (effect.kind) {
    case "autoFixDelay":
      validateFiniteNonNegative(`${owner} autoFixDelay`, effect.seconds);
      break;
    case "autoPromptRate":
      validateFiniteNonNegative(`${owner} autoPromptRate`, effect.fraction);
      break;
    case "bugChanceMultiplier":
    case "buildTimeMultiplier":
    case "debtFactorMultiplier":
    case "locMultiplier":
    case "olderEraGeneratorMultiplier":
    case "qaMultiplier":
    case "refactorDebtMultiplier":
      validateFinitePositive(`${owner} ${effect.kind}`, effect.multiplier);
      break;
    case "bugPenalty":
    case "clickSynergy":
    case "qualityAdd":
      validateFiniteNonNegative(`${owner} ${effect.kind}`, effect.value);
      break;
    case "flowDuration":
      validateFinitePositive(`${owner} flowDuration`, effect.seconds);
      break;
    case "offlineCapHours":
      validateFiniteNonNegative(`${owner} offlineCapHours`, effect.hours);
      break;
    case "projectBoardSlots":
      validateFinitePositive(`${owner} projectBoardSlots`, effect.slots);
      break;
    case "unlockAutomation":
      break;
  }
}

function validateUpgradeEffect(owner: string, effect: UpgradeEffect): void {
  switch (effect.kind) {
    case "autoFixDelay":
      validateFiniteNonNegative(`${owner} autoFixDelay`, effect.seconds);
      break;
    case "bugChanceCapMultiplier":
    case "clickMultiplier":
    case "computeUseMultiplier":
    case "debtFactorMultiplier":
    case "flowGainMultiplier":
    case "generatorEraMultiplier":
    case "generatorMultiplier":
    case "globalGeneratorMultiplier":
    case "hypeShipMultiplier":
    case "payoutMultiplier":
    case "revenueMultiplier":
      validateFinitePositive(`${owner} ${effect.kind}`, effect.multiplier);
      break;
    case "clickSynergy":
    case "hypeCap":
    case "hypeFloor":
    case "qualityAdd":
      validateFiniteNonNegative(`${owner} ${effect.kind}`, effect.value);
      break;
    case "generatorSynergy":
      validateFiniteNonNegative(`${owner} generatorSynergy`, effect.multiplierPerSource);
      break;
    case "hypeTau":
      validateFinitePositive(`${owner} hypeTau`, effect.seconds);
      break;
  }
}

function validateStoryEffects(owner: string, effects: readonly StoryEffect[]): void {
  for (const effect of effects) {
    switch (effect.kind) {
      case "grantResource":
        try {
          validateNonNegativeBig(`${owner} ${effect.resource} grant`, Big.from(effect.amount));
        } catch {
          fail(`${owner} ${effect.resource} grant must be a valid Big value`);
        }
        break;
      case "grantRp":
      case "hypeAdd":
        validateFiniteNonNegative(`${owner} ${effect.kind}`, effect.amount);
        break;
      case "hypeAddOnce":
        validateFiniteNonNegative(`${owner} hypeAddOnce`, effect.amount);
        break;
      case "snoozeEvent":
        validateFiniteNonNegative(`${owner} snoozeEvent`, effect.seconds);
        break;
      case "setAct":
      case "setEnding":
      case "setFlag":
      case "unlock":
        break;
    }
  }
}

function validateStrategicEffectOutputs(): void {
  validatePositiveNumberRecord("sprint neutral", getSprintEffects(createDefaultGameState()));

  for (const sprint of SPRINT_PRIORITIES) {
    const state = createDefaultGameState();
    startSprint(state, sprint.id);
    validatePositiveNumberRecord(`sprint ${sprint.id}`, getSprintEffects(state));
  }

  for (const style of RUN_STYLES) {
    const state = createDefaultGameState();
    state.metaprogression.runStyle = style.id;
    validatePositiveNumberRecord(`run style ${style.id}`, getRunStyleEffects(state));
  }

  const decisionFlags = [
    "decision.bootstrapped",
    "decision.vc_backed",
    "decision.open_source",
    "decision.enterprise",
    "decision.privacy",
    "decision.growth",
    "decision.hire_humans",
    "decision.automate",
    "decision.quality",
    "decision.ship_fast",
    "decision.cloud_vendor",
    "decision.self_host",
    "decision.sell_company",
    "decision.stay_independent"
  ] as const;

  for (const flag of decisionFlags) {
    const state = createDefaultGameState();
    state.story.flags.add(flag);
    validatePositiveNumberRecord(flag, getStoryDecisionEffects(state));
  }
}

function validatePositiveNumberRecord(owner: string, values: object): void {
  for (const [key, value] of Object.entries(values)) {
    if (typeof value !== "number") {
      fail(`${owner} ${key} must be a number`);
      continue;
    }

    validateFinitePositive(`${owner} ${key}`, value);
  }
}

function validateVibexContent(
  en: Readonly<Record<string, unknown>>,
  pl: Readonly<Record<string, unknown>>
): void {
  for (const key of VIBEX_FILE_LABEL_KEYS) {
    requireMessage(key, "Vibex file label", en, pl);
  }

  for (const pair of VIBEX_CANNED_PAIRS) {
    requireMessage(pair.promptKey, `Vibex canned pair ${pair.id}`, en, pl);
    requireMessage(pair.responseKey, `Vibex canned pair ${pair.id}`, en, pl);
  }

  for (const key of VIBEX_MANUAL_FALLBACK_KEYS) {
    requireMessage(key, "Vibex manual fallback", en, pl);
  }

  const fragmentIds = new Set<string>();
  for (const file of VIBEX_CODE_FILES) {
    requireMessage(file.labelKey, `Vibex file ${file.id}`, en, pl);

    for (const fragment of file.fragments) {
      const fragmentId = `${file.id}.${fragment.id}`;
      if (fragmentIds.has(fragmentId)) {
        fail(`duplicate Vibex fragment id ${fragmentId}`);
      }
      fragmentIds.add(fragmentId);

      if (fragment.lineKeys.length === 0) {
        fail(`Vibex fragment ${fragmentId} has no code lines`);
      }

      for (const key of fragment.lineKeys) {
        requireMessage(key, `Vibex fragment ${fragmentId}`, en, pl);
      }
    }
  }
}

function validateCondition(
  condition: Condition | undefined,
  owner: string,
  refs: {
    readonly generatorIds: ReadonlySet<string>;
    readonly flagIds: ReadonlySet<string>;
    readonly projectIds: ReadonlySet<string>;
    readonly researchIds: ReadonlySet<string>;
    readonly storyEventIds: ReadonlySet<string>;
    readonly upgradeIds: ReadonlySet<string>;
  }
): void {
  if (condition === undefined) {
    return;
  }

  for (const nested of condition.all ?? []) {
    validateCondition(nested, owner, refs);
  }

  for (const nested of condition.any ?? []) {
    validateCondition(nested, owner, refs);
  }

  if (condition.generatorGte !== undefined && !refs.generatorIds.has(condition.generatorGte.id)) {
    fail(`${owner} condition references missing generator ${condition.generatorGte.id}`);
  }

  if (condition.flag !== undefined && !refs.flagIds.has(condition.flag)) {
    fail(`${owner} condition references missing flag ${condition.flag}`);
  }

  if (condition.research !== undefined && !refs.researchIds.has(condition.research)) {
    fail(`${owner} condition references missing research ${condition.research}`);
  }

  if (condition.projectShipped !== undefined && !refs.projectIds.has(condition.projectShipped)) {
    fail(`${owner} condition references missing shipped project ${condition.projectShipped}`);
  }

  if (condition.seen !== undefined && !refs.storyEventIds.has(condition.seen)) {
    fail(`${owner} condition references missing story event ${condition.seen}`);
  }

  if (condition.upgrade !== undefined && !refs.upgradeIds.has(condition.upgrade)) {
    fail(`${owner} condition references missing upgrade ${condition.upgrade}`);
  }
}

function validateAppLinks(
  en: Readonly<Record<string, unknown>>,
  pl: Readonly<Record<string, unknown>>
): void {
  const linkedApps = new Set(screenLinks.map((link) => link.appId));

  for (const appId of APP_IDS) {
    if (!linkedApps.has(appId)) {
      fail(`app ${appId} is missing a screen link`);
    }
    requireMessage(`ui.app.${appId}`, `app ${appId}`, en, pl, { requirePl: true });
  }
}

function validatePositiveBig(label: string, value: Big): void {
  if (!value.gt(ZERO)) {
    fail(`${label} must be positive`);
  }
}

function validateNonNegativeBig(label: string, value: Big): void {
  if (value.lt(ZERO)) {
    fail(`${label} must be non-negative`);
  }
}

function validateFinitePositive(label: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    fail(`${label} must be finite and positive`);
  }
}

function validatePositiveNumber(label: string, value: number): void {
  if (Number.isNaN(value) || value <= 0) {
    fail(`${label} must be positive`);
  }
}

function validateFiniteNonNegative(label: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    fail(`${label} must be finite and non-negative`);
  }
}

const tsFiles = collectFiles("src").filter((file) => file.endsWith(".ts"));

validatePackage();
validateI18n();
validateLayering(tsFiles);
validateUiText();
validateContentDefinitions();

if (failures.length > 0) {
  console.error("validate: FAIL");

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log(`validate: PASS (${tsFiles.length} TypeScript files scanned)`);
