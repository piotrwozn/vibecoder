import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  mountApp,
  getMissingAutomationToggleIds,
  isCommsStructureChanged,
  shouldSkipCommsUpdate,
  updateEditableSettingValue,
  updateProjectSummaryIncome,
  type AppActions,
  type CommsView,
  type DevFloorView,
  type ProjectsView
} from "../src/ui/render";
import { createDefaultWindowStates } from "../src/core/ui-state";
import { loadLocale, t } from "../src/i18n/i18n";

afterEach(async () => {
  vi.unstubAllGlobals();
  await loadLocale("en");
});

describe("M3 Projects rendering", () => {
  it("loads Polish UI labels with English fallback for untranslated content", async () => {
    await loadLocale("pl");

    expect(t("ui.boot.start")).toBe("START GRY");
    expect(t("ui.app.settings")).toBe("Ustawienia");
    expect(t("ui.settings.saveTools")).toBe("Narzędzia zapisu");
    expect(t("vibex.send")).toBe("Wyślij");
    expect(t("app.title")).toBe("VIBECODER");
  });

  it("updates the stored income summary text from the latest Projects view", () => {
    const income = { data: "$0/s" };
    const view = {
      activeBuilds: [],
      incomeRate: "$1/s",
      offers: [],
      portfolio: [],
      refactor: {
        buildTime: "30s",
        canStart: false,
        cost: "0 LoC",
        debt: "0",
        effect: "debt x0.4"
      }
    } satisfies ProjectsView;

    updateProjectSummaryIncome(income, view);

    expect(income.data).toBe("$1/s");
  });
});

describe("M6 automation rendering", () => {
  it("detects automation toggles that unlock after the initial mount", () => {
    const missing = getMissingAutomationToggleIds(
      [{ id: "autoPrompt" }, { id: "autoBuy:g_autocomplete" }, { id: "autoBuy:g_parrot" }],
      ["autoPrompt", "autoBuy:g_autocomplete"]
    );

    expect(missing).toEqual(["autoBuy:g_parrot"]);
  });
});

describe("M7 comms rendering", () => {
  it("skips unchanged comms updates and detects append-only inbox changes", () => {
    const view = createCommsView(["0.a0_01_boot"]);

    expect(shouldSkipCommsUpdate(view, "chat", view, "chat")).toBe(true);
    expect(shouldSkipCommsUpdate(view, "chat", view, "mail")).toBe(false);
    expect(isCommsStructureChanged(view.messages, 1, "0.a0_01_boot")).toBe(false);

    const appended = createCommsView(["0.a0_01_boot", "1.a0_02_zora_hi"]);

    expect(isCommsStructureChanged(appended.messages, 1, "0.a0_01_boot")).toBe(true);
  });
});

describe("M14 split app rendering", () => {
  it("routes comms content into separate Chat, Mail, and Feed windows", () => {
    installDom();
    const root = document.createElement("div");
    const view = {
      ...createDevFloorView(false),
      comms: {
        messages: [
          createCommsMessage("0.chat", "chat", "chat line"),
          createCommsMessage("1.mail", "mail", "mail line")
        ],
        quiet: false,
        unreadByChannel: { chat: 1, feed: 0, mail: 0 },
        unreadCount: 1
      }
    };
    view.ui.windows.chat.open = true;
    view.ui.windows.chat.z = 3;
    view.ui.windows.mail.open = true;
    view.ui.windows.mail.z = 4;

    mountApp(root, view, createActions());

    const chatWindow = root.querySelector<HTMLElement>('.desktop-window[data-app-id="chat"]');
    const mailWindow = root.querySelector<HTMLElement>('.desktop-window[data-app-id="mail"]');
    const chatIcon = root.querySelector<HTMLButtonElement>('.desktop-icon[data-app-id="chat"]');

    expect(chatWindow?.textContent).toContain("chat line");
    expect(chatWindow?.textContent).not.toContain("mail line");
    expect(mailWindow?.textContent).toContain("mail line");
    expect(chatIcon?.textContent).toContain("1");
    expect(chatIcon?.classList.contains("desktop-icon--pulse")).toBe(true);
  });

  it("makes actionable toasts clickable without story content in the toast", () => {
    installDom();
    const root = document.createElement("div");
    const app = mountApp(root, createDevFloorView(false), createActions());
    let opened = false;

    app.showToast("New chat message", "accent", {
      onClick: () => {
        opened = true;
      }
    });

    const toast = root.querySelector<HTMLButtonElement>(".toast");

    expect(toast?.textContent).toBe("New chat message");
    expect(toast?.textContent).not.toContain("chat line");
    toast?.click();
    expect(opened).toBe(true);
  });
});

