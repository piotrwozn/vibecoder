import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState, type GameState } from "../src/core/state";
import { REFACTOR_COMPLETED_STAT } from "../src/data/conditions";
import { PRESTIGE } from "../src/data/constants";
import { calculateDebtD0 } from "../src/systems/debt";
import {
  chooseStoryOption,
  getUnreadStoryCount,
  markStoryInboxRead,
  tickStory
} from "../src/systems/story";

const SHIPPED_STAT = "projects.shipped";

describe("M7 story engine", () => {
  it("queues Act 0 events once per second and applies tutorial effects", () => {
    const state = createDefaultGameState();

    expect(advanceStory(state, 0.5)).toBe(false);
    expect(state.story.inbox).toHaveLength(0);

    expect(advanceStory(state, 0.5)).toBe(true);
    expect(getInboxIds(state)).toEqual(["a0_01_boot"]);

    state.lifetime.loc = Big.fromNumber(10);
    state.res.loc = Big.fromNumber(10);
    advanceStory(state);

    state.lifetime.loc = Big.fromNumber(50);
    state.res.loc = Big.fromNumber(50);
    advanceStory(state);

    state.stats[SHIPPED_STAT] = 1;
    advanceStory(state);

    expect(getInboxIds(state)).toContain("a0_04_first_ship");
    expect(state.res.money.toNumber()).toBe(50);

    state.res.money = Big.fromNumber(80);
    advanceStory(state);

    state.owned.generators.g_autocomplete = 3;
    advanceStory(state);

    state.stats[SHIPPED_STAT] = 3;
    advanceStory(state);

    expect(getInboxIds(state)).toEqual([
      "a0_01_boot",
      "a0_02_zora_hi",
      "a0_03_first_gig",
      "a0_04_first_ship",
      "a0_05_agent",
      "a0_06_compute",
      "a0_07_tutorial_done"
    ]);
    expect(state.story.act).toBe(1);
    expect(state.story.flags.has("achievement.hello_world")).toBe(true);
  });

  it("simulates Act 1 progression and both a1_10 choice variants", () => {
    const state = createDefaultGameState();
    state.story.act = 1;

    state.res.money = Big.fromNumber(500);
    advanceStory(state);

    state.stats[SHIPPED_STAT] = 5;
    advanceStory(state);

    state.res.debt = Big.fromNumber(calculateDebtD0(state) * 0.3);
    advanceStory(state);

    state.stats[REFACTOR_COMPLETED_STAT] = 1;
    advanceStory(state);
    expect(state.res.rp).toBe(2);

    state.era = 2;
    advanceStory(state);
    expect(state.res.hype).toBeCloseTo(1.5);

    state.stats[SHIPPED_STAT] = 15;
    advanceStory(state);
    expect(getInboxIds(state)).toContain("a1_06_viral");
    expect(getInboxIds(state)).toContain("a1_07_vera_dm");
    expect(state.story.flags.has("met_vera")).toBe(true);

    state.lifetime.locSinceExit = getInsightGainThreshold(5);
    advanceStory(state);
    expect(getInboxIds(state)).toContain("a1_08_rewrite_intro");

    state.prestige.rewrites = 1;
    advanceStory(state);
    expect(getInboxIds(state)).toContain("a1_09_post_rewrite");

    state.res.money = Big.fromNumber(1e6);
    advanceStory(state);
    expect(getInboxIds(state).filter((id) => id === "a1_10_act_end")).toHaveLength(1);

    expect(chooseStoryOption(state, "a1_10_act_end", "later").ok).toBe(true);
    expect(state.story.act).toBe(1);

    advanceStory(state, 30 * 60 - 1);
    expect(getInboxIds(state).filter((id) => id === "a1_10_act_end")).toHaveLength(1);

    advanceStory(state);
    expect(getInboxIds(state).filter((id) => id === "a1_10_act_end")).toHaveLength(2);

    expect(chooseStoryOption(state, "a1_10_act_end", "accept").ok).toBe(true);
    expect(state.story.act).toBe(2);
  });

  it("persists unread archive state through story flags", () => {
    const state = createDefaultGameState();

    advanceStory(state);

    expect(getUnreadStoryCount(state)).toBe(1);
    expect(markStoryInboxRead(state, "archive")).toBe(true);
    expect(getUnreadStoryCount(state)).toBe(0);
  });

  it("counts and clears M14 unread channels independently", () => {
    const state = createDefaultGameState();
    state.story.inbox.push(
      { eventId: "a0_02_zora_hi" },
      { eventId: "a0_03_first_gig" },
      { eventId: "a1_05_feed_hype" },
      { eventId: "a0_01_boot" },
      { eventId: "a3_06_human_review_act" }
    );

    expect(getUnreadStoryCount(state, "chat")).toBe(1);
    expect(getUnreadStoryCount(state, "mail")).toBe(1);
    expect(getUnreadStoryCount(state, "feed")).toBe(3);

    expect(markStoryInboxRead(state, "chat")).toBe(true);
    expect(getUnreadStoryCount(state, "chat")).toBe(0);
    expect(getUnreadStoryCount(state, "mail")).toBe(1);
    expect(getUnreadStoryCount(state, "feed")).toBe(3);

    expect(markStoryInboxRead(state, "feed")).toBe(true);
    expect(getUnreadStoryCount(state, "feed")).toBe(0);
    expect(getUnreadStoryCount(state)).toBe(1);
  });
});

function advanceStory(state: GameState, seconds = 1): boolean {
  state.meta.playtimeS += seconds;
  return tickStory(state, seconds);
}

function getInboxIds(state: GameState): string[] {
  return state.story.inbox.map((entry) => entry.eventId);
}

function getInsightGainThreshold(gain: number): Big {
  return Big.mul(
    Big.fromNumber(PRESTIGE.INSIGHT_DIV),
    Big.powNumber(gain, 1 / PRESTIGE.INSIGHT_EXP)
  );
}
