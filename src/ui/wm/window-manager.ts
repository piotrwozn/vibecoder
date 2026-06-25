import {
  APP_IDS,
  WINDOW_DEFINITIONS,
  createDefaultWindowState,
  type AppId,
  type WindowFrame,
  type WindowState
} from "../../core/ui-state";

export interface WindowBounds {
  readonly height: number;
  readonly width: number;
}

interface ClampWindowOptions {
  readonly reserveDesktopLauncher?: boolean;
}

const DESKTOP_ICON_RAIL_WIDTH = 240;

export function focusWindow(windows: Record<AppId, WindowState>, appId: AppId): void {
  windows[appId].z = getTopZ(windows) + 1;
}

export function openWindow(
  windows: Record<AppId, WindowState>,
  appId: AppId,
  bounds: WindowBounds
): void {
  const windowState = windows[appId];
  windowState.open = true;
  windowState.minimized = false;

  if (shouldMaximizeForBounds(bounds)) {
    windowState.maximized = true;
  }

  focusWindow(windows, appId);
  clampWindow(windowState, bounds, { reserveDesktopLauncher: true });
}

export function closeWindow(windows: Record<AppId, WindowState>, appId: AppId): void {
  const windowState = windows[appId];
  windowState.open = false;
  windowState.minimized = false;
}

export function minimizeWindow(windows: Record<AppId, WindowState>, appId: AppId): void {
  windows[appId].minimized = true;
}

export function toggleMaximizedWindow(
  windows: Record<AppId, WindowState>,
  appId: AppId,
  bounds: WindowBounds
): void {
  const windowState = windows[appId];

  if (windowState.maximized) {
    const restore = windowState.restore ?? createDefaultWindowState(appId);
    windowState.maximized = false;
    windowState.restore = undefined;

    windowState.x = restore.x;
    windowState.y = restore.y;
    windowState.w = restore.w;
    windowState.h = restore.h;
  } else {
    windowState.restore = {
      h: windowState.h,
      w: windowState.w,
      x: windowState.x,
      y: windowState.y
    };
    windowState.maximized = true;
  }

  focusWindow(windows, appId);
  clampWindow(windowState, bounds);
}

export function moveWindow(
  windows: Record<AppId, WindowState>,
  appId: AppId,
  frame: Pick<WindowFrame, "x" | "y">,
  bounds: WindowBounds
): void {
  const windowState = windows[appId];
  windowState.maximized = false;
  windowState.x = frame.x;
  windowState.y = frame.y;
  clampWindow(windowState, bounds);
  focusWindow(windows, appId);
}

export function resizeWindow(
  windows: Record<AppId, WindowState>,
  appId: AppId,
  frame: WindowFrame,
  bounds: WindowBounds
): void {
  const windowState = windows[appId];
  windowState.maximized = false;
  windowState.x = frame.x;
  windowState.y = frame.y;
  windowState.w = frame.w;
  windowState.h = frame.h;
  clampWindow(windowState, bounds);
  focusWindow(windows, appId);
}

export function fitOpenWindowsToBounds(
  windows: Record<AppId, WindowState>,
  bounds: WindowBounds
): boolean {
  let changed = false;

  for (const appId of APP_IDS) {
    const windowState = windows[appId];

    if (!windowState.open) {
      continue;
    }

    const before = snapshotFittableWindowState(windowState);

    if (shouldMaximizeForBounds(bounds) && !windowState.maximized) {
      windowState.restore = {
        h: windowState.h,
        w: windowState.w,
        x: windowState.x,
        y: windowState.y
      };
      windowState.maximized = true;
    }

    clampWindow(windowState, bounds, { reserveDesktopLauncher: true });
    changed = changed || !sameFittableWindowState(before, windowState);
  }

  return changed;
}

export function resetWindowLayout(windows: Record<AppId, WindowState>): void {
  for (const appId of APP_IDS) {
    const current = windows[appId];
    const reset = createDefaultWindowState(appId);
    windows[appId] = {
      ...reset,
      open: current.open,
      minimized: false,
      z: current.open ? current.z : 0
    };
  }
}

export function clampWindow(
  windowState: WindowState,
  bounds: WindowBounds,
  options: ClampWindowOptions = {}
): void {
  const definition = WINDOW_DEFINITIONS[windowState.appId];

  if (windowState.maximized) {
    windowState.x = 0;
    windowState.y = 0;
    windowState.w = bounds.width;
    windowState.h = bounds.height;
    return;
  }

  const minW = Math.min(definition.minW, bounds.width);
  const minH = Math.min(definition.minH, bounds.height);
  const maxW = Math.max(minW, Math.min(definition.maxW ?? bounds.width, bounds.width));
  const maxH = Math.max(minH, Math.min(definition.maxH ?? bounds.height, bounds.height));
  windowState.w = Math.min(Math.max(windowState.w, minW), maxW);
  windowState.h = Math.min(Math.max(windowState.h, minH), maxH);
  const maxX = Math.max(0, bounds.width - windowState.w);
  const minX =
    options.reserveDesktopLauncher === true && maxX >= DESKTOP_ICON_RAIL_WIDTH
      ? DESKTOP_ICON_RAIL_WIDTH
      : 0;
  windowState.x = clamp(windowState.x, minX, maxX);
  windowState.y = clamp(windowState.y, 0, Math.max(0, bounds.height - windowState.h));
}

export function isWindowVisible(windowState: WindowState): boolean {
  return windowState.open && !windowState.minimized;
}

export function shouldBuildAppView(
  windows: Record<AppId, WindowState>,
  appId: AppId,
  includeClosed = false
): boolean {
  return includeClosed || isWindowVisible(windows[appId]);
}

function shouldMaximizeForBounds(bounds: WindowBounds): boolean {
  return bounds.width < 900;
}

function getTopZ(windows: Record<AppId, WindowState>): number {
  return Math.max(0, ...APP_IDS.map((appId) => windows[appId].z));
}

function snapshotFittableWindowState(
  windowState: WindowState
): Pick<WindowState, "h" | "maximized" | "w" | "x" | "y" | "restore"> {
  return {
    h: windowState.h,
    maximized: windowState.maximized,
    restore: windowState.restore === undefined ? undefined : { ...windowState.restore },
    w: windowState.w,
    x: windowState.x,
    y: windowState.y
  };
}

function sameFittableWindowState(
  before: ReturnType<typeof snapshotFittableWindowState>,
  after: WindowState
): boolean {
  return (
    before.h === after.h &&
    before.maximized === after.maximized &&
    before.w === after.w &&
    before.x === after.x &&
    before.y === after.y &&
    sameOptionalWindowFrame(before.restore, after.restore)
  );
}

function sameOptionalWindowFrame(
  left: WindowFrame | undefined,
  right: WindowFrame | undefined
): boolean {
  if (left === undefined || right === undefined) {
    return left === right;
  }

  return left.h === right.h && left.w === right.w && left.x === right.x && left.y === right.y;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
