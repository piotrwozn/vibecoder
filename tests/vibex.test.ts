import { describe, expect, it } from "vitest";

import { createDefaultGameState } from "../src/core/state";
import { VIBEX_CANNED_PAIRS, VIBEX_CODE_FILES } from "../src/data/vibex";
import { createDerivedCache, recomputeDerivedCache } from "../src/systems/production";
import { performPromptClick } from "../src/systems/prompt";
import {
  advanceVibexCode,
  createVibexCannedBag,
  createVibexCodeState,
  drawVibexCannedPair
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

  it("advances code fragments across files and emits one commit per full cycle", () => {
    const state = createVibexCodeState();
    const fragmentCount = VIBEX_CODE_FILES.reduce(
      (total, file) => total + file.fragments.length,
      0
    );
    const frames = Array.from({ length: fragmentCount }, () => advanceVibexCode(state));
    const wrapFrame = advanceVibexCode(state);

    expect(frames[0]?.fileId).toBe(VIBEX_CODE_FILES[0]?.id);
    expect(frames.filter((frame) => frame.committed)).toHaveLength(0);
    expect(wrapFrame.committed).toBe(true);
    expect(wrapFrame.fileId).toBe(VIBEX_CODE_FILES[0]?.id);
    expect(advanceVibexCode(state).committed).toBe(false);
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
});
