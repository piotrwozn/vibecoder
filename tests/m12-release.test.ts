import { describe, expect, it, vi } from "vitest";

import { readFileSync } from "node:fs";

import packageJson from "../package.json";
import tauriConfig from "../src-tauri/tauri.conf.json";
import viteConfig from "../vite.config";
import { Big } from "../src/core/bignum";
import { exportGameState, importGameState } from "../src/core/save";
import { createDefaultGameState } from "../src/core/state";
import { GENERATORS } from "../src/data/generators";
import { createDesktopPlatform, isTauriRuntime } from "../src/platform/desktop";
import { createWebPlatform, WEB_SAVE_KEY } from "../src/platform/web";
import { buyHardware, getAvailableHardware } from "../src/systems/compute";
import { buyNextEra, canBuyEra, getNextEra } from "../src/systems/eras";
import { createDerivedCache, recomputeDerivedCache, buyGenerator } from "../src/systems/production";
import { getVisibleProjectOffers, startProject } from "../src/systems/projects";
import { tickStory } from "../src/systems/story";
import { buyUpgrade, getVisibleUpgrades } from "../src/systems/upgrades";

describe("M12 demo gating", () => {
  it("builds browser demo assets with relative paths for itch and Pages", () => {
    expect(viteConfig.base).toBe("./");
  });

  it("blocks E3 era upgrades in demo while allowing full saves to continue", () => {
    const demo = createDefaultGameState(1_000, "demo");
    demo.era = 2;
    demo.res.money = Big.from("1e12");
    const nextDemoEra = getNextEra(demo);

    expect(nextDemoEra?.id).toBe("e_golem");
    expect(canBuyEra(demo, nextDemoEra)).toBe(false);
    expect(buyNextEra(demo).reason).toBe("demoLocked");
    expect(demo.era).toBe(2);

    const full = createDefaultGameState(1_000, "full");
    full.era = 2;
    full.res.money = Big.from("1e12");

    expect(buyNextEra(full).ok).toBe(true);
    expect(full.era).toBe(3);
  });

  it("hides or rejects E3+ agents, hardware, projects, upgrades, and story in demo", () => {
    const demo = createDefaultGameState(1_000, "demo");
    demo.era = 3;
    demo.res.money = Big.from("1e12");
    demo.res.loc = Big.from("1e12");
    demo.story.act = 2;
    demo.story.flags.add("accepted_term_sheet");
    demo.meta.playtimeS = 1;

    const cache = createDerivedCache();
    recomputeDerivedCache(demo, cache);

    expect(buyGenerator(demo, cache, "g_intern_swarm", 1).reason).toBe("demoLocked");
    expect(getAvailableHardware(demo).some((hardware) => hardware.id === "h_rack")).toBe(false);
    expect(buyHardware(demo, "h_rack").reason).toBe("demoLocked");

    demo.projects.board = [{ id: "p_mvp", projectId: "p_mvp" }];
    expect(getVisibleProjectOffers(demo, cache)).toHaveLength(0);
    expect(startProject(demo, "p_mvp", cache).reason).toBe("demoLocked");

    expect(getVisibleUpgrades(demo).some((upgrade) => upgrade.id === "u_voice_coding")).toBe(false);
    expect(buyUpgrade(demo, cache, "u_voice_coding").reason).toBe("demoLocked");

    expect(tickStory(demo, 1, cache)).toBe(false);
    expect(demo.story.inbox).toHaveLength(0);
  });

  it("keeps demo exports importable as full desktop saves", () => {
    const demo = createDefaultGameState(1_000, "demo");
    demo.res.loc = Big.fromNumber(42);

    const imported = importGameState(exportGameState(demo), {
      edition: "full",
      nowMs: 2_000
    });

    expect(imported.ok).toBe(true);
    if (imported.ok) {
      expect(imported.state.meta.edition).toBe("full");
      expect(imported.state.res.loc.toNumber()).toBe(42);
    }
  });

  it("allows the same E3 content in full saves", () => {
    const full = createDefaultGameState(1_000, "full");
    full.era = 3;
    full.hardware.pcComplete = true;
    full.res.computeCap = 100;
    full.res.money = Big.from("1e12");
    full.res.loc = Big.from("1e12");
    full.story.act = 2;
    full.story.flags.add("accepted_term_sheet");
    full.meta.playtimeS = 1;

    const cache = createDerivedCache();
    recomputeDerivedCache(full, cache);

    expect(GENERATORS.find((generator) => generator.id === "g_intern_swarm")?.demoLocked).toBe(
      true
    );
    expect(buyGenerator(full, cache, "g_intern_swarm", 1).ok).toBe(true);
    expect(getAvailableHardware(full).some((hardware) => hardware.id === "h_rack")).toBe(true);
    expect(getVisibleUpgrades(full).some((upgrade) => upgrade.id === "u_voice_coding")).toBe(true);
    expect(tickStory(full, 1, cache)).toBe(true);
    expect(full.story.inbox[0]?.eventId).toBe("a2_01_seed");
  });
});

