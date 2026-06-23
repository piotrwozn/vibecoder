type Messages = Record<string, unknown>;

export function validateI18nMessages(en: Messages, pl: Messages): string[] {
  const failures: string[] = [];

  for (const [locale, messages] of [
    ["en", en],
    ["pl", pl]
  ] as const) {
    for (const [key, value] of Object.entries(messages)) {
      if (typeof value !== "string") {
        failures.push(`i18n ${locale} key ${key} must be a string`);
      }
    }
  }

  for (const key of Object.keys(pl)) {
    if (!(key in en)) {
      failures.push(`i18n pl key ${key} is not present in en`);
    }
  }

  for (const [key, value] of Object.entries(en)) {
    if (typeof value !== "string") {
      continue;
    }

    const translated = pl[key];
    if (translated === undefined || typeof translated !== "string") {
      continue;
    }

    const enPlaceholders = getPlaceholders(value);
    const plPlaceholders = getPlaceholders(translated);
    if (!sameSet(enPlaceholders, plPlaceholders)) {
      failures.push(`i18n pl key ${key} placeholders differ from en`);
    }
  }

  return failures;
}

function getPlaceholders(value: string): Set<string> {
  return new Set(Array.from(value.matchAll(/\{([a-zA-Z0-9_]+)\}/g), (match) => match[1] ?? ""));
}

function sameSet(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  if (left.size !== right.size) {
    return false;
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }

  return true;
}
