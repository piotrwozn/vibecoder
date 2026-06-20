import type { EventBus } from "../core/bus";
import { Big } from "../core/bignum";
import type { GameState } from "../core/state";
import { ERAS, type EraDefinition } from "../data/eras";
import { isDemoLocked } from "./demo";
import { checkCondition } from "./unlocks";

export interface BuyEraResult {
  readonly cost: Big;
  readonly era?: EraDefinition;
  readonly ok: boolean;
  readonly reason?: "demoLocked" | "locked" | "max" | "unaffordable";
}

export function getCurrentEra(state: GameState): EraDefinition {
  return getEra(state.era) ?? ERAS[0]!;
}

export function getEra(index: number): EraDefinition | undefined {
  return ERAS.find((era) => era.index === index);
}

export function getNextEra(state: GameState): EraDefinition | undefined {
  return getEra(state.era + 1);
}

export function getEraCost(state: GameState, era: EraDefinition): Big | undefined {
  if (era.cost === undefined) {
    return undefined;
  }

  void state;
  return era.cost.copy();
}

export function canBuyEra(state: GameState, era: EraDefinition | undefined): boolean {
  if (era === undefined || era.cost === undefined) {
    return false;
  }

  if (era.unlock !== undefined && !checkCondition(state, era.unlock)) {
    return false;
  }

  if (isDemoLocked(state, era)) {
    return false;
  }

  return state.res.money.gte(getEraCost(state, era) ?? Big.zero());
}

export function buyNextEra(state: GameState, bus?: EventBus): BuyEraResult {
  const era = getNextEra(state);

  if (era === undefined) {
    return { cost: Big.zero(), ok: false, reason: "max" };
  }

  const cost = getEraCost(state, era);

  if (cost === undefined || (era.unlock !== undefined && !checkCondition(state, era.unlock))) {
    return { cost: cost?.copy() ?? Big.zero(), era, ok: false, reason: "locked" };
  }

  if (isDemoLocked(state, era)) {
    return { cost, era, ok: false, reason: "demoLocked" };
  }

  if (state.res.money.lt(cost)) {
    return { cost, era, ok: false, reason: "unaffordable" };
  }

  Big.subIn(state.res.money, cost);
  state.era = era.index;
  bus?.emit("res:changed", "money");
  bus?.emit("era:changed", state.era);
  return { cost, era, ok: true };
}
