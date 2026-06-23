# Release Checklist

Use this for release candidates and desktop build smoke checks.

## Automated Gate

```powershell
npm run release:check
```

This runs TypeScript, ESLint, Prettier, Vitest, repository validation, smoke simulations, Tauri Rust
tests, and changelog validation.

## Manual Smoke

- New game starts in demo web.
- Full web starts with expected edition gates.
- Desktop starts as full edition.
- Save, autosave, backup listing, import, and export work.
- Corrupt save restore shows the repair warning and preserves a backup.
- External links open through the platform boundary.
- Local AI status is visible and does not load in demo-only paths.
- Roadmap sprint, production incident, and run style controls respond in the desktop UI.

## Build Artifacts

```powershell
npm run build:demo
npm run build:full
npm run release:tauri
```
