import type { EventBus } from "../core/bus";
import { Big } from "../core/bignum";
import type { GameState } from "../core/state";
import { C } from "../data/constants";
import type { DerivedCache } from "./production";
import { addNonNegativeBig } from "./resources";

const FLOW_IDLE_GRACE_S = 5;
const LAST_PROMPT_AT_STAT = "prompt.lastAt";

export function performPromptClick(
  state: GameState,
  cache: DerivedCache,
  nowS = state.meta.playtimeS,
  bus?: EventBus
): Big {
  if (state.story.flags.has("prestige.runModifier.active.no_click")) {
    return Big.zero();
  }

  const clickPower = getClickPower(state, cache, nowS);
  if (!addNonNegativeBig(state.res.loc, clickPower)) {
    return Big.zero();
  }

  addNonNegativeBig(state.lifetime.loc, clickPower);
  addNonNegativeBig(state.lifetime.locSinceExit, clickPower);

  state.stats[LAST_PROMPT_AT_STAT] = nowS;
  state.flow.meter = Math.min(1, state.flow.meter + cache.click.flowGain);

  if (state.flow.meter >= 1) {
    state.flow.meter = 0;
    state.flow.activeUntil = nowS + cache.click.flowDurationS;
  }

  bus?.emit("res:changed", "loc");
  return clickPower;
}

export function tickPromptFlow(
  state: GameState,
  dtS: number,
  nowS = state.meta.playtimeS
): boolean {
  let changed = false;

  if (state.flow.activeUntil > 0 && nowS >= state.flow.activeUntil) {
    state.flow.activeUntil = 0;
    changed = true;
  }

  if (isFlowActive(state, nowS)) {
    return changed;
  }

  const lastPromptAt = getLastPromptAt(state);
  if (nowS - lastPromptAt <= FLOW_IDLE_GRACE_S) {
    return changed;
  }

  const nextMeter = Math.max(0, state.flow.meter - C.FLOW_DECAY * dtS);
  if (nextMeter !== state.flow.meter) {
    state.flow.meter = nextMeter;
    changed = true;
  }

  return changed;
}

export function getClickPower(
  state: GameState,
  cache: DerivedCache,
  nowS = state.meta.playtimeS
): Big {
  const passivePart = Big.mul(cache.locRate, Big.fromNumber(cache.click.synergy));
  const basePower = Big.mul(
    Big.fromNumber(C.CLICK_BASE * cache.click.multiplier),
    Big.add(Big.one(), passivePart)
  );

  return isFlowActive(state, nowS)
    ? Big.mul(basePower, Big.fromNumber(cache.click.flowMultiplier))
    : basePower;
}

export function isFlowActive(state: GameState, nowS = state.meta.playtimeS): boolean {
  return state.flow.activeUntil > nowS;
}

function getLastPromptAt(state: GameState): number {
  const lastPromptAt = state.stats[LAST_PROMPT_AT_STAT];
  return typeof lastPromptAt === "number" ? lastPromptAt : 0;
}
