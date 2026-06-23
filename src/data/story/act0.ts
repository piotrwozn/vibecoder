import type { StoryEvent } from "./types";

export const ACT0_EVENTS: readonly StoryEvent[] = [
  {
    id: "a0_01_boot",
    act: 0,
    trigger: { timeInActMinGte: 0 },
    channel: "system",
    speaker: "system",
    textKey: "story.a0_01_boot",
    effects: [{ kind: "unlock", id: "prompt" }]
  },
  {
    id: "a0_02_zora_hi",
    act: 0,
    trigger: { locLifetimeGte: "10" },
    channel: "chat",
    speaker: "zora",
    textKey: "story.a0_02_zora_hi"
  },
  {
    id: "a0_03_first_gig",
    act: 0,
    trigger: { locLifetimeGte: "50" },
    channel: "mail",
    speaker: "client",
    textKey: "story.a0_03_first_gig",
    effects: [{ kind: "unlock", id: "projects" }]
  },
  {
    id: "a0_04_first_ship",
    act: 0,
    trigger: { shipCountGte: 1 },
    channel: "chat",
    speaker: "zora",
    textKey: "story.a0_04_first_ship",
    effects: [{ kind: "grantResource", resource: "money", amount: "50" }]
  },
  {
    id: "a0_05_agent",
    act: 0,
    trigger: { moneyGte: "80" },
    channel: "system",
    speaker: "muse",
    textKey: "story.a0_05_agent",
    effects: [{ kind: "unlock", id: "generator.g_autocomplete" }]
  },
  {
    id: "a0_06_compute",
    act: 0,
    trigger: { generatorTotalGte: 3 },
    channel: "system",
    speaker: "system",
    textKey: "story.a0_06_compute",
    effects: [{ kind: "unlock", id: "hardware" }]
  },
  {
    id: "a0_07_tutorial_done",
    act: 0,
    trigger: {
      all: [{ era: 1 }, { shipCountGte: 3 }, { seen: "a0_05_agent" }, { seen: "a0_06_compute" }]
    },
    channel: "chat",
    speaker: "zora",
    textKey: "story.a0_07_tutorial_done",
    effects: [{ kind: "setAct", act: 1 }]
  }
];
