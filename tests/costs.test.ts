import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";

describe("geometric costs", () => {
  it("matches brute-force bulk costs for agent and hardware growth ranges", () => {
    const growthValues = [1.1, 1.15, 1.8, 2.2];

    for (const growth of growthValues) {
      for (const owned of [0, 1, 7, 25]) {
        for (const quantity of [1, 2, 5, 10]) {
          const formula = Big.bulkCost(Big.one(), growth, owned, quantity);
          const brute = bruteForceBulkCost(growth, owned, quantity);

          expectRelative(formula.toNumber(), brute.toNumber());
        }
      }
    }
  });

  it("matches brute-force maxAffordable", () => {
    const growthValues = [1.1, 1.15, 1.8, 2.2];

    for (const growth of growthValues) {
      for (const owned of [0, 4, 12]) {
        for (const expectedQuantity of [0, 1, 3, 8, 15]) {
          const exactBudget = bruteForceBulkCost(growth, owned, expectedQuantity);
          expect(Big.maxAffordable(Big.one(), growth, owned, exactBudget)).toBe(expectedQuantity);

          const nextCost = Big.cost(Big.one(), growth, owned + expectedQuantity);
          const almostNextBudget = Big.add(exactBudget, Big.mul(nextCost, Big.fromNumber(0.999)));
          expect(Big.maxAffordable(Big.one(), growth, owned, almostNextBudget)).toBe(
            expectedQuantity
          );
        }
      }
    }

    expect(Big.maxAffordable(Big.one(), 1.1, 400, bruteForceBulkCost(1.1, 400, 250))).toBe(250);
    expect(Big.bulkCost(Big.fromNumber(5), 1, 3, 4).toNumber()).toBe(20);
    expect(Big.maxAffordable(Big.fromNumber(5), 1, 3, Big.fromNumber(20))).toBe(4);
  });
});

function bruteForceBulkCost(growth: number, owned: number, quantity: number): Big {
  let total = Big.zero();

  for (let i = 0; i < quantity; i += 1) {
    total = Big.add(total, Big.cost(Big.one(), growth, owned + i));
  }

  return total;
}

function expectRelative(actual: number, expected: number): void {
  expect(Math.abs((actual - expected) / expected)).toBeLessThan(1e-11);
}
