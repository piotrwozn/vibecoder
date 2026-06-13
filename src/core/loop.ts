import { C } from "../data/constants";

export type TickHandler = (dtS: number) => void;
export type RenderHandler = (alpha: number) => void;

export interface LoopStepper {
  reset(): void;
  step(elapsedMs: number): LoopStepResult;
}

export interface LoopStepResult {
  accumulatorMs: number;
  alpha: number;
  ticks: number;
}

export interface StartLoopOptions {
  now?: () => number;
  render: RenderHandler;
  requestFrame?: (callback: FrameRequestCallback) => number;
  tick: TickHandler;
}

export interface LoopControls {
  readonly running: boolean;
  stop(): void;
}

export const TICK_MS = 1000 / C.TICK_HZ;
const MAX_CATCH_UP_MS = 2000;

export function createLoopStepper(tick: TickHandler, render: RenderHandler): LoopStepper {
  let accumulatorMs = 0;

  return {
    reset(): void {
      accumulatorMs = 0;
    },

    step(elapsedMs: number): LoopStepResult {
      accumulatorMs = Math.min(accumulatorMs + elapsedMs, MAX_CATCH_UP_MS);

      let ticks = 0;
      while (accumulatorMs >= TICK_MS) {
        tick(TICK_MS / 1000);
        accumulatorMs -= TICK_MS;
        ticks += 1;
      }

      const alpha = accumulatorMs / TICK_MS;
      render(alpha);

      return {
        accumulatorMs,
        alpha,
        ticks
      };
    }
  };
}

export function startLoop(options: StartLoopOptions): LoopControls {
  const now = options.now ?? (() => performance.now());
  const requestFrame = options.requestFrame ?? requestAnimationFrame;
  const stepper = createLoopStepper(options.tick, options.render);

  let lastMs = now();
  let isRunning = true;

  const frame = (frameMs: number): void => {
    if (!isRunning) {
      return;
    }

    stepper.step(frameMs - lastMs);
    lastMs = frameMs;
    requestFrame(frame);
  };

  requestFrame(frame);

  return {
    get running(): boolean {
      return isRunning;
    },

    stop(): void {
      isRunning = false;
    }
  };
}
