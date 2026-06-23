export type ResearchBranch = "automation" | "quality" | "throughput";
export type AutomationUnlock =
  | "autoBuy"
  | "autoBuyHardware"
  | "autoFix"
  | "autoPrompt"
  | "autoRefactor"
  | "autoRefreshProjects"
  | "autoShip";

export type ResearchEffect =
  | { readonly kind: "autoFixDelay"; readonly seconds: number }
  | { readonly kind: "autoPromptRate"; readonly fraction: number }
  | { readonly kind: "bugChanceMultiplier"; readonly multiplier: number }
  | { readonly kind: "bugPenalty"; readonly value: number }
  | { readonly kind: "buildTimeMultiplier"; readonly multiplier: number }
  | { readonly kind: "clickSynergy"; readonly value: number }
  | { readonly kind: "debtFactorMultiplier"; readonly multiplier: number }
  | { readonly kind: "flowDuration"; readonly seconds: number }
  | { readonly kind: "locMultiplier"; readonly multiplier: number }
  | { readonly kind: "offlineCapHours"; readonly hours: number }
  | { readonly kind: "olderEraGeneratorMultiplier"; readonly multiplier: number }
  | { readonly kind: "projectBoardSlots"; readonly slots: number }
  | { readonly kind: "qualityAdd"; readonly value: number }
  | { readonly kind: "qaMultiplier"; readonly multiplier: number }
  | { readonly kind: "refactorDebtMultiplier"; readonly multiplier: number }
  | { readonly kind: "unlockAutomation"; readonly automation: AutomationUnlock };

export interface ResearchDefinition {
  readonly branch: ResearchBranch;
  readonly costRp: number;
  readonly effectKey: string;
  readonly effects: readonly ResearchEffect[];
  readonly id: string;
  readonly nameKey: string;
  readonly requires?: string;
  readonly tier: number;
}

const RESEARCH_COSTS = [2, 3, 5, 8, 12, 18, 25, 35, 50, 70] as const;

