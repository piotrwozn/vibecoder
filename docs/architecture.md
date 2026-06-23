# VIBECODER Architecture

This codebase is a small deterministic game engine with a DOM renderer and a Tauri shell. Keep new
features inside the existing layers so balance, saves, and tests stay tractable.

## Layers

- `src/core` owns durable state shape, save repair, migrations, formatting primitives, the event bus,
  and loop helpers. It should not depend on UI, platform, or feature systems.
- `src/data` contains static definitions: generators, projects, research, upgrades, prestige, story,
  hardware, Aurora, constants, and unlock conditions. Data modules must not import systems, UI, or
  platform code.
- `src/systems` contains deterministic game logic. Systems may read data and mutate `GameState`, but
  they must not touch DOM globals or call platform APIs.
- `src/ui` contains DOM construction, view updates, CSS, audio, and the desktop window manager. UI
  consumes view-models and action callbacks; it should not import game systems directly.
- `src/platform` contains browser/Tauri differences: save storage, desktop commands, title updates,
  external links, and full-edition Vibex AI loading.
- `tools/sim` drives the same systems as the game loop to check campaign pacing and endless scaling.
- `src-tauri` hosts desktop-only commands for durable saves, backups, exports, external links, and app
  lifecycle.

## Main Flow

1. `src/main.ts` loads the platform and save, repairs/migrates state, loads locale, creates the event
   bus, derived cache, audio controller, and renderer.
2. Player actions call system functions, mark view/cache invalidation, and persist important changes.
3. The loop advances production, projects, billing, Aurora, hype, debt, story, automation, stats, and
   achievements.
4. `DerivedCache` in `src/systems/production.ts` centralizes multipliers and calculated rates used by
   multiple systems and view-models.
5. Saves serialize `Set` values as arrays and repair older/corrupt shapes through `src/core/save.ts`
   and `src/core/migrations.ts`.

## App Modules

- `src/app/bootstrap.ts` owns DOM root lookup, web/Tauri platform selection, save loading, and boot
  locale fallback.
- `src/app/game-loop.ts` owns the tick order and render invalidation flush for the active run.
- `src/app/persistence.ts` owns autosave scheduling and blocked-save handling after corrupt/newer
  save loads.
- `src/app/comms.ts` owns story inbox view caching, read-state updates, channel routing, and story
  toasts.
- `src/app/vibex-session.ts` owns transient Vibex prompt/code/assistant state that is derived from
  persisted seeds.
- `src/app/formatters.ts` owns UI formatting helpers that need current settings.

## Implementation Rules

- Add new durable fields through `GameState`, `createDefaultGameState`, save repair, migrations, and
  tests.
- Add new content as data definitions first, then system behavior, then view-model/UI.
- Keep system tests independent of the DOM.
- Keep UI text in `src/i18n/en.json` and `src/i18n/pl.json`.
- Add validation in `src/dev/validate.ts` when a new content relationship can drift.
- Run `npm run check:app` for app changes and `npm run check` before release-oriented changes.

## Current Module Layout

- `src/main.ts` is the app entrypoint and delegates bootstrap, loop, persistence, actions, and
  view-model construction to `src/app`.
- `src/ui/render.ts` owns boot, desktop shell/window glue, Vibex terminal glue, offline and ending
  modals. Per-app renderers live under `src/ui/render/`.
- `src/ui/layout.css` imports themed CSS slices from `src/ui/layout/`.
