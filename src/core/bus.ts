import type { Big } from "./bignum";
import type { GameState } from "./state";

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
  "res:changed": keyof GameState["res"];
  shipped: { payout: Big; projectId: string };
  "story:message": { eventId: string };
  unlock: { id: string; kind: string };
}

export type EventName = keyof Events;
export type EventHandler<Name extends EventName> = (payload: Events[Name]) => void;

export interface EventBus {
  emit<Name extends EventName>(name: Name, payload: Events[Name]): void;
  on<Name extends EventName>(name: Name, handler: EventHandler<Name>): () => void;
}

export function createEventBus(): EventBus {
  const handlers = new Map<EventName, Set<(payload: unknown) => void>>();

  return {
    emit<Name extends EventName>(name: Name, payload: Events[Name]): void {
      const listeners = handlers.get(name);

      if (listeners === undefined) {
        return;
      }

      for (const listener of listeners) {
        listener(payload);
      }
    },

    on<Name extends EventName>(name: Name, handler: EventHandler<Name>): () => void {
      let listeners = handlers.get(name);

      if (listeners === undefined) {
        listeners = new Set();
        handlers.set(name, listeners);
      }

      listeners.add(handler as (payload: unknown) => void);

      return () => {
        listeners.delete(handler as (payload: unknown) => void);
      };
    }
  };
}
