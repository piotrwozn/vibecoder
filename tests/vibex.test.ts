import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createDefaultGameState } from "../src/core/state";
import {
  VIBEX_CANNED_PAIRS,
  VIBEX_CODE_FILES,
  VIBEX_MANUAL_FALLBACK_KEYS
} from "../src/data/vibex";
import type { VibexAiChangeHandler, VibexAiClient } from "../src/platform/ai";
import { createDerivedCache, recomputeDerivedCache } from "../src/systems/production";
import { performPromptClick } from "../src/systems/prompt";
import {
  advanceVibexCode,
  createVibexCannedBag,
  createVibexCodeState,
  drawVibexCannedPair,
  getVibexFileLabelKey,
  getVibexManualFallbackKey
} from "../src/systems/vibex";

describe("M15 Vibex", () => {
  afterEach(() => {
    vi.doUnmock("@wllama/wllama/esm/index.js");
    vi.doUnmock("@wllama/wllama/esm/wasm/wllama.wasm?url");
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("draws canned pairs as a shuffle bag without repeats inside a cycle", () => {
    const bag = createVibexCannedBag(123);
    const drawn = new Set<string>();

    for (let i = 0; i < VIBEX_CANNED_PAIRS.length; i += 1) {
      drawn.add(drawVibexCannedPair(bag).promptKey);
    }

    expect(drawn.size).toBe(VIBEX_CANNED_PAIRS.length);
    expect(bag.remainingIds).toHaveLength(0);
  });

  it("does not immediately repeat the last canned pair when the bag refills", () => {
    const bag = createVibexCannedBag(456);
    let previous = "";

    for (let i = 0; i < VIBEX_CANNED_PAIRS.length; i += 1) {
      previous = drawVibexCannedPair(bag).promptKey;
    }

    const next = drawVibexCannedPair(bag).promptKey;

    expect(next).not.toBe(previous);
  });

  it("advances code pseudo-randomly and emits one commit every ten sends", () => {
    const state = createVibexCodeState(321);
    const frames = Array.from({ length: 20 }, () => advanceVibexCode(state));
    const touchedFiles = new Set(frames.map((frame) => frame.fileId));

    expect(touchedFiles.size).toBeGreaterThan(1);
    expect(frames.filter((frame) => frame.committed).map((frame) => frame.sequence)).toEqual([
      10, 20
    ]);
    expect(advanceVibexCode(state).committed).toBe(false);
  });

  it("rotates visible file names after a commit batch", () => {
    const state = createVibexCodeState(654);
    const initialLabels = VIBEX_CODE_FILES.map((_, index) => getVibexFileLabelKey(state, index));

    for (let i = 0; i < 10; i += 1) {
      advanceVibexCode(state);
    }

    const nextLabels = VIBEX_CODE_FILES.map((_, index) => getVibexFileLabelKey(state, index));

    expect(nextLabels).not.toEqual(initialLabels);
  });

  it("rotates manual prompt fallback responses instead of using one canned line", () => {
    const keys = Array.from({ length: VIBEX_MANUAL_FALLBACK_KEYS.length }, (_, index) =>
      getVibexManualFallbackKey(index)
    );

    expect(new Set(keys).size).toBe(VIBEX_MANUAL_FALLBACK_KEYS.length);
    expect(getVibexManualFallbackKey(VIBEX_MANUAL_FALLBACK_KEYS.length)).toBe(keys[0]);
  });

  it("uses independent persisted seeds for canned chat and code streams", () => {
    const game = createDefaultGameState();
    const canned = createVibexCannedBag(game.vibex.cannedSeed);
    const code = createVibexCodeState(game.vibex.codeSeed);

    expect(game.vibex.cannedSeed).not.toBe(game.rngSeed);
    expect(game.vibex.codeSeed).not.toBe(game.rngSeed);
    expect(game.vibex.cannedSeed).not.toBe(game.vibex.codeSeed);

    drawVibexCannedPair(canned);
    advanceVibexCode(code);

    game.vibex.cannedSeed = canned.seed;
    game.vibex.codeSeed = code.seed;

    expect(game.vibex.cannedSeed).not.toBe(game.vibex.codeSeed);
  });

  it("keeps Send on the existing PROMPT burst while Vibex visuals advance", () => {
    const promptOnly = createDefaultGameState();
    const promptOnlyCache = createDerivedCache();
    recomputeDerivedCache(promptOnly, promptOnlyCache);

    const vibexSend = createDefaultGameState();
    const vibexSendCache = createDerivedCache();
    recomputeDerivedCache(vibexSend, vibexSendCache);

    const visualState = createVibexCodeState();
    const cannedBag = createVibexCannedBag(789);
    advanceVibexCode(visualState);
    drawVibexCannedPair(cannedBag);

    const promptOnlyGain = performPromptClick(promptOnly, promptOnlyCache, 0);
    const vibexSendGain = performPromptClick(vibexSend, vibexSendCache, 0);

    expect(vibexSendGain.eq(promptOnlyGain)).toBe(true);
    expect(vibexSend.res.loc.eq(promptOnly.res.loc)).toBe(true);
    expect(vibexSend.flow.meter).toBe(promptOnly.flow.meter);
  });

  it("loads the bundled GGUF directly from the served model folder without Wllama URL cache", () => {
    const source = readFileSync("src/platform/ai.full.ts", "utf8");

    expect(source).toContain("import.meta.env.DEV");
    expect(source).toContain("`/models/${MODEL_FILE}`");
    expect(source).toContain("new URL(`../models/${MODEL_FILE}`, import.meta.url).href");
    expect(source).toContain("fetch(BUNDLED_MODEL_URL, { signal })");
    expect(source).toContain("instance.loadModel([model], loadOptions)");
    expect(source).not.toContain("loadModelFromUrl");
    expect(source).not.toContain("loadModelFromHF");
  });

  it("does not create the app-owned local AI worker that broke document access", () => {
    const source = readFileSync("src/platform/ai.full.ts", "utf8");

    expect(source).not.toContain("new Worker");
    expect(source).not.toContain("ai.worker");
  });

  it("cleans failed local AI loads and avoids prompt-triggered retry storms", () => {
    const aiSource = readFileSync("src/platform/ai.full.ts", "utf8");
    const actionsSource = readFileSync("src/app/actions.ts", "utf8");

    expect(aiSource).toContain("await disposeCurrentInstance()");
    expect(aiSource).toContain("await disposeInstance(instance)");
    expect(aiSource).toContain("shouldReportProgress");
    expect(actionsSource).toContain('aiSnapshot.status !== "error"');
  });

  it("disposes a late local AI import when the setting is disabled mid-load", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_EDITION", "full");
    vi.stubGlobal("Worker", class {});

    interface MockAiFullModule {
      readonly createFullVibexAiClient: () => {
        readonly dispose: () => void;
        readonly downloadModel: () => Promise<boolean>;
        readonly generate: () => Promise<string | undefined>;
        readonly snapshot: () => unknown;
      };
    }

    let resolveModule: ((module: MockAiFullModule) => void) | undefined;
    const disposed: boolean[] = [];
    const downloadCalls: number[] = [];

    vi.doMock(
      "../src/platform/ai.full",
      () =>
        new Promise<MockAiFullModule>((resolve) => {
          resolveModule = resolve;
        })
    );

    try {
      const { createIdleSnapshot, createVibexAiClient } = await import("../src/platform/ai");
      const client = createVibexAiClient("full");
      const download = client.downloadModel();

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(resolveModule).toBeDefined();

      client.dispose();
      resolveModule?.({
        createFullVibexAiClient: () => {
          const index = disposed.length;
          disposed.push(false);

          return {
            dispose(): void {
              disposed[index] = true;
            },
            async downloadModel(): Promise<boolean> {
              downloadCalls.push(index);
              return true;
            },
            async generate(): Promise<string | undefined> {
              return undefined;
            },
            snapshot: createIdleSnapshot
          };
        }
      });

      await expect(download).resolves.toBe(false);
      expect(disposed).toEqual([true]);
      expect(downloadCalls).toEqual([]);
      expect(client.snapshot()).toEqual(createIdleSnapshot());
    } finally {
      vi.doUnmock("../src/platform/ai.full");
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
      vi.resetModules();
    }
  });

  it("loads the bundled model in Wllama and transitions to ready", async () => {
    const harness = await importMockedAiFull();
    vi.stubGlobal("fetch", createModelFetch(new Uint8Array([1, 2, 3, 4])));

    const client = harness.createFullVibexAiClient(() => {});

    expect(client.snapshot().status).toBe("idle");
    await expect(client.downloadModel()).resolves.toBe(true);

    const instance = harness.instances[0];
    expect(client.snapshot()).toMatchObject({
      progress: { loaded: 4, total: 4 },
      status: "ready"
    });
    expect(instance?.pathConfig).toEqual({ default: "/assets/wllama.wasm" });
    expect(instance?.config).toMatchObject({
      allowOffline: true,
      logger: harness.LoggerWithoutDebug,
      suppressNativeLog: true
    });
    expect(instance?.loadModelCalls[0]?.models[0]?.name).toBe("SmolLM2-135M-Instruct-Q4_K_M.gguf");
    expect(instance?.loadModelCalls[0]?.models[0]?.size).toBe(4);
    expect(instance?.loadModelCalls[0]?.options).toEqual({ n_gpu_layers: 0 });
  });

  it("clears local AI progress after a model load failure", async () => {
    const harness = await importMockedAiFull();
    vi.stubGlobal("fetch", async () => new Response("missing", { status: 404 }));

    const client = harness.createFullVibexAiClient(() => {});
    const loading = client.downloadModel();

    expect(client.snapshot().progress).toEqual({ loaded: 0, total: 0 });
    await expect(loading).resolves.toBe(false);
    expect(client.snapshot()).toMatchObject({
      errorMessage: "Bundled Vibex model failed to load (404)",
      progress: undefined,
      status: "error"
    });
  });

  it("disposes a pending model download without leaving endless loading", async () => {
    const harness = await importMockedAiFull();
    vi.stubGlobal(
      "fetch",
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new Error("aborted"));
          });
        })
    );

    const client = harness.createFullVibexAiClient(() => {});
    const loading = client.downloadModel();

    expect(client.snapshot().status).toBe("downloading");
    client.dispose();

    await expect(loading).resolves.toBe(false);
    expect(client.snapshot().status).toBe("idle");
    expect(harness.instances[0]?.exited).toBe(true);
  });

  it("returns undefined before ready and clamps prompts before local AI generation", async () => {
    const harness = await importMockedAiFull();
    vi.stubGlobal("fetch", createModelFetch(new Uint8Array([1, 2, 3])));

    const client = harness.createFullVibexAiClient(() => {});

    await expect(client.generate("hello", "PARROT-1")).resolves.toBeUndefined();
    await expect(client.downloadModel()).resolves.toBe(true);
    await expect(client.generate("x".repeat(1200), "PARROT-1")).resolves.toBe("ok");

    const generateCall = harness.instances[0]?.chatCompletionCalls[0];
    expect(generateCall?.max_tokens).toBe(60);
    expect(generateCall?.messages[0]?.content).toContain("PARROT-1");
    expect(generateCall?.messages[1]?.content).toHaveLength(1000);
    expect(client.snapshot().status).toBe("ready");
  });
});