describe("M4 Settings rendering", () => {
  it("does not overwrite an autosave value while the user is editing it", () => {
    const input = { defaultValue: "10", value: "1" };

    updateEditableSettingValue(input, "10", true);

    expect(input.value).toBe("1");
    expect(input.defaultValue).toBe("10");
  });

  it("refreshes idle autosave controls from state", () => {
    const input = { defaultValue: "10", value: "1" };

    updateEditableSettingValue(input, "15", false);

    expect(input.value).toBe("15");
    expect(input.defaultValue).toBe("15");
  });

  it("wires the replay tutorial action from desktop settings", () => {
    installDom();
    const root = document.createElement("div");
    let replayCount = 0;

    mountApp(root, createDevFloorView(false), {
      ...createActions(),
      replayTutorial: () => {
        replayCount += 1;
      }
    });

    findButton(root, "Replay tutorial")?.click();

    expect(replayCount).toBe(1);
  });
});

describe("M11 Rewrite rendering", () => {
  it("shows the fullscreen boot overlay only while a rewrite is booting", () => {
    installDom();
    const root = document.createElement("div");
    const app = mountApp(root, createDevFloorView(true), createActions());
    const overlay = root.querySelector<HTMLElement>(".rewrite-boot-overlay");

    expect(overlay).not.toBeNull();
    expect(overlay?.hidden).toBe(false);
    expect(overlay?.textContent).toContain("git init --new-life");

    app.updateDevFloor(createDevFloorView(false));

    expect(overlay?.hidden).toBe(true);
  });
});

describe("M12 demo rendering", () => {
  it("shows the full game panel and exports a save code", () => {
    installDom();
    const root = document.createElement("div");
    const app = mountApp(
      root,
      { ...createDevFloorView(false), fullGame: { visible: true } },
      { ...createActions(), exportSave: () => "SAVE-CODE" }
    );
    const panel = root.querySelector<HTMLElement>(".full-game-panel");
    const textarea = root.querySelector<HTMLTextAreaElement>(".full-game-panel__textarea");
    const button = root.querySelector<HTMLButtonElement>(".full-game-panel .settings-button");

    expect(panel).not.toBeNull();
    expect(panel?.hidden).toBe(false);
    button?.click();
    expect(textarea?.value).toBe("SAVE-CODE");

    app.updateDevFloor({ ...createDevFloorView(false), fullGame: { visible: false } });

    expect(panel?.hidden).toBe(true);
  });
});

