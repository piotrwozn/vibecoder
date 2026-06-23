import type { StoryEvent } from "./types";

export const DECISION_EVENTS: readonly StoryEvent[] = [
  {
    id: "d_strategy_capital",
    act: 2,
    demoLocked: true,
    trigger: { all: [{ seen: "a2_01_seed" }, { exitsGte: 0 }] },
    channel: "mail",
    speaker: "vera",
    textKey: "story.d_strategy_capital",
    choices: [
      {
        id: "bootstrapped",
        textKey: "story.d_strategy_capital.choice.bootstrapped",
        effects: [{ kind: "setFlag", flag: "decision.bootstrapped" }]
      },
      {
        id: "vc_backed",
        textKey: "story.d_strategy_capital.choice.vc_backed",
        effects: [
          { kind: "setFlag", flag: "decision.vc_backed" },
          { kind: "hypeAdd", amount: 1 }
        ]
      }
    ]
  },
  {
    id: "d_strategy_market",
    act: 2,
    demoLocked: true,
    trigger: { seen: "d_strategy_capital" },
    channel: "feed",
    speaker: "chirper",
    textKey: "story.d_strategy_market",
    choices: [
      {
        id: "open_source",
        textKey: "story.d_strategy_market.choice.open_source",
        effects: [{ kind: "setFlag", flag: "decision.open_source" }]
      },
      {
        id: "enterprise",
        textKey: "story.d_strategy_market.choice.enterprise",
        effects: [{ kind: "setFlag", flag: "decision.enterprise" }]
      }
    ]
  },
  {
    id: "d_strategy_privacy",
    act: 3,
    demoLocked: true,
    trigger: { seen: "a3_02_takeover_offer" },
    channel: "mail",
    speaker: "client",
    textKey: "story.d_strategy_privacy",
    choices: [
      {
        id: "privacy",
        textKey: "story.d_strategy_privacy.choice.privacy",
        effects: [{ kind: "setFlag", flag: "decision.privacy" }]
      },
      {
        id: "growth",
        textKey: "story.d_strategy_privacy.choice.growth",
        effects: [
          { kind: "setFlag", flag: "decision.growth" },
          { kind: "hypeAdd", amount: 1 }
        ]
      }
    ]
  },
  {
    id: "d_strategy_labor",
    act: 3,
    demoLocked: true,
    trigger: { seen: "a3_05_anders_leaves" },
    channel: "chat",
    speaker: "zora",
    textKey: "story.d_strategy_labor",
    choices: [
      {
        id: "hire_humans",
        textKey: "story.d_strategy_labor.choice.hire_humans",
        effects: [{ kind: "setFlag", flag: "decision.hire_humans" }]
      },
      {
        id: "automate",
        textKey: "story.d_strategy_labor.choice.automate",
        effects: [{ kind: "setFlag", flag: "decision.automate" }]
      }
    ]
  },
  {
    id: "d_strategy_quality",
    act: 4,
    demoLocked: true,
    trigger: { seen: "a4_04_codebase_dreams" },
    channel: "system",
    speaker: "muse",
    textKey: "story.d_strategy_quality",
    choices: [
      {
        id: "quality",
        textKey: "story.d_strategy_quality.choice.quality",
        effects: [{ kind: "setFlag", flag: "decision.quality" }]
      },
      {
        id: "ship_fast",
        textKey: "story.d_strategy_quality.choice.ship_fast",
        effects: [
          { kind: "setFlag", flag: "decision.ship_fast" },
          { kind: "hypeAdd", amount: 1 }
        ]
      }
    ]
  },
  {
    id: "d_strategy_hosting",
    act: 5,
    demoLocked: true,
    trigger: { flag: "aurora_unlocked" },
    channel: "mail",
    speaker: "vendor",
    textKey: "story.d_strategy_hosting",
    choices: [
      {
        id: "cloud_vendor",
        textKey: "story.d_strategy_hosting.choice.cloud_vendor",
        effects: [{ kind: "setFlag", flag: "decision.cloud_vendor" }]
      },
      {
        id: "self_host",
        textKey: "story.d_strategy_hosting.choice.self_host",
        effects: [{ kind: "setFlag", flag: "decision.self_host" }]
      }
    ]
  },
  {
    id: "d_strategy_ending",
    act: 5,
    demoLocked: true,
    trigger: { seen: "a5_12_final_choice" },
    channel: "mail",
    speaker: "tensorcorp",
    textKey: "story.d_strategy_ending",
    choices: [
      {
        id: "sell_company",
        textKey: "story.d_strategy_ending.choice.sell_company",
        effects: [{ kind: "setFlag", flag: "decision.sell_company" }]
      },
      {
        id: "stay_independent",
        textKey: "story.d_strategy_ending.choice.stay_independent",
        effects: [{ kind: "setFlag", flag: "decision.stay_independent" }]
      }
    ]
  }
] as const;
