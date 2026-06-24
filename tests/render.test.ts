import { readFileSync } from "node:fs";
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
    expect(t("ui.settings.gameControls")).toBe("Sterowanie grą");
    expect(t("vibex.send")).toBe("Wyślij");
    expect(t("app.title")).toBe("VIBECODER");
  });

  it("updates the stored income summary text from the latest Projects view", () => {
    const income = { data: "$0/s" };
    const view = {
      activeBuilds: [],
      incomeRate: "$1/s",
      nextUnlock: "After MUSE: $20K",
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

  it("updates the next project unlock hint without a page refresh", () => {
    installDom();
    const root = document.createElement("div");
    const view = createDevFloorView(false);
    view.ui.windows.projects.open = true;
    view.ui.windows.projects.z = 4;

    const app = mountApp(root, view, createActions());
    const projectsWindow = root.querySelector<HTMLElement>(
      '.desktop-window[data-app-id="projects"]'
    );
    expect(projectsWindow?.textContent).toContain("After MUSE: $20K");

    app.updateDevFloor({
      ...view,
      projects: {
        ...view.projects,
        nextUnlock: "After MUSE: buy now"
      }
    });

    expect(projectsWindow?.textContent).toContain("After MUSE: buy now");
    expect(projectsWindow?.textContent).not.toContain("After MUSE: $20K");
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
  it("renders Roadmap as a desktop app with sprint and incident actions", () => {
    installDom();
    const root = document.createElement("div");
    const calls: string[] = [];
    const view = {
      ...createDevFloorView(false),
      roadmap: {
        activeSprint: "No sprint",
        activity: [{ id: "changelog", label: "Changelog", detail: "LoC 1/s", tone: "success" }],
        cooldown: "Ready",
        incidents: [
          {
            id: "incident.1",
            description: "Production is down",
            label: "Outage",
            responses: [
              {
                id: "hotfix",
                cost: "10 LoC",
                description: "Fix now",
                disabled: false,
                label: "Hotfix"
              }
            ],
            severity: "S2",
            timeRemaining: "5m"
          }
        ],
        priorities: [
          {
            active: false,
            description: "Less debt",
            disabled: false,
            id: "stability",
            label: "Stability"
          }
        ],
        runStyles: [],
        sprintRemaining: "-"
      }
    } satisfies DevFloorView;
    view.ui.windows.roadmap.open = true;
    view.ui.windows.roadmap.z = 5;

    mountApp(root, view, {
      ...createActions(),
      resolveIncident: (id, response) => {
        calls.push(`${id}:${response}`);
      },
      selectSprintPriority: (id) => {
        calls.push(id);
      }
    });

    const roadmapWindow = root.querySelector<HTMLElement>('.desktop-window[data-app-id="roadmap"]');
    expect(roadmapWindow?.textContent).toContain("Roadmap");
    expect(roadmapWindow?.textContent).toContain("Outage");
    findButton(roadmapWindow!, "StabilityLess debt")?.click();
    findButton(roadmapWindow!, "Hotfix10 LoC")?.click();

    expect(calls).toEqual(["stability", "incident.1:hotfix"]);
  });

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

describe("M13 desktop window interactions", () => {
  it("drags windows with pointer capture and keeps the live frame inside the desktop", () => {
    installDom();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });

    const root = document.createElement("div");
    let focusCount = 0;
    let movedFrame: { x: number; y: number } | undefined;

    mountApp(root, createDevFloorView(false), {
      ...createActions(),
      focusApp: () => {
        focusCount += 1;
      },
      moveApp: (_appId, frame) => {
        movedFrame = frame;
      }
    });

    const windowNode = root.querySelector<HTMLElement>('.desktop-window[data-app-id="agents"]');
    const titlebar = windowNode?.querySelector<HTMLElement>(".desktop-window__titlebar");
    let captured = 0;
    let released = 0;

    Object.defineProperty(titlebar, "setPointerCapture", {
      configurable: true,
      value: () => {
        captured += 1;
      }
    });
    Object.defineProperty(titlebar, "releasePointerCapture", {
      configurable: true,
      value: () => {
        released += 1;
      }
    });

    dispatchPointer(titlebar!, "pointerdown", { clientX: 140, clientY: 180 });
    dispatchPointer(window, "pointermove", { clientX: -300, clientY: -300 });

    expect(windowNode?.style.transform).toBe("translate3d(0px, 0px, 0)");
    expect(windowNode?.classList.contains("desktop-window--dragging")).toBe(true);

    dispatchPointer(window, "pointerup", { clientX: -300, clientY: -300 });

    expect(focusCount).toBe(1);
    expect(captured).toBe(1);
    expect(released).toBe(1);
    expect(movedFrame).toEqual({ x: 0, y: 0 });
    expect(windowNode?.classList.contains("desktop-window--dragging")).toBe(false);
  });

  it("does not snap an active drag back during a render update", () => {
    installDom();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });

    const root = document.createElement("div");
    const app = mountApp(root, createDevFloorView(false), createActions());
    const windowNode = root.querySelector<HTMLElement>('.desktop-window[data-app-id="agents"]');
    const titlebar = windowNode?.querySelector<HTMLElement>(".desktop-window__titlebar");

    dispatchPointer(titlebar!, "pointerdown", { clientX: 140, clientY: 180 });
    dispatchPointer(window, "pointermove", { clientX: 240, clientY: 280 });
    const liveTransform = windowNode?.style.transform;

    app.updateDevFloor(createDevFloorView(false));

    expect(windowNode?.style.transform).toBe(liveTransform);
    dispatchPointer(window, "pointerup", { clientX: 240, clientY: 280 });
  });

  it("caches desktop bounds until viewport resize invalidates them", () => {
    installDom();
    const root = document.createElement("div");
    const view = createDevFloorView(false);
    view.ui.windows.agents.open = true;
    view.ui.windows.agents.z = 3;
    const app = mountApp(root, view, createActions());
    const layer = root.querySelector<HTMLElement>(".desktop__windows");
    const windowNode = root.querySelector<HTMLElement>('.desktop-window[data-app-id="agents"]');
    let reads = 0;
    let width = 900;
    let height = 700;

    Object.defineProperty(layer!, "getBoundingClientRect", {
      configurable: true,
      value: () => {
        reads += 1;
        return {
          bottom: height,
          height,
          left: 0,
          right: width,
          top: 0,
          width,
          x: 0,
          y: 0,
          toJSON: () => ({})
        } as DOMRect;
      }
    });

    app.updateDevFloor(view);
    app.updateDevFloor(view);

    expect(reads).toBe(1);
    expect(windowNode?.style.width).toBe("860px");

    width = 600;
    height = 640;
    window.dispatchEvent(new window.Event("resize"));
    app.updateDevFloor(view);

    expect(reads).toBe(2);
    expect(windowNode?.style.width).toBe("600px");
    expect(windowNode?.style.transform).toContain("translate3d(0px,");

    app.destroy();
  });

  it("hides stale generator, upgrade, and product rows after prestige views empty out", () => {
    installDom();
    const root = document.createElement("div");
    const view = createDevFloorView(false);
    view.ui.windows.upgrades.open = true;
    view.ui.windows.upgrades.z = 3;
    view.ui.windows.projects.open = true;
    view.ui.windows.projects.z = 4;
    const populated = {
      ...view,
      generators: [createGeneratorRowView("g_autocomplete")],
      projects: {
        ...view.projects,
        portfolio: [createProductView("p_landing.1")]
      },
      upgrades: [createUpgradeRowView("u_better_prompts")]
    };
    const app = mountApp(root, populated, createActions());

    expect(root.querySelector('.agent-row[data-generator-id="g_autocomplete"]')).not.toBeNull();
    expect(root.querySelector('.upgrade-row[data-upgrade-id="u_better_prompts"]')).not.toBeNull();
    expect(root.querySelector('.product-row[data-product-id="p_landing.1"]')).not.toBeNull();

    app.updateDevFloor({
      ...populated,
      generators: [],
      projects: { ...populated.projects, portfolio: [] },
      upgrades: []
    });

    expect(
      root.querySelector<HTMLElement>('.agent-row[data-generator-id="g_autocomplete"]')?.hidden
    ).toBe(true);
    expect(
      root.querySelector<HTMLElement>('.upgrade-row[data-upgrade-id="u_better_prompts"]')?.hidden
    ).toBe(true);
    expect(
      root.querySelector<HTMLElement>('.product-row[data-product-id="p_landing.1"]')?.hidden
    ).toBe(true);
  });

  it("resets a desktop app scroll position when reopening it", () => {
    installDom();
    const root = document.createElement("div");
    const view = createDevFloorView(false);
    view.ui.windows.agents.open = true;
    view.ui.windows.agents.z = 4;
    const populated = {
      ...view,
      generators: [createGeneratorRowView("g_autocomplete")]
    };
    const app = mountApp(root, populated, createActions());
    const body = root.querySelector<HTMLElement>(
      '.desktop-window[data-app-id="agents"] .desktop-window__body'
    );

    expect(body).not.toBeNull();
    body!.scrollTop = 640;
    body!.scrollLeft = 80;

    app.updateDevFloor({
      ...populated,
      ui: {
        ...populated.ui,
        windows: {
          ...populated.ui.windows,
          agents: { ...populated.ui.windows.agents, open: false }
        }
      }
    });
    app.updateDevFloor({
      ...populated,
      ui: {
        ...populated.ui,
        windows: {
          ...populated.ui.windows,
          agents: { ...populated.ui.windows.agents, open: true }
        }
      }
    });

    expect(body!.scrollTop).toBe(0);
    expect(body!.scrollLeft).toBe(0);
  });

  it("syncs project offers after board changes without a page refresh", () => {
    installDom();
    const root = document.createElement("div");
    const view = createDevFloorView(false);
    view.ui.windows.projects.open = true;
    view.ui.windows.projects.z = 4;
    const populated = {
      ...view,
      projects: {
        ...view.projects,
        offers: [createProjectOfferView("p_landing", false)]
      }
    };
    const app = mountApp(root, populated, createActions());

    const initialOffer = root.querySelector<HTMLElement>('[data-project-id="p_landing"]');
    const initialButton = initialOffer?.querySelector<HTMLButtonElement>("button");
    expect(initialOffer).not.toBeNull();
    expect(initialButton?.disabled).toBe(true);

    app.updateDevFloor({
      ...populated,
      projects: {
        ...populated.projects,
        offers: [createProjectOfferView("p_mvp", true)]
      }
    });

    const staleOffer = root.querySelector<HTMLElement>('[data-project-id="p_landing"]');
    const refreshedOffer = root.querySelector<HTMLElement>('[data-project-id="p_mvp"]');
    const refreshedButton = refreshedOffer?.querySelector<HTMLButtonElement>("button");

    expect(staleOffer?.hidden).toBe(true);
    expect(refreshedOffer).not.toBeNull();
    expect(refreshedOffer?.hidden).toBe(false);
    expect(refreshedButton?.disabled).toBe(false);
  });

  it("updates project levels and payout labels without a page refresh", () => {
    installDom();
    const root = document.createElement("div");
    const view = createDevFloorView(false);
    view.ui.windows.projects.open = true;
    view.ui.windows.projects.z = 4;
    const populated = {
      ...view,
      projects: {
        ...view.projects,
        offers: [createProjectOfferView("p_landing", true, "0/10", "$20", "$1/s")],
        portfolio: [createProductView("p_landing.1", "1/10", "$1/s")]
      }
    };
    const app = mountApp(root, populated, createActions());

    app.updateDevFloor({
      ...populated,
      projects: {
        ...populated.projects,
        offers: [createProjectOfferView("p_landing", true, "1/10", "First ship only", "$1.25/s")],
        portfolio: [createProductView("p_landing.1", "2/10", "$1.25/s")]
      }
    });

    const offer = root.querySelector<HTMLElement>('[data-project-id="p_landing"]');
    const product = root.querySelector<HTMLElement>('[data-product-id="p_landing.1"]');

    expect(offer?.textContent).toContain("1/10");
    expect(offer?.textContent).toContain("First ship only");
    expect(offer?.textContent).toContain("$1.25/s");
    expect(product?.textContent).toContain("2/10");
    expect(product?.textContent).toContain("$1.25/s");
  });

  it("updates the refactor build time without a page refresh", () => {
    installDom();
    const root = document.createElement("div");
    const view = createDevFloorView(false);
    view.ui.windows.projects.open = true;
    view.ui.windows.projects.z = 4;
    const populated = {
      ...view,
      projects: {
        ...view.projects,
        refactor: {
          ...view.projects.refactor,
          buildTime: "30s"
        }
      }
    };
    const app = mountApp(root, populated, createActions());

    app.updateDevFloor({
      ...populated,
      projects: {
        ...populated.projects,
        refactor: {
          ...populated.projects.refactor,
          buildTime: "0s"
        }
      }
    });

    const projectsWindow = root.querySelector<HTMLElement>(
      '.desktop-window[data-app-id="projects"]'
    );
    expect(projectsWindow?.textContent).toContain("0s");
    expect(projectsWindow?.textContent).not.toContain("30s");
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

    const settingsWindow = root.querySelector<HTMLElement>(
      '.desktop-window[data-app-id="settings"]'
    );

    expect(settingsWindow?.textContent).toContain("Game controls");
    expect(settingsWindow?.textContent).toContain("Save diagnostics");
    expect(settingsWindow?.textContent).toContain("Export save");
    expect(settingsWindow?.textContent).toContain("Import save");

    findButton(root, "Replay tutorial")?.click();

    expect(replayCount).toBe(1);
  });

  it("applies glitch effect classes from settings", () => {
    installDom();
    const root = document.createElement("div");
    const view = createDevFloorView(false);

    const app = mountApp(root, view, createActions());

    expect(root.querySelector(".app-shell")?.classList.contains("app-shell--glitch")).toBe(true);
    expect(
      root.querySelector(".vibex-terminal")?.classList.contains("terminal--theme-glitch")
    ).toBe(true);
    expect(
      root
        .querySelector('.desktop-window[data-app-id="agents"]')
        ?.classList.contains("desktop-window--glitch")
    ).toBe(false);
    expect(
      root
        .querySelector('.desktop-icon[data-app-id="vibex"]')
        ?.classList.contains("desktop-icon--glitch")
    ).toBe(true);
    expect(
      root
        .querySelector('.taskbar-item[data-app-id="agents"]')
        ?.classList.contains("taskbar-item--glitch")
    ).toBe(true);

    const reducedView = {
      ...createDevFloorView(false),
      appearance: {
        glitch: true,
        reducedFx: true
      }
    };

    app.updateDevFloor(reducedView);

    expect(
      root
        .querySelector('.desktop-window[data-app-id="agents"]')
        ?.classList.contains("desktop-window--glitch")
    ).toBe(false);
    expect(
      root
        .querySelector('.desktop-icon[data-app-id="vibex"]')
        ?.classList.contains("desktop-icon--glitch")
    ).toBe(false);
    expect(
      root
        .querySelector('.taskbar-item[data-app-id="agents"]')
        ?.classList.contains("taskbar-item--glitch")
    ).toBe(false);
  });
});

describe("M15 Vibex rendering", () => {
  it("renders and refreshes the Vibex code stream lines", () => {
    installDom();
    const root = document.createElement("div");
    const view = createDevFloorView(false);
    view.ui.windows.vibex.open = true;
    view.ui.windows.vibex.minimized = false;
    view.ui.windows.vibex.z = 9;

    const app = mountApp(root, view, createActions());
    const vibexWindow = root.querySelector<HTMLElement>('.desktop-window[data-app-id="vibex"]');

    expect(getVisibleVibexCodeLines(vibexWindow).map((line) => line.textContent)).toEqual([
      "const ok = true;",
      "commit();"
    ]);

    app.updateDevFloor({
      ...view,
      vibex: {
        ...view.vibex,
        codeLines: [
          { id: "1:0", text: "const next = true;" },
          { id: "1:1", text: "render(next);" },
          { id: "1:2", text: "commit(next);" },
          { id: "1:3", text: "ship();" }
        ],
        codeSequence: 1
      }
    });

    expect(getVisibleVibexCodeLines(vibexWindow).map((line) => line.textContent)).toEqual([
      "const next = true;",
      "render(next);",
      "commit(next);",
      "ship();"
    ]);

    app.updateDevFloor({
      ...view,
      vibex: {
        ...view.vibex,
        codeLines: [{ id: "2:0", text: "trim();" }],
        codeSequence: 2
      }
    });

    expect(getVisibleVibexCodeLines(vibexWindow).map((line) => line.textContent)).toEqual([
      "trim();"
    ]);
  });

  it("keeps Vibex code visible when glitch effects override intro animations", () => {
    const css = readLayoutCss();

    expect(css).toMatch(/\.vibex-code-line\s*\{[^}]*opacity:\s*1;/s);
    expect(css).toMatch(
      /\.app-shell--glitch\s+\.vibex-code-line--active\s*\{[^}]*vibex-code-line-in/s
    );
  });

  it("routes prompts and Vibex responses into AI Assistant instead of the terminal log", () => {
    installDom();
    const root = document.createElement("div");
    const view = createDevFloorView(false);
    view.ui.windows.vibex.open = true;
    view.ui.windows.vibex.minimized = false;
    view.ui.windows.vibex.z = 9;

    mountApp(root, view, {
      ...createActions(),
      sendVibexPrompt: () => ({
        committed: false,
        loc: "1 Lines of Code",
        prompt: "custom user prompt",
        response: "Vibex assistant answer"
      })
    });

    const vibexWindow = root.querySelector<HTMLElement>('.desktop-window[data-app-id="vibex"]');
    const input = vibexWindow?.querySelector<HTMLTextAreaElement>(".vibex-terminal__input");
    const send = vibexWindow?.querySelector<HTMLButtonElement>(".terminal__prompt");

    expect(input).not.toBeNull();
    expect(send).not.toBeNull();
    input!.value = "custom user prompt";
    send!.click();

    const assistant = vibexWindow?.querySelector<HTMLElement>(".vibex-canned");
    const terminal = vibexWindow?.querySelector<HTMLElement>(".vibex-terminal-panel");

    expect(assistant?.textContent).toContain("custom user prompt");
    expect(assistant?.textContent).toContain("Vibex assistant answer");
    expect(terminal?.textContent).not.toContain("custom user prompt");
    expect(terminal?.textContent).not.toContain("Vibex assistant answer");
  });

  it("ignores stale Vibex AI responses", async () => {
    installDom();
    const root = document.createElement("div");
    const view = createDevFloorView(false);
    let firstResolve: ((response: string) => void) | undefined;
    let secondResolve: ((response: string) => void) | undefined;
    let sends = 0;
    view.ui.windows.vibex.open = true;
    view.ui.windows.vibex.minimized = false;
    view.ui.windows.vibex.z = 9;

    mountApp(root, view, {
      ...createActions(),
      sendVibexPrompt: (prompt) => {
        sends += 1;
        const pendingResponse = new Promise<string>((resolve) => {
          if (sends === 1) {
            firstResolve = resolve;
          } else {
            secondResolve = resolve;
          }
        });

        return {
          committed: false,
          loc: "1 Lines of Code",
          pendingResponse,
          prompt,
          response: `typing ${prompt}`
        };
      }
    });

    const vibexWindow = root.querySelector<HTMLElement>('.desktop-window[data-app-id="vibex"]');
    const input = vibexWindow?.querySelector<HTMLTextAreaElement>(".vibex-terminal__input");
    const send = vibexWindow?.querySelector<HTMLButtonElement>(".terminal__prompt");
    const assistant = vibexWindow?.querySelector<HTMLElement>(".vibex-canned");

    input!.value = "first";
    send?.click();
    input!.value = "second";
    send?.click();

    secondResolve?.("second final");
    await Promise.resolve();
    await Promise.resolve();
    expect(assistant?.textContent).toContain("second final");

    firstResolve?.("first final");
    await Promise.resolve();
    await Promise.resolve();
    expect(assistant?.textContent).toContain("second final");
    expect(assistant?.textContent).not.toContain("first final");
  });

  it("keeps auto-prompts as LoC-only terminal output without touching the AI Assistant or draft input", () => {
    installDom();
    const root = document.createElement("div");
    document.body.append(root);
    const view = createDevFloorView(false);
    const sends: Array<{ readonly prompt: string; readonly source: string | undefined }> = [];
    view.ui.windows.vibex.open = true;
    view.ui.windows.vibex.minimized = false;
    view.ui.windows.vibex.z = 9;

    mountApp(root, view, {
      ...createActions(),
      sendVibexPrompt: (prompt, source) => {
        sends.push({ prompt, source });

        return prompt.length === 0
          ? {
              committed: false,
              loc: "2 Lines of Code",
              prompt: "background autoprompt",
              response: "background auto-response"
            }
          : {
              committed: false,
              loc: "3 Lines of Code",
              prompt,
              response: "manual Vibex answer"
            };
      }
    });

    const vibexWindow = root.querySelector<HTMLElement>('.desktop-window[data-app-id="vibex"]');
    const input = vibexWindow?.querySelector<HTMLTextAreaElement>(".vibex-terminal__input");
    const send = vibexWindow?.querySelector<HTMLButtonElement>(".terminal__prompt");
    const assistant = vibexWindow?.querySelector<HTMLElement>(".vibex-canned");
    const terminal = vibexWindow?.querySelector<HTMLElement>(".vibex-terminal-panel");

    expect(input).not.toBeNull();
    input!.value = "draft manual prompt";
    input!.dispatchEvent(new window.KeyboardEvent("keydown", { bubbles: true, key: " " }));

    expect(sends).toHaveLength(0);
    expect(input!.value).toBe("draft manual prompt");

    window.dispatchEvent(new window.KeyboardEvent("keydown", { key: " " }));

    expect(sends).toEqual([{ prompt: "", source: "auto" }]);
    expect(input!.value).toBe("draft manual prompt");
    expect(assistant?.textContent).not.toContain("background autoprompt");
    expect(assistant?.textContent).not.toContain("background auto-response");
    expect(terminal?.textContent).toContain("+2 Lines of Code");
    expect(terminal?.textContent).not.toContain("background autoprompt");
    expect(terminal?.textContent).not.toContain("background auto-response");
    expect(terminal?.textContent).not.toContain("[AUTO-PROMPT]");
    expect(terminal?.textContent).not.toContain("[VIBEX]");

    send?.click();

    expect(sends).toEqual([
      { prompt: "", source: "auto" },
      { prompt: "draft manual prompt", source: "manual" }
    ]);
    expect(input!.value).toBe("");
    expect(assistant?.textContent).toContain("draft manual prompt");
    expect(assistant?.textContent).toContain("manual Vibex answer");
  });

  it("routes an empty user Send click to the AI Assistant without logging prompt text", () => {
    installDom();
    const root = document.createElement("div");
    const view = createDevFloorView(false);
    const sends: Array<{ readonly prompt: string; readonly source: string | undefined }> = [];
    view.ui.windows.vibex.open = true;
    view.ui.windows.vibex.minimized = false;
    view.ui.windows.vibex.z = 9;

    mountApp(root, view, {
      ...createActions(),
      sendVibexPrompt: (prompt, source) => {
        sends.push({ prompt, source });
        return {
          committed: false,
          loc: "4 Lines of Code",
          prompt: "manual canned prompt",
          response: "manual canned response"
        };
      }
    });

    const vibexWindow = root.querySelector<HTMLElement>('.desktop-window[data-app-id="vibex"]');
    const send = vibexWindow?.querySelector<HTMLButtonElement>(".terminal__prompt");
    const assistant = vibexWindow?.querySelector<HTMLElement>(".vibex-canned");
    const terminal = vibexWindow?.querySelector<HTMLElement>(".vibex-terminal-panel");

    send?.click();

    expect(sends).toEqual([{ prompt: "", source: "manual" }]);
    expect(assistant?.textContent).toContain("manual canned prompt");
    expect(assistant?.textContent).toContain("manual canned response");
    expect(terminal?.textContent).toContain("+4 Lines of Code");
    expect(terminal?.textContent).not.toContain("manual canned prompt");
    expect(terminal?.textContent).not.toContain("manual canned response");
  });

  it("logs LoC on every Vibex send and only logs commits when a batch commits", () => {
    installDom();
    const root = document.createElement("div");
    const view = createDevFloorView(false);
    let sends = 0;
    view.ui.windows.vibex.open = true;
    view.ui.windows.vibex.minimized = false;
    view.ui.windows.vibex.z = 9;

    mountApp(root, view, {
      ...createActions(),
      sendVibexPrompt: () => {
        sends += 1;
        return {
          committed: sends % 10 === 0,
          loc: "1 Lines of Code",
          prompt: `prompt ${sends}`,
          response: `response ${sends}`
        };
      }
    });

    const vibexWindow = root.querySelector<HTMLElement>('.desktop-window[data-app-id="vibex"]');
    const send = vibexWindow?.querySelector<HTMLButtonElement>(".terminal__prompt");

    for (let i = 0; i < 9; i += 1) {
      send?.click();
    }

    const terminal = vibexWindow?.querySelector<HTMLElement>(".vibex-terminal-panel");

    expect(terminal?.textContent).toContain("+1 Lines of Code");
    expect(terminal?.textContent).not.toContain("commit 1 Lines of Code");
    expect(terminal?.textContent).not.toContain("commit: files staged");

    send?.click();

    expect(terminal?.textContent).toContain("commit: files staged");
  });

  it("dismisses the offline modal with Escape while focus is in an editable field", () => {
    installDom();
    const root = document.createElement("div");
    const view = createDevFloorView(false);
    let dismissCount = 0;
    view.ui.windows.vibex.open = true;
    view.ui.windows.vibex.minimized = false;
    view.ui.windows.vibex.z = 9;

    mountApp(
      root,
      {
        ...view,
        offline: {
          duration: "1h",
          hype: "x1",
          loc: "1 LoC",
          money: "$1",
          visible: true
        }
      },
      {
        ...createActions(),
        dismissOffline: () => {
          dismissCount += 1;
        }
      }
    );

    const input = root.querySelector<HTMLTextAreaElement>(".vibex-terminal__input");
    input?.focus();
    expect(input).not.toBeNull();
    const event = new window.KeyboardEvent("keydown", { bubbles: true, key: "Escape" });
    Object.defineProperty(event, "target", { value: input });
    window.dispatchEvent(event);

    expect(dismissCount).toBe(1);
  });
});

describe("M16 Hardware rendering", () => {
  it("renders hardware as PC and server sections without the old SVG visualizer", () => {
    installDom();
    const root = document.createElement("div");
    const base = createDevFloorView(false);
    base.ui.windows.hardware.open = true;
    base.ui.windows.hardware.minimized = false;
    base.ui.windows.hardware.z = 10;
    const view = {
      ...base,
      hardware: [
        {
          active: false,
          canBuy: true,
          capAdd: "+2 compute / level",
          cost: "$80",
          id: "h_cpu",
          isEnclosure: false,
          levelLabel: "0/20",
          name: "CPU",
          phase: "pc" as const,
          powerCost: "Power -$2/s",
          psuRequirement: "",
          slot: "cpu",
          slotLabel: "CPU"
        },
        {
          active: false,
          canBuy: true,
          capAdd: "0 compute",
          cost: "$1,000,000",
          id: "h_rack",
          isEnclosure: true,
          levelLabel: "0",
          name: "Empty Rack",
          phase: "server" as const,
          powerCost: "Power -$20/s",
          psuRequirement: "",
          slot: "enclosure",
          slotLabel: "Frame"
        }
      ]
    };

    mountApp(root, view, createActions());

    const hardwareWindow = root.querySelector<HTMLElement>(
      '.desktop-window[data-app-id="hardware"]'
    );
    const pcSection = hardwareWindow?.querySelector<HTMLElement>(
      '.hardware-section[data-phase="pc"]'
    );
    const serverSection = hardwareWindow?.querySelector<HTMLElement>(
      '.hardware-section[data-phase="server"]'
    );

    expect(hardwareWindow?.querySelector("svg")).toBeNull();
    expect(pcSection?.textContent).toContain("PC build");
    expect(pcSection?.textContent).toContain("CPU");
    expect(pcSection?.textContent).toContain("Power -$2/s");
    expect(serverSection?.hidden).toBe(false);
    expect(serverSection?.textContent).toContain("Server build");
    expect(serverSection?.textContent).toContain("Empty Rack");
  });

  it("hides the Aurora-ready hardware counter until Aurora is unlocked", () => {
    installDom();
    const root = document.createElement("div");
    const view = {
      ...createDevFloorView(false),
      aurora: {
        ...createDevFloorView(false).aurora,
        readyServerCount: 1,
        readyServers: "1"
      }
    };
    view.ui.windows.hardware.open = true;
    view.ui.windows.hardware.minimized = false;

    const app = mountApp(root, view, createActions());
    const counter = root.querySelector<HTMLElement>(".hardware-aurora-counter");

    expect(counter?.hidden).toBe(true);

    app.updateDevFloor({
      ...view,
      aurora: {
        ...view.aurora,
        unlocked: true
      }
    });

    expect(counter?.hidden).toBe(false);
    expect(counter?.textContent).toContain("Aurora-ready servers");
  });
});

describe("M17 Aurora desktop visibility", () => {
  it("hides the Aurora desktop icon and taskbar item until the app is unlocked", () => {
    installDom();
    const root = document.createElement("div");
    const view = createDevFloorView(false);
    view.ui.windows.aurora.open = true;
    view.ui.windows.aurora.minimized = false;
    view.ui.windows.aurora.z = 10;

    const app = mountApp(root, view, createActions());
    const icon = root.querySelector<HTMLButtonElement>('.desktop-icon[data-app-id="aurora"]');
    const taskbar = root.querySelector<HTMLButtonElement>('.taskbar-item[data-app-id="aurora"]');
    const windowNode = root.querySelector<HTMLElement>('.desktop-window[data-app-id="aurora"]');

    expect(icon?.hidden).toBe(true);
    expect(taskbar?.hidden).toBe(true);
    expect(windowNode?.hidden).toBe(true);

    app.updateDevFloor({
      ...view,
      aurora: {
        ...view.aurora,
        unlocked: true
      }
    });

    expect(icon?.hidden).toBe(false);
    expect(taskbar?.hidden).toBe(false);
    expect(windowNode?.hidden).toBe(false);
  });

  it("keeps hidden desktop buttons visually removed in CSS", () => {
    const css = readLayoutCss();

    expect(css).toContain(".desktop-icon[hidden]");
    expect(css).toContain(".taskbar-item[hidden]");
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

  it("shows bankruptcy game over with export, title, and wipe actions", () => {
    installDom();
    const root = document.createElement("div");
    let quit = false;
    let wiped = false;

    mountApp(
      root,
      {
        ...createDevFloorView(false),
        gameOver: {
          lines: ["The bank closed the account."],
          overdraft: "$10,000",
          visible: true
        }
      },
      {
        ...createActions(),
        exportSave: () => "BANK-SAVE",
        quitToTitle: () => {
          quit = true;
        },
        wipeSave: () => {
          wiped = true;
        }
      }
    );

    const modal = root.querySelector<HTMLElement>(".game-over-modal");
    expect(modal?.hidden).toBe(false);
    expect(modal?.textContent).toContain("Bankruptcy");
    expect(modal?.textContent).toContain("The bank closed the account.");
    expect(modal?.textContent).toContain("$10,000");

    findButton(modal!, "Export save")?.click();
    expect(modal?.querySelector<HTMLTextAreaElement>("textarea")?.value).toBe("BANK-SAVE");

    findButton(modal!, "Quit to title")?.click();
    findButton(modal!, "Wipe save")?.click();
    expect(quit).toBe(true);
    expect(wiped).toBe(true);
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

  it("tears down boot scene global listeners on destroy", () => {
    installDom();
    const root = document.createElement("div");
    const windowAdd = vi.spyOn(window, "addEventListener");
    const windowRemove = vi.spyOn(window, "removeEventListener");
    const documentAdd = vi.spyOn(document, "addEventListener");
    const documentRemove = vi.spyOn(document, "removeEventListener");

    const app = mountApp(
      root,
      { ...createDevFloorView(false), ui: createShellUiView("boot") },
      createActions()
    );

    const keydownHandlers = windowAdd.mock.calls
      .filter(([type]) => type === "keydown")
      .map(([, handler]) => handler)
      .filter((handler) => {
        const name = typeof handler === "function" ? handler.name : "";
        return name === "keydownHandler" || name === "escapeHandler";
      });
    const fullscreenHandler = documentAdd.mock.calls.find(
      ([type]) => type === "fullscreenchange"
    )?.[1];

    app.destroy();

    expect(keydownHandlers).toHaveLength(2);
    for (const handler of keydownHandlers) {
      expect(windowRemove).toHaveBeenCalledWith("keydown", handler);
    }
    expect(fullscreenHandler).toBeDefined();
    expect(documentRemove).toHaveBeenCalledWith("fullscreenchange", fullscreenHandler);
  });

  it("renders the boot continue button and runs the desktop transition", () => {
    installDom();
    const root = document.createElement("div");
    let bootSoundCount = 0;
    let clickSoundCount = 0;
    let startCount = 0;

    mountApp(
      root,
      { ...createDevFloorView(false), ui: createShellUiView("boot") },
      {
        ...createActions(),
        playBootSound: () => {
          bootSoundCount += 1;
        },
        playUiClick: () => {
          clickSoundCount += 1;
        },
        startDesktop: () => {
          startCount += 1;
        }
      }
    );

    const bootScene = root.querySelector<HTMLElement>(".boot-scene");
    const continueButton = root.querySelector<HTMLButtonElement>(".boot-scene__button--continue");

    expect(continueButton?.textContent).toBe("CONTINUE");

    continueButton?.click();
    expect(bootScene?.classList.contains("boot-scene--entering")).toBe(true);
    expect(bootSoundCount).toBe(1);
    expect(clickSoundCount).toBe(1);
    bootScene?.click();
    bootScene?.click();

    expect(startCount).toBe(1);
    expect(bootSoundCount).toBe(1);
    expect(clickSoundCount).toBe(1);
  });

  it("switches boot labels only when a persisted save exists", () => {
    installDom();
    const root = document.createElement("div");
    let newGameCount = 0;
    const app = mountApp(
      root,
      { ...createDevFloorView(false), ui: createShellUiView("boot") },
      {
        ...createActions(),
        startNewGame: () => {
          newGameCount += 1;
        }
      }
    );

    const primary = root.querySelector<HTMLButtonElement>(".boot-scene__button--primary");
    const secondary = root.querySelector<HTMLButtonElement>(".boot-scene__button--continue");
    expect(primary?.textContent).toBe("START GAME");
    expect(secondary?.textContent).toBe("CONTINUE");

    app.updateDevFloor({
      ...createDevFloorView(false),
      ui: { ...createShellUiView("boot"), hasSave: true }
    });

    expect(primary?.textContent).toBe("CONTINUE");
    expect(secondary?.textContent).toBe("START NEW GAME");

    secondary?.click();
    expect(newGameCount).toBe(0);
    expect(secondary?.textContent).toBe("CONFIRM NEW GAME");

    secondary?.click();
    expect(newGameCount).toBe(1);
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

function dispatchPointer(
  target: EventTarget,
  type: string,
  options: { readonly button?: number; readonly clientX: number; readonly clientY: number }
): void {
  const event = new window.MouseEvent(type, {
    bubbles: true,
    button: options.button ?? 0,
    cancelable: true,
    clientX: options.clientX,
    clientY: options.clientY
  });
  Object.defineProperty(event, "pointerId", { value: 1 });
  target.dispatchEvent(event);
}

function getVisibleVibexCodeLines(root: ParentNode | null | undefined): HTMLElement[] {
  return Array.from(root?.querySelectorAll<HTMLElement>(".vibex-code-line") ?? []).filter(
    (line) => !line.hidden
  );
}

function readLayoutCss(): string {
  return [
    "src/ui/layout.css",
    "src/ui/layout/shell-apps.css",
    "src/ui/layout/terminal-comms.css",
    "src/ui/layout/stats-settings-modals.css",
    "src/ui/layout/desktop-boot.css",
    "src/ui/layout/vibex-responsive.css"
  ]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
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
    dedicateAuroraServer(): void {},
    dismissOffline(): void {},
    downloadVibexModel(): void {},
    exit(): void {},
    exportSave: () => "",
    fixBug(): void {},
    fitOpenWindowsToBounds(): void {},
    focusApp(): void {},
    fundAuroraPhase(): void {},
    importSave: () => false,
    iterate(): void {},
    maximizeApp(): void {},
    minimizeApp(): void {},
    moveApp(): void {},
    openApp(): void {},
    playBootSound(): void {},
    playUiClick(): void {},
    prompt: () => ({ loc: "0" }),
    quitToTitle(): void {},
    resetSettings(): void {},
    resetWindowLayout(): void {},
    resolveIncident(): void {},
    replayTutorial(): void {},
    resizeApp(): void {},
    releaseAuroraHost(): void {},
    rentAuroraHost(): void {},
    rewrite(): void {},
    selectRunStyle(): void {},
    selectRunModifier(): void {},
    selectSprintPriority(): void {},
    setProjectDeploymentMode(): void {},
    sendVibexPrompt: () => ({
      committed: false,
      loc: "0",
      prompt: "test",
      response: "ok"
    }),
    startDesktop(): void {},
    startNewGame(): void {},
    startProject(): void {},
    startRefactor(): void {},
    toggleAutomation(): void {},
    tutorialBack(): void {},
    tutorialNext(): void {},
    tutorialSkip(): void {},
    wipeSave(): void {}
  };
}

function createGeneratorRowView(id: string): DevFloorView["generators"][number] {
  return {
    buy1Title: "",
    buy10Title: "",
    buyMaxTitle: "",
    canBuy1: false,
    canBuy10: false,
    canBuyMax: false,
    cost1: "$1",
    cost10: "$10",
    id,
    locked: false,
    milestoneLabel: "0/10",
    milestoneProgress: 0,
    name: id,
    owned: "1",
    rate: "1/s"
  };
}

function createUpgradeRowView(id: string): DevFloorView["upgrades"][number] {
  return {
    canBuy: false,
    cost: "$1",
    effect: "Effect",
    id,
    name: id,
    state: "available",
    stateLabel: "Available"
  };
}

function createProductView(
  id: string,
  level = "1/10",
  revenue = "$1/s"
): DevFloorView["projects"]["portfolio"][number] {
  return {
    canFix: false,
    canSwitchDeployment: true,
    compute: "0",
    deployment: "Local",
    hostingCost: "$0/s",
    id,
    level,
    name: id,
    revenue,
    status: "OK",
    switchDeploymentLabel: "Host",
    switchDeploymentMode: "hosted"
  };
}

function createProjectOfferView(
  id: string,
  canStart: boolean,
  level = "0/10",
  payout = "$20",
  revenue = "$1/s"
): DevFloorView["projects"]["offers"][number] {
  return {
    buildTime: "10s",
    canStart,
    canStartHosted: canStart,
    canStartSelfHosted: canStart,
    compute: "0",
    cost: "10 LoC",
    hostingCost: "$0/s",
    id,
    level,
    name: id,
    payout,
    revenue,
    tag: "Standard"
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
      glitch: true,
      reducedFx: false
    },
    automation: [],
    aurora: {
      availableServers: "0",
      canDedicate: false,
      canFund: false,
      canHost: false,
      canReleaseHost: false,
      completed: false,
      costLoc: "0 LoC",
      costMoney: "$0",
      dedicatedServers: "0",
      hostedServers: "0",
      hostingRate: "$0/s",
      nodes: [],
      phaseName: "No phase",
      progress: 0,
      progressLabel: "0%",
      readyServerCount: 0,
      readyServers: "0",
      requiredServers: "0",
      statusLabel: "Locked",
      timeRemaining: "0s",
      unlocked: false
    },
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
    gameOver: {
      lines: [],
      overdraft: "$0",
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
      nextUnlock: "After MUSE: $20K",
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
    roadmap: {
      activeSprint: "No sprint",
      activity: [],
      cooldown: "Ready",
      incidents: [],
      priorities: [],
      runStyles: [],
      sprintRemaining: "-"
    },
    research: {
      nodes: [],
      rp: "0"
    },
    resources: {
      bank: "$0",
      bankTooltip: "",
      bankVisible: false,
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
      save: {
        backupCount: "0",
        edition: "demo",
        lastAutosave: "1970-01-01T00:00:00.000Z",
        status: "OK",
        version: "v13"
      },
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
    hasSave: false,
    scene,
    windows
  };
}

function createRewriteView(booting: boolean): DevFloorView["rewrite"] {
  return {
    exit: {
      unlocked: false,
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
      nextInsight: "none",
      nextMilestone: "1 REWRITE",
      requiredInsight: "0",
      speedup: "x1",
      startEra: "E1",
      startGenerators: "none",
      startMoney: "$0",
      targetMultiplier: "x1"
    }
  };
}
