import type { Edition, Platform } from "./platform";

export const WEB_SAVE_KEY = "vibecoder_save";
const WEB_BACKUP_COUNT = 3;
const WEB_CORRUPT_COUNT = 3;
const WEB_BACKUP_PREFIX = `${WEB_SAVE_KEY}.bak`;
const WEB_CORRUPT_PREFIX = `${WEB_SAVE_KEY}.corrupt`;

export function createWebPlatform(): Platform {
  return {
    edition: readEdition(),

    async load(): Promise<string | null> {
      return window.localStorage.getItem(WEB_SAVE_KEY);
    },

    async save(data: string): Promise<void> {
      const recoverySnapshot = snapshotWebRecoveryKeys();

      try {
        rotateWebBackups();
        window.localStorage.setItem(WEB_SAVE_KEY, data);
      } catch {
        try {
          pruneWebStorageForPrimaryRetry();
          window.localStorage.setItem(WEB_SAVE_KEY, data);
        } catch (error) {
          restoreWebRecoveryKeys(recoverySnapshot);
          throw error;
        }
      }
    },

    async listBackups(): Promise<string[]> {
      const backups: string[] = [];

      for (let index = 1; index <= WEB_BACKUP_COUNT; index += 1) {
        const key = webBackupKey(index);
        if (window.localStorage.getItem(key) !== null) {
          backups.push(key);
        }
      }

      return backups;
    },

    async loadBackup(name: string): Promise<string | null> {
      return isWebBackupKey(name) ? window.localStorage.getItem(name) : null;
    },

    async backupCorrupt(data: string, timestampMs: number): Promise<void> {
      const key = `${WEB_CORRUPT_PREFIX}.${Math.trunc(timestampMs)}`;

      try {
        window.localStorage.setItem(key, data);
      } catch {
        pruneCorruptBackups(0);
        window.localStorage.setItem(key, data);
      }

      pruneCorruptBackups(WEB_CORRUPT_COUNT);
    },

    openExternal(url: string): void {
      window.open(url, "_blank", "noopener,noreferrer");
    },

    setTitle(title: string): void {
      document.title = title;
    }
  };
}

function readEdition(): Edition {
  return import.meta.env.VITE_EDITION === "full" ? "full" : "demo";
}

function rotateWebBackups(): void {
  const current = window.localStorage.getItem(WEB_SAVE_KEY);

  if (current === null) {
    return;
  }

  for (let index = WEB_BACKUP_COUNT - 1; index >= 1; index -= 1) {
    const from = window.localStorage.getItem(webBackupKey(index));

    if (from === null) {
      continue;
    }

    window.localStorage.setItem(webBackupKey(index + 1), from);
  }

  window.localStorage.setItem(webBackupKey(1), current);
}

function pruneWebStorageForPrimaryRetry(): void {
  for (let index = 1; index <= WEB_BACKUP_COUNT; index += 1) {
    window.localStorage.removeItem(webBackupKey(index));
  }

  pruneCorruptBackups(0);
}

function snapshotWebRecoveryKeys(): Map<string, string> {
  const snapshot = new Map<string, string>();

  for (const key of getStorageKeys()) {
    if (isWebBackupKey(key) || key.startsWith(`${WEB_CORRUPT_PREFIX}.`)) {
      const value = window.localStorage.getItem(key);
      if (value !== null) {
        snapshot.set(key, value);
      }
    }
  }

  return snapshot;
}

function restoreWebRecoveryKeys(snapshot: ReadonlyMap<string, string>): void {
  for (const [key, value] of snapshot) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Best-effort restore after a failed quota retry.
    }
  }
}

function pruneCorruptBackups(keep: number): void {
  const corruptKeys = getStorageKeys()
    .filter((key) => key.startsWith(`${WEB_CORRUPT_PREFIX}.`))
    .sort((left, right) => getCorruptTimestamp(right) - getCorruptTimestamp(left));

  for (const key of corruptKeys.slice(Math.max(0, keep))) {
    window.localStorage.removeItem(key);
  }
}

function getStorageKeys(): string[] {
  const keys: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key !== null) {
      keys.push(key);
    }
  }

  return keys;
}

function getCorruptTimestamp(key: string): number {
  const value = Number(key.slice(`${WEB_CORRUPT_PREFIX}.`.length));
  return Number.isFinite(value) ? value : 0;
}

function webBackupKey(index: number): string {
  return `${WEB_BACKUP_PREFIX}${index}`;
}

function isWebBackupKey(name: string): boolean {
  for (let index = 1; index <= WEB_BACKUP_COUNT; index += 1) {
    if (name === webBackupKey(index)) {
      return true;
    }
  }

  return false;
}
