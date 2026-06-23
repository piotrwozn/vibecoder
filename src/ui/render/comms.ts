import { t } from "../../i18n/i18n";
import { el, setText, text } from "../dom";
import type {
  AppActions,
  CommsChannel,
  CommsChoiceView,
  CommsMessageView,
  CommsView
} from "./view-types";

export interface CommsNodes {
  readonly badge: HTMLElement;
  readonly channel: CommsChannel;
  currentView: CommsView | undefined;
  readonly empty: HTMLElement;
  lastEntryId: string;
  readonly list: HTMLElement;
  readonly messages: Map<string, CommsMessageNodes>;
  messageCount: number;
  readonly root: HTMLElement;
}

interface CommsMessageNodes {
  readonly choices: HTMLElement;
  readonly lines: readonly Text[];
  readonly root: HTMLElement;
  readonly selected: Text;
}

export function createCommsPanels(
  view: CommsView,
  actions: AppActions
): Record<CommsChannel, CommsNodes> {
  return {
    chat: createCommsPanel("chat", view, actions),
    mail: createCommsPanel("mail", view, actions),
    feed: createCommsPanel("feed", view, actions)
  };
}

function createCommsPanel(channel: CommsChannel, view: CommsView, actions: AppActions): CommsNodes {
  const panel = el("aside", { className: "comms" });
  const header = el("div", { className: "comms__header" });
  const title = el("h2", { className: "comms__title" });
  title.append(text(t(`ui.app.${channel}`)));

  const badge = el("span", { className: "comms__badge" });
  header.append(title, badge);

  const list = el("section", { className: "comms__list" });
  const empty = el("p", { className: "comms__empty" });
  empty.append(text(t("ui.comms.empty")));

  panel.append(header, list, empty);

  const nodes = {
    root: panel,
    badge,
    channel,
    currentView: undefined,
    empty,
    lastEntryId: "",
    list,
    messages: new Map<string, CommsMessageNodes>(),
    messageCount: 0
  };
  updateComms(nodes, view, actions);
  return nodes;
}

export function updateComms(nodes: CommsNodes, view: CommsView, actions: AppActions): void {
  if (shouldSkipCommsUpdate(nodes.currentView, nodes.channel, view, nodes.channel)) {
    return;
  }

  nodes.currentView = view;
  nodes.root.classList.toggle("comms--quiet", view.quiet);
  const unreadCount = view.unreadByChannel[nodes.channel];
  nodes.badge.hidden = unreadCount === 0;
  setElementText(nodes.badge, t("ui.comms.unread", { count: unreadCount }));
  const messages = getCommsMessagesForChannel(view, nodes.channel);

  if (isCommsStructureChanged(messages, nodes.messageCount, nodes.lastEntryId)) {
    syncCommsMessageNodes(nodes, messages, actions);
  }

  for (const message of messages) {
    const messageNodes = nodes.messages.get(message.entryId);

    if (messageNodes === undefined) {
      continue;
    }

    updateCommsMessage(messageNodes, message, actions, view.quiet);
  }

  nodes.empty.hidden = messages.length > 0;
}

function syncCommsMessageNodes(
  nodes: CommsNodes,
  messages: readonly CommsMessageView[],
  actions: AppActions
): void {
  const previousLastEntryId = messages[nodes.messageCount - 1]?.entryId ?? "";
  const canAppend = nodes.messageCount === 0 || previousLastEntryId === nodes.lastEntryId;

  if (messages.length < nodes.messageCount || !canAppend) {
    nodes.messages.clear();
    nodes.list.replaceChildren();
    nodes.messageCount = 0;
  }

  for (let index = nodes.messageCount; index < messages.length; index += 1) {
    const message = messages[index];

    if (message !== undefined) {
      nodes.list.append(createCommsMessage(message, actions, nodes.messages));
    }
  }

  nodes.messageCount = messages.length;
  nodes.lastEntryId = getLastEntryId(messages);
}

