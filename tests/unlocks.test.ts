import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createDefaultGameState } from "../src/core/state";
import { calculateDebtD0 } from "../src/systems/debt";
import { checkCondition, getUnlockVisibility } from "../src/systems/unlocks";

describe("M5 unlock conditions", () => {
  it("evaluates resource, prestige, story, stats, and debt conditions", () => {
    const state = createDefaultGameState();
    state.era = 3;
    state.res.money = Big.fromNumber(1_000);
    state.lifetime.loc = Big.fromNumber(2_000);
    state.prestige.rewrites = 1;
    state.prestige.exits = 1;
    state.prestige.iteration = 2;
    state.story.seen.add("a0_01");
    state.story.flags.add("flag.test");
    state.stats["projects.shipped"] = 3;
    state.meta.playtimeS = 30 * 60;
    state.res.debt = Big.fromNumber(calculateDebtD0(state));

    expect(
      checkCondition(state, {
        all: [
          { era: 3 },
          { moneyGte: "1e3" },
          { locLifetimeGte: "2e3" },
          { rewritesGte: 1 },
          { exitsGte: 1 },
          { iterationGte: 2 },
          { seen: "a0_01" },
          { flag: "flag.test" },
          { shipCountGte: 3 },
          { timeInActMinGte: 30 },
          { debtRatioGte: 1 }
        ]
      })
    ).toBe(true);
  });

  it("reports hidden visibility until conditions pass", () => {
    const state = createDefaultGameState();

    expect(getUnlockVisibility(state, { moneyGte: "1e3" })).toBe("hidden");

    state.res.money = Big.fromNumber(1_000);

    expect(getUnlockVisibility(state, { moneyGte: "1e3" })).toBe("unlocked");
    expect(getUnlockVisibility(state, { any: [{ era: 9 }, { moneyGte: "1e3" }] })).toBe("unlocked");
  });
});
