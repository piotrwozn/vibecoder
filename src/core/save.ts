import type { Platform } from "../platform/platform";
import { Big, type BigInput } from "./bignum";
import { GENERATORS } from "../data/generators";
import { HARDWARE, LEGACY_HARDWARE_ID } from "../data/hardware";
import { PROJECTS, REFACTOR_PROJECT } from "../data/projects";
import { FutureSaveVersionError, migrateRawSave, SAVE_VERSION } from "./migrations";
import {
  createDefaultGameState,
  createDefaultVibexState,
  type ActiveBuild,
  type ActiveBug,
  type AutomationRule,
  type AuroraState,
  type AuroraStatus,
  type BankState,
  type BankWarningLevel,
  type Edition,
  type EndingChoice,
  type GameState,
  type IncidentResponseId,
  type InboxEntry,
  type MetaprogressionState,
  type Product,
  type ProductionIncident,
  type ProductionIncidentHistoryEntry,
  type ProductionIncidentsState,
  type ProductionIncidentType,
  type ProjectOffer,
  type ProjectPriority,
  type RunStyleId,
  type SprintPriority,
  type SprintState,
  type VibexState
} from "./state";
import {
  APP_IDS,
  TUTORIAL_STEPS,
  createDefaultWindowState,
  isAppId,
  type AppId,
  type SceneId,
  type TutorialState,
  type TutorialStep,
  type WindowFrame,
  type WindowState
} from "./ui-state";

type RawObject = Record<string, unknown>;
type StatValue = number | Big;

const PROJECT_IDS = new Set(PROJECTS.map((project) => project.id));
const ACTIVE_BUILD_PROJECT_IDS = new Set([...PROJECT_IDS, REFACTOR_PROJECT.id]);
const GENERATOR_IDS = new Set(GENERATORS.map((generator) => generator.id));
const HARDWARE_IDS = new Set([...HARDWARE.map((hardware) => hardware.id), LEGACY_HARDWARE_ID]);
const BANK_DEFAULT_OVERDRAFT = Big.fromNumber(10_000);

export interface SaveDecodeOptions {
  readonly edition?: Edition;
  readonly nowMs?: number;
}

export interface SaveDecodeResult {
  readonly repaired: boolean;
  readonly reset: boolean;
  readonly resetReason?: "corrupt" | "load-failed" | "newer-version";
  readonly state: GameState;
  readonly warnings: readonly string[];
}

export type ImportSaveResult =
  | (SaveDecodeResult & { readonly ok: true })
  | { readonly ok: false; readonly warnings: readonly string[] };

export function serializeGameState(state: GameState): string {
  return JSON.stringify(state, (_key, value: unknown) =>
    value instanceof Set ? Array.from(value) : value
  );
}

export function deserializeGameState(
  data: string,
  options: SaveDecodeOptions = {}
): SaveDecodeResult {
  const parsed = parseJson(data);

  if (!parsed.ok) {
    return createResetDecodeResult(options, ["save JSON could not be read"], "corrupt");
  }

  if (!isRecord(parsed.value)) {
    return createResetDecodeResult(options, ["save root was not an object"], "corrupt");
  }

  try {
    return repairGameState(parsed.value, options);
  } catch (error) {
    if (error instanceof FutureSaveVersionError) {
      return createResetDecodeResult(
        options,
        [`save version ${error.version} is newer than this build`],
        "newer-version"
      );
    }

    return createResetDecodeResult(options, ["save decode failed"], "corrupt");
  }
}

export async function loadGameState(
  platform: Pick<Platform, "backupCorrupt" | "edition" | "listBackups" | "load" | "loadBackup">,
  nowMs = Date.now()
): Promise<SaveDecodeResult> {
  let data: string | null;

  try {
    data = await platform.load();
  } catch {
    const backup = await loadMostRecentBackup(platform, nowMs);

    if (backup !== undefined) {
      return {
        ...backup,
        warnings: ["save load failed", ...backup.warnings]
      };
    }

    return {
      repaired: true,
      reset: true,
      resetReason: "load-failed",
      state: createDefaultGameState(nowMs, platform.edition),
      warnings: ["save load failed"]
    };
  }

  if (data === null) {
    const backup = await loadMostRecentBackup(platform, nowMs);

    if (backup !== undefined) {
      return backup;
    }

    return {
      repaired: false,
      reset: false,
      state: createDefaultGameState(nowMs, platform.edition),
      warnings: []
    };
  }

  const decoded = deserializeGameState(data, { edition: platform.edition, nowMs });

  if (!decoded.reset) {
    return decoded;
  }

  await backupUnreadableSave(platform, data, nowMs);

  const backup = await loadMostRecentBackup(platform, nowMs);

  if (backup !== undefined) {
    if (decoded.resetReason === "newer-version") {
      return {
        ...backup,
        reset: true,
        resetReason: "newer-version",
        warnings: [...decoded.warnings, ...backup.warnings]
      };
    }

    return backup;
  }

  return decoded;
}

export async function saveGameState(
  platform: Pick<Platform, "save">,
  state: GameState,
  nowMs = Date.now()
): Promise<boolean> {
  const previousLastSeen = state.meta.lastSeen;
  state.meta.lastSeen = nowMs;

  try {
    await platform.save(serializeGameState(state));
    return true;
  } catch {
    state.meta.lastSeen = previousLastSeen;
    return false;
  }
}

