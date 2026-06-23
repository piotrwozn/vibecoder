import { describe, expect, it } from "vitest";

import { exportCurrentGameState } from "../src/app/export-save";
import { deserializeGameState } from "../src/core/save";
import { createDefaultGameState } from "../src/core/state";

describe("export save offline anchor", () => {
  it("stamps lastSimTickMs instead of advancing lastSeen", () => {
    const state = createDefaultGameState(1_000);
    state.meta.lastSeen = 2_000;

    const payload = exportCurrentGameState(state, 3_000);
    const raw = Buffer.from(payload, "base64").toString("utf8");
    const decoded = deserializeGameState(raw, { nowMs: 4_000 });

    expect(decoded.state.meta.lastSeen).toBe(2_000);
    expect(decoded.state.meta.lastSimTickMs).toBe(3_000);
  });
});
