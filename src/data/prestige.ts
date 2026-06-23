export type InsightBranch = "capital" | "core" | "craft" | "velocity";
export type EquityPerkState = "available" | "bought" | "locked" | "unaffordable";
export type RunModifierId = "blackout" | "debt_storm" | "indie" | "no_click";

export type InsightEffect =
  | { readonly count: number; readonly generatorId: string; readonly kind: "startGenerator" }
  | { readonly kind: "locMultiplier"; readonly multiplier: number }
  | { readonly kind: "generatorCostMultiplier"; readonly multiplier: number }
  | { readonly era: number; readonly kind: "startEra" }
  | { readonly kind: "flowMultiplier"; readonly value: number }
  | { readonly amount: string; readonly kind: "startMoney" }
  | { readonly kind: "payoutMultiplier"; readonly multiplier: number }
  | { readonly kind: "hypeTauAdd"; readonly seconds: number }
  | { readonly fraction: number; readonly kind: "startMoneyRatio" }
  | { readonly kind: "revenueMultiplier"; readonly multiplier: number }
  | { readonly kind: "projectBoardSlotsAdd"; readonly slots: number }
  | { readonly chance: number; readonly kind: "goldenClientChance" }
  | { readonly kind: "debtFactorMultiplier"; readonly multiplier: number }
  | { readonly hours: number; readonly kind: "offlineCapHoursAdd" }
  | { readonly kind: "qualityAdd"; readonly value: number }
  | { readonly kind: "qaMultiplier"; readonly multiplier: number }
  | { readonly kind: "bugPenalty"; readonly value: number }
  | { readonly kind: "refactorInstant" }
  | { readonly kind: "keepAutomation" };

export interface InsightNodeDefinition {
  readonly branch: InsightBranch;
  readonly costInsight: number;
  readonly effectKey: string;
  readonly effects: readonly InsightEffect[];
  readonly id: string;
  readonly nameKey: string;
  readonly requires?: string;
  readonly requiresAnyTierGte?: number;
  readonly tier: number;
}

export interface RewriteMilestoneDefinition {
  readonly count: number;
  readonly descriptionKey: string;
  readonly nameKey: string;
}

export type EquityEffect =
  | { readonly kind: "angelNetwork" }
  | { readonly kind: "compounding"; readonly exponentAdd: number }
  | { readonly kind: "generatorCostMultiplier"; readonly multiplier: number }
  | { readonly kind: "goldenGut" }
  | { readonly kind: "headStart" }
  | { readonly kind: "hypeFloorMultiplier"; readonly multiplier: number }
  | { readonly kind: "incidentPenaltyMultiplier"; readonly multiplier: number }
  | { readonly kind: "keepResearchOnExit" }
  | { readonly kind: "museMemory" }
  | { readonly kind: "rpGainMultiplier"; readonly multiplier: number }
  | { readonly kind: "runModifiers" }
  | { readonly kind: "serialFounder" }
  | { readonly kind: "startMoneyMultiplier"; readonly multiplier: number }
  | { readonly kind: "unlockAllAutomation" }
  | { readonly kind: "rewriteMinGainRatio"; readonly ratio: number };

export interface EquityPerkDefinition {
  readonly costEquity: number;
  readonly effectKey: string;
  readonly effects: readonly EquityEffect[];
  readonly id: string;
  readonly nameKey: string;
}

export interface RunModifierDefinition {
  readonly descriptionKey: string;
  readonly equityMultiplier: number;
  readonly id: RunModifierId;
  readonly nameKey: string;
}

export type ParadoxItemKind = "echo" | "paradoxEngine" | "ruleSlot" | "startInsight" | "theme";
export type ParadoxItemState = "available" | "bought" | "locked" | "unaffordable";
export type ParadoxThemeId = "crt" | "glitch" | "void";

export interface ParadoxItemDefinition {
  readonly costParadox: number;
  readonly echoEventId?: string;
  readonly effectKey: string;
  readonly id: string;
  readonly kind: ParadoxItemKind;
  readonly nameKey: string;
  readonly theme?: ParadoxThemeId;
}

