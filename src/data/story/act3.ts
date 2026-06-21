import type { StoryEvent } from "./types";
import { PRESTIGE } from "../constants";

const FIRST_EXIT_OFFER_INSIGHT = PRESTIGE.EXIT_MIN_INSIGHT;

export const ACT3_EVENTS: readonly StoryEvent[] = [
  {
    id: "a3_01_oracle_launch",
    act: 3,
    demoLocked: true,
    trigger: { era: 5 },
    channel: "mail",
    speaker: "mindforge",
    textKey: "story.a3_01_oracle_launch"
  },
  {
    id: "a3_02_takeover_offer",
    act: 3,
    demoLocked: true,
    trigger: { insightSinceExitGte: FIRST_EXIT_OFFER_INSIGHT },
    channel: "mail",
    speaker: "tensorcorp",
    textKey: "story.a3_02_takeover_offer",
    choices: [
      {
        id: "sell",
        textKey: "story.a3_02_takeover_offer.choice.sell",
        effects: [
          { kind: "setFlag", flag: "exit_unlocked" },
          { kind: "unlock", id: "exit" }
        ]
      },
      {
        id: "reject",
        textKey: "story.a3_02_takeover_offer.choice.reject",
        effects: [
          { kind: "setFlag", flag: "exit_unlocked" },
          { kind: "hypeAdd", amount: 2 },
          { kind: "snoozeEvent", seconds: 30 * 60 },
          { kind: "unlock", id: "exit" }
        ]
      }
    ]
  },
  {
    id: "a3_03_first_exit",
    act: 3,
    demoLocked: true,
    trigger: { exitsGte: 1 },
    channel: "chat",
    speaker: "zora",
    textKey: "story.a3_03_first_exit"
  },
  {
    id: "a3_04_three_functions",
    act: 3,
    demoLocked: true,
    trigger: { locLifetimeGte: "1e15" },
    channel: "system",
    speaker: "muse",
    textKey: "story.a3_04_three_functions"
  },
  {
    id: "a3_05_anders_leaves",
    act: 3,
    demoLocked: true,
    trigger: { seen: "a3_04_three_functions" },
    channel: "chat",
    speaker: "anders",
    textKey: "story.a3_05_anders_leaves",
    effects: [{ kind: "setFlag", flag: "anders_left" }]
  },
  {
    id: "a3_06_human_review_act",
    act: 3,
    demoLocked: true,
    trigger: { timeInActMinGte: 120 },
    channel: "news",
    speaker: "news",
    textKey: "story.a3_06_human_review_act"
  },
  {
    id: "a3_07_root_timestamps",
    act: 3,
    demoLocked: true,
    trigger: { rewritesGte: 5 },
    channel: "system",
    speaker: "root",
    textKey: "story.a3_07_root_timestamps",
    effects: [{ kind: "setFlag", flag: "lore.timestamps" }]
  },
  {
    id: "a3_08_enterprise_absurdity",
    act: 3,
    demoLocked: true,
    trigger: { seen: "a3_07_root_timestamps" },
    channel: "mail",
    speaker: "client",
    textKey: "story.a3_08_enterprise_absurdity"
  },
  {
    id: "a3_09_incident_two",
    act: 3,
    demoLocked: true,
    trigger: { seen: "a3_08_enterprise_absurdity" },
    channel: "system",
    speaker: "muse",
    textKey: "story.a3_09_incident_two",
    choices: [
      {
        id: "isolate",
        textKey: "story.a3_09_incident_two.choice.isolate",
        effects: [{ kind: "setFlag", flag: "incident.isolated_region" }]
      },
      {
        id: "reroute",
        textKey: "story.a3_09_incident_two.choice.reroute",
        effects: [
          { kind: "setFlag", flag: "incident.rerouted_region" },
          { kind: "hypeAdd", amount: 1 }
        ]
      }
    ]
  },
  {
    id: "a3_10_ipo_whisper",
    act: 3,
    demoLocked: true,
    trigger: { seen: "a3_09_incident_two" },
    channel: "chat",
    speaker: "vera",
    textKey: "story.a3_10_ipo_whisper"
  },
  {
    id: "a3_11_juniors_vanish",
    act: 3,
    demoLocked: true,
    trigger: { seen: "a3_10_ipo_whisper" },
    channel: "feed",
    speaker: "chirper",
    textKey: "story.a3_11_juniors_vanish"
  },
  {
    id: "a3_12_enterprise_sso",
    act: 3,
    demoLocked: true,
    trigger: { seen: "a3_11_juniors_vanish" },
    channel: "mail",
    speaker: "client",
    textKey: "story.a3_12_enterprise_sso"
  },
  {
    id: "a3_13_vera_ipo",
    act: 3,
    demoLocked: true,
    trigger: { seen: "a3_12_enterprise_sso" },
    channel: "chat",
    speaker: "vera",
    textKey: "story.a3_13_vera_ipo"
  },
  {
    id: "a3_14_bot_feed",
    act: 3,
    demoLocked: true,
    trigger: { seen: "a3_13_vera_ipo" },
    channel: "feed",
    speaker: "chirper",
    textKey: "story.a3_14_bot_feed"
  },
  {
    id: "a3_15_omen_question",
    act: 3,
    demoLocked: true,
    trigger: { seen: "a3_14_bot_feed" },
    channel: "system",
    speaker: "muse",
    textKey: "story.a3_15_omen_question"
  },
  {
    id: "a3_16_last_software_company",
    act: 3,
    demoLocked: true,
    trigger: {
      all: [
        { seen: "a3_05_anders_leaves" },
        { seen: "a3_15_omen_question" },
        { era: 6 },
        { moneyGte: "1e13" }
      ]
    },
    channel: "feed",
    speaker: "chirper",
    textKey: "story.a3_16_last_software_company",
    effects: [{ kind: "setAct", act: 4 }]
  }
] as const;
