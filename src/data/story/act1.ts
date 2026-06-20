import type { StoryEvent } from "./types";

export const ACT1_EVENTS: readonly StoryEvent[] = [
  {
    id: "a1_01_muse_ad",
    act: 1,
    trigger: { moneyGte: "500" },
    channel: "mail",
    speaker: "mindforge",
    textKey: "story.a1_01_muse_ad",
    effects: [{ kind: "unlock", id: "era.e2.shop" }]
  },
  {
    id: "a1_02_gigs",
    act: 1,
    trigger: { shipCountGte: 5 },
    channel: "mail",
    speaker: "client",
    textKey: "story.a1_02_gigs",
    effects: [{ kind: "unlock", id: "project.special.double_payout" }]
  },
  {
    id: "a1_03_anders_intro",
    act: 1,
    trigger: { debtRatioGte: 0.3 },
    channel: "chat",
    speaker: "anders",
    textKey: "story.a1_03_anders_intro",
    effects: [
      { kind: "unlock", id: "refactor" },
      { kind: "unlock", id: "research.quality" }
    ]
  },
  {
    id: "a1_04_first_refactor",
    act: 1,
    trigger: { refactorGte: 1 },
    channel: "chat",
    speaker: "anders",
    textKey: "story.a1_04_first_refactor",
    effects: [{ kind: "grantRp", amount: 2 }]
  },
  {
    id: "a1_05_feed_hype",
    act: 1,
    trigger: { era: 2 },
    channel: "feed",
    speaker: "chirper",
    textKey: "story.a1_05_feed_hype",
    effects: [{ kind: "hypeAdd", amount: 0.5 }]
  },
  {
    id: "a1_06_viral",
    act: 1,
    trigger: { shipCountGte: 15 },
    channel: "feed",
    speaker: "chirper",
    textKey: "story.a1_06_viral",
    effects: [
      { kind: "hypeAdd", amount: 1 },
      { kind: "unlock", id: "story.a1_07_vera_dm" }
    ]
  },
  {
    id: "a1_07_vera_dm",
    act: 1,
    trigger: { seen: "a1_06_viral" },
    channel: "chat",
    speaker: "vera",
    textKey: "story.a1_07_vera_dm",
    effects: [{ kind: "setFlag", flag: "met_vera" }]
  },
  {
    id: "a1_08_rewrite_intro",
    act: 1,
    trigger: { insightGainGte: 5 },
    channel: "system",
    speaker: "muse",
    textKey: "story.a1_08_rewrite_intro",
    effects: [{ kind: "unlock", id: "rewrite" }]
  },
  {
    id: "a1_09_post_rewrite",
    act: 1,
    trigger: { rewritesGte: 1 },
    channel: "chat",
    speaker: "zora",
    textKey: "story.a1_09_post_rewrite",
    effects: [{ kind: "unlock", id: "insight.tooltip" }]
  },
  {
    id: "a1_10_act_end",
    act: 1,
    trigger: { all: [{ rewritesGte: 1 }, { moneyGte: "1e6" }] },
    channel: "chat",
    speaker: "vera",
    textKey: "story.a1_10_act_end",
    choices: [
      {
        id: "accept",
        textKey: "story.a1_10_act_end.choice.accept",
        effects: [
          { kind: "setFlag", flag: "accepted_term_sheet" },
          { kind: "setAct", act: 2 }
        ]
      },
      {
        id: "later",
        textKey: "story.a1_10_act_end.choice.later",
        effects: [{ kind: "snoozeEvent", seconds: 30 * 60 }]
      }
    ]
  }
];