describe("M12 desktop platform", () => {
  it("keeps the broad Tauri global disabled while command IPC remains reachable", () => {
    expect(tauriConfig.app.withGlobalTauri).toBe(false);
    expect(isTauriRuntime({ __TAURI_INTERNALS__: { invoke: vi.fn() } })).toBe(true);
    expect(isTauriRuntime({})).toBe(false);
  });

  it("uses Tauri commands for full-edition save storage and backups", async () => {
    const invoke = vi.fn(<T>(command: string): Promise<T> => {
      if (command === "load_save") {
        return Promise.resolve('{"v":1}' as T);
      }

      if (command === "list_backups") {
        return Promise.resolve(["vibecoder_save.json.bak1"] as T);
      }

      if (command === "load_backup") {
        return Promise.resolve('{"v":7}' as T);
      }

      return Promise.resolve(undefined as T);
    });
    const host = {
      __TAURI_INTERNALS__: { invoke }
    } as Parameters<typeof createDesktopPlatform>[0];
    const platform = createDesktopPlatform(host);

    expect(isTauriRuntime(host)).toBe(true);
    expect(platform.edition).toBe("full");
    await expect(platform.load()).resolves.toBe('{"v":1}');
    await platform.save("save");
    await expect(platform.listBackups?.()).resolves.toEqual(["vibecoder_save.json.bak1"]);
    await expect(platform.loadBackup?.("vibecoder_save.json.bak1")).resolves.toBe('{"v":7}');
    await platform.backupCorrupt?.("bad", 123);
    await platform.exportFile?.("demo.txt", "save");
    platform.setTitle("VIBECODER");
    platform.openExternal("https://example.com");
    platform.quit?.();

    expect(invoke).toHaveBeenCalledWith("save_game", { data: "save" });
    expect(invoke).toHaveBeenCalledWith("backup_corrupt_save", {
      data: "bad",
      timestampMs: 123
    });
    expect(invoke).toHaveBeenCalledWith("export_file", { data: "save", name: "demo.txt" });
    expect(invoke).toHaveBeenCalledWith("set_window_title", { title: "VIBECODER" });
    expect(invoke).toHaveBeenCalledWith("open_external", { url: "https://example.com" });
    expect(invoke).toHaveBeenCalledWith("quit_app");
  });

  it("keeps rolling web backups and corrupt sidecars separate", async () => {
    const storage = new Map<string, string>();
    stubLocalStorage(storage);

    try {
      const platform = createWebPlatform();
      await platform.save("first");
      await platform.save("second");
      await platform.backupCorrupt?.("bad", 99);

      expect(storage.get(WEB_SAVE_KEY)).toBe("second");
      await expect(platform.listBackups?.()).resolves.toEqual(["vibecoder_save.bak1"]);
      await expect(platform.loadBackup?.("vibecoder_save.bak1")).resolves.toBe("first");
      expect(storage.get("vibecoder_save.corrupt.99")).toBe("bad");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("retries the primary web save after pruning backups on quota failure", async () => {
    const storage = new Map<string, string>([
      [WEB_SAVE_KEY, "old"],
      [`${WEB_SAVE_KEY}.bak1`, "older"],
      [`${WEB_SAVE_KEY}.corrupt.1`, "bad"]
    ]);
    let quotaThrown = false;

    stubLocalStorage(storage, (key, value) => {
      if (key.startsWith(`${WEB_SAVE_KEY}.bak`) && !quotaThrown) {
        quotaThrown = true;
        throw new Error("quota");
      }

      storage.set(key, value);
    });

    try {
      const platform = createWebPlatform();

      await expect(platform.save("new")).resolves.toBeUndefined();

      expect(storage.get(WEB_SAVE_KEY)).toBe("new");
      expect(storage.has(`${WEB_SAVE_KEY}.bak1`)).toBe(false);
      expect(storage.has(`${WEB_SAVE_KEY}.corrupt.1`)).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("preserves web backups when the primary retry also fails", async () => {
    const storage = new Map<string, string>([
      [WEB_SAVE_KEY, "old"],
      [`${WEB_SAVE_KEY}.bak1`, "older"],
      [`${WEB_SAVE_KEY}.corrupt.1`, "bad"]
    ]);

    stubLocalStorage(storage, (key, value) => {
      if (key === WEB_SAVE_KEY && value === "new") {
        throw new Error("quota");
      }

      storage.set(key, value);
    });

    try {
      const platform = createWebPlatform();

      await expect(platform.save("new")).rejects.toThrow("quota");

      expect(storage.get(WEB_SAVE_KEY)).toBe("old");
      expect(storage.get(`${WEB_SAVE_KEY}.bak1`)).toBe("older");
      expect(storage.get(`${WEB_SAVE_KEY}.corrupt.1`)).toBe("bad");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("keeps only the newest corrupt web sidecars", async () => {
    const storage = new Map<string, string>();
    stubLocalStorage(storage);

    try {
      const platform = createWebPlatform();

      await platform.backupCorrupt?.("bad1", 1);
      await platform.backupCorrupt?.("bad2", 2);
      await platform.backupCorrupt?.("bad3", 3);
      await platform.backupCorrupt?.("bad4", 4);

      expect([...storage.keys()].sort()).toEqual([
        `${WEB_SAVE_KEY}.corrupt.2`,
        `${WEB_SAVE_KEY}.corrupt.3`,
        `${WEB_SAVE_KEY}.corrupt.4`
      ]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("M12 release flow", () => {
  it("documents and scripts the release candidate gate", () => {
    const changelog = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");
    const checklist = readFileSync(
      new URL("../docs/release-checklist.md", import.meta.url),
      "utf8"
    );

    expect(packageJson.scripts["release:check"]).toContain("npm run check");
    expect(packageJson.scripts["release:check"]).toContain("npm run changelog:check");
    expect(packageJson.scripts["release:tauri"]).toBe("npm run tauri -- build");
    expect(changelog).toContain("## [Unreleased]");
    expect(checklist).toContain("npm run release:check");
    expect(checklist).toContain("Roadmap sprint");
  });
});

function stubLocalStorage(
  storage: Map<string, string>,
  setItem: (key: string, value: string) => void = (key, value) => storage.set(key, value)
): void {
  vi.stubGlobal("window", {
    localStorage: {
      get length() {
        return storage.size;
      },
      getItem: (key: string) => storage.get(key) ?? null,
      key: (index: number) => [...storage.keys()][index] ?? null,
      removeItem: (key: string) => {
        storage.delete(key);
      },
      setItem
    },
    open: vi.fn()
  });
}
