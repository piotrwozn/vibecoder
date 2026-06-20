import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { formatBig, formatTime } from "../src/core/format";

describe("format", () => {
  it("matches the examples from plan/03 section 10", () => {
    expect({
      full: formatBig(Big.fromNumber(123_456)),
      suffixM: formatBig(Big.fromNumber(1.23e6)),
      suffixB: formatBig(Big.fromNumber(4.2e9)),
      suffixT: formatBig(Big.fromNumber(9.99e12)),
      scientificDefault: formatBig(Big.fromNumber(1.23e18)),
      roundedScientific: formatBig(Big.fromNumber(9.996e18)),
      letterSuffix: formatBig(Big.fromNumber(1.23e15), "suffix"),
      secondLetterSuffix: formatBig(Big.fromNumber(1e18), "suffix"),
      nonDivisibleLetterSuffix: formatBig(Big.fromNumber(1.23e17), "suffix"),
      negativeZero: formatBig(Big.fromNumber(-0.4)),
      hours: formatTime(2 * 60 * 60 + 15 * 60),
      days: formatTime(3 * 24 * 60 * 60 + 4 * 60 * 60)
    }).toMatchInlineSnapshot(`
      {
        "days": "3d 4h",
        "full": "123,456",
        "hours": "2h 15m",
        "letterSuffix": "1.23aa",
        "negativeZero": "0",
        "nonDivisibleLetterSuffix": "123aa",
        "roundedScientific": "1.00e19",
        "scientificDefault": "1.23e18",
        "secondLetterSuffix": "1.00ab",
        "suffixB": "4.20B",
        "suffixM": "1.23M",
        "suffixT": "9.99T",
      }
    `);
  });
});
