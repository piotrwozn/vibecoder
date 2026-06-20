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
  clampWindow(windowState, bounds);
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

export function clampWindow(windowState: WindowState, bounds: WindowBounds): void {
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
  windowState.w = Math.min(Math.max(windowState.w, minW), bounds.width);
  windowState.h = Math.min(Math.max(windowState.h, minH), bounds.height);
  windowState.x = clamp(windowState.x, 0, Math.max(0, bounds.width - windowState.w));
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
