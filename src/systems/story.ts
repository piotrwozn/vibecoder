import type { EventBus } from "../core/bus";
import { Big } from "../core/bignum";
import type { GameState, InboxEntry } from "../core/state";
import { ACT0_EVENTS } from "../data/story/act0";
import { ACT1_EVENTS } from "../data/story/act1";
import { ACT2_EVENTS } from "../data/story/act2";
import { ACT3_EVENTS } from "../data/story/act3";
import { ACT4_EVENTS } from "../data/story/act4";
import { ACT5_EVENTS } from "../data/story/act5";
import { ECHO_EVENTS } from "../data/story/echoes";
import type { StoryChannel, StoryEffect, StoryEvent } from "../data/story/types";
import { isDemoLocked } from "./demo";
import { addHype } from "./hype";
import type { DerivedCache } from "./production";
import { checkCondition } from "./unlocks";

export type StoryReadChannel = StoryChannel | "archive";

export interface StoryChoiceResult {
  readonly choiceId: string;
  readonly eventId: string;
  readonly ok: boolean;
  readonly reason?: "missing-event" | "missing-choice" | "not-pending";
}

const STORY_CHECK_INTERVAL_S = 1;
const READ_FLAG_PREFIX = "story.read.";
const SNOOZE_STAT_PREFIX = "story.snoozeUntil.";

export const STORY_EVENTS: readonly StoryEvent[] = [
  ...ACT0_EVENTS,
  ...ACT1_EVENTS,
  ...ACT2_EVENTS,
  ...ACT3_EVENTS,
  ...ACT4_EVENTS,
  ...ACT5_EVENTS,
  ...ECHO_EVENTS
] as const;

export function tickStory(
  state: GameState,
  dtS: number,
  cache?: DerivedCache,
  bus?: EventBus
): boolean {
  const previousS = Math.max(0, state.meta.playtimeS - dtS);
  const previousCheck = Math.floor(previousS / STORY_CHECK_INTERVAL_S);
  const currentCheck = Math.floor(state.meta.playtimeS / STORY_CHECK_INTERVAL_S);

  if (currentCheck <= previousCheck) {
    return false;
  }

  let changed = false;

  for (let check = previousCheck + 1; check <= currentCheck; check += 1) {
    changed = enqueueReadyStoryEvents(state, cache, bus) || changed;
  }

  return changed;
}

export function chooseStoryOption(
  state: GameState,
  eventId: string,
  choiceId: string,
  cache?: DerivedCache,
  bus?: EventBus
): StoryChoiceResult {
  const event = getStoryEvent(eventId);

  if (event === undefined || event.choices === undefined) {
    return { choiceId, eventId, ok: false, reason: "missing-event" };
  }

  if (!isChoicePending(state, event)) {
    return { choiceId, eventId, ok: false, reason: "not-pending" };
  }

  const choice = event.choices.find((entry) => entry.id === choiceId);

  if (choice === undefined) {
    return { choiceId, eventId, ok: false, reason: "missing-choice" };
  }

  state.story.choices[event.id] = choice.id;
  applyStoryEffects(state, event, choice.effects, cache, bus);
  bus?.emit("story:message", { eventId });

  return { choiceId, eventId, ok: true };
}

export function markStoryInboxRead(
  state: GameState,
  channel: StoryReadChannel = "archive"
): boolean {
  let changed = false;

  state.story.inbox.forEach((entry, index) => {
    const event = getStoryEvent(entry.eventId);

    if (event === undefined || !matchesReadChannel(event.channel, channel)) {
      return;
    }

    const flag = getReadFlag(entry, index);
    if (!state.story.flags.has(flag)) {
      state.story.flags.add(flag);
      changed = true;
    }
  });

  return changed;
}

export function getUnreadStoryCount(
  state: GameState,
  channel: StoryReadChannel = "archive"
): number {
  let unread = 0;

  state.story.inbox.forEach((entry, index) => {
    const event = getStoryEvent(entry.eventId);

    if (
      event !== undefined &&
      matchesReadChannel(event.channel, channel) &&
      !state.story.flags.has(getReadFlag(entry, index))
    ) {
      unread += 1;
    }
  });

  return unread;
}

export function isStoryInboxEntryUnread(
  state: GameState,
  entry: InboxEntry,
  index: number
): boolean {
  return !state.story.flags.has(getReadFlag(entry, index));
}

