import { exportGameState } from "../core/save";
import type { GameState } from "../core/state";

export function exportCurrentGameState(state: GameState, nowMs: number): string {
  state.meta.lastSimTickMs = nowMs;
  return exportGameState(state);
}
