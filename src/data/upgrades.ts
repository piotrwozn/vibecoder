import { big, type Big } from "../core/bignum";
import type { Condition } from "./conditions";

export type UpgradeEffect =
  | { readonly kind: "bugChanceCapMultiplier"; readonly multiplier: number }
  | { readonly kind: "clickMultiplier"; readonly multiplier: number }
  | { readonly kind: "clickSynergy"; readonly value: number }
  | { readonly kind: "computeUseMultiplier"; readonly multiplier: number }
  | { readonly kind: "debtFactorMultiplier"; readonly multiplier: number }
  | { readonly kind: "flowGainMultiplier"; readonly multiplier: number }
  | { readonly kind: "generatorEraMultiplier"; readonly era: number; readonly multiplier: number }
  | {
      readonly kind: "generatorMultiplier";
      readonly generatorId: string;
      readonly multiplier: number;
    }
  | {
      readonly kind: "generatorSynergy";
      readonly multiplierPerSource: number;
      readonly sourceGeneratorId: string;
      readonly targetGeneratorId: string;
    }
  | { readonly kind: "globalGeneratorMultiplier"; readonly multiplier: number }
  | { readonly kind: "hypeCap"; readonly value: number }
  | { readonly kind: "hypeFloor"; readonly value: number }
  | { readonly kind: "hypeShipMultiplier"; readonly multiplier: number }
  | { readonly kind: "hypeTau"; readonly seconds: number }
  | { readonly kind: "payoutMultiplier"; readonly multiplier: number }
  | { readonly kind: "qualityAdd"; readonly value: number }
  | { readonly kind: "revenueMultiplier"; readonly multiplier: number }
  | { readonly kind: "autoFixDelay"; readonly seconds: number };

export interface UpgradeDefinition {
  readonly cost: Big;
  readonly demoLocked?: boolean;
  readonly effectKey: string;
  readonly effects: readonly UpgradeEffect[];
  readonly id: string;
  readonly nameKey: string;
  readonly unlock: Condition;
}

