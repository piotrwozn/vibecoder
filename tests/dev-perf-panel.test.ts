import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createDevPerfPanel } from "../src/dev/perf-panel";

describe("M11 dev perf panel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders tick, frame, heap, and planned time-warp controls", () => {
    installDom();
    let warpedHours = 0;
    const panel = createDevPerfPanel({
      warp(hours): void {
        warpedHours = hours;
      }
    });

    panel.recordTick(1.234);
    panel.recordFrame(3.456);
    document.body.append(panel.root);

    expect(panel.root.textContent).toContain("Tick 1.23 ms");
    expect(panel.root.textContent).toContain("Frame 3.46 ms");
    expect(panel.root.textContent).toContain("Heap n/a");

    const buttons = panel.root.querySelectorAll("button");
    buttons[0]?.click();
    expect(warpedHours).toBe(1);
    buttons[1]?.click();
    expect(warpedHours).toBe(8);
  });
});

function installDom(): void {
  const dom = new JSDOM("<!doctype html><body></body>");
  vi.stubGlobal("document", dom.window.document);
  vi.stubGlobal("HTMLElement", dom.window.HTMLElement);
  vi.stubGlobal("window", dom.window);
}
