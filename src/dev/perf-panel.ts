import { t } from "../i18n/i18n";
import { el, setText, text } from "../ui/dom";

export interface DevPerfPanel {
  readonly root: HTMLElement;
  recordFrame(ms: number): void;
  recordTick(ms: number): void;
}

export interface DevPerfActions {
  warp(hours: number): void;
}

interface PerformanceMemory {
  readonly usedJSHeapSize?: number;
}

interface PerformanceWithMemory extends Performance {
  readonly memory?: PerformanceMemory;
}

export function createDevPerfPanel(actions: DevPerfActions): DevPerfPanel {
  const root = el("section", {
    ariaLabel: t("ui.dev.perfAria"),
    className: "dev-perf"
  });
  const title = el("h2", { className: "dev-perf__title" });
  title.append(text(t("ui.dev.perfTitle")));

  const tick = text(t("ui.dev.tickMs", { value: "0.00" }));
  const frame = text(t("ui.dev.frameMs", { value: "0.00" }));
  const heap = text(t("ui.dev.heap", { value: t("ui.dev.heapUnavailable") }));
  const metrics = el("div", { className: "dev-perf__metrics" });
  metrics.append(createMetric(tick), createMetric(frame), createMetric(heap));

  const controls = el("div", { className: "dev-perf__controls" });
  controls.append(
    createWarpButton("ui.dev.warp1h", 1, actions),
    createWarpButton("ui.dev.warp8h", 8, actions)
  );
  root.append(title, metrics, controls);

  return {
    root,

    recordFrame(ms): void {
      setText(frame, t("ui.dev.frameMs", { value: formatMs(ms) }));
      setText(heap, t("ui.dev.heap", { value: formatHeap() }));
    },

    recordTick(ms): void {
      setText(tick, t("ui.dev.tickMs", { value: formatMs(ms) }));
    }
  };
}

function createMetric(value: Text): HTMLElement {
  const row = el("p", { className: "dev-perf__metric" });
  row.append(value);
  return row;
}

function createWarpButton(
  labelKey: string,
  hours: number,
  actions: DevPerfActions
): HTMLButtonElement {
  const button = el("button", { className: "dev-perf__button" });
  button.type = "button";
  button.append(text(t(labelKey)));
  button.addEventListener("click", () => actions.warp(hours));
  return button;
}

function formatMs(ms: number): string {
  return Number.isFinite(ms) ? ms.toFixed(2) : "0.00";
}

function formatHeap(): string {
  const bytes = (performance as PerformanceWithMemory).memory?.usedJSHeapSize;

  if (typeof bytes !== "number") {
    return t("ui.dev.heapUnavailable");
  }

  return t("ui.dev.heapMb", { value: (bytes / 1024 / 1024).toFixed(1) });
}
