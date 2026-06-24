import { createDefaultTutorialState, createDefaultUiState } from "./ui-state";
import { Big } from "./bignum";
import { C } from "../data/constants";
import {
  HARDWARE,
  LEGACY_HARDWARE_CAP_PER_LEVEL,
  LEGACY_HARDWARE_ID,
  OLD_HARDWARE_TIERS
} from "../data/hardware";
import { PROJECT_MAX_LEVEL, PROJECTS } from "../data/projects";
import { deriveSeed } from "./rng";

type RawSaveObject = Record<string, unknown>;

type MigratedProjectProduct = RawSaveObject & {
  bugged: boolean;
  id: string;
  level: number;
  projectId: string;
  revenue: unknown;
  shippedAtS: number;
};

export const SAVE_VERSION = 14;

export interface MigrationResult {
  readonly raw: RawSaveObject;
  readonly repaired: boolean;
  readonly warnings: readonly string[];
}

export class FutureSaveVersionError extends Error {
  readonly version: number;

  constructor(version: number) {
    super(`Save version ${version} is newer than supported version ${SAVE_VERSION}`);
    this.name = "FutureSaveVersionError";
    this.version = version;
  }
}

type Migration = (raw: RawSaveObject) => RawSaveObject;

const migrations: readonly Migration[] = [
  (raw) => ({
    ...raw,
    v: 1
  }),
  (raw) => ({
    ...raw,
    settings: {
      ...(isRecord(raw.settings) ? raw.settings : {}),
      glitch: isRecord(raw.settings) ? raw.settings.glitch : undefined,
      skipIntro: isRecord(raw.settings) ? raw.settings.skipIntro : undefined
    },
    ui: isRecord(raw.ui) ? raw.ui : createDefaultUiState("desktop", true),
    v: 2
  }),
  (raw) => ({
    ...raw,
    settings: {
      ...(isRecord(raw.settings) ? raw.settings : {}),
      doNotDisturb: isRecord(raw.settings) ? raw.settings.doNotDisturb : undefined
    },
    ui: migrateM14Ui(raw),
    v: 3
  }),
  (raw) => ({
    ...raw,
    settings: {
      ...(isRecord(raw.settings) ? raw.settings : {}),
      vibexLocalAi: false
    },
    v: 4
  }),
  migrateM16Hardware,
  migrateTutorialUi,
  migrateAuroraState,
  migrateLastSimTickMs,
  migrateInboxEntryIds,
  migrateVibexSeeds,
  migrateProjectLevels,
  migrateRoadmapIncidentsAndRunStyle,
  migrateBankState,
  migrateProjectDeployment
];

export function migrateRawSave(rawValue: unknown): MigrationResult {
  const warnings: string[] = [];
  let repaired = false;
  let raw = isRecord(rawValue) ? rawValue : {};

  if (raw !== rawValue) {
    repaired = true;
    warnings.push("save root was not an object");
  }

  let version = readVersion(raw.v);
  if (version === undefined) {
    version = 0;
    repaired = true;
    warnings.push("save version repaired");
  }

  if (version > SAVE_VERSION) {
    throw new FutureSaveVersionError(version);
  }

  while (version < SAVE_VERSION) {
    const migration = migrations[version];

    if (migration === undefined) {
      raw = { ...raw, v: SAVE_VERSION };
      repaired = true;
      warnings.push("missing migration repaired");
      break;
    }

    raw = migration(raw);
    version = readVersion(raw.v) ?? version + 1;
    repaired = true;
  }

  if (raw.v !== SAVE_VERSION) {
    raw = { ...raw, v: SAVE_VERSION };
    repaired = true;
  }

  return { raw, repaired, warnings };
}

