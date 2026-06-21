export type Edition = "demo" | "full";

export interface Platform {
  backupCorrupt?(data: string, timestampMs: number): Promise<void>;
  readonly edition: Edition;
  exportFile?(name: string, data: string): Promise<void>;
  listBackups?(): Promise<string[]>;
  loadBackup?(name: string): Promise<string | null>;
  load(): Promise<string | null>;
  openExternal(url: string): void;
  quit?(): void;
  save(data: string): Promise<void>;
  setTitle(title: string): void;
}
