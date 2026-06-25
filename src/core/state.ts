import { GENERATORS } from "../data/generators";
import { STARTING_ERA } from "../data/eras";
import { STARTING_COMPUTE_CAP } from "../data/hardware";
import { Big } from "./bignum";
import type { NumberNotation } from "./format";
import { SAVE_VERSION } from "./migrations";
import { deriveSeed } from "./rng";
import { createDefaultUiState, type GameUiState } from "./ui-state";

export type Edition = "demo" | "full";
export type ProjectPriority = "payout" | "revenue" | "rp";
export type ProjectDeploymentMode = "hosted" | "selfHosted";
export type EndingChoice = "merge" | "unplug" | "fork";
export type AuroraStatus = "billing" | "complete" | "funding" | "locked" | "ready" | "servers";
export type SprintPriority =
  | "automation"
  | "aurora"
  | "growth"
  | "research"
  | "revenue"
  | "stability";
export type ProductionIncidentType =
  | "aurora_instability"
  | "bad_deploy"
  | "billing_shock"
  | "outage"
  | "security_bug"
  | "vendor_lock_in"
  | "viral_launch_spike";
export type IncidentResponseId =
  | "accept_debt"
  | "buy_hardware"
  | "hotfix"
  | "pause_growth"
  | "pay_vendor"
  | "refactor"
  | "use_research";
export type RunStyleId =
  | "aurora_first"
  | "bootstrapped"
  | "cursed_enterprise"
  | "open_source_collective"
  | "research_lab"
  | "vc_backed";
export type EndlessSeasonId =
  | "agent_swarm"
  | "bug_storm"
  | "cloud_crisis"
  | "enterprise"
  | "model_outage"
  | "open_source"
  | "security"
  | "speed";
export type EndlessChallengeId =
  | "cheap_cloud"
  | "enterprise_only"
  | "max_automation"
  | "no_agents"
  | "no_failed_deploy"
  | "no_manual_coding"
  | "one_model"
  | "open_source_only"
  | "security_first"
  | "zero_debt";
export type EndlessDecision = "continue" | "reset";
export type EndlessEventId =
  | "agent_market_crash"
  | "cloud_price_increase"
  | "competitor_launch"
  | "cve_wave"
  | "dependency_collapse"
  | "enterprise_audit_wave"
  | "global_model_outage"
  | "investor_hype_cycle"
  | "new_model_release"
  | "open_source_wave"
  | "production_chain"
  | "viral_launch_spike";
export type EndlessCosmeticId =
  | "aurora_frame"
  | "compliance_terminal"
  | "empire_badge"
  | "legacy_wallpaper"
  | "seasonal_desktop"
  | "swarm_icon_pack";

export interface ProjectOffer {
  readonly id: string;
  readonly projectId: string;
}

export interface ActiveBuild {
  readonly buildS: number;
  readonly computeUse: number;
  readonly cost: Big;
  readonly deploymentMode: ProjectDeploymentMode;
  readonly elapsedS: number;
  readonly id: string;
  readonly payout: Big;
  readonly projectId: string;
  readonly revenue: Big;
}

