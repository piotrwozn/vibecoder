import { describe, expect, it, vi } from "vitest";

import v1Fixture from "./fixtures/saves/v1.json";
import v2Fixture from "./fixtures/saves/v2.json";
import v3Fixture from "./fixtures/saves/v3.json";
import v4Fixture from "./fixtures/saves/v4.json";
import v5Fixture from "./fixtures/saves/v5.json";
import v6Fixture from "./fixtures/saves/v6.json";
import v7Fixture from "./fixtures/saves/v7.json";
import v8Fixture from "./fixtures/saves/v8.json";
import v9Fixture from "./fixtures/saves/v9.json";
import v10Fixture from "./fixtures/saves/v10.json";
import v11Fixture from "./fixtures/saves/v11.json";
import { Big } from "../src/core/bignum";
import { SAVE_VERSION } from "../src/core/migrations";
import { deriveSeed } from "../src/core/rng";
import {
  deserializeGameState,
  exportGameState,
  importGameState,
  loadGameState,
  saveGameState,
  serializeGameState,
  shouldBlockPersistenceAfterLoad
} from "../src/core/save";
import { createDefaultGameState } from "../src/core/state";
import { C } from "../src/data/constants";
import { LEGACY_HARDWARE_ID } from "../src/data/hardware";
import { recomputeComputeCap } from "../src/systems/compute";
import {
  createDerivedCache,
  recomputeDerivedCache,
  tickProduction
} from "../src/systems/production";
import { isStoryInboxEntryUnread } from "../src/systems/story";
import { createWebPlatform, WEB_SAVE_KEY } from "../src/platform/web";

