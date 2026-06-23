# VIBECODER — Full-Stack Deep-Dive Code Review

**Scope:** Entire codebase (~30k LOC TypeScript + a Tauri/Rust desktop shell) — core engine & game systems, the save/persistence layer, the Rust IPC commands, and the DOM render/UI layer.
**Method:** 14 subsystem finders + adversarial per-finding verification (every finding re-checked against the actual source by an independent pass). Only code-verified findings are listed. Fixes incorporate the verifier's corrections where a naive fix was unsound.

> **Architectural reality check (read first).** VIBECODER is a **single-player, offline, local-first application**. There is **no game server, no database, no REST/GraphQL API, no authentication, and no multiplayer synchronization.** "Backend" here therefore maps to its real analogs: the deterministic **core engine + `systems/` game logic** (state management), the **save/persistence layer** (`core/save.ts` + platform storage — the app's "database"), and the **Rust Tauri commands** in `src-tauri/` (the only privileged / "server-side" surface and the file-I/O boundary). The attack surface is local file integrity and untrusted-save parsing, **not** network/auth. This review reflects what actually exists rather than forcing a client/server model onto a local app.

## Executive Summary

The architecture is sound: clean `core` / `data` / `systems` / `app` / `ui` / `platform` separation, a deterministic fixed-timestep loop, disciplined save-repair + migration scaffolding, and broad test coverage. Defects concentrate in two areas: **core state-reset integrity** (the prestige logic) and the **frontend render layer** (panels that rebuild instead of patch). One defect is genuinely run-ending.

| Severity | Count | Headline |
|----------|-------|----------|
| **Critical** | 1 | Prestige + Aurora dedicated server → instant, permanent, unrecoverable bank default |
| **High** | 2 | Maxed-product re-ship exploit (infinite revenue); 2s offline threshold conflation |
| **Medium** | 7 | Wllama memory leak + re-download storm; fractional-autosave write storm; stale time-multiplier cache; rewrite inherits incidents; roadmap full-rebuild/frame; war-chest negates rewrite; bank never reset |
| **Low** | ~39 | Save-repair gaps, prestige-reset leaks, unbounded collections, render hot-path waste, formatter bugs, dead code |

**Root-cause themes:** (1) the three prestige reset paths (`performRewrite`/`performExit`/`performIteration`) are maintained independently and have drifted on *which* state they clear — that is the critical bug and ~6 others; (2) several frontend panels never adopted the codebase's own create-once + patch convention; (3) the save-repair boundary trusts numeric ranges and object shapes it should bound more tightly; (4) the persistence layer mutates live state and fires redundant un-coalesced writes.

---

## 1. Backend & Core Game Logic

*(Core engine, deterministic `systems/` state machines, save layer = the "database", Rust IPC = the privileged surface. No server/DB/API/multiplayer exists — those dimensions are N/A and intentionally omitted.)*

### 1.1 State management — prestige reset integrity (the dominant defect cluster)
The three reset functions have drifted on what they clear. **Consolidate the shared reset logic inside `applyPrestigeResetSpec` so all layers stay in lock-step.**

- **[CRITICAL] Prestige keeps Aurora power bills while zeroing income → instant permanent bank default.** `src/systems/prestige.ts:545-606`. `performExit`/`performIteration`/`performRewrite` zero `res.money` and wipe all income sources but **never touch `state.aurora`**, so `aurora.dedicatedServers` and `aurora.completed=false` survive. Next tick, `tickBilling` charges the ~260,000/s dedicated-server bill (`data/billing.ts:31`) against $0, routes it to `accrueBankOverdraft`, and the bank defaults at $10k (`bank.ts:58-62`) — freezing the save permanently (`defaulted` is never set back to false anywhere). `tickAutoRewrite` (`automation.ts:338-362`) can even trigger this unattended. **Fix:** extend the existing hardware-power *pause grace* (`billing.ts:57-59,69-71`) to Aurora power/hosting so an unaffordable Aurora bill pauses instead of accruing overdraft. Do **not** use `state.aurora.billingPaused = true` — `tickBilling` overwrites it every tick (`billing.ts:80`) and it only gates Aurora phase progress.
- **[MEDIUM] `bank` state never reset by any prestige layer.** `prestige.ts:475-498,569`. All layers zero `res.debt` but leave `state.bank` (overdraft / `warningsIssued` / `defaulted`). Carried overdraft is seized from the next run's first earnings, and this is the enabler behind the critical above. **Fix:** `state.bank = createDefaultBankState()` (from `core/state`) inside `applyPrestigeResetSpec`.
- **[MEDIUM] Active incidents & sprint not cleared on rewrite.** `prestige.ts:466-518`. `performExit`/`performIteration` reset `state.incidents`; `performRewrite` does not, so a pre-rewrite incident's timeout dumps a debt penalty onto the just-zeroed run. **Fix:** `state.incidents.active = []` in `performRewrite` (preserve `history`).
- **[MEDIUM] `i_c4` × `q_war_chest` refunds ≥100% of money on rewrite.** `prestige.ts:896-911`. `getRewriteStartMoney` multiplies the entire (flat + fraction-of-current-money) sum by the equity multiplier, so 0.01 × ×100 = 1.0 of current money returned, negating the reset. **Fix:** apply the multiplier only to the flat term — `flat * multiplier + ratioMoney` (or clamp `fraction * multiplier < 1`).
- **[LOW] Build momentum survives every prestige.** `prestige.ts:1053-1067`. `buildMomentum.value`/`.decayAccumS` are in no reset key list; `performRewrite` even increments momentum mid-reset. **Fix:** add both keys to `RUN_STAT_RESET_KEYS`.
- **[LOW] Iteration hold-gate satisfiable with stale hold right after a rewrite.** `prestige.ts:681-695`. `RESET_LAYER_STAT_KEYS.rewrite = []`, so a rewrite never clears `ITERATION_HOLD_STAT`; `canIterate` checks only banked `holdS`, not current `locRate`. **Fix:** add `ITERATION_HOLD_STAT` to `RESET_LAYER_STAT_KEYS.rewrite`.

### 1.2 Core simulation — derived-cache & timing correctness
- **[MEDIUM] Time-based multipliers baked into the derived cache have no expiry-driven invalidation.** `src/systems/production.ts:591-610,998-1001`. The angel-network ×10 (active while `playtimeS < angelNetworkUntil`) and the pending-incident penalty are folded into the cached payout/revenue multipliers, but the cache only refreshes on structural bus events — none tied to the 1-hour angel expiry. While production is idle, the ×10 lingers, and offline catch-up applies it to the whole offline span. **Fix:** compute the angel factor live per tick (or mark the cache dirty when crossing `angelNetworkUntil`). The offline path must **segment the window at the `angelNetworkUntil` boundary** — recomputing the cache before the offline call does *not* help, because `playtimeS` is still pre-offline at that point.
- **[HIGH] 2s offline threshold doubles as the loop's accumulator clamp.** `src/core/loop.ts:67-77`. `OFFLINE_CATCH_UP_MS (2000ms)` is both the spiral-of-death clamp and the online/offline decision threshold. Backgrounded tabs pause `requestAnimationFrame`, so any >2s alt-tab/GC/sleep produces one large RAF delta treated as an "offline session" → hype halved (`offline.ts:52-54`) + the welcome-back modal, during normal play. **Fix:** keep `OFFLINE_CATCH_UP_MS` as the clamp; add a separate larger `OFFLINE_THRESHOLD_MS` (~30–60s) for the catch-up branch and `applyOfflineOnReturn`'s guard.
- **[LOW] Offline hype decay is a flat one-time halving.** `offline.ts:52-54`. Independent of elapsed time and gated on `elapsedS` not `cappedS`, so the "blackout" modifier (cappedS=0) halves hype with zero production. **Fix:** time-based decay gated on `cappedS`; update `tests/offline.test.ts`.
- **[LOW] Offline credit anchors on `Date.now()` while catch-up triggers on monotonic RAF time.** `offline.ts:26-31`. Hide-tab → advance system clock → show-tab repeatedly credits the offline cap. Single-player, deliberate tampering only. **Fix:** clamp `cappedS` against a monotonic counter for the in-session case.

### 1.3 Persistence layer — the "database" (save serialization, repair, migrations, Rust file I/O)
This is the closest thing to a backend datastore; treat untrusted/corrupt saves as a hostile input boundary.

- **[MEDIUM] Fractional `autosaveS` survives load repair → sub-second autosave write storm.** `src/core/save.ts:484-490`. Repaired with `{ positive: true }`, so `0.001` passes → `setInterval(persistNow, 1ms)` → continuous full serialization + synced file writes (effective local DoS from any imported/edited save). **Fix:** clamp at the schedule site `Math.max(1, autosaveS) * 1000`, plus `{ integer: true }` + minimum at the load boundary and in the settings UI handler.
- **[LOW] `era = 0` survives repair → permanent unrecoverable soft-lock.** `save.ts:394`. `{ integer, nonNegative }` accepts 0; era 0 locks every generator and cannot be advanced. **Fix:** `{ integer: true, positive: true }`.
- **[LOW] `loadGameState` skips backup recovery when `platform.load()` throws.** `save.ts:111-121`. Unlike the null/corrupt branches, a *thrown* (transient lock) error drops the player into a fresh game despite valid backups. **Fix:** call `loadMostRecentBackup` in the catch first.
- **[LOW] `repairStats` silently coerces corrupt values to `Big.zero()`.** `save.ts:1489-1500`. `Big.from(true)`/`Big.from([])` don't throw → a counter becomes a zeroed `Big` with no repair flag, read as 0 forever. **Fix:** validate the `{m,e}` shape before `Big.from`, else `mark()`. **Not** a string-only branch — that would drop legitimate serialized Bigs.
- **[LOW] `repairNumberRecord` retains arbitrary unknown ids.** `save.ts:1216-1238`. `owned.generators`/`owned.hardware` accept any key, so garbage ids persist and mask corruption. **Fix:** validate keys against `GENERATORS`/`HARDWARE` id sets (+ `LEGACY_HARDWARE_ID`); skip+`mark` unknowns.
- **[LOW] `saveGameState` advances live `state.meta.lastSeen` before the write.** `save.ts:169-176`. A failed save leaves the in-memory timestamp moved with nothing persisted. **Fix:** restore the old `lastSeen` in the catch.
- **[LOW] Rust `save_game` deletes the live save before rename.** `src-tauri/src/lib.rs:35-39`. `fs::rename` already atomically replaces on Windows/Unix; the manual `remove_file` opens a window with no primary save (kill/AV-lock → rollback to backup). **Fix:** delete the `remove_file` block; rely on `fs::rename`.
- **[LOW] Rust `export_file` reserved-name guard is case-sensitive.** `lib.rs:284-290`. On case-insensitive FS, `VIBECODER_SAVE.JSON` passes the reserved check and truncates the real save. **Fix:** lowercase both sides of the check, or write exports to a dedicated subdirectory.
- **[LOW] `persistNow` has no single-flight guard.** `src/app/persistence.ts:25-33`. exit/iterate/rewrite each fire two un-awaited saves. The out-of-order *corruption* risk is **not** real (Rust `save_game` is serialized on the main thread), but the wasted serializations are. **Fix:** drop the redundant pre-prestige `persistNow()` calls; optionally add a single-flight FIFO chain.

### 1.4 Memory management — unbounded collections & native leaks
- **[MEDIUM] Wllama instance leaked on every failed model load + per-prompt re-download storm.** `src/platform/ai.full.ts:148-184`. A failed load leaves the instance assigned and never `exit()`-ed; the next attempt orphans it (worker + WASM). `status='error'` (not `'unavailable'`) makes the Vibex path re-download the ~100 MB model on every subsequent prompt. **Fix:** `exit()` any existing instance before reassigning and in `downloadModel`'s catch; add backoff so `'error'` doesn't auto-retry a full fetch per prompt.
- **[LOW] Story inbox & read-flags grow unbounded from recurring snoozed decision events.** `src/systems/story.ts:202-233`. After the snooze window, re-ready events push a *new* `InboxEntry` + a new `story.read.<id>` flag every cycle without trimming; `comms.getView` then scans the inbox O(n) per message (O(n²) rebuild). Serialized in full each autosave. **Fix:** reuse/replace the existing inbox entry for a recurring event instead of pushing a new one; precompute a latest-index-by-eventId map in one pass.
- **[LOW] `incidents.history` grows without bound and is preserved across every prestige.** `src/systems/incidents.ts:277-284`. `completeIncident` pushes one entry per resolution with no cap; exit/iteration deliberately carry `history` over; nothing ever reads it. **Fix:** bound it (keep recent ~50) or clear on prestige — since nothing reads it, dropping it entirely is safe.

### 1.5 Engine robustness — error isolation
- **[LOW] Event bus `emit` has no per-listener exception isolation → a throwing subscriber can permanently halt the loop.** `src/core/bus.ts:50-60`. A throw in a listener (run from inside the tick) unwinds through `emit` → `tick()` → `loop.ts frame()`, and because `requestFrame(frame)` runs *after* `step()` (`loop.ts:135-137`), the RAF chain is never rescheduled — permanent freeze. Current handlers are defensive (uncertain trigger), hence low. **Fix:** `try/catch` per listener in `emit`; additionally guard `loop.ts frame()` to log and still reschedule — but pair with error reporting and consider blocking autosave on a corrupt tick (don't silently persist partially-mutated state).
- **[LOW] Layering validator misses dynamic `import()`.** `src/dev/validate.ts:139-159`. Only the systems→platform rule matches `import(…)`; the other boundaries match only static `from "…"`, so a dynamic import bypasses the architectural guarantee. **Fix:** one shared matcher covering `from "…"`, `import("…")`, and bare `import "…"` for all rules.

### 1.6 Rust IPC surface (the only privileged / "server-side" code)
No network or auth exists, so there is no remote attack surface. The real risks are local file safety and dropped errors:
- **Data-safety:** `save_game` remove-before-rename (§1.3) and `export_file` case-folding (§1.3) are the two genuine local-corruption risks — fix both.
- **[LOW] Fire-and-forget Tauri invokes drop promise rejections.** `src/platform/desktop.ts:51-60`. `openExternal`/`setTitle`/`listBackups` reject without `.catch` → unhandled rejections. (`open_external` *does* correctly allowlist `http(s)` URLs — `lib.rs:103-134` — so there is no URL-injection hole.) **Fix:** attach `.catch(() => {})`/logging. Optional hardening.

---

## 2. UI & Frontend Layer

The DOM render layer is the true "frontend." The dominant issue is **per-frame work that should be change-gated or patched**, plus a few **UI/business-logic separation** leaks where the render layer recomputes economy values inconsistently with the systems layer.

### 2.1 Rendering performance — unnecessary redraws (the codebase's own create-once + patch pattern isn't applied uniformly)
- **[MEDIUM] `updateRoadmap` tears down and rebuilds the entire roadmap subtree every frame.** `src/ui/render/roadmap.ts:11-22`. While the window is open, `root.replaceChildren(...)` destroys/recreates every sprint/run-style/incident/activity card and **re-binds every click listener** each render — heavy GC churn, full-subtree reflow, and reset of transient focus/scroll. This is the only update path doing a full rebuild. **Fix:** adopt the keyed-Map + create-once-listener pattern used by `syncGeneratorRows`/`syncHardwareRows`; minimally, compute a view signature and early-return when unchanged. Add `resetRoadmapRenderCache` to `resetRenderCaches`.
- **[LOW] `updateBootScene` runs a ~12-query `querySelectorAll` storm every frame for the whole session.** `src/ui/render.ts:602-623`. Never early-returns when the boot scene is hidden, so it scans the invisible boot-settings subtree continuously. **Fix:** `if (view.ui.scene !== "boot") return;` right after setting `nodes.root.hidden`.
- **[LOW] `updateDesktopWindows` forces a layout read + rewrites all window frames every frame with no change detection.** `render.ts:1604-1624`. Unconditional `getBoundingClientRect` (forced reflow) + throwaway `WindowState`/`WindowFrame` allocations + four inline-style rewrites per visible window. **Fix:** cache last-applied `{x,y,w,h,z}` per `WindowNodes` and skip when unchanged; cache desktop bounds, refresh on resize.
- **[LOW] Window titles recomputed via `t()` for all ~15 windows every frame.** `render.ts:1613`. `setText` guards the DOM write, but `t()` builds a fresh RegExp + scans per call. **Fix:** hoist the `/\{…\}/g` regex to a module constant + short-circuit templates without `{`; optionally cache per `(lang, model)`.
- **[LOW] Top-bar resources block recomputes the full economy + both hover tooltips every frame.** `src/app/view-models.ts:292-305`. Built with no `build*` gate; runs `getProjectIncomeRate` ≥2×/frame, `createBillingBreakdown` ~3×/frame, and interpolates two hover-only tooltip strings. **Fix:** compute gross income + billing once per frame and thread through; build tooltips lazily on hover.
- **[LOW] `createRewritePreview` computes `getRewriteMilestoneProgress` twice per frame.** `prestige.ts:427-429`. **Fix:** compute once into a local, reuse `.next`/`.progress`.
- **[LOW] Model-download progress fires a full view rebuild per stream chunk.** `src/platform/ai.full.ts:214-228`. A ~135 MB download → ~2000+ `updateVisibleView` rebuilds → severe jank. **Fix:** throttle `onChange` to integer-percent changes (emit a final 100%).
- **[LOW] `emit` allocates a fresh snapshot array on every emit.** `src/core/bus.ts:57-59`. `[...listeners]` on the hot `res:changed`/`production:changed` paths despite listeners being registered once. **Fix:** iterate the Set behind an emitting-flag reentrancy guard; snapshot lazily only on mutation. (Optional polish.)

### 2.2 Component lifecycle & UI/business-logic separation
- **[LOW] Exit section never hidden in the rewrite screen → leaks locked end-game UI.** `src/ui/render/rewrite.ts:302-358`. `createExitSection` has no `section.hidden` guard (unlike `createParadoxSection`), so the end-game perk shop / run-modifier spoilers render from act 1. **Fix:** add `unlocked` to `ExitView`, set `section.hidden = !view.unlocked`, **and** add CSS `.exit-section[hidden] { display: none }` — the `display:grid` rule overrides the UA `[hidden]` rule, so the JS toggle alone won't hide it (the paradox section has the same latent CSS gap).
- **[LOW] Board offer revenue preview omits prestige + hype multipliers (display-vs-systems divergence).** `src/app/view-models.ts:1486`. `getProjectRevenue` multiplies only by `revenueMultiplier`; realized income additionally applies `prestigeBig` and hype, so the preview understates income by orders of magnitude. **Fix:** route the preview through `getPortfolioIncomeMultiplier` (or a shared helper) so the board matches the portfolio/tick display.
- **[LOW] Derived cache stores unsoftcapped per-generator rates but a softcapped total.** `src/systems/production.ts:369-395`. Under iteration softcap, displayed per-generator rates sum above the displayed total. **Fix:** scale `entry.rate` by `cache.locRate / preCapTotal` for display.
- **[LOW] `resetSettings` desyncs language.** `src/app/actions.ts:668-677`. Overwrites `settings` with defaults (`lang:"en"`) without `await loadLocale`, without updating `document.documentElement.lang`, and without remounting — a Polish player keeps seeing Polish while settings report English. **Fix:** route a language change through `runtime.changeLanguage(defaults.lang)`, or preserve the current lang across the reset.

### 2.3 Event handling & async UI state
- **[LOW] In-flight Vibex AI generation writes into a reset session after import/wipe.** `src/app/actions.ts:541-550`. `installState` resets the Vibex session but doesn't bump the closure-scoped `vibexResponseToken`, so a stale generation injects a pre-import response into the fresh game. **Fix:** expose a runtime hook from `installState`/`resetVibexTransientState` that bumps the token (it lives in the `actions.ts` closure; it can't be incremented directly from `main.ts`).
- **[LOW] Offline progress never evaluates achievements → one-tick unlock/toast/audio flood.** `src/systems/offline.ts:21-80`. A long offline session that crosses several thresholds unlocks them all on the first resumed tick → overlapping toasts + repeated sounds. **Fix:** coalesce unlock events within a frame in the `main.ts` handler (one aggregated toast + one sound).

### 2.4 Input validation (frontend boundary)
- **Autosave field** (`src/ui/render/settings.ts:56`) checks only `> 0` with no integer/min — the load-side mirror of §1.3's storm. **Fix:** enforce round + min=1 in the change handler (and clamp at the schedule site as the authoritative guard).
- Numeric settings inputs lack `min`/`step` attributes; the boot row rounds but the settings row does not — align both.

---

## 3. Critical Fixes

The non-negotiable, fix-first set — game-breaking bugs, crashes, and local data-corruption risks. (No network/auth security vulnerabilities exist; "security" here is local file integrity + untrusted-save parsing.)

1. **[CRITICAL] Aurora + prestige → permanent unrecoverable default** — §1.1. Bricks the most-invested save via a supported (and auto-rewrite-triggerable) action. **Fix first.**
2. **[HIGH] Maxed-product re-ship exploit** — §1.2 below. Infinite recurring revenue + repeated lump payouts + unbounded `portfolio` growth.
   - `src/systems/projects.ts:203-209,362,481-495`: once a product hits `PROJECT_MAX_LEVEL`, `getProjectLevel` returns 0, defeating every "maxed" guard; re-shipping spawns a new level-1 line and re-grants the first-ship payout. **Fix:** add `getOwnedProductLevel(state, projectId)` (max level across *all* products, ignoring the `<MAX` filter); use it in `getProjectLevel`, `getProjectNextLevel`, `createActiveBuild.isFirstShip`, `view-models.atMaxLevel`; short-circuit `startProject` with the existing `"maxLevel"` reason for the auto-ship path.
3. **[HIGH] 2s offline-threshold conflation** — §1.2. Degrades normal play (hype halving + modal on every brief alt-tab).
4. **Local data-corruption risks (batch):** `era=0` soft-lock, missed backup recovery on load-throw, Rust `save_game` remove-before-rename, `export_file` case-folding, `repairStats` silent coercion — all in §1.3. Each can lose or brick a save.
5. **[MEDIUM] Wllama leak + re-download storm** — §1.4. Memory growth + per-prompt ~100 MB fetch after any model-load failure.
6. **[MEDIUM] Fractional-autosave write storm** — §1.3. Local DoS from an imported/edited save.
7. **Crash-containment:** event-bus/loop freeze — §1.5. Any throwing subscriber can permanently halt the game.

---

## 4. Step-by-Step Implementation Guide for the Executor AI

Sequential, dependency-ordered. Run `npm run check` (tsc, ESLint, Prettier, Vitest, validate, Tauri `cargo test`) after each phase. Any change to save shape requires a `SAVE_VERSION` bump + migration + fixture per the repo's high-risk-area contract.

**Phase 0 — Stop the run-ending bug.**
1. `src/systems/billing.ts`: extend the hardware-power pause grace (lines 57-59, 69-71) to `getAuroraDedicatedPowerRate`/`getAuroraHostingRate` so an unaffordable Aurora bill pauses instead of accruing overdraft. Add a test: dedicate a server → prestige → tick once → assert `!state.bank.defaulted`.
2. `src/systems/prestige.ts` → `applyPrestigeResetSpec`: add `state.bank = createDefaultBankState();` (import from `core/state`) so all three layers reset the bank.

**Phase 1 — Economy integrity.**
3. `src/systems/projects.ts`: add `getOwnedProductLevel`; repoint `getProjectLevel`/`getProjectNextLevel`/`createActiveBuild.isFirstShip` and `src/app/view-models.ts:1484` `atMaxLevel`; add the `maxLevel` short-circuit in `startProject`. Test the re-ship block.
4. `src/systems/prestige.ts` (one pass, same three functions): clear `state.incidents.active` in `performRewrite`; fix `getRewriteStartMoney` to multiply only the flat term; add momentum keys to `RUN_STAT_RESET_KEYS`; add `ITERATION_HOLD_STAT` to `RESET_LAYER_STAT_KEYS.rewrite`. Add a "what survives a reset" fixture assertion.
5. `src/systems/production.ts` + `src/systems/offline.ts`: make the angel-network multiplier live (or invalidate on `angelNetworkUntil` crossing) and segment the offline window at that boundary. Verify with `npm run sim -- --strategy sane --hours 100` and `--strategy maxer`.

**Phase 2 — Core loop / timing.**
6. `src/core/loop.ts` + `src/main.ts`: introduce `OFFLINE_THRESHOLD_MS` (~30–60s); use it for the catch-up branch and `applyOfflineOnReturn`'s guard; keep `OFFLINE_CATCH_UP_MS` as the clamp.
7. `src/systems/offline.ts`: time-based hype decay gated on `cappedS`; monotonic clamp for the clock-jump windfall. Update `tests/offline.test.ts`.

**Phase 3 — Persistence / "database" hardening (one commit per file group).**
8. `src/core/save.ts`: clamp `autosaveS` (`{integer,positive}` + min); `era` repair `{integer, positive}`; backup recovery in the load-throw catch; `{m,e}`-shape validation in `repairStats`; id-allowlist in `repairNumberRecord`; restore `lastSeen` on save failure.
9. `src/app/persistence.ts`: add single-flight + drop redundant pre-prestige `persistNow()`. `src/ui/render/settings.ts`: round + min=1 on the autosave input.
10. `src-tauri/src/lib.rs`: remove the remove-before-rename block; case-fold the `export_file` reserved-name check; add an `on_window_event` `CloseRequested` handler that signals the frontend to persist and awaits before close.

**Phase 4 — Robustness & leaks.**
11. `src/platform/ai.full.ts`: `exit()` stale Wllama instances + add error-state backoff; throttle download progress to integer percent. `src/core/bus.ts`: per-listener `try/catch`; `src/core/loop.ts`: guard `frame()` to log-and-reschedule. `src/systems/story.ts` + `src/systems/incidents.ts`: bound the inbox/history growth.
12. `src/app/actions.ts`: bump the Vibex token on state swap; route `resetSettings` language through `changeLanguage`. `src/dev/validate.ts`: shared boundary matcher covering dynamic `import()`. `src/platform/desktop.ts`: `.catch` the fire-and-forget invokes.

**Phase 5 — Frontend rendering (highest-visible-impact first).**
13. `src/ui/render/roadmap.ts`: convert to create-once + keyed-patch (or signature early-return); register `resetRoadmapRenderCache`.
14. `src/ui/render.ts`: boot-scene early-return; window-frame change detection + cached bounds; title regex hoist. `src/app/view-models.ts`: compute income/billing once per frame, lazy tooltips, single milestone call.

**Phase 6 — Cleanup (low risk, last).**
15. UI/logic separation & display: board-preview multipliers, per-generator softcap display, exit-section visibility + CSS, achievement-toast coalescing. Formatters: short-suffix carry + sub-1 fraction in `src/core/format.ts` (update `tests/format.test.ts`). Dead code: `generatorCostMultiplier`, `p_open_source`, dedicated project-cost constants. Incident-timeout debt ordering in `src/systems/incidents.ts`.

**Verification gates:** after Phases 0–1 run both balance sims; after Phase 3 run the full `npm run check` including `cargo test`; never claim release readiness without `npm run check` green.
