# AGENTS.md — VIBECODER

Idle/incremental game. Pure TypeScript + Vite. **No game engine, no runtime dependencies.**
The full design lives in `plan/` (Polish prose, English identifiers). It is the single source of truth.

## Read first
- `plan/README.md` — index and how plan files map to code
- `plan/08-roadmapa.md` — current milestone = your scope. Do ONE milestone (or one task) at a time.

**Reference notation:** `03 §5.1` means: file `plan/03-balans.md`, numbered heading `5.1`. Files are numbered `01`–`12`; always resolve and read every section your milestone references before writing code. If a reference doesn't resolve, stop and ask.

## Commands
- `npm run dev` — dev server
- `npm run check` — tsc --noEmit + eslint + vitest + content validator. **Must pass before you claim done.**
- `npm run sim -- --strategy sane --hours 5` — headless balance smoke
- `npm run build` / `VITE_EDITION=demo npm run build` — full / web demo
- `npm run tauri build` — desktop build (M12+)

## Hard rules
1. **No runtime dependencies.** devDependencies only. If you think you need a library, you don't — implement it (specs are in `plan/07`).
2. **Never invent numbers.** Every constant comes from `plan/03`, `plan/04` or `plan/09`. Missing constant → stop and ask.
3. **Layering:** `data/` has no logic. `systems/` never touches DOM. `ui/` never computes game math. Enforced by the validator.
4. **All user-facing text via i18n** (`src/i18n/en.json`). No string literals in `ui/`.
5. **Big numbers:** use the in-house `Big` class everywhere a value can exceed 1e15. Never `number` for loc/money.
6. **Performance is a feature:** no DOM allocation in the tick/render hot path; dirty-flags only; transforms/opacity for animation. Budgets in `plan/07 §9`.
7. **Saves are sacred:** any `GameState` shape change = bump `SAVE_VERSION` + migration + fixture test (`plan/10 §4`).
8. Conventional commits prefixed with milestone: `M3: project board UI`.

## Review workflow (`review/` folder)
Milestone reviews live in `review/review_<k>.md` (see `review/README.md`, process in `plan/08 §15`).
When applying a review file: fix unchecked MUST FIX items, tick `[ ]`→`[x]`, fill each `fix-note:`,
never edit the reviewer's finding text, log disagreements under DISPUTED instead of skipping,
set `Status: FIXED` when done. P2 items: fix only if <10 lines, else note "→ backlog".

## Map: plan → code
| Plan | Code |
|------|------|
| 02 systems design | `src/systems/*` |
| 03/04 formulas+constants | `src/data/constants.ts`, systems |
| 05 story events | `src/data/story/*`, `src/i18n/en.json` |
| 06 UI/tokens | `src/ui/*` |
| 07 architecture | `src/core/*`, `src/platform/*` |
| 09 content tables | `src/data/*` |