describe("M4 save/load", () => {
  it("round-trips Big values, Sets, arrays, and settings", () => {
    const state = createDefaultGameState(1_000, "demo");
    state.meta.lastSeen = 2_000;
    state.res.loc = Big.fromNumber(123);
    state.res.money = Big.fromNumber(456);
    state.owned.research.add("r_test");
    state.projects.portfolio.push({
      id: "p_llama_todo.1",
      bugged: false,
      level: 1,
      projectId: "p_llama_todo",
      revenue: Big.fromNumber(7),
      shippedAtS: 10
    });
    state.settings.notation = "suffix";
    state.settings.doNotDisturb = true;
    state.settings.vibexLocalAi = true;
    state.vibex = {
      cannedSeed: 123,
      codeSeed: 456
    };
    state.ui.tutorial = {
      active: true,
      completed: false,
      step: "projects"
    };

    const result = deserializeGameState(serializeGameState(state), {
      edition: "demo",
      nowMs: 9_000
    });

    expect(result.repaired).toBe(false);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.res.loc.toNumber()).toBe(123);
    expect(result.state.res.money.toNumber()).toBeCloseTo(456);
    expect(result.state.owned.research.has("r_test")).toBe(true);
    expect(result.state.projects.portfolio[0]?.level).toBe(1);
    expect(result.state.projects.portfolio[0]?.revenue.toNumber()).toBe(7);
    expect(result.state.settings.notation).toBe("suffix");
    expect(result.state.settings.doNotDisturb).toBe(true);
    expect(result.state.settings.vibexLocalAi).toBe(true);
    expect(result.state.vibex).toEqual({ cannedSeed: 123, codeSeed: 456 });
    expect(result.state.ui.tutorial).toEqual({
      active: true,
      completed: false,
      step: "projects"
    });
    expect(result.state.meta.lastSeen).toBe(2_000);
    expect(result.state.meta.lastSimTickMs).toBe(1_000);
  });

  it("repairs broken localStorage JSON into a bootable default state", async () => {
    const backupCorrupt = vi.fn<() => Promise<void>>(() => Promise.resolve());
    const result = await loadGameState(
      {
        backupCorrupt,
        edition: "demo",
        listBackups: async () => [],
        load: async () => "{broken"
      },
      42
    );

    expect(result.repaired).toBe(true);
    expect(result.reset).toBe(true);
    expect(result.resetReason).toBe("corrupt");
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.meta.lastSeen).toBe(42);
    expect(result.state.meta.lastSimTickMs).toBe(42);
    expect(result.state.res.loc.eq0()).toBe(true);
    expect(backupCorrupt).toHaveBeenCalledWith("{broken", 42);
  });

  it("backs up non-object save roots before resetting", async () => {
    const backupCorrupt = vi.fn<() => Promise<void>>(() => Promise.resolve());
    const result = await loadGameState(
      {
        backupCorrupt,
        edition: "demo",
        listBackups: async () => [],
        load: async () => "[]"
      },
      43
    );

    expect(result.reset).toBe(true);
    expect(result.warnings).toContain("save root was not an object");
    expect(backupCorrupt).toHaveBeenCalledWith("[]", 43);
  });

  it("restores the most recent valid backup when the primary save is corrupt", async () => {
    const backupState = createDefaultGameState(100, "demo");
    backupState.res.loc = Big.fromNumber(77);
    const backupCorrupt = vi.fn<() => Promise<void>>(() => Promise.resolve());

    const result = await loadGameState(
      {
        backupCorrupt,
        edition: "demo",
        listBackups: async () => ["vibecoder_save.bak1"],
        load: async () => "{broken",
        loadBackup: async () => serializeGameState(backupState)
      },
      44
    );

    expect(result.reset).toBe(false);
    expect(result.repaired).toBe(true);
    expect(result.warnings).toContain("save restored from backup");
    expect(result.state.res.loc.toNumber()).toBe(77);
    expect(backupCorrupt).toHaveBeenCalledWith("{broken", 44);
  });

  it("restores the most recent valid backup when the primary save is missing", async () => {
    const backupState = createDefaultGameState(100, "demo");
    backupState.res.loc = Big.fromNumber(77);
    const backupCorrupt = vi.fn<() => Promise<void>>(() => Promise.resolve());

    const result = await loadGameState(
      {
        backupCorrupt,
        edition: "demo",
        listBackups: async () => ["vibecoder_save.bak1"],
        load: async () => null,
        loadBackup: async () => serializeGameState(backupState)
      },
      44
    );

    expect(result.reset).toBe(false);
    expect(result.repaired).toBe(true);
    expect(result.warnings).toContain("save restored from backup");
    expect(result.state.res.loc.toNumber()).toBe(77);
    expect(backupCorrupt).not.toHaveBeenCalled();
  });

  it("restores the most recent valid backup when primary load throws", async () => {
    const backupState = createDefaultGameState(100, "demo");
    backupState.res.money = Big.fromNumber(55);

    const result = await loadGameState(
      {
        backupCorrupt: async () => {},
        edition: "demo",
        listBackups: async () => ["vibecoder_save.bak1"],
        load: async () => {
          throw new Error("locked");
        },
        loadBackup: async () => serializeGameState(backupState)
      },
      45
    );

    expect(result.reset).toBe(false);
    expect(result.repaired).toBe(true);
    expect(result.warnings).toContain("save load failed");
    expect(result.warnings).toContain("save restored from backup");
    expect(result.state.res.money.toNumber()).toBe(55);
  });

  it("restores lastSeen in memory when a save write fails", async () => {
    const state = createDefaultGameState(1_000, "demo");
    state.meta.lastSeen = 1_234;

    const saved = await saveGameState(
      {
        save: async () => {
          throw new Error("disk full");
        }
      },
      state,
      9_999
    );

    expect(saved).toBe(false);
    expect(state.meta.lastSeen).toBe(1_234);
  });

  it("repairs negative Big resources to non-negative defaults", () => {
    const raw = JSON.parse(serializeGameState(createDefaultGameState(1_000, "demo"))) as {
      res: Record<string, string>;
    };
    raw.res.debt = "-3e0";
    raw.res.insight = "-4e0";
    raw.res.loc = "-5e0";
    raw.res.money = "-7e0";

    const result = deserializeGameState(JSON.stringify(raw), {
      edition: "demo",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.res.debt.eq0()).toBe(true);
    expect(result.state.res.insight.eq0()).toBe(true);
    expect(result.state.res.loc.eq0()).toBe(true);
    expect(result.state.res.money.eq0()).toBe(true);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        "res.debt repaired",
        "res.insight repaired",
        "res.loc repaired",
        "res.money repaired"
      ])
    );
  });

  it("repairs unsafe save boundary values and marks invalid stat shapes", () => {
    const raw = JSON.parse(serializeGameState(createDefaultGameState(1_000, "demo"))) as {
      era: number;
      owned: {
        generators: Record<string, number>;
        hardware: Record<string, number>;
      };
      settings: { autosaveS: number };
      stats: Record<string, unknown>;
    };
    raw.era = 0;
    raw.settings.autosaveS = 0.001;
    raw.owned.generators.unknown_generator = 10;
    raw.owned.hardware.unknown_hardware = 2;
    raw.stats.validBig = { m: 1.5, e: 3 };
    raw.stats.invalidBoolean = true;
    raw.stats.invalidBigShape = { m: "1.5", e: 3 };

    const result = deserializeGameState(JSON.stringify(raw), {
      edition: "demo",
      nowMs: 2_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.era).toBe(1);
    expect(result.state.settings.autosaveS).toBe(10);
    expect(result.state.owned.generators.unknown_generator).toBeUndefined();
    expect(result.state.owned.hardware.unknown_hardware).toBeUndefined();
    expect(result.state.stats.validBig).toBeInstanceOf(Big);
    expect(result.state.stats.invalidBoolean).toBeUndefined();
    expect(result.state.stats.invalidBigShape).toBeUndefined();
    expect(result.warnings).toContain("era repaired");
    expect(result.warnings).toContain("settings.autosaveS repaired");
    expect(result.warnings).toContain("owned.generators.unknown_generator repaired");
    expect(result.warnings).toContain("owned.hardware.unknown_hardware repaired");
    expect(result.warnings).toContain("stats.invalidBoolean repaired");
    expect(result.warnings).toContain("stats.invalidBigShape repaired");
  });

  it("drops orphan project and bug references during save repair", () => {
    const raw = JSON.parse(serializeGameState(createDefaultGameState(1_000, "demo"))) as {
      bugs: Array<{ productId: string }>;
      projects: {
        active: Array<Record<string, unknown>>;
        board: Array<Record<string, unknown>>;
        portfolio: Array<Record<string, unknown>>;
      };
    };
    raw.projects.board = [
      { id: "missing.offer", projectId: "missing_project" },
      { id: "p_landing", projectId: "p_landing" }
    ];
    raw.projects.active = [
      {
        id: "missing.build",
        buildS: 1,
        cost: "0e0",
        elapsedS: 0,
        payout: "0e0",
        projectId: "missing_project",
        revenue: "0e0"
      },
      {
        id: "p_refactor.build",
        buildS: 1,
        cost: "0e0",
        elapsedS: 0,
        payout: "0e0",
        projectId: "p_refactor",
        revenue: "0e0"
      }
    ];
    raw.projects.portfolio = [
      {
        id: "missing.1",
        bugged: true,
        level: 1,
        projectId: "missing_project",
        revenue: "10e0",
        shippedAtS: 0
      },
      {
        id: "p_landing.1",
        bugged: false,
        level: 1,
        projectId: "p_landing",
        revenue: "10e0",
        shippedAtS: 0
      },
      {
        id: "p_micro_saas.1",
        bugged: true,
        level: 1,
        projectId: "p_micro_saas",
        revenue: "10e0",
        shippedAtS: 0
      }
    ];
    raw.bugs = [
      { productId: "missing.1" },
      { productId: "p_landing.1" },
      { productId: "p_micro_saas.1" }
    ];

    const result = deserializeGameState(JSON.stringify(raw), {
      edition: "demo",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.projects.board).toEqual([{ id: "p_landing", projectId: "p_landing" }]);
    expect(result.state.projects.active.map((build) => build.projectId)).toEqual(["p_refactor"]);
    expect(result.state.projects.portfolio.map((product) => product.id)).toEqual([
      "p_landing.1",
      "p_micro_saas.1"
    ]);
    expect(result.state.bugs).toEqual([{ productId: "p_micro_saas.1" }]);
  });

  it("allows a fresh boot to overwrite a corrupt primary after keeping one sidecar", async () => {
    const storage = new Map<string, string>([[WEB_SAVE_KEY, "{broken"]]);

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
      const loaded = await loadGameState(platform, 100);
      const persistenceBlocked = shouldBlockPersistenceAfterLoad(loaded);

      expect(loaded.reset).toBe(true);
      expect(loaded.resetReason).toBe("corrupt");
      expect(persistenceBlocked).toBe(false);
      await expect(saveGameState(platform, loaded.state, 101)).resolves.toBe(true);

      const reloaded = await loadGameState(platform, 102);
      const corruptKeys = Array.from(storage.keys()).filter((key) =>
        key.startsWith(`${WEB_SAVE_KEY}.corrupt.`)
      );

      expect(reloaded.reset).toBe(false);
      expect(reloaded.state.meta.lastSeen).toBe(101);
      expect(storage.get(WEB_SAVE_KEY)).not.toBe("{broken");
      expect(corruptKeys).toEqual([`${WEB_SAVE_KEY}.corrupt.100`]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("restores a backup for newer saves without allowing autosave to downgrade the primary", async () => {
    const raw = JSON.stringify({ v: 999 });
    const backupState = createDefaultGameState(1, "demo");
    backupState.res.loc = Big.fromNumber(123);
    const backupCorrupt = vi.fn<() => Promise<void>>(() => Promise.resolve());
    const listBackups = vi.fn<() => Promise<string[]>>(() => Promise.resolve(["bak1"]));

    const result = await loadGameState(
      {
        backupCorrupt,
        edition: "demo",
        listBackups,
        load: async () => raw,
        loadBackup: async () => serializeGameState(backupState)
      },
      45
    );

    expect(result.reset).toBe(true);
    expect(result.resetReason).toBe("newer-version");
    expect(result.state.res.loc.toNumber()).toBe(123);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.warnings[0]).toContain("newer than this build");
    expect(result.warnings).toContain("save restored from backup");
    expect(backupCorrupt).toHaveBeenCalledWith(raw, 45);
    expect(listBackups).toHaveBeenCalled();
    expect(shouldBlockPersistenceAfterLoad(result)).toBe(true);
  });

  it("exports and imports base64 saves while adopting the current edition", () => {
    const state = createDefaultGameState(1_000, "demo");
    state.res.loc = Big.fromNumber(99);

    const imported = importGameState(exportGameState(state), {
      edition: "full",
      nowMs: 5_000
    });

    expect(imported.ok).toBe(true);
    if (imported.ok) {
      expect(imported.state.meta.edition).toBe("full");
      expect(imported.state.res.loc.toNumber()).toBe(99);
    }

    expect(importGameState("not a save").ok).toBe(false);
  });

  it("repairs unsupported imported languages to English", () => {
    const raw = JSON.parse(serializeGameState(createDefaultGameState(1_000, "demo"))) as {
      settings: { lang: string };
    };
    raw.settings.lang = "fr";
    const payload = Buffer.from(JSON.stringify(raw), "utf8").toString("base64");

    const imported = importGameState(payload, {
      edition: "demo",
      nowMs: 5_000
    });

    expect(imported.ok).toBe(true);
    if (imported.ok) {
      expect(imported.reset).toBe(false);
      expect(imported.repaired).toBe(true);
      expect(imported.state.settings.lang).toBe("en");
    }
  });

  it("migrates the v1 fixture to the desktop shell and boots headless for 60 seconds", () => {
    const result = deserializeGameState(JSON.stringify(v1Fixture), {
      edition: "demo",
      nowMs: 10_000
    });
    const cache = createDerivedCache();

    recomputeDerivedCache(result.state, cache);
    tickProduction(result.state, cache, 60);

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.ui.scene).toBe("desktop");
    expect(result.state.ui.bootSeen).toBe(true);
    expect(result.state.ui.tutorial).toEqual({
      active: false,
      completed: false,
      step: "welcome"
    });
    expect(result.state.ui.windows.agents.open).toBe(false);
  });

  it("migrates the v2 fixture to split M14 apps", () => {
    const result = deserializeGameState(JSON.stringify(v2Fixture), {
      edition: "demo",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.settings.doNotDisturb).toBe(false);
    expect(result.state.settings.skipIntro).toBe(false);
    expect(result.state.ui.windows.agents.open).toBe(true);
    expect(result.state.ui.windows.hardware.open).toBe(false);
    expect(result.state.ui.windows.upgrades.open).toBe(false);
    expect(result.state.ui.windows.chat.appId).toBe("chat");
    expect(result.state.ui.windows.mail.appId).toBe("mail");
    expect(result.state.ui.windows.feed.appId).toBe("feed");
    expect((result.state.ui.windows as Record<string, unknown>).comms).toBeUndefined();
  });

  it("migrates the v3 fixture to M15 local AI settings", () => {
    const result = deserializeGameState(JSON.stringify(v3Fixture), {
      edition: "demo",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.settings.vibexLocalAi).toBe(false);
    expect(result.state.settings.doNotDisturb).toBe(false);
  });

  it("migrates the v4 old hardware tiers to M16 legacy cap", () => {
    const result = deserializeGameState(JSON.stringify(v4Fixture), {
      edition: "full",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.owned.hardware[LEGACY_HARDWARE_ID]).toBe(3124);
    expect(result.state.owned.hardware.h_gaming_rig).toBeUndefined();
    expect(result.state.res.computeCap).toBe(3130);
    expect(recomputeComputeCap(result.state)).toBe(3130);
    expect(result.state.hardware.pcComplete).toBe(true);
    expect(result.state.res.computeCap).toBe(C.HW_BASE_CAP + 3124);
    expect(result.state.ui.tutorial).toEqual({
      active: false,
      completed: true,
      step: "done"
    });
  });

  it("migrates v5 saves to v6 with completed tutorial for established runs", () => {
    const result = deserializeGameState(JSON.stringify(v5Fixture), {
      edition: "full",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.ui.tutorial).toEqual({
      active: false,
      completed: true,
      step: "done"
    });
    expect(result.state.owned.hardware[LEGACY_HARDWARE_ID]).toBe(3124);
  });

  it("migrates v6 saves with locked Aurora and a repaired Aurora window", () => {
    const result = deserializeGameState(JSON.stringify(v6Fixture), {
      edition: "full",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.meta.lastSimTickMs).toBe(1000);
    expect(result.state.aurora).toEqual({
      billingPaused: false,
      completed: false,
      currentPhase: 0,
      dedicatedServers: 0,
      hostedServers: 0,
      phaseActive: false,
      phaseElapsedS: 0,
      status: "locked",
      unlocked: false
    });
    expect(result.state.ui.windows.aurora.appId).toBe("aurora");
    expect(result.state.ui.windows.aurora.open).toBe(false);
  });

  it("migrates v7 saves to v10 with a dedicated offline anchor and inbox entry ids", () => {
    const result = deserializeGameState(JSON.stringify(v7Fixture), {
      edition: "full",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.meta.lastSeen).toBe(1000);
    expect(result.state.meta.lastSimTickMs).toBe(1000);
    expect(result.state.aurora.status).toBe("locked");
    expect(result.state.story.inbox[0]).toEqual({
      id: "a1_10_act_end.1",
      eventId: "a1_10_act_end"
    });
  });

  it("migrates v8 saves to v10 with stable inbox read flags", () => {
    const result = deserializeGameState(JSON.stringify(v8Fixture), {
      edition: "full",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.story.inbox[0]).toEqual({
      id: "a1_10_act_end.1",
      eventId: "a1_10_act_end"
    });
    expect(isStoryInboxEntryUnread(result.state, result.state.story.inbox[0]!, 0)).toBe(false);
  });

  it("migrates v9 saves to v10 with independent persisted Vibex seeds", () => {
    const result = deserializeGameState(JSON.stringify(v9Fixture), {
      edition: "full",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.vibex).toEqual({
      cannedSeed: deriveSeed(1, "vibex.canned"),
      codeSeed: deriveSeed(1, "vibex.code")
    });
    expect(result.state.vibex.cannedSeed).not.toBe(result.state.vibex.codeSeed);
  });

  it("migrates the v10 fixture through project-level and roadmap migrations", () => {
    const result = deserializeGameState(JSON.stringify(v10Fixture), {
      edition: "full",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.vibex).toEqual({
      cannedSeed: deriveSeed(1, "vibex.canned"),
      codeSeed: deriveSeed(1, "vibex.code")
    });
    expect(result.state.roadmap.completed).toBe(0);
    expect(result.state.incidents.active).toEqual([]);
    expect(result.state.metaprogression.runStyle).toBeUndefined();
  });

  it("migrates the v11 fixture to v12 without losing project levels or bugs", () => {
    const result = deserializeGameState(JSON.stringify(v11Fixture), {
      edition: "full",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.projects.portfolio[0]?.level).toBe(2);
    expect(result.state.bugs).toEqual([{ productId: "p_landing.1" }]);
    expect(result.state.roadmap).toEqual({
      completed: 0,
      cooldownUntilS: 0,
      endsAtS: 0,
      startedAtS: 0
    });
    expect(result.state.incidents).toEqual({
      active: [],
      history: [],
      nextCheckAtS: 0
    });
  });

  it("migrates v10 duplicate project products into capped levels and remaps bugs", () => {
    const raw = JSON.parse(serializeGameState(createDefaultGameState(1_000, "demo"))) as {
      bugs: Array<{ productId: string }>;
      projects: {
        portfolio: Array<Record<string, unknown>>;
      };
      v: number;
    };
    raw.v = 10;
    raw.projects.portfolio = Array.from({ length: 6 }, (_entry, index) => ({
      id: `p_landing.${index + 1}`,
      bugged: index === 1,
      projectId: "p_landing",
      revenue: `${1 + index}e0`,
      shippedAtS: 10 + index
    }));
    raw.projects.portfolio.push({
      id: "p_micro_saas.1",
      bugged: false,
      projectId: "p_micro_saas",
      revenue: "4e0",
      shippedAtS: 100
    });
    raw.bugs = [{ productId: "p_landing.2" }, { productId: "missing" }];

    const result = deserializeGameState(JSON.stringify(raw), {
      edition: "demo",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.projects.portfolio).toHaveLength(2);
    expect(result.state.projects.portfolio[0]).toMatchObject({
      bugged: true,
      id: "p_landing.1",
      level: 6,
      projectId: "p_landing",
      shippedAtS: 10
    });
    expect(result.state.projects.portfolio[0]?.revenue.toNumber()).toBeCloseTo(21);
    expect(result.state.projects.portfolio[1]).toMatchObject({
      id: "p_micro_saas.1",
      level: 1,
      projectId: "p_micro_saas"
    });
    expect(result.state.bugs).toEqual([{ productId: "p_landing.1" }]);
  });

  it("keeps stable inbox read state when repair drops malformed rows", () => {
    const raw = JSON.parse(serializeGameState(createDefaultGameState(1_000, "demo"))) as {
      story: {
        flags: string[];
        inbox: unknown[];
      };
    };
    raw.story.inbox = [null, { id: "a0_01_boot.keep", eventId: "a0_01_boot" }];
    raw.story.flags = ["story.read.a0_01_boot.keep"];

    const result = deserializeGameState(JSON.stringify(raw), {
      edition: "demo",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.story.inbox).toEqual([{ id: "a0_01_boot.keep", eventId: "a0_01_boot" }]);
    expect(isStoryInboxEntryUnread(result.state, result.state.story.inbox[0]!, 0)).toBe(false);
  });

  it("round-trips v10 Aurora progress, hosting, and dedicated servers", () => {
    const state = createDefaultGameState(1_000, "full");
    state.aurora = {
      billingPaused: true,
      completed: false,
      currentPhase: 3,
      dedicatedServers: 2,
      hostedServers: 4,
      phaseActive: true,
      phaseElapsedS: 123,
      status: "billing",
      unlocked: true
    };

    const result = deserializeGameState(serializeGameState(state), {
      edition: "full",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(false);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.aurora).toEqual(state.aurora);
  });

  it("migrates v12 saves with default bank state", () => {
    const raw = JSON.parse(serializeGameState(createDefaultGameState(1_000, "full"))) as {
      bank?: unknown;
      v: number;
    };
    raw.v = 12;
    delete raw.bank;

    const result = deserializeGameState(JSON.stringify(raw), {
      edition: "full",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.v).toBe(SAVE_VERSION);
    expect(result.state.bank.defaulted).toBe(false);
    expect(result.state.bank.overdraft.eq0()).toBe(true);
    expect(result.state.bank.warningsIssued).toBe(0);
  });

  it("repairs bankrupt bank state from corrupt saves", () => {
    const raw = JSON.parse(serializeGameState(createDefaultGameState(1_000, "full"))) as {
      bank: {
        defaulted: boolean;
        defaultedAtS?: unknown;
        overdraft: unknown;
        warningsIssued: unknown;
      };
    };
    raw.bank = {
      defaulted: false,
      defaultedAtS: "bad",
      overdraft: "10000e0",
      warningsIssued: 99
    };

    const result = deserializeGameState(JSON.stringify(raw), {
      edition: "full",
      nowMs: 10_000
    });

    expect(result.repaired).toBe(true);
    expect(result.state.bank.defaulted).toBe(true);
    expect(result.state.bank.defaultedAtS).toBe(0);
    expect(result.state.bank.overdraft.toNumber()).toBe(10_000);
    expect(result.state.bank.warningsIssued).toBe(2);
  });
});
