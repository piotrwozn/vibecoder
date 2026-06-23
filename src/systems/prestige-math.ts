import { Big } from "../core/bignum";
import type { GameState } from "../core/state";
import { PRESTIGE } from "../data/constants";
import { EQUITY_PERKS } from "../data/prestige";

export function calculatePrestigeMultiplierBig(state: GameState): Big {
  return Big.mul(
    Big.mul(calculateInsightMultiplierBig(state.res.insight), calculateEquityMultiplierBig(state)),
    calculateParadoxMultiplierBig(state)
  );
}

export function calculateInsightMultiplier(insight: Big): number {
  return calculateInsightMultiplierBig(insight).toNumber();
}

export function calculateInsightMultiplierBig(insight: Big): Big {
  return Big.pow(Big.add(Big.one(), insight), PRESTIGE.INSIGHT_MULT_EXP);
}

export function calculateEquityMultiplier(state: GameState, equity = state.res.equity): number {
  return calculateEquityMultiplierBig(state, equity).toNumber();
}

export function calculateEquityMultiplierBig(state: GameState, equity = state.res.equity): Big {
  return calculateOnePlusScaledPower(
    equity,
    PRESTIGE.EQUITY_MULT_K,
    getEquityMultiplierExponent(state)
  );
}

export function calculateParadoxMultiplier(state: GameState, paradox = state.res.paradox): number {
  return calculateParadoxMultiplierBig(state, paradox).toNumber();
}

export function calculateParadoxMultiplierBig(state: GameState, paradox = state.res.paradox): Big {
  const exponent = state.owned.paradoxItems.has("x_paradox_engine")
    ? PRESTIGE.PARADOX_ENGINE_MULT_EXP
    : PRESTIGE.PARADOX_MULT_EXP;

  return Big.powNumber(1 + paradox, exponent);
}

function calculateOnePlusScaledPower(value: number, scale: number, exponent: number): Big {
  if (value <= 0 || scale <= 0) {
    return Big.one();
  }

  const termLog10 = Math.log10(scale) + Math.log10(value) * exponent;

  if (termLog10 < 12) {
    return Big.fromNumber(1 + 10 ** termLog10);
  }

  return Big.fromLog10(termLog10);
}

function getEquityMultiplierExponent(state: GameState): number {
  let exponent = PRESTIGE.EQUITY_MULT_EXP;

  for (const perk of EQUITY_PERKS) {
    if (!state.owned.equityPerks.has(perk.id)) {
      continue;
    }

    for (const effect of perk.effects) {
      if (effect.kind === "compounding") {
        exponent += effect.exponentAdd;
      }
    }
  }

  return exponent;
}
