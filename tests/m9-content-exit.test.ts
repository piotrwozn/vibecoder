import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState } from "../src/core/state";
import { C } from "../src/data/constants";
import { ERAS } from "../src/data/eras";
import { GENERATORS } from "../src/data/generators";
import { HARDWARE } from "../src/data/hardware";
import { EQUITY_PERKS, RUN_MODIFIERS } from "../src/data/prestige";
import { PROJECTS } from "../src/data/projects";
import { ACT2_EVENTS } from "../src/data/story/act2";
import { ACT3_EVENTS } from "../src/data/story/act3";
import { ACT4_EVENTS } from "../src/data/story/act4";
import { ACT5_EVENTS } from "../src/data/story/act5";
import { hasMessage } from "../src/i18n/i18n";
import { performPromptClick } from "../src/systems/prompt";
import { createDerivedCache, recomputeDerivedCache } from "../src/systems/production";
import {
  ITERATION_HOLD_STAT,
  REWRITE_BOOT_UNTIL_STAT,
  calculateBaseEquityGain,
  getRewriteStartMoney,
  performExit,
  selectRunModifier
} from "../src/systems/prestige";
import { getProject, getProjectIncomeRate, getProjectPayout } from "../src/systems/projects";
import { chooseStoryOption, tickStory } from "../src/systems/story";

