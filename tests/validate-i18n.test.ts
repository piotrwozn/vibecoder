import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { validateI18nMessages } from "../src/dev/validate-i18n";

describe("dev validator i18n policy", () => {
  it("allows partial Polish translations while rejecting stray keys and placeholder drift", () => {
    expect(
      validateI18nMessages(
        {
          "ui.keep": "Value {count}",
          "ui.missingInPl": "English fallback is allowed"
        },
        {
          "ui.keep": "Wartosc {total}",
          "ui.stray": "Nie ma tego po angielsku"
        }
      )
    ).toEqual([
      "i18n pl key ui.stray is not present in en",
      "i18n pl key ui.keep placeholders differ from en"
    ]);
  });

  it("does not keep the removed English plural helper around unused", () => {
    const source = readFileSync("src/i18n/i18n.ts", "utf8");

    expect(source).not.toContain("function plural");
  });
});
