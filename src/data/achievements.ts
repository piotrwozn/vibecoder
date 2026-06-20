export const ACHIEVEMENT_LOC_BONUS = 0.01;

export type AchievementCategory =
  | "agents"
  | "bugs"
  | "endings"
  | "eras"
  | "exits"
  | "iterations"
  | "loc"
  | "money"
  | "research"
  | "rewrites"
  | "shipped"
  | "special";

export type AchievementCondition =
  | {
      readonly kind: "bigStatGte";
      readonly stat: "lifetime.loc" | "lifetime.money";
      readonly value: string;
    }
  | { readonly kind: "ending"; readonly choice: "fork" | "merge" | "unplug" }
  | { readonly kind: "eraGte"; readonly value: number }
  | { readonly kind: "exitsGte"; readonly value: number }
  | { readonly kind: "flowActiveFor"; readonly seconds: number }
  | { readonly kind: "generatorTotalGte"; readonly value: number }
  | { readonly kind: "hypeAtCap" }
  | { readonly kind: "iterationsGte"; readonly value: number }
  | { readonly kind: "researchAll" }
  | { readonly kind: "researchCountGte"; readonly value: number }
  | { readonly kind: "researchFullBranch" }
  | { readonly kind: "rewritesGte"; readonly value: number }
  | {
      readonly kind: "statGte";
      readonly stat: "bugs.fixed" | "projects.refactored" | "projects.shipped";
      readonly value: number;
    }
  | { readonly kind: "zeroDebtWithLifetimeLoc"; readonly value: string };

export interface AchievementDefinition {
  readonly category: AchievementCategory;
  readonly condition: AchievementCondition;
  readonly descriptionKey: string;
  readonly id: string;
  readonly nameKey: string;
}

