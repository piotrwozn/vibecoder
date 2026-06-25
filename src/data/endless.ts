import { big, type Big } from "../core/bignum";
import type {
  EndlessChallengeId,
  EndlessCosmeticId,
  EndlessEventId,
  EndlessSeasonId
} from "../core/state";

export type EndlessEffectKind =
  | "bugChanceMultiplier"
  | "debtFactorMultiplier"
  | "hostingCostMultiplier"
  | "payoutMultiplier"
  | "rpMultiplier"
  | "workMultiplier";

export interface EndlessSeasonEffect {
  readonly kind: EndlessEffectKind;
  readonly multiplier: number;
}

export interface EndlessSeasonDefinition {
  readonly descriptionKey: string;
  readonly effects: readonly EndlessSeasonEffect[];
  readonly id: EndlessSeasonId;
  readonly nameKey: string;
}

export interface EndlessComponentDefinition {
  readonly id: string;
  readonly nameKey: string;
  readonly weight: number;
}

export interface EndlessModuleDefinition extends EndlessComponentDefinition {
  readonly workMultiplier: number;
}

export interface EndlessRiskDefinition extends EndlessComponentDefinition {
  readonly debtMultiplier: number;
  readonly risk: number;
}

export interface EndlessMilestoneDefinition {
  readonly descriptionKey: string;
  readonly id: string;
  readonly target: number;
}

export interface EndlessChallengeDefinition {
  readonly completionTier: number;
  readonly descriptionKey: string;
  readonly effects: readonly EndlessSeasonEffect[];
  readonly id: EndlessChallengeId;
  readonly nameKey: string;
  readonly reward: Partial<Record<keyof EndlessCurrencyReward, number>>;
}

export interface EndlessCurrencyReward {
  readonly automationRank: number;
  readonly enterpriseTrust: number;
  readonly influence: number;
  readonly legacyPoints: number;
  readonly modelResearch: number;
  readonly stabilityScore: number;
}

export interface EndlessEventDefinition {
  readonly descriptionKey: string;
  readonly durationS: number;
  readonly effects: readonly EndlessSeasonEffect[];
  readonly id: EndlessEventId;
  readonly nameKey: string;
}

export interface EndlessCosmeticDefinition {
  readonly id: EndlessCosmeticId;
  readonly nameKey: string;
  readonly requiredMilestoneId: string;
}

export interface EndlessSoftCapDefinition {
  readonly descriptionKey: string;
  readonly id: string;
  readonly threshold: number;
}

export const ENDLESS_UNLOCK_REPUTATION = 1_000_000;
export const ENDLESS_CONTRACT_OFFER_COUNT = 3;
export const ENDLESS_SEASON_DURATION_S = 7 * 24 * 60 * 60;
export const ENDLESS_EVENT_INTERVAL_S = 6 * 60 * 60;
export const ENDLESS_BASE_WORK_S = 180;
export const ENDLESS_BASE_LOC_COST: Big = big("1e25");
export const ENDLESS_BASE_MONEY_REWARD: Big = big("5e25");