export const INSIGHT_NODES: readonly InsightNodeDefinition[] = [
  {
    id: "i_v1",
    branch: "velocity",
    tier: 1,
    costInsight: 5,
    nameKey: "insight.i_v1.name",
    effectKey: "insight.i_v1.effect",
    effects: [{ kind: "startGenerator", generatorId: "g_autocomplete", count: 5 }]
  },
  {
    id: "i_v2",
    branch: "velocity",
    tier: 2,
    costInsight: 10,
    nameKey: "insight.i_v2.name",
    effectKey: "insight.i_v2.effect",
    requires: "i_v1",
    effects: [{ kind: "locMultiplier", multiplier: 1.25 }]
  },
  {
    id: "i_v3",
    branch: "velocity",
    tier: 3,
    costInsight: 20,
    nameKey: "insight.i_v3.name",
    effectKey: "insight.i_v3.effect",
    requires: "i_v2",
    effects: [{ kind: "generatorCostMultiplier", multiplier: 0.85 }]
  },
  {
    id: "i_v4",
    branch: "velocity",
    tier: 4,
    costInsight: 40,
    nameKey: "insight.i_v4.name",
    effectKey: "insight.i_v4.effect",
    requires: "i_v3",
    effects: [{ kind: "locMultiplier", multiplier: 1.5 }]
  },
  {
    id: "i_v5",
    branch: "velocity",
    tier: 5,
    costInsight: 80,
    nameKey: "insight.i_v5.name",
    effectKey: "insight.i_v5.effect",
    requires: "i_v4",
    effects: [{ kind: "startEra", era: 2 }]
  },
  {
    id: "i_v6",
    branch: "velocity",
    tier: 6,
    costInsight: 160,
    nameKey: "insight.i_v6.name",
    effectKey: "insight.i_v6.effect",
    requires: "i_v5",
    effects: [{ kind: "flowMultiplier", value: 7 }]
  },
  {
    id: "i_v7",
    branch: "velocity",
    tier: 7,
    costInsight: 320,
    nameKey: "insight.i_v7.name",
    effectKey: "insight.i_v7.effect",
    requires: "i_v6",
    effects: [{ kind: "startEra", era: 3 }]
  },
  {
    id: "i_v8",
    branch: "velocity",
    tier: 8,
    costInsight: 500,
    nameKey: "insight.i_v8.name",
    effectKey: "insight.i_v8.effect",
    requires: "i_v7",
    effects: [{ kind: "locMultiplier", multiplier: 2 }]
  },
  {
    id: "i_c1",
    branch: "capital",
    tier: 1,
    costInsight: 5,
    nameKey: "insight.i_c1.name",
    effectKey: "insight.i_c1.effect",
    effects: [{ kind: "startMoney", amount: "500" }]
  },
  {
    id: "i_c2",
    branch: "capital",
    tier: 2,
    costInsight: 10,
    nameKey: "insight.i_c2.name",
    effectKey: "insight.i_c2.effect",
    requires: "i_c1",
    effects: [{ kind: "payoutMultiplier", multiplier: 1.25 }]
  },
  {
    id: "i_c3",
    branch: "capital",
    tier: 3,
    costInsight: 20,
    nameKey: "insight.i_c3.name",
    effectKey: "insight.i_c3.effect",
    requires: "i_c2",
    effects: [{ kind: "hypeTauAdd", seconds: 60 }]
  },
  {
    id: "i_c4",
    branch: "capital",
    tier: 4,
    costInsight: 40,
    nameKey: "insight.i_c4.name",
    effectKey: "insight.i_c4.effect",
    requires: "i_c3",
    effects: [{ kind: "startMoneyRatio", fraction: 0.01 }]
  },
  {
    id: "i_c5",
    branch: "capital",
    tier: 5,
    costInsight: 80,
    nameKey: "insight.i_c5.name",
    effectKey: "insight.i_c5.effect",
    requires: "i_c4",
    effects: [{ kind: "revenueMultiplier", multiplier: 1.5 }]
  },
  {
    id: "i_c6",
    branch: "capital",
    tier: 6,
    costInsight: 160,
    nameKey: "insight.i_c6.name",
    effectKey: "insight.i_c6.effect",
    requires: "i_c5",
    effects: [{ kind: "projectBoardSlotsAdd", slots: 2 }]
  },
  {
    id: "i_c7",
    branch: "capital",
    tier: 7,
    costInsight: 320,
    nameKey: "insight.i_c7.name",
    effectKey: "insight.i_c7.effect",
    requires: "i_c6",
    effects: [{ kind: "goldenClientChance", chance: 0.05 }]
  },
  {
    id: "i_c8",
    branch: "capital",
    tier: 8,
    costInsight: 500,
    nameKey: "insight.i_c8.name",
    effectKey: "insight.i_c8.effect",
    requires: "i_c7",
    effects: [
      { kind: "payoutMultiplier", multiplier: 2 },
      { kind: "revenueMultiplier", multiplier: 2 }
    ]
  },
  {
    id: "i_k1",
    branch: "craft",
    tier: 1,
    costInsight: 5,
    nameKey: "insight.i_k1.name",
    effectKey: "insight.i_k1.effect",
    effects: [{ kind: "debtFactorMultiplier", multiplier: 0.8 }]
  },
  {
    id: "i_k2",
    branch: "craft",
    tier: 2,
    costInsight: 10,
    nameKey: "insight.i_k2.name",
    effectKey: "insight.i_k2.effect",
    requires: "i_k1",
    effects: [{ kind: "offlineCapHoursAdd", hours: 4 }]
  },
  {
    id: "i_k3",
    branch: "craft",
    tier: 3,
    costInsight: 20,
    nameKey: "insight.i_k3.name",
    effectKey: "insight.i_k3.effect",
    requires: "i_k2",
    effects: [{ kind: "qualityAdd", value: 0.05 }]
  },
  {
    id: "i_k4",
    branch: "craft",
    tier: 4,
    costInsight: 40,
    nameKey: "insight.i_k4.name",
    effectKey: "insight.i_k4.effect",
    requires: "i_k3",
    effects: [{ kind: "qaMultiplier", multiplier: 2 }]
  },
  {
    id: "i_k5",
    branch: "craft",
    tier: 5,
    costInsight: 80,
    nameKey: "insight.i_k5.name",
    effectKey: "insight.i_k5.effect",
    requires: "i_k4",
    effects: [{ kind: "bugPenalty", value: 0.6 }]
  },
  {
    id: "i_k6",
    branch: "craft",
    tier: 6,
    costInsight: 160,
    nameKey: "insight.i_k6.name",
    effectKey: "insight.i_k6.effect",
    requires: "i_k5",
    effects: [{ kind: "refactorInstant" }]
  },
  {
    id: "i_k7",
    branch: "craft",
    tier: 7,
    costInsight: 320,
    nameKey: "insight.i_k7.name",
    effectKey: "insight.i_k7.effect",
    requires: "i_k6",
    effects: [{ kind: "qualityAdd", value: 0.1 }]
  },
  {
    id: "i_k8",
    branch: "craft",
    tier: 8,
    costInsight: 500,
    nameKey: "insight.i_k8.name",
    effectKey: "insight.i_k8.effect",
    requires: "i_k7",
    effects: [{ kind: "debtFactorMultiplier", multiplier: 0.5 }]
  },
  {
    id: "i_core_automation",
    branch: "core",
    tier: 1,
    costInsight: 50,
    nameKey: "insight.i_core_automation.name",
    effectKey: "insight.i_core_automation.effect",
    requiresAnyTierGte: 3,
    effects: [{ kind: "keepAutomation" }]
  }
] as const;

