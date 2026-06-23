import type { Platform } from "./platform";

type InvokeArgs = Record<string, unknown>;

interface TauriIpc {
  invoke<T>(command: string, args?: InvokeArgs): Promise<T>;
}

interface TauriHost {
  readonly __TAURI_INTERNALS__?: TauriIpc;
}

export function isTauriRuntime(host: TauriHost = globalThis as TauriHost): boolean {
  return host.__TAURI_INTERNALS__ !== undefined;
}

export function createDesktopPlatform(host: TauriHost = globalThis as TauriHost): Platform {
  const tauri = host.__TAURI_INTERNALS__;

  if (tauri === undefined) {
    throw new Error("Tauri runtime is not available");
  }

  return {
    edition: "full",

    async load(): Promise<string | null> {
      return tauri.invoke<string | null>("load_save");
    },

    async save(data: string): Promise<void> {
      await tauri.invoke<void>("save_game", { data });
    },

    async backupCorrupt(data: string, timestampMs: number): Promise<void> {
      await tauri.invoke<void>("backup_corrupt_save", { data, timestampMs });
    },

    async listBackups(): Promise<string[]> {
      return tauri.invoke<string[]>("list_backups");
    },

    async loadBackup(name: string): Promise<string | null> {
      return tauri.invoke<string | null>("load_backup", { name });
    },

    async exportFile(name: string, data: string): Promise<void> {
      await tauri.invoke<void>("export_file", { data, name });
    },

    openExternal(url: string): void {
      void tauri.invoke<void>("open_external", { url }).catch(() => {});
    },

    setTitle(title: string): void {
      if ("document" in globalThis) {
        document.title = title;
      }

      void tauri.invoke<void>("set_window_title", { title }).catch(() => {});
    },

    quit(): void {
      void tauri.invoke<void>("quit_app").catch(() => {});
    }
  };
}
