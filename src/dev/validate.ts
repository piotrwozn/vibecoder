import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const failures: string[] = [];
const ALLOWED_RUNTIME_DEPENDENCIES = new Set(["@wllama/wllama"]);
const LOCAL_AI_IMPORT_RE = /\b(?:from\s+|import\s*\(\s*|import\s+)["']@wllama\/wllama(?:\/|["'])/;

function readText(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

function collectFiles(dir: string): string[] {
  const absoluteDir = join(repoRoot, dir);

  if (!existsSync(absoluteDir)) {
    return [];
  }

  const entries = readdirSync(absoluteDir);
  const files: string[] = [];

  for (const entry of entries) {
    const absoluteEntry = join(absoluteDir, entry);
    const stat = statSync(absoluteEntry);

    if (stat.isDirectory()) {
      files.push(...collectFiles(relative(repoRoot, absoluteEntry)));
    } else {
      files.push(relative(repoRoot, absoluteEntry).replaceAll("\\", "/"));
    }
  }

  return files;
}

function fail(message: string): void {
  failures.push(message);
}

function validatePackage(): void {
  const pkg = JSON.parse(readText("package.json")) as PackageJson;
  const runtimeDependencies = Object.keys(pkg.dependencies ?? {}).filter(
    (name) => !ALLOWED_RUNTIME_DEPENDENCIES.has(name)
  );

  if (runtimeDependencies.length > 0) {
    fail(`runtime dependencies are forbidden: ${runtimeDependencies.join(", ")}`);
  }
}

function validateI18n(): void {
  const messages = JSON.parse(readText("src/i18n/en.json")) as Record<string, unknown>;

  for (const [key, value] of Object.entries(messages)) {
    if (typeof value !== "string") {
      fail(`i18n key ${key} must be a string`);
    }
  }
}

function validateLayering(tsFiles: readonly string[]): void {
  for (const file of tsFiles) {
    const source = readText(file);

    if (file.startsWith("src/data/") && /from\s+["'].*\/(systems|ui|platform)\//.test(source)) {
      fail(`${file} imports across a forbidden data layer boundary`);
    }

    if (file.startsWith("src/systems/") && /from\s+["'].*\/ui\//.test(source)) {
      fail(`${file} imports UI from a system module`);
    }

    if (file.startsWith("src/systems/") && /\b(document|window)\b/.test(source)) {
      fail(`${file} touches DOM globals from a system module`);
    }

    if (file.startsWith("src/ui/") && /from\s+["'].*\/systems\//.test(source)) {
      fail(`${file} imports game systems from UI`);
    }

    if (!file.startsWith("src/platform/ai.") && LOCAL_AI_IMPORT_RE.test(source)) {
      fail(`${file} imports the M15 local-AI dependency outside platform/ai.*`);
    }
  }
}

function validateUiText(): void {
  const uiFiles = collectFiles("src/ui").filter((file) => file.endsWith(".ts"));

  for (const file of uiFiles) {
    const source = readText(file);

    if (/\binnerHTML\b/.test(source)) {
      fail(`${file} uses innerHTML`);
    }

    if (/\.textContent\s*=\s*["'`][^"'`]+["'`]/.test(source)) {
      fail(`${file} assigns user-facing text directly; use i18n text nodes`);
    }

    if (/createTextNode\(\s*["'`][^"'`]+["'`]\s*\)/.test(source)) {
      fail(`${file} creates a literal text node; use i18n`);
    }
  }
}

const tsFiles = collectFiles("src").filter((file) => file.endsWith(".ts"));

validatePackage();
validateI18n();
validateLayering(tsFiles);
validateUiText();

if (failures.length > 0) {
  console.error("validate: FAIL");

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log(`validate: PASS (${tsFiles.length} TypeScript files scanned)`);
