import { big, type Big } from "../core/bignum";
import { AURORA_SEED_AVAILABLE_FLAG, type AuroraCompletionEffect } from "./aurora";
import type { Condition } from "./conditions";

export type ProjectKind = "open_source" | "refactor" | "standard" | "unlock";

export interface ProjectDefinition {
  readonly bugResistant?: boolean;
  readonly buildS: number;
  readonly completionEffect?: AuroraCompletionEffect;
  readonly costLoC: Big;
  readonly demoLocked?: boolean;
  readonly era: number;
  readonly hypeBonus?: number;
  readonly id: string;
  readonly kind: ProjectKind;
  readonly nameKey: string;
  readonly recurringRevenue?: boolean;
  readonly rpFirst?: number;
  readonly rpReward?: number;
  readonly unlock?: Condition;
  readonly valueRatio: number;
}

export const PROJECTS: readonly ProjectDefinition[] = [
  {
    id: "p_llama_todo",
    era: 1,
    nameKey: "project.p_llama_todo.name",
    costLoC: big(75),
    valueRatio: 0.45,
    buildS: 45,
    kind: "standard",
    recurringRevenue: false
  },
  {
    id: "p_landing",
    era: 1,
    nameKey: "project.p_landing.name",
    costLoC: big(1.2e3),
    valueRatio: 0.55,
    buildS: 75,
    kind: "standard"
  },
  {
    id: "p_scope_creep",
    era: 1,
    nameKey: "project.p_scope_creep.name",
    costLoC: big(9e3),
    valueRatio: 0.6,
    buildS: 120,
    kind: "standard",
    rpReward: 1,
    rpFirst: 3
  },
  {
    id: "p_micro_saas",
    era: 2,
    nameKey: "project.p_micro_saas.name",
    costLoC: big(1.5e5),
    valueRatio: 0.75,
    buildS: 80,
    kind: "standard",
    hypeBonus: 0.3
  },
  {
    id: "p_chirper_bot",
    era: 2,
    nameKey: "project.p_chirper_bot.name",
    costLoC: big(9e5),
    valueRatio: 0.65,
    buildS: 90,
    kind: "standard",
    hypeBonus: 0.5
  },
  {
    id: "p_mvp",
    era: 3,
    demoLocked: true,
    nameKey: "project.p_mvp.name",
    costLoC: big(3e6),
    valueRatio: 1.3,
    buildS: 45,
    kind: "standard",
    rpReward: 2,
    rpFirst: 3
  },
  {
    id: "p_dashboard",
    era: 3,
    demoLocked: true,
    nameKey: "project.p_dashboard.name",
    costLoC: big(2e7),
    valueRatio: 1.1,
    buildS: 50,
    kind: "standard"
  },
  {
    id: "p_enterprise_mig",
    era: 4,
    demoLocked: true,
    nameKey: "project.p_enterprise_mig.name",
    costLoC: big(4e8),
    valueRatio: 1.5,
    buildS: 90,
    kind: "standard"
  },
  {
    id: "p_compliance",
    era: 4,
    demoLocked: true,
    nameKey: "project.p_compliance.name",
    costLoC: big(3e9),
    valueRatio: 1.2,
    buildS: 75,
    kind: "standard",
    bugResistant: true
  },
  {
    id: "p_copilot_clone",
    era: 5,
    demoLocked: true,
    nameKey: "project.p_copilot_clone.name",
    costLoC: big(5e10),
    valueRatio: 1.3,
    buildS: 60,
    kind: "standard",
    hypeBonus: 0.6
  },
  {
    id: "p_cloud_platform",
    era: 5,
    demoLocked: true,
    nameKey: "project.p_cloud_platform.name",
    costLoC: big(4e11),
    valueRatio: 1.4,
    buildS: 100,
    kind: "standard",
    rpReward: 3,
    rpFirst: 3
  },
  {
    id: "p_banking_core",
    era: 6,
    demoLocked: true,
    nameKey: "project.p_banking_core.name",
    costLoC: big(6e12),
    valueRatio: 1.5,
    buildS: 120,
    kind: "standard"
  },
  {
    id: "p_self_driving",
    era: 6,
    demoLocked: true,
    nameKey: "project.p_self_driving.name",
    costLoC: big(5e13),
    valueRatio: 1.2,
    buildS: 90,
    kind: "standard",
    hypeBonus: 0.8
  },
  {
    id: "p_city_os",
    era: 7,
    demoLocked: true,
    nameKey: "project.p_city_os.name",
    costLoC: big(8e14),
    valueRatio: 1.4,
    buildS: 110,
    kind: "standard"
  },
  {
    id: "p_synth_workforce",
    era: 7,
    demoLocked: true,
    nameKey: "project.p_synth_workforce.name",
    costLoC: big(7e15),
    valueRatio: 1.3,
    buildS: 100,
    kind: "standard"
  },
  {
    id: "p_logistics_brain",
    era: 8,
    demoLocked: true,
    nameKey: "project.p_logistics_brain.name",
    costLoC: big(1e17),
    valueRatio: 1.5,
    buildS: 120,
    kind: "standard"
  },
  {
    id: "p_climate_rewrite",
    era: 8,
    demoLocked: true,
    nameKey: "project.p_climate_rewrite.name",
    costLoC: big(9e17),
    valueRatio: 1.2,
    buildS: 100,
    kind: "standard",
    rpReward: 3,
    rpFirst: 3
  },
  {
    id: "p_mind_upload",
    era: 9,
    demoLocked: true,
    nameKey: "project.p_mind_upload.name",
    costLoC: big(1.5e19),
    valueRatio: 1.4,
    buildS: 110,
    kind: "standard",
    hypeBonus: 1
  },
  {
    id: "p_reality_patch",
    era: 9,
    demoLocked: true,
    nameKey: "project.p_reality_patch.name",
    costLoC: big(1.2e20),
    valueRatio: 1.3,
    buildS: 90,
    kind: "standard"
  },
  {
    id: "p_planetary_os",
    era: 10,
    demoLocked: true,
    nameKey: "project.p_planetary_os.name",
    costLoC: big(2e21),
    valueRatio: 1.5,
    buildS: 150,
    kind: "standard"
  },
  {
    id: "p_omega_request",
    era: 10,
    demoLocked: true,
    nameKey: "project.p_omega_request.name",
    costLoC: big(3e22),
    valueRatio: 2,
    buildS: 60,
    kind: "standard",
    unlock: { flag: "omega_requests" }
  },
  {
    id: "p_aurora_seed",
    era: 10,
    demoLocked: true,
    nameKey: "project.p_aurora_seed.name",
    costLoC: big(5e22),
    valueRatio: 0,
    buildS: 300,
    kind: "unlock",
    unlock: { flag: AURORA_SEED_AVAILABLE_FLAG },
    completionEffect: "unlockAurora"
  },
  {
    id: "p_open_source",
    era: 1,
    nameKey: "project.p_open_source.name",
    costLoC: big(0),
    valueRatio: 0,
    buildS: 30,
    kind: "open_source",
    rpReward: 2,
    hypeBonus: 0.4
  }
] as const;

export const REFACTOR_PROJECT: ProjectDefinition = {
  id: "p_refactor",
  era: 1,
  nameKey: "project.p_refactor.name",
  costLoC: big(0),
  valueRatio: 0,
  buildS: 30,
  kind: "refactor"
};