export const ENDLESS_SEASONS: readonly EndlessSeasonDefinition[] = [
  {
    id: "bug_storm",
    nameKey: "endless.season.bug_storm.name",
    descriptionKey: "endless.season.bug_storm.description",
    effects: [
      { kind: "bugChanceMultiplier", multiplier: 1.45 },
      { kind: "rpMultiplier", multiplier: 1.25 }
    ]
  },
  {
    id: "enterprise",
    nameKey: "endless.season.enterprise.name",
    descriptionKey: "endless.season.enterprise.description",
    effects: [
      { kind: "payoutMultiplier", multiplier: 1.35 },
      { kind: "workMultiplier", multiplier: 1.15 }
    ]
  },
  {
    id: "speed",
    nameKey: "endless.season.speed.name",
    descriptionKey: "endless.season.speed.description",
    effects: [
      { kind: "workMultiplier", multiplier: 0.78 },
      { kind: "bugChanceMultiplier", multiplier: 1.2 }
    ]
  },
  {
    id: "open_source",
    nameKey: "endless.season.open_source.name",
    descriptionKey: "endless.season.open_source.description",
    effects: [
      { kind: "payoutMultiplier", multiplier: 0.82 },
      { kind: "rpMultiplier", multiplier: 1.8 }
    ]
  },
  {
    id: "cloud_crisis",
    nameKey: "endless.season.cloud_crisis.name",
    descriptionKey: "endless.season.cloud_crisis.description",
    effects: [
      { kind: "hostingCostMultiplier", multiplier: 1.35 },
      { kind: "payoutMultiplier", multiplier: 1.2 }
    ]
  },
  {
    id: "agent_swarm",
    nameKey: "endless.season.agent_swarm.name",
    descriptionKey: "endless.season.agent_swarm.description",
    effects: [
      { kind: "workMultiplier", multiplier: 0.88 },
      { kind: "debtFactorMultiplier", multiplier: 1.18 }
    ]
  },
  {
    id: "security",
    nameKey: "endless.season.security.name",
    descriptionKey: "endless.season.security.description",
    effects: [
      { kind: "bugChanceMultiplier", multiplier: 0.85 },
      { kind: "workMultiplier", multiplier: 1.18 },
      { kind: "rpMultiplier", multiplier: 1.3 }
    ]
  },
  {
    id: "model_outage",
    nameKey: "endless.season.model_outage.name",
    descriptionKey: "endless.season.model_outage.description",
    effects: [
      { kind: "workMultiplier", multiplier: 1.25 },
      { kind: "payoutMultiplier", multiplier: 1.25 }
    ]
  }
] as const;

export const ENDLESS_PRODUCT_TYPES: readonly EndlessComponentDefinition[] = [
  { id: "saas", nameKey: "endless.product.saas", weight: 1 },
  { id: "marketplace", nameKey: "endless.product.marketplace", weight: 1.25 },
  { id: "devtool", nameKey: "endless.product.devtool", weight: 0.9 },
  { id: "ai_app", nameKey: "endless.product.ai_app", weight: 1.35 },
  { id: "enterprise_system", nameKey: "endless.product.enterprise_system", weight: 1.55 },
  { id: "game_backend", nameKey: "endless.product.game_backend", weight: 1.15 },
  { id: "automation_platform", nameKey: "endless.product.automation_platform", weight: 1.3 },
  { id: "analytics_system", nameKey: "endless.product.analytics_system", weight: 1.1 }
] as const;

export const ENDLESS_INDUSTRIES: readonly EndlessComponentDefinition[] = [
  { id: "healthcare", nameKey: "endless.industry.healthcare", weight: 1.25 },
  { id: "fintech", nameKey: "endless.industry.fintech", weight: 1.35 },
  { id: "ecommerce", nameKey: "endless.industry.ecommerce", weight: 1 },
  { id: "education", nameKey: "endless.industry.education", weight: 0.9 },
  { id: "creator", nameKey: "endless.industry.creator", weight: 0.95 },
  { id: "logistics", nameKey: "endless.industry.logistics", weight: 1.15 },
  { id: "cybersecurity", nameKey: "endless.industry.cybersecurity", weight: 1.45 },
  { id: "gaming", nameKey: "endless.industry.gaming", weight: 1.1 }
] as const;

export const ENDLESS_SCALES: readonly EndlessComponentDefinition[] = [
  { id: "micro", nameKey: "endless.scale.micro", weight: 0.75 },
  { id: "indie", nameKey: "endless.scale.indie", weight: 1 },
  { id: "startup", nameKey: "endless.scale.startup", weight: 1.25 },
  { id: "enterprise", nameKey: "endless.scale.enterprise", weight: 1.75 },
  { id: "global", nameKey: "endless.scale.global", weight: 2.4 }
] as const;

