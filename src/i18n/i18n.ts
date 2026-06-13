import en from "./en.json";

type LocaleMessages = Record<string, string>;
type I18nParams = Record<string, string | number>;

const messages: LocaleMessages = en;

export function t(key: string, params: I18nParams = {}): string {
  const template = messages[key];

  if (template === undefined) {
    if (import.meta.env.DEV) {
      console.warn(`Missing i18n key: ${key}`);
    }

    return key;
  }

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, paramName: string) => {
    const value = params[paramName];
    return value === undefined ? match : String(value);
  });
}
