import { describe, expect, it, vi } from "vitest";

import { createEventBus } from "../src/core/bus";
import { Big } from "../src/core/bignum";
import { createDefaultGameState } from "../src/core/state";
import { ACHIEVEMENTS, ACHIEVEMENT_LOC_BONUS } from "../src/data/achievements";
import {
  calculateAchievementMultiplier,
  getAchievementStatKey,
  getUnlockedAchievementCount,
  tickAchievements
} from "../src/systems/achievements";
import { createDerivedCache, recomputeDerivedCache } from "../src/systems/production";
import { getLocRateSamples, tickStats } from "../src/systems/stats";
import { createAudioController } from "../src/ui/audio";

describe("M11 achievements", () => {
  it("transcribes 65+ planned achievements with a one-percent LoC bonus", () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(65);
    expect(ACHIEVEMENT_LOC_BONUS).toBe(0.01);
  });

  it("unlocks threshold achievements once and exposes the additive multiplier", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    const bus = createEventBus();
    const unlocked: string[] = [];
    bus.on("unlock", ({ id }) => {
      unlocked.push(id);
    });
    state.stats["projects.shipped"] = 10;

    expect(tickAchievements(state, cache, bus)).toBe(true);
    expect(tickAchievements(state, cache, bus)).toBe(false);

    expect(unlocked).toEqual(["a_ship_1", "a_ship_10"]);
    expect(getUnlockedAchievementCount(state)).toBe(2);
    expect(calculateAchievementMultiplier(state)).toBeCloseTo(1.02);
  });

  it("does not parse Big thresholds while ticking achievements", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    const originalFrom = Big.from;
    let calls = 0;
    Big.from = ((value) => {
      calls += 1;
      return originalFrom(value);
    }) as typeof Big.from;

    try {
      tickAchievements(state, cache);
    } finally {
      Big.from = originalFrom;
    }

    expect(calls).toBe(0);
  });

  it("requires lifetime LoC to be strictly above 1e9 for the zero-debt achievement", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.lifetime.loc = Big.from("1e9");

    tickAchievements(state, cache);

    expect(state.stats[getAchievementStatKey("a_zero_debt")]).toBeUndefined();

    state.lifetime.loc = Big.from("1.000000001e9");
    tickAchievements(state, cache);

    expect(state.stats[getAchievementStatKey("a_zero_debt")]).toBeDefined();
  });

  it("tracks uninterrupted Flow before awarding the Flow achievement", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.meta.playtimeS = 100;
    state.flow.activeUntil = 1_000;

    tickAchievements(state, cache);
    state.meta.playtimeS = 699;
    expect(tickAchievements(state, cache)).toBe(false);

    state.meta.playtimeS = 700;
    expect(tickAchievements(state, cache)).toBe(true);
    expect(state.stats[getAchievementStatKey("a_flow_10m")]).toBe(700);
  });

  it("feeds unlocked achievements into production LoC/s", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    state.owned.generators.g_autocomplete = 10;
    state.stats[getAchievementStatKey("a_ship_1")] = 1;

    recomputeDerivedCache(state, cache);

    expect(cache.multipliers.achievements).toBeCloseTo(1.01);
    expect(cache.locRate.toNumber()).toBeCloseTo(10.1);
  });
});

