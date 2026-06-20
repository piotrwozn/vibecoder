export type Edition = "demo" | "full";

export interface Platform {
  readonly edition: Edition;
  exportFile?(name: string, data: string): Promise<void>;
  listBackups?(): Promise<string[]>;
  load(): Promise<string | null>;
  openExternal(url: string): void;
  quit?(): void;
  save(data: string): Promise<void>;
  setTitle(title: string): void;
}
