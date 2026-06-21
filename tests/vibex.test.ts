import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { createDefaultGameState } from "../src/core/state";
import {
  VIBEX_CANNED_PAIRS,
  VIBEX_CODE_FILES,
  VIBEX_MANUAL_FALLBACK_KEYS
} from "../src/data/vibex";
import { createDerivedCache, recomputeDerivedCache } from "../src/systems/production";
import { performPromptClick } from "../src/systems/prompt";
import {
  advanceVibexCode,
  createVibexCannedBag,
  createVibexCodeState,
  drawVibexCannedPair,
  getVibexFileLabelKey,
  getVibexManualFallbackKey
} from "../src/systems/vibex";

describe("M15 Vibex", () => {
  it("draws canned pairs as a shuffle bag without repeats inside a cycle", () => {
    const bag = createVibexCannedBag(123);
    const drawn = new Set<string>();

    for (let i = 0; i < VIBEX_CANNED_PAIRS.length; i += 1) {
      drawn.add(drawVibexCannedPair(bag).promptKey);
    }

    expect(drawn.size).toBe(VIBEX_CANNED_PAIRS.length);
    expect(bag.remainingIds).toHaveLength(0);
  });

  it("does not immediately repeat the last canned pair when the bag refills", () => {
    const bag = createVibexCannedBag(456);
    let previous = "";

    for (let i = 0; i < VIBEX_CANNED_PAIRS.length; i += 1) {
      previous = drawVibexCannedPair(bag).promptKey;
    }

    const next = drawVibexCannedPair(bag).promptKey;

    expect(next).not.toBe(previous);
  });

  it("advances code pseudo-randomly and emits one commit every ten sends", () => {
    const state = createVibexCodeState(321);
    const frames = Array.from({ length: 20 }, () => advanceVibexCode(state));
    const touchedFiles = new Set(frames.map((frame) => frame.fileId));

    expect(touchedFiles.size).toBeGreaterThan(1);
    expect(frames.filter((frame) => frame.committed).map((frame) => frame.sequence)).toEqual([
      10, 20
    ]);
    expect(advanceVibexCode(state).committed).toBe(false);
  });

  it("rotates visible file names after a commit batch", () => {
    const state = createVibexCodeState(654);
    const initialLabels = VIBEX_CODE_FILES.map((_, index) => getVibexFileLabelKey(state, index));

    for (let i = 0; i < 10; i += 1) {
      advanceVibexCode(state);
    }

    const nextLabels = VIBEX_CODE_FILES.map((_, index) => getVibexFileLabelKey(state, index));

    expect(nextLabels).not.toEqual(initialLabels);
  });

  it("rotates manual prompt fallback responses instead of using one canned line", () => {
    const keys = Array.from({ length: VIBEX_MANUAL_FALLBACK_KEYS.length }, (_, index) =>
      getVibexManualFallbackKey(index)
    );

    expect(new Set(keys).size).toBe(VIBEX_MANUAL_FALLBACK_KEYS.length);
    expect(getVibexManualFallbackKey(VIBEX_MANUAL_FALLBACK_KEYS.length)).toBe(keys[0]);
  });

  it("keeps Send on the existing PROMPT burst while Vibex visuals advance", () => {
    const promptOnly = createDefaultGameState();
    const promptOnlyCache = createDerivedCache();
    recomputeDerivedCache(promptOnly, promptOnlyCache);

    const vibexSend = createDefaultGameState();
    const vibexSendCache = createDerivedCache();
    recomputeDerivedCache(vibexSend, vibexSendCache);

    const visualState = createVibexCodeState();
    const cannedBag = createVibexCannedBag(789);
    advanceVibexCode(visualState);
    drawVibexCannedPair(cannedBag);

    const promptOnlyGain = performPromptClick(promptOnly, promptOnlyCache, 0);
    const vibexSendGain = performPromptClick(vibexSend, vibexSendCache, 0);

    expect(vibexSendGain.eq(promptOnlyGain)).toBe(true);
    expect(vibexSend.res.loc.eq(promptOnly.res.loc)).toBe(true);
    expect(vibexSend.flow.meter).toBe(promptOnly.flow.meter);
  });

  it("loads the bundled GGUF directly from the served model folder without Wllama URL cache", () => {
    const source = readFileSync("src/platform/ai.worker.ts", "utf8");

    expect(source).toContain("import.meta.env.DEV");
    expect(source).toContain("`/models/${MODEL_FILE}`");
    expect(source).toContain("new URL(`../models/${MODEL_FILE}`, self.location.href).href");
    expect(source).toContain("fetch(BUNDLED_MODEL_URL)");
    expect(source).toContain("instance.loadModel([model], loadOptions)");
    expect(source).not.toContain("loadModelFromUrl");
    expect(source).not.toContain("loadModelFromHF");
  });

  it("clears local AI progress after a worker error so the UI does not show endless loading", async () => {
    class FakeWorker {
      static last: FakeWorker | undefined;

      private readonly listeners = new Map<string, Array<(event: { data: unknown }) => void>>();

      constructor() {
        FakeWorker.last = this;
      }

      addEventListener(type: string, listener: (event: { data: unknown }) => void): void {
        this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
      }

      postMessage(): void {}

      emitMessage(data: unknown): void {
        for (const listener of this.listeners.get("message") ?? []) {
          listener({ data });
        }
      }
    }

    vi.stubGlobal("Worker", FakeWorker);
    const { createFullVibexAiClient } = await import("../src/platform/ai.full");
    const client = createFullVibexAiClient(() => {});

    const loading = client.downloadModel();

    expect(client.snapshot().progress).toEqual({ loaded: 0, total: 0 });

    FakeWorker.last?.emitMessage({
      id: 1,
      message: "missing bundled model",
      ok: false,
      type: "result"
    });

    await expect(loading).resolves.toBe(false);
    expect(client.snapshot()).toMatchObject({
      errorMessage: "missing bundled model",
      progress: undefined,
      status: "error"
    });
  });
});
