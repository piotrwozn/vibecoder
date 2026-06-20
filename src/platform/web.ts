import type { Edition, Platform } from "./platform";

export const WEB_SAVE_KEY = "vibecoder_save";

export function createWebPlatform(): Platform {
  return {
    edition: readEdition(),

    async load(): Promise<string | null> {
      return window.localStorage.getItem(WEB_SAVE_KEY);
    },

    async save(data: string): Promise<void> {
      window.localStorage.setItem(WEB_SAVE_KEY, data);
    },

    openExternal(url: string): void {
      window.open(url, "_blank", "noopener,noreferrer");
    },

    setTitle(title: string): void {
      document.title = title;
    }
  };
}

function readEdition(): Edition {
  return import.meta.env.VITE_EDITION === "full" ? "full" : "demo";
}
