import { describe, expect, it } from "vitest";

import { createDefaultWindowStates } from "../src/core/ui-state";
import {
  fitOpenWindowsToBounds,
  moveWindow,
  openWindow,
  resetWindowLayout,
  resizeWindow,
  shouldBuildAppView,
  toggleMaximizedWindow
} from "../src/ui/wm/window-manager";

describe("M13 window manager", () => {
  it("opens one persisted window per app and focuses repeat opens", () => {
    const windows = createDefaultWindowStates();

    openWindow(windows, "projects", { height: 720, width: 1280 });
    const firstZ = windows.projects.z;
    openWindow(windows, "projects", { height: 720, width: 1280 });

    expect(windows.projects.open).toBe(true);
    expect(windows.projects.minimized).toBe(false);
    expect(windows.projects.z).toBeGreaterThan(firstZ);
  });

  it("clamps move and resize inside desktop bounds while respecting min size", () => {
    const windows = createDefaultWindowStates();

    openWindow(windows, "agents", { height: 720, width: 1280 });
    moveWindow(windows, "agents", { x: 9999, y: 9999 }, { height: 720, width: 1280 });
    resizeWindow(
      windows,
      "agents",
      { h: 10, w: 10, x: windows.agents.x, y: windows.agents.y },
      { height: 720, width: 1280 }
    );

    expect(windows.agents.w).toBe(860);
    expect(windows.agents.h).toBe(560);
    expect(windows.agents.x + windows.agents.w).toBeLessThanOrEqual(1280);
    expect(windows.agents.y + windows.agents.h).toBeLessThanOrEqual(720);
  });

  it("keeps oversized settings windows compact after old persisted resizes", () => {
    const windows = createDefaultWindowStates();

    openWindow(windows, "settings", { height: 1200, width: 1900 });
    resizeWindow(
      windows,
      "settings",
      { h: 1100, w: 1600, x: 280, y: 390 },
      { height: 1200, width: 1900 }
    );

    expect(windows.settings.w).toBe(980);
    expect(windows.settings.h).toBe(760);
    expect(windows.settings.x + windows.settings.w).toBeLessThanOrEqual(1900);
    expect(windows.settings.y + windows.settings.h).toBeLessThanOrEqual(1200);
  });

  it("maximizes new windows on narrow desktops and restores saved frames", () => {
    const windows = createDefaultWindowStates();

    openWindow(windows, "stats", { height: 640, width: 820 });
    expect(windows.stats.maximized).toBe(true);
    expect(windows.stats.w).toBe(820);
    expect(windows.stats.h).toBe(640);

    toggleMaximizedWindow(windows, "stats", { height: 640, width: 820 });
    expect(windows.stats.maximized).toBe(false);
    expect(windows.stats.w).toBe(760);
    expect(windows.stats.h).toBe(520);
  });

  it("fits open windows when the desktop viewport changes", () => {
    const windows = createDefaultWindowStates();

    openWindow(windows, "projects", { height: 720, width: 1280 });
    resizeWindow(
      windows,
      "projects",
      { h: 560, w: 820, x: 320, y: 180 },
      { height: 720, width: 1280 }
    );

    const changed = fitOpenWindowsToBounds(windows, { height: 560, width: 390 });

    expect(changed).toBe(true);
    expect(windows.projects.maximized).toBe(true);
    expect(windows.projects.w).toBe(390);
    expect(windows.projects.h).toBe(560);
    expect(windows.projects.restore).toEqual({ h: 560, w: 820, x: 320, y: 160 });
  });

  it("refits maximized windows after a viewport grows", () => {
    const windows = createDefaultWindowStates();

    openWindow(windows, "research", { height: 560, width: 390 });

    const changed = fitOpenWindowsToBounds(windows, { height: 720, width: 1280 });

    expect(changed).toBe(true);
    expect(windows.research.maximized).toBe(true);
    expect(windows.research.w).toBe(1280);
    expect(windows.research.h).toBe(720);
  });

  it("resets frames without closing open windows", () => {
    const windows = createDefaultWindowStates();
    openWindow(windows, "vibex", { height: 900, width: 1440 });
    resizeWindow(
      windows,
      "vibex",
      { h: 700, w: 1100, x: 300, y: 180 },
      { height: 900, width: 1440 }
    );

    resetWindowLayout(windows);

    expect(windows.vibex.open).toBe(true);
    expect(windows.vibex.w).toBe(1000);
    expect(windows.vibex.h).toBe(640);
    expect(windows.vibex.minimized).toBe(false);
  });

  it("builds app view-models only for visible windows after initial mount", () => {
    const windows = createDefaultWindowStates();

    expect(shouldBuildAppView(windows, "projects")).toBe(false);
    expect(shouldBuildAppView(windows, "projects", true)).toBe(true);

    openWindow(windows, "projects", { height: 720, width: 1280 });
    expect(shouldBuildAppView(windows, "projects")).toBe(true);

    windows.projects.minimized = true;
    expect(shouldBuildAppView(windows, "projects")).toBe(false);
  });
});
