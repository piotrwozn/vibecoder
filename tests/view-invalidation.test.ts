import { describe, expect, it } from "vitest";

import { createViewInvalidation, markResourceEvent } from "../src/core/view-invalidation";

describe("M2 view invalidation", () => {
  it("does not invalidate DerivedCache for resource ticks", () => {
    const invalidation = createViewInvalidation(false);

    markResourceEvent(invalidation, "money");

    expect(invalidation.consume()).toEqual({ cache: false, view: true });
    expect(invalidation.consume()).toEqual({ cache: false, view: false });
  });

  it("does not invalidate DerivedCache when debt changes", () => {
    const invalidation = createViewInvalidation(false);

    markResourceEvent(invalidation, "debt");

    expect(invalidation.consume()).toEqual({ cache: false, view: true });
    expect(invalidation.consume()).toEqual({ cache: false, view: false });
  });

  it("separates structural cache changes from flow-only view changes", () => {
    const invalidation = createViewInvalidation(false);

    invalidation.markVisibleChanged(true);
    expect(invalidation.consume()).toEqual({ cache: false, view: true });

    invalidation.markVisibleChanged(false);
    expect(invalidation.consume()).toEqual({ cache: false, view: false });

    invalidation.markStructuralChanged();
    expect(invalidation.consume()).toEqual({ cache: true, view: true });
  });
});
