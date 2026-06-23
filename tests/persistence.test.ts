import { describe, expect, it } from "vitest";

import { createPersistenceController } from "../src/app/persistence";
import { createDefaultGameState } from "../src/core/state";
import type { Platform } from "../src/platform/platform";

describe("persistence controller", () => {
  it("coalesces overlapping persistNow calls into one follow-up save", async () => {
    const state = createDefaultGameState(0, "full");
    const pendingSaves: Array<() => void> = [];
    const platform: Platform = {
      edition: "full",
      async load() {
        return null;
      },
      openExternal() {},
      async save() {
        await new Promise<void>((resolve) => pendingSaves.push(resolve));
      },
      setTitle() {}
    };
    const persistence = createPersistenceController({
      blocked: false,
      getState: () => state,
      platform,
      saveFailureNotifier: { report: (ok) => ok }
    });

    const first = persistence.persistNow();
    const second = persistence.persistNow();

    expect(pendingSaves).toHaveLength(1);
    pendingSaves[0]?.();
    await Promise.resolve();
    await Promise.resolve();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(pendingSaves).toHaveLength(2);
    pendingSaves[1]?.();

    await expect(first).resolves.toBe(true);
    await expect(second).resolves.toBe(true);
    expect(pendingSaves).toHaveLength(2);
  });
});
