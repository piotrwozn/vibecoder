import { GENERATORS } from "../data/generators";
import { STARTING_ERA } from "../data/eras";
import { STARTING_COMPUTE_CAP } from "../data/hardware";
import { Big } from "./bignum";
import type { NumberNotation } from "./format";
import { SAVE_VERSION } from "./migrations";
import { createDefaultUiState, type GameUiState } from "./ui-state";

export type Edition = "demo" | "full";
export type ProjectPriority = "payout" | "revenue" | "rp";
export type EndingChoice = "merge" | "unplug" | "fork";
export type AuroraStatus = "billing" | "complete" | "funding" | "locked" | "ready" | "servers";

export interface ProjectOffer {
  readonly id: string;
  readonly projectId: string;
}

export interface ActiveBuild {
  readonly buildS: number;
  readonly cost: Big;
  readonly elapsedS: number;
  readonly id: string;
  readonly payout: Big;
  readonly projectId: string;
  readonly revenue: Big;
}

export interface Product {
  readonly bugged: boolean;
  readonly id: string;
  readonly projectId: string;
  readonly revenue: Big;
  readonly shippedAtS: number;
}

export interface AuroraState {
  billingPaused: boolean;
  completed: boolean;
  currentPhase: number;
  dedicatedServers: number;
  hostedServers: number;
  phaseActive: boolean;
  phaseElapsedS: number;
  status: AuroraStatus;
  unlocked: boolean;
}

export interface ActiveBug {
  readonly productId: string;
}

export interface InboxEntry {
  readonly eventId: string;
}

export interface AutomationRule {
  readonly enabled: boolean;
}

export interface GameState {
  v: number;
  meta: {
    createdAt: number;
    edition: Edition;
    lastSeen: number;
    lastSimTickMs: number;
    playtimeS: number;
  };
  res: {
    computeCap: number;
    computeUsed: number;
    debt: Big;
    equity: number;
    hype: number;
    insight: Big;
    loc: Big;
    money: Big;
    paradox: number;
    rp: number;
  };
  lifetime: {
    insightSinceExit: number;
    loc: Big;
    locSinceExit: Big;
    money: Big;
  };
  owned: {
    equityPerks: Set<string>;
    generators: Record<string, number>;
    hardware: Record<string, number>;
    insightNodes: Set<string>;
    paradoxItems: Set<string>;
    research: Set<string>;
    upgrades: Set<string>;
  };
  hardware: {
    pcComplete: boolean;
  };
  aurora: AuroraState;
  era: number;
  projects: {
    active: ActiveBuild[];
    board: ProjectOffer[];
    boardRefreshAt: number;
    portfolio: Product[];
    prioritySetting: ProjectPriority;
  };
  bugs: ActiveBug[];
  flow: {
    activeUntil: number;
    meter: number;
  };
  prestige: {
    endingChoice?: EndingChoice;
    exits: number;
    iteration: number;
    rewrites: number;
  };
  story: {
    act: number;
    choices: Record<string, string>;
    flags: Set<string>;
    inbox: InboxEntry[];
    seen: Set<string>;
  };
  automation: Record<string, AutomationRule>;
  stats: Record<string, number | Big>;
  settings: {
    autosaveS: number;
    doNotDisturb: boolean;
    glitch: boolean;
    lang: string;
    notation: NumberNotation;
    reducedFx: boolean;
    skipIntro: boolean;
    sound: boolean;
    vibexLocalAi: boolean;
    volume: number;
  };
  ui: GameUiState;
  rngSeed: number;
}

const DEFAULT_AUTOSAVE_S = 10;
const DEFAULT_VOLUME = 0.3;
const DEFAULT_RNG_SEED = 1;

export function createDefaultGameState(nowMs = Date.now(), edition: Edition = "demo"): GameState {
  return {
    v: SAVE_VERSION,
    meta: {
      createdAt: nowMs,
      edition,
      lastSeen: nowMs,
      lastSimTickMs: nowMs,
      playtimeS: 0
    },
    res: {
      computeCap: STARTING_COMPUTE_CAP,
      computeUsed: 0,
      debt: Big.zero(),
      equity: 0,
      hype: 1,
      insight: Big.zero(),
      loc: Big.zero(),
      money: Big.zero(),
      paradox: 0,
      rp: 0
    },
    lifetime: {
      insightSinceExit: 0,
      loc: Big.zero(),
      locSinceExit: Big.zero(),
      money: Big.zero()
    },
    owned: {
      equityPerks: new Set(),
      generators: createGeneratorOwnership(),
      hardware: {},
      insightNodes: new Set(),
      paradoxItems: new Set(),
      research: new Set(),
      upgrades: new Set()
    },
    hardware: {
      pcComplete: false
    },
    aurora: createDefaultAuroraState(),
    era: STARTING_ERA.index,
    projects: {
      active: [],
      board: [],
      boardRefreshAt: 0,
      portfolio: [],
      prioritySetting: "payout"
    },
    bugs: [],
    flow: {
      activeUntil: 0,
      meter: 0
    },
    prestige: {
      exits: 0,
      iteration: 0,
      rewrites: 0
    },
    story: {
      act: 0,
      choices: {},
      flags: new Set(),
      inbox: [],
      seen: new Set()
    },
    automation: {},
    stats: {},
    settings: {
      autosaveS: DEFAULT_AUTOSAVE_S,
      doNotDisturb: false,
      glitch: true,
      lang: "en",
      notation: "sci",
      reducedFx: false,
      skipIntro: false,
      sound: true,
      vibexLocalAi: false,
      volume: DEFAULT_VOLUME
    },
    ui: createDefaultUiState("boot", false),
    rngSeed: DEFAULT_RNG_SEED
  };
}

export function createDefaultAuroraState(): AuroraState {
  return {
    billingPaused: false,
    completed: false,
    currentPhase: 0,
    dedicatedServers: 0,
    hostedServers: 0,
    phaseActive: false,
    phaseElapsedS: 0,
    status: "locked",
    unlocked: false
  };
}

function createGeneratorOwnership(): Record<string, number> {
  const owned: Record<string, number> = {};

  for (const generator of GENERATORS) {
    owned[generator.id] = 0;
  }

  return owned;
}
