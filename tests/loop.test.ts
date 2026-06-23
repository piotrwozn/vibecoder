import { describe, expect, it, vi } from "vitest";

import { C } from "../src/data/constants";
import {
  OFFLINE_CATCH_UP_MS,
  OFFLINE_THRESHOLD_MS,
  TICK_MS,
  createLoopStepper,
  startLoop
} from "../src/core/loop";

describe("fixed timestep loop", () => {
  it("ticks exactly 10 times for one second", () => {
    const observedDt: number[] = [];
    const stepper = createLoopStepper(
      (dtS) => {
        observedDt.push(dtS);
      },
      () => {}
    );

    const result = stepper.step(1000);

    expect(TICK_MS).toBe(100);
    expect(result.ticks).toBe(C.TICK_HZ);
    expect(result.accumulatorMs).toBe(0);
    expect(observedDt).toHaveLength(10);
    expect(observedDt.every((dtS) => dtS === 0.1)).toBe(true);
  });

  it("carries partial frames into the next fixed tick", () => {
    let ticks = 0;
    let lastAlpha = 0;
    const stepper = createLoopStepper(
      () => {
        ticks += 1;
      },
      (alpha) => {
        lastAlpha = alpha;
      }
    );

    const first = stepper.step(50);
    const second = stepper.step(50);

    expect(first.ticks).toBe(0);
    expect(first.accumulatorMs).toBe(50);
    expect(first.alpha).toBe(0.5);
    expect(second.ticks).toBe(1);
    expect(second.accumulatorMs).toBe(0);
    expect(lastAlpha).toBe(0);
    expect(ticks).toBe(1);
  });

  it("clamps long frame catch-up before offline systems exist", () => {
    let ticks = 0;
    const stepper = createLoopStepper(
      () => {
        ticks += 1;
      },
      () => {}
    );

    const result = stepper.step(10_000);

    expect(result.ticks).toBe(20);
    expect(result.accumulatorMs).toBe(0);
    expect(ticks).toBe(20);
  });

  it("routes long frames through offline catch-up when provided", () => {
    let caughtMs = 0;
    let ticks = 0;
    let alpha = 1;
    const stepper = createLoopStepper(
      () => {
        ticks += 1;
      },
      (nextAlpha) => {
        alpha = nextAlpha;
      },
      (elapsedMs) => {
        caughtMs = elapsedMs;
      }
    );

    const result = stepper.step(OFFLINE_THRESHOLD_MS + 1);

    expect(caughtMs).toBe(OFFLINE_THRESHOLD_MS + 1);
    expect(result.ticks).toBe(0);
    expect(result.accumulatorMs).toBe(0);
    expect(result.alpha).toBe(0);
    expect(alpha).toBe(0);
    expect(ticks).toBe(0);
  });

  it("clamps medium frame gaps without routing them to offline catch-up", () => {
    let caughtMs = 0;
    let ticks = 0;
    const stepper = createLoopStepper(
      () => {
        ticks += 1;
      },
      () => {},
      (elapsedMs) => {
        caughtMs = elapsedMs;
      }
    );

    const result = stepper.step(OFFLINE_CATCH_UP_MS + 1);

    expect(caughtMs).toBe(0);
    expect(result.ticks).toBe(20);
    expect(result.accumulatorMs).toBe(0);
    expect(ticks).toBe(20);
  });

  it("records measured tick and frame durations when instrumentation is enabled", () => {
    let nowMs = 0;
    const tickMs: number[] = [];
    const frameMs: number[] = [];
    const stepper = createLoopStepper(
      () => {},
      () => {},
      undefined,
      {
        frame: (ms) => frameMs.push(ms),
        now: () => {
          nowMs += 0.25;
          return nowMs;
        },
        tick: (ms) => tickMs.push(ms)
      }
    );

    stepper.step(TICK_MS);

    expect(tickMs).toEqual([0.25]);
    expect(frameMs).toEqual([0.25]);
  });

  it("reschedules the frame loop after a thrown tick", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const callbacks: FrameRequestCallback[] = [];
    const controls = startLoop({
      now: () => 0,
      render: () => {},
      requestFrame: (callback) => {
        callbacks.push(callback);
        return callbacks.length;
      },
      tick: () => {
        throw new Error("tick failed");
      }
    });

    callbacks[0]?.(TICK_MS);

    expect(callbacks).toHaveLength(2);
    expect(controls.running).toBe(true);
    expect(errorSpy).toHaveBeenCalled();
    controls.stop();
    errorSpy.mockRestore();
  });
});
