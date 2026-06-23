import { Big } from "../core/bignum";
import type { GameState } from "../core/state";
import { C, PRESTIGE } from "../data/constants";

export function calculateIterationCostMultiplier(iteration: number): Big {
  return Big.fromLog10(PRESTIGE.ITER_COST_E_PER_K * iteration);
}

export function calculateIterationProductionMultiplier(iteration: number): Big {
  return Big.fromLog10(
    Math.log10(PRESTIGE.PARADOX_BASE) * PRESTIGE.ITER_PROD_POW_PER_K * iteration
  );
}

export function calculateParadoxGain(iteration: number): number {
  const gain = PRESTIGE.PARADOX_BASE ** iteration;
  return Number.isFinite(gain) ? gain : Number.MAX_VALUE;
}

export function getIterationSoftcapThreshold(iteration: number): Big {
  return Big.fromLog10(PRESTIGE.ITER_SOFTCAP_BASE_E + PRESTIGE.ITER_SOFTCAP_STEP_E * iteration);
}

export function applyIterationSoftcap(rate: Big, iteration: number): Big {
  const threshold = getIterationSoftcapThreshold(iteration);

  if (rate.lte(threshold)) {
    return rate.copy();
  }

  const excess = Big.div(rate, threshold);
  return Big.mul(threshold, Big.pow(excess, C.SOFTCAP_LOC_EXP));
}

export function isIterationUnlocked(state: GameState): boolean {
  return state.prestige.endingChoice !== undefined && state.story.flags.has("iteration_unlocked");
}
