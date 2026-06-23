# VIBECODER Debug, Test, and Bugfix Plan

This plan is the operating procedure for finding, reproducing, fixing, and verifying defects across
the whole VIBECODER app. The goal is not to claim impossible absolute perfection; the goal is to end
with **zero known reproducible bugs**, green automated gates, covered regressions, and a clear manual
smoke trail for the remaining human-facing risks.

## 1. Non-Negotiable Rules

1. Do not reset or revert the dirty working tree unless the owner explicitly asks for it.
2. Treat every existing uncommitted change as intentional user work.
3. Debug from evidence: command output, failing tests, screenshots, saved payloads, or exact manual
   reproduction steps.
4. Fix the smallest correct layer:
   - durable shape and migrations in `src/core`;
   - static definitions in `src/data`;
   - deterministic game math in `src/systems`;
   - orchestration in `src/app`;
   - presentation and DOM state in `src/ui`;
   - browser/Tauri differences in `src/platform`;
   - desktop commands and filesystem behavior in `src-tauri`;
   - pacing and long-run confidence in `tools/sim`.
5. Keep `@wllama/wllama` inside the approved local-AI island: `src/platform/ai.*`.
6. Put every user-facing string in both `src/i18n/en.json` and `src/i18n/pl.json`.
7. Any new durable state must update `GameState`, defaults, save repair, migrations, fixtures, and
   tests.
8. Any new content relationship that can drift must get validation in `src/dev/validate.ts`.
9. Every fixed bug must have a regression test unless the bug is purely visual and only verifiable by
   manual or screenshot inspection.
10. Do not mark work complete until the relevant focused tests and the final quality gate are green.

## 2. Baseline Capture

Run these before changing implementation code:

```powershell
git status --short
npm run check
```

Record the result in the working notes:

- current branch and dirty files;
- whether `npm run check` is green or red;
- all failing commands with exact command text;
- all failing test names;
- any manual crash path with exact steps;
- browser console errors if a UI path is involved;
- Tauri terminal output if the desktop shell is involved.

Current known baseline from June 22, 2026:

- `npm run check:app` passed.
- `npm run check` passed.
- Vitest reported 34 passing test files and 246 passing tests.
- `src/dev/validate.ts` passed.
- `sim:smoke` passed for `sane`, `maxer`, `idle_only`, `active`, `casual`,
  `offline-heavy`, and `story-rush`.
- Tauri Rust tests passed: 3 tests.

If the baseline changes, trust the new command output over this document.

## 3. Bug Register Format

Track each suspected issue with this shape until it is closed:

```text
BUG-###:
Severity: P0 | P1 | P2 | P3
Area: core | data | systems | app | ui | platform | tauri | sim | docs
Status: suspected | reproduced | fixed | verified | rejected
Source: test | manual | sim | static audit | user report
Reproduction:
Expected:
Actual:
Suspected files:
Fix summary:
Regression test:
Verification commands:
Residual risk:
```

Severity rules:

- P0: startup crash, data loss, corrupt save overwrite, security issue, impossible boot, impossible
  progression.
- P1: broken unlock path, broken economy milestone, demo/full leakage, broken import/export, broken
  desktop save behavior.
- P2: wrong UI invalidation, wrong tooltip/text, non-critical formula error, incomplete repair path,
  visual state mismatch.
- P3: cosmetic layout issue, minor copy issue, non-blocking diagnostic improvement.

No release-ready claim is allowed while any P0 or P1 remains open.

## 4. Line-by-Line Audit Procedure

Use this exact review loop for every source file being audited:

1. Read imports first.
2. Confirm the file imports only from allowed architecture layers.
3. Check exported types and functions before private helpers.
4. For every public function, write down its inputs, outputs, mutations, emitted events, persistence
   effects, and invalidation effects.
5. For every branch, check the false path, not only the success path.
6. For every numeric operation, check finite values, negative values, integer-only values, Big values,
   and overflow/underflow risks.