export function shouldBlockPersistenceAfterLoad(
  result: Pick<SaveDecodeResult, "reset" | "resetReason">
): boolean {
  return result.reset && result.resetReason !== "corrupt";
}

export function exportGameState(state: GameState): string {
  return encodeBase64(serializeGameState(state));
}

export function importGameState(
  payload: string,
  options: SaveDecodeOptions = {}
): ImportSaveResult {
  const decoded = decodeBase64(payload.trim());

  if (!decoded.ok) {
    return { ok: false, warnings: ["save import was not valid base64"] };
  }

  if (!parseJson(decoded.value).ok) {
    return { ok: false, warnings: ["save import was not valid JSON"] };
  }

  return {
    ok: true,
    ...deserializeGameState(decoded.value, options)
  };
}

function repairGameState(rawValue: unknown, options: SaveDecodeOptions): SaveDecodeResult {
  const nowMs = options.nowMs;
  const defaults = createDefaultGameState(nowMs, options.edition);
  const migrated = migrateRawSave(rawValue);
  const raw = migrated.raw;
  const warnings = [...migrated.warnings];
  let repaired = migrated.repaired;

  const mark = (path: string): void => {
    repaired = true;
    warnings.push(`${path} repaired`);
  };

  const meta = readRecord(raw, "meta", mark);
  defaults.v = SAVE_VERSION;
  defaults.meta.createdAt = repairNumber(
    meta.createdAt,
    defaults.meta.createdAt,
    "meta.createdAt",
    mark
  );
  defaults.meta.edition =
    options.edition ?? repairEdition(meta.edition, defaults.meta.edition, mark);
  defaults.meta.lastSeen = repairNumber(
    meta.lastSeen,
    defaults.meta.lastSeen,
    "meta.lastSeen",
    mark
  );
  defaults.meta.lastSimTickMs = repairNumber(
    meta.lastSimTickMs,
    defaults.meta.lastSeen,
    "meta.lastSimTickMs",
    mark
  );
  defaults.meta.playtimeS = repairNumber(
    meta.playtimeS,
    defaults.meta.playtimeS,
    "meta.playtimeS",
    mark,
    {
      nonNegative: true
    }
  );

  const res = readRecord(raw, "res", mark);
  defaults.res.computeCap = repairNumber(
    res.computeCap,
    defaults.res.computeCap,
    "res.computeCap",
    mark,
    {
      integer: true,
      nonNegative: true
    }
  );
  defaults.res.computeUsed = repairNumber(
    res.computeUsed,
    defaults.res.computeUsed,
    "res.computeUsed",
    mark,
    { nonNegative: true }
  );
  defaults.res.debt = repairBig(res.debt, defaults.res.debt, "res.debt", mark, {
    nonNegative: true
  });
  defaults.res.equity = repairNumber(res.equity, defaults.res.equity, "res.equity", mark, {
    integer: true,
    nonNegative: true
  });
  defaults.res.hype = repairNumber(res.hype, defaults.res.hype, "res.hype", mark, {
    nonNegative: true
  });
  defaults.res.insight = repairBig(res.insight, defaults.res.insight, "res.insight", mark, {
    nonNegative: true
  });
  defaults.res.loc = repairBig(res.loc, defaults.res.loc, "res.loc", mark, {
    nonNegative: true
  });
  defaults.res.money = repairBig(res.money, defaults.res.money, "res.money", mark, {
    nonNegative: true
  });
  defaults.res.paradox = repairNumber(res.paradox, defaults.res.paradox, "res.paradox", mark, {
    integer: true,
    nonNegative: true
  });
  defaults.res.rp = repairNumber(res.rp, defaults.res.rp, "res.rp", mark, {
    integer: true,
    nonNegative: true
  });

  const lifetime = readRecord(raw, "lifetime", mark);
  defaults.lifetime.insightSinceExit = repairNumber(
    lifetime.insightSinceExit,
    defaults.lifetime.insightSinceExit,
    "lifetime.insightSinceExit",
    mark,
    { integer: true, nonNegative: true }
  );
  defaults.lifetime.loc = repairBig(lifetime.loc, defaults.lifetime.loc, "lifetime.loc", mark, {
    nonNegative: true
  });
  defaults.lifetime.locSinceExit = repairBig(
    lifetime.locSinceExit,
    defaults.lifetime.locSinceExit,
    "lifetime.locSinceExit",
    mark,
    { nonNegative: true }
  );
  defaults.lifetime.money = repairBig(
    lifetime.money,
    defaults.lifetime.money,
    "lifetime.money",
    mark,
    { nonNegative: true }
  );

  const owned = readRecord(raw, "owned", mark);
  defaults.owned.generators = repairNumberRecord(
    owned.generators,
    defaults.owned.generators,
    "owned.generators",
    mark,
    GENERATOR_IDS
  );
  defaults.owned.hardware = repairNumberRecord(
    owned.hardware,
    defaults.owned.hardware,
    "owned.hardware",
    mark,
    HARDWARE_IDS
  );
  defaults.owned.equityPerks = repairStringSet(
    owned.equityPerks,
    defaults.owned.equityPerks,
    "owned.equityPerks",
    mark
  );
  defaults.owned.insightNodes = repairStringSet(
    owned.insightNodes,
    defaults.owned.insightNodes,
    "owned.insightNodes",
    mark
  );
  defaults.owned.paradoxItems = repairStringSet(
    owned.paradoxItems,
    defaults.owned.paradoxItems,
    "owned.paradoxItems",
    mark
  );
  defaults.owned.research = repairStringSet(
    owned.research,
    defaults.owned.research,
    "owned.research",
    mark
  );
  defaults.owned.upgrades = repairStringSet(
    owned.upgrades,
    defaults.owned.upgrades,
    "owned.upgrades",
    mark
  );

  const hardware = readRecord(raw, "hardware", mark);
  defaults.hardware.pcComplete = repairBoolean(
    hardware.pcComplete,
    defaults.hardware.pcComplete,
    "hardware.pcComplete",
    mark
  );

  defaults.aurora = repairAurora(raw.aurora, defaults.aurora, "aurora", mark);
  defaults.roadmap = repairSprintState(raw.roadmap, defaults.roadmap, "roadmap", mark);
  defaults.incidents = repairProductionIncidents(
    raw.incidents,
    defaults.incidents,
    "incidents",
    mark
  );
  defaults.metaprogression = repairMetaprogression(
    raw.metaprogression,
    defaults.metaprogression,
    "metaprogression",
    mark
  );
  defaults.bank = repairBank(raw.bank, defaults.bank, "bank", mark);

  defaults.era = repairNumber(raw.era, defaults.era, "era", mark, {
    integer: true,
    positive: true
  });

  const projects = readRecord(raw, "projects", mark);
  defaults.projects.active = repairActiveBuilds(projects.active, "projects.active", mark);
  defaults.projects.board = repairProjectOffers(projects.board, "projects.board", mark);
  defaults.projects.boardRefreshAt = repairNumber(
    projects.boardRefreshAt,
    defaults.projects.boardRefreshAt,
    "projects.boardRefreshAt",
    mark,
    { nonNegative: true }
  );
  defaults.projects.portfolio = repairProducts(projects.portfolio, "projects.portfolio", mark);
  defaults.projects.prioritySetting = repairProjectPriority(
    projects.prioritySetting,
    defaults.projects.prioritySetting,
    mark
  );

  defaults.bugs = repairBugs(raw.bugs, defaults.projects.portfolio, "bugs", mark);

  const flow = readRecord(raw, "flow", mark);
  defaults.flow.activeUntil = repairNumber(
    flow.activeUntil,
    defaults.flow.activeUntil,
    "flow.activeUntil",
    mark,
    {
      nonNegative: true
    }
  );
  defaults.flow.meter = repairNumber(flow.meter, defaults.flow.meter, "flow.meter", mark, {
    nonNegative: true
  });

  const prestige = readRecord(raw, "prestige", mark);
  defaults.prestige.exits = repairNumber(
    prestige.exits,
    defaults.prestige.exits,
    "prestige.exits",
    mark,
    {
      integer: true,
      nonNegative: true
    }
  );
  defaults.prestige.iteration = repairNumber(
    prestige.iteration,
    defaults.prestige.iteration,
    "prestige.iteration",
    mark,
    { integer: true, nonNegative: true }
  );
  defaults.prestige.rewrites = repairNumber(
    prestige.rewrites,
    defaults.prestige.rewrites,
    "prestige.rewrites",
    mark,
    { integer: true, nonNegative: true }
  );
  const endingChoice = repairEndingChoice(prestige.endingChoice);
  if (endingChoice !== undefined) {
    defaults.prestige.endingChoice = endingChoice;
  }

  const story = readRecord(raw, "story", mark);
  defaults.story.act = repairNumber(story.act, defaults.story.act, "story.act", mark, {
    integer: true,
    nonNegative: true
  });
  defaults.story.choices = repairStringRecord(story.choices, "story.choices", mark);
  defaults.story.flags = repairStringSet(story.flags, defaults.story.flags, "story.flags", mark);
  defaults.story.inbox = repairInbox(story.inbox, "story.inbox", mark);
  defaults.story.seen = repairStringSet(story.seen, defaults.story.seen, "story.seen", mark);
  if (defaults.story.seen.has("a5_13_aurora_seed") || defaults.aurora.unlocked) {
    defaults.story.flags.add("aurora_seed_available");
  }

  defaults.automation = repairAutomation(raw.automation, "automation", mark);
  defaults.stats = repairStats(raw.stats, "stats", mark);

  defaults.rngSeed = repairNumber(raw.rngSeed, defaults.rngSeed, "rngSeed", mark, {
    integer: true
  });
  defaults.vibex = repairVibex(raw.vibex, createDefaultVibexState(defaults.rngSeed), "vibex", mark);

  const settings = readRecord(raw, "settings", mark);
  defaults.settings.autosaveS = repairNumber(
    settings.autosaveS,
    defaults.settings.autosaveS,
    "settings.autosaveS",
    mark,
    { integer: true, min: 1, positive: true }
  );
  defaults.settings.doNotDisturb = repairBoolean(
    settings.doNotDisturb,
    defaults.settings.doNotDisturb,
    "settings.doNotDisturb",
    mark
  );
  defaults.settings.glitch = repairBoolean(
    settings.glitch,
    defaults.settings.glitch,
    "settings.glitch",
    mark
  );
  defaults.settings.lang = repairLanguage(
    settings.lang,
    defaults.settings.lang,
    "settings.lang",
    mark
  );
  defaults.settings.notation = repairNotation(settings.notation, defaults.settings.notation, mark);
  defaults.settings.reducedFx = repairBoolean(
    settings.reducedFx,
    defaults.settings.reducedFx,
    "settings.reducedFx",
    mark
  );
  defaults.settings.skipIntro = repairBoolean(
    settings.skipIntro,
    defaults.settings.skipIntro,
    "settings.skipIntro",
    mark
  );
  defaults.settings.sound = repairBoolean(
    settings.sound,
    defaults.settings.sound,
    "settings.sound",
    mark
  );
  defaults.settings.vibexLocalAi = repairBoolean(
    settings.vibexLocalAi,
    defaults.settings.vibexLocalAi,
    "settings.vibexLocalAi",
    mark
  );
  defaults.settings.volume = repairNumber(
    settings.volume,
    defaults.settings.volume,
    "settings.volume",
    mark,
    {
      nonNegative: true
    }
  );

  const ui = readRecord(raw, "ui", mark);
  defaults.ui.scene = repairScene(ui.scene, defaults.ui.scene, mark);
  defaults.ui.bootSeen = repairBoolean(ui.bootSeen, defaults.ui.bootSeen, "ui.bootSeen", mark);
  defaults.ui.tutorial = repairTutorial(ui.tutorial, defaults.ui.tutorial, "ui.tutorial", mark);
  defaults.ui.windows = repairWindows(ui.windows, defaults.ui.windows, "ui.windows", mark);

  return {
    repaired,
    reset: false,
    state: defaults,
    warnings
  };
}

