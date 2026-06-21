import { big, type Big } from "../core/bignum";

export type AuroraCompletionEffect = "unlockAurora";

export interface AuroraPhaseDefinition {
  readonly costLoc: Big;
  readonly costMoney: Big;
  readonly id: string;
  readonly nameKey: string;
  readonly percent: number;
  readonly requiredServers: number;
  readonly workS: number;
}

export const AURORA_UNLOCK_FLAG = "aurora_unlocked";
export const AURORA_COMPLETED_FLAG = "aurora_completed";
export const AURORA_SEED_AVAILABLE_FLAG = "aurora_seed_available";
export const AURORA_PHASE_STARTED_FLAG = "aurora_phase_started";
export const AURORA_DEDICATED_STARTED_FLAG = "aurora_dedicated_started";
export const AURORA_HOSTING_STARTED_FLAG = "aurora_hosting_started";
export const AURORA_REQUIRED_DEDICATED_SERVERS = 8;
export const AURORA_HOSTING_PER_SERVER_S = big("2e29");

export const AURORA_SERVER_COMPONENT_IDS = [
  "h_rack",
  "h_srv_board",
  "h_srv_psu",
  "h_srv_cooling",
  "h_srv_net",
  "h_exotic_core"
] as const;

export const AURORA_SERVER_GLOBAL_REQUIREMENT_ID = "h_dyson_frame";

export const AURORA_PHASES: readonly AuroraPhaseDefinition[] = [
  {
    id: "aurora_bootstrap",
    nameKey: "aurora.phase.aurora_bootstrap.name",
    percent: 5,
    costLoc: big("5e22"),
    costMoney: big("2e31"),
    workS: 1800,
    requiredServers: 0
  },
  {
    id: "voice_kernel",
    nameKey: "aurora.phase.voice_kernel.name",
    percent: 10,
    costLoc: big("2e24"),
    costMoney: big("8e31"),
    workS: 3600,
    requiredServers: 1
  },
  {
    id: "tool_mesh",
    nameKey: "aurora.phase.tool_mesh.name",
    percent: 15,
    costLoc: big("8e25"),
    costMoney: big("3e32"),
    workS: 7200,
    requiredServers: 2
  },
  {
    id: "agent_orchestrator",
    nameKey: "aurora.phase.agent_orchestrator.name",
    percent: 15,
    costLoc: big("3e27"),
    costMoney: big("1e33"),
    workS: 10800,
    requiredServers: 3
  },
  {
    id: "memory_fabric",
    nameKey: "aurora.phase.memory_fabric.name",
    percent: 15,
    costLoc: big("1e29"),
    costMoney: big("4e33"),
    workS: 14400,
    requiredServers: 4
  },
  {
    id: "self_improvement",
    nameKey: "aurora.phase.self_improvement.name",
    percent: 15,
    costLoc: big("4e30"),
    costMoney: big("1.6e34"),
    workS: 18000,
    requiredServers: 5
  },
  {
    id: "delegation_layer",
    nameKey: "aurora.phase.delegation_layer.name",
    percent: 15,
    costLoc: big("1e32"),
    costMoney: big("6e34"),
    workS: 21600,
    requiredServers: 6
  },
  {
    id: "aurora_go_live",
    nameKey: "aurora.phase.aurora_go_live.name",
    percent: 10,
    costLoc: big("3e33"),
    costMoney: big("2e35"),
    workS: 30600,
    requiredServers: 8
  }
] as const;
