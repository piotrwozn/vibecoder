import type { Platform } from "../platform/platform";
import { Big, type BigInput } from "./bignum";
import { FutureSaveVersionError, migrateRawSave, SAVE_VERSION } from "./migrations";
import {
  createDefaultGameState,
  type ActiveBuild,
  type ActiveBug,
  type AutomationRule,
  type AuroraState,
  type AuroraStatus,
  type Edition,
  type EndingChoice,
  type GameState,
  type InboxEntry,
  type Product,
  type ProjectOffer,
  type ProjectPriority
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
    return {
      repaired: true,
      reset: true,
      resetReason: "load-failed",
      state: createDefaultGameState(nowMs, platform.edition),
      warnings: ["save load failed"]
    };
  }

  if (data === null) {
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

  if (decoded.resetReason === "newer-version") {
    return decoded;
  }

  const backup = await loadMostRecentBackup(platform, nowMs);

  if (backup !== undefined) {
    return backup;
  }

  return decoded;
}

export async function saveGameState(
  platform: Pick<Platform, "save">,
  state: GameState,
  nowMs = Date.now()
): Promise<boolean> {
  state.meta.lastSeen = nowMs;

  try {
    await platform.save(serializeGameState(state));
    return true;
  } catch {
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
  defaults.res.debt = repairBig(res.debt, defaults.res.debt, "res.debt", mark);
  defaults.res.equity = repairNumber(res.equity, defaults.res.equity, "res.equity", mark, {
    integer: true,
    nonNegative: true
  });
  defaults.res.hype = repairNumber(res.hype, defaults.res.hype, "res.hype", mark, {
    nonNegative: true
  });
  defaults.res.insight = repairBig(res.insight, defaults.res.insight, "res.insight", mark);
  defaults.res.loc = repairBig(res.loc, defaults.res.loc, "res.loc", mark);
  defaults.res.money = repairBig(res.money, defaults.res.money, "res.money", mark);
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
  defaults.lifetime.loc = repairBig(lifetime.loc, defaults.lifetime.loc, "lifetime.loc", mark);
  defaults.lifetime.locSinceExit = repairBig(
    lifetime.locSinceExit,
    defaults.lifetime.locSinceExit,
    "lifetime.locSinceExit",
    mark
  );
  defaults.lifetime.money = repairBig(
    lifetime.money,
    defaults.lifetime.money,
    "lifetime.money",
    mark
  );

  const owned = readRecord(raw, "owned", mark);
  defaults.owned.generators = repairNumberRecord(
    owned.generators,
    defaults.owned.generators,
    "owned.generators",
    mark
  );
  defaults.owned.hardware = repairNumberRecord(
    owned.hardware,
    defaults.owned.hardware,
    "owned.hardware",
    mark
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

  defaults.era = repairNumber(raw.era, defaults.era, "era", mark, {
    integer: true,
    nonNegative: true
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

  defaults.bugs = repairBugs(raw.bugs, "bugs", mark);

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

  const settings = readRecord(raw, "settings", mark);
  defaults.settings.autosaveS = repairNumber(
    settings.autosaveS,
    defaults.settings.autosaveS,
    "settings.autosaveS",
    mark,
    { positive: true }
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

  defaults.rngSeed = repairNumber(raw.rngSeed, defaults.rngSeed, "rngSeed", mark, {
    integer: true
  });

  return {
    repaired,
    reset: false,
    state: defaults,
    warnings
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

function repairBig(value: unknown, fallback: Big, path: string, mark: (path: string) => void): Big {
  try {
    return Big.from(value as BigInput);
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

function repairNumberRecord(
  value: unknown,
  fallback: Record<string, number>,
  path: string,
  mark: (path: string) => void
): Record<string, number> {
  const repaired = { ...fallback };

  if (!isRecord(value)) {
    mark(path);
    return repaired;
  }

  for (const [key, entry] of Object.entries(value)) {
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

    repaired.push({
      id: entry.id,
      buildS: repairNumber(entry.buildS, 0, `${path}.buildS`, mark, { nonNegative: true }),
      cost: repairBig(entry.cost, Big.zero(), `${path}.cost`, mark),
      elapsedS: repairNumber(entry.elapsedS, 0, `${path}.elapsedS`, mark, { nonNegative: true }),
      payout: repairBig(entry.payout, Big.zero(), `${path}.payout`, mark),
      projectId: entry.projectId,
      revenue: repairBig(entry.revenue, Big.zero(), `${path}.revenue`, mark)
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

    repaired.push({
      id: entry.id,
      bugged: typeof entry.bugged === "boolean" ? entry.bugged : false,
      projectId: entry.projectId,
      revenue: repairBig(entry.revenue, Big.zero(), `${path}.revenue`, mark),
      shippedAtS: repairNumber(entry.shippedAtS, 0, `${path}.shippedAtS`, mark, {
        nonNegative: true
      })
    });
  }

  return repaired;
}

function repairBugs(value: unknown, path: string, mark: (path: string) => void): ActiveBug[] {
  if (!Array.isArray(value)) {
    mark(path);
    return [];
  }

  const repaired: ActiveBug[] = [];

  for (const entry of value) {
    if (isRecord(entry) && typeof entry.productId === "string") {
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

  for (const entry of value) {
    if (isRecord(entry) && typeof entry.eventId === "string") {
      repaired.push({ eventId: entry.eventId });
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

    try {
      repaired[key] = Big.from(entry as BigInput);
    } catch {
      mark(`${path}.${key}`);
    }
  }

  return repaired;
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