function repairVibex(
  value: unknown,
  fallback: VibexState,
  path: string,
  mark: (path: string) => void
): VibexState {
  if (!isRecord(value)) {
    mark(path);
    return fallback;
  }

  return {
    cannedSeed: repairNumber(value.cannedSeed, fallback.cannedSeed, `${path}.cannedSeed`, mark, {
      integer: true
    }),
    codeSeed: repairNumber(value.codeSeed, fallback.codeSeed, `${path}.codeSeed`, mark, {
      integer: true
    })
  };
}

function createResetDecodeResult(
  options: SaveDecodeOptions,
  warnings: readonly string[],
  resetReason: SaveDecodeResult["resetReason"]
): SaveDecodeResult {
  return {
    repaired: true,
    reset: true,
    resetReason,
    state: createDefaultGameState(options.nowMs, options.edition),
    warnings
  };
}

async function backupUnreadableSave(
  platform: Pick<Platform, "backupCorrupt">,
  data: string,
  nowMs: number
): Promise<void> {
  try {
    await platform.backupCorrupt?.(data, nowMs);
  } catch {
    // The backup is best-effort; the caller still needs a bootable state.
  }
}

async function loadMostRecentBackup(
  platform: Pick<Platform, "edition" | "listBackups" | "loadBackup">,
  nowMs: number
): Promise<SaveDecodeResult | undefined> {
  let names: readonly string[];

  try {
    names = (await platform.listBackups?.()) ?? [];
  } catch {
    return undefined;
  }

  for (const name of names) {
    let data: string | null;

    try {
      data = (await platform.loadBackup?.(name)) ?? null;
    } catch {
      continue;
    }

    if (data === null) {
      continue;
    }

    const decoded = deserializeGameState(data, { edition: platform.edition, nowMs });

    if (!decoded.reset) {
      return {
        ...decoded,
        repaired: true,
        warnings: ["save restored from backup", ...decoded.warnings]
      };
    }
  }

  return undefined;
}