export const RESEARCH: readonly ResearchDefinition[] = [
  {
    id: "r_t1",
    branch: "throughput",
    tier: 1,
    costRp: RESEARCH_COSTS[0],
    nameKey: "research.r_t1.name",
    effectKey: "research.r_t1.effect",
    effects: [{ kind: "locMultiplier", multiplier: 1.25 }]
  },
  {
    id: "r_t2",
    branch: "throughput",
    tier: 2,
    costRp: RESEARCH_COSTS[1],
    nameKey: "research.r_t2.name",
    effectKey: "research.r_t2.effect",
    requires: "r_t1",
    effects: [{ kind: "clickSynergy", value: 0.04 }]
  },
  {
    id: "r_t3",
    branch: "throughput",
    tier: 3,
    costRp: RESEARCH_COSTS[2],
    nameKey: "research.r_t3.name",
    effectKey: "research.r_t3.effect",
    requires: "r_t2",
    effects: [{ kind: "locMultiplier", multiplier: 1.5 }]
  },
  {
    id: "r_t4",
    branch: "throughput",
    tier: 4,
    costRp: RESEARCH_COSTS[3],
    nameKey: "research.r_t4.name",
    effectKey: "research.r_t4.effect",
    requires: "r_t3",
    effects: [{ kind: "olderEraGeneratorMultiplier", multiplier: 2 }]
  },
  {
    id: "r_t5",
    branch: "throughput",
    tier: 5,
    costRp: RESEARCH_COSTS[4],
    nameKey: "research.r_t5.name",
    effectKey: "research.r_t5.effect",
    requires: "r_t4",
    effects: [{ kind: "locMultiplier", multiplier: 1.75 }]
  },
  {
    id: "r_t6",
    branch: "throughput",
    tier: 6,
    costRp: RESEARCH_COSTS[5],
    nameKey: "research.r_t6.name",
    effectKey: "research.r_t6.effect",
    requires: "r_t5",
    effects: [{ kind: "flowDuration", seconds: 45 }]
  },
  {
    id: "r_t7",
    branch: "throughput",
    tier: 7,
    costRp: RESEARCH_COSTS[6],
    nameKey: "research.r_t7.name",
    effectKey: "research.r_t7.effect",
    requires: "r_t6",
    effects: [{ kind: "locMultiplier", multiplier: 2 }]
  },
  {
    id: "r_t8",
    branch: "throughput",
    tier: 8,
    costRp: RESEARCH_COSTS[7],
    nameKey: "research.r_t8.name",
    effectKey: "research.r_t8.effect",
    requires: "r_t7",
    effects: [{ kind: "clickSynergy", value: 0.1 }]
  },
  {
    id: "r_t9",
    branch: "throughput",
    tier: 9,
    costRp: RESEARCH_COSTS[8],
    nameKey: "research.r_t9.name",
    effectKey: "research.r_t9.effect",
    requires: "r_t8",
    effects: [{ kind: "locMultiplier", multiplier: 2.5 }]
  },
  {
    id: "r_t10",
    branch: "throughput",
    tier: 10,
    costRp: RESEARCH_COSTS[9],
    nameKey: "research.r_t10.name",
    effectKey: "research.r_t10.effect",
    requires: "r_t9",
    effects: [{ kind: "locMultiplier", multiplier: 3 }]
  },
  {
    id: "r_q1",
    branch: "quality",
    tier: 1,
    costRp: RESEARCH_COSTS[0],
    nameKey: "research.r_q1.name",
    effectKey: "research.r_q1.effect",
    effects: [{ kind: "qualityAdd", value: 0.1 }]
  },
  {
    id: "r_q2",
    branch: "quality",
    tier: 2,
    costRp: RESEARCH_COSTS[1],
    nameKey: "research.r_q2.name",
    effectKey: "research.r_q2.effect",
    requires: "r_q1",
    effects: [{ kind: "debtFactorMultiplier", multiplier: 0.85 }]
  },
  {
    id: "r_q3",
    branch: "quality",
    tier: 3,
    costRp: RESEARCH_COSTS[2],
    nameKey: "research.r_q3.name",
    effectKey: "research.r_q3.effect",
    requires: "r_q2",
    effects: [{ kind: "bugChanceMultiplier", multiplier: 0.8 }]
  },
  {
    id: "r_q4",
    branch: "quality",
    tier: 4,
    costRp: RESEARCH_COSTS[3],
    nameKey: "research.r_q4.name",
    effectKey: "research.r_q4.effect",
    requires: "r_q3",
    effects: [{ kind: "qualityAdd", value: 0.15 }]
  },
  {
    id: "r_q5",
    branch: "quality",
    tier: 5,
    costRp: RESEARCH_COSTS[4],
    nameKey: "research.r_q5.name",
    effectKey: "research.r_q5.effect",
    requires: "r_q4",
    effects: [{ kind: "refactorDebtMultiplier", multiplier: 0.3 }]
  },
  {
    id: "r_q6",
    branch: "quality",
    tier: 6,
    costRp: RESEARCH_COSTS[5],
    nameKey: "research.r_q6.name",
    effectKey: "research.r_q6.effect",
    requires: "r_q5",
    effects: [{ kind: "qaMultiplier", multiplier: 2 }]
  },
  {
    id: "r_q7",
    branch: "quality",
    tier: 7,
    costRp: RESEARCH_COSTS[6],
    nameKey: "research.r_q7.name",
    effectKey: "research.r_q7.effect",
    requires: "r_q6",
    effects: [{ kind: "qualityAdd", value: 0.15 }]
  },
  {
    id: "r_q8",
    branch: "quality",
    tier: 8,
    costRp: RESEARCH_COSTS[7],
    nameKey: "research.r_q8.name",
    effectKey: "research.r_q8.effect",
    requires: "r_q7",
    effects: [{ kind: "bugPenalty", value: 0.55 }]
  },
  {
    id: "r_q9",
    branch: "quality",
    tier: 9,
    costRp: RESEARCH_COSTS[8],
    nameKey: "research.r_q9.name",
    effectKey: "research.r_q9.effect",
    requires: "r_q8",
    effects: [{ kind: "debtFactorMultiplier", multiplier: 0.75 }]
  },
  {
    id: "r_q10",
    branch: "quality",
    tier: 10,
    costRp: RESEARCH_COSTS[9],
    nameKey: "research.r_q10.name",
    effectKey: "research.r_q10.effect",
    requires: "r_q9",
    effects: [{ kind: "qualityAdd", value: 0.2 }]
  },
  {
    id: "r_a1",
    branch: "automation",
    tier: 1,
    costRp: RESEARCH_COSTS[0],
    nameKey: "research.r_a1.name",
    effectKey: "research.r_a1.effect",
    effects: [
      { kind: "unlockAutomation", automation: "autoPrompt" },
      { kind: "autoPromptRate", fraction: 0.02 }
    ]
  },
  {
    id: "r_a2",
    branch: "automation",
    tier: 2,
    costRp: RESEARCH_COSTS[1],
    nameKey: "research.r_a2.name",
    effectKey: "research.r_a2.effect",
    requires: "r_a1",
    effects: [{ kind: "unlockAutomation", automation: "autoBuy" }]
  },
  {
    id: "r_a3",
    branch: "automation",
    tier: 3,
    costRp: RESEARCH_COSTS[2],
    nameKey: "research.r_a3.name",
    effectKey: "research.r_a3.effect",
    requires: "r_a2",
    effects: [
      { kind: "unlockAutomation", automation: "autoFix" },
      { kind: "autoFixDelay", seconds: 30 }
    ]
  },
  {
    id: "r_a4",
    branch: "automation",
    tier: 4,
    costRp: RESEARCH_COSTS[3],
    nameKey: "research.r_a4.name",
    effectKey: "research.r_a4.effect",
    requires: "r_a3",
    effects: [{ kind: "projectBoardSlots", slots: 5 }]
  },
  {
    id: "r_a5",
    branch: "automation",
    tier: 5,
    costRp: RESEARCH_COSTS[4],
    nameKey: "research.r_a5.name",
    effectKey: "research.r_a5.effect",
    requires: "r_a4",
    effects: [{ kind: "unlockAutomation", automation: "autoRefreshProjects" }]
  },
  {
    id: "r_a6",
    branch: "automation",
    tier: 6,
    costRp: RESEARCH_COSTS[5],
    nameKey: "research.r_a6.name",
    effectKey: "research.r_a6.effect",
    requires: "r_a5",
    effects: [{ kind: "unlockAutomation", automation: "autoShip" }]
  },
  {
    id: "r_a7",
    branch: "automation",
    tier: 7,
    costRp: RESEARCH_COSTS[6],
    nameKey: "research.r_a7.name",
    effectKey: "research.r_a7.effect",
    requires: "r_a6",
    effects: [{ kind: "buildTimeMultiplier", multiplier: 0.7 }]
  },
  {
    id: "r_a8",
    branch: "automation",
    tier: 8,
    costRp: RESEARCH_COSTS[7],
    nameKey: "research.r_a8.name",
    effectKey: "research.r_a8.effect",
    requires: "r_a7",
    effects: [{ kind: "offlineCapHours", hours: 12 }]
  },
  {
    id: "r_a9",
    branch: "automation",
    tier: 9,
    costRp: RESEARCH_COSTS[8],
    nameKey: "research.r_a9.name",
    effectKey: "research.r_a9.effect",
    requires: "r_a8",
    effects: [{ kind: "unlockAutomation", automation: "autoRefactor" }]
  },
  {
    id: "r_a10",
    branch: "automation",
    tier: 10,
    costRp: RESEARCH_COSTS[9],
    nameKey: "research.r_a10.name",
    effectKey: "research.r_a10.effect",
    requires: "r_a9",
    effects: [
      { kind: "offlineCapHours", hours: 24 },
      { kind: "unlockAutomation", automation: "autoBuyHardware" }
    ]
  }
] as const;

export function getResearch(id: string): ResearchDefinition | undefined {
  return RESEARCH.find((research) => research.id === id);
}
