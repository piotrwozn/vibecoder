import type { GameState } from "../core/state";

export interface DemoLockable {
  readonly demoLocked?: boolean;
}

export function isDemoLocked(state: GameState, content: DemoLockable): boolean {
  return state.meta.edition === "demo" && content.demoLocked === true;
}
