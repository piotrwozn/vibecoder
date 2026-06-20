import en from "./en.json";
import pl from "./pl.json";

type LocaleMessages = Record<string, string>;
type I18nParams = Record<string, string | number>;
type LocaleLoader = () => Promise<{ default: LocaleMessages }>;

const fallbackMessages: LocaleMessages = en;

let messages: LocaleMessages = fallbackMessages;

const localeLoaders: Record<string, LocaleLoader> = {
  en: async () => ({ default: fallbackMessages }),
  pl: async () => ({ default: pl })
};

export async function loadLocale(lang: string): Promise<void> {
  const loader = localeLoaders[lang];

  if (loader === undefined) {
    throw new Error(`Unsupported locale: ${lang}`);
  }

  const locale = await loader();
  messages = locale.default;
}

export function t(key: string, params: I18nParams = {}): string {
  const template = messages[key] ?? fallbackMessages[key];

  if (template === undefined) {
    if (import.meta.env.DEV) {
      console.warn(`Missing i18n key: ${key}`);
    }

    return key;
  }

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match: string, paramName: string) => {
    const value = params[paramName];
    return value === undefined ? match : String(value);
  });
}

export function hasMessage(key: string): boolean {
  return messages[key] !== undefined || fallbackMessages[key] !== undefined;
}

export function plural(n: number, forms: readonly [string, string, string]): string {
  const abs = Math.abs(n);

  if (abs === 1) {
    return forms[0];
  }

  if (abs >= 2 && abs <= 4) {
    return forms[1];
  }

  return forms[2];
}
