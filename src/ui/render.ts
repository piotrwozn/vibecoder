import { t } from "../i18n/i18n";
import { el, setText, text } from "./dom";

interface ScreenLink {
  readonly iconPath: string;
  readonly key: string;
}

export interface AppShell {
  updateFrameAlpha(alpha: number): void;
  updateTickCount(ticks: number): void;
}

const screenLinks: readonly ScreenLink[] = [
  {
    key: "ui.dock.devFloor",
    iconPath: "M4 6h16v3H4z M4 11h10v3H4z M4 16h16v2H4z"
  },
  {
    key: "ui.dock.projects",
    iconPath: "M4 5h7l2 2h7v12H4z"
  },
  {
    key: "ui.dock.research",
    iconPath: "M12 3a4 4 0 0 0-2 7.46V13h4v-2.54A4 4 0 0 0 12 3z M9 16h6 M10 20h4"
  },
  {
    key: "ui.dock.rewrite",
    iconPath: "M6 7h10l-3-3 M16 17H6l3 3 M17 8a6 6 0 0 1-6 10 M7 16A6 6 0 0 1 13 6"
  },
  {
    key: "ui.dock.stats",
    iconPath: "M5 19V9 M12 19V5 M19 19v-7"
  },
  {
    key: "ui.dock.achievements",
    iconPath: "M7 4h10v3a5 5 0 0 1-4 4.9V16h3v4H8v-4h3v-4.1A5 5 0 0 1 7 7z"
  },
  {
    key: "ui.dock.settings",
    iconPath:
      "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z M12 2v3 M12 19v3 M4.93 4.93l2.12 2.12 M16.95 16.95l2.12 2.12 M2 12h3 M19 12h3 M4.93 19.07l2.12-2.12 M16.95 7.05l2.12-2.12"
  }
];

export function mountApp(root: HTMLElement): AppShell {
  const shell = el("div", { className: "app-shell" });

  shell.append(createDock(), createTopbar(), createModelPanel(), createMainPanel());

  const { terminal, tickText, frameBar } = createTerminal();
  shell.append(terminal, createCommsPanel());

  root.replaceChildren(shell);

  return {
    updateFrameAlpha(alpha: number): void {
      frameBar.style.transform = `scaleX(${alpha.toFixed(3)})`;
    },

    updateTickCount(ticks: number): void {
      setText(tickText, ticks);
    }
  };
}

function createDock(): HTMLElement {
  const dock = el("nav", {
    ariaLabel: t("ui.dock.ariaLabel"),
    className: "dock"
  });

  for (const link of screenLinks) {
    const label = t(link.key);
    const button = el("button", {
      ariaLabel: label,
      className: "dock__button",
      title: label
    });
    button.type = "button";
    button.append(createIcon(link.iconPath));
    dock.append(button);
  }

  return dock;
}

function createTopbar(): HTMLElement {
  const topbar = el("header", { className: "topbar" });

  topbar.append(
    createResourceCounter("ui.resource.money", "0"),
    createResourceCounter("ui.resource.loc", "0"),
    createResourceCounter("ui.resource.compute", "0/0"),
    createResourceCounter("ui.resource.hype", "1x")
  );

  return topbar;
}

function createModelPanel(): HTMLElement {
  const panel = el("aside", { className: "model-panel" });
  const label = el("span", { className: "model-panel__label" });
  label.append(text(t("ui.model.label")));

  const value = el("strong", { className: "model-panel__value" });
  value.append(text("PARROT-1"));

  panel.append(label, value);
  return panel;
}

function createMainPanel(): HTMLElement {
  const main = el("main", { className: "main-view" });
  const title = el("h1", { className: "main-view__title" });
  title.append(text(t("ui.dock.devFloor")));

  const empty = el("p", { className: "main-view__empty" });
  empty.append(text(t("ui.main.empty")));

  main.append(title, empty);
  return main;
}

function createTerminal(): { frameBar: HTMLElement; terminal: HTMLElement; tickText: Text } {
  const terminal = el("section", { className: "terminal" });
  const header = el("div", { className: "terminal__header" });
  header.append(text(t("ui.terminal.title")));

  const prompt = el("button", { className: "terminal__prompt" });
  prompt.type = "button";
  prompt.append(text(t("ui.terminal.prompt")));

  const tickRow = el("div", { className: "terminal__counter" });
  const label = el("span", { className: "terminal__counter-label" });
  label.append(text(t("ui.terminal.tickCounter")));
  const tickValue = el("strong", { className: "terminal__counter-value" });
  const tickText = text("0");
  tickValue.append(tickText);
  tickRow.append(label, tickValue);

  const frameTrack = el("div", { className: "terminal__frame-track" });
  const frameBar = el("div", { className: "terminal__frame-bar" });
  frameTrack.append(frameBar);

  terminal.append(header, tickRow, frameTrack, prompt);
  return { frameBar, terminal, tickText };
}

function createCommsPanel(): HTMLElement {
  const panel = el("aside", { className: "comms" });
  const title = el("h2", { className: "comms__title" });
  title.append(text(t("ui.comms.title")));

  const empty = el("p", { className: "comms__empty" });
  empty.append(text(t("ui.comms.empty")));

  panel.append(title, empty);
  return panel;
}

function createResourceCounter(labelKey: string, value: string): HTMLElement {
  const counter = el("div", { className: "resource-counter" });
  const label = el("span", { className: "resource-counter__label" });
  label.append(text(t(labelKey)));

  const currentValue = el("strong", { className: "resource-counter__value" });
  currentValue.append(text(value));

  counter.append(label, currentValue);
  return counter;
}

function createIcon(pathData: string): SVGSVGElement {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "dock__icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "1.8");

  icon.append(path);
  return icon;
}
