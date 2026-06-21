import type { Platform } from "./platform";

type InvokeArgs = Record<string, unknown>;

interface TauriCore {
  invoke<T>(command: string, args?: InvokeArgs): Promise<T>;
}

interface TauriGlobal {
  readonly core: TauriCore;
}

interface TauriHost {
  readonly __TAURI__?: TauriGlobal;
}

export const DESKTOP_SAVE_FILE = "vibecoder_save.json";

export function isTauriRuntime(host: TauriHost = globalThis as TauriHost): boolean {
  return host.__TAURI__?.core !== undefined;
}

export function createDesktopPlatform(host: TauriHost = globalThis as TauriHost): Platform {
  const tauri = host.__TAURI__;

  if (tauri?.core === undefined) {
    throw new Error("Tauri runtime is not available");
  }

  return {
    edition: "full",

    async load(): Promise<string | null> {
      return tauri.core.invoke<string | null>("load_save");
    },

    async save(data: string): Promise<void> {
      await tauri.core.invoke<void>("save_game", { data });
    },

    async backupCorrupt(data: string, timestampMs: number): Promise<void> {
      await tauri.core.invoke<void>("backup_corrupt_save", { data, timestampMs });
    },

    async listBackups(): Promise<string[]> {
      return tauri.core.invoke<string[]>("list_backups");
    },

    async loadBackup(name: string): Promise<string | null> {
      return tauri.core.invoke<string | null>("load_backup", { name });
    },

    async exportFile(name: string, data: string): Promise<void> {
      await tauri.core.invoke<void>("export_file", { data, name });
    },

    openExternal(url: string): void {
      void tauri.core.invoke<void>("open_external", { url });
    },

    setTitle(title: string): void {
      if ("document" in globalThis) {
        document.title = title;
      }

      void tauri.core.invoke<void>("set_window_title", { title });
    },

    quit(): void {
      void tauri.core.invoke<void>("quit_app");
    }
  };
}
