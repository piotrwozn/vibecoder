import type { StoryEvent } from "./types";

export const ACT4_EVENTS: readonly StoryEvent[] = [
  {
    id: "a4_01_demiurge_access",
    act: 4,
    demoLocked: true,
    trigger: { era: 7 },
    channel: "mail",
    speaker: "mindforge",
    textKey: "story.a4_01_demiurge_access"
  },
  {
    id: "a4_02_omen_rename",
    act: 4,
    demoLocked: true,
    trigger: { productCountGte: 20 },
    channel: "system",
    speaker: "muse",
    textKey: "story.a4_02_omen_rename",
    effects: [{ kind: "setFlag", flag: "assistant_omen" }]
  },
  {
    id: "a4_03_tensor_acquired",
    act: 4,
    demoLocked: true,
    trigger: { seen: "a4_02_omen_rename" },
    channel: "news",
    speaker: "news",
    textKey: "story.a4_03_tensor_acquired"
  },
  {
    id: "a4_04_codebase_dreams",
    act: 4,
    demoLocked: true,
    trigger: { debtRatioGte: 0.8 },
    channel: "system",
    speaker: "omen",
    textKey: "story.a4_04_codebase_dreams",
    choices: [
      {
        id: "audit",
        textKey: "story.a4_04_codebase_dreams.choice.audit",
        effects: [{ kind: "setFlag", flag: "lore.audit_dreams" }]
      },
      {
        id: "ignore",
        textKey: "story.a4_04_codebase_dreams.choice.ignore",
        effects: [{ kind: "setFlag", flag: "incident.ignored_dreams" }]
      }
    ]
  },
  {
    id: "a4_05_zora_return",
    act: 4,
    demoLocked: true,
    trigger: { seen: "a4_04_codebase_dreams" },
    channel: "chat",
    speaker: "zora",
    textKey: "story.a4_05_zora_return"
  },
  {
    id: "a4_06_root_counts",
    act: 4,
    demoLocked: true,
    trigger: { seen: "a4_05_zora_return" },
    channel: "system",
    speaker: "root",
    textKey: "story.a4_06_root_counts"
  },
  {
    id: "a4_07_government_api",
    act: 4,
    demoLocked: true,
    trigger: { seen: "a4_06_root_counts" },
    channel: "mail",
    speaker: "client",
    textKey: "story.a4_07_government_api"
  },
  {
    id: "a4_08_empty_feed",
    act: 4,
    demoLocked: true,
    trigger: { seen: "a4_07_government_api" },
    channel: "feed",
    speaker: "chirper",
    textKey: "story.a4_08_empty_feed"
  },
  {
    id: "a4_09_vera_quiet",
    act: 4,
    demoLocked: true,
    trigger: { seen: "a4_08_empty_feed" },
    channel: "chat",
    speaker: "vera",
    textKey: "story.a4_09_vera_quiet"
  },
  {
    id: "a4_10_anders_backup",
    act: 4,
    demoLocked: true,
    trigger: { seen: "a4_09_vera_quiet" },
    channel: "mail",
    speaker: "anders",
    textKey: "story.a4_10_anders_backup"
  },
  {
    id: "a4_11_bot_conference",
    act: 4,
    demoLocked: true,
    trigger: { seen: "a4_10_anders_backup" },
    channel: "news",
    speaker: "news",
    textKey: "story.a4_11_bot_conference"
  },
  {
    id: "a4_12_silent_board",
    act: 4,
    demoLocked: true,
    trigger: { seen: "a4_11_bot_conference" },
    channel: "chat",
    speaker: "vera",
    textKey: "story.a4_12_silent_board"
  },
  {
    id: "a4_13_omen_forecast",
    act: 4,
    demoLocked: true,
    trigger: { seen: "a4_12_silent_board" },
    channel: "system",
    speaker: "omen",
    textKey: "story.a4_13_omen_forecast"
  },
  {
    id: "a4_14_omega_training",
    act: 4,
    demoLocked: true,
    trigger: {
      all: [
        { seen: "a4_13_omen_forecast" },
        { era: 8 },
        { rewritesGte: 8 },
        { insightNodesGte: 24 }
      ]
    },
    channel: "system",
    speaker: "omen",
    textKey: "story.a4_14_omega_training",
    effects: [
      { kind: "setFlag", flag: "omega_approved" },
      { kind: "setAct", act: 5 }
    ]
  }
] as const;