function createCommsMessage(
  message: CommsMessageView,
  actions: AppActions,
  messages: Map<string, CommsMessageNodes>
): HTMLElement {
  const root = el("article", {
    ariaLabel: t("ui.comms.messageAria", {
      channel: t(`ui.comms.${message.channel}`),
      speaker: message.speaker
    }),
    className: "comms-message"
  });
  const header = el("div", { className: "comms-message__header" });
  const speaker = el("strong", { className: "comms-message__speaker" });
  speaker.append(text(message.speaker));
  const channel = el("span", { className: "comms-message__channel" });
  channel.append(text(t(`ui.comms.${message.channel}`)));
  header.append(speaker, channel);

  const body = el("div", { className: "comms-message__body" });
  const lines = message.lines.map((line) => {
    const lineNode = el("p", { className: "comms-message__line" });
    const lineText = text(line);
    lineNode.append(lineText);
    body.append(lineNode);
    return lineText;
  });

  const choices = el("div", { className: "comms-message__choices" });
  const selected = text("");
  const selectedNode = el("p", { className: "comms-message__selected" });
  selectedNode.append(selected);

  root.append(header, body, choices, selectedNode);
  const nodes = { root, choices, lines, selected };
  messages.set(message.entryId, nodes);
  updateCommsMessage(nodes, message, actions, false);
  return root;
}

function updateCommsMessage(
  nodes: CommsMessageNodes,
  message: CommsMessageView,
  actions: AppActions,
  quiet: boolean
): void {
  nodes.root.classList.toggle("comms-message--unread", message.unread);
  nodes.root.classList.toggle("comms-message--typing", message.unread && !quiet);
  nodes.choices.hidden = message.choices.length === 0 || !message.pendingChoice;

  const choiceSignature = getCommsChoiceSignature(message);
  if (nodes.choices.dataset.signature !== choiceSignature) {
    nodes.choices.dataset.signature = choiceSignature;
    nodes.choices.replaceChildren(
      ...message.choices.map((choice) => createCommsChoiceButton(message, choice, actions))
    );
  }

  const selected = message.choices.find((choice) => choice.selected);
  setText(
    nodes.selected,
    selected === undefined ? "" : t("ui.comms.choiceSelected", { choice: selected.label })
  );
}

function createCommsChoiceButton(
  message: CommsMessageView,
  choice: CommsChoiceView,
  actions: AppActions
): HTMLButtonElement {
  const button = el("button", { className: "comms-message__choice", title: choice.label });
  button.type = "button";
  button.disabled = !message.pendingChoice;
  button.append(text(choice.label));
  button.addEventListener("click", () => {
    actions.chooseStoryChoice(message.eventId, choice.id);
  });
  return button;
}

function getCommsChoiceSignature(message: CommsMessageView): string {
  if (message.choices.length === 0) {
    return message.pendingChoice ? "1:" : "0:";
  }

  let signature = message.pendingChoice ? "1:" : "0:";

  for (const choice of message.choices) {
    signature += `${choice.id},`;
  }

  return signature;
}

export function shouldSkipCommsUpdate(
  currentView: CommsView | undefined,
  currentChannel: CommsChannel,
  nextView: CommsView,
  nextChannel: CommsChannel
): boolean {
  return currentView === nextView && currentChannel === nextChannel;
}

export function isCommsStructureChanged(
  messages: readonly Pick<CommsMessageView, "entryId">[],
  messageCount: number,
  lastEntryId: string
): boolean {
  return messages.length !== messageCount || getLastEntryId(messages) !== lastEntryId;
}

function getLastEntryId(messages: readonly Pick<CommsMessageView, "entryId">[]): string {
  return messages[messages.length - 1]?.entryId ?? "";
}

function getCommsMessagesForChannel(
  view: CommsView,
  channel: CommsChannel
): readonly CommsMessageView[] {
  return view.messages.filter((message) => message.channel === channel);
}

function setElementText(node: HTMLElement, value: string): void {
  if (node.textContent !== value) {
    node.textContent = value;
  }
}