7. For every array lookup, check missing IDs and empty arrays.
8. For every map or record lookup, check unknown keys and stale save data.
9. For every `Set`, confirm serialization and repair behavior.
10. For every async path, check race conditions, rejected promises, stale tokens, and UI state after
    failure.
11. For every DOM update, check remount behavior, event listener duplication, focus handling, and
    stale view-models.
12. For every persisted setting, check default, repair, UI control, save, import, export, and reset.
13. For every user-facing text key, confirm English and Polish entries.
14. For every event bus emission, confirm at least one expected consumer or intentionally fire-and-
    forget behavior.
15. For every function with side effects, decide which focused test should fail if the logic breaks.

## 5. Audit Order

### 5.1 Entry and App Orchestration

Audit in this order:

1. `src/main.ts`
2. `src/app/bootstrap.ts`
3. `src/app/game-loop.ts`
4. `src/app/actions.ts`
5. `src/app/persistence.ts`
6. `src/app/save-failure.ts`
7. `src/app/comms.ts`
8. `src/app/view-models.ts`
9. `src/app/vibex-session.ts`
10. `src/app/export-save.ts`
11. `src/app/formatters.ts`

Checks:

- boot must fail loudly only for truly fatal setup, such as missing `#app`;
- locale fallback must repair only invalid locale state;
- `ensureProjectBoard` and `recomputeDerivedCache` must run before UI depends on derived values;
- every action that mutates durable state must either persist immediately or be covered by autosave;
- every action must mark visible or structural invalidation correctly;
- failed actions must not persist accidental state;
- import save must unblock persistence only after a valid import;
- wipe save must create a fresh state for the active edition;
- language changes must ignore stale async completions;
- Vibex AI generation must not crash the UI if model loading fails.

### 5.2 Core State, Save, and Loop

Audit in this order:

1. `src/core/state.ts`
2. `src/core/save.ts`
3. `src/core/migrations.ts`
4. `src/core/bignum.ts`
5. `src/core/loop.ts`
6. `src/core/rng.ts`
7. `src/core/bus.ts`
8. `src/core/ui-state.ts`
9. `src/core/view-invalidation.ts`
10. `src/core/format.ts`

Checks:

- `createDefaultGameState` must include every durable field exactly once;
- `SAVE_VERSION` must match migrations and fixtures;
- repair must reject corrupt roots and future saves safely;
- save repair must preserve valid data and replace only invalid shapes;
- `Big` must round-trip through JSON and tolerate large game values;
- loop catch-up must not double-apply offline progress;
- event bus handlers must not leak or mutate listener collections unexpectedly;
- invalidation must recompute cache before any view that uses derived values;
- window and tutorial repair must prevent impossible UI states.

### 5.3 Data Definitions

Audit in this order:

1. `src/data/constants.ts`
2. `src/data/conditions.ts`
3. `src/data/generators.ts`
4. `src/data/hardware.ts`
5. `src/data/projects.ts`
6. `src/data/project-chains.ts`
7. `src/data/research.ts`
8. `src/data/upgrades.ts`
9. `src/data/prestige.ts`
10. `src/data/eras.ts`
11. `src/data/aurora.ts`
12. `src/data/billing.ts`
13. `src/data/roadmap.ts`
14. `src/data/incidents.ts`
15. `src/data/momentum.ts`
16. `src/data/run-styles.ts`
17. `src/data/vibex.ts`
18. `src/data/achievements.ts`
19. `src/data/story/*.ts`

Checks:

- all IDs must be unique inside their domain;
- all referenced IDs must exist;
- conditions must be satisfiable from normal progression;
- demo gates and full-edition gates must be explicit;
- costs, rewards, durations, and unlock requirements must not create deadlocks;
- story flags must be produced before they are required;
- content must not import systems, UI, or platform code;
- every user-visible content key must exist in both locale files;
- validation must catch any relationship that could silently drift.

### 5.4 Deterministic Systems

Audit in this order, matching the loop where possible:

1. `src/systems/production.ts`
2. `src/systems/projects.ts`
3. `src/systems/billing.ts`
4. `src/systems/aurora.ts`
5. `src/systems/roadmap.ts`
6. `src/systems/incidents.ts`
7. `src/systems/hype.ts`
8. `src/systems/debt.ts`
9. `src/systems/automation.ts`
10. `src/systems/story.ts`
11. `src/systems/story-decisions.ts`
12. `src/systems/prestige.ts`
13. `src/systems/prestige-math.ts`
14. `src/systems/progress.ts`
15. `src/systems/momentum.ts`
16. `src/systems/compute.ts`
17. `src/systems/research.ts`
18. `src/systems/upgrades.ts`
19. `src/systems/unlocks.ts`
20. `src/systems/stats.ts`
21. `src/systems/achievements.ts`
22. `src/systems/offline.ts`
23. `src/systems/demo.ts`
24. `src/systems/run-styles.ts`
25. `src/systems/prompt.ts`
26. `src/systems/vibex.ts`
27. `src/systems/eras.ts`

Checks:

- systems must be deterministic and DOM-free;
- systems must not call platform APIs;
- tick functions must tolerate `dtS = 0`, small values, large offline values, and long-session
  values;
- costs must be charged once;
- rewards must be granted once;
- failed purchases must leave state unchanged;
- emitted bus events must match actual state changes;
- computed rates must be refreshed after inputs change;
- automation must not bypass unlock rules;
- offline progress must be equivalent to loop progress within documented approximations;
- prestige, rewrite, exit, and iteration must reset only intended fields;
- achievements and stats must not mutate gameplay state beyond their own domains.

### 5.5 UI and Rendering

Audit in this order:

1. `src/ui/render.ts`
2. `src/ui/render/*.ts`
3. `src/ui/wm/window-manager.ts`
4. `src/ui/audio.ts`
5. `src/ui/dom.ts`
6. `src/ui/theme.css`
7. `src/ui/layout.css`
8. `src/ui/layout/*.css`

Checks:

- UI must consume view-models and action callbacks, not game systems directly;
- buttons must call the intended action exactly once;
- disabled states must match system failure conditions;
- modals must close predictably and preserve state where expected;
- import/export controls must handle invalid input without breaking the app;
- window manager must clamp move and resize results to visible bounds;
- minimized, maximized, restored, focused, and closed states must round-trip through save repair;
- layout must work at desktop, tablet, and narrow mobile widths;
- text must not overflow buttons, cards, toolbars, or modal bounds;
- audio failures must not block gameplay.

### 5.6 Platform and Tauri

Audit in this order:

1. `src/platform/platform.ts`
2. `src/platform/web.ts`
3. `src/platform/desktop.ts`
4. `src/platform/ai.ts`
5. `src/platform/ai.full.ts`
6. `src/platform/ai.worker.ts`
7. `src-tauri/src/lib.rs`
8. `src-tauri/src/main.rs`
9. `src-tauri/tauri.conf.json`
10. `src-tauri/capabilities/default.json`

Checks:

- web and desktop platforms must expose the same semantic save behavior;
- desktop commands must reject unsafe paths, invalid URLs, and unsupported schemes;
- backup pruning must keep the newest valid entries;
- failed save/load/export commands must report failure without corrupting current state;
- local AI must have unavailable, loading, ready, and failure states;
- demo builds must not accidentally require full-edition AI assets;
- Tauri permissions must be no broader than needed.

### 5.7 Simulation and Developer Validation

Audit in this order:

1. `tools/sim/index.ts`
2. `tools/sim/ts-loader.mjs`
3. `src/dev/validate.ts`
4. `src/dev/validate-i18n.ts`
5. `src/dev/perf-panel.ts`
6. `tools/check-changelog.mjs`

Checks:

- simulations must exercise the same systems as the real loop;
- each strategy must have a clear behavioral purpose;
- milestone reporting must expose blockers, not just final totals;
- validation must fail on missing content references, impossible unlocks, missing i18n, and
  demo/full leakage;
