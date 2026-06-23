# VIBECODER — Iterative Verification Review (Cycle 2)

**Subject:** Audit of the codebase after the Executor AI applied the fixes prescribed in `review/review_1.md`.
**Method:** Every item from `review_1.md` was cross-referenced against the **current** source (symbol-located, not line-trusted) across six parallel audits, each verifying the actual mechanism rather than the presence of a comment. Independent validation: `tsc --noEmit` and the full Vitest suite were run.

## Verdict Summary

The Executor's work is **of high quality and largely complete.** Of the ~52 prescribed items, **47 are fully and correctly FIXED**, **4 are PARTIAL** (the correctness half done, an optional/secondary half skipped), and **1 is MISSED but materially mitigated** by pre-existing infrastructure. **No correctness regressions** were introduced — notable given the large UI refactor (`layout.css` split into `src/ui/layout/*`, `render.ts` heavily churned).

**Independent gate results:**
- `npx tsc --noEmit` → **exit 0** (clean).
- `npx vitest run` → **38 files / 300 tests passed**, 0 failures. New regression tests for the critical and high-severity fixes are present (`tests/aurora.test.ts` +92 lines, `tests/projects.test.ts`, `tests/offline.test.ts`, `tests/format.test.ts`, `tests/prestige.test.ts`).

| Status | Count | Items |
|--------|-------|-------|
| **FIXED** | 47 | incl. all Critical/High/Medium |
| **PARTIAL** | 4 | desktop-window forced reflow; bus per-emit allocation; `listBackups` `.catch`; (offline-achievement literal fix) |
| **MISSED (mitigated)** | 1 | offline achievement evaluation — contained by the RAF unlock coalescer |
| **Regressions** | 0 | typecheck + 300 tests green |

The remaining work is **low-severity polish.** There is nothing run-ending, no data-corruption risk, and no exploit left open.

---

## 1. Implementation Audit (Review 1 vs Current Code)

### 1.1 Critical & High — all FIXED and correctly mechanized

- **[CRITICAL] Aurora prestige → permanent default — FIXED.** `billing.ts:60-75` now zeroes the Aurora bill via a real affordability grace (`moneyAfterHardwareGrace.lt(fullAuroraBill) ? Big.zero() : fullAuroraBill`), so the unpaid Aurora power is **excluded from `totalBill`** and never reaches `accrueBankOverdraft`. The Executor correctly **rejected** the unsound `billingPaused=true` approach flagged in review_1; `state.aurora.billingPaused` is now a derived per-tick flag, not the load-bearing mechanism. A zero-income post-reset run with a dedicated server can no longer default on tick one. Covered by `tests/aurora.test.ts`.
- **[HIGH] Maxed-product re-ship exploit — FIXED.** `getOwnedProductLevel` (`projects.ts:525-535`) reports the max level across **all** products (no `<MAX` filter) and is wired into every guard: `getProjectLevel:225`, `getProjectNextLevel:241`, `createActiveBuild.isFirstShip:389`, `view-models.atMaxLevel:1488`, and a `startProject` short-circuit (`projects.ts:89-90`, `reason:"maxLevel"`) that fires before any build. The filtered resolver is no longer read by any level/`atMaxLevel` path, so a maxed line is un-startable and cannot re-grant the first-ship payout.
- **[HIGH] Offline-threshold conflation — FIXED.** `OFFLINE_THRESHOLD_MS = 30_000` added (`loop.ts:41`); the catch-up branch uses it (`loop.ts:68`) while the accumulator clamp keeps `OFFLINE_CATCH_UP_MS` (`loop.ts:80`). Critically, `main.ts` `applyOfflineOnReturn` now gates on the **same** 30s constant (`main.ts:420`), so the two sites are consistent — the exact failure mode (loop and main using different thresholds) was avoided. A 2–30s gap now falls through the clamped loop with no hype halving and no modal.

### 1.2 Medium — all FIXED

