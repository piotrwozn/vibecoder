import type { GameState, RunStyleId } from "../core/state";
import { getRunStyle } from "../data/run-styles";

export interface RunStyleEffects {
  readonly auroraBillingMultiplier: number;
  readonly auroraSpeedMultiplier: number;
  readonly debtFactorMultiplier: number;
  readonly hypeShipMultiplier: number;
  readonly payoutMultiplier: number;
  readonly revenueMultiplier: number;
  readonly rpMultiplier: number;
}

export interface SelectRunStyleResult {
  readonly id: RunStyleId;
  readonly ok: boolean;
  readonly reason?: "locked" | "missing";
}

export function selectRunStyle(state: GameState, id: RunStyleId): SelectRunStyleResult {
  const style = getRunStyle(id);

  if (style === undefined) {
    return { id, ok: false, reason: "missing" };
  }

  if (!isRunStyleUnlocked(state, id)) {
    return { id, ok: false, reason: "locked" };
  }

  clearRunStyleFlags(state);
  state.metaprogression.runStyle = id;
  state.story.flags.add(`runStyle.${id}`);
  return { id, ok: true };
}

export function isRunStyleUnlocked(state: GameState, id: RunStyleId): boolean {
  const style = getRunStyle(id);

  if (style === undefined) {
    return false;
  }

  switch (style.unlock) {
    case "aurora":
      return state.aurora.unlocked || state.prestige.iteration > 0;
    case "exit":
      return state.prestige.exits > 0 || state.res.equity > 0;
    case "iteration":
      return state.prestige.iteration > 0;
  }
}

export function getRunStyleEffects(state: GameState): RunStyleEffects {
  const effects = createNeutralRunStyleEffects();

  switch (state.metaprogression.runStyle) {
    case "bootstrapped":
      return {
        ...effects,
        debtFactorMultiplier: 0.85,
        hypeShipMultiplier: 0.85,
        revenueMultiplier: 1.2
      };
    case "vc_backed":
      return {
        ...effects,
        debtFactorMultiplier: 1.25,
        hypeShipMultiplier: 1.45,
        payoutMultiplier: 1.15
      };
    case "research_lab":
      return {
        ...effects,
        revenueMultiplier: 0.8,
        rpMultiplier: 1.5
      };
    case "cursed_enterprise":
      return {
        ...effects,
        debtFactorMultiplier: 1.35,
        payoutMultiplier: 1.35,
        revenueMultiplier: 1.5
      };
    case "open_source_collective":
      return {
        ...effects,
        payoutMultiplier: 0.75,
        hypeShipMultiplier: 1.2,
        rpMultiplier: 1.2
      };
    case "aurora_first":
      return {
        ...effects,
        auroraBillingMultiplier: 1.25,
        auroraSpeedMultiplier: 1.35,
        revenueMultiplier: 0.9
      };
    case undefined:
      return effects;
  }
}

function createNeutralRunStyleEffects(): RunStyleEffects {
  return {
    auroraBillingMultiplier: 1,
    auroraSpeedMultiplier: 1,
    debtFactorMultiplier: 1,
    hypeShipMultiplier: 1,
    payoutMultiplier: 1,
    revenueMultiplier: 1,
    rpMultiplier: 1
  };
}

function clearRunStyleFlags(state: GameState): void {
  for (const flag of [...state.story.flags]) {
    if (flag.startsWith("runStyle.")) {
      state.story.flags.delete(flag);
    }
  }
}