function parseJson(
  data: string
): { readonly ok: true; readonly value: unknown } | { readonly ok: false } {
  try {
    return { ok: true, value: JSON.parse(data) as unknown };
  } catch {
    return { ok: false };
  }
}

function readRecord(raw: RawObject, key: string, mark: (path: string) => void): RawObject {
  const value = raw[key];

  if (isRecord(value)) {
    return value;
  }

  mark(key);
  return {};
}

interface NumberOptions {
  readonly integer?: boolean;
  readonly min?: number;
  readonly nonNegative?: boolean;
  readonly positive?: boolean;
}

function repairNumber(
  value: unknown,
  fallback: number,
  path: string,
  mark: (path: string) => void,
  options: NumberOptions = {}
): number {
  const valid =
    typeof value === "number" &&
    Number.isFinite(value) &&
    (!options.integer || Number.isInteger(value)) &&
    (options.min === undefined || value >= options.min) &&
    (!options.nonNegative || value >= 0) &&
    (!options.positive || value > 0);

  if (valid) {
    return value;
  }

  mark(path);
  return fallback;
}

function repairLanguage(
  value: unknown,
  fallback: string,
  path: string,
  mark: (path: string) => void
): string {
  if (value === "en" || value === "pl") {
    return value;
  }

  mark(path);
  return fallback;
}

function repairBoolean(
  value: unknown,
  fallback: boolean,
  path: string,
  mark: (path: string) => void
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  mark(path);
  return fallback;
}

interface BigOptions {
  readonly nonNegative?: boolean;
}

function repairBig(
  value: unknown,
  fallback: Big,
  path: string,
  mark: (path: string) => void,
  options: BigOptions = {}
): Big {
  try {
    const repaired = Big.from(value as BigInput);

    if (options.nonNegative && repaired.lt(Big.zero())) {
      mark(path);
      return fallback.copy();
    }

    return repaired;
  } catch {
    mark(path);
    return fallback.copy();
  }
}

function repairEdition(value: unknown, fallback: Edition, mark: (path: string) => void): Edition {
  if (value === "demo" || value === "full") {
    return value;
  }

  mark("meta.edition");
  return fallback;
}

