import type { EventBus } from "../core/bus";
import type { GameState } from "../core/state";
import { RESEARCH, getResearch, type ResearchDefinition } from "../data/research";
import { recomputeDerivedCache, type DerivedCache } from "./production";
import { canSpendNumber, spendNumber } from "./resources";

export interface BuyResearchResult {
  readonly costRp: number;
  readonly id: string;
  readonly ok: boolean;
  readonly reason?: "bought" | "locked" | "missing" | "unaffordable";
}

export type ResearchState = "available" | "bought" | "locked" | "unaffordable";

export function buyResearch(
  state: GameState,
  cache: DerivedCache,
  id: string,
  bus?: EventBus
): BuyResearchResult {
  const research = getResearch(id);

  if (research === undefined) {
    return { costRp: 0, id, ok: false, reason: "missing" };
  }

  if (state.owned.research.has(id)) {
    return { costRp: research.costRp, id, ok: false, reason: "bought" };
  }

  if (!isResearchUnlocked(state, research)) {
    return { costRp: research.costRp, id, ok: false, reason: "locked" };
  }

  if (!canSpendNumber(state.res.rp, research.costRp)) {
    return { costRp: research.costRp, id, ok: false, reason: "unaffordable" };
  }

  state.res.rp = spendNumber(state.res.rp, research.costRp) ?? state.res.rp;
  state.owned.research.add(id);
  recomputeDerivedCache(state, cache);
  bus?.emit("res:changed", "rp");
  bus?.emit("bought", { kind: "research", id });
  bus?.emit("production:changed", { locRate: cache.locRate });

  return { costRp: research.costRp, id, ok: true };
}

export function getResearchState(state: GameState, research: ResearchDefinition): ResearchState {
  if (state.owned.research.has(research.id)) {
    return "bought";
  }

  if (!isResearchUnlocked(state, research)) {
    return "locked";
  }

  return canSpendNumber(state.res.rp, research.costRp) ? "available" : "unaffordable";
}

function isResearchUnlocked(state: GameState, research: ResearchDefinition): boolean {
  return research.requires === undefined || state.owned.research.has(research.requires);
}

export function getResearchTree(): readonly ResearchDefinition[] {
  return RESEARCH;
}
