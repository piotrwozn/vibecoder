import type { Big } from "./bignum";
import type {
  GameState,
  IncidentResponseId,
  ProductionIncidentType,
  SprintPriority
} from "./state";

export interface Events {
  bought: {
    id: string;
    kind: "equity" | "generator" | "hardware" | "insight" | "paradox" | "research" | "upgrade";
  };
  "bug:fixed": { productId: string };
  "bug:spawned": { productId: string };
  "era:changed": number;
  prestige: { layer: 1 | 2 | 3 };
  "production:changed": { locRate: Big };
  "incident:resolved": {
    id: string;
    response: IncidentResponseId;
    type: ProductionIncidentType;
  };
  "incident:spawned": {
    id: string;
    type: ProductionIncidentType;
  };
  "momentum:changed": { delta: number; value: number };
  "project-chain:completed": { chainId: string };
  "res:changed": keyof GameState["res"];
  "roadmap:sprint-completed": { priority: SprintPriority };
  "roadmap:sprint-started": { priority: SprintPriority };
  shipped: { level?: number; payout: Big; projectId: string; upgraded?: boolean };
  "story:message": { eventId: string };
  unlock: { id: string; kind: string };
}

export type EventName = keyof Events;
export type EventHandler<Name extends EventName> = (payload: Events[Name]) => void;
type RawEventHandler = (payload: unknown) => void;

export interface EventBus {
  emit<Name extends EventName>(name: Name, payload: Events[Name]): void;
  on<Name extends EventName>(name: Name, handler: EventHandler<Name>): () => void;
}

interface DispatchContext {
  snapshot: RawEventHandler[] | undefined;
}

export function createEventBus(): EventBus {
  const handlers = new Map<EventName, Set<RawEventHandler>>();
  const activeDispatches = new Map<EventName, DispatchContext[]>();

  return {
    emit<Name extends EventName>(name: Name, payload: Events[Name]): void {
      const listeners = handlers.get(name);

      if (listeners === undefined) {
        return;
      }

      const context: DispatchContext = { snapshot: undefined };
      let dispatches = activeDispatches.get(name);

      if (dispatches === undefined) {
        dispatches = [];
        activeDispatches.set(name, dispatches);
      }

      dispatches.push(context);
      let index = 0;

      try {
        for (const listener of listeners) {
          if (context.snapshot !== undefined) {
            break;
          }

          dispatchListener(name, listener, payload);
          index += 1;
        }

        const snapshot = context.snapshot;
        if (snapshot !== undefined) {
          for (; index < snapshot.length; index += 1) {
            dispatchListener(name, snapshot[index]!, payload);
          }
        }
      } finally {
        dispatches.pop();
        if (dispatches.length === 0) {
          activeDispatches.delete(name);
        }
      }
    },

    on<Name extends EventName>(name: Name, handler: EventHandler<Name>): () => void {
      let listeners = handlers.get(name);

      if (listeners === undefined) {
        listeners = new Set();
        handlers.set(name, listeners);
      }

      const rawHandler = handler as RawEventHandler;
      snapshotActiveDispatches(name, listeners, activeDispatches);
      listeners.add(rawHandler);

      return () => {
        snapshotActiveDispatches(name, listeners, activeDispatches);
        listeners.delete(rawHandler);
      };
    }
  };
}

function snapshotActiveDispatches(
  name: EventName,
  listeners: Set<RawEventHandler>,
  activeDispatches: Map<EventName, DispatchContext[]>
): void {
  const dispatches = activeDispatches.get(name);

  if (dispatches === undefined) {
    return;
  }

  for (const context of dispatches) {
    context.snapshot ??= Array.from(listeners);
  }
}

function dispatchListener(name: EventName, listener: RawEventHandler, payload: unknown): void {
  try {
    listener(payload);
  } catch (error) {
    reportListenerError(name, error);
  }
}

function reportListenerError(name: EventName, error: unknown): void {
  console.error(`event handler failed for ${String(name)}`, error);
}
