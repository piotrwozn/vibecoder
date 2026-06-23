import { readFile } from "node:fs/promises";
import process from "node:process";
import { URL } from "node:url";
import { error } from "node:console";

const changelog = await readFile(new URL("../CHANGELOG.md", import.meta.url), "utf8");
const unreleased = getUnreleasedSection(changelog);

if (unreleased === undefined) {
  error("CHANGELOG.md must contain a ## [Unreleased] section.");
  process.exitCode = 1;
}

if (unreleased !== undefined && !/^- /m.test(unreleased)) {
  error("CHANGELOG.md must contain at least one ## [Unreleased] release note bullet.");
  process.exitCode = 1;
}

function getUnreleasedSection(value) {
  const header = /^## \[Unreleased\]\s*$/m.exec(value);

  if (header === null) {
    return undefined;
  }

  const body = value.slice(header.index + header[0].length);
  const nextSection = /^## \[/m.exec(body);
  return nextSection === null ? body : body.slice(0, nextSection.index);
}
