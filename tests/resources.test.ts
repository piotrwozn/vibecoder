import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createLoopStepper } from "../src/core/loop";
import { createDefaultGameState } from "../src/core/state";
import { AURORA_PHASES } from "../src/data/aurora";
import { GENERATORS } from "../src/data/generators";
import { getResearch } from "../src/data/research";
import { getUpgrade } from "../src/data/upgrades";
import { fundAuroraPhase } from "../src/systems/aurora";
import { setAutomationEnabled, tickAutomation, AUTO_PROMPT_ID } from "../src/systems/automation";
import { tickBilling } from "../src/systems/billing";
import { buyHardware, getHardware, getHardwareCost } from "../src/systems/compute";
import { buyNextEra } from "../src/systems/eras";
import { resolveProductionIncident } from "../src/systems/incidents";
import {
  getProject,
  getProjectCost,
  startProject,
  tickProjectIncome
} from "../src/systems/projects";
import {
  buyGenerator,
  createDerivedCache,
  getGeneratorCost,
  recomputeDerivedCache,
  tickProduction
} from "../src/systems/production";
import { buyResearch } from "../src/systems/research";
import {
  addNonNegativeBig,
  addNonNegativeNumber,
  canSpendBig,
  canSpendNumber,
  clampCoreResources,
  spendBig,
  spendNumber
} from "../src/systems/resources";
import { buyUpgrade, getUpgradeCost } from "../src/systems/upgrades";