export const UPGRADES: readonly UpgradeDefinition[] = [
  {
    id: "u_better_prompts",
    cost: big(100),
    nameKey: "upgrade.u_better_prompts.name",
    effectKey: "upgrade.u_better_prompts.effect",
    unlock: { locLifetimeGte: "50" },
    effects: [{ kind: "clickMultiplier", multiplier: 2 }]
  },
  {
    id: "u_snippet_lib",
    cost: big(1.5e3),
    nameKey: "upgrade.u_snippet_lib.name",
    effectKey: "upgrade.u_snippet_lib.effect",
    unlock: { upgrade: "u_better_prompts" },
    effects: [{ kind: "clickMultiplier", multiplier: 3 }]
  },
  {
    id: "u_prompt_chains",
    cost: big(8e4),
    nameKey: "upgrade.u_prompt_chains.name",
    effectKey: "upgrade.u_prompt_chains.effect",
    unlock: { era: 2 },
    effects: [{ kind: "clickMultiplier", multiplier: 4 }]
  },
  {
    id: "u_voice_coding",
    cost: big(5e6),
    demoLocked: true,
    nameKey: "upgrade.u_voice_coding.name",
    effectKey: "upgrade.u_voice_coding.effect",
    unlock: { era: 3 },
    effects: [
      { kind: "clickMultiplier", multiplier: 5 },
      { kind: "flowGainMultiplier", multiplier: 1.5 }
    ]
  },
  {
    id: "u_think_mode",
    cost: big(1e9),
    demoLocked: true,
    nameKey: "upgrade.u_think_mode.name",
    effectKey: "upgrade.u_think_mode.effect",
    unlock: { era: 4 },
    effects: [{ kind: "clickSynergy", value: 0.05 }]
  },
  {
    id: "u_rubber_duck",
    cost: big(500),
    nameKey: "upgrade.u_rubber_duck.name",
    effectKey: "upgrade.u_rubber_duck.effect",
    unlock: { generatorGte: { id: "g_autocomplete", count: 10 } },
    effects: [{ kind: "generatorMultiplier", generatorId: "g_autocomplete", multiplier: 2 }]
  },
  {
    id: "u_parrot_treats",
    cost: big(5e3),
    nameKey: "upgrade.u_parrot_treats.name",
    effectKey: "upgrade.u_parrot_treats.effect",
    unlock: { generatorGte: { id: "g_parrot", count: 10 } },
    effects: [{ kind: "generatorMultiplier", generatorId: "g_parrot", multiplier: 2 }]
  },
  {
    id: "u_pair_prog",
    cost: big(2e6),
    nameKey: "upgrade.u_pair_prog.name",
    effectKey: "upgrade.u_pair_prog.effect",
    unlock: {
      all: [
        { era: 2 },
        { generatorGte: { id: "g_muse_pair", count: 10 } },
        { generatorGte: { id: "g_muse_junior", count: 10 } }
      ]
    },
    effects: [
      {
        kind: "generatorSynergy",
        targetGeneratorId: "g_muse_pair",
        sourceGeneratorId: "g_muse_junior",
        multiplierPerSource: 0.01
      }
    ]
  },
  {
    id: "u_swarm_protocol",
    cost: big(8e8),
    demoLocked: true,
    nameKey: "upgrade.u_swarm_protocol.name",
    effectKey: "upgrade.u_swarm_protocol.effect",
    unlock: { generatorGte: { id: "g_intern_swarm", count: 25 } },
    effects: [{ kind: "generatorMultiplier", generatorId: "g_intern_swarm", multiplier: 3 }]
  },
  {
    id: "u_green_ci",
    cost: big(1e10),
    demoLocked: true,
    nameKey: "upgrade.u_green_ci.name",
    effectKey: "upgrade.u_green_ci.effect",
    unlock: { generatorGte: { id: "g_ci_pipeline", count: 10 } },
    effects: [
      { kind: "generatorMultiplier", generatorId: "g_ci_pipeline", multiplier: 2 },
      { kind: "debtFactorMultiplier", multiplier: 0.9 }
    ]
  },
  {
    id: "u_hydra_sync",
    cost: big(2e12),
    demoLocked: true,
    nameKey: "upgrade.u_hydra_sync.name",
    effectKey: "upgrade.u_hydra_sync.effect",
    unlock: { era: 4 },
    effects: [
      {
        kind: "generatorSynergy",
        targetGeneratorId: "g_hydra_heads",
        sourceGeneratorId: "g_test_legion",
        multiplierPerSource: 0.02
      }
    ]
  },
  {
    id: "u_oracle_cache",
    cost: big(5e15),
    demoLocked: true,
    nameKey: "upgrade.u_oracle_cache.name",
    effectKey: "upgrade.u_oracle_cache.effect",
    unlock: { era: 5 },
    effects: [{ kind: "generatorMultiplier", generatorId: "g_oracle_node", multiplier: 3 }]
  },
  {
    id: "u_titan_alloy",
    cost: big(8e18),
    demoLocked: true,
    nameKey: "upgrade.u_titan_alloy.name",
    effectKey: "upgrade.u_titan_alloy.effect",
    unlock: { era: 6 },
    effects: [{ kind: "generatorEraMultiplier", era: 6, multiplier: 2 }]
  },
  {
    id: "u_shard_merge",
    cost: big(2e21),
    demoLocked: true,
    nameKey: "upgrade.u_shard_merge.name",
    effectKey: "upgrade.u_shard_merge.effect",
    unlock: { era: 7 },
    effects: [{ kind: "generatorEraMultiplier", era: 7, multiplier: 2 }]
  },
  {
    id: "u_global_lint",
    cost: big(2e7),
    demoLocked: true,
    nameKey: "upgrade.u_global_lint.name",
    effectKey: "upgrade.u_global_lint.effect",
    unlock: { era: 3 },
    effects: [{ kind: "globalGeneratorMultiplier", multiplier: 1.25 }]
  },
  {
    id: "u_monorepo",
    cost: big(6e10),
    demoLocked: true,
    nameKey: "upgrade.u_monorepo.name",
    effectKey: "upgrade.u_monorepo.effect",
    unlock: { era: 4 },
    effects: [{ kind: "globalGeneratorMultiplier", multiplier: 1.5 }]
  },
  {
    id: "u_agentic_os",
    cost: big(3e14),
    demoLocked: true,
    nameKey: "upgrade.u_agentic_os.name",
    effectKey: "upgrade.u_agentic_os.effect",
    unlock: { era: 5 },
    effects: [{ kind: "globalGeneratorMultiplier", multiplier: 1.75 }]
  },
  {
    id: "u_zero_latency",
    cost: big(9e17),
    demoLocked: true,
    nameKey: "upgrade.u_zero_latency.name",
    effectKey: "upgrade.u_zero_latency.effect",
    unlock: { era: 6 },
    effects: [{ kind: "globalGeneratorMultiplier", multiplier: 2 }]
  },
  {
    id: "u_post_scarcity",
    cost: big(5e22),
    demoLocked: true,
    nameKey: "upgrade.u_post_scarcity.name",
    effectKey: "upgrade.u_post_scarcity.effect",
    unlock: { era: 8 },
    effects: [{ kind: "globalGeneratorMultiplier", multiplier: 2 }]
  },
  {
    id: "u_invoice_bot",
    cost: big(2e4),
    nameKey: "upgrade.u_invoice_bot.name",
    effectKey: "upgrade.u_invoice_bot.effect",
    unlock: { shipCountGte: 10 },
    effects: [{ kind: "payoutMultiplier", multiplier: 1.2 }]
  },
  {
    id: "u_pricing_ai",
    cost: big(4e7),
    demoLocked: true,
    nameKey: "upgrade.u_pricing_ai.name",
    effectKey: "upgrade.u_pricing_ai.effect",
    unlock: { era: 3 },
    effects: [{ kind: "payoutMultiplier", multiplier: 1.35 }]
  },
  {
    id: "u_enterprise_tier",
    cost: big(1e11),
    demoLocked: true,
    nameKey: "upgrade.u_enterprise_tier.name",
    effectKey: "upgrade.u_enterprise_tier.effect",
    unlock: { era: 4 },
    effects: [{ kind: "revenueMultiplier", multiplier: 1.5 }]
  },
  {
    id: "u_subscription",
    cost: big(8e13),
    demoLocked: true,
    nameKey: "upgrade.u_subscription.name",
    effectKey: "upgrade.u_subscription.effect",
    unlock: { era: 5 },
    effects: [{ kind: "revenueMultiplier", multiplier: 1.75 }]
  },
  {
    id: "u_lock_in",
    cost: big(6e16),
    demoLocked: true,
    nameKey: "upgrade.u_lock_in.name",
    effectKey: "upgrade.u_lock_in.effect",
    unlock: { era: 6 },
    effects: [
      { kind: "payoutMultiplier", multiplier: 1.5 },
      { kind: "revenueMultiplier", multiplier: 1.5 }
    ]
  },
  {
    id: "u_launch_videos",
    cost: big(1e5),
    nameKey: "upgrade.u_launch_videos.name",
    effectKey: "upgrade.u_launch_videos.effect",
    unlock: { hypeMaxGte: 2 },
    effects: [{ kind: "hypeShipMultiplier", multiplier: 1.5 }]
  },
  {
    id: "u_influencer_bot",
    cost: big(3e8),
    demoLocked: true,
    nameKey: "upgrade.u_influencer_bot.name",
    effectKey: "upgrade.u_influencer_bot.effect",
    unlock: { era: 3 },
    effects: [{ kind: "hypeTau", seconds: 150 }]
  },
  {
    id: "u_keynote_mode",
    cost: big(7e12),
    demoLocked: true,
    nameKey: "upgrade.u_keynote_mode.name",
    effectKey: "upgrade.u_keynote_mode.effect",
    unlock: { era: 5 },
    effects: [{ kind: "hypeCap", value: 7 }]
  },
  {
    id: "u_evergreen",
    cost: big(2e18),
    demoLocked: true,
    nameKey: "upgrade.u_evergreen.name",
    effectKey: "upgrade.u_evergreen.effect",
    unlock: { era: 7 },
    effects: [{ kind: "hypeFloor", value: 1.5 }]
  },
  {
    id: "u_linters",
    cost: big(5e4),
    nameKey: "upgrade.u_linters.name",
    effectKey: "upgrade.u_linters.effect",
    unlock: { debtGte: "500" },
    effects: [{ kind: "debtFactorMultiplier", multiplier: 0.85 }]
  },
  {
    id: "u_code_review",
    cost: big(9e6),
    demoLocked: true,
    nameKey: "upgrade.u_code_review.name",
    effectKey: "upgrade.u_code_review.effect",
    unlock: { era: 3 },
    effects: [{ kind: "debtFactorMultiplier", multiplier: 0.8 }]
  },
  {
    id: "u_static_analysis",
    cost: big(2e10),
    demoLocked: true,
    nameKey: "upgrade.u_static_analysis.name",
    effectKey: "upgrade.u_static_analysis.effect",
    unlock: { era: 4 },
    effects: [{ kind: "qualityAdd", value: 0.05 }]
  },
  {
    id: "u_formal_verif",
    cost: big(8e14),
    demoLocked: true,
    nameKey: "upgrade.u_formal_verif.name",
    effectKey: "upgrade.u_formal_verif.effect",
    unlock: { era: 6 },
    effects: [{ kind: "bugChanceCapMultiplier", multiplier: 0.7 }]
  },
  {
    id: "u_self_healing",
    cost: big(1e19),
    demoLocked: true,
    nameKey: "upgrade.u_self_healing.name",
    effectKey: "upgrade.u_self_healing.effect",
    unlock: { era: 7 },
    effects: [{ kind: "autoFixDelay", seconds: 0 }]
  },
  {
    id: "u_undervolting",
    cost: big(3e5),
    nameKey: "upgrade.u_undervolting.name",
    effectKey: "upgrade.u_undervolting.effect",
    unlock: { era: 2 },
    effects: [{ kind: "computeUseMultiplier", multiplier: 0.9 }]
  },
  {
    id: "u_liquid_cooling",
    cost: big(7e9),
    demoLocked: true,
    nameKey: "upgrade.u_liquid_cooling.name",
    effectKey: "upgrade.u_liquid_cooling.effect",
    unlock: { era: 4 },
    effects: [{ kind: "computeUseMultiplier", multiplier: 0.85 }]
  },
  {
    id: "u_quantum_sched",
    cost: big(5e16),
    demoLocked: true,
    nameKey: "upgrade.u_quantum_sched.name",
    effectKey: "upgrade.u_quantum_sched.effect",
    unlock: { era: 6 },
    effects: [{ kind: "computeUseMultiplier", multiplier: 0.8 }]
  }
] as const;

export function getUpgrade(id: string): UpgradeDefinition | undefined {
  return UPGRADES.find((upgrade) => upgrade.id === id);
}