export const FULL_REWRITE_INSIGHT_COUNT = INSIGHT_NODES.length;

export const REWRITE_MILESTONES: readonly RewriteMilestoneDefinition[] = [
  {
    count: 1,
    nameKey: "rewrite.milestone.r1.name",
    descriptionKey: "rewrite.milestone.r1.description"
  },
  {
    count: 3,
    nameKey: "rewrite.milestone.r3.name",
    descriptionKey: "rewrite.milestone.r3.description"
  },
  {
    count: 5,
    nameKey: "rewrite.milestone.r5.name",
    descriptionKey: "rewrite.milestone.r5.description"
  },
  {
    count: 8,
    nameKey: "rewrite.milestone.r8.name",
    descriptionKey: "rewrite.milestone.r8.description"
  },
  {
    count: 12,
    nameKey: "rewrite.milestone.r12.name",
    descriptionKey: "rewrite.milestone.r12.description"
  },
  {
    count: 15,
    nameKey: "rewrite.milestone.r15.name",
    descriptionKey: "rewrite.milestone.r15.description"
  },
  {
    count: 30,
    nameKey: "rewrite.milestone.r30.name",
    descriptionKey: "rewrite.milestone.r30.description"
  }
] as const;

export function getInsightNode(id: string): InsightNodeDefinition | undefined {
  return INSIGHT_NODES.find((node) => node.id === id);
}

