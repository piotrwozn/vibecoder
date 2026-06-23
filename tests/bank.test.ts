import { describe, expect, it } from "vitest";

import { Big } from "../src/core/bignum";
import { createEventBus } from "../src/core/bus";
import { createDefaultGameState } from "../src/core/state";
import {
  accrueBankOverdraft,
  BANK_DEFAULT_THRESHOLD,
  BANK_WARNING_1_THRESHOLD,
  BANK_WARNING_2_THRESHOLD,
  repayBankOverdraft,
  syncBankThresholds
} from "../src/systems/bank";
import { createBillingBreakdown, tickBilling } from "../src/systems/billing";
import { buyGenerator, createDerivedCache, recomputeDerivedCache } from "../src/systems/production";

describe("bank overdraft", () => {
  it("issues bank notices once at overdraft thresholds and defaults at 10000", () => {
    const state = createDefaultGameState(0, "full");
    const bus = createEventBus();
    const messages: string[] = [];
    bus.on("story:message", ({ eventId }) => {
      messages.push(eventId);
    });

    expect(accrueBankOverdraft(state, Big.sub(BANK_WARNING_1_THRESHOLD, Big.one()), bus)).toBe(
      true
    );
    expect(state.bank.warningsIssued).toBe(0);
    expect(messages).toEqual([]);

    expect(accrueBankOverdraft(state, Big.one(), bus)).toBe(true);
    expect(state.bank.warningsIssued).toBe(1);
    expect(messages).toEqual(["bank_overdraft_warning_1"]);

    expect(
      accrueBankOverdraft(state, Big.sub(BANK_WARNING_2_THRESHOLD, BANK_WARNING_1_THRESHOLD), bus)
    ).toBe(true);
    expect(state.bank.warningsIssued).toBe(2);
    expect(messages).toEqual(["bank_overdraft_warning_1", "bank_overdraft_warning_2"]);

    expect(
      accrueBankOverdraft(state, Big.sub(BANK_DEFAULT_THRESHOLD, BANK_WARNING_2_THRESHOLD), bus)
    ).toBe(true);
    expect(state.bank.defaulted).toBe(true);
    expect(state.bank.defaultedAtS).toBe(0);
    expect(messages).toEqual([
      "bank_overdraft_warning_1",
      "bank_overdraft_warning_2",
      "bank_overdraft_default"
    ]);

    expect(syncBankThresholds(state, bus)).toBe(false);
    expect(messages).toHaveLength(3);
    expect(state.story.inbox.map((entry) => entry.eventId)).toEqual(messages);
  });

  it("repays overdraft from money before cash is spendable", () => {
    const state = createDefaultGameState(0, "full");
    state.bank.overdraft = Big.fromNumber(100);
    state.res.money = Big.fromNumber(40);

    expect(repayBankOverdraft(state)).toBe(true);
    expect(state.res.money.eq0()).toBe(true);
    expect(state.bank.overdraft.toNumber()).toBeCloseTo(60);

    state.res.money = Big.fromNumber(100);

    expect(repayBankOverdraft(state)).toBe(true);
    expect(state.bank.overdraft.eq0()).toBe(true);
    expect(state.res.money.toNumber()).toBe(40);
  });

  it("ignores negative overdraft deltas", () => {
    const state = createDefaultGameState(0, "full");

    expect(accrueBankOverdraft(state, Big.fromNumber(-100))).toBe(false);
    expect(state.bank.overdraft.eq0()).toBe(true);
    expect(state.bank.defaulted).toBe(false);
  });

  it("adds unpaid recurring billing to bank debt while keeping money non-negative", () => {
    const state = createDefaultGameState(0, "full");
    state.owned.hardware.h_cpu = 1;
    state.res.money = Big.zero();
    const bill = createBillingBreakdown(state).total;

    expect(bill.gt(Big.zero())).toBe(true);
    expect(tickBilling(state, 1)).toBe(true);
    expect(state.res.money.eq0()).toBe(true);
    expect(state.bank.overdraft.eq(bill)).toBe(true);
  });

  it("does not compound hardware debt while power is already paused", () => {
    const state = createDefaultGameState(0, "full");
    state.owned.hardware.h_cpu = 1;
    state.res.money = Big.zero();

    expect(tickBilling(state, 1)).toBe(true);
    const overdraft = state.bank.overdraft.copy();

    expect(tickBilling(state, 10)).toBe(true);
    expect(state.res.money.eq0()).toBe(true);
    expect(state.bank.overdraft.eq(overdraft)).toBe(true);
  });

  it("does not add bank debt for failed purchases", () => {
    const state = createDefaultGameState(0, "full");
    const cache = createDerivedCache();
    recomputeDerivedCache(state, cache);
    state.res.money = Big.zero();

    expect(buyGenerator(state, cache, "g_autocomplete", 1).ok).toBe(false);
    expect(state.bank.overdraft.eq0()).toBe(true);
    expect(state.res.money.eq0()).toBe(true);
  });
});