export const ENDLESS_MODULES: readonly EndlessModuleDefinition[] = [
  { id: "frontend", nameKey: "endless.module.frontend", weight: 1, workMultiplier: 1 },
  { id: "backend", nameKey: "endless.module.backend", weight: 1, workMultiplier: 1.1 },
  { id: "auth", nameKey: "endless.module.auth", weight: 1, workMultiplier: 1.12 },
  { id: "payments", nameKey: "endless.module.payments", weight: 1, workMultiplier: 1.18 },
  { id: "ai", nameKey: "endless.module.ai", weight: 1, workMultiplier: 1.3 },
  { id: "database", nameKey: "endless.module.database", weight: 1, workMultiplier: 1.15 },
  { id: "analytics", nameKey: "endless.module.analytics", weight: 1, workMultiplier: 1.08 },
  { id: "monitoring", nameKey: "endless.module.monitoring", weight: 1, workMultiplier: 1.05 },
  { id: "mobile", nameKey: "endless.module.mobile", weight: 1, workMultiplier: 1.12 },
  { id: "integrations", nameKey: "endless.module.integrations", weight: 1, workMultiplier: 1.2 },
  { id: "security", nameKey: "endless.module.security", weight: 1, workMultiplier: 1.22 },
  { id: "compliance", nameKey: "endless.module.compliance", weight: 1, workMultiplier: 1.25 },
  { id: "state", nameKey: "endless.module.state", weight: 1, workMultiplier: 1.08 },
  { id: "realtime", nameKey: "endless.module.realtime", weight: 1, workMultiplier: 1.16 },
  { id: "ml_model", nameKey: "endless.module.ml_model", weight: 1, workMultiplier: 1.28 },
  { id: "ci_cd", nameKey: "endless.module.ci_cd", weight: 1, workMultiplier: 1.1 },
  { id: "data_pipeline", nameKey: "endless.module.data_pipeline", weight: 1, workMultiplier: 1.2 },
  { id: "admin_panel", nameKey: "endless.module.admin_panel", weight: 1, workMultiplier: 1.06 },
  { id: "performance", nameKey: "endless.module.performance", weight: 1, workMultiplier: 1.18 },
  { id: "documentation", nameKey: "endless.module.documentation", weight: 1, workMultiplier: 1.04 }
] as const;

export const ENDLESS_MODIFIERS: readonly EndlessComponentDefinition[] = [
  { id: "tight_deadline", nameKey: "endless.modifier.tight_deadline", weight: 1.15 },
  { id: "enterprise_audit", nameKey: "endless.modifier.enterprise_audit", weight: 1.25 },
  { id: "legacy_codebase", nameKey: "endless.modifier.legacy_codebase", weight: 1.35 },
  { id: "viral_potential", nameKey: "endless.modifier.viral_potential", weight: 1.2 },
  { id: "low_budget", nameKey: "endless.modifier.low_budget", weight: 0.85 },
  { id: "high_sla", nameKey: "endless.modifier.high_sla", weight: 1.3 },
  { id: "zero_bugs", nameKey: "endless.modifier.zero_bugs", weight: 1.4 },
  { id: "ai_heavy", nameKey: "endless.modifier.ai_heavy", weight: 1.2 }
] as const;

export const ENDLESS_RISKS: readonly EndlessRiskDefinition[] = [
  {
    id: "security_leak",
    nameKey: "endless.risk.security_leak",
    risk: 3,
    weight: 1.35,
    debtMultiplier: 1.4
  },
  {
    id: "model_outage",
    nameKey: "endless.risk.model_outage",
    risk: 2,
    weight: 1.2,
    debtMultiplier: 1.15
  },
  {
    id: "cloud_cost_spike",
    nameKey: "endless.risk.cloud_cost_spike",
    risk: 2,
    weight: 1.15,
    debtMultiplier: 1.1
  },
  {
    id: "agent_loop",
    nameKey: "endless.risk.agent_loop",
    risk: 2,
    weight: 1.2,
    debtMultiplier: 1.25
  },
  {
    id: "migration_failed",
    nameKey: "endless.risk.migration_failed",
    risk: 3,
    weight: 1.3,
    debtMultiplier: 1.35
  },
  {
    id: "hallucinated_api",
    nameKey: "endless.risk.hallucinated_api",
    risk: 1,
    weight: 1.08,
    debtMultiplier: 1.08
  },
  {
    id: "support_flood",
    nameKey: "endless.risk.support_flood",
    risk: 2,
    weight: 1.18,
    debtMultiplier: 1.18
  },
  {
    id: "compliance_gap",
    nameKey: "endless.risk.compliance_gap",
    risk: 3,
    weight: 1.32,
    debtMultiplier: 1.3
  }
] as const;