export const EQUITY_PERKS: readonly EquityPerkDefinition[] = [
  {
    id: "q_founder_instinct",
    costEquity: 3,
    nameKey: "equity.q_founder_instinct.name",
    effectKey: "equity.q_founder_instinct.effect",
    effects: [{ kind: "keepResearchOnExit" }]
  },
  {
    id: "q_angel_network",
    costEquity: 2,
    nameKey: "equity.q_angel_network.name",
    effectKey: "equity.q_angel_network.effect",
    effects: [{ kind: "angelNetwork" }]
  },
  {
    id: "q_serial_founder",
    costEquity: 4,
    nameKey: "equity.q_serial_founder.name",
    effectKey: "equity.q_serial_founder.effect",
    effects: [{ kind: "serialFounder" }]
  },
  {
    id: "q_board_seat",
    costEquity: 5,
    nameKey: "equity.q_board_seat.name",
    effectKey: "equity.q_board_seat.effect",
    effects: [{ kind: "runModifiers" }]
  },
  {
    id: "q_war_chest",
    costEquity: 6,
    nameKey: "equity.q_war_chest.name",
    effectKey: "equity.q_war_chest.effect",
    effects: [{ kind: "startMoneyMultiplier", multiplier: 100 }]
  },
  {
    id: "q_talent_magnet",
    costEquity: 8,
    nameKey: "equity.q_talent_magnet.name",
    effectKey: "equity.q_talent_magnet.effect",
    effects: [{ kind: "generatorCostMultiplier", multiplier: 0.8 }]
  },
  {
    id: "q_legacy_brand",
    costEquity: 8,
    nameKey: "equity.q_legacy_brand.name",
    effectKey: "equity.q_legacy_brand.effect",
    effects: [{ kind: "hypeFloorMultiplier", multiplier: 2 }]
  },
  {
    id: "q_open_source_soul",
    costEquity: 10,
    nameKey: "equity.q_open_source_soul.name",
    effectKey: "equity.q_open_source_soul.effect",
    effects: [{ kind: "rpGainMultiplier", multiplier: 2 }]
  },
  {
    id: "q_compounding",
    costEquity: 12,
    nameKey: "equity.q_compounding.name",
    effectKey: "equity.q_compounding.effect",
    effects: [{ kind: "compounding", exponentAdd: 0.05 }]
  },
  {
    id: "q_head_start",
    costEquity: 15,
    nameKey: "equity.q_head_start.name",
    effectKey: "equity.q_head_start.effect",
    effects: [{ kind: "headStart" }]
  },
  {
    id: "q_iron_stomach",
    costEquity: 10,
    nameKey: "equity.q_iron_stomach.name",
    effectKey: "equity.q_iron_stomach.effect",
    effects: [{ kind: "incidentPenaltyMultiplier", multiplier: 0.5 }]
  },
  {
    id: "q_pivot_master",
    costEquity: 12,
    nameKey: "equity.q_pivot_master.name",
    effectKey: "equity.q_pivot_master.effect",
    effects: [{ kind: "rewriteMinGainRatio", ratio: 0.1 }]
  },
  {
    id: "q_automation_suite",
    costEquity: 18,
    nameKey: "equity.q_automation_suite.name",
    effectKey: "equity.q_automation_suite.effect",
    effects: [{ kind: "unlockAllAutomation" }]
  },
  {
    id: "q_muse_memory",
    costEquity: 20,
    nameKey: "equity.q_muse_memory.name",
    effectKey: "equity.q_muse_memory.effect",
    effects: [{ kind: "museMemory" }]
  },
  {
    id: "q_golden_gut",
    costEquity: 25,
    nameKey: "equity.q_golden_gut.name",
    effectKey: "equity.q_golden_gut.effect",
    effects: [{ kind: "goldenGut" }]
  }
] as const;

