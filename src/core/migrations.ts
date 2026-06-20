import { createDefaultUiState } from "./ui-state";
import { C } from "../data/constants";
import { LEGACY_HARDWARE_ID, OLD_HARDWARE_TIERS } from "../data/hardware";

type RawSaveObject = Record<string, unknown>;

export const SAVE_VERSION = 5;

export interface MigrationResult {
  readonly raw: RawSaveObject;
  readonly repaired: boolean;
  readonly warnings: readonly string[];
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
  migrateM16Hardware
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
    raw = { ...raw, v: SAVE_VERSION };
    repaired = true;
    warnings.push("future save version clamped");
    return { raw, repaired, warnings };
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
