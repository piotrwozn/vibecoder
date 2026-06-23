import type { AppId } from "../core/ui-state";
import type { StoryChannel } from "../data/story/types";
import { hasMessage, t } from "../i18n/i18n";
import {
  getStoryEvent,
  getUnreadStoryCount,
  isStoryInboxEntryUnread,
  markStoryInboxRead
} from "../systems/story";
import { getAppIconPath, type AppShell, type CommsMessageView, type CommsView } from "../ui/render";
import { openWindow, type WindowBounds } from "../ui/wm/window-manager";
import type { GameState } from "../core/state";

export interface CommsController {
  getNotificationWindowBounds(): WindowBounds;
  getStoryLines(textKey: string): readonly string[];
  getStoryMessageAppId(eventId: string): CommsMessageView["channel"] | undefined;
  getView(): CommsView;
  markAppRead(appId: AppId): void;
  markDirty(): void;
  showStoryToast(appId: AppId | undefined): void;
}

export interface CommsControllerOptions {
  readonly app: () => AppShell;
  readonly getState: () => GameState;
  readonly persistNow: () => Promise<boolean>;
  readonly updateVisibleView: () => void;
}

export function createCommsController(options: CommsControllerOptions): CommsController {
  let viewCache: CommsView | undefined;
  let viewDirty = true;

  const markDirty = (): void => {
    viewDirty = true;
  };

  const getStoryLines = (textKey: string): readonly string[] => {
    const lines: string[] = [];

    for (let index = 1; hasMessage(`${textKey}.${index}`); index += 1) {
      lines.push(t(`${textKey}.${index}`));
    }

    return lines.length > 0 ? lines : [t(textKey)];
  };

  const getCommsChannel = (channel: StoryChannel): CommsMessageView["channel"] => {
    if (channel === "chat" || channel === "mail") {
      return channel;
    }

    return "feed";
  };

  const getCommsAppChannel = (appId: AppId): CommsMessageView["channel"] | undefined => {
    if (appId === "chat" || appId === "mail" || appId === "feed") {
      return appId;
    }

    return undefined;
  };

  const getView = (): CommsView => {
    if (viewCache === undefined || viewDirty) {
      const state = options.getState();
      const latestInboxIndexByEventId = new Map<string, number>();
      state.story.inbox.forEach((entry, index) => {
        latestInboxIndexByEventId.set(entry.eventId, index);
      });

      viewCache = {
        messages: state.story.inbox
          .map((entry, index): CommsMessageView | undefined => {
            const event = getStoryEvent(entry.eventId);

            if (event === undefined) {
              return undefined;
            }

            const selectedChoiceId = state.story.choices[event.id];
            const latestEventIndex = latestInboxIndexByEventId.get(event.id) ?? -1;

            return {
              entryId: entry.id,
              eventId: entry.eventId,
              channel: getCommsChannel(event.channel),
              choices: (event.choices ?? []).map((choice) => ({
                id: choice.id,
                label: t(choice.textKey),
                selected: selectedChoiceId === choice.id
              })),
              lines: getStoryLines(event.textKey),
              pendingChoice:
                event.choices !== undefined &&
                selectedChoiceId === undefined &&
                index === latestEventIndex,
              speaker: t(`story.speaker.${event.speaker}`),
              unread: isStoryInboxEntryUnread(state, entry, index)
            };
          })
          .filter((message): message is CommsMessageView => message !== undefined),
        quiet: state.settings.doNotDisturb || state.settings.reducedFx,
        unreadByChannel: {
          chat: getUnreadStoryCount(state, "chat"),
          mail: getUnreadStoryCount(state, "mail"),
          feed: getUnreadStoryCount(state, "feed")
        },
        unreadCount: getUnreadStoryCount(state)
      };
      viewDirty = false;
    }

    return viewCache;
  };

  const markAppRead = (appId: AppId): void => {
    const channel = getCommsAppChannel(appId);

    if (channel === undefined) {
      return;
    }

    if (markStoryInboxRead(options.getState(), channel)) {
      markDirty();
    }
  };

  const getNotificationWindowBounds = (): WindowBounds => ({
    height: Math.max(1, (window.innerHeight || 800) - 112),
    width: Math.max(1, window.innerWidth || 1280)
  });

  const getStoryToastKey = (channel: CommsMessageView["channel"]): string => {
    switch (channel) {
      case "chat":
        return "ui.toast.newChat";
      case "mail":
        return "ui.toast.newMail";
      case "feed":
        return "ui.toast.newFeed";
    }
  };

  return {
    getNotificationWindowBounds,
    getStoryLines,

    getStoryMessageAppId(eventId: string): CommsMessageView["channel"] | undefined {
      const event = getStoryEvent(eventId);
      return event === undefined ? undefined : getCommsChannel(event.channel);
    },

    getView,
    markAppRead,
    markDirty,

    showStoryToast(appId: AppId | undefined): void {
      const channel = appId === undefined ? undefined : getCommsAppChannel(appId);

      if (appId === undefined || channel === undefined) {
        return;
      }

      options.app().showToast(t(getStoryToastKey(channel)), "accent", {
        iconPath: getAppIconPath(appId),
        onClick: () => {
          const state = options.getState();
          openWindow(state.ui.windows, appId, getNotificationWindowBounds());
          markAppRead(appId);
          state.ui.scene = "desktop";
          options.updateVisibleView();
          void options.persistNow();
        }
      });
    }
  };
}