export const ENDLESS_MILESTONES: readonly EndlessMilestoneDefinition[] = [
  {
    id: "tier_10",
    target: 10,
    descriptionKey: "endless.milestone.tier_10"
  },
  {
    id: "tier_25",
    target: 25,
    descriptionKey: "endless.milestone.tier_25"
  },
  {
    id: "tier_50",
    target: 50,
    descriptionKey: "endless.milestone.tier_50"
  },
  {
    id: "tier_100",
    target: 100,
    descriptionKey: "endless.milestone.tier_100"
  },
  {
    id: "tier_250",
    target: 250,
    descriptionKey: "endless.milestone.tier_250"
  },
  {
    id: "tier_500",
    target: 500,
    descriptionKey: "endless.milestone.tier_500"
  },
  {
    id: "tier_1000",
    target: 1000,
    descriptionKey: "endless.milestone.tier_1000"
  }
] as const;

export const ENDLESS_CHALLENGES: readonly EndlessChallengeDefinition[] = [
  {
    id: "no_failed_deploy",
    nameKey: "endless.challenge.no_failed_deploy.name",
    descriptionKey: "endless.challenge.no_failed_deploy.description",
    completionTier: 25,
    effects: [
      { kind: "bugChanceMultiplier", multiplier: 0.9 },
      { kind: "workMultiplier", multiplier: 1.08 }
    ],
    reward: { stabilityScore: 12, legacyPoints: 4 }
  },
  {
    id: "no_manual_coding",
    nameKey: "endless.challenge.no_manual_coding.name",
    descriptionKey: "endless.challenge.no_manual_coding.description",
    completionTier: 25,
    effects: [{ kind: "workMultiplier", multiplier: 1.18 }],
    reward: { automationRank: 14, legacyPoints: 4 }
  },
  {
    id: "no_agents",
    nameKey: "endless.challenge.no_agents.name",
    descriptionKey: "endless.challenge.no_agents.description",
    completionTier: 20,
    effects: [
      { kind: "workMultiplier", multiplier: 1.35 },
      { kind: "rpMultiplier", multiplier: 1.25 }
    ],
    reward: { modelResearch: 10, legacyPoints: 3 }
  },
  {
    id: "open_source_only",
    nameKey: "endless.challenge.open_source_only.name",
    descriptionKey: "endless.challenge.open_source_only.description",
    completionTier: 30,
    effects: [
      { kind: "payoutMultiplier", multiplier: 0.75 },
      { kind: "rpMultiplier", multiplier: 1.8 }
    ],
    reward: { influence: 18, legacyPoints: 5 }
  },
  {
    id: "enterprise_only",
    nameKey: "endless.challenge.enterprise_only.name",
    descriptionKey: "endless.challenge.enterprise_only.description",
    completionTier: 35,
    effects: [
      { kind: "payoutMultiplier", multiplier: 1.45 },
      { kind: "debtFactorMultiplier", multiplier: 1.2 },
      { kind: "workMultiplier", multiplier: 1.12 }
    ],
    reward: { enterpriseTrust: 20, legacyPoints: 6 }
  },
  {
    id: "zero_debt",
    nameKey: "endless.challenge.zero_debt.name",
    descriptionKey: "endless.challenge.zero_debt.description",
    completionTier: 25,
    effects: [
      { kind: "payoutMultiplier", multiplier: 0.9 },
      { kind: "debtFactorMultiplier", multiplier: 0.75 }
    ],
    reward: { stabilityScore: 14, automationRank: 6, legacyPoints: 4 }
  },
  {
    id: "max_automation",
    nameKey: "endless.challenge.max_automation.name",
    descriptionKey: "endless.challenge.max_automation.description",
    completionTier: 40,
    effects: [
      { kind: "workMultiplier", multiplier: 0.82 },
      { kind: "bugChanceMultiplier", multiplier: 1.15 }
    ],
    reward: { automationRank: 24, modelResearch: 8, legacyPoints: 7 }
  },
  {
    id: "cheap_cloud",
    nameKey: "endless.challenge.cheap_cloud.name",
    descriptionKey: "endless.challenge.cheap_cloud.description",
    completionTier: 30,
    effects: [
      { kind: "hostingCostMultiplier", multiplier: 1.25 },
      { kind: "payoutMultiplier", multiplier: 1.1 }
    ],
    reward: { stabilityScore: 8, enterpriseTrust: 8, legacyPoints: 5 }
  },
  {
    id: "security_first",
    nameKey: "endless.challenge.security_first.name",
    descriptionKey: "endless.challenge.security_first.description",
    completionTier: 35,
    effects: [
      { kind: "bugChanceMultiplier", multiplier: 0.72 },
      { kind: "workMultiplier", multiplier: 1.22 },
      { kind: "rpMultiplier", multiplier: 1.2 }
    ],
    reward: { enterpriseTrust: 18, stabilityScore: 10, legacyPoints: 6 }
  },
  {
    id: "one_model",
    nameKey: "endless.challenge.one_model.name",
    descriptionKey: "endless.challenge.one_model.description",
    completionTier: 30,
    effects: [
      { kind: "workMultiplier", multiplier: 1.16 },
      { kind: "payoutMultiplier", multiplier: 1.12 }
    ],
    reward: { modelResearch: 18, legacyPoints: 5 }
  }
] as const;