export const RUN_MODIFIERS: readonly RunModifierDefinition[] = [
  {
    id: "no_click",
    nameKey: "runModifier.no_click.name",
    descriptionKey: "runModifier.no_click.effect",
    equityMultiplier: 1.5
  },
  {
    id: "debt_storm",
    nameKey: "runModifier.debt_storm.name",
    descriptionKey: "runModifier.debt_storm.effect",
    equityMultiplier: 2
  },
  {
    id: "indie",
    nameKey: "runModifier.indie.name",
    descriptionKey: "runModifier.indie.effect",
    equityMultiplier: 3
  },
  {
    id: "blackout",
    nameKey: "runModifier.blackout.name",
    descriptionKey: "runModifier.blackout.effect",
    equityMultiplier: 1.5
  }
] as const;

export const PARADOX_ITEMS: readonly ParadoxItemDefinition[] = [
  {
    id: "x_rule_slot_1",
    kind: "ruleSlot",
    costParadox: 5,
    nameKey: "paradox.x_rule_slot_1.name",
    effectKey: "paradox.x_rule_slot_1.effect"
  },
  {
    id: "x_rule_slot_2",
    kind: "ruleSlot",
    costParadox: 25,
    nameKey: "paradox.x_rule_slot_2.name",
    effectKey: "paradox.x_rule_slot_2.effect"
  },
  {
    id: "x_rule_slot_3",
    kind: "ruleSlot",
    costParadox: 125,
    nameKey: "paradox.x_rule_slot_3.name",
    effectKey: "paradox.x_rule_slot_3.effect"
  },
  {
    id: "x_start_insight",
    kind: "startInsight",
    costParadox: 10,
    nameKey: "paradox.x_start_insight.name",
    effectKey: "paradox.x_start_insight.effect"
  },
  {
    id: "x_theme_crt",
    kind: "theme",
    theme: "crt",
    costParadox: 3,
    nameKey: "paradox.x_theme_crt.name",
    effectKey: "paradox.x_theme_crt.effect"
  },
  {
    id: "x_theme_glitch",
    kind: "theme",
    theme: "glitch",
    costParadox: 3,
    nameKey: "paradox.x_theme_glitch.name",
    effectKey: "paradox.x_theme_glitch.effect"
  },
  {
    id: "x_theme_void",
    kind: "theme",
    theme: "void",
    costParadox: 3,
    nameKey: "paradox.x_theme_void.name",
    effectKey: "paradox.x_theme_void.effect"
  },
  {
    id: "x_echo_01",
    kind: "echo",
    echoEventId: "x_echo_01",
    costParadox: 2,
    nameKey: "paradox.x_echo_01.name",
    effectKey: "paradox.x_echo_01.effect"
  },
  {
    id: "x_echo_02",
    kind: "echo",
    echoEventId: "x_echo_02",
    costParadox: 5,
    nameKey: "paradox.x_echo_02.name",
    effectKey: "paradox.x_echo_02.effect"
  },
  {
    id: "x_echo_03",
    kind: "echo",
    echoEventId: "x_echo_03",
    costParadox: 7,
    nameKey: "paradox.x_echo_03.name",
    effectKey: "paradox.x_echo_03.effect"
  },
  {
    id: "x_echo_04",
    kind: "echo",
    echoEventId: "x_echo_04",
    costParadox: 10,
    nameKey: "paradox.x_echo_04.name",
    effectKey: "paradox.x_echo_04.effect"
  },
  {
    id: "x_echo_05",
    kind: "echo",
    echoEventId: "x_echo_05",
    costParadox: 12,
    nameKey: "paradox.x_echo_05.name",
    effectKey: "paradox.x_echo_05.effect"
  },
  {
    id: "x_echo_06",
    kind: "echo",
    echoEventId: "x_echo_06",
    costParadox: 15,
    nameKey: "paradox.x_echo_06.name",
    effectKey: "paradox.x_echo_06.effect"
  },
  {
    id: "x_echo_07",
    kind: "echo",
    echoEventId: "x_echo_07",
    costParadox: 17,
    nameKey: "paradox.x_echo_07.name",
    effectKey: "paradox.x_echo_07.effect"
  },
  {
    id: "x_echo_08",
    kind: "echo",
    echoEventId: "x_echo_08",
    costParadox: 20,
    nameKey: "paradox.x_echo_08.name",
    effectKey: "paradox.x_echo_08.effect"
  },
  {
    id: "x_echo_09",
    kind: "echo",
    echoEventId: "x_echo_09",
    costParadox: 22,
    nameKey: "paradox.x_echo_09.name",
    effectKey: "paradox.x_echo_09.effect"
  },
  {
    id: "x_echo_10",
    kind: "echo",
    echoEventId: "x_echo_10",
    costParadox: 25,
    nameKey: "paradox.x_echo_10.name",
    effectKey: "paradox.x_echo_10.effect"
  },
  {
    id: "x_echo_11",
    kind: "echo",
    echoEventId: "x_echo_11",
    costParadox: 27,
    nameKey: "paradox.x_echo_11.name",
    effectKey: "paradox.x_echo_11.effect"
  },
  {
    id: "x_echo_12",
    kind: "echo",
    echoEventId: "x_echo_12",
    costParadox: 30,
    nameKey: "paradox.x_echo_12.name",
    effectKey: "paradox.x_echo_12.effect"
  },
  {
    id: "x_echo_13",
    kind: "echo",
    echoEventId: "x_echo_13",
    costParadox: 32,
    nameKey: "paradox.x_echo_13.name",
    effectKey: "paradox.x_echo_13.effect"
  },
  {
    id: "x_echo_14",
    kind: "echo",
    echoEventId: "x_echo_14",
    costParadox: 35,
    nameKey: "paradox.x_echo_14.name",
    effectKey: "paradox.x_echo_14.effect"
  },
  {
    id: "x_echo_15",
    kind: "echo",
    echoEventId: "x_echo_15",
    costParadox: 38,
    nameKey: "paradox.x_echo_15.name",
    effectKey: "paradox.x_echo_15.effect"
  },
  {
    id: "x_echo_16",
    kind: "echo",
    echoEventId: "x_echo_16",
    costParadox: 40,
    nameKey: "paradox.x_echo_16.name",
    effectKey: "paradox.x_echo_16.effect"
  },
  {
    id: "x_echo_17",
    kind: "echo",
    echoEventId: "x_echo_17",
    costParadox: 43,
    nameKey: "paradox.x_echo_17.name",
    effectKey: "paradox.x_echo_17.effect"
  },
  {
    id: "x_echo_18",
    kind: "echo",
    echoEventId: "x_echo_18",
    costParadox: 45,
    nameKey: "paradox.x_echo_18.name",
    effectKey: "paradox.x_echo_18.effect"
  },
  {
    id: "x_echo_19",
    kind: "echo",
    echoEventId: "x_echo_19",
    costParadox: 48,
    nameKey: "paradox.x_echo_19.name",
    effectKey: "paradox.x_echo_19.effect"
  },
  {
    id: "x_echo_20",
    kind: "echo",
    echoEventId: "x_echo_20",
    costParadox: 50,
    nameKey: "paradox.x_echo_20.name",
    effectKey: "paradox.x_echo_20.effect"
  },
  {
    id: "x_paradox_engine",
    kind: "paradoxEngine",
    costParadox: 200,
    nameKey: "paradox.x_paradox_engine.name",
    effectKey: "paradox.x_paradox_engine.effect"
  }
] as const;

export function getEquityPerk(id: string): EquityPerkDefinition | undefined {
  return EQUITY_PERKS.find((perk) => perk.id === id);
}

export function getRunModifier(id: string): RunModifierDefinition | undefined {
  return RUN_MODIFIERS.find((modifier) => modifier.id === id);
}

export function getParadoxItem(id: string): ParadoxItemDefinition | undefined {
  return PARADOX_ITEMS.find((item) => item.id === id);
}
