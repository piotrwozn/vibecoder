import { describe, expect, it } from "vitest";

import { getRoadmapTimerRefreshSignature, startVibecoderLoop } from "../src/app/game-loop";
import { createEventBus } from "../src/core/bus";
import { createDefaultGameState } from "../src/core/state";
import { createViewInvalidation } from "../src/core/view-invalidation";
import { createDerivedCache } from "../src/systems/production";
import type { AppShell } from "../src/ui/render";

describe("app game loop", () => {
  it("tracks visible roadmap timer changes as view-only invalidation", () => {
    const state = createDefaultGameState();
    const invalidation = createViewInvalidation(false);
    state.ui.windows.roadmap.open = true;
    state.roadmap.cooldownUntilS = 10;
    state.meta.playtimeS = 9.95;

    const before = getRoadmapTimerRefreshSignature(state);
    state.meta.playtimeS = 10.05;
    const after = getRoadmapTimerRefreshSignature(state);

    invalidation.markVisibleChanged(before !== after);

    expect(before).toBe("cooldown:1");
    expect(after).toBe("");
    expect(invalidation.consume()).toEqual({ cache: false, view: true });
  });

  it("refreshes the visible roadmap when a cooldown expires during a tick", () => {
    const callbacks: FrameRequestCallback[] = [];
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    const invalidation = createViewInvalidation(false);
    let viewUpdates = 0;
    state.ui.windows.roadmap.open = true;
    state.roadmap.cooldownUntilS = 10;
    state.meta.playtimeS = 9.95;

    startVibecoderLoop({
      app: () => createAppShell(),
      bus: createEventBus(),
      cache,
      catchUp(): void {},
      devPerfPanel: undefined,
      getState: () => state,
      invalidation,
      now: () => 0,
      requestFrame(callback): number {
        callbacks.push(callback);
        return callbacks.length;
      },
      updateVisibleView(): void {
        viewUpdates += 1;
      }
    });

    callbacks[0]?.(100);

    expect(state.meta.playtimeS).toBeCloseTo(10.05);
    expect(getRoadmapTimerRefreshSignature(state)).toBe("");
    expect(viewUpdates).toBe(1);
  });
});

function createAppShell(): AppShell {
  return {
    addTerminalLog(): void {},
    destroy(): void {},
    showToast(): void {},
    updateDevFloor(): void {},
    updateFrameAlpha(): void {}
  };
}
