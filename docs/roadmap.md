# VIBECODER Development Roadmap

This roadmap replaces the retired `plan/` and `review/` working folders. Keep it high signal: update
the stage, acceptance criteria, and open decisions here instead of reintroducing large prose plans.

## Direction

Build in two parallel tracks:

1. Stabilize technical foundations so new systems do not increase coupling or save risk.
2. Add gameplay systems that make production, story, run style, desktop feedback, and endgame choices
   more expressive.

## Stage 1 - Foundations

- Keep the working tree intentional: remove accidental tracked artifacts and keep repo guidance in
  `AGENTS.md`, `CLAUDE.md`, `README.md`, and `docs/`.
- Maintain `npm run check` as the full gate: TypeScript, ESLint, Prettier, Vitest, validation, smoke
  simulations, and Tauri Rust tests.
- Refactor before changing behavior:
  - split `src/main.ts` into bootstrap, loop/offline/tick, persistence, actions, and view-model
    builders;
  - split `src/ui/render.ts` into shell and per-app renderers;
  - split `src/ui/layout.css` into shell, desktop, shared controls, app views, and responsive files.

## Stage 2 - Balance and Diagnostics

- Extend `tools/sim` profiles: `casual`, `active`, `maxer`, `idle_only`, `offline-heavy`, and
  `story-rush`.
- Report milestone timing for tutorial, first rewrite, act finales, first exit, Aurora unlock,
  Aurora completion, first iteration, and endgame state.
- Add diagnostics for blockers: LOC, money, compute, debt, bugs, hardware, story flag, demo gate,
  Aurora servers, and billing.
- Validate impossible unlocks, dead paths, extreme stalls, and demo/full leakage.

## Stage 3 - Player Feedback

- Add a "What is blocking me?" view with the current bottleneck, next useful goal, missing resource,
  missing unlock, and estimated time at the current rate.
- Explain production rates: LOC/s, money/s, compute use, debt drag, project revenue, and prestige
  multiplier sources.
- Improve failed-action messages for compute, affordability, demo locks, era/story locks, Aurora
  servers, billing pauses, and active builds.

## Stage 4 - New Gameplay Systems

- Add a Roadmap or Sprint Board desktop app with strategic sprint priorities and cooldowns.
- Add production incidents with spawn conditions, costs, durations, responses, and visible desktop
  feedback.
- Add story decisions with persistent consequences across projects, hype, debt, revenue, research,
  run modifiers, and endings.
- Add post-exit run styles: bootstrapped, VC-backed, research lab, cursed enterprise, open-source
  collective, and Aurora-first.

## Stage 5 - Desktop Life and Endgame

- Make desktop notifications, feed, inbox, faux issues, pull requests, and changelogs depend on the
  actual game state.
- Expand post-Aurora and post-iteration play with paradox rules, alternate endings, Aurora incidents,
  governance choices, special unlocks, and endless scaling simulations.
- Keep demo web, full web, and desktop edition gates explicit.

## Release Checklist

Before a release candidate:

- `npm run check`
- longer simulations for key profiles, including `sane`, `maxer`, `idle_only`, and `story-rush`
- desktop smoke through Tauri
- manual smoke for new game, save, import/export, corrupt save restore, external links, and local AI
  status
- changelog or release notes entry
- `npm run release:check` before tagging or packaging