export function getStoryEvent(id: string): StoryEvent | undefined {
  return STORY_EVENTS.find((event) => event.id === id);
}

function enqueueReadyStoryEvents(state: GameState, cache?: DerivedCache, bus?: EventBus): boolean {
  let changed = false;
  let guard = 0;

  while (guard < STORY_EVENTS.length) {
    const event = STORY_EVENTS.find((candidate) => isStoryEventReady(state, candidate));

    if (event === undefined) {
      break;
    }

    enqueueStoryEvent(state, event, cache, bus);
    changed = true;
    guard += 1;
  }

  return changed;
}

function isStoryEventReady(state: GameState, event: StoryEvent): boolean {
  if (isDemoLocked(state, event)) {
    return false;
  }

  if (event.act !== state.story.act) {
    return false;
  }

  if (isChoicePending(state, event)) {
    return false;
  }

  if (event.choices !== undefined && state.story.choices[event.id] !== undefined) {
    const snoozedUntilS = getSnoozedUntilS(state, event.id);

    if (snoozedUntilS === undefined || state.meta.playtimeS < snoozedUntilS) {
      return false;
    }
  } else if ((event.once ?? true) && state.story.seen.has(event.id)) {
    return false;
  }

  return checkCondition(state, event.trigger);
}

function enqueueStoryEvent(
  state: GameState,
  event: StoryEvent,
  cache?: DerivedCache,
  bus?: EventBus
): void {
  if (event.choices !== undefined) {
    delete state.story.choices[event.id];
    delete state.stats[getSnoozeStatKey(event.id)];
  }

  state.story.inbox.push({ eventId: event.id });
  state.story.seen.add(event.id);
  applyStoryEffects(state, event, event.effects ?? [], cache, bus);
  bus?.emit("story:message", { eventId: event.id });
}

function isChoicePending(state: GameState, event: StoryEvent): boolean {
  return (
    event.choices !== undefined &&
    state.story.seen.has(event.id) &&
    state.story.choices[event.id] === undefined
  );
}

function applyStoryEffects(
  state: GameState,
  event: StoryEvent,
  effects: readonly StoryEffect[],
  cache?: DerivedCache,
  bus?: EventBus
): void {
  for (const effect of effects) {
    applyStoryEffect(state, event, effect, cache, bus);
  }
}

function applyStoryEffect(
  state: GameState,
  event: StoryEvent,
  effect: StoryEffect,
  cache?: DerivedCache,
  bus?: EventBus
): void {
  switch (effect.kind) {
    case "grantResource":
      applyResourceGrant(state, effect.resource, effect.amount, bus);
      break;
    case "grantRp":
      state.res.rp += effect.amount;
      bus?.emit("res:changed", "rp");
      break;
    case "hypeAdd":
      addHype(state, effect.amount, cache, bus);
      break;
    case "setAct":
      state.story.act = effect.act;
      break;
    case "setFlag":
      state.story.flags.add(effect.flag);
      break;
    case "setEnding":
      state.prestige.endingChoice = effect.choice;
      state.story.flags.add("iteration_unlocked");
      break;
    case "unlock":
      bus?.emit("unlock", { id: effect.id, kind: "story" });
      break;
    case "snoozeEvent":
      state.stats[getSnoozeStatKey(event.id)] = state.meta.playtimeS + effect.seconds;
      break;
  }
}

function applyResourceGrant(
  state: GameState,
  resource: "money",
  amount: string,
  bus?: EventBus
): void {
  switch (resource) {
    case "money": {
      const grant = Big.from(amount);
      Big.addIn(state.res.money, grant);
      Big.addIn(state.lifetime.money, grant);
      bus?.emit("res:changed", "money");
      break;
    }
  }
}

function getSnoozedUntilS(state: GameState, eventId: string): number | undefined {
  const value = state.stats[getSnoozeStatKey(eventId)];
  return typeof value === "number" ? value : undefined;
}

function getSnoozeStatKey(eventId: string): string {
  return `${SNOOZE_STAT_PREFIX}${eventId}`;
}

function getReadFlag(entry: InboxEntry, index: number): string {
  return `${READ_FLAG_PREFIX}${index}.${entry.eventId}`;
}

function matchesReadChannel(channel: StoryChannel, readChannel: StoryReadChannel): boolean {
  if (readChannel === "archive") {
    return true;
  }

  if (readChannel === "feed") {
    return channel === "feed" || channel === "system" || channel === "news";
  }

  return channel === readChannel;
}
