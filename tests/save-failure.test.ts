import { describe, expect, it, vi } from "vitest";

import { createDefaultGameState } from "../src/core/state";
import { saveGameState } from "../src/core/save";
import { createSaveFailureNotifier } from "../src/app/save-failure";

describe("save failure notifier", () => {
  it("surfaces failed writes once and re-arms after a successful save", async () => {
    const warnings: string[] = [];
    const notifier = createSaveFailureNotifier(() => warnings.push("failed"));
    const failingPlatform = {
      save: vi.fn<() => Promise<void>>(() => Promise.reject(new Error("quota")))
    };
    const workingPlatform = {
      save: vi.fn<() => Promise<void>>(() => Promise.resolve())
    };
    const state = createDefaultGameState();

    expect(notifier.report(await saveGameState(failingPlatform, state))).toBe(false);
    expect(notifier.report(await saveGameState(failingPlatform, state))).toBe(false);
    expect(warnings).toEqual(["failed"]);

    expect(notifier.report(await saveGameState(workingPlatform, state))).toBe(true);
    expect(notifier.report(await saveGameState(failingPlatform, state))).toBe(false);
    expect(warnings).toEqual(["failed", "failed"]);
  });
});