function repairNotation(
  value: unknown,
  fallback: GameState["settings"]["notation"],
  mark: (path: string) => void
): GameState["settings"]["notation"] {
  if (value === "sci" || value === "suffix") {
    return value;
  }

  mark("settings.notation");
  return fallback;
}

function repairScene(value: unknown, fallback: SceneId, mark: (path: string) => void): SceneId {
  if (value === "boot" || value === "desktop") {
    return value;
  }

  mark("ui.scene");
  return fallback;
}

function repairTutorial(
  value: unknown,
  fallback: TutorialState,
  path: string,
  mark: (path: string) => void
): TutorialState {
  if (!isRecord(value)) {
    mark(path);
    return { ...fallback };
  }

  const completed = repairBoolean(value.completed, fallback.completed, `${path}.completed`, mark);
  return {
    active: completed
      ? false
      : repairBoolean(value.active, fallback.active, `${path}.active`, mark),
    completed,
    step: completed ? "done" : repairTutorialStep(value.step, fallback.step, `${path}.step`, mark)
  };
}

function repairTutorialStep(
  value: unknown,
  fallback: TutorialStep,
  path: string,
  mark: (path: string) => void
): TutorialStep {
  if (typeof value === "string" && (TUTORIAL_STEPS as readonly string[]).includes(value)) {
    return value as TutorialStep;
  }

  mark(path);
  return fallback;
}

function repairProjectPriority(
  value: unknown,
  fallback: ProjectPriority,
  mark: (path: string) => void
): ProjectPriority {
  if (value === "payout" || value === "revenue" || value === "rp") {
    return value;
  }

  mark("projects.prioritySetting");
  return fallback;
}

function repairSprintPriority(value: unknown): SprintPriority | undefined {
  return value === "automation" ||
    value === "aurora" ||
    value === "growth" ||
    value === "research" ||
    value === "revenue" ||
    value === "stability"
    ? value
    : undefined;
}

function repairIncidentType(value: unknown): ProductionIncidentType | undefined {
  return value === "aurora_instability" ||
    value === "bad_deploy" ||
    value === "billing_shock" ||
    value === "outage" ||
    value === "security_bug" ||
    value === "vendor_lock_in" ||
    value === "viral_launch_spike"
    ? value
    : undefined;
}

function repairIncidentResponse(value: unknown): IncidentResponseId | undefined {
  return value === "accept_debt" ||
    value === "buy_hardware" ||
    value === "hotfix" ||
    value === "pause_growth" ||
    value === "pay_vendor" ||
    value === "refactor" ||
    value === "use_research"
    ? value
    : undefined;
}

function repairRunStyle(value: unknown): RunStyleId | undefined {
  return value === "aurora_first" ||
    value === "bootstrapped" ||
    value === "cursed_enterprise" ||
    value === "open_source_collective" ||
    value === "research_lab" ||
    value === "vc_backed"
    ? value
    : undefined;
}

function repairEndingChoice(value: unknown): EndingChoice | undefined {
  return value === "merge" || value === "unplug" || value === "fork" ? value : undefined;
}

function repairAurora(
  value: unknown,
  fallback: AuroraState,
  path: string,
  mark: (path: string) => void
): AuroraState {
  if (!isRecord(value)) {
    mark(path);
    return { ...fallback };
  }

  return {
    billingPaused: repairBoolean(
      value.billingPaused,
      fallback.billingPaused,
      `${path}.billingPaused`,
      mark
    ),
    completed: repairBoolean(value.completed, fallback.completed, `${path}.completed`, mark),
    currentPhase: repairNumber(
      value.currentPhase,
      fallback.currentPhase,
      `${path}.currentPhase`,
      mark,
      {
        integer: true,
        nonNegative: true
      }
    ),
    dedicatedServers: repairNumber(
      value.dedicatedServers,
      fallback.dedicatedServers,
      `${path}.dedicatedServers`,
      mark,
      { integer: true, nonNegative: true }
    ),
    hostedServers: repairNumber(
      value.hostedServers,
      fallback.hostedServers,
      `${path}.hostedServers`,
      mark,
      {
        integer: true,
        nonNegative: true
      }
    ),
    phaseActive: repairBoolean(
      value.phaseActive,
      fallback.phaseActive,
      `${path}.phaseActive`,
      mark
    ),
    phaseElapsedS: repairNumber(
      value.phaseElapsedS,
      fallback.phaseElapsedS,
      `${path}.phaseElapsedS`,
      mark,
      {
        nonNegative: true
      }
    ),
    status: repairAuroraStatus(value.status, fallback.status, `${path}.status`, mark),
    unlocked: repairBoolean(value.unlocked, fallback.unlocked, `${path}.unlocked`, mark)
  };
}

function repairAuroraStatus(
  value: unknown,
  fallback: AuroraStatus,
  path: string,
  mark: (path: string) => void
): AuroraStatus {
  if (
    value === "billing" ||
    value === "complete" ||
    value === "funding" ||
    value === "locked" ||
    value === "ready" ||
    value === "servers"
  ) {
    return value;
  }

  mark(path);
  return fallback;
}