describe("resource invariants", () => {
  it("spends Big resources without allowing negative balances", () => {
    const exact = Big.fromNumber(10);
    expect(canSpendBig(exact, Big.fromNumber(10))).toBe(true);
    expect(spendBig(exact, Big.fromNumber(10))).toBe(true);
    expect(exact.eq0()).toBe(true);

    const short = Big.fromNumber(1);
    expect(spendBig(short, Big.fromNumber(2))).toBe(false);
    expect(short.toNumber()).toBe(1);

    const negativeCost = Big.fromNumber(10);
    expect(spendBig(negativeCost, Big.fromNumber(-1))).toBe(false);
    expect(negativeCost.toNumber()).toBe(10);
  });

  it("spends number resources without allowing negative balances", () => {
    expect(canSpendNumber(3, 3)).toBe(true);
    expect(spendNumber(3, 3)).toBe(0);
    expect(spendNumber(1, 2)).toBeUndefined();
    expect(spendNumber(3, -1)).toBeUndefined();
  });

  it("ignores negative resource grants", () => {
    const money = Big.fromNumber(5);
    expect(addNonNegativeBig(money, Big.fromNumber(-2))).toBe(false);
    expect(money.toNumber()).toBe(5);
    expect(addNonNegativeNumber(4, -2)).toBe(4);
  });

  it("repairs already-negative core resources at runtime", () => {
    const state = createDefaultGameState();
    state.res.money = Big.fromNumber(-5);
    state.res.loc = Big.fromNumber(-10);
    state.res.rp = -3;

    expect(clampCoreResources(state)).toBe(true);
    expect(state.res.money.eq0()).toBe(true);
    expect(state.res.loc.eq0()).toBe(true);
    expect(state.res.rp).toBe(0);
  });

  it("rejects unaffordable debits across Money, LoC, and RP systems", () => {
    const state = createDefaultGameState(Date.now(), "full");
    const cache = createDerivedCache();
    state.res.computeCap = 1_000;
    recomputeDerivedCache(state, cache);

    const generator = GENERATORS[0]!;
    state.res.money = Big.sub(getGeneratorCost(generator, 0, 1), Big.one());
    expect(buyGenerator(state, cache, generator.id, 1).ok).toBe(false);
    expect(state.res.money.gte(Big.zero())).toBe(true);

    const hardware = getHardware("h_cpu")!;
    state.res.money = Big.sub(getHardwareCost(hardware, 0), Big.one());
    expect(buyHardware(state, hardware.id).ok).toBe(false);
    expect(state.res.money.gte(Big.zero())).toBe(true);

    const upgrade = getUpgrade("u_better_prompts")!;
    state.lifetime.loc = Big.fromNumber(50);
    state.res.money = Big.sub(getUpgradeCost(state, upgrade), Big.one());
    expect(buyUpgrade(state, cache, upgrade.id).ok).toBe(false);
    expect(state.res.money.gte(Big.zero())).toBe(true);

    state.res.money = Big.fromNumber(19_999);
    expect(buyNextEra(state).ok).toBe(false);
    expect(state.res.money.gte(Big.zero())).toBe(true);

    const project = getProject("p_landing")!;
    const projectCost = getProjectCost(project, cache, state);
    state.res.loc = Big.sub(projectCost, Big.one());
    expect(startProject(state, project.id, cache).ok).toBe(false);
    expect(state.res.loc.gte(Big.zero())).toBe(true);

    const research = getResearch("r_t1")!;
    state.res.rp = research.costRp - 1;
    expect(buyResearch(state, cache, research.id).ok).toBe(false);
    expect(state.res.rp).toBeGreaterThanOrEqual(0);
  });

  it("rejects Aurora and incident mixed-resource overdrafts", () => {
    const state = createDefaultGameState(Date.now(), "full");
    const cache = createDerivedCache();
    const phase = AURORA_PHASES[0]!;

    state.aurora.unlocked = true;
    state.res.loc = Big.mul(phase.costLoc, Big.fromNumber(0.5));
    state.res.money = phase.costMoney.copy();
    expect(fundAuroraPhase(state).ok).toBe(false);
    expect(state.res.loc.gte(Big.zero())).toBe(true);
    expect(state.res.money.gte(Big.zero())).toBe(true);

    state.incidents.active.push({
      id: "incident.test",
      severity: 3,
      startedAtS: 0,
      type: "security_bug",
      untilS: 90
    });
    state.res.loc = Big.fromNumber(1_000_000);
    state.res.money = Big.fromNumber(1_000_000);
    state.res.rp = 8;
    expect(resolveProductionIncident(state, cache, "incident.test", "use_research").ok).toBe(false);
    expect(state.res.rp).toBe(8);
  });

  it("rejects negative computed costs instead of treating them as affordable", () => {
    const state = createDefaultGameState(Date.now(), "full");
    const cache = createDerivedCache();
    state.res.computeCap = 1_000;
    state.res.money = Big.fromNumber(1_000);
    recomputeDerivedCache(state, cache);
    cache.costs.generatorMultiplier = Big.fromNumber(-1);

    expect(buyGenerator(state, cache, "g_autocomplete", 1).ok).toBe(false);
    expect(state.res.money.toNumber()).toBe(1_000);

    cache.costs.projectMultiplier = Big.fromNumber(-1);
    state.res.loc = Big.fromNumber(1_000);
    expect(startProject(state, "p_landing", cache).ok).toBe(false);
    expect(state.res.loc.toNumber()).toBe(1_000);
  });

  it("ignores negative time deltas for resource-producing systems", () => {
    const state = createDefaultGameState(Date.now(), "full");
    const cache = createDerivedCache();
    state.owned.generators.g_autocomplete = 10;
    state.projects.portfolio.push({
      id: "p_landing.1",
      bugged: false,
      computeUse: 0,
      deploymentMode: "selfHosted",
      level: 1,
      projectId: "p_landing",
      revenue: Big.fromNumber(10),
      shippedAtS: 0
    });
    state.res.loc = Big.fromNumber(20);
    state.res.money = Big.fromNumber(30);
    recomputeDerivedCache(state, cache);

    tickProduction(state, cache, -1);
    tickProjectIncome(state, cache, -1);
    expect(state.res.loc.toNumber()).toBe(20);
    expect(state.res.money.toNumber()).toBe(30);

    cache.automation.autoPrompt = true;
    cache.automation.autoPromptRate = 1;
    setAutomationEnabled(state, AUTO_PROMPT_ID, true);
    expect(tickAutomation(state, cache, -1)).toBe(false);
    expect(state.res.loc.toNumber()).toBe(20);
  });

  it("does not move billing or loop state backward on negative time", () => {
    const state = createDefaultGameState();
    state.owned.hardware.h_cpu = 1;
    state.res.money = Big.fromNumber(10);

    expect(tickBilling(state, -1)).toBe(false);
    expect(state.res.money.toNumber()).toBe(10);

    const stepper = createLoopStepper(
      () => {
        throw new Error("negative elapsed time should not tick");
      },
      () => {}
    );
    const first = stepper.step(50);
    const second = stepper.step(-500);

    expect(first.accumulatorMs).toBe(50);
    expect(second.accumulatorMs).toBe(50);
    expect(second.ticks).toBe(0);
  });
});
