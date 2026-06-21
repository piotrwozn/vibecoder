# CLAUDE.md - VIBECODER

This repository is ready for Claude Code review.

## Start Here

Read `AGENTS.md` first. It is the authoritative agent contract for this repo.

Then read:

- `plan/README.md`
- `plan/08-roadmapa.md`
- any referenced sections from `plan/02`, `plan/03`, `plan/04`, `plan/05`, `plan/06`, `plan/07`, `plan/09`, and `plan/10`

The Polish design files in `plan/` are the source of truth. Do not invent formulas, costs, rates, story gates, or content numbers.

## Project Shape

VIBECODER is an idle/incremental game built with TypeScript and Vite.

Important boundaries:

- `data/` contains authored definitions, not game logic.
- `systems/` contains game logic, never DOM work.
- `ui/` renders and wires UI, never computes game math.
- `core/` owns state, saves, migrations, formatting, and primitives.
- User-facing strings go through i18n.
- Large values use the in-house `Big` class.

Runtime dependency policy:

- No runtime dependencies except the approved Vibex local-AI island in `src/platform/ai.*`.
- Keep `wllama` imports isolated to that platform layer.

## Review Mode

When asked for an ultrareview, use a code-review stance:

- Lead with findings, ordered by severity.
- Include exact file and line references.
- Focus on real bugs, regressions, migration risks, balance exploits, broken UI flows, performance hot paths, and missing tests.
- Keep summaries short and secondary.
- Do not rewrite code unless explicitly asked.

High-risk areas to inspect:

- Save shape changes: `SAVE_VERSION`, migrations, fixtures, round-trip tests.
- Prestige resets: REWRITE, EXIT, ITERATION, and Aurora persistence.
- Project economy: payout vs recurring revenue, billing, negative `$ / s`, offline progress.
- Compute and hardware: server dedication, power bills, max-tier gates.
- UI availability: locked apps, Aurora visibility, window manager behavior, Vibex prompt routing.
- Local AI model loading and fallback behavior.
- Installer/release files must not be committed; `release/` is ignored.

## Verification

Preferred checks:

```powershell
npm run check
npm run sim -- --strategy sane --hours 100
```

For smaller reviews, run focused Vitest files that cover the touched systems.

If tests cannot be run, say why and identify the remaining risk.

## GitHub

Remote:

```text
https://github.com/piotrwozn/vibecoder.git
```

Local installer artifacts live in `release/` and are intentionally not tracked by GitHub because they exceed GitHub's 100 MB file limit.
