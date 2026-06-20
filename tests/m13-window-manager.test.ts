import { describe, expect, it } from "vitest";

import { createDefaultWindowStates } from "../src/core/ui-state";
import {
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
