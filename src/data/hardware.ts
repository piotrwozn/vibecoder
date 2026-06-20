import { big, type Big } from "../core/bignum";
import { C } from "./constants";

export type HardwarePhase = "pc" | "server";

export type HardwareUnlockCondition =
  | { readonly kind: "era"; readonly era: number }
  | { readonly kind: "hardware"; readonly id: string; readonly level: number }
  | { readonly kind: "pcComplete" }
  | { readonly kind: "start" };

export interface HardwareDefinition {
  readonly baseCost: Big;
  readonly capPerLevel: number;
  readonly demoLocked?: boolean;
  readonly growth?: number;
  readonly id: string;
  readonly isEnclosure: boolean;
  readonly maxLevel: number;
  readonly nameKey: string;
  readonly phase: HardwarePhase;
  readonly slot: string;
  readonly unlock: readonly HardwareUnlockCondition[];
}

export const STARTING_COMPUTE_CAP = C.HW_BASE_CAP;
export const HARDWARE_UNBOUNDED_LEVEL = Number.POSITIVE_INFINITY;
export const LEGACY_HARDWARE_ID = "h_legacy";
export const LEGACY_HARDWARE_CAP_PER_LEVEL = 1;

export const OLD_HARDWARE_TIERS: readonly {
  readonly capPerLevel: number;
  readonly id: string;
}[] = [
  { id: "h_gaming_rig", capPerLevel: 12 },
  { id: "h_workstation", capPerLevel: 35 },
  { id: "h_home_server", capPerLevel: 100 },
  { id: "h_server_rack", capPerLevel: 300 },
  { id: "h_micro_dc", capPerLevel: 900 },
  { id: "h_datacenter", capPerLevel: 2.8e3 },
  { id: "h_hyperscale", capPerLevel: 9e3 },
  { id: "h_orbital_ring", capPerLevel: 3e4 },
  { id: "h_dyson_lattice", capPerLevel: 1e5 }
] as const;