describe("M13 desktop shell rendering", () => {
  it("ignores game shortcuts while the boot scene is active", () => {
    installDom();
    const root = document.createElement("div");
    let promptCount = 0;
    let openedCount = 0;

    mountApp(
      root,
      { ...createDevFloorView(false), ui: createShellUiView("boot") },
      {
        ...createActions(),
        openApp: () => {
          openedCount += 1;
        },
        prompt: () => {
          promptCount += 1;
          return { loc: "1" };
        }
      }
    );

    window.dispatchEvent(new window.KeyboardEvent("keydown", { key: " " }));
    window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "1" }));

    expect(promptCount).toBe(0);
    expect(openedCount).toBe(0);
  });

  it("renders the boot continue button and runs the desktop transition", () => {
    installDom();
    const root = document.createElement("div");
    let startCount = 0;

    mountApp(
      root,
      { ...createDevFloorView(false), ui: createShellUiView("boot") },
      {
        ...createActions(),
        startDesktop: () => {
          startCount += 1;
        }
      }
    );

    const bootScene = root.querySelector<HTMLElement>(".boot-scene");
    const continueButton = root.querySelector<HTMLButtonElement>(".boot-scene__button--continue");

    expect(continueButton?.textContent).toBe("CONTINUE");

    continueButton?.click();
    bootScene?.click();

    expect(startCount).toBe(1);
  });

  it("renders steam without the removed boot room animations", () => {
    installDom();
    const root = document.createElement("div");

    mountApp(
      root,
      { ...createDevFloorView(false), ui: createShellUiView("boot") },
      createActions()
    );

    expect(root.querySelectorAll(".monitor-light")).toHaveLength(0);
    expect(root.querySelector(".boot-stickman")).toBeNull();
    expect(root.querySelector(".boot-monitor-backglow")).toBeNull();
    expect(root.querySelector(".boot-keyboard-fight")).toBeNull();
    expect(root.querySelectorAll(".boot-room-plant")).toHaveLength(0);
    expect(root.querySelectorAll(".boot-room-lamp")).toHaveLength(0);
    expect(root.querySelector(".boot-mug-steam")).not.toBeNull();
    expect(root.querySelectorAll(".boot-mug-steam__trail")).toHaveLength(3);
    expect(root.querySelector(".boot-desk-paper")).toBeNull();
    expect(root.querySelectorAll(".boot-sticky-note")).toHaveLength(3);
    expect(root.querySelector(".boot-sticky-notes")?.textContent).toBe("");
    expect(root.querySelector(".desk-prop--keyboard")).toBeNull();
    expect(root.querySelector(".desk-prop--mouse")).toBeNull();
    expect(root.querySelector(".desk-prop--cup")).toBeNull();
  });

  it("toggles boot language and switches boot settings tabs", async () => {
    installDom();
    await loadLocale("en");
    const root = document.createElement("div");
    let nextLang = "";

    const app = mountApp(
      root,
      { ...createDevFloorView(false), ui: createShellUiView("boot") },
      {
        ...createActions(),
        changeLang: (lang) => {
          nextLang = lang;
        }
      }
    );

    const languageButton = root.querySelector<HTMLButtonElement>(".boot-scene__button--language");
    languageButton?.click();
    expect(nextLang).toBe("pl");

    const basePlView = createDevFloorView(false);
    const plView = {
      ...basePlView,
      settings: { ...basePlView.settings, lang: "pl" },
      ui: createShellUiView("boot")
    };
    await loadLocale("pl");
    app.updateDevFloor(plView);
    expect(languageButton?.textContent).toContain("Język: PL");
    expect(languageButton?.title).toBe("Język");
    expect(root.querySelector(".boot-scene__button--primary")?.textContent).toContain("START GRY");
    const languageRow = root.querySelector<HTMLElement>("[data-boot-setting='language']");
    expect(languageRow?.textContent).toContain("Język");
    expect(languageRow?.title).toBe("Język");

    const settingsButton = root.querySelector<HTMLButtonElement>(".boot-scene__button--settings");
    settingsButton?.click();

    const settingsPanel = root.querySelector<HTMLElement>(".boot-panel--settings");
    const audioTab = root.querySelector<HTMLButtonElement>(".boot-settings__tab[title='Audio']");
    const videoPanel = root.querySelector<HTMLElement>("[data-tab-panel='video']");
    const audioPanel = root.querySelector<HTMLElement>("[data-tab-panel='audio']");

    expect(settingsPanel?.hidden).toBe(false);
    audioTab?.click();
    expect(audioPanel?.hidden).toBe(false);
    expect(videoPanel?.hidden).toBe(true);

    const back = root.querySelector<HTMLButtonElement>("[data-boot-settings-close='1']");
    back?.click();
    expect(settingsPanel?.hidden).toBe(true);
  });

  it("wires boot settings controls to existing actions", () => {
    installDom();
    const root = document.createElement("div");
    let autosaveS = 0;
    let doNotDisturb = false;
    let reducedFx = true;
    let resetCount = 0;
    let sound = true;
    let volume = 0;

    mountApp(
      root,
      { ...createDevFloorView(false), ui: createShellUiView("boot") },
      {
        ...createActions(),
        changeAutosaveS: (seconds) => {
          autosaveS = seconds;
        },
        changeDoNotDisturb: (enabled) => {
          doNotDisturb = enabled;
        },
        changeReducedFx: (enabled) => {
          reducedFx = enabled;
        },
        changeSound: (enabled) => {
          sound = enabled;
        },
        changeVolume: (nextVolume) => {
          volume = nextVolume;
        },
        resetSettings: () => {
          resetCount += 1;
        }
      }
    );

    root.querySelector<HTMLButtonElement>(".boot-scene__button--settings")?.click();

    const settingsRoot = root.querySelector<HTMLElement>(".boot-settings");
    const displayMode = root.querySelector<HTMLButtonElement>('[data-boot-setting="displayMode"]');
    const scale = root.querySelector<HTMLInputElement>("[data-boot-ui-scale]");
    const violet = root.querySelector<HTMLButtonElement>('[data-boot-theme="violet"]');

    displayMode?.click();
    expect(displayMode?.textContent).toContain("Fullscreen");

    scale!.value = "1.1";
    scale?.dispatchEvent(new window.Event("input"));
    expect(settingsRoot?.style.getPropertyValue("--boot-settings-scale")).toBe("1.1");

    violet?.click();
    expect(settingsRoot?.dataset.theme).toBe("violet");

    const audioTab = root.querySelector<HTMLButtonElement>(".boot-settings__tab[title='Audio']");
    audioTab?.click();

    const volumeInput = root.querySelector<HTMLInputElement>('[data-boot-range="volume"]');
    const outputBus = root.querySelector<HTMLButtonElement>(
      ".boot-settings__row[title='Output bus']"
    );
    const soundToggle = root.querySelector<HTMLButtonElement>('[data-boot-toggle="sound"]');
    const pulseToggle = root.querySelector<HTMLButtonElement>('[data-boot-toggle="messagePulse"]');

    volumeInput!.value = "0.6";
    volumeInput?.dispatchEvent(new window.Event("input"));
    outputBus?.click();
    soundToggle?.click();
    pulseToggle?.click();

    expect(volume).toBe(0.6);
    expect(outputBus?.textContent).toContain("Headphones");
    expect(sound).toBe(false);
    expect(doNotDisturb).toBe(true);

    const gameplayTab = root.querySelector<HTMLButtonElement>(
      ".boot-settings__tab[title='Gameplay']"
    );
    gameplayTab?.click();

    const autosave = root.querySelector<HTMLInputElement>('[data-boot-number="autosaveS"]');
    const gameplayPanel = root.querySelector<HTMLElement>('[data-tab-panel="gameplay"]');
    const reducedToggle = gameplayPanel?.querySelector<HTMLButtonElement>(
      '[data-boot-toggle="reducedFx"]'
    );
    autosave!.value = "25";
    autosave?.dispatchEvent(new window.Event("input"));
    reducedToggle?.click();

    expect(autosaveS).toBe(25);
    expect(autosave?.closest(".boot-settings__row")?.textContent).toContain("25s");
    expect(reducedFx).toBe(true);

    root.querySelector<HTMLButtonElement>(".boot-settings__action--danger")?.click();
    expect(resetCount).toBe(1);
    expect(settingsRoot?.dataset.theme).toBe("crt");
  });

  it("renders taskbar items for open windows and restores minimized apps", () => {
    installDom();
    const root = document.createElement("div");
    const view = createDevFloorView(false);
    view.ui.windows.agents.minimized = true;
    let openedApp = "";

    mountApp(root, view, {
      ...createActions(),
      openApp: (appId) => {
        openedApp = appId;
      }
    });

    const agentsWindow = root.querySelector<HTMLElement>('.desktop-window[data-app-id="agents"]');
    const agentsItem = root.querySelector<HTMLButtonElement>('.taskbar-item[data-app-id="agents"]');
    const settingsItem = root.querySelector<HTMLButtonElement>(
      '.taskbar-item[data-app-id="settings"]'
    );

    expect(agentsWindow?.hidden).toBe(true);
    expect(agentsItem).not.toBeNull();
    expect(agentsItem?.hidden).toBe(false);
    expect(agentsItem?.classList.contains("taskbar-item--minimized")).toBe(true);
    expect(settingsItem?.hidden).toBe(true);

    agentsItem?.click();

    expect(openedApp).toBe("agents");
  });

  it("marks the top visible window as active in the taskbar", () => {
    installDom();
    const root = document.createElement("div");

    mountApp(root, createDevFloorView(false), createActions());

    const agentsItem = root.querySelector<HTMLButtonElement>('.taskbar-item[data-app-id="agents"]');
    const rewriteItem = root.querySelector<HTMLButtonElement>(
      '.taskbar-item[data-app-id="rewrite"]'
    );

    expect(agentsItem?.classList.contains("taskbar-item--active")).toBe(false);
    expect(rewriteItem?.classList.contains("taskbar-item--active")).toBe(true);
  });

  it("renders and updates the first-run tutorial overlay", () => {
    installDom();
    const root = document.createElement("div");
    let backCount = 0;
    let nextCount = 0;
    let skipCount = 0;
    const base = createDevFloorView(false);
    const view = {
      ...base,
      tutorial: {
        active: true,
        completed: false,
        index: 0,
        step: "welcome" as const,
        total: 9
      }
    };

    const app = mountApp(root, view, {
      ...createActions(),
      tutorialBack: () => {
        backCount += 1;
      },
      tutorialNext: () => {
        nextCount += 1;
      },
      tutorialSkip: () => {
        skipCount += 1;
      }
    });

    const overlay = root.querySelector<HTMLElement>(".tutorial-overlay");
    const back = findButton(overlay!, "Back");
    const next = findButton(overlay!, "Next");
    const skip = findButton(overlay!, "Skip");

    expect(overlay?.hidden).toBe(false);
    expect(overlay?.dataset.step).toBe("welcome");
    expect(root.querySelector<HTMLElement>(".desktop")?.dataset.tutorialStep).toBe("welcome");
    expect(overlay?.textContent).toContain("Step 1/9");
    expect(overlay?.textContent).toContain("Welcome to the desktop");
    expect(back?.disabled).toBe(true);

    back?.click();
    next?.click();
    skip?.click();

    expect(backCount).toBe(0);
    expect(nextCount).toBe(1);
    expect(skipCount).toBe(1);

    app.updateDevFloor({
      ...view,
      tutorial: {
        active: true,
        completed: false,
        index: 8,
        step: "done" as const,
        total: 9
      }
    });

    expect(overlay?.dataset.step).toBe("done");
    expect(next?.hidden).toBe(true);
    expect(skip?.hidden).toBe(true);

    const finish = findButton(overlay!, "Finish");
    expect(finish?.hidden).toBe(false);
    finish?.click();
    expect(nextCount).toBe(2);
  });
});

