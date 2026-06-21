import js from "@eslint/js";
import tseslint from "typescript-eslint";

const browserGlobals = {
  CSSStyleDeclaration: "readonly",
  Document: "readonly",
  HTMLElement: "readonly",
  Node: "readonly",
  SVGElement: "readonly",
  Text: "readonly",
  Window: "readonly",
  document: "readonly",
  performance: "readonly",
  requestAnimationFrame: "readonly",
  window: "readonly"
};

const nodeGlobals = {
  console: "readonly",
  process: "readonly",
  URL: "readonly"
};

export default tseslint.config(
  {
    ignores: ["coverage/**", "dist/**", "node_modules/**", "src-tauri/target/**"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...browserGlobals,
        console: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error"
    }
  },
  {
    files: ["src/dev/**/*.ts", "vite.config.ts"],
    languageOptions: {
      globals: nodeGlobals
    }
  }
);
