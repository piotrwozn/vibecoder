import { cpSync } from "node:fs";

import { defineConfig } from "vitest/config";

const copyLicenses = {
  name: "copy-licenses",
  closeBundle(): void {
    cpSync("licenses", "dist/licenses", { recursive: true });
  }
};

export default defineConfig({
  base: "./",
  plugins: [copyLicenses],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  }
});