export const ENDLESS_EVENTS: readonly EndlessEventDefinition[] = [
  {
    id: "global_model_outage",
    nameKey: "endless.event.global_model_outage.name",
    descriptionKey: "endless.event.global_model_outage.description",
    durationS: 45 * 60,
    effects: [
      { kind: "workMultiplier", multiplier: 1.3 },
      { kind: "payoutMultiplier", multiplier: 1.12 }
    ]
  },
  {
    id: "dependency_collapse",
    nameKey: "endless.event.dependency_collapse.name",
    descriptionKey: "endless.event.dependency_collapse.description",
    durationS: 60 * 60,
    effects: [
      { kind: "bugChanceMultiplier", multiplier: 1.28 },
      { kind: "debtFactorMultiplier", multiplier: 1.18 }
    ]
  },
  {
    id: "viral_launch_spike",
    nameKey: "endless.event.viral_launch_spike.name",
    descriptionKey: "endless.event.viral_launch_spike.description",
    durationS: 35 * 60,
    effects: [{ kind: "payoutMultiplier", multiplier: 1.35 }]
  },
  {
    id: "cloud_price_increase",
    nameKey: "endless.event.cloud_price_increase.name",
    descriptionKey: "endless.event.cloud_price_increase.description",
    durationS: 75 * 60,
    effects: [
      { kind: "hostingCostMultiplier", multiplier: 1.22 },
      { kind: "rpMultiplier", multiplier: 1.1 }
    ]
  },
  {
    id: "cve_wave",
    nameKey: "endless.event.cve_wave.name",
    descriptionKey: "endless.event.cve_wave.description",
    durationS: 50 * 60,
    effects: [
      { kind: "bugChanceMultiplier", multiplier: 1.18 },
      { kind: "rpMultiplier", multiplier: 1.18 }
    ]
  },
  {
    id: "agent_market_crash",
    nameKey: "endless.event.agent_market_crash.name",
    descriptionKey: "endless.event.agent_market_crash.description",
    durationS: 45 * 60,
    effects: [
      { kind: "workMultiplier", multiplier: 1.15 },
      { kind: "payoutMultiplier", multiplier: 1.08 }
    ]
  },
  {
    id: "investor_hype_cycle",
    nameKey: "endless.event.investor_hype_cycle.name",
    descriptionKey: "endless.event.investor_hype_cycle.description",
    durationS: 40 * 60,
    effects: [{ kind: "payoutMultiplier", multiplier: 1.25 }]
  },
  {
    id: "open_source_wave",
    nameKey: "endless.event.open_source_wave.name",
    descriptionKey: "endless.event.open_source_wave.description",
    durationS: 50 * 60,
    effects: [
      { kind: "rpMultiplier", multiplier: 1.35 },
      { kind: "payoutMultiplier", multiplier: 0.92 }
    ]
  },
  {
    id: "enterprise_audit_wave",
    nameKey: "endless.event.enterprise_audit_wave.name",
    descriptionKey: "endless.event.enterprise_audit_wave.description",
    durationS: 60 * 60,
    effects: [
      { kind: "workMultiplier", multiplier: 1.18 },
      { kind: "payoutMultiplier", multiplier: 1.24 }
    ]
  },
  {
    id: "production_chain",
    nameKey: "endless.event.production_chain.name",
    descriptionKey: "endless.event.production_chain.description",
    durationS: 55 * 60,
    effects: [
      { kind: "debtFactorMultiplier", multiplier: 1.2 },
      { kind: "bugChanceMultiplier", multiplier: 1.16 }
    ]
  },
  {
    id: "competitor_launch",
    nameKey: "endless.event.competitor_launch.name",
    descriptionKey: "endless.event.competitor_launch.description",
    durationS: 45 * 60,
    effects: [
      { kind: "workMultiplier", multiplier: 0.92 },
      { kind: "rpMultiplier", multiplier: 1.12 }
    ]
  },
  {
    id: "new_model_release",
    nameKey: "endless.event.new_model_release.name",
    descriptionKey: "endless.event.new_model_release.description",
    durationS: 35 * 60,
    effects: [{ kind: "workMultiplier", multiplier: 0.86 }]
  }
] as const;