function readVersion(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function isRecord(value: unknown): value is RawSaveObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function migrateM14Ui(raw: RawSaveObject): RawSaveObject {
  const fallback = createDefaultUiState("desktop", true);
  const ui = isRecord(raw.ui) ? raw.ui : fallback;
  const savedWindows = isRecord(ui.windows) ? ui.windows : {};
  const windows: RawSaveObject = { ...fallback.windows };

  for (const [appId, windowState] of Object.entries(savedWindows)) {
    if (appId in windows) {
      windows[appId] = windowState;
    }
  }

  if (isRecord(savedWindows.comms)) {
    windows.chat = {
      ...savedWindows.comms,
      appId: "chat"
    };
  }

  return {
    ...ui,
    windows
  };
}

function migrateM16Hardware(raw: RawSaveObject): RawSaveObject {
  const owned = isRecord(raw.owned) ? raw.owned : {};
  const ownedHardware = isRecord(owned.hardware) ? owned.hardware : {};
  const tiersCap = calculateOldHardwareCap(ownedHardware);
  const nextHardware: RawSaveObject = {};

  for (const [id, level] of Object.entries(ownedHardware)) {
    if (!isOldHardwareTier(id) && typeof level === "number") {
      nextHardware[id] = level;
    }
  }

  if (tiersCap > 0) {
    nextHardware[LEGACY_HARDWARE_ID] = tiersCap;
  }

  const era = typeof raw.era === "number" ? raw.era : 0;
  const pcComplete = C.HW_BASE_CAP + tiersCap >= C.HW_PC_MAX_CAP || era >= 3;
  const res = isRecord(raw.res) ? raw.res : {};

  return {
    ...raw,
    hardware: {
      ...(isRecord(raw.hardware) ? raw.hardware : {}),
      pcComplete
    },
    owned: {
      ...owned,
      hardware: nextHardware
    },
    res: {
      ...res,
      computeCap: C.HW_BASE_CAP + tiersCap
    },
    v: 5
  };
}

function migrateTutorialUi(raw: RawSaveObject): RawSaveObject {
  const ui = isRecord(raw.ui) ? raw.ui : {};
  const completed = !isCompletelyFreshSave(raw);

  return {
    ...raw,
    ui: {
      ...ui,
      tutorial: createDefaultTutorialState(completed)
    },
    v: 6
  };
}

function migrateAuroraState(raw: RawSaveObject): RawSaveObject {
  return {
    ...raw,
    aurora: isRecord(raw.aurora)
      ? raw.aurora
      : {
          billingPaused: false,
          completed: false,
          currentPhase: 0,
          dedicatedServers: 0,
          hostedServers: 0,
          phaseActive: false,
          phaseElapsedS: 0,
          status: "locked",
          unlocked: false
        },
    v: 7
  };
}

function migrateLastSimTickMs(raw: RawSaveObject): RawSaveObject {
  const meta = isRecord(raw.meta) ? raw.meta : {};

  return {
    ...raw,
    meta: {
      ...meta,
      lastSimTickMs:
        typeof meta.lastSimTickMs === "number" && Number.isFinite(meta.lastSimTickMs)
          ? meta.lastSimTickMs
          : meta.lastSeen
    },
    v: 8
  };
}

function migrateInboxEntryIds(raw: RawSaveObject): RawSaveObject {
  const story = isRecord(raw.story) ? raw.story : {};
  const inbox = Array.isArray(story.inbox) ? story.inbox : [];
  const readFlagMigrations = new Map<string, string>();
  const migratedInbox = inbox.map((entry, index) => {
    if (!isRecord(entry) || typeof entry.eventId !== "string") {
      return entry;
    }

    const id = readInboxEntryId(entry.id, entry.eventId, index);
    readFlagMigrations.set(`story.read.${index}.${entry.eventId}`, `story.read.${id}`);
    return {
      ...entry,
      id
    };
  });

  return {
    ...raw,
    story: {
      ...story,
      flags: migrateStoryReadFlags(story.flags, readFlagMigrations),
      inbox: migratedInbox
    },
    v: 9
  };
}

function readInboxEntryId(value: unknown, eventId: string, index: number): string {
  return typeof value === "string" && value.length > 0 ? value : `${eventId}.${index + 1}`;
}

function migrateStoryReadFlags(
  value: unknown,
  migrationsByFlag: ReadonlyMap<string, string>
): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((flag) =>
    typeof flag === "string" ? (migrationsByFlag.get(flag) ?? flag) : flag
  );
}

function migrateVibexSeeds(raw: RawSaveObject): RawSaveObject {
  const vibex = isRecord(raw.vibex) ? raw.vibex : {};
  const rngSeed = typeof raw.rngSeed === "number" && Number.isFinite(raw.rngSeed) ? raw.rngSeed : 1;

  return {
    ...raw,
    vibex: {
      ...vibex,
      cannedSeed: readSeed(vibex.cannedSeed, deriveSeed(rngSeed, "vibex.canned")),
      codeSeed: readSeed(vibex.codeSeed, deriveSeed(rngSeed, "vibex.code"))
    },
    v: 10
  };
}

function readSeed(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) ? value : fallback;
}