- **Bank not reset on prestige — FIXED.** `state.bank = createDefaultBankState()` at the top of `applyPrestigeResetSpec` (`prestige.ts:1076`), which runs for rewrite, exit, **and** iteration.
- **Incidents/sprint not cleared on rewrite — FIXED.** `performRewrite` now resets `state.incidents` (`prestige.ts:511-515`, preserving `history`) and the sprint (`505-510`), matching the exit/iteration paths.
- **`getRewriteStartMoney` war-chest abuse — FIXED.** The equity multiplier is now applied **only to the flat term** (`prestige.ts:914-933`): `Big.add(Big.mul(flatMoney, multiplier), ratioMoney)`. The `i_c4`×`q_war_chest` ≥100%-refund exploit is closed.
- **Stale time-multiplier cache — FIXED (both axes).** The angel-network ×10 is no longer baked into the cache; it is computed live via `getAngelNetworkMultiplierAt` inside `getLiveProjectRevenueMultiplier` (`projects.ts:462`). The offline path is **segmented at the `angelNetworkUntil` boundary** (`offline.ts:97-124`, `getOfflineSegmentS`), so the buff is applied only to the in-window portion — the subtle requirement that review_1 emphasized was met.
- **Wllama leak + re-download storm — FIXED.** `loadModel` disposes the prior instance before reassigning and on failure (`ai.full.ts:152,191` → `disposeInstance`→`exit()`); `downloadModel`'s catch disposes too. The `'error'` state now short-circuits generation in `sendVibexPrompt` (`actions.ts:515-520`), providing the prescribed backoff (no per-prompt ~100 MB refetch).
- **Fractional-autosave write storm — FIXED (all 3 layers).** Load repair `{ integer, min:1, positive }` (`save.ts:501-507`); schedule-site clamp `Math.max(1, autosaveS)` (`persistence.ts:68-72`); UI handler requires `>= 1` and `Math.trunc` (`settings.ts:53-61`, re-clamped in `actions.ts:328`).
- **Roadmap full-rebuild every frame — FIXED.** `updateRoadmap` now early-returns on a `JSON.stringify(view)` signature match (`roadmap.ts:18-21`); `resetRoadmapRenderCache` is wired into `resetRenderCaches` (`render.ts:424`). The review explicitly accepted signature-gating as an alternative to keyed-patch.

### 1.3 Low — FIXED (representative confirmations)

All of the following were verified present and mechanically correct:
- Save layer: `era` repair `{positive}` (`save.ts:411`); backup recovery in the load-throw catch (`save.ts:115-134`); `repairStats` `{m,e}`-shape validation via `isBigLikeStat` — **not** the unsound string-only branch (`save.ts:1502-1548`); `repairNumberRecord` id-allowlist against `GENERATOR_IDS`/`HARDWARE_IDS`+`LEGACY_HARDWARE_ID` (`save.ts:1235-1263`); `lastSeen` restored on save failure (`save.ts:182-192`).
- Rust IPC: `save_game` no longer deletes before `fs::rename` (`lib.rs:27-36`); `export_file` reserved-name guard case-folded (`lib.rs:288-298`, with a passing unit test for `VIBECODER_SAVE.JSON`).
- Prestige leaks: build-momentum stats now in `RUN_STAT_RESET_KEYS`; `ITERATION_HOLD_STAT` in `RESET_LAYER_STAT_KEYS.rewrite`.
- Loop/offline: time-based hype decay gated on `cappedS` (`offline.ts:50-53`, blackout no longer halves hype); monotonic clamp against the clock-forward windfall (`offline.ts:26,81-95` + `main.ts:278`); Tauri `CloseRequested` handler persists-before-exit (`lib.rs:173-180` + `main.ts:268-272`).
- Systems: story inbox `upsertInboxEntry` reuse + `latestInboxIndexByEventId` map (`story.ts:339`, `comms.ts:68`); `incidents.history` bounded at 50 (`incidents.ts:277-287`); incident-timeout flat penalty now applied **after** the ×1.25 multiplier (`incidents.ts:191-192`); dead `generatorCostMultiplier` removed from `RunStyleEffects`; download progress throttled to integer percent (`ai.full.ts:210-222`); Vibex token invalidated on state swap (`actions.ts:434,802,807`); `resetSettings` preserves current lang (`actions.ts:670`); layering validator covers dynamic `import()` (`validate.ts:165-169`).
- Render/UI: boot-scene early-return (`render.ts:608-612`); window-frame change detection (`applyWindowFrame` `render.ts:1915-1935`); `t()` regex hoisted + brace-free fast path (`i18n.ts:9,40-42`); single income/billing computation with lazy tooltips (`view-models.ts:261-263,303,306`); single milestone call (`prestige.ts:421`); bus per-listener `try/catch` + loop-frame guard that logs and reschedules (`bus.ts:57-63`, `loop.ts:131-144`); exit/paradox `section.hidden` JS guards **and** the `[hidden]{display:none}` CSS override relocated intact to `src/ui/layout/shell-apps.css:984-987`; formatter carry + sub-1 fixes (`format.ts:20-22,48-64`) with updated `tests/format.test.ts`.
- Board preview now routes through `getPortfolioIncomeMultiplier` (`view-models.ts:1490`); per-generator softcap display scaled (`production.ts:398-405`); `p_open_source` dead content + exploit removed; dedicated project-cost constants added (`constants.ts:31-32`); `desktop.ts` fire-and-forget invokes `.catch`-guarded.