export const ENDLESS_COSMETICS: readonly EndlessCosmeticDefinition[] = [
  {
    id: "legacy_wallpaper",
    nameKey: "endless.cosmetic.legacy_wallpaper",
    requiredMilestoneId: "tier_10"
  },
  {
    id: "swarm_icon_pack",
    nameKey: "endless.cosmetic.swarm_icon_pack",
    requiredMilestoneId: "tier_25"
  },
  {
    id: "compliance_terminal",
    nameKey: "endless.cosmetic.compliance_terminal",
    requiredMilestoneId: "tier_50"
  },
  { id: "empire_badge", nameKey: "endless.cosmetic.empire_badge", requiredMilestoneId: "tier_100" },
  {
    id: "seasonal_desktop",
    nameKey: "endless.cosmetic.seasonal_desktop",
    requiredMilestoneId: "tier_250"
  },
  { id: "aurora_frame", nameKey: "endless.cosmetic.aurora_frame", requiredMilestoneId: "tier_500" }
] as const;

export const ENDLESS_SOFT_CAPS: readonly EndlessSoftCapDefinition[] = [
  {
    id: "coordination",
    threshold: 25,
    descriptionKey: "endless.softCap.coordination"
  },
  {
    id: "cloud_cost",
    threshold: 50,
    descriptionKey: "endless.softCap.cloud_cost"
  },
  {
    id: "context",
    threshold: 100,
    descriptionKey: "endless.softCap.context"
  },
  {
    id: "governance",
    threshold: 250,
    descriptionKey: "endless.softCap.governance"
  }
] as const;

export function getEndlessSeason(id: EndlessSeasonId): EndlessSeasonDefinition {
  return ENDLESS_SEASONS.find((season) => season.id === id) ?? ENDLESS_SEASONS[0]!;
}

export function getEndlessChallenge(id: EndlessChallengeId): EndlessChallengeDefinition {
  return ENDLESS_CHALLENGES.find((challenge) => challenge.id === id) ?? ENDLESS_CHALLENGES[0]!;
}

export function getEndlessEvent(id: EndlessEventId): EndlessEventDefinition {
  return ENDLESS_EVENTS.find((event) => event.id === id) ?? ENDLESS_EVENTS[0]!;
}