describe("M11 audio", () => {
  it("turns unavailable WebAudio into a no-op instead of throwing", () => {
    vi.stubGlobal("window", {
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      }
    });

    expect(() => createAudioController({ sound: true, volume: 0.3 }).play("ship")).not.toThrow();
    vi.unstubAllGlobals();
  });

  it("turns AudioContext constructor failures into a no-op instead of throwing", () => {
    vi.stubGlobal("window", {
      AudioContext: class {
        constructor() {
          throw new Error("blocked");
        }
      },
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      }
    });

    expect(() => createAudioController({ sound: true, volume: 0.3 }).play("ship")).not.toThrow();
    vi.unstubAllGlobals();
  });

  it("defers browser audio until the first user gesture", () => {
    let contexts = 0;
    const listeners = new Map<string, EventListener>();

    class FakeAudioContext {
      destination = {};

      constructor() {
        contexts += 1;
      }

      createGain() {
        return {
          connect(): void {},
          disconnect(): void {},
          gain: { value: 0 }
        };
      }

      createOscillator() {
        return {
          connect(): void {},
          disconnect(): void {},
          frequency: { value: 0 },
          start(): void {},
          stop(): void {},
          type: "sine"
        };
      }

      resume(): Promise<void> {
        return Promise.resolve();
      }
    }

    vi.stubGlobal("window", {
      AudioContext: FakeAudioContext,
      document: {
        addEventListener(type: string, listener: EventListener): void {
          listeners.set(type, listener);
        },
        removeEventListener(type: string): void {
          listeners.delete(type);
        }
      },
      navigator: { userActivation: { hasBeenActive: false } },
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      }
    });

    const audio = createAudioController({ sound: true, volume: 0.3 });
    audio.play("click");

    expect(contexts).toBe(0);

    listeners.get("pointerdown")?.(new Event("pointerdown"));
    audio.play("click");

    expect(contexts).toBe(1);
    vi.unstubAllGlobals();
  });

  it("uses webkitAudioContext when standard AudioContext is unavailable", () => {
    let resumed = false;
    let stopped = false;
    class WebkitAudioContext {
      destination = {};

      createGain() {
        return {
          connect(): void {},
          disconnect(): void {},
          gain: { value: 0 }
        };
      }

      createOscillator() {
        return {
          connect(): void {},
          disconnect(): void {},
          frequency: { value: 0 },
          start(): void {},
          stop(): void {
            stopped = true;
          },
          type: "sine"
        };
      }

      resume(): Promise<void> {
        resumed = true;
        return Promise.resolve();
      }
    }

    vi.stubGlobal("window", {
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
      webkitAudioContext: WebkitAudioContext
    });

    createAudioController({ sound: true, volume: 0.3 }).play("click");

    expect(resumed).toBe(true);
    expect(stopped).toBe(true);
    vi.unstubAllGlobals();
  });

  it("keeps browser requestAnimationFrame bound while scheduling cleanup", () => {
    let stopped = false;
    class FakeAudioContext {
      destination = {};

      createGain() {
        return {
          connect(): void {},
          disconnect(): void {},
          gain: { value: 0 }
        };
      }

      createOscillator() {
        return {
          connect(): void {},
          disconnect(): void {},
          frequency: { value: 0 },
          start(): void {},
          stop(): void {
            stopped = true;
          },
          type: "sine"
        };
      }

      resume(): Promise<void> {
        return Promise.resolve();
      }
    }

    interface FakeWindow {
      AudioContext: typeof FakeAudioContext;
      requestAnimationFrame(this: FakeWindow, callback: FrameRequestCallback): number;
    }

    const fakeWindow: FakeWindow = {
      AudioContext: FakeAudioContext,
      requestAnimationFrame(callback): number {
        if (this !== fakeWindow) {
          throw new TypeError("Illegal invocation");
        }

        callback(0);
        return 1;
      }
    };

    vi.stubGlobal("window", fakeWindow);

    expect(() => createAudioController({ sound: true, volume: 0.3 }).play("click")).not.toThrow();
    expect(stopped).toBe(true);
    vi.unstubAllGlobals();
  });

  it("plays bundled CC0 samples and starts background music when Audio is available", () => {
    const played: string[] = [];

    class FakeHtmlAudio {
      loop = false;
      paused = true;
      preload = "";
      volume = 0;

      constructor(readonly src = "") {}

      play(): Promise<void> {
        this.paused = false;
        played.push(this.src);
        return Promise.resolve();
      }

      pause(): void {
        this.paused = true;
      }
    }

    vi.stubGlobal("window", {
      Audio: FakeHtmlAudio
    });

    createAudioController({ sound: true, volume: 0.3 }).play("message");

    expect(played.some((src) => src.includes("music-out-there.ogg"))).toBe(true);
    expect(played.some((src) => src.includes("ui-message.ogg"))).toBe(true);
    vi.unstubAllGlobals();
  });

  it("falls back to WebAudio effects and ambient when OGG playback is unavailable", () => {
    let started = 0;
    let stopped = 0;
    let htmlPlayCalls = 0;

    class FakeAudioContext {
      destination = {};

      createGain() {
        return {
          connect(): void {},
          disconnect(): void {},
          gain: { value: 0 }
        };
      }

      createOscillator() {
        return {
          connect(): void {},
          disconnect(): void {},
          frequency: { value: 0 },
          start(): void {
            started += 1;
          },
          stop(): void {
            stopped += 1;
          },
          type: "sine"
        };
      }

      resume(): Promise<void> {
        return Promise.resolve();
      }
    }

    class FakeHtmlAudio {
      loop = false;
      paused = true;
      preload = "";
      volume = 0;

      constructor(readonly src = "") {}

      canPlayType(): CanPlayTypeResult {
        return "";
      }

      play(): Promise<void> {
        htmlPlayCalls += 1;
        return Promise.resolve();
      }

      pause(): void {
        this.paused = true;
      }
    }

    vi.stubGlobal("window", {
      Audio: FakeHtmlAudio,
      AudioContext: FakeAudioContext,
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      }
    });

    createAudioController({ sound: true, volume: 0.3 }).play("message");

    expect(htmlPlayCalls).toBe(0);
    expect(started).toBe(3);
    expect(stopped).toBe(1);
    vi.unstubAllGlobals();
  });

  it("pauses background music when sound is disabled", () => {
    const created: FakeHtmlAudio[] = [];

    class FakeHtmlAudio {
      loop = false;
      paused = true;
      preload = "";
      volume = 0;

      constructor(readonly src = "") {
        created.push(this);
      }

      play(): Promise<void> {
        this.paused = false;
        return Promise.resolve();
      }

      pause(): void {
        this.paused = true;
      }
    }

    vi.stubGlobal("window", {
      Audio: FakeHtmlAudio
    });

    const audio = createAudioController({ sound: true, volume: 0.3 });
    audio.play("unlock");
    audio.setSettings({ sound: false, volume: 0.3 });

    const music = created.find((item) => item.src.includes("music-out-there.ogg"));

    expect(music?.paused).toBe(true);
    vi.unstubAllGlobals();
  });
});

describe("M11 stats sampling", () => {
  it("samples LoC/s every 30 seconds for the sparkline", () => {
    const state = createDefaultGameState();
    const cache = createDerivedCache();
    cache.locRate = Big.fromNumber(5);

    state.meta.playtimeS = 29;
    expect(tickStats(state, cache)).toBe(false);
    expect(getLocRateSamples(state)).toEqual([]);

    state.meta.playtimeS = 30;
    expect(tickStats(state, cache)).toBe(true);
    cache.locRate = Big.fromNumber(8);
    state.meta.playtimeS = 60;
    expect(tickStats(state, cache)).toBe(true);

    expect(getLocRateSamples(state).map((sample) => sample.toNumber())).toEqual([5, 8]);
  });
});
