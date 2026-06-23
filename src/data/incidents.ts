import type { IncidentResponseId, ProductionIncidentType } from "../core/state";
import type { Condition } from "./conditions";

export interface IncidentResponseDefinition {
  readonly costLocS?: number;
  readonly costMoneyRatio?: number;
  readonly costRp?: number;
  readonly debtMultiplier?: number;
  readonly descriptionKey: string;
  readonly hypeDelta?: number;
  readonly id: IncidentResponseId;
  readonly nameKey: string;
}

export interface ProductionIncidentDefinition {
  readonly baseChance: number;
  readonly descriptionKey: string;
  readonly durationS: number;
  readonly id: ProductionIncidentType;
  readonly nameKey: string;
  readonly responses: readonly IncidentResponseId[];
  readonly severity: number;
  readonly trigger: Condition;
}

export const INCIDENT_RESPONSES: readonly IncidentResponseDefinition[] = [
  {
    id: "hotfix",
    nameKey: "incident.response.hotfix.name",
    descriptionKey: "incident.response.hotfix.effect",
    costLocS: 45,
    debtMultiplier: 1.1
  },
  {
    id: "refactor",
    nameKey: "incident.response.refactor.name",
    descriptionKey: "incident.response.refactor.effect",
    costLocS: 90,
    debtMultiplier: 0.8
  },
  {
    id: "buy_hardware",
    nameKey: "incident.response.buy_hardware.name",
    descriptionKey: "incident.response.buy_hardware.effect",
    costMoneyRatio: 0.12
  },
  {
    id: "pause_growth",
    nameKey: "incident.response.pause_growth.name",
    descriptionKey: "incident.response.pause_growth.effect",
    hypeDelta: -0.5,
    debtMultiplier: 0.9
  },
  {
    id: "pay_vendor",
    nameKey: "incident.response.pay_vendor.name",
    descriptionKey: "incident.response.pay_vendor.effect",
    costMoneyRatio: 0.18
  },
  {
    id: "accept_debt",
    nameKey: "incident.response.accept_debt.name",
    descriptionKey: "incident.response.accept_debt.effect",
    debtMultiplier: 1.25
  },
  {
    id: "use_research",
    nameKey: "incident.response.use_research.name",
    descriptionKey: "incident.response.use_research.effect",
    costRp: 3,
    debtMultiplier: 0.7
  }
] as const;

export const PRODUCTION_INCIDENTS: readonly ProductionIncidentDefinition[] = [
  {
    id: "outage",
    nameKey: "incident.outage.name",
    descriptionKey: "incident.outage.description",
    trigger: { all: [{ debtRatioGte: 0.35 }, { productCountGte: 1 }] },
    durationS: 8 * 60,
    severity: 2,
    baseChance: 0.18,
    responses: ["hotfix", "refactor", "accept_debt"]
  },
  {
    id: "security_bug",
    nameKey: "incident.security_bug.name",
    descriptionKey: "incident.security_bug.description",
    trigger: { all: [{ debtRatioGte: 0.6 }, { productCountGte: 1 }] },
    durationS: 12 * 60,
    severity: 3,
    baseChance: 0.12,
    responses: ["hotfix", "use_research", "accept_debt"]
  },
  {
    id: "viral_launch_spike",
    nameKey: "incident.viral_launch_spike.name",
    descriptionKey: "incident.viral_launch_spike.description",
    trigger: { all: [{ hypeGte: 3 }, { productCountGte: 1 }] },
    durationS: 6 * 60,
    severity: 1,
    baseChance: 0.16,
    responses: ["buy_hardware", "pause_growth", "accept_debt"]
  },
  {
    id: "vendor_lock_in",
    nameKey: "incident.vendor_lock_in.name",
    descriptionKey: "incident.vendor_lock_in.description",
    trigger: { any: [{ flag: "decision.cloud_vendor" }, { flag: "runStyle.cursed_enterprise" }] },
    durationS: 14 * 60,
    severity: 3,
    baseChance: 0.16,
    responses: ["pay_vendor", "refactor", "accept_debt"]
  },
  {
    id: "bad_deploy",
    nameKey: "incident.bad_deploy.name",
    descriptionKey: "incident.bad_deploy.description",
    trigger: { all: [{ shipCountGte: 3 }, { debtRatioGte: 0.25 }] },
    durationS: 7 * 60,
    severity: 2,
    baseChance: 0.14,
    responses: ["hotfix", "pause_growth", "refactor"]
  },
  {
    id: "billing_shock",
    nameKey: "incident.billing_shock.name",
    descriptionKey: "incident.billing_shock.description",
    trigger: { flag: "aurora_hosting_started" },
    durationS: 10 * 60,
    severity: 2,
    baseChance: 0.12,
    responses: ["pay_vendor", "pause_growth", "accept_debt"]
  },
  {
    id: "aurora_instability",
    nameKey: "incident.aurora_instability.name",
    descriptionKey: "incident.aurora_instability.description",
    trigger: { flag: "aurora_phase_started" },
    durationS: 9 * 60,
    severity: 3,
    baseChance: 0.1,
    responses: ["use_research", "buy_hardware", "accept_debt"]
  }
] as const;

export function getIncidentDefinition(
  type: ProductionIncidentType
): ProductionIncidentDefinition | undefined {
  return PRODUCTION_INCIDENTS.find((incident) => incident.id === type);
}

export function getIncidentResponse(
  id: IncidentResponseId
): IncidentResponseDefinition | undefined {
  return INCIDENT_RESPONSES.find((response) => response.id === id);
}
