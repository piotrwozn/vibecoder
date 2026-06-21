import type { StoryEvent } from "./types";
import { C } from "../constants";

const AGENT_BANK_THRESHOLD = C.MILESTONES[3];
const ACT2_ENTERPRISE_SHIP_THRESHOLD = 350;

export const ACT2_EVENTS: readonly StoryEvent[] = [
  {
    id: "a2_01_seed",
    act: 2,
    demoLocked: true,
    trigger: { all: [{ exitsGte: 0 }, { flag: "accepted_term_sheet" }] },
    channel: "mail",
    speaker: "vera",
    textKey: "story.a2_01_seed",
    effects: [{ kind: "grantResource", resource: "money", amount: "2e6" }]
  },
  {
    id: "a2_02_agent_bank",
    act: 2,
    demoLocked: true,
    trigger: {
      all: [
        { generatorTotalGte: AGENT_BANK_THRESHOLD },
        { shipCountGte: ACT2_ENTERPRISE_SHIP_THRESHOLD }
      ]
    },
    channel: "system",
    speaker: "muse",
    textKey: "story.a2_02_agent_bank"
  },
  {
    id: "a2_03_golem_launch",
    act: 2,
    demoLocked: true,
    trigger: { era: 3 },
    channel: "mail",
    speaker: "mindforge",
    textKey: "story.a2_03_golem_launch"
  },
  {
    id: "a2_04_tensor_clone",
    act: 2,
    demoLocked: true,
    trigger: { shipCountGte: ACT2_ENTERPRISE_SHIP_THRESHOLD },
    channel: "feed",
    speaker: "chirper",
    textKey: "story.a2_04_tensor_clone",
    effects: [{ kind: "hypeAdd", amount: 1 }]
  },
  {
    id: "a2_05_debt_smell",
    act: 2,
    demoLocked: true,
    trigger: { debtRatioGte: 0.6 },
    channel: "chat",
    speaker: "anders",
    textKey: "story.a2_05_debt_smell",
    effects: [{ kind: "unlock", id: "research.quality.t2" }]
  },
  {
    id: "a2_06_demo_day_incident",
    act: 2,
    demoLocked: true,
    trigger: { seen: "a2_05_debt_smell" },
    channel: "system",
    speaker: "muse",
    textKey: "story.a2_06_demo_day_incident",
    choices: [
      {
        id: "rollback",
        textKey: "story.a2_06_demo_day_incident.choice.rollback",
        effects: [{ kind: "setFlag", flag: "incident.rollback_demo_day" }]
      },
      {
        id: "hotfix",
        textKey: "story.a2_06_demo_day_incident.choice.hotfix",
        effects: [
          { kind: "setFlag", flag: "incident.hotfix_demo_day" },
          { kind: "hypeAdd", amount: 2 }
        ]
      }
    ]
  },
  {
    id: "a2_07_enterprise_client",
    act: 2,
    demoLocked: true,
    trigger: { seen: "a2_06_demo_day_incident" },
    channel: "mail",
    speaker: "client",
    textKey: "story.a2_07_enterprise_client"
  },
  {
    id: "a2_08_zora_brand",
    act: 2,
    demoLocked: true,
    trigger: { seen: "a2_07_enterprise_client" },
    channel: "chat",
    speaker: "zora",
    textKey: "story.a2_08_zora_brand"
  },
  {
    id: "a2_09_metrics_talk",
    act: 2,
    demoLocked: true,
    trigger: { seen: "a2_08_zora_brand" },
    channel: "chat",
    speaker: "vera",
    textKey: "story.a2_09_metrics_talk"
  },
  {
    id: "a2_10_second_rewrite",
    act: 2,
    demoLocked: true,
    trigger: { rewritesGte: 2 },
    channel: "system",
    speaker: "muse",
    textKey: "story.a2_10_second_rewrite"
  },
  {
    id: "a2_11_procurement",
    act: 2,
    demoLocked: true,
    trigger: { seen: "a2_10_second_rewrite" },
    channel: "mail",
    speaker: "client",
    textKey: "story.a2_11_procurement"
  },
  {
    id: "a2_12_dashboard_sprawl",
    act: 2,
    demoLocked: true,
    trigger: { seen: "a2_11_procurement" },
    channel: "feed",
    speaker: "chirper",
    textKey: "story.a2_12_dashboard_sprawl"
  },
  {
    id: "a2_13_board_preseed",
    act: 2,
    demoLocked: true,
    trigger: { seen: "a2_12_dashboard_sprawl" },
    channel: "chat",
    speaker: "vera",
    textKey: "story.a2_13_board_preseed"
  },
  {
    id: "a2_14_series_a",
    act: 2,
    demoLocked: true,
    trigger: {
      all: [{ seen: "a2_04_tensor_clone" }, { seen: "a2_13_board_preseed" }, { moneyGte: "1e9" }]
    },
    channel: "mail",
    speaker: "vera",
    textKey: "story.a2_14_series_a",
    effects: [{ kind: "setAct", act: 3 }]
  }
] as const;
