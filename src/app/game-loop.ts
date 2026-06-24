import type { EventBus } from "../core/bus";
import { startLoop } from "../core/loop";
import type { GameState } from "../core/state";
import type { ViewInvalidation } from "../core/view-invalidation";
import { tickAchievements } from "../systems/achievements";
import { tickAutomation } from "../systems/automation";
import { tickAurora } from "../systems/aurora";
import { isBankrupt } from "../systems/bank";
import { tickBilling } from "../systems/billing";
import { tickDebt } from "../systems/debt";
import { tickHype } from "../systems/hype";
import { tickProductionIncidents } from "../systems/incidents";
import { tickBuildMomentum } from "../systems/momentum";
import { tickIterationHold, isRewriteBooting } from "../systems/prestige";
import { tickProduction, recomputeDerivedCache, type DerivedCache } from "../systems/production";
import { tickProjects } from "../systems/projects";
import { tickPromptFlow } from "../systems/prompt";
import { clampCoreResources } from "../systems/resources";
import {
  getSprintCooldownRemainingS,
  getSprintTimeRemainingS,
  tickRoadmap
} from "../systems/roadmap";
import { tickStats } from "../systems/stats";
import { tickStory } from "../systems/story";
import type { DevPerfPanel } from "../dev/perf-panel";
import type { AppShell } from "../ui/render";
import { isWindowVisible } from "../ui/wm/window-manager";

export interface GameLoopOptions {
  readonly app: () => AppShell;
  readonly bus: EventBus;
  readonly cache: DerivedCache;
  readonly catchUp: (elapsedMs: number) => void;
  readonly devPerfPanel: DevPerfPanel | undefined;
  readonly getState: () => GameState;
  readonly invalidation: ViewInvalidation;
  readonly now?: () => number;
  readonly requestFrame?: (callback: FrameRequestCallback) => number;
  readonly updateVisibleView: () => void;
}

export function startVibecoderLoop(options: GameLoopOptions): void {
  startLoop({
    catchUp: options.catchUp,
    metrics:
      options.devPerfPanel === undefined
        ? undefined
        : {
            frame: options.devPerfPanel.recordFrame,
            tick: options.devPerfPanel.recordTick
          },
    now: options.now,
    requestFrame: options.requestFrame,

    tick(dtS): void {
      const state = options.getState();
      const wasBooting = isRewriteBooting(state);
      const roadmapTimerSignatureBefore = getRoadmapTimerRefreshSignature(state);
      options.invalidation.markVisibleChanged(clampCoreResources(state, options.bus));
      if (isBankrupt(state)) {
        state.meta.lastSimTickMs = Date.now();
        return;
      }

      state.meta.playtimeS += dtS;
      state.meta.lastSimTickMs = Date.now();
      options.invalidation.markVisibleChanged(tickBuildMomentum(state, dtS, options.bus));
      options.invalidation.markVisibleChanged(tickPromptFlow(state, dtS));
      tickProduction(state, options.cache, dtS, options.bus);
      options.invalidation.markVisibleChanged(tickProjects(state, options.cache, dtS, options.bus));
      options.invalidation.markVisibleChanged(tickBilling(state, options.cache, dtS, options.bus));
      if (isBankrupt(state)) {
        options.invalidation.markVisibleChanged(clampCoreResources(state, options.bus));
        return;
      }

      options.invalidation.markVisibleChanged(tickAurora(state, dtS, options.bus));
      options.invalidation.markVisibleChanged(tickRoadmap(state, options.bus));
      options.invalidation.markVisibleChanged(tickProductionIncidents(state, options.bus));
      options.invalidation.markVisibleChanged(tickHype(state, dtS, options.cache, options.bus));
      options.invalidation.markVisibleChanged(tickDebt(state, options.cache, dtS, options.bus));
      options.invalidation.markVisibleChanged(
        tickAutomation(state, options.cache, dtS, options.bus)
      );
      options.invalidation.markVisibleChanged(tickStory(state, dtS, options.cache, options.bus));
      options.invalidation.markVisibleChanged(
        tickIterationHold(state, options.cache, dtS, options.bus)
      );
      options.invalidation.markVisibleChanged(clampCoreResources(state, options.bus));
      options.invalidation.markVisibleChanged(tickStats(state, options.cache));
      options.invalidation.markVisibleChanged(tickAchievements(state, options.cache, options.bus));
      options.invalidation.markVisibleChanged(wasBooting && !isRewriteBooting(state));
      options.invalidation.markVisibleChanged(
        roadmapTimerSignatureBefore !== getRoadmapTimerRefreshSignature(state)
      );
    },

    render(alpha): void {
      options.app().updateFrameAlpha(alpha);

      const dirty = options.invalidation.consume();
      if (dirty.cache) {
        recomputeDerivedCache(options.getState(), options.cache);
      }

      if (dirty.view) {
        options.updateVisibleView();
      }
    }
  });
}

export function getRoadmapTimerRefreshSignature(state: GameState): string {
  if (!isWindowVisible(state.ui.windows.roadmap)) {
    return "";
  }

  const parts: string[] = [];
  appendCountdownSignature(parts, "sprint", getSprintTimeRemainingS(state));
  appendCountdownSignature(parts, "cooldown", getSprintCooldownRemainingS(state));

  for (const incident of state.incidents.active) {
    appendCountdownSignature(
      parts,
      `incident:${incident.id}`,
      incident.untilS - state.meta.playtimeS
    );
  }

  return parts.join("|");
}

function appendCountdownSignature(parts: string[], key: string, seconds: number): void {
  if (seconds > 0) {
    parts.push(`${key}:${Math.ceil(seconds)}`);
  }
}
