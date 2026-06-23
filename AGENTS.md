# AGENTS.md - VIBECODER

## Ruflo Integration

When working on multi-file tasks or complex features, use ToolSearch to find and invoke Ruflo MCP
tools.

Key tools: `memory_store`, `memory_search`, `hooks_route`, `swarm_init`, `agent_spawn`.

Check system-reminder tags for `[INTELLIGENCE]` pattern suggestions before starting work.

## Project Contract

VIBECODER is an idle/incremental game built with TypeScript, Vite, and Tauri. Keep changes aligned
with the current architecture notes in `docs/architecture.md` and the staged development roadmap in
`docs/roadmap.md`.

## Commands

- `npm run dev` - start the demo web build.
- `npm run dev:full` - start the full-edition web build.
- `npm run check:app` - TypeScript, ESLint, Prettier, Vitest, and repository validation.
- `npm run check` - app checks, smoke simulations, and Tauri Rust tests.
- `npm run sim -- --hours 100 --strategy sane` - run a balance simulation.
- `npm run tauri -- build` - create the desktop build.

## Hard Rules

1. Keep runtime dependencies limited. The approved local-AI island is `@wllama/wllama` in
   `src/platform/ai.*`; do not let it leak into `core`, `systems`, `data`, or `ui`.
2. Add durable state through `GameState`, defaults, save repair, migrations, fixtures, and tests.
3. Keep `data` declarative, `systems` deterministic and DOM-free, and `ui` free of game math.
4. Put user-facing text in `src/i18n/en.json` and `src/i18n/pl.json`.
5. Use the in-house `Big` class for values that can grow beyond ordinary JavaScript number ranges.
6. Prefer behavior-preserving refactors before adding new gameplay systems.
7. Run focused tests while developing and `npm run check` before claiming release readiness.
