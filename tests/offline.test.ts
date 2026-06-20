import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState } from "../src/core/state";
import { C } from "../src/data/constants";
import { applyOfflineProgress } from "../src/systems/offline";
import { createDerivedCache, recomputeDerivedCache } from "../src/systems/production";

describe("M4 offline progress", () => {
  it("applies the one-hour closed form exactly from saved rates", () => {
    const state = createDefaultGameState(0);
    state.meta.lastSeen = 0;
    state.res.hype = 4;
    const cache = createDerivedCache();
    state.projects.portfolio.push({
      id: "p_llama_todo.1",
      bugged: false,
      projectId: "p_llama_todo",
      revenue: Big.fromNumber(5),
      shippedAtS: 0
    });
    recomputeDerivedCache(state, cache);
    cache.locRate = Big.fromNumber(2);

    const result = applyOfflineProgress(state, cache, 60 * 60 * 1000);

    expect(result.elapsedS).toBe(60 * 60);
    expect(result.cappedS).toBe(60 * 60);
    expect(state.res.loc.toNumber()).toBe(2 * 60 * 60);
    expect(state.lifetime.loc.toNumber()).toBe(2 * 60 * 60);
    expect(state.res.money.toNumber()).toBe(5 * 60 * 60);
    expect(state.lifetime.money.toNumber()).toBe(5 * 60 * 60);
    expect(state.res.hype).toBe(4 * C.OFFLINE_HYPE_KEEP);
    expect(state.meta.playtimeS).toBe(60 * 60);
    expect(state.meta.lastSeen).toBe(60 * 60 * 1000);
  });
});
