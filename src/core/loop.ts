import { C } from "../data/constants";

export type TickHandler = (dtS: number) => void;
export type RenderHandler = (alpha: number) => void;
export type CatchUpHandler = (elapsedMs: number) => void;
export type LoopMetricHandler = (ms: number) => void;

export interface LoopInstrumentation {
  readonly frame?: LoopMetricHandler;
  readonly now?: () => number;
  readonly tick?: LoopMetricHandler;
}

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
  catchUp?: CatchUpHandler;
  metrics?: LoopInstrumentation;
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
export const OFFLINE_CATCH_UP_MS = 2000;

export function createLoopStepper(
  tick: TickHandler,
  render: RenderHandler,
  catchUp?: CatchUpHandler,
  metrics?: LoopInstrumentation
): LoopStepper {
  let accumulatorMs = 0;

  return {
    reset(): void {
      accumulatorMs = 0;
    },

    step(elapsedMs: number): LoopStepResult {
      if (elapsedMs > OFFLINE_CATCH_UP_MS && catchUp !== undefined) {
        catchUp(elapsedMs);
        accumulatorMs = 0;
        measure(metrics?.frame, metrics?.now, () => render(0));

        return {
          accumulatorMs,
          alpha: 0,
          ticks: 0
        };
      }

      accumulatorMs = Math.min(accumulatorMs + elapsedMs, OFFLINE_CATCH_UP_MS);

      let ticks = 0;
      while (accumulatorMs >= TICK_MS) {
        measure(metrics?.tick, metrics?.now, () => tick(TICK_MS / 1000));
        accumulatorMs -= TICK_MS;
        ticks += 1;
      }

      const alpha = accumulatorMs / TICK_MS;
      measure(metrics?.frame, metrics?.now, () => render(alpha));

      return {
        accumulatorMs,
        alpha,
        ticks
      };
    }
  };
}

function measure(
  handler: LoopMetricHandler | undefined,
  now: (() => number) | undefined,
  run: () => void
): void {
  if (handler === undefined || now === undefined) {
    run();
    return;
  }

  const startedMs = now();
  run();
  handler(now() - startedMs);
}

export function startLoop(options: StartLoopOptions): LoopControls {
  const now = options.now ?? (() => performance.now());
  const requestFrame = options.requestFrame ?? requestAnimationFrame;
  const metrics =
    options.metrics === undefined
      ? undefined
      : {
          ...options.metrics,
          now: options.metrics.now ?? (() => performance.now())
        };
  const stepper = createLoopStepper(options.tick, options.render, options.catchUp, metrics);

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
