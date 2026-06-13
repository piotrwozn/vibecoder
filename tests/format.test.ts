import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { formatBig, formatTime } from "../src/core/format";

describe("format", () => {
  it("matches the examples from plan/03 section 10", () => {
    expect({
      full: formatBig(Big.fromNumber(123_456)),
      suffix: formatBig(Big.fromNumber(4.2e9)),
      scientificDefault: formatBig(Big.fromNumber(1.23e18)),
      letterSuffix: formatBig(Big.fromNumber(1.23e15), "suffix"),
      hours: formatTime(2 * 60 * 60 + 15 * 60),
      days: formatTime(3 * 24 * 60 * 60 + 4 * 60 * 60)
    }).toMatchInlineSnapshot(`
      {
        "days": "3d 4h",
        "full": "123,456",
        "hours": "2h 15m",
        "letterSuffix": "1.23aa",
        "scientificDefault": "1.23e18",
        "suffix": "4.20B",
      }
    `);
  });
});
