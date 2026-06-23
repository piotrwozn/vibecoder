import { describe, expect, it } from "vitest";

import {
  createViewInvalidation,
  flushViewInvalidation,
  markResourceEvent
} from "../src/core/view-invalidation";

describe("M2 view invalidation", () => {
  it("does not invalidate DerivedCache for resource ticks", () => {
    const invalidation = createViewInvalidation(false);

    markResourceEvent(invalidation, "money");

    expect(invalidation.consume()).toEqual({ cache: false, view: true });
    expect(invalidation.consume()).toEqual({ cache: false, view: false });
  });

  it("invalidates DerivedCache when debt changes", () => {
    const invalidation = createViewInvalidation(false);

    markResourceEvent(invalidation, "debt");

    expect(invalidation.consume()).toEqual({ cache: true, view: true });
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

  it("flushes invalidation handlers immediately and consumes dirty state", () => {
    const invalidation = createViewInvalidation(false);
    let recomputes = 0;
    let viewUpdates = 0;

    invalidation.markStructuralChanged();

    expect(
      flushViewInvalidation(invalidation, {
        recomputeCache(): void {
          recomputes += 1;
        },
        updateView(): void {
          viewUpdates += 1;
        }
      })
    ).toEqual({ cache: true, view: true });
    expect(recomputes).toBe(1);
    expect(viewUpdates).toBe(1);
    expect(invalidation.consume()).toEqual({ cache: false, view: false });
  });
});