export const HARDWARE: readonly HardwareDefinition[] = [
  {
    id: "h_cpu",
    phase: "pc",
    slot: "cpu",
    maxLevel: 20,
    baseCost: big(80),
    growth: 1.55,
    capPerLevel: 40,
    unlock: [{ kind: "start" }],
    isEnclosure: false,
    nameKey: "hardware.h_cpu.name"
  },
  {
    id: "h_ram",
    phase: "pc",
    slot: "ram",
    maxLevel: 16,
    baseCost: big(60),
    growth: 1.5,
    capPerLevel: 25,
    unlock: [{ kind: "hardware", id: "h_cpu", level: 3 }],
    isEnclosure: false,
    nameKey: "hardware.h_ram.name"
  },
  {
    id: "h_ssd",
    phase: "pc",
    slot: "storage",
    maxLevel: 12,
    baseCost: big(40),
    growth: 1.45,
    capPerLevel: 10,
    unlock: [{ kind: "hardware", id: "h_cpu", level: 3 }],
    isEnclosure: false,
    nameKey: "hardware.h_ssd.name"
  },
  {
    id: "h_psu_pc",
    phase: "pc",
    slot: "psu",
    maxLevel: 16,
    baseCost: big(70),
    growth: 1.5,
    capPerLevel: 20,
    unlock: [{ kind: "hardware", id: "h_cpu", level: 5 }],
    isEnclosure: false,
    nameKey: "hardware.h_psu_pc.name"
  },
  {
    id: "h_cooling_pc",
    phase: "pc",
    slot: "cooling",
    maxLevel: 16,
    baseCost: big(50),
    growth: 1.5,
    capPerLevel: 15,
    unlock: [{ kind: "hardware", id: "h_psu_pc", level: 3 }],
    isEnclosure: false,
    nameKey: "hardware.h_cooling_pc.name"
  },
  {
    id: "h_gpu",
    phase: "pc",
    slot: "gpu",
    maxLevel: 20,
    baseCost: big(300),
    growth: 1.6,
    capPerLevel: 80,
    unlock: [{ kind: "hardware", id: "h_cooling_pc", level: 3 }],
    isEnclosure: false,
    nameKey: "hardware.h_gpu.name"
  },
  {
    id: "h_rack",
    phase: "server",
    slot: "enclosure",
    maxLevel: HARDWARE_UNBOUNDED_LEVEL,
    baseCost: big(1e6),
    growth: 2,
    capPerLevel: 0,
    unlock: [{ kind: "pcComplete" }],
    isEnclosure: true,
    demoLocked: true,
    nameKey: "hardware.h_rack.name"
  },
  {
    id: "h_row",
    phase: "server",
    slot: "enclosure",
    maxLevel: 1,
    baseCost: big(1e10),
    capPerLevel: 0,
    unlock: [
      { kind: "era", era: 5 },
      { kind: "hardware", id: "h_rack", level: 4 }
    ],
    isEnclosure: true,
    demoLocked: true,
    nameKey: "hardware.h_row.name"
  },
  {
    id: "h_datahall",
    phase: "server",
    slot: "enclosure",
    maxLevel: 1,
    baseCost: big(2e12),
    capPerLevel: 0,
    unlock: [
      { kind: "era", era: 6 },
      { kind: "hardware", id: "h_row", level: 1 }
    ],
    isEnclosure: true,
    demoLocked: true,
    nameKey: "hardware.h_datahall.name"
  },
  {
    id: "h_dc_campus",
    phase: "server",
    slot: "enclosure",
    maxLevel: 1,
    baseCost: big(2e15),
    capPerLevel: 0,
    unlock: [
      { kind: "era", era: 8 },
      { kind: "hardware", id: "h_datahall", level: 1 }
    ],
    isEnclosure: true,
    demoLocked: true,
    nameKey: "hardware.h_dc_campus.name"
  },
  {
    id: "h_dyson_frame",
    phase: "server",
    slot: "enclosure",
    maxLevel: 1,
    baseCost: big(5e18),
    capPerLevel: 0,
    unlock: [
      { kind: "era", era: 10 },
      { kind: "hardware", id: "h_dc_campus", level: 1 }
    ],
    isEnclosure: true,
    demoLocked: true,
    nameKey: "hardware.h_dyson_frame.name"
  },
  {
    id: "h_srv_board",
    phase: "server",
    slot: "board",
    maxLevel: HARDWARE_UNBOUNDED_LEVEL,
    baseCost: big(1.5e6),
    growth: 2,
    capPerLevel: 120,
    unlock: [{ kind: "hardware", id: "h_rack", level: 1 }],
    isEnclosure: false,
    demoLocked: true,
    nameKey: "hardware.h_srv_board.name"
  },
  {
    id: "h_srv_psu",
    phase: "server",
    slot: "psu",
    maxLevel: HARDWARE_UNBOUNDED_LEVEL,
    baseCost: big(1.2e6),
    growth: 2,
    capPerLevel: 90,
    unlock: [{ kind: "hardware", id: "h_rack", level: 1 }],
    isEnclosure: false,
    demoLocked: true,
    nameKey: "hardware.h_srv_psu.name"
  },
  {
    id: "h_srv_cooling",
    phase: "server",
    slot: "cooling",
    maxLevel: HARDWARE_UNBOUNDED_LEVEL,
    baseCost: big(1.8e6),
    growth: 2,
    capPerLevel: 110,
    unlock: [{ kind: "hardware", id: "h_srv_board", level: 1 }],
    isEnclosure: false,
    demoLocked: true,
    nameKey: "hardware.h_srv_cooling.name"
  },
  {
    id: "h_srv_net",
    phase: "server",
    slot: "network",
    maxLevel: HARDWARE_UNBOUNDED_LEVEL,
    baseCost: big(2.5e6),
    growth: 2,
    capPerLevel: 140,
    unlock: [{ kind: "hardware", id: "h_srv_board", level: 1 }],
    isEnclosure: false,
    demoLocked: true,
    nameKey: "hardware.h_srv_net.name"
  },
  {
    id: "h_blade",
    phase: "server",
    slot: "compute",
    maxLevel: HARDWARE_UNBOUNDED_LEVEL,
    baseCost: big(2e6),
    growth: 2,
    capPerLevel: 300,
    unlock: [{ kind: "hardware", id: "h_rack", level: 1 }],
    isEnclosure: false,
    demoLocked: true,
    nameKey: "hardware.h_blade.name"
  },
  {
    id: "h_gpu_pod",
    phase: "server",
    slot: "compute",
    maxLevel: HARDWARE_UNBOUNDED_LEVEL,
    baseCost: big(8e7),
    growth: 2,
    capPerLevel: 900,
    unlock: [{ kind: "era", era: 4 }],
    isEnclosure: false,
    demoLocked: true,
    nameKey: "hardware.h_gpu_pod.name"
  },
  {
    id: "h_dc_module",
    phase: "server",
    slot: "compute",
    maxLevel: HARDWARE_UNBOUNDED_LEVEL,
    baseCost: big(5e9),
    growth: 2.1,
    capPerLevel: 2.8e3,
    unlock: [
      { kind: "era", era: 5 },
      { kind: "hardware", id: "h_row", level: 1 }
    ],
    isEnclosure: false,
    demoLocked: true,
    nameKey: "hardware.h_dc_module.name"
  },
  {
    id: "h_accel_array",
    phase: "server",
    slot: "compute",
    maxLevel: HARDWARE_UNBOUNDED_LEVEL,
    baseCost: big(8e11),
    growth: 2.1,
    capPerLevel: 9e3,
    unlock: [
      { kind: "era", era: 6 },
      { kind: "hardware", id: "h_datahall", level: 1 }
    ],
    isEnclosure: false,
    demoLocked: true,
    nameKey: "hardware.h_accel_array.name"
  },
  {
    id: "h_photonic_rack",
    phase: "server",
    slot: "compute",
    maxLevel: HARDWARE_UNBOUNDED_LEVEL,
    baseCost: big(3e13),
    growth: 2.1,
    capPerLevel: 1.6e4,
    unlock: [{ kind: "era", era: 7 }],
    isEnclosure: false,
    demoLocked: true,
    nameKey: "hardware.h_photonic_rack.name"
  },
  {
    id: "h_quantum_node",
    phase: "server",
    slot: "compute",
    maxLevel: HARDWARE_UNBOUNDED_LEVEL,
    baseCost: big(5e14),
    growth: 2.2,
    capPerLevel: 3e4,
    unlock: [
      { kind: "era", era: 8 },
      { kind: "hardware", id: "h_dc_campus", level: 1 }
    ],
    isEnclosure: false,
    demoLocked: true,
    nameKey: "hardware.h_quantum_node.name"
  },
  {
    id: "h_neuromorphic",
    phase: "server",
    slot: "compute",
    maxLevel: HARDWARE_UNBOUNDED_LEVEL,
    baseCost: big(4e16),
    growth: 2.2,
    capPerLevel: 5.5e4,
    unlock: [{ kind: "era", era: 9 }],
    isEnclosure: false,
    demoLocked: true,
    nameKey: "hardware.h_neuromorphic.name"
  },
  {
    id: "h_exotic_core",
    phase: "server",
    slot: "compute",
    maxLevel: HARDWARE_UNBOUNDED_LEVEL,
    baseCost: big(1e18),
    growth: 2.2,
    capPerLevel: 1e5,
    unlock: [
      { kind: "era", era: 10 },
      { kind: "hardware", id: "h_dyson_frame", level: 1 }
    ],
    isEnclosure: false,
    demoLocked: true,
    nameKey: "hardware.h_exotic_core.name"
  }
] as const;