function repairSprintState(
  value: unknown,
  fallback: SprintState,
  path: string,
  mark: (path: string) => void
): SprintState {
  if (!isRecord(value)) {
    mark(path);
    return { ...fallback };
  }

  const active = repairSprintPriority(value.active);
  const repaired: SprintState = {
    completed: repairNumber(value.completed, fallback.completed, `${path}.completed`, mark, {
      integer: true,
      nonNegative: true
    }),
    cooldownUntilS: repairNumber(
      value.cooldownUntilS,
      fallback.cooldownUntilS,
      `${path}.cooldownUntilS`,
      mark,
      { nonNegative: true }
    ),
    endsAtS: repairNumber(value.endsAtS, fallback.endsAtS, `${path}.endsAtS`, mark, {
      nonNegative: true
    }),
    startedAtS: repairNumber(value.startedAtS, fallback.startedAtS, `${path}.startedAtS`, mark, {
      nonNegative: true
    })
  };

  if (active !== undefined) {
    repaired.active = active;
  } else if (value.active !== undefined) {
    mark(`${path}.active`);
  }

  return repaired;
}

function repairProductionIncidents(
  value: unknown,
  fallback: ProductionIncidentsState,
  path: string,
  mark: (path: string) => void
): ProductionIncidentsState {
  if (!isRecord(value)) {
    mark(path);
    return { active: [], history: [], nextCheckAtS: fallback.nextCheckAtS };
  }

  return {
    active: repairIncidentList(value.active, `${path}.active`, mark),
    history: repairIncidentHistory(value.history, `${path}.history`, mark),
    nextCheckAtS: repairNumber(
      value.nextCheckAtS,
      fallback.nextCheckAtS,
      `${path}.nextCheckAtS`,
      mark,
      { nonNegative: true }
    )
  };
}

function repairMetaprogression(
  value: unknown,
  fallback: MetaprogressionState,
  path: string,
  mark: (path: string) => void
): MetaprogressionState {
  if (!isRecord(value)) {
    mark(path);
    return { ...fallback };
  }

  const runStyle = repairRunStyle(value.runStyle);
  if (runStyle === undefined) {
    if (value.runStyle !== undefined) {
      mark(`${path}.runStyle`);
    }
    return {};
  }

  return { runStyle };
}

function repairBank(
  value: unknown,
  fallback: BankState,
  path: string,
  mark: (path: string) => void
): BankState {
  if (!isRecord(value)) {
    mark(path);
    return {
      defaulted: fallback.defaulted,
      overdraft: fallback.overdraft.copy(),
      warningsIssued: fallback.warningsIssued
    };
  }

  const warningsIssued = repairBankWarningLevel(
    value.warningsIssued,
    fallback.warningsIssued,
    mark
  );
  const bank: BankState = {
    defaulted: repairBoolean(value.defaulted, fallback.defaulted, `${path}.defaulted`, mark),
    overdraft: repairBig(value.overdraft, fallback.overdraft, `${path}.overdraft`, mark, {
      nonNegative: true
    }),
    warningsIssued
  };

  if (bank.overdraft.gte(BANK_DEFAULT_OVERDRAFT) && !bank.defaulted) {
    mark(`${path}.defaulted`);
    bank.defaulted = true;
  }

  if (bank.defaulted && bank.warningsIssued < 2) {
    mark(`${path}.warningsIssued`);
    bank.warningsIssued = 2;
  }

  if (bank.defaulted || value.defaultedAtS !== undefined) {
    bank.defaultedAtS = repairNumber(
      value.defaultedAtS,
      fallback.defaultedAtS ?? 0,
      `${path}.defaultedAtS`,
      mark,
      { nonNegative: true }
    );
  }

  if (!bank.defaulted && value.defaultedAtS !== undefined) {
    mark(`${path}.defaultedAtS`);
    delete bank.defaultedAtS;
  }

  return bank;
}

function repairBankWarningLevel(
  value: unknown,
  fallback: BankWarningLevel,
  mark: (path: string) => void
): BankWarningLevel {
  if (value === 0 || value === 1 || value === 2) {
    return value;
  }

  mark("bank.warningsIssued");
  return fallback;
}

function repairIncidentList(
  value: unknown,
  path: string,
  mark: (path: string) => void
): ProductionIncident[] {
  if (!Array.isArray(value)) {
    mark(path);
    return [];
  }

  const repaired: ProductionIncident[] = [];

  for (const entry of value) {
    const incident = repairIncident(entry, path, mark);
    if (incident !== undefined) {
      repaired.push(incident);
    }
  }

  return repaired;
}

function repairIncidentHistory(
  value: unknown,
  path: string,
  mark: (path: string) => void
): ProductionIncidentHistoryEntry[] {
  if (!Array.isArray(value)) {
    mark(path);
    return [];
  }

  const repaired: ProductionIncidentHistoryEntry[] = [];

  for (const entry of value) {
    const incident = repairIncident(entry, path, mark);
    if (incident?.resolvedAtS !== undefined) {
      repaired.push({
        id: incident.id,
        response: incident.response,
        resolvedAtS: incident.resolvedAtS,
        severity: incident.severity,
        startedAtS: incident.startedAtS,
        type: incident.type
      });
    } else {
      mark(path);
    }
  }

  return repaired;
}