interface MockLoadModelCall {
  readonly models: readonly (Blob & { readonly name?: string })[];
  readonly options: unknown;
}

interface MockChatCompletionCall {
  readonly max_tokens: number;
  readonly messages: readonly { readonly content: string; readonly role: string }[];
}

interface MockWllamaConfig {
  readonly allowOffline?: boolean;
  readonly logger?: unknown;
  readonly suppressNativeLog?: boolean;
}

interface MockWllamaInstance {
  readonly chatCompletionCalls: MockChatCompletionCall[];
  readonly config: MockWllamaConfig;
  readonly loadModelCalls: MockLoadModelCall[];
  readonly pathConfig: unknown;
  exited: boolean;
}

async function importMockedAiFull(): Promise<{
  readonly LoggerWithoutDebug: object;
  readonly createFullVibexAiClient: (onChange: VibexAiChangeHandler) => VibexAiClient;
  readonly instances: readonly MockWllamaInstance[];
}> {
  vi.resetModules();

  const instances: MockWllama[] = [];
  const LoggerWithoutDebug = {};

  class MockWllama implements MockWllamaInstance {
    readonly chatCompletionCalls: MockChatCompletionCall[] = [];
    readonly loadModelCalls: MockLoadModelCall[] = [];
    exited = false;
    private loaded = false;

    constructor(
      readonly pathConfig: unknown,
      readonly config: MockWllamaConfig
    ) {
      instances.push(this);
    }

    isModelLoaded(): boolean {
      return this.loaded;
    }

    async loadModel(
      models: readonly (Blob & { readonly name?: string })[],
      options: unknown
    ): Promise<void> {
      this.loadModelCalls.push({ models, options });
      this.loaded = true;
    }

    async createChatCompletion(call: MockChatCompletionCall): Promise<{
      readonly choices: readonly { readonly message: { readonly content: string } }[];
    }> {
      this.chatCompletionCalls.push(call);
      return { choices: [{ message: { content: " ok " } }] };
    }

    async exit(): Promise<void> {
      this.exited = true;
    }
  }

  vi.doMock("@wllama/wllama/esm/index.js", () => ({
    LoggerWithoutDebug,
    Wllama: MockWllama
  }));
  vi.doMock("@wllama/wllama/esm/wasm/wllama.wasm?url", () => ({
    default: "/assets/wllama.wasm"
  }));

  const module = await import("../src/platform/ai.full");
  return { LoggerWithoutDebug, createFullVibexAiClient: module.createFullVibexAiClient, instances };
}

function createModelFetch(bytes: Uint8Array): typeof fetch {
  return async () =>
    new Response(new Blob([copyBytes(bytes)], { type: "application/octet-stream" }), {
      headers: {
        "content-length": String(bytes.byteLength),
        "content-type": "application/octet-stream"
      },
      status: 200
    });
}

function copyBytes(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}
