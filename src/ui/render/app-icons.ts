import type { AppId } from "../../core/ui-state";
import { el } from "../dom";
import type { ScreenLink } from "./view-types";

const appIconSources: Partial<Record<AppId, string>> = {
  achievements: new URL("../../../images/app-icons/achievements.png", import.meta.url).href,
  agents: new URL("../../../images/app-icons/agents.png", import.meta.url).href,
  chat: new URL("../../../images/app-icons/chat.png", import.meta.url).href,
  feed: new URL("../../../images/app-icons/feed.png", import.meta.url).href,
  hardware: new URL("../../../images/app-icons/hardware.png", import.meta.url).href,
  mail: new URL("../../../images/app-icons/mail.png", import.meta.url).href,
  projects: new URL("../../../images/app-icons/projects.png", import.meta.url).href,
  research: new URL("../../../images/app-icons/research.png", import.meta.url).href,
  rewrite: new URL("../../../images/app-icons/rewrite.png", import.meta.url).href,
  settings: new URL("../../../images/app-icons/settings.png", import.meta.url).href,
  stats: new URL("../../../images/app-icons/stats.png", import.meta.url).href,
  upgrades: new URL("../../../images/app-icons/upgrades.png", import.meta.url).href,
  vibex: new URL("../../../images/app-icons/vibex.png", import.meta.url).href
};

export const screenLinks: readonly ScreenLink[] = [
  {
    appId: "vibex",
    key: "ui.app.vibex",
    shortcut: "1",
    iconPath: "M5 5h14v10H5z M8 19h8 M10 15v4 M8 9l2 2-2 2 M12 13h4"
  },
  {
    appId: "agents",
    key: "ui.app.agents",
    shortcut: "2",
    iconPath: "M4 6h16v3H4z M4 11h10v3H4z M4 16h16v2H4z"
  },
  {
    appId: "hardware",
    key: "ui.app.hardware",
    shortcut: "3",
    iconPath:
      "M5 17h14 M7 7h10v8H7z M9 3v4 M15 3v4 M9 15v4 M15 15v4 M3 9h4 M17 9h4 M3 13h4 M17 13h4"
  },
  {
    appId: "upgrades",
    key: "ui.app.upgrades",
    shortcut: "4",
    iconPath: "M12 4v16 M5 11l7-7 7 7 M6 20h12"
  },
  {
    appId: "projects",
    key: "ui.app.projects",
    shortcut: "5",
    iconPath: "M4 5h7l2 2h7v12H4z"
  },
  {
    appId: "roadmap",
    key: "ui.app.roadmap",
    shortcut: "6",
    iconPath: "M5 6h14 M5 12h14 M5 18h14 M8 6v12 M16 6v12"
  },
  {
    appId: "aurora",
    key: "ui.app.aurora",
    iconPath:
      "M12 3l2.4 5.1 5.6.7-4.1 3.9 1 5.5L12 15.5 7.1 18.2l1-5.5L4 8.8l5.6-.7z M12 8v4 M12 15h.01"
  },
  {
    appId: "research",
    key: "ui.app.research",
    shortcut: "7",
    iconPath: "M12 3a4 4 0 0 0-2 7.46V13h4v-2.54A4 4 0 0 0 12 3z M9 16h6 M10 20h4"
  },
  {
    appId: "rewrite",
    key: "ui.app.rewrite",
    iconPath: "M6 7h10l-3-3 M16 17H6l3 3 M17 8a6 6 0 0 1-6 10 M7 16A6 6 0 0 1 13 6"
  },
  {
    appId: "stats",
    key: "ui.app.stats",
    iconPath: "M5 19V9 M12 19V5 M19 19v-7"
  },
  {
    appId: "achievements",
    key: "ui.app.achievements",
    iconPath: "M7 4h10v3a5 5 0 0 1-4 4.9V16h3v4H8v-4h3v-4.1A5 5 0 0 1 7 7z"
  },
  {
    appId: "chat",
    key: "ui.app.chat",
    iconPath: "M4 5h16v11H8l-4 4z M8 9h8 M8 12h6"
  },
  {
    appId: "mail",
    key: "ui.app.mail",
    iconPath: "M4 6h16v12H4z M4 7l8 6 8-6"
  },
  {
    appId: "feed",
    key: "ui.app.feed",
    iconPath: "M6 5h12 M6 9h12 M6 13h8 M6 17h10"
  },
  {
    appId: "settings",
    key: "ui.app.settings",
    shortcut: "8",
    iconPath:
      "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z M12 2v3 M12 19v3 M4.93 4.93l2.12 2.12 M16.95 16.95l2.12 2.12 M2 12h3 M19 12h3 M4.93 19.07l2.12-2.12 M16.95 7.05l2.12-2.12"
  }
];

export function getAppIconPath(appId: AppId): string | undefined {
  return screenLinks.find((link) => link.appId === appId)?.iconPath;
}

export function getShortcutApp(key: string): AppId | undefined {
  return screenLinks.find((link) => link.shortcut === key)?.appId;
}

export function createAppIcon(link: ScreenLink): Element {
  const src = appIconSources[link.appId];
  if (src === undefined) {
    return createIcon(link.iconPath);
  }

  const icon = el("img", { className: "dock__icon dock__icon--image" });
  icon.setAttribute("alt", "");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("decoding", "async");
  icon.setAttribute("draggable", "false");
  icon.src = src;
  return icon;
}

export function createIcon(pathData: string): SVGSVGElement {
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
