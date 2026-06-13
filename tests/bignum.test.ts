import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";

describe("Big", () => {
  it("round-trips numbers across the 1e±300 range", () => {
    for (const value of generateNumbers(240, -300, 300)) {
      expectRelative(Big.fromNumber(value).toNumber(), value);
    }
  });

  it("matches number arithmetic for add and subtract across the 1e±300 range", () => {
    const values = generateNumbers(180, -300, 300);

    for (let i = 0; i < values.length - 1; i += 2) {
      const left = values[i] ?? 0;
      const right = values[i + 1] ?? 0;

      expectRelative(Big.add(left, right).toNumber(), left + right);
      expectRelative(Big.sub(left, right).toNumber(), left - right);
    }
  });

  it("matches number arithmetic for multiply and divide when results stay in the 1e±300 range", () => {
    const values = generateNumbers(220, -150, 150);

    for (let i = 0; i < values.length - 1; i += 2) {
      const left = values[i] ?? 1;
      const right = values[i + 1] ?? 1;
      const product = left * right;
      const quotient = left / right;

      if (Number.isFinite(product)) {
        expectRelative(Big.mul(left, right).toNumber(), product);
      }

      if (Number.isFinite(quotient)) {
        expectRelative(Big.div(left, right).toNumber(), quotient);
      }
    }
  });

  it("supports mutating hot-path variants without changing the addend", () => {
    const target = Big.fromNumber(1.25e6);
    const addend = Big.fromNumber(2.5e5);

    const returned = Big.addIn(target, addend);

    expect(returned).toBe(target);
    expectRelative(target.toNumber(), 1.5e6);
    expectRelative(addend.toNumber(), 2.5e5);

    Big.mulIn(target, Big.fromNumber(2));
    expectRelative(target.toNumber(), 3e6);
  });

  it("serializes and parses the save representation", () => {
    const value = Big.fromNumber(1.2345e56);
    const serialized = value.toJSON();

    expect(serialized).toBe("1.2345e56");
    expect(Big.fromString(serialized).eq(value)).toBe(true);
  });

  it("clamps toNumber for exponent overflow", () => {
    expect(Big.fromString("1e309").toNumber()).toBe(Number.MAX_VALUE);
    expect(Big.fromString("-1e309").toNumber()).toBe(-Number.MAX_VALUE);
  });
});

function generateNumbers(count: number, minExponent: number, maxExponent: number): number[] {
  const values: number[] = [];
  let seed = 0xdecafbad;

  for (let i = 0; i < count; i += 1) {
    seed = nextSeed(seed);
    const sign = seed % 2 === 0 ? 1 : -1;
    seed = nextSeed(seed);
    const mantissa = 1 + (seed / 0xffffffff) * 8.999;
    seed = nextSeed(seed);
    const exponent = minExponent + (seed % (maxExponent - minExponent + 1));
    values.push(sign * mantissa * 10 ** exponent);
  }

  values.push(1e-300, -1e-300, 1e300, -1e300);
  return values;
}

function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function expectRelative(actual: number, expected: number): void {
  if (expected === 0) {
    expect(Math.abs(actual)).toBeLessThan(1e-250);
    return;
  }

  expect(Math.abs((actual - expected) / expected)).toBeLessThan(1e-12);
}