function repairIncident(
  value: unknown,
  path: string,
  mark: (path: string) => void
): ProductionIncident | undefined {
  if (!isRecord(value) || typeof value.id !== "string") {
    mark(path);
    return undefined;
  }

  const type = repairIncidentType(value.type);
  if (type === undefined) {
    mark(`${path}.type`);
    return undefined;
  }

  const response = repairIncidentResponse(value.response);
  const incident: ProductionIncident = {
    id: value.id,
    severity: repairNumber(value.severity, 1, `${path}.severity`, mark, {
      nonNegative: true
    }),
    startedAtS: repairNumber(value.startedAtS, 0, `${path}.startedAtS`, mark, {
      nonNegative: true
    }),
    type,
    untilS: repairNumber(value.untilS, 0, `${path}.untilS`, mark, { nonNegative: true })
  };

  if (response !== undefined) {
    incident.response = response;
  } else if (value.response !== undefined) {
    mark(`${path}.response`);
  }

  if (value.resolvedAtS !== undefined) {
    incident.resolvedAtS = repairNumber(value.resolvedAtS, 0, `${path}.resolvedAtS`, mark, {
      nonNegative: true
    });
  }

  return incident;
}

function repairNumberRecord(
  value: unknown,
  fallback: Record<string, number>,
  path: string,
  mark: (path: string) => void,
  validKeys?: ReadonlySet<string>
): Record<string, number> {
  const repaired = { ...fallback };

  if (!isRecord(value)) {
    mark(path);
    return repaired;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (validKeys !== undefined && !validKeys.has(key)) {
      mark(`${path}.${key}`);
      continue;
    }

    if (typeof entry === "number" && Number.isInteger(entry) && entry >= 0) {
      repaired[key] = entry;
    } else {
      mark(`${path}.${key}`);
    }
  }

  return repaired;
}

function repairStringRecord(
  value: unknown,
  path: string,
  mark: (path: string) => void
): Record<string, string> {
  const repaired: Record<string, string> = {};

  if (!isRecord(value)) {
    mark(path);
    return repaired;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      repaired[key] = entry;
    } else {
      mark(`${path}.${key}`);
    }
  }

  return repaired;
}

function repairStringSet(
  value: unknown,
  fallback: Set<string>,
  path: string,
  mark: (path: string) => void
): Set<string> {
  if (!Array.isArray(value)) {
    mark(path);
    return new Set(fallback);
  }

  const repaired = new Set<string>();

  for (const entry of value) {
    if (typeof entry === "string") {
      repaired.add(entry);
    } else {
      mark(path);
    }
  }

  return repaired;
}

function repairProjectOffers(
  value: unknown,
  path: string,
  mark: (path: string) => void
): ProjectOffer[] {
  if (!Array.isArray(value)) {
    mark(path);
    return [];
  }

  const repaired: ProjectOffer[] = [];

  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.projectId !== "string") {
      mark(path);
      continue;
    }

    if (!PROJECT_IDS.has(entry.projectId)) {
      mark(`${path}.${entry.projectId}`);
      continue;
    }

    repaired.push({
      id: typeof entry.id === "string" ? entry.id : entry.projectId,
      projectId: entry.projectId
    });
  }

  return repaired;
}

function repairActiveBuilds(
  value: unknown,
  path: string,
  mark: (path: string) => void
): ActiveBuild[] {
  if (!Array.isArray(value)) {
    mark(path);
    return [];
  }

  const repaired: ActiveBuild[] = [];

  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.id !== "string" || typeof entry.projectId !== "string") {
      mark(path);
      continue;
    }

    if (!ACTIVE_BUILD_PROJECT_IDS.has(entry.projectId)) {
      mark(`${path}.${entry.projectId}`);
      continue;
    }

    repaired.push({
      id: entry.id,
      buildS: repairNumber(entry.buildS, 0, `${path}.buildS`, mark, { nonNegative: true }),
      cost: repairBig(entry.cost, Big.zero(), `${path}.cost`, mark, { nonNegative: true }),
      elapsedS: repairNumber(entry.elapsedS, 0, `${path}.elapsedS`, mark, { nonNegative: true }),
      payout: repairBig(entry.payout, Big.zero(), `${path}.payout`, mark, { nonNegative: true }),
      projectId: entry.projectId,
      revenue: repairBig(entry.revenue, Big.zero(), `${path}.revenue`, mark, {
        nonNegative: true
      })
    });
  }

  return repaired;
}

function repairProducts(value: unknown, path: string, mark: (path: string) => void): Product[] {
  if (!Array.isArray(value)) {
    mark(path);
    return [];
  }

  const repaired: Product[] = [];

  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.id !== "string" || typeof entry.projectId !== "string") {
      mark(path);
      continue;
    }

    if (!PROJECT_IDS.has(entry.projectId)) {
      mark(`${path}.${entry.projectId}`);
      continue;
    }

    repaired.push({
      id: entry.id,
      bugged: typeof entry.bugged === "boolean" ? entry.bugged : false,
      level: repairNumber(entry.level, 1, `${path}.level`, mark, {
        integer: true,
        positive: true
      }),
      projectId: entry.projectId,
      revenue: repairBig(entry.revenue, Big.zero(), `${path}.revenue`, mark, {
        nonNegative: true
      }),
      shippedAtS: repairNumber(entry.shippedAtS, 0, `${path}.shippedAtS`, mark, {
        nonNegative: true
      })
    });
  }

  return repaired;
}