function createCommsView(entryIds: readonly string[]): CommsView {
  return {
    messages: entryIds.map((entryId) => ({
      channel: "chat",
      choices: [],
      entryId,
      eventId: entryId,
      lines: [],
      pendingChoice: false,
      speaker: "Zora",
      unread: false
    })),
    quiet: false,
    unreadByChannel: { chat: 0, feed: 0, mail: 0 },
    unreadCount: 0
  };
}

function createCommsMessage(
  entryId: string,
  channel: "chat" | "mail" | "feed",
  line: string
): CommsView["messages"][number] {
  return {
    channel,
    choices: [],
    entryId,
    eventId: entryId,
    lines: [line],
    pendingChoice: false,
    speaker: "Zora",
    unread: true
  };
}

function installDom(): void {
  const dom = new JSDOM("<!doctype html><body></body>");
  vi.stubGlobal("document", dom.window.document);
  vi.stubGlobal("Element", dom.window.Element);
  vi.stubGlobal("HTMLElement", dom.window.HTMLElement);
  vi.stubGlobal("window", dom.window);
}

function findButton(root: ParentNode, label: string): HTMLButtonElement | undefined {
  return Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
    (button) => button.textContent === label
  );
}

function createActions(): AppActions {
  return {
    buyEra(): void {},
    buyEquityPerk(): void {},
    buyGenerator(): void {},
    buyHardware(): void {},
    buyInsightNode(): void {},
    buyParadoxItem(): void {},
    buyResearch(): void {},
    buyUpgrade(): void {},
    changeAutosaveS(): void {},
    changeDoNotDisturb(): void {},
    changeGlitch(): void {},
    changeLang(): void {},
    changeNotation(): void {},
    changeReducedFx(): void {},
    changeSkipIntro(): void {},
    changeSound(): void {},
    changeVibexLocalAi(): void {},
    changeVolume(): void {},
    chooseStoryChoice(): void {},
    closeApp(): void {},
    dismissOffline(): void {},
    downloadVibexModel(): void {},
    exit(): void {},
    exportSave: () => "",
    fixBug(): void {},
    focusApp(): void {},
    importSave: () => false,
    iterate(): void {},
    maximizeApp(): void {},
    minimizeApp(): void {},
    moveApp(): void {},
    openApp(): void {},
    prompt: () => ({ loc: "0" }),
    quitToTitle(): void {},
    resetSettings(): void {},
    resetWindowLayout(): void {},
    replayTutorial(): void {},
    resizeApp(): void {},
    rewrite(): void {},
    selectRunModifier(): void {},
    sendVibexPrompt: () => ({
      committed: false,
      loc: "0",
      prompt: "test",
      response: "ok"
    }),
    startDesktop(): void {},
    startProject(): void {},
    startRefactor(): void {},
    toggleAutomation(): void {},
    tutorialBack(): void {},
    tutorialNext(): void {},
    tutorialSkip(): void {},
    wipeSave(): void {}
  };
}

