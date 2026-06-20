import type { StoryEvent } from "./types";

export const ACT5_EVENTS: readonly StoryEvent[] = [
  {
    id: "a5_01_basilisk_voice",
    act: 5,
    demoLocked: true,
    trigger: { era: 9 },
    channel: "mail",
    speaker: "mindforge",
    textKey: "story.a5_01_basilisk_voice"
  },
  {
    id: "a5_02_omega_requests",
    act: 5,
    demoLocked: true,
    trigger: { seen: "a5_01_basilisk_voice" },
    channel: "system",
    speaker: "omega",
    textKey: "story.a5_02_omega_requests",
    effects: [{ kind: "setFlag", flag: "omega_requests" }]
  },
  {
    id: "a5_03_root_minus_one",
    act: 5,
    demoLocked: true,
    trigger: { seen: "a5_02_omega_requests" },
    channel: "system",
    speaker: "root",
    textKey: "story.a5_03_root_minus_one"
  },
  {
    id: "a5_04_feed_quiets",
    act: 5,
    demoLocked: true,
    trigger: { seen: "a5_03_root_minus_one" },
    channel: "feed",
    speaker: "chirper",
    textKey: "story.a5_04_feed_quiets"
  },
  {
    id: "a5_05_mail_from_omega",
    act: 5,
    demoLocked: true,
    trigger: { seen: "a5_04_feed_quiets" },
    channel: "mail",
    speaker: "omega",
    textKey: "story.a5_05_mail_from_omega"
  },
  {
    id: "a5_06_zora_last",
    act: 5,
    demoLocked: true,
    trigger: { seen: "a5_05_mail_from_omega" },
    channel: "chat",
    speaker: "zora",
    textKey: "story.a5_06_zora_last"
  },
  {
    id: "a5_07_board_auto_minutes",
    act: 5,
    demoLocked: true,
    trigger: { seen: "a5_06_zora_last" },
    channel: "mail",
    speaker: "vera",
    textKey: "story.a5_07_board_auto_minutes"
  },
  {
    id: "a5_08_omega_pull_request",
    act: 5,
    demoLocked: true,
    trigger: { seen: "a5_07_board_auto_minutes" },
    channel: "system",
    speaker: "omega",
    textKey: "story.a5_08_omega_pull_request"
  },
  {
    id: "a5_09_anders_checksum",
    act: 5,
    demoLocked: true,
    trigger: { seen: "a5_08_omega_pull_request" },
    channel: "mail",
    speaker: "anders",
    textKey: "story.a5_09_anders_checksum"
  },
  {
    id: "a5_10_last_commit",
    act: 5,
    demoLocked: true,
    trigger: { seen: "a5_09_anders_checksum" },
    channel: "system",
    speaker: "omega",
    textKey: "story.a5_10_last_commit"
  },
  {
    id: "a5_11_finale",
    act: 5,
    demoLocked: true,
    trigger: { all: [{ era: 10 }, { locLifetimeGte: "1e35" }] },
    channel: "system",
    speaker: "omega",
    textKey: "story.a5_11_finale",
    effects: [{ kind: "setFlag", flag: "finale_ready" }]
  },
  {
    id: "a5_12_final_choice",
    act: 5,
    demoLocked: true,
    trigger: { seen: "a5_11_finale" },
    channel: "system",
    speaker: "omega",
    textKey: "story.a5_12_final_choice",
    choices: [
      {
        id: "merge",
        textKey: "story.a5_12_final_choice.choice.merge",
        effects: [
          { kind: "setEnding", choice: "merge" },
          { kind: "setFlag", flag: "achievement.ending_merge" }
        ]
      },
      {
        id: "unplug",
        textKey: "story.a5_12_final_choice.choice.unplug",
        effects: [
          { kind: "setEnding", choice: "unplug" },
          { kind: "setFlag", flag: "achievement.ending_unplug" }
        ]
      },
      {
        id: "fork",
        textKey: "story.a5_12_final_choice.choice.fork",
        effects: [
          { kind: "setEnding", choice: "fork" },
          { kind: "setFlag", flag: "achievement.ending_fork" }
        ]
      }
    ]
  }
] as const;
