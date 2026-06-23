import { loadGameState } from "../core/save";
import { loadLocale } from "../i18n/i18n";
import { createDesktopPlatform, isTauriRuntime } from "../platform/desktop";
import type { Platform } from "../platform/platform";
import { createWebPlatform } from "../platform/web";

export interface AppBootstrap {
  readonly appRoot: HTMLElement;
  readonly bootLocaleRepaired: boolean;
  readonly loaded: Awaited<ReturnType<typeof loadGameState>>;
  readonly platform: Platform;
}

export async function bootstrapApp(): Promise<AppBootstrap> {
  const root = document.querySelector<HTMLElement>("#app");

  if (root === null) {
    throw new Error("Missing #app root");
  }

  const platform = isTauriRuntime() ? createDesktopPlatform() : createWebPlatform();
  const loaded = await loadGameState(platform);
  let bootLocaleRepaired = false;

  try {
    await loadLocale(loaded.state.settings.lang);
  } catch {
    loaded.state.settings.lang = "en";
    bootLocaleRepaired = true;
    await loadLocale("en");
  }

  return {
    appRoot: root,
    bootLocaleRepaired,
    loaded,
    platform
  };
}
