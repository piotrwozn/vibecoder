import type { EventBus } from "../core/bus";
import { Big } from "../core/bignum";
import type { GameState } from "../core/state";
import {
  HARDWARE,
  LEGACY_HARDWARE_CAP_PER_LEVEL,
  LEGACY_HARDWARE_ID,
  STARTING_COMPUTE_CAP,
  type HardwareDefinition,
  type HardwareUnlockCondition
} from "../data/hardware";
import { isDemoLocked } from "./demo";
import { calculateIterationCostMultiplier } from "./iteration";
import type { DerivedCache } from "./production";

export interface BuyHardwareResult {
  readonly cost: Big;
  readonly id: string;
  readonly ok: boolean;
  readonly reason?: "demoLocked" | "locked" | "maxed" | "unaffordable";
}

export function getAvailableCompute(state: GameState, cache?: DerivedCache): number {
  if (cache !== undefined) {
    return cache.compute.available;
  }

  return Math.max(0, state.res.computeCap - state.res.computeUsed);
}

export function canFitCompute(
  state: GameState,
  computeUse: number,
  quantity: number,
  cache?: DerivedCache
): boolean {
  const effectiveUse = computeUse * (cache?.compute.useMultiplier ?? 1);
  return effectiveUse * quantity <= getAvailableCompute(state, cache);
}

export function getHardwareCost(hardware: HardwareDefinition, owned: number, iteration = 0): Big {
  const baseCost =
    hardware.growth === undefined
      ? hardware.baseCost.copy()
      : Big.cost(hardware.baseCost, hardware.growth, owned);

  return Big.mul(baseCost, Big.fromNumber(calculateIterationCostMultiplier(iteration)));
}

export function buyHardware(state: GameState, id: string, bus?: EventBus): BuyHardwareResult {
  const hardware = getHardware(id);

  if (hardware === undefined) {
    return { cost: Big.zero(), id, ok: false, reason: "locked" };
  }

  if (isDemoLocked(state, hardware)) {
    return { cost: Big.zero(), id, ok: false, reason: "demoLocked" };
  }

  if (!isHardwareUnlocked(state, hardware)) {
    return { cost: Big.zero(), id, ok: false, reason: "locked" };
  }

  const owned = state.owned.hardware[id] ?? 0;

  if (isHardwareMaxed(hardware, owned)) {
    return { cost: Big.zero(), id, ok: false, reason: "maxed" };
  }

  const cost = getHardwareCost(hardware, owned, state.prestige.iteration);

  if (state.res.money.lt(cost)) {
    return { cost, id, ok: false, reason: "unaffordable" };
  }

  Big.subIn(state.res.money, cost);
  state.owned.hardware[id] = owned + 1;
  recomputeComputeCap(state);

  bus?.emit("res:changed", "money");
  bus?.emit("res:changed", "computeCap");
  bus?.emit("bought", { kind: "hardware", id });

  return { cost, id, ok: true };
}

export function recomputeComputeCap(state: GameState): number {
  let cap = STARTING_COMPUTE_CAP;
  cap += (state.owned.hardware[LEGACY_HARDWARE_ID] ?? 0) * LEGACY_HARDWARE_CAP_PER_LEVEL;

  for (const hardware of HARDWARE) {
    cap += getEffectiveHardwareLevel(state, hardware) * hardware.capPerLevel;
  }

  if (!state.hardware.pcComplete && arePcComponentsMaxed(state)) {
    state.hardware.pcComplete = true;
  }

  state.res.computeCap = cap;
  return cap;
}

export function getHardware(id: string): HardwareDefinition | undefined {
  return HARDWARE.find((hardware) => hardware.id === id);
}

export function getAvailableHardware(state: GameState): readonly HardwareDefinition[] {
  return HARDWARE.filter(
    (hardware) => !isDemoLocked(state, hardware) && isHardwareUnlocked(state, hardware)
  );
}

export function isHardwareUnlocked(state: GameState, hardware: HardwareDefinition): boolean {
  if (hardware.phase === "server" && !isPcComplete(state)) {
    return false;
  }

  return hardware.unlock.every((condition) => isHardwareUnlockConditionMet(state, condition));
}

export function isHardwareMaxed(hardware: HardwareDefinition, owned: number): boolean {
  return owned >= hardware.maxLevel;
}

export function isPcComplete(state: GameState): boolean {
  return state.hardware.pcComplete || arePcComponentsMaxed(state);
}

function arePcComponentsMaxed(state: GameState): boolean {
  return HARDWARE.filter((hardware) => hardware.phase === "pc").every((hardware) =>
    isHardwareMaxed(hardware, state.owned.hardware[hardware.id] ?? 0)
  );
}

function getEffectiveHardwareLevel(state: GameState, hardware: HardwareDefinition): number {
  const level = state.owned.hardware[hardware.id] ?? 0;
  return Math.min(level, hardware.maxLevel);
}

function isHardwareUnlockConditionMet(
  state: GameState,
  condition: HardwareUnlockCondition
): boolean {
  switch (condition.kind) {
    case "era":
      return state.era >= condition.era;
    case "hardware":
      return (state.owned.hardware[condition.id] ?? 0) >= condition.level;
    case "pcComplete":
      return isPcComplete(state);
    case "start":
      return true;
  }
}
