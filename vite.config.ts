import { copyFileSync, cpSync, existsSync, mkdirSync } from "node:fs";

import type { ResolvedConfig } from "vite";
import { defineConfig } from "vitest/config";

const VIBEX_MODEL_FILE = "SmolLM2-135M-Instruct-Q4_K_M.gguf";
const VIBEX_MODEL_SOURCE = `models/${VIBEX_MODEL_FILE}`;
const VIBEX_MODEL_DESTINATION = `dist/models/${VIBEX_MODEL_FILE}`;

const copyLicenses = {
  name: "copy-licenses",
  closeBundle(): void {
    cpSync("licenses", "dist/licenses", { recursive: true });
  }
};

function copyBundledVibexModel() {
  let isFullBuild = false;

  return {
    name: "copy-bundled-vibex-model",
    configResolved(config: ResolvedConfig): void {
      isFullBuild = config.mode === "full";
    },
    closeBundle(): void {
      if (!isFullBuild || !existsSync(VIBEX_MODEL_SOURCE)) {
        return;
      }

      mkdirSync("dist/models", { recursive: true });
      copyFileSync(VIBEX_MODEL_SOURCE, VIBEX_MODEL_DESTINATION);
    }
  };
}

export default defineConfig({
  base: "./",
  build: {
    // Full edition intentionally ships local AI wasm and large desktop/audio assets.
    chunkSizeWarningLimit: 8_000
  },
  plugins: [copyLicenses, copyBundledVibexModel()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  }
});
