import type { StoryEvent } from "./types";

export const BANK_EVENTS: readonly StoryEvent[] = [
  {
    id: "bank_overdraft_warning_1",
    act: 9,
    trigger: { flag: "bank.manual" },
    channel: "mail",
    speaker: "bank",
    textKey: "story.bank.warning1"
  },
  {
    id: "bank_overdraft_warning_2",
    act: 9,
    trigger: { flag: "bank.manual" },
    channel: "mail",
    speaker: "bank",
    textKey: "story.bank.warning2"
  },
  {
    id: "bank_overdraft_default",
    act: 9,
    trigger: { flag: "bank.manual" },
    channel: "mail",
    speaker: "bank",
    textKey: "story.bank.default"
  }
] as const;
