# M12 release QA

## Soak

- [ ] Start a full desktop build with `?dev=1`.
- [ ] Use the dev panel `+8h` control or run continuously for 8h at x100 time warp.
- [ ] Record heap at each simulated hour.
- [ ] Confirm ms/tick stays below the budget from `plan/07 §9`.
- [ ] Confirm frame time stays below the budget from `plan/07 §9`.
- [ ] Confirm no rising heap trend after the first hour.

## Checklist

- [ ] Fresh start reaches Act 0 without soft-locks.
- [ ] Reload on every screen restores an identical state.
- [ ] Export, wipe, import restores an identical state.
- [ ] Demo hides E3+ content, shows the full-game panel, and exports a save.
- [ ] Desktop stores the save under app data and rotates three backups.
- [ ] Desktop update from the previous signed test version downloads silently and offers restart.
- [ ] Offline progress works at 1m, 1h, 30h cap, and after moving the system clock backward.
- [ ] Keyboard navigation reaches every screen and modal.
- [ ] Reduced motion disables animated effects.
- [ ] Sound plays for 30m without crackle, and mute stops playback.

## Release secrets

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- `TAURI_UPDATER_PUBKEY`
