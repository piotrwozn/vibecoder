export const APP_IDS = [
  "vibex",
  "agents",
  "hardware",
  "upgrades",
  "projects",
  "research",
  "rewrite",
  "stats",
  "achievements",
  "chat",
  "mail",
  "feed",
  "settings"
] as const;

export type AppId = (typeof APP_IDS)[number];
export type SceneId = "boot" | "desktop";

export interface WindowFrame {
  h: number;
  w: number;
  x: number;
  y: number;
}

export interface WindowState extends WindowFrame {
  appId: AppId;
  maximized: boolean;
  minimized: boolean;
  open: boolean;
  restore?: WindowFrame;
  z: number;
}

export interface GameUiState {
  bootSeen: boolean;
  scene: SceneId;
  windows: Record<AppId, WindowState>;
}

export interface WindowDefinition {
  readonly defaultFrame: WindowFrame;
  readonly minH: number;
  readonly minW: number;
}

export const WINDOW_DEFINITIONS: Record<AppId, WindowDefinition> = {
  vibex: {
    defaultFrame: { h: 640, w: 1000, x: 72, y: 112 },
    minH: 640,
    minW: 1000
  },
  agents: {
    defaultFrame: { h: 560, w: 860, x: 96, y: 132 },
    minH: 560,
    minW: 860
  },
  hardware: {
    defaultFrame: { h: 620, w: 960, x: 112, y: 144 },
    minH: 620,
    minW: 960
  },
  upgrades: {
    defaultFrame: { h: 520, w: 760, x: 128, y: 156 },
    minH: 520,
    minW: 760
  },
  projects: {
    defaultFrame: { h: 520, w: 760, x: 120, y: 152 },
    minH: 520,
    minW: 760
  },
  research: {
    defaultFrame: { h: 520, w: 760, x: 144, y: 172 },
    minH: 520,
    minW: 760
  },
  rewrite: {
    defaultFrame: { h: 520, w: 760, x: 168, y: 192 },
    minH: 520,
    minW: 760
  },
  stats: {
    defaultFrame: { h: 520, w: 760, x: 192, y: 212 },
    minH: 520,
    minW: 760
  },
  achievements: {
    defaultFrame: { h: 520, w: 760, x: 216, y: 232 },
    minH: 520,
    minW: 760
  },
  chat: {
    defaultFrame: { h: 520, w: 760, x: 232, y: 244 },
    minH: 520,
    minW: 760
  },
  mail: {
    defaultFrame: { h: 520, w: 760, x: 240, y: 252 },
    minH: 520,
    minW: 760
  },
  feed: {
    defaultFrame: { h: 520, w: 760, x: 256, y: 268 },
    minH: 520,
    minW: 760
  },
  settings: {
    defaultFrame: { h: 520, w: 760, x: 248, y: 264 },
    minH: 520,
    minW: 760
  }
};

export function createDefaultUiState(scene: SceneId = "boot", bootSeen = false): GameUiState {
  return {
    bootSeen,
    scene,
    windows: createDefaultWindowStates()
  };
}

export function createDefaultWindowStates(): Record<AppId, WindowState> {
  const windows = {} as Record<AppId, WindowState>;

  for (const appId of APP_IDS) {
    windows[appId] = createDefaultWindowState(appId);
  }

  return windows;
}

export function createDefaultWindowState(appId: AppId): WindowState {
  return {
    appId,
    ...WINDOW_DEFINITIONS[appId].defaultFrame,
    maximized: false,
    minimized: false,
    open: false,
    z: 0
  };
}

export function isAppId(value: unknown): value is AppId {
  return typeof value === "string" && (APP_IDS as readonly string[]).includes(value);
}
