import type { Edition, Platform } from "./platform";

export const WEB_SAVE_KEY = "vibecoder_save";
const WEB_BACKUP_COUNT = 3;
const WEB_BACKUP_PREFIX = `${WEB_SAVE_KEY}.bak`;
const WEB_CORRUPT_PREFIX = `${WEB_SAVE_KEY}.corrupt`;

export function createWebPlatform(): Platform {
  return {
    edition: readEdition(),

    async load(): Promise<string | null> {
      return window.localStorage.getItem(WEB_SAVE_KEY);
    },

    async save(data: string): Promise<void> {
      rotateWebBackups();
      window.localStorage.setItem(WEB_SAVE_KEY, data);
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
      window.localStorage.setItem(`${WEB_CORRUPT_PREFIX}.${Math.trunc(timestampMs)}`, data);
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