---

## 2. Unresolved Issues (Carried Over)

Four items remain. **None is severe**; all are low-priority polish, but they were prescribed in review_1 and are not yet complete.

### 2.1 [PARTIAL] `updateDesktopWindows` still forces a synchronous reflow every frame
**Location:** `src/ui/render.ts:1623`, `getDesktopBounds` `render.ts:1957-1965`.
The *write* half was done — `applyWindowFrame` now skips style writes when the frame is unchanged (`render.ts:1915-1935`). The *read* half was **not**: `getDesktopBounds` calls `layer.getBoundingClientRect()` unconditionally, once per rendered frame, forcing a synchronous layout flush even when nothing moved. There is no `cachedBounds`, no `ResizeObserver`, and no `resize` listener anywhere in `render.ts`. **Why insufficient:** the most expensive part of the original finding — the forced reflow — persists. Fix: cache the bounds and invalidate via a `ResizeObserver`/`resize` listener on `windowsLayer`.

### 2.2 [PARTIAL/MISSED] `main.ts` `listBackups()` chain has no `.catch`
**Location:** `src/main.ts:59-62`.
The `desktop.ts` invokes (`openExternal`/`setTitle`/`quit`) were correctly `.catch`-guarded, but the boot-time `void platform.listBackups?.().then(...)` chain was left unguarded. The Rust `list_backups` command can reject (e.g. app-data-dir resolution failure), producing exactly the unhandled-rejection the item flagged. **Why insufficient:** the fix was applied to one of the two call sites named in review_1. Fix: append `.catch(() => {})` to the `listBackups` chain.

### 2.3 [PARTIAL] Bus `emit` still allocates a snapshot array per emit
**Location:** `src/core/bus.ts:57` — `for (const listener of [...listeners])`.
The two correctness guards (per-listener `try/catch`, loop-frame reschedule) are fully implemented. The allocation-avoidance sub-point was not: a fresh array is still copied on every `emit`, including the hot `res:changed`/`production:changed` paths fired multiple times per tick. **Why insufficient:** optional micro-optimization, but explicitly requested. Fix: iterate the Set behind an emitting-flag reentrancy guard, snapshotting lazily only on mutation. *(Lowest priority — listener counts are small.)*

### 2.4 [MISSED, mitigated] Offline catch-up still does not evaluate achievements
**Location:** `src/systems/offline.ts:20-79` (no `tickAchievements`), surfaced on the first live tick via `game-loop.ts:82`.
The literal prescribed fix (silent achievement reconciliation during catch-up) was **not** implemented. However, the practical impact is contained: the `unlock` bus handler now coalesces events per RAF frame into a single deduped toast + one sound (`main.ts:231-253`, `flushUnlockToasts`). So a returning player gets one batched notification rather than an N-deep flood. **Why still open:** the burst is contained, not eliminated, and achievements are still recorded one tick late after an offline return. Acceptable to defer, but note it is not a true fix.

---

## 3. New Discoveries & Regressions (Backend & UI)