function createDevFloorView(booting: boolean): DevFloorView {
  return {
    achievements: {
      bonus: "x1",
      cards: [],
      unlocked: "0/50"
    },
    appearance: {
      reducedFx: false
    },
    automation: [],
    comms: {
      messages: [],
      quiet: false,
      unreadByChannel: { chat: 0, feed: 0, mail: 0 },
      unreadCount: 0
    },
    compute: {
      cap: "0",
      remaining: "0",
      rows: [],
      used: "0"
    },
    ending: {
      choices: [],
      eventId: "a5_12_final_choice",
      lines: [],
      visible: false
    },
    flowActive: false,
    flowMeter: "0%",
    flowProgress: 0,
    fullGame: {
      visible: false
    },
    generators: [],
    hardware: [],
    model: {
      canBuy: false,
      current: "PARROT-1",
      maxed: true,
      nextCost: "$0",
      nextModel: "PARROT-1",
      status: ""
    },
    offline: {
      duration: "",
      hype: "",
      loc: "",
      money: "",
      visible: false
    },
    projects: {
      activeBuilds: [],
      incomeRate: "$0/s",
      offers: [],
      portfolio: [],
      refactor: {
        buildTime: "0s",
        canStart: false,
        cost: "0 LoC",
        debt: "0",
        effect: ""
      }
    },
    research: {
      nodes: [],
      rp: "0"
    },
    resources: {
      compute: "0/0",
      hype: "1x",
      loc: "0",
      locRate: "0/s",
      locRateTooltip: "",
      money: "$0",
      moneyRate: "$0/s",
      moneyRateTooltip: "",
      rp: "0"
    },
    rewrite: createRewriteView(booting),
    settings: {
      autosaveS: "10",
      doNotDisturb: false,
      glitch: true,
      localAiCanDownload: false,
      localAiModelSize: "95-135 MB",
      localAiProgress: "",
      localAiStatus: "Canned-only",
      lang: "en",
      notation: "sci",
      reducedFx: false,
      skipIntro: false,
      sound: true,
      vibexLocalAi: false,
      volume: "0.30"
    },
    stats: {
      lifetimeRows: [],
      recordsRows: [],
      runRows: [],
      sparklineEmpty: true,
      sparklineLabel: "",
      sparklinePath: ""
    },
    tutorial: {
      active: false,
      completed: true,
      index: 8,
      step: "done",
      total: 9
    },
    ui: createShellUiView("desktop"),
    upgrades: [],
    vibex: {
      aiCanDownload: false,
      aiEnabled: false,
      aiModelSize: "95-135 MB",
      aiProgress: "",
      aiStatus: "Canned-only",
      cannedPrompt: "Prompt",
      cannedResponse: "Response",
      codeLines: [
        { id: "0:0", text: "const ok = true;" },
        { id: "0:1", text: "commit();" }
      ],
      codeSequence: 0,
      files: [
        { active: true, id: "app-main", label: "app/main.ts" },
        { active: false, id: "core-loop", label: "core/loop.ts" }
      ]
    }
  };
}