function migrateProjectLevels(raw: RawSaveObject): RawSaveObject {
  const projects = isRecord(raw.projects) ? raw.projects : {};
  const portfolio = Array.isArray(projects.portfolio) ? projects.portfolio : [];
  const bugRemap = new Map<string, string>();
  const groups = new Map<string, MigratedProjectProduct>();

  for (const entry of portfolio) {
    if (!isRecord(entry) || typeof entry.id !== "string" || typeof entry.projectId !== "string") {
      continue;
    }

    const existing = groups.get(entry.projectId);
    const entryLevel = readPositiveInteger(entry.level) ?? 1;

    if (existing === undefined) {
      const entryRevenue = readBig(entry.revenue);
      const nextEntry: MigratedProjectProduct = {
        ...entry,
        bugged: entry.bugged === true,
        id: entry.id,
        level: entryLevel,
        projectId: entry.projectId,
        revenue: entryRevenue?.toString() ?? entry.revenue,
        shippedAtS: readFiniteNonNegativeNumber(entry.shippedAtS) ?? 0
      };
      groups.set(entry.projectId, nextEntry);
      bugRemap.set(entry.id, entry.id);
      continue;
    }

    existing.level += entryLevel;
    existing.bugged = existing.bugged === true || entry.bugged === true;
    existing.revenue = addMigratedRevenue(existing.revenue, entry.revenue);
    existing.shippedAtS = Math.min(
      readFiniteNonNegativeNumber(existing.shippedAtS) ?? 0,
      readFiniteNonNegativeNumber(entry.shippedAtS) ?? 0
    );
    bugRemap.set(entry.id, existing.id);
  }

  const migratedPortfolio = Array.from(groups.values()).map((entry) => ({
    ...entry,
    level: Math.min(entry.level, getProjectMaxLevelForId(entry.projectId))
  }));

  return {
    ...raw,
    bugs: migrateProjectLevelBugs(raw.bugs, bugRemap),
    projects: {
      ...projects,
      portfolio: migratedPortfolio
    },
    v: 11
  };
}

function migrateRoadmapIncidentsAndRunStyle(raw: RawSaveObject): RawSaveObject {
  return {
    ...raw,
    incidents: isRecord(raw.incidents)
      ? raw.incidents
      : {
          active: [],
          history: [],
          nextCheckAtS: 0
        },
    metaprogression: isRecord(raw.metaprogression) ? raw.metaprogression : {},
    roadmap: isRecord(raw.roadmap)
      ? raw.roadmap
      : {
          completed: 0,
          cooldownUntilS: 0,
          endsAtS: 0,
          startedAtS: 0
        },
    v: 12
  };
}

function migrateBankState(raw: RawSaveObject): RawSaveObject {
  return {
    ...raw,
    bank: isRecord(raw.bank)
      ? raw.bank
      : {
          defaulted: false,
          overdraft: "0e0",
          warningsIssued: 0
        },
    v: 13
  };
}

function migrateProjectDeployment(raw: RawSaveObject): RawSaveObject {
  const projects = isRecord(raw.projects) ? raw.projects : {};
  const owned = isRecord(raw.owned) ? raw.owned : {};
  const ownedHardware = isRecord(owned.hardware) ? owned.hardware : {};
  const res = isRecord(raw.res) ? raw.res : {};

  return {
    ...raw,
    res: {
      ...res,
      computeCap: calculateMigratedHardwareCap(ownedHardware)
    },
    projects: {
      ...projects,
      active: migrateActiveBuildDeployment(projects.active),
      portfolio: migratePortfolioDeployment(projects.portfolio)
    },
    v: 14
  };
}

function migrateActiveBuildDeployment(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((entry) =>
    isRecord(entry)
      ? {
          ...entry,
          computeUse: 0,
          deploymentMode: "hosted"
        }
      : entry
  );
}

function migratePortfolioDeployment(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((entry) => {
    if (!isRecord(entry)) {
      return entry;
    }

    const projectId = typeof entry.projectId === "string" ? entry.projectId : "";
    const level = readPositiveInteger(entry.level) ?? 1;
    return {
      ...entry,
      computeUse:
        readNonNegativeInteger(entry.computeUse) ?? getMigratedProjectComputeUse(projectId, level),
      deploymentMode: "hosted"
    };
  });
}

function migrateProjectLevelBugs(value: unknown, remap: ReadonlyMap<string, string>): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  const seen = new Set<string>();
  const bugs: RawSaveObject[] = [];

  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.productId !== "string") {
      continue;
    }

    const productId = remap.get(entry.productId);

    if (productId === undefined || seen.has(productId)) {
      continue;
    }

    seen.add(productId);
    bugs.push({ productId });
  }

  return bugs;
}

function addMigratedRevenue(existing: unknown, next: unknown): unknown {
  const nextRevenue = readBig(next);

  if (nextRevenue === undefined) {
    return existing;
  }

  return Big.add(readBig(existing) ?? Big.zero(), nextRevenue).toString();
}

