import type { GameState } from "../core/state";

export interface StoryDecisionEffects {
  auroraBillingMultiplier: number;
  auroraSpeedMultiplier: number;
  autoPromptMultiplier: number;
  bugChanceMultiplier: number;
  debtFactorMultiplier: number;
  generatorCostMultiplier: number;
  hypeShipMultiplier: number;
  payoutMultiplier: number;
  qaMultiplier: number;
  revenueMultiplier: number;
  rpMultiplier: number;
}

export function getStoryDecisionEffects(state: GameState): StoryDecisionEffects {
  const effects = createNeutralStoryDecisionEffects();

  if (state.story.flags.has("decision.bootstrapped")) {
    effects.debtFactorMultiplier *= 0.9;
    effects.revenueMultiplier *= 1.1;
    effects.hypeShipMultiplier *= 0.9;
  }

  if (state.story.flags.has("decision.vc_backed")) {
    effects.debtFactorMultiplier *= 1.15;
    effects.hypeShipMultiplier *= 1.2;
    effects.payoutMultiplier *= 1.1;
  }

  if (state.story.flags.has("decision.open_source")) {
    effects.rpMultiplier *= 1.2;
    effects.hypeShipMultiplier *= 1.1;
    effects.payoutMultiplier *= 0.9;
  }

  if (state.story.flags.has("decision.enterprise")) {
    effects.revenueMultiplier *= 1.15;
    effects.debtFactorMultiplier *= 1.1;
  }

  if (state.story.flags.has("decision.privacy")) {
    effects.bugChanceMultiplier *= 0.85;
    effects.hypeShipMultiplier *= 0.9;
  }

  if (state.story.flags.has("decision.growth")) {
    effects.hypeShipMultiplier *= 1.2;
    effects.bugChanceMultiplier *= 1.15;
  }

  if (state.story.flags.has("decision.hire_humans")) {
    effects.qaMultiplier *= 1.2;
    effects.generatorCostMultiplier *= 1.08;
  }

  if (state.story.flags.has("decision.automate")) {
    effects.autoPromptMultiplier *= 1.2;
    effects.bugChanceMultiplier *= 1.1;
  }

  if (state.story.flags.has("decision.quality")) {
    effects.qaMultiplier *= 1.25;
    effects.debtFactorMultiplier *= 0.85;
  }

  if (state.story.flags.has("decision.ship_fast")) {
    effects.hypeShipMultiplier *= 1.2;
    effects.debtFactorMultiplier *= 1.2;
  }

  if (state.story.flags.has("decision.cloud_vendor")) {
    effects.auroraSpeedMultiplier *= 1.15;
    effects.auroraBillingMultiplier *= 1.2;
  }

  if (state.story.flags.has("decision.self_host")) {
    effects.auroraBillingMultiplier *= 0.85;
    effects.auroraSpeedMultiplier *= 0.9;
  }

  if (state.story.flags.has("decision.sell_company")) {
    effects.payoutMultiplier *= 1.25;
  }

  if (state.story.flags.has("decision.stay_independent")) {
    effects.revenueMultiplier *= 1.1;
  }

  return effects;
}

function createNeutralStoryDecisionEffects(): StoryDecisionEffects {
  return {
    auroraBillingMultiplier: 1,
    auroraSpeedMultiplier: 1,
    autoPromptMultiplier: 1,
    bugChanceMultiplier: 1,
    debtFactorMultiplier: 1,
    generatorCostMultiplier: 1,
    hypeShipMultiplier: 1,
    payoutMultiplier: 1,
    qaMultiplier: 1,
    revenueMultiplier: 1,
    rpMultiplier: 1
  };
}