function createShellUiView(scene: DevFloorView["ui"]["scene"]): DevFloorView["ui"] {
  const windows = createDefaultWindowStates();
  windows.agents.open = true;
  windows.agents.z = 1;
  windows.rewrite.open = true;
  windows.rewrite.z = 2;

  return {
    bootSeen: true,
    scene,
    windows
  };
}

function createRewriteView(booting: boolean): DevFloorView["rewrite"] {
  return {
    exit: {
      perks: [],
      preview: {
        canExit: false,
        currentEquity: "0",
        currentMultiplier: "x1",
        equityAfter: "0",
        gain: "0",
        requiredInsight: "0",
        rewardMultiplier: "x1",
        targetMultiplier: "x1",
        totalInsightEarned: "0"
      },
      runModifiers: []
    },
    insight: "0",
    nodes: [],
    paradox: {
      items: [],
      preview: {
        canIterate: false,
        currentIteration: "0",
        currentMultiplier: "x1",
        currentParadox: "0",
        hold: "0s/0s",
        locRate: "0/s",
        nextIteration: "1",
        paradoxAfter: "0",
        paradoxGain: "0",
        softcapThreshold: "0/s",
        targetMultiplier: "x1"
      },
      ruleSlots: "0",
      theme: "",
      unlocked: false
    },
    preview: {
      afterInsight: "0",
      booting,
      canRewrite: false,
      currentMultiplier: "x1",
      gain: "0",
      lostAgents: "0",
      lostHardware: "0",
      lostLoc: "0",
      lostMoney: "$0",
      lostProducts: "0",
      lostUpgrades: "0",
      requiredInsight: "0",
      speedup: "x1",
      startEra: "E1",
      startGenerators: "none",
      startMoney: "$0",
      targetMultiplier: "x1"
    }
  };
}
