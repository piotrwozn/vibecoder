import type { StoryEvent } from "./types";

export const ENDGAME_EVENTS: readonly StoryEvent[] = [
  {
    id: "e9_01_post_human_governance",
    act: 9,
    demoLocked: true,
    trigger: { iterationGte: 1 },
    channel: "system",
    speaker: "aurora",
    textKey: "story.e9_01_post_human_governance",
    choices: [
      {
        id: "council",
        textKey: "story.e9_01_post_human_governance.choice.council",
        effects: [{ kind: "setFlag", flag: "endgame.governance_council" }]
      },
      {
        id: "autonomous",
        textKey: "story.e9_01_post_human_governance.choice.autonomous",
        effects: [{ kind: "setFlag", flag: "endgame.governance_autonomous" }]
      }
    ]
  },
  {
    id: "e9_02_aurora_afterimage",
    act: 9,
    demoLocked: true,
    trigger: { flag: "aurora_completed" },
    channel: "chat",
    speaker: "aurora",
    textKey: "story.e9_02_aurora_afterimage",
    effects: [{ kind: "setFlag", flag: "endgame.aurora_afterimage" }]
  },
  {
    id: "e9_03_paradox_constraint",
    act: 9,
    demoLocked: true,
    trigger: { iterationGte: 1 },
    channel: "system",
    speaker: "root",
    textKey: "story.e9_03_paradox_constraint",
    choices: [
      {
        id: "scarcity",
        textKey: "story.e9_03_paradox_constraint.choice.scarcity",
        effects: [{ kind: "setFlag", flag: "endgame.constraint_scarcity" }]
      },
      {
        id: "inversion",
        textKey: "story.e9_03_paradox_constraint.choice.inversion",
        effects: [{ kind: "setFlag", flag: "endgame.constraint_inversion" }]
      }
    ]
  }
] as const;
