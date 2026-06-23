import type { GameState } from "./state";

export interface ViewInvalidationFlags {
  readonly cache: boolean;
  readonly view: boolean;
}

export interface ViewInvalidation {
  consume(): ViewInvalidationFlags;
  markResourceChanged(): void;
  markStructuralChanged(): void;
  markVisibleChanged(changed: boolean): void;
}

export interface ViewInvalidationHandlers {
  recomputeCache(): void;
  updateView(): void;
}

export function createViewInvalidation(initialViewDirty = true): ViewInvalidation {
  let cacheDirty = false;
  let viewDirty = initialViewDirty;

  return {
    consume(): ViewInvalidationFlags {
      const flags = {
        cache: cacheDirty,
        view: viewDirty
      };
      cacheDirty = false;
      viewDirty = false;
      return flags;
    },

    markResourceChanged(): void {
      viewDirty = true;
    },

    markStructuralChanged(): void {
      cacheDirty = true;
      viewDirty = true;
    },

    markVisibleChanged(changed: boolean): void {
      if (changed) {
        viewDirty = true;
      }
    }
  };
}

export function flushViewInvalidation(
  invalidation: ViewInvalidation,
  handlers: ViewInvalidationHandlers
): ViewInvalidationFlags {
  const dirty = invalidation.consume();
  if (dirty.cache) {
    handlers.recomputeCache();
  }

  if (dirty.view) {
    handlers.updateView();
  }

  return dirty;
}

export function markResourceEvent(
  invalidation: ViewInvalidation,
  resource: keyof GameState["res"]
): void {
  if (resource === "debt") {
    invalidation.markStructuralChanged();
    return;
  }

  invalidation.markResourceChanged();
}
