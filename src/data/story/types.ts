import type { EndingChoice } from "../../core/state";
import type { Condition } from "../conditions";

export type StoryAct = 0 | 1 | 2 | 3 | 4 | 5 | 9;
export type StoryChannel = "mail" | "chat" | "feed" | "system" | "news";
export type StoryGrantResource = "money";

export type StoryEffect =
  | {
      readonly amount: string;
      readonly kind: "grantResource";
      readonly resource: StoryGrantResource;
    }
  | {
      readonly amount: number;
      readonly kind: "grantRp";
    }
  | {
      readonly amount: number;
      readonly kind: "hypeAdd";
    }
  | {
      readonly act: StoryAct;
      readonly kind: "setAct";
    }
  | {
      readonly flag: string;
      readonly kind: "setFlag";
    }
  | {
      readonly choice: EndingChoice;
      readonly kind: "setEnding";
    }
  | {
      readonly id: string;
      readonly kind: "unlock";
    }
  | {
      readonly kind: "snoozeEvent";
      readonly seconds: number;
    };

export interface StoryChoice {
  readonly effects: readonly StoryEffect[];
  readonly id: string;
  readonly textKey: string;
}

export interface StoryEvent {
  readonly act: StoryAct;
  readonly channel: StoryChannel;
  readonly choices?: readonly StoryChoice[];
  readonly demoLocked?: boolean;
  readonly effects?: readonly StoryEffect[];
  readonly id: string;
  readonly once?: boolean;
  readonly speaker: string;
  readonly textKey: string;
  readonly trigger: Condition;
}