### 3.1 Regressions introduced by the refactor — NONE
- `tsc --noEmit` is clean; all 300 tests pass. The large UI refactor (CSS split, `render.ts` churn) did not break the cache-reset chain (`resetRenderCaches` still invokes every per-module reset, `render.ts:419-430`) and did not silently drop the exit/paradox `[hidden]` CSS — it relocated intact to `shell-apps.css:984-987`.
- No new architectural-boundary violations: the (now-strengthened) layering validator passes.

### 3.2 Pre-existing observations surfaced during the audit (not regressions, informational)
- **`calculateOfflineMoney` hardcodes `hype = 1` (`offline.ts:104`).** Offline income ignores the player's current hype level. This is a pre-existing offline-modeling choice, **not** introduced by this cycle, but it is worth a deliberate decision: combined with the now-correct offline hype *decay*, offline income is computed as if hype were neutral. Confirm this is intended balance.
- **`incidents.history` is bounded (50) but still preserved across prestige (`prestige.ts` exit/iteration).** The leak is capped per the requirement, but up-to-50 cross-run entries persist in every save. Harmless today (nothing reads `history`); only a concern if future code reads it per-run. Informational.
- **`updateRoadmap` signature is `JSON.stringify(view)` per frame (`roadmap.ts:18`).** Correctly eliminates the DOM teardown, but the stringify itself runs each frame while the roadmap is open. Bounded and far cheaper than the rebuild it replaced; a keyed-patch would remove even this, but it is acceptable.

### 3.3 No new backend bugs, crashes, exploits, or data-corruption risks were found in the audited surface.

---

## 4. Updated Step-by-Step Implementation Guide for the Executor AI

This cycle is **cleanup only.** Execute in order; run `npm run check` after the batch. No save-shape changes are required, so no `SAVE_VERSION` bump is needed for these items.

**Step 1 — Eliminate the per-frame forced reflow (highest remaining value).** In `src/ui/render.ts`: add a module-scoped `cachedWindowBounds` and a `WindowBounds`-returning helper that reads `getBoundingClientRect()` only when the cache is invalid. Register a `ResizeObserver` (or a `window` `resize` listener) on `nodes.windowsLayer` that nulls the cache. Replace the unconditional `getDesktopBounds(nodes.windowsLayer)` call in `updateDesktopWindows` (~`render.ts:1623`) with the cached read. Verify no window mis-clamps after a real resize.

**Step 2 — Close the last unhandled rejection.** In `src/main.ts:59-62`, append `.catch(() => {})` (or a logging handler) to the `platform.listBackups?.().then(...)` chain, matching the pattern already applied in `desktop.ts`.

**Step 3 — Remove the bus per-emit allocation (optional, low priority).** In `src/core/bus.ts`, replace `for (const listener of [...listeners])` with iteration over the Set guarded by an `emitting` flag; defer `add`/`remove` mutations that occur during an active emit, or snapshot lazily only when a mutation happens mid-dispatch. Keep the existing per-listener `try/catch`.

**Step 4 — Decide and document the two informational items.**
  4a. **Offline achievements (`offline.ts`)** — either (i) accept the current RAF-coalesced behavior and add a code comment documenting that achievements reconcile on the first post-offline tick with a single batched toast, or (ii) implement a silent `tickAchievements` (bus omitted) after `applyOfflineProgress` plus one aggregate "N achievements unlocked" toast. Pick one and make it explicit.
  4b. **`calculateOfflineMoney` `hype = 1` (`offline.ts:104`)** — confirm with design whether offline income should scale with the player's hype; if so, thread the (decayed) hype through; if intended, add a comment stating the neutral-hype assumption.

**Step 5 — Optional hardening.** Consider clearing (not just bounding) `incidents.history` on prestige if any future feature will read it per-run; otherwise leave the 50-cap as-is and add a brief comment that `history` is intentionally write-only/cross-run.

**Verification gate:** `npm run check` (tsc + ESLint + Prettier + Vitest + validate + Tauri `cargo test`) must be green, and `npm run sim -- --strategy sane --hours 100` should be re-run after Step 1 only if any render/economy-adjacent code is touched. The critical/high/medium fixes from Cycle 1 are confirmed correct and require no further action.