export interface Product {
  readonly bugged: boolean;
  readonly computeUse: number;
  readonly deploymentMode: ProjectDeploymentMode;
  readonly id: string;
  readonly level: number;
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

export interface SprintState {
  active?: SprintPriority;
  completed: number;
  cooldownUntilS: number;
  endsAtS: number;
  startedAtS: number;
}

export interface ProductionIncident {
  id: string;
  response?: IncidentResponseId;
  resolvedAtS?: number;
  severity: number;
  startedAtS: number;
  type: ProductionIncidentType;
  untilS: number;
}

export interface ProductionIncidentHistoryEntry {
  readonly id: string;
  readonly response?: IncidentResponseId;
  readonly resolvedAtS: number;
  readonly severity: number;
  readonly startedAtS: number;
  readonly type: ProductionIncidentType;
}

export interface ProductionIncidentsState {
  active: ProductionIncident[];
  history: ProductionIncidentHistoryEntry[];
  nextCheckAtS: number;
}

export interface MetaprogressionState {
  runStyle?: RunStyleId;
}

export type BankWarningLevel = 0 | 1 | 2;

export interface BankState {
  defaulted: boolean;
  defaultedAtS?: number;
  overdraft: Big;
  warningsIssued: BankWarningLevel;
}

export interface VibexState {
  cannedSeed: number;
  codeSeed: number;
}

export interface ActiveBug {
  readonly productId: string;
}

export interface InboxEntry {
  readonly id: string;
  readonly eventId: string;
}

export interface AutomationRule {
  readonly enabled: boolean;
}

export interface EndlessContractOffer {
  readonly id: string;
  readonly industryId: string;
  readonly modifierIds: readonly string[];
  readonly moduleIds: readonly string[];
  readonly productTypeId: string;
  readonly rewardMoney: Big;
  readonly rewardRp: number;
  readonly riskIds: readonly string[];
  readonly riskScore: number;
  readonly scaleId: string;
  readonly tier: number;
  readonly workS: number;
}

export interface ActiveEndlessContract extends EndlessContractOffer {
  readonly acceptedAtS: number;
  readonly costLoc: Big;
  readonly elapsedS: number;
}

export interface EndlessMilestoneProgress {
  readonly id: string;
}

export interface EndlessChallengeState {
  readonly bestTier: number;
  readonly completed: boolean;
  readonly id: EndlessChallengeId;
}

export interface EndlessEventState {
  readonly activeUntilS: number;
  readonly id: EndlessEventId;
  readonly startedAtS: number;
}

export interface EndlessCurrencies {
  automationRank: number;
  enterpriseTrust: number;
  influence: number;
  legacyPoints: number;
  modelResearch: number;
  stabilityScore: number;
}

export interface EndlessState {
  active?: ActiveEndlessContract;
  activeChallenge?: EndlessChallengeId;
  activeEvent?: EndlessEventState;
  challengeCompletions: EndlessChallengeState[];
  completedContracts: number;
  cosmetics: EndlessCosmeticId[];
  currencies: EndlessCurrencies;
  decision: EndlessDecision;
  empireScore: Big;
  legacyScore: number;
  milestones: EndlessMilestoneProgress[];
  nextEventAtS: number;
  offers: EndlessContractOffer[];
  offerSeed: number;
  seasonEndsAtS: number;
  seasonId: EndlessSeasonId;
  softCaps: string[];
  tier: number;
  unlocked: boolean;
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
  endless: EndlessState;
  roadmap: SprintState;
  incidents: ProductionIncidentsState;
  metaprogression: MetaprogressionState;
  bank: BankState;
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
  vibex: VibexState;
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
const RNG_SEED_SALT = "game.rngSeed";

export function createDefaultGameState(
  nowMs = Date.now(),
  edition: Edition = "demo",
  rngSeed = createInitialRngSeed(nowMs)
): GameState {
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
    endless: createDefaultEndlessState(rngSeed),
    roadmap: createDefaultSprintState(),
    incidents: createDefaultProductionIncidentsState(),
    metaprogression: createDefaultMetaprogressionState(),
    bank: createDefaultBankState(),
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
    vibex: createDefaultVibexState(rngSeed),
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
    rngSeed
  };
}

function createDefaultAuroraState(): AuroraState {
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

function createDefaultEndlessState(rngSeed: number): EndlessState {
  return {
    activeChallenge: undefined,
    activeEvent: undefined,
    challengeCompletions: [],
    completedContracts: 0,
    cosmetics: [],
    currencies: {
      automationRank: 0,
      enterpriseTrust: 0,
      influence: 0,
      legacyPoints: 0,
      modelResearch: 0,
      stabilityScore: 0
    },
    decision: "continue",
    empireScore: Big.zero(),
    legacyScore: 0,
    milestones: [],
    nextEventAtS: 0,
    offers: [],
    offerSeed: deriveSeed(rngSeed, "endless.offers"),
    seasonEndsAtS: 0,
    seasonId: "bug_storm",
    softCaps: [],
    tier: 1,
    unlocked: false
  };
}

function createDefaultSprintState(): SprintState {
  return {
    completed: 0,
    cooldownUntilS: 0,
    endsAtS: 0,
    startedAtS: 0
  };
}

function createDefaultProductionIncidentsState(): ProductionIncidentsState {
  return {
    active: [],
    history: [],
    nextCheckAtS: 0
  };
}

function createDefaultMetaprogressionState(): MetaprogressionState {
  return {};
}

export function createDefaultBankState(): BankState {
  return {
    defaulted: false,
    overdraft: Big.zero(),
    warningsIssued: 0
  };
}

function createGeneratorOwnership(): Record<string, number> {
  const owned: Record<string, number> = {};

  for (const generator of GENERATORS) {
    owned[generator.id] = 0;
  }

  return owned;
}

export function createDefaultVibexState(rngSeed: number): VibexState {
  return {
    cannedSeed: deriveSeed(rngSeed, "vibex.canned"),
    codeSeed: deriveSeed(rngSeed, "vibex.code")
  };
}

export function createInitialRngSeed(nowMs = Date.now()): number {
  return deriveSeed(Math.trunc(nowMs), RNG_SEED_SALT);
}
