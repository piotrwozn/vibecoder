import { describe, expect, it, vi } from "vitest";

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
      __TAURI__: {
        core: { invoke }
      }
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

    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        }
      },
      open: vi.fn()
    });

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
});