export const ACHIEVEMENTS = [
  {
    id: "a_ship_1",
    category: "shipped",
    condition: { kind: "statGte", stat: "projects.shipped", value: 1 },
    nameKey: "achievement.a_ship_1.name",
    descriptionKey: "achievement.a_ship_1.description"
  },
  {
    id: "a_ship_10",
    category: "shipped",
    condition: { kind: "statGte", stat: "projects.shipped", value: 10 },
    nameKey: "achievement.a_ship_10.name",
    descriptionKey: "achievement.a_ship_10.description"
  },
  {
    id: "a_ship_100",
    category: "shipped",
    condition: { kind: "statGte", stat: "projects.shipped", value: 100 },
    nameKey: "achievement.a_ship_100.name",
    descriptionKey: "achievement.a_ship_100.description"
  },
  {
    id: "a_ship_1e3",
    category: "shipped",
    condition: { kind: "statGte", stat: "projects.shipped", value: 1e3 },
    nameKey: "achievement.a_ship_1e3.name",
    descriptionKey: "achievement.a_ship_1e3.description"
  },
  {
    id: "a_ship_1e4",
    category: "shipped",
    condition: { kind: "statGte", stat: "projects.shipped", value: 1e4 },
    nameKey: "achievement.a_ship_1e4.name",
    descriptionKey: "achievement.a_ship_1e4.description"
  },
  {
    id: "a_loc_1e6",
    category: "loc",
    condition: { kind: "bigStatGte", stat: "lifetime.loc", value: "1e6" },
    nameKey: "achievement.a_loc_1e6.name",
    descriptionKey: "achievement.a_loc_1e6.description"
  },
  {
    id: "a_loc_1e9",
    category: "loc",
    condition: { kind: "bigStatGte", stat: "lifetime.loc", value: "1e9" },
    nameKey: "achievement.a_loc_1e9.name",
    descriptionKey: "achievement.a_loc_1e9.description"
  },
  {
    id: "a_loc_1e12",
    category: "loc",
    condition: { kind: "bigStatGte", stat: "lifetime.loc", value: "1e12" },
    nameKey: "achievement.a_loc_1e12.name",
    descriptionKey: "achievement.a_loc_1e12.description"
  },
  {
    id: "a_loc_1e15",
    category: "loc",
    condition: { kind: "bigStatGte", stat: "lifetime.loc", value: "1e15" },
    nameKey: "achievement.a_loc_1e15.name",
    descriptionKey: "achievement.a_loc_1e15.description"
  },
  {
    id: "a_loc_1e20",
    category: "loc",
    condition: { kind: "bigStatGte", stat: "lifetime.loc", value: "1e20" },
    nameKey: "achievement.a_loc_1e20.name",
    descriptionKey: "achievement.a_loc_1e20.description"
  },
  {
    id: "a_loc_1e25",
    category: "loc",
    condition: { kind: "bigStatGte", stat: "lifetime.loc", value: "1e25" },
    nameKey: "achievement.a_loc_1e25.name",
    descriptionKey: "achievement.a_loc_1e25.description"
  },
  {
    id: "a_loc_1e30",
    category: "loc",
    condition: { kind: "bigStatGte", stat: "lifetime.loc", value: "1e30" },
    nameKey: "achievement.a_loc_1e30.name",
    descriptionKey: "achievement.a_loc_1e30.description"
  },
  {
    id: "a_loc_1e35",
    category: "loc",
    condition: { kind: "bigStatGte", stat: "lifetime.loc", value: "1e35" },
    nameKey: "achievement.a_loc_1e35.name",
    descriptionKey: "achievement.a_loc_1e35.description"
  },
  {
    id: "a_money_1e6",
    category: "money",
    condition: { kind: "bigStatGte", stat: "lifetime.money", value: "1e6" },
    nameKey: "achievement.a_money_1e6.name",
    descriptionKey: "achievement.a_money_1e6.description"
  },
  {
    id: "a_money_1e9",
    category: "money",
    condition: { kind: "bigStatGte", stat: "lifetime.money", value: "1e9" },
    nameKey: "achievement.a_money_1e9.name",
    descriptionKey: "achievement.a_money_1e9.description"
  },
  {
    id: "a_money_1e12",
    category: "money",
    condition: { kind: "bigStatGte", stat: "lifetime.money", value: "1e12" },
    nameKey: "achievement.a_money_1e12.name",
    descriptionKey: "achievement.a_money_1e12.description"
  },
  {
    id: "a_money_1e18",
    category: "money",
    condition: { kind: "bigStatGte", stat: "lifetime.money", value: "1e18" },
    nameKey: "achievement.a_money_1e18.name",
    descriptionKey: "achievement.a_money_1e18.description"
  },
  {
    id: "a_money_1e24",
    category: "money",
    condition: { kind: "bigStatGte", stat: "lifetime.money", value: "1e24" },
    nameKey: "achievement.a_money_1e24.name",
    descriptionKey: "achievement.a_money_1e24.description"
  },
  {
    id: "a_money_1e30",
    category: "money",
    condition: { kind: "bigStatGte", stat: "lifetime.money", value: "1e30" },
    nameKey: "achievement.a_money_1e30.name",
    descriptionKey: "achievement.a_money_1e30.description"
  },
  {
    id: "a_agents_50",
    category: "agents",
    condition: { kind: "generatorTotalGte", value: 50 },
    nameKey: "achievement.a_agents_50.name",
    descriptionKey: "achievement.a_agents_50.description"
  },
  {
    id: "a_agents_250",
    category: "agents",
    condition: { kind: "generatorTotalGte", value: 250 },
    nameKey: "achievement.a_agents_250.name",
    descriptionKey: "achievement.a_agents_250.description"
  },
  {
    id: "a_agents_1e3",
    category: "agents",
    condition: { kind: "generatorTotalGte", value: 1e3 },
    nameKey: "achievement.a_agents_1e3.name",
    descriptionKey: "achievement.a_agents_1e3.description"
  },
  {
    id: "a_agents_5e3",
    category: "agents",
    condition: { kind: "generatorTotalGte", value: 5e3 },
    nameKey: "achievement.a_agents_5e3.name",
    descriptionKey: "achievement.a_agents_5e3.description"
  },
  {
    id: "a_rewrite_1",
    category: "rewrites",
    condition: { kind: "rewritesGte", value: 1 },
    nameKey: "achievement.a_rewrite_1.name",
    descriptionKey: "achievement.a_rewrite_1.description"
  },
  {
    id: "a_rewrite_5",
    category: "rewrites",
    condition: { kind: "rewritesGte", value: 5 },
    nameKey: "achievement.a_rewrite_5.name",
    descriptionKey: "achievement.a_rewrite_5.description"
  },
  {
    id: "a_rewrite_15",
    category: "rewrites",
    condition: { kind: "rewritesGte", value: 15 },
    nameKey: "achievement.a_rewrite_15.name",
    descriptionKey: "achievement.a_rewrite_15.description"
  },
  {
    id: "a_rewrite_30",
    category: "rewrites",
    condition: { kind: "rewritesGte", value: 30 },
    nameKey: "achievement.a_rewrite_30.name",
    descriptionKey: "achievement.a_rewrite_30.description"
  },
  {
    id: "a_exit_1",
    category: "exits",
    condition: { kind: "exitsGte", value: 1 },
    nameKey: "achievement.a_exit_1.name",
    descriptionKey: "achievement.a_exit_1.description"
  },
  {
    id: "a_exit_3",
    category: "exits",
    condition: { kind: "exitsGte", value: 3 },
    nameKey: "achievement.a_exit_3.name",
    descriptionKey: "achievement.a_exit_3.description"
  },
  {
    id: "a_exit_5",
    category: "exits",
    condition: { kind: "exitsGte", value: 5 },
    nameKey: "achievement.a_exit_5.name",
    descriptionKey: "achievement.a_exit_5.description"
  },
  {
    id: "a_iteration_1",
    category: "iterations",
    condition: { kind: "iterationsGte", value: 1 },
    nameKey: "achievement.a_iteration_1.name",
    descriptionKey: "achievement.a_iteration_1.description"
  },
  {
    id: "a_iteration_5",
    category: "iterations",
    condition: { kind: "iterationsGte", value: 5 },
    nameKey: "achievement.a_iteration_5.name",
    descriptionKey: "achievement.a_iteration_5.description"
  },
  {
    id: "a_iteration_10",
    category: "iterations",
    condition: { kind: "iterationsGte", value: 10 },
    nameKey: "achievement.a_iteration_10.name",
    descriptionKey: "achievement.a_iteration_10.description"
  },
  {
    id: "a_era_3",
    category: "eras",
    condition: { kind: "eraGte", value: 3 },
    nameKey: "achievement.a_era_3.name",
    descriptionKey: "achievement.a_era_3.description"
  },
  {
    id: "a_era_5",
    category: "eras",
    condition: { kind: "eraGte", value: 5 },
    nameKey: "achievement.a_era_5.name",
    descriptionKey: "achievement.a_era_5.description"
  },
  {
    id: "a_era_7",
    category: "eras",
    condition: { kind: "eraGte", value: 7 },
    nameKey: "achievement.a_era_7.name",
    descriptionKey: "achievement.a_era_7.description"
  },
  {
    id: "a_era_10",
    category: "eras",
    condition: { kind: "eraGte", value: 10 },
    nameKey: "achievement.a_era_10.name",
    descriptionKey: "achievement.a_era_10.description"
  },
  {
    id: "a_research_10",
    category: "research",
    condition: { kind: "researchCountGte", value: 10 },
    nameKey: "achievement.a_research_10.name",
    descriptionKey: "achievement.a_research_10.description"
  },
  {
    id: "a_research_branch",
    category: "research",
    condition: { kind: "researchFullBranch" },
    nameKey: "achievement.a_research_branch.name",
    descriptionKey: "achievement.a_research_branch.description"
  },
  {
    id: "a_research_all",
    category: "research",
    condition: { kind: "researchAll" },
    nameKey: "achievement.a_research_all.name",
    descriptionKey: "achievement.a_research_all.description"
  },
  {
    id: "a_bugs_10",
    category: "bugs",
    condition: { kind: "statGte", stat: "bugs.fixed", value: 10 },
    nameKey: "achievement.a_bugs_10.name",
    descriptionKey: "achievement.a_bugs_10.description"
  },
  {
    id: "a_bugs_100",
    category: "bugs",
    condition: { kind: "statGte", stat: "bugs.fixed", value: 100 },
    nameKey: "achievement.a_bugs_100.name",
    descriptionKey: "achievement.a_bugs_100.description"
  },
  {
    id: "a_bugs_1e3",
    category: "bugs",
    condition: { kind: "statGte", stat: "bugs.fixed", value: 1e3 },
    nameKey: "achievement.a_bugs_1e3.name",
    descriptionKey: "achievement.a_bugs_1e3.description"
  },
  {
    id: "a_flow_10m",
    category: "special",
    condition: { kind: "flowActiveFor", seconds: 600 },
    nameKey: "achievement.a_flow_10m.name",
    descriptionKey: "achievement.a_flow_10m.description"
  },
  {
    id: "a_zero_debt",
    category: "special",
    condition: { kind: "zeroDebtWithLifetimeLoc", value: "1e9" },
    nameKey: "achievement.a_zero_debt.name",
    descriptionKey: "achievement.a_zero_debt.description"
  },
  {
    id: "a_refactor_50",
    category: "special",
    condition: { kind: "statGte", stat: "projects.refactored", value: 50 },
    nameKey: "achievement.a_refactor_50.name",
    descriptionKey: "achievement.a_refactor_50.description"
  },
  {
    id: "a_hype_cap",
    category: "special",
    condition: { kind: "hypeAtCap" },
    nameKey: "achievement.a_hype_cap.name",
    descriptionKey: "achievement.a_hype_cap.description"
  },
  {
    id: "a_ending_merge",
    category: "endings",
    condition: { kind: "ending", choice: "merge" },
    nameKey: "achievement.a_ending_merge.name",
    descriptionKey: "achievement.a_ending_merge.description"
  },
  {
    id: "a_ending_unplug",
    category: "endings",
    condition: { kind: "ending", choice: "unplug" },
    nameKey: "achievement.a_ending_unplug.name",
    descriptionKey: "achievement.a_ending_unplug.description"
  },
  {
    id: "a_ending_fork",
    category: "endings",
    condition: { kind: "ending", choice: "fork" },
    nameKey: "achievement.a_ending_fork.name",
    descriptionKey: "achievement.a_ending_fork.description"
  }
] satisfies readonly AchievementDefinition[];
