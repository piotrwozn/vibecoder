import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState, type EndingChoice, type GameState } from "../src/core/state";
import { REFACTOR_COMPLETED_STAT } from "../src/data/conditions";
import { C, PRESTIGE } from "../src/data/constants";
import { calculateDebtD0 } from "../src/systems/debt";
import {
  chooseStoryOption,
  getUnreadStoryCount,
  getStoryEvent,
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
    expect(state.story.flags.has("accepted_term_sheet")).toBe(true);
  });

  it("applies every story choice branch", () => {
    expect(choosePrepared("a1_10_act_end", "accept").state.story.act).toBe(2);

    const later = choosePrepared("a1_10_act_end", "later", 12);
    expect(later.state.story.act).toBe(1);
    expect(later.state.stats["story.snoozeUntil.a1_10_act_end"]).toBe(12 + 30 * 60);

    const rollback = choosePrepared("a2_06_demo_day_incident", "rollback");
    expect(rollback.state.story.flags.has("incident.rollback_demo_day")).toBe(true);

    const hotfix = choosePrepared("a2_06_demo_day_incident", "hotfix");
    expect(hotfix.state.story.flags.has("incident.hotfix_demo_day")).toBe(true);
    expect(hotfix.state.res.hype).toBeGreaterThan(1);

    const sell = choosePrepared("a3_02_takeover_offer", "sell");
    expect(sell.state.story.flags.has("exit_unlocked")).toBe(true);
    expect(sell.state.res.hype).toBe(1);

    const reject = choosePrepared("a3_02_takeover_offer", "reject", 90);
    expect(reject.state.story.flags.has("exit_unlocked")).toBe(true);
    expect(reject.state.res.hype).toBeGreaterThan(1);
    expect(reject.state.stats["story.snoozeUntil.a3_02_takeover_offer"]).toBe(90 + 30 * 60);

    const isolate = choosePrepared("a3_09_incident_two", "isolate");
    expect(isolate.state.story.flags.has("incident.isolated_region")).toBe(true);
    expect(isolate.state.res.hype).toBe(1);

    const reroute = choosePrepared("a3_09_incident_two", "reroute");
    expect(reroute.state.story.flags.has("incident.rerouted_region")).toBe(true);
    expect(reroute.state.res.hype).toBeGreaterThan(1);

    const audit = choosePrepared("a4_04_codebase_dreams", "audit");
    expect(audit.state.story.flags.has("lore.audit_dreams")).toBe(true);

    const ignore = choosePrepared("a4_04_codebase_dreams", "ignore");
    expect(ignore.state.story.flags.has("incident.ignored_dreams")).toBe(true);

    expectEndingChoice("merge", "achievement.ending_merge");
    expectEndingChoice("unplug", "achievement.ending_unplug");
    expectEndingChoice("fork", "achievement.ending_fork");
  });

  it("holds the Act 2 agent-bank beat until the larger agent and shipping milestone", () => {
    const state = createDefaultGameState();
    state.meta.edition = "full";
    state.story.act = 2;
    state.story.flags.add("accepted_term_sheet");
    state.stats[SHIPPED_STAT] = 350;

    state.owned.generators.g_autocomplete = C.MILESTONES[1];
    advanceStory(state);

    expect(getInboxIds(state)).not.toContain("a2_02_agent_bank");

    state.owned.generators.g_autocomplete = C.MILESTONES[3];
    advanceStory(state);

    expect(getInboxIds(state)).toContain("a2_02_agent_bank");
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

function choosePrepared(
  eventId: string,
  choiceId: string,
  playtimeS = 0
): { readonly state: GameState } {
  const state = createDefaultGameState();
  state.meta.edition = "full";
  state.meta.playtimeS = playtimeS;
  state.story.act = getStoryEvent(eventId)?.act ?? state.story.act;
  state.story.seen.add(eventId);
  state.story.inbox.push({ eventId });

  const result = chooseStoryOption(state, eventId, choiceId);
  expect(result.ok).toBe(true);

  return { state };
}

function expectEndingChoice(choice: EndingChoice, achievementFlag: string): void {
  const result = choosePrepared("a5_12_final_choice", choice);

  expect(result.state.prestige.endingChoice).toBe(choice);
  expect(result.state.story.flags.has("iteration_unlocked")).toBe(true);
  expect(result.state.story.flags.has(achievementFlag)).toBe(true);
}