describe("M9 content tables", () => {
  it("transcribes the referenced era, generator, hardware, project, and Equity tables", () => {
    expect(ERAS.map((era) => era.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(GENERATORS).toHaveLength(26);
    expect(HARDWARE).toHaveLength(23);
    expect(HARDWARE.map((hardware) => hardware.id)).toContain("h_cpu");
    expect(HARDWARE.map((hardware) => hardware.id)).toContain("h_exotic_core");
    expect(PROJECTS.map((project) => project.id)).toContain("p_omega_request");
    expect(EQUITY_PERKS).toHaveLength(15);
    expect(RUN_MODIFIERS.map((modifier) => modifier.id)).toEqual([
      "no_click",
      "debt_storm",
      "indie",
      "blackout"
    ]);
  });

  it("has i18n text for every Act 2-5 event and choice", () => {
    const events = [...ACT2_EVENTS, ...ACT3_EVENTS, ...ACT4_EVENTS, ...ACT5_EVENTS];

    expect(ACT2_EVENTS).toHaveLength(14);
    expect(ACT3_EVENTS).toHaveLength(16);
    expect(ACT4_EVENTS).toHaveLength(14);
    expect(ACT5_EVENTS).toHaveLength(20);

    for (const event of events) {
      expect(hasMessage(event.textKey) || hasMessage(`${event.textKey}.1`)).toBe(true);

      for (const choice of event.choices ?? []) {
        expect(hasMessage(choice.textKey)).toBe(true);
      }
    }
  });
});

describe("M9 EXIT prestige", () => {
  it("calculates Equity gain from Insight earned since EXIT", () => {
    const state = createDefaultGameState();
    state.lifetime.insightSinceExit = 300;

    expect(calculateBaseEquityGain(state)).toBe(4);
  });

  it("resets exactly the W2 layers while preserving story and Equity perks", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.story.flags.add("exit_unlocked");
    state.story.seen.add("a3_02_takeover_offer");
    state.lifetime.insightSinceExit = 300;
    state.lifetime.locSinceExit = Big.fromNumber(1e12);
    state.res.loc = Big.fromNumber(123);
    state.res.money = Big.fromNumber(456);
    state.res.debt = Big.fromNumber(789);
    state.res.hype = 4;
    state.res.insight = Big.fromNumber(99);
    state.res.rp = 12;
    state.era = 5;
    state.owned.generators.g_autocomplete = 10;
    state.owned.hardware.h_gaming_rig = 2;
    state.owned.upgrades.add("u_better_prompts");
    state.owned.research.add("r_t1");
    state.owned.insightNodes.add("i_v1");
    state.owned.equityPerks.add("q_board_seat");
    state.projects.portfolio.push({
      id: "p_micro_saas.1",
      bugged: true,
      projectId: "p_micro_saas",
      revenue: Big.fromNumber(10),
      shippedAtS: 1
    });
    state.bugs.push({ productId: "p_micro_saas.1" });
    state.stats["projects.started"] = 3;
    state.stats["project.started.p_micro_saas"] = 2;
    state.stats["stats.locRate.sample.0"] = Big.fromNumber(10);
    state.stats["stats.locRate.sampleCount"] = 1;
    state.stats["stats.locRate.sampleIndex"] = 0;
    state.stats["stats.locRate.lastSampleAt"] = 120;
    state.stats[ITERATION_HOLD_STAT] = 600;
    state.stats[REWRITE_BOOT_UNTIL_STAT] = 700;

    const result = performExit(state, cache);

    expect(result.ok).toBe(true);
    expect(state.prestige.exits).toBe(1);
    expect(state.res.equity).toBe(4);
    expect(state.res.insight.eq0()).toBe(true);
    expect(state.res.rp).toBe(0);
    expect(state.lifetime.insightSinceExit).toBe(0);
    expect(state.lifetime.locSinceExit.eq0()).toBe(true);
    expect(state.res.loc.eq0()).toBe(true);
    expect(state.res.money.eq0()).toBe(true);
    expect(state.res.debt.eq0()).toBe(true);
    expect(state.res.hype).toBe(1);
    expect(state.era).toBe(1);
    expect(Object.values(state.owned.generators).every((count) => count === 0)).toBe(true);
    expect(state.owned.hardware).toEqual({});
    expect(state.owned.upgrades.size).toBe(0);
    expect(state.owned.research.size).toBe(0);
    expect(state.owned.insightNodes.size).toBe(0);
    expect(state.owned.equityPerks.has("q_board_seat")).toBe(true);
    expect(state.projects.portfolio).toHaveLength(0);
    expect(state.bugs).toHaveLength(0);
    expect(state.stats["projects.started"]).toBeUndefined();
    expect(state.stats["project.started.p_micro_saas"]).toBeUndefined();
    expect(state.stats["stats.locRate.sample.0"]).toBeUndefined();
    expect(state.stats["stats.locRate.sampleCount"]).toBeUndefined();
    expect(state.stats["stats.locRate.sampleIndex"]).toBeUndefined();
    expect(state.stats["stats.locRate.lastSampleAt"]).toBeUndefined();
    expect(state.stats[ITERATION_HOLD_STAT]).toBeUndefined();
    expect(state.stats[REWRITE_BOOT_UNTIL_STAT]).toBeUndefined();
    expect(state.story.seen.has("a3_02_takeover_offer")).toBe(true);
  });

  it("lets Founder's Instinct preserve research and RP through EXIT", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.story.flags.add("exit_unlocked");
    state.lifetime.insightSinceExit = 300;
    state.res.rp = 12;
    state.owned.research.add("r_t1");
    state.owned.equityPerks.add("q_founder_instinct");

    expect(performExit(state, cache).ok).toBe(true);
    expect(state.res.rp).toBe(12);
    expect(state.owned.research.has("r_t1")).toBe(true);
  });

  it("activates Board Seat run modifiers for the next run", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.story.flags.add("exit_unlocked");
    state.lifetime.insightSinceExit = 300;
    state.owned.equityPerks.add("q_board_seat");

    expect(selectRunModifier(state, "no_click").ok).toBe(true);
    expect(performExit(state, cache).ok).toBe(true);
    recomputeDerivedCache(state, cache);

    expect(state.story.flags.has("prestige.runModifier.active.no_click")).toBe(true);
    expect(performPromptClick(state, cache).eq0()).toBe(true);
  });

  it("applies incident revenue penalties and Iron Stomach mitigation only to incidents", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.projects.portfolio.push({
      id: "p_micro_saas.1",
      bugged: false,
      projectId: "p_micro_saas",
      revenue: Big.fromNumber(100),
      shippedAtS: 0
    });
    state.story.seen.add("a3_09_incident_two");

    recomputeDerivedCache(state, cache);
    expect(getProjectIncomeRate(state, cache).toNumber()).toBeCloseTo(50);

    state.owned.equityPerks.add("q_iron_stomach");
    state.story.flags.add("prestige.runModifier.active.debt_storm");
    recomputeDerivedCache(state, cache);

    expect(getProjectIncomeRate(state, cache).toNumber()).toBeCloseTo(75);
    expect(cache.debt.factor).toBeCloseTo(C.DEBT_FACTOR * 3);

    state.story.choices.a3_09_incident_two = "reroute";
    recomputeDerivedCache(state, cache);
    expect(getProjectIncomeRate(state, cache).toNumber()).toBeCloseTo(100);
  });

  it("lets War Chest multiply REWRITE start money from Insight nodes", () => {
    const state = createDefaultGameState();
    state.owned.insightNodes.add("i_c1");
    state.owned.equityPerks.add("q_war_chest");

    expect(getRewriteStartMoney(state).toNumber()).toBeCloseTo(50_000);
  });

  it("turns Golden Gut into a real x3 payout effect", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    const project = getProject("p_landing");

    if (project === undefined) {
      throw new Error("Missing project fixture");
    }

    state.owned.equityPerks.add("q_golden_gut");
    recomputeDerivedCache(state, cache);

    expect(cache.project.boardSlots).toBe(C.PROJECT_BOARD_BASE_SLOTS + 1);
    expect(getProjectPayout(project, cache).toNumber()).toBeCloseTo(1_200 * 0.55 * 3);
  });
});

describe("M9 finale", () => {
  it("records an ending choice and unlocks iteration flavor state", () => {
    const state = createDefaultGameState(1_000, "full");
    state.story.act = 5;
    state.era = 10;
    state.lifetime.loc = Big.from("1e35");

    state.meta.playtimeS = 1;
    tickStory(state, 1);
    expect(state.story.seen.has("a5_11_finale")).toBe(true);
    expect(state.story.seen.has("a5_12_final_choice")).toBe(true);

    const result = chooseStoryOption(state, "a5_12_final_choice", "fork");

    expect(result.ok).toBe(true);
    expect(state.prestige.endingChoice).toBe("fork");
    expect(state.story.flags.has("iteration_unlocked")).toBe(true);
  });
});
