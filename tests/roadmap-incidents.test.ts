import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState } from "../src/core/state";
import { createDerivedCache, recomputeDerivedCache } from "../src/systems/production";
import { getProjectIncomeRate } from "../src/systems/projects";
import {
  resolveProductionIncident,
  tickProductionIncidents,
  trySpawnIncident
} from "../src/systems/incidents";
import { getSprintEffects, startSprint, tickRoadmap } from "../src/systems/roadmap";
import { getRunStyleEffects, selectRunStyle } from "../src/systems/run-styles";
import { chooseStoryOption } from "../src/systems/story";

describe("Roadmap and production incidents", () => {
  it("runs sprint priorities with duration and cooldown effects", () => {
    const state = createDefaultGameState();

    expect(startSprint(state, "stability").ok).toBe(true);
    expect(startSprint(state, "growth").reason).toBe("active");
    expect(getSprintEffects(state).debtFactorMultiplier).toBeLessThan(1);

    state.meta.playtimeS = state.roadmap.endsAtS;
    expect(tickRoadmap(state)).toBe(true);
    expect(state.roadmap.active).toBeUndefined();
    expect(startSprint(state, "growth").reason).toBe("cooldown");

    state.meta.playtimeS = state.roadmap.cooldownUntilS;
    expect(startSprint(state, "growth").ok).toBe(true);
    expect(getSprintEffects(state).hypeShipMultiplier).toBeGreaterThan(1);
  });

  it("spawns and resolves production incidents with costs and revenue penalties", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.rngSeed = 7;
    state.meta.playtimeS = 1_000;
    state.res.loc = Big.fromNumber(1_000_000);
    state.res.money = Big.fromNumber(1_000_000);
    state.res.debt = Big.fromNumber(1_000_000);
    state.projects.portfolio.push({
      id: "p_micro_saas.1",
      bugged: false,
      level: 1,
      projectId: "p_micro_saas",
      revenue: Big.fromNumber(100),
      shippedAtS: 0
    });
    recomputeDerivedCache(state, cache);
    const incomeBefore = getProjectIncomeRate(state, cache).toNumber();

    expect(trySpawnIncident(state)).toBe(true);
    expect(state.incidents.active).toHaveLength(1);
    recomputeDerivedCache(state, cache);
    expect(getProjectIncomeRate(state, cache).toNumber()).toBeLessThan(incomeBefore);

    const incident = state.incidents.active[0];
    if (incident === undefined) {
      throw new Error("Missing incident fixture");
    }

    expect(resolveProductionIncident(state, cache, incident.id, "hotfix").ok).toBe(true);
    expect(state.incidents.active).toHaveLength(0);
    expect(state.incidents.history[0]?.response).toBe("hotfix");
  });

  it("rejects incident responses that are not allowed for the incident type", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.res.loc = Big.fromNumber(1_000_000);
    state.res.money = Big.fromNumber(1_000_000);
    state.res.rp = 99;
    state.incidents.active.push({
      id: "incident.test",
      severity: 1,
      startedAtS: 0,
      type: "outage",
      untilS: 90
    });
    recomputeDerivedCache(state, cache);

    const result = resolveProductionIncident(state, cache, "incident.test", "use_research");

    expect(result).toMatchObject({ ok: false, reason: "invalid-response" });
    expect(state.incidents.active).toHaveLength(1);
    expect(state.incidents.history).toHaveLength(0);
    expect(state.res.rp).toBe(99);
  });

  it("keeps only recent resolved incident history entries", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.res.loc = Big.fromNumber(1_000_000);

    for (let index = 0; index < 55; index += 1) {
      const id = `incident.${index}`;
      state.incidents.active.push({
        id,
        severity: 1,
        startedAtS: index,
        type: "outage",
        untilS: index + 90
      });
      expect(resolveProductionIncident(state, cache, id, "hotfix").ok).toBe(true);
    }

    expect(state.incidents.history).toHaveLength(50);
    expect(state.incidents.history[0]?.id).toBe("incident.5");
  });

  it("applies timed-out incident debt after the accept-debt response effect", () => {
    const state = createDefaultGameState();
    state.meta.playtimeS = 100;
    state.res.debt = Big.fromNumber(1_000);
    state.incidents.active.push({
      id: "incident.timeout",
      severity: 2,
      startedAtS: 0,
      type: "outage",
      untilS: 90
    });

    expect(tickProductionIncidents(state)).toBe(true);

    expect(state.res.debt.toNumber()).toBe(1_000 * 1.25 + 2 * 250 + 2 * 100);
    expect(state.incidents.active).toHaveLength(0);
    expect(state.incidents.history[0]?.response).toBe("accept_debt");
  });

  it("applies run style and strategic story decision consequences", () => {
    const state = createDefaultGameState();
    state.prestige.exits = 1;

    expect(selectRunStyle(state, "research_lab").ok).toBe(true);
    expect(getRunStyleEffects(state).rpMultiplier).toBeGreaterThan(1);

    state.story.act = 2;
    state.story.seen.add("a2_01_seed");
    state.story.seen.add("d_strategy_capital");
    state.story.inbox.push({ id: "d_strategy_capital.1", eventId: "d_strategy_capital" });

    const result = chooseStoryOption(state, "d_strategy_capital", "vc_backed");

    expect(result.ok).toBe(true);
    expect(state.story.flags.has("decision.vc_backed")).toBe(true);
    expect(state.story.choices.d_strategy_capital).toBe("vc_backed");
  });
});