function readBig(value: unknown): Big | undefined {
  try {
    return Big.from(value as Parameters<typeof Big.from>[0]);
  } catch {
    return undefined;
  }
}

function readPositiveInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

function readNonNegativeInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function readFiniteNonNegativeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function getProjectMaxLevelForId(projectId: string): number {
  const project = PROJECTS.find((entry) => entry.id === projectId);

  if (project === undefined) {
    return 1;
  }

  return PROJECT_MAX_LEVEL;
}

function getMigratedProjectComputeUse(projectId: string, level: number): number {
  const project = PROJECTS.find((entry) => entry.id === projectId);
  if (project === undefined || project.kind !== "standard" || project.recurringRevenue === false) {
    return 0;
  }

  const baseCompute = Math.ceil(2 + project.era * 1.4 + Math.max(0, project.valueRatio - 0.5) * 4);
  return Math.ceil(baseCompute * (1 + Math.max(0, level - 1) * 0.55));
}

function calculateMigratedHardwareCap(ownedHardware: RawSaveObject): number {
  let cap = C.HW_BASE_CAP;
  const legacyLevel = ownedHardware[LEGACY_HARDWARE_ID];
  if (typeof legacyLevel === "number" && Number.isFinite(legacyLevel) && legacyLevel > 0) {
    cap += Math.trunc(legacyLevel) * LEGACY_HARDWARE_CAP_PER_LEVEL;
  }

  for (const hardware of HARDWARE) {
    const rawLevel = ownedHardware[hardware.id];
    if (typeof rawLevel !== "number" || !Number.isFinite(rawLevel) || rawLevel <= 0) {
      continue;
    }

    const level = Math.min(Math.trunc(rawLevel), hardware.maxLevel);
    const firstLevelCap = hardware.firstLevelCap ?? hardware.capPerLevel;
    cap += firstLevelCap + Math.max(0, level - 1) * hardware.capPerLevel;
  }

  return cap;
}

function calculateOldHardwareCap(ownedHardware: RawSaveObject): number {
  let cap = 0;

  for (const tier of OLD_HARDWARE_TIERS) {
    const count = ownedHardware[tier.id];
    if (typeof count === "number" && Number.isInteger(count) && count > 0) {
      cap += count * tier.capPerLevel;
    }
  }

  return cap;
}

function isOldHardwareTier(id: string): boolean {
  return OLD_HARDWARE_TIERS.some((tier) => tier.id === id);
}

function isCompletelyFreshSave(raw: RawSaveObject): boolean {
  const meta = isRecord(raw.meta) ? raw.meta : {};
  const res = isRecord(raw.res) ? raw.res : {};
  const lifetime = isRecord(raw.lifetime) ? raw.lifetime : {};
  const owned = isRecord(raw.owned) ? raw.owned : {};
  const story = isRecord(raw.story) ? raw.story : {};
  const projects = isRecord(raw.projects) ? raw.projects : {};

  return (
    isZeroNumber(meta.playtimeS) &&
    (raw.era === undefined || raw.era === 1) &&
    isZeroishBig(res.loc) &&
    isZeroishBig(res.money) &&
    isZeroishBig(lifetime.loc) &&
    isZeroishBig(lifetime.money) &&
    !hasOwnedProgress(owned) &&
    isEmptyArray(projects.portfolio) &&
    isFreshStory(story)
  );
}

function hasOwnedProgress(owned: RawSaveObject): boolean {
  return (
    hasPositiveNumberValue(owned.generators) ||
    hasPositiveNumberValue(owned.hardware) ||
    !isEmptyArray(owned.equityPerks) ||
    !isEmptyArray(owned.insightNodes) ||
    !isEmptyArray(owned.paradoxItems) ||
    !isEmptyArray(owned.research) ||
    !isEmptyArray(owned.upgrades)
  );
}

function isFreshStory(story: RawSaveObject): boolean {
  return (
    (story.act === undefined || story.act === 0) &&
    isEmptyArray(story.inbox) &&
    isEmptyArray(story.seen) &&
    isEmptyArray(story.flags)
  );
}

function hasPositiveNumberValue(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).some(
    (entry) => typeof entry === "number" && Number.isFinite(entry) && entry > 0
  );
}

function isEmptyArray(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.length === 0);
}

function isZeroNumber(value: unknown): boolean {
  return value === undefined || value === 0;
}

function isZeroishBig(value: unknown): boolean {
  return value === undefined || value === 0 || value === "0" || value === "0e0";
}
