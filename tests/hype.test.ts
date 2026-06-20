import { describe, expect, it } from "vitest";

import { createDefaultGameState } from "../src/core/state";
import { C } from "../src/data/constants";
import { addShipHype, tickHype } from "../src/systems/hype";

describe("M3 hype", () => {
  it("adds ship hype by tier and decays exponentially to one", () => {
    const state = createDefaultGameState();

    addShipHype(state, 1);
    expect(state.res.hype).toBeCloseTo(1.15);

    tickHype(state, C.HYPE_TAU);

    expect(state.res.hype).toBeCloseTo(1 + 0.15 * Math.exp(-1));
  });

  it("caps hype at the base cap", () => {
    const state = createDefaultGameState();

    addShipHype(state, 100);

    expect(state.res.hype).toBe(C.HYPE_CAP);
  });
});