function repairBugs(
  value: unknown,
  products: readonly Product[],
  path: string,
  mark: (path: string) => void
): ActiveBug[] {
  if (!Array.isArray(value)) {
    mark(path);
    return [];
  }

  const repaired: ActiveBug[] = [];
  const buggedProductIds = new Set(
    products.filter((product) => product.bugged).map((product) => product.id)
  );

  for (const entry of value) {
    if (isRecord(entry) && typeof entry.productId === "string") {
      if (!buggedProductIds.has(entry.productId)) {
        mark(`${path}.${entry.productId}`);
        continue;
      }

      repaired.push({ productId: entry.productId });
    } else {
      mark(path);
    }
  }

  return repaired;
}

function repairInbox(value: unknown, path: string, mark: (path: string) => void): InboxEntry[] {
  if (!Array.isArray(value)) {
    mark(path);
    return [];
  }

  const repaired: InboxEntry[] = [];

  for (const [index, entry] of value.entries()) {
    if (isRecord(entry) && typeof entry.eventId === "string") {
      repaired.push({
        id:
          typeof entry.id === "string" && entry.id.length > 0
            ? entry.id
            : `${entry.eventId}.${index + 1}`,
        eventId: entry.eventId
      });
    } else {
      mark(path);
    }
  }

  return repaired;
}

function repairAutomation(
  value: unknown,
  path: string,
  mark: (path: string) => void
): Record<string, AutomationRule> {
  const repaired: Record<string, AutomationRule> = {};

  if (!isRecord(value)) {
    mark(path);
    return repaired;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (isRecord(entry) && typeof entry.enabled === "boolean") {
      repaired[key] = { enabled: entry.enabled };
    } else {
      mark(`${path}.${key}`);
    }
  }

  return repaired;
}

function repairStats(
  value: unknown,
  path: string,
  mark: (path: string) => void
): Record<string, StatValue> {
  const repaired: Record<string, StatValue> = {};

  if (!isRecord(value)) {
    mark(path);
    return repaired;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "number" && Number.isFinite(entry)) {
      repaired[key] = entry;
      continue;
    }

    if (isBigLikeStat(entry)) {
      repaired[key] = Big.from(entry);
      continue;
    }

    if (typeof entry !== "string") {
      mark(`${path}.${key}`);
      continue;
    }

    try {
      repaired[key] = Big.from(entry);
    } catch {
      mark(`${path}.${key}`);
    }
  }

  return repaired;
}

function isBigLikeStat(value: unknown): value is BigInput {
  return (
    isRecord(value) &&
    typeof value.m === "number" &&
    Number.isFinite(value.m) &&
    typeof value.e === "number" &&
    Number.isFinite(value.e)
  );
}

function repairWindows(
  value: unknown,
  fallback: Record<AppId, WindowState>,
  path: string,
  mark: (path: string) => void
): Record<AppId, WindowState> {
  const repaired = { ...fallback };

  if (!isRecord(value)) {
    mark(path);
    return repaired;
  }

  for (const appId of APP_IDS) {
    const entry = value[appId];

    if (!isRecord(entry)) {
      mark(`${path}.${appId}`);
      repaired[appId] = createDefaultWindowState(appId);
      continue;
    }

    repaired[appId] = repairWindow(entry, appId, `${path}.${appId}`, mark);
  }

  return repaired;
}

function repairWindow(
  value: RawObject,
  appId: AppId,
  path: string,
  mark: (path: string) => void
): WindowState {
  const fallback = createDefaultWindowState(appId);
  const savedAppId = isAppId(value.appId) ? value.appId : appId;
  const windowState: WindowState = {
    appId,
    h: repairNumber(value.h, fallback.h, `${path}.h`, mark, { positive: true }),
    maximized: repairBoolean(value.maximized, fallback.maximized, `${path}.maximized`, mark),
    minimized: repairBoolean(value.minimized, fallback.minimized, `${path}.minimized`, mark),
    open: repairBoolean(value.open, fallback.open, `${path}.open`, mark),
    w: repairNumber(value.w, fallback.w, `${path}.w`, mark, { positive: true }),
    x: repairNumber(value.x, fallback.x, `${path}.x`, mark, { nonNegative: true }),
    y: repairNumber(value.y, fallback.y, `${path}.y`, mark, { nonNegative: true }),
    z: repairNumber(value.z, fallback.z, `${path}.z`, mark, {
      integer: true,
      nonNegative: true
    })
  };

  if (savedAppId !== appId) {
    mark(`${path}.appId`);
  }

  const restore = repairWindowFrame(value.restore, `${path}.restore`, mark);
  if (restore !== undefined) {
    windowState.restore = restore;
  }

  return windowState;
}

function repairWindowFrame(
  value: unknown,
  path: string,
  mark: (path: string) => void
): WindowFrame | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    mark(path);
    return undefined;
  }

  return {
    h: repairNumber(value.h, 0, `${path}.h`, mark, { positive: true }),
    w: repairNumber(value.w, 0, `${path}.w`, mark, { positive: true }),
    x: repairNumber(value.x, 0, `${path}.x`, mark, { nonNegative: true }),
    y: repairNumber(value.y, 0, `${path}.y`, mark, { nonNegative: true })
  };
}

function isRecord(value: unknown): value is RawObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function encodeBase64(value: string): string {
  const bytes = new globalThis.TextEncoder().encode(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return globalThis.btoa(binary);
}

function decodeBase64(
  value: string
): { readonly ok: true; readonly value: string } | { readonly ok: false } {
  try {
    const binary = globalThis.atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return { ok: true, value: new globalThis.TextDecoder().decode(bytes) };
  } catch {
    return { ok: false };
  }
}
