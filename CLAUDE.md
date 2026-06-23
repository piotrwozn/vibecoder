# CLAUDE.md - VIBECODER

This repository is prepared for AI-assisted review and implementation work. Read `AGENTS.md` first;
it is the active agent contract for this repo.

## Start Here

- `README.md` for setup, editions, commands, and release checks.
- `docs/architecture.md` for layer boundaries and implementation rules.
- `docs/roadmap.md` for the current staged development plan.

The old `plan/` and `review/` trees have been retired in favor of smaller, current docs under
`docs/`. Do not rely on deleted plan references.

## Review Mode

When asked for a review, use a code-review stance:

- Lead with findings, ordered by severity.
- Include exact file and line references.
- Focus on real bugs, regressions, migration risks, balance exploits, broken UI flows, performance hot
  paths, and missing tests.
- Keep summaries short and secondary.
- Do not rewrite code unless explicitly asked.

## High-Risk Areas

- Save shape changes: `SAVE_VERSION`, migrations, fixtures, round-trip tests.
- Prestige resets: rewrite, exit, iteration, and Aurora persistence.
- Project economy: payout, recurring revenue, billing, offline progress, and negative money rates.
- Compute and hardware: server dedication, power bills, max-tier gates.
- UI availability: locked apps, Aurora visibility, window manager behavior, Vibex routing.
- Local AI model loading and fallback behavior.

## Verification

Preferred checks:

```powershell
npm run check
npm run sim -- --strategy sane --hours 100
```

For smaller changes, run focused Vitest files covering the touched systems. If a check cannot be run,
state why and identify the remaining risk.