- dev-only tools must not affect production behavior.

## 6. Reproduction Workflow

For every suspected bug:

1. Isolate the smallest command or manual path that reproduces it.
2. Decide whether it is deterministic.
3. If deterministic, create a focused unit or integration test first.
4. If timing-dependent, add a controlled time/RNG test or simulation assertion.
5. If visual, capture viewport, browser console, and exact click path.
6. If desktop-specific, reproduce through Tauri and capture Rust-side output.
7. State the expected behavior from architecture, data, or existing tests.
8. State the actual behavior.
9. Identify the lowest layer responsible for the mismatch.
10. Only then implement the fix.

## 7. Testing Phases

### Phase A: Static Gate

Run:

```powershell
npm run build
```

Expected:

- TypeScript passes.
- Vite production build passes.
- No architecture leak is introduced by imports.

### Phase B: Focused Tests

Run the smallest relevant test file first:

```powershell
npx vitest run tests/save.test.ts
npx vitest run tests/projects.test.ts
npx vitest run tests/render.test.ts
```

Choose the specific file that matches the touched area.

Expected:

- the new regression test fails before the fix or would have failed against the broken behavior;
- the same test passes after the fix;
- neighboring tests in the same area pass.

### Phase C: App Gate

Run:

```powershell
npm run check:app
```

Expected:

- `tsc --noEmit` passes;
- `eslint .` passes;
- `prettier --check .` passes;
- `vitest run` passes;
- `npm run validate` passes.

### Phase D: Smoke Simulations

Run:

```powershell
npm run sim:smoke
```

Expected:

- all configured strategies complete without runtime errors;
- milestone output remains plausible;
- no strategy reports an impossible blocker caused by the change.

### Phase E: Long Simulations

Run after economy, story, prestige, Aurora, offline, or unlock changes:

```powershell
npm run sim -- --hours 100 --strategy sane
npm run sim -- --hours 100 --strategy maxer
npm run sim -- --hours 100 --strategy idle_only
npm run sim -- --hours 100 --strategy story-rush
npm run sim -- --hours 100 --strategy offline-heavy
```

Expected:

- no crash;
- no NaN, Infinity, negative impossible resources, or stuck required milestone;
- blocker diagnostics explain any intentionally incomplete route;
- endgame and Aurora milestones remain reachable for strategies that should reach them.

### Phase F: Tauri Gate

Run:

```powershell
npm run check:tauri
```

Expected:

- Rust tests pass;
- URL and backup safety tests continue to pass;
- new desktop behavior has Rust-side coverage when possible.

### Phase G: Full Gate

Run:

```powershell
npm run check
```

Expected:

- app gate passes;
- smoke simulations pass;
- Tauri Rust tests pass.

### Phase H: Release Gate

Run only when preparing release readiness:

```powershell
npm run release:check
```

Expected:

- full check passes;
- changelog check passes;
- release notes are present for user-visible behavior changes.

## 8. Manual Web Smoke Checklist

Run:

```powershell
npm run dev
```

Then verify:

1. Fresh boot loads without console errors.
2. Start desktop works.
3. Tutorial next/back/skip works.
4. Vibex prompt click grants LOC.
5. Manual Vibex prompt returns a response.
6. Projects app opens and starts an available project.
7. Agents/hardware/research/upgrades views open without broken controls.
8. Settings changes persist after reload.
9. Language switches to Polish and back to English.
10. Sound, volume, reduced effects, glitch, and skip intro controls update UI state.
11. Window open/focus/minimize/maximize/restore/close works.
12. Reset window layout works.
13. Export save returns a payload.
14. Importing the exported payload succeeds.
15. Importing invalid payload fails with a toast and does not wipe the current run.
16. Wipe save creates a clean new run.
17. Reload after save restores expected state.
18. Simulated offline return shows an offline summary only when enough time elapsed.
19. No app window shows missing translation keys.
20. No visible text overflows at common desktop and narrow widths.

## 9. Manual Full-Edition Smoke Checklist

Run:

```powershell
npm run dev:full
```

Then verify:

1. Full edition boots without requiring desktop-only APIs.
2. Full-only gates are visible only where intended.
3. Local AI setting can be toggled.
4. AI unavailable/loading/ready/failure states do not break Vibex.
5. If the model is not available, Vibex falls back cleanly.
6. No `@wllama/wllama` imports appear outside `src/platform/ai.*`.

## 10. Manual Desktop Smoke Checklist

Run the Tauri app through the project-standard desktop command or release build path.

Verify:

1. Desktop app starts.
2. Save file is created or loaded.
3. Save survives app restart.
4. Corrupt save path restores backup or resets safely.
5. Export command writes expected output.
6. External links open only allowed HTTP or HTTPS URLs.
7. Invalid external links are rejected.
8. Closing the window persists current state.
9. Desktop-specific errors appear as safe UI failure, not a crash.

## 11. Bugfix Implementation Procedure

For each bug:

1. Add or identify the failing focused test.
2. Confirm the test fails for the right reason.
3. Patch the lowest responsible layer.
4. Avoid unrelated refactors.
5. Keep public interfaces stable unless the bug is in the interface itself.
6. If changing state shape, update all save and fixture paths in the same patch.
7. If changing content, update validation in the same patch.
8. If changing UI text, update both locale files in the same patch.
9. If changing Tauri behavior, add or update Rust tests in the same patch.
10. Run the focused test.
11. Run `npm run check:app`.
12. Run `npm run check` before declaring the bug verified.
13. Mark the bug register entry as verified only after commands pass.

## 12. Regression Test Matrix

Minimum test target by area:

- `src/core/save.ts`: corrupt JSON, non-object root, future version, repair warnings, backup restore,
  import/export round-trip.
- `src/core/migrations.ts`: every supported old fixture migrates to the latest state.
- `src/core/bignum.ts`: large values, zero, addition, subtraction, multiplication, comparison,
  serialization.
- `src/app/actions.ts`: failed action no-op, successful action mutation, persistence trigger,
  invalidation trigger.
- `src/app/game-loop.ts`: tick order, cache recomputation, offline catch-up boundary.
- `src/systems/production.ts`: generator purchases, rate calculation, Big scaling, resource events.
- `src/systems/projects.ts`: board refresh, start build, finish build, payout, revenue, bugs.
- `src/systems/prestige.ts`: rewrite, exit, iteration, reset boundaries, retained meta resources.
- `src/systems/story.ts`: act progression, seen messages, inbox state, choices and flags.
- `src/systems/aurora.ts`: unlock, server dedication, funding, billing paused, completion.
- `src/systems/incidents.ts`: spawn, response, resolution, history, resource effects.
- `src/systems/offline.ts`: elapsed time cap, equivalent progression, no double catch-up.
- `src/ui/wm/window-manager.ts`: clamp, focus, z-index, maximize restore, repair compatibility.
- `src/ui/render*.ts`: button wiring, disabled states, modals, missing text, import/export flows.
- `src/platform/*.ts`: web save, desktop save wrapper, local AI status transitions.
- `src-tauri/src/lib.rs`: backup pruning, external URL safety, filesystem failures.
- `tools/sim/index.ts`: strategy coverage, milestone output, blocker diagnostics.

## 13. Final Acceptance Criteria

The application can be considered clean only when all of these are true:

1. No open P0 bugs.
2. No open P1 bugs.
3. Every fixed bug has a regression test or documented manual-only verification.
4. `npm run check` passes.
5. Long simulations pass for all strategies affected by recent changes.
6. Manual web smoke passes for changed UI flows.
7. Manual full-edition smoke passes if edition gates or AI changed.
8. Manual desktop smoke passes if platform or Tauri changed.
9. No new architecture boundary violation is found.
10. No new missing i18n key is found.
11. No save migration or repair gap is known.
12. No impossible progression path is known.

The honest final claim should be: **zero known reproducible bugs after the defined audit, automated
tests, simulations, and manual smoke checks**.
