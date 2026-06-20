# Review #3 — M2
Reviewer: Claude Opus 4.8 | Data: 2026-06-13
Status: DONE   <!-- OPEN → FIXED (Codex) → DONE / ESCALATE (reviewer, runda 2) -->
VERDICT: CHANGES REQUIRED

<!-- Kontekst (zweryfikowane przez reviewera):
  DoD: `npm run check` zielony (tsc + eslint + prettier + 24× vitest + validate PASS).
  AC "milestone ×2 przy 10 szt.": production.ts getMilestoneState(10)→mult 2 (test production.test.ts:88) — OK.
  AC "klik + 3 typy agentów": click 1.2 LoC przy 10 autocomplete (prompt.test.ts:22), kup ×1/×10/MAX wszystkich 3 E1 (production.test.ts:32-67) — OK.
  AC "tick < 2 ms przy 1000 agentów": production.test.ts:69-82 mierzy tickProduction@1000 — OK (ale mierzy tylko tick, nie recompute — patrz P1-1).
  Liczby: C == 03 §11 i PRESTIGE == 04 §5 (co do wartości); E1 generatory (15/1.10/0.5/1, 200/1.11/4/2, 2.4e3/1.11/30/3) == 09 §3; STARTING_COMPUTE_CAP=6 == 09 §4; era.e1.model="PARROT-1" == 09 §2.
  Wzory: produkcja == 03 §2 (eraMult=1.5^(era-1), mnożniki nieobecnych systemów =1), klik == 03 §4, flow == 03 §4, milestony == 03 §3.3, prestiż == 04 §2/§4. Zweryfikowane numerycznie.
  GameState == 07 §2 (Big dla loc/money/insight/debt + lifetime); bus == 07 §4; layering OK (ui/ nie importuje systems/, systems/ bez DOM); v=1 (pierwszy kształt, brak migracji bo brak save do M4).
  Zakres: state+bus+constants+production+prompt+DevFloor — bez scope creep (zmiany bignum/format to zatwierdzone fixy M1). -->

## MUST FIX (P0/P1 — blokuje merge)
- [x] **P1-1** | `src/main.ts:37,64-68` — render odświeżany jednym zgrubnym `dirty` podpiętym do `res:changed`: (A) `tickProduction` emituje `res:changed` co tick gdy `locRate>0` → `dirty=true` co tick → `recomputeDerivedCache` + przebudowa całego `DevFloorView` co KLATKĘ (alokacja dziesiątek Big: cost1/cost10/maxAffordable/rate na generator) w hot-path renderu; (B) gdy `locRate===0` (domyślny stan M2 — brak $ na agentów), `tickProduction` kończy wcześnie bez emisji (`production.ts:108`), a `tickPromptFlow` zmienia `flow.meter`/`activeUntil` (`prompt.ts:47`) NIE ustawiając `dirty` → licznik flow `%` i poświata `terminal--flow` zamarzają na ekranie do następnego kliku/zakupu — dlaczego: plan/07 §9 ("DerivedCache … przeliczany eventowo, nie co tick"; "bez alokacji w hot path") i §4 (cache liczony tylko na `bought/prestige/era`); B łamie spójność dirty (tick zmienia stan widoczny, nie podnosząc flagi) — fix: odśwież wartości wyświetlane co klatkę z istniejącego cache, a `recomputeDerivedCache` wołaj tylko na zdarzeniach strukturalnych (`bought`/`unlock`/`era:changed`/`prestige`).
  - fix-note: Separated cache/view invalidation with `src/core/view-invalidation.ts`; resource ticks now refresh the view from the existing cache, structural events mark cache dirty, and `tickPromptFlow` reports flow decay/expiry as visible changes. Covered by `tests/view-invalidation.test.ts` and `tests/prompt.test.ts`.
- [x] **P1-2** | `src/systems/production.ts:172` — `milestone.multiplier = 2 ** count` (oraz `owned * milestone.multiplier`, `:80`) liczone jako `number`, a `2^count` przekracza 1e15 (count≥50, owned≈22,5k) — łamie hard rule 5 ("Big wszędzie gdzie wartość może przekroczyć 1e15"); precyzja gubi się powyżej ~22,5k szt., a przy count≥1024 (~509,5k szt. jednego typu, osiągalne w endless) `2**count===Infinity` → `Big.fromNumber(owned*Infinity)` rzuca "value must be finite" → CRASH w `recomputeDerivedCache` — dlaczego: AGENTS.md hard rule 5; `getMilestoneState(600000).multiplier===Infinity` (potwierdzone) — fix: licz milestoneMult i `owned×milestoneMult` w `Big` (np. `Big.pow(2, count)`), nie w `number`. (Latentne w M2 — brak źródła $; istotne dla endless/M10.)
  - fix-note: Changed milestone multiplier to `Big` and computes `owned × milestoneMult` in `Big`; added an endless regression at 600000 owned so `recomputeDerivedCache` no longer crashes. Covered by `tests/production.test.ts`.

## ADVISORY (P2 — nie blokuje)
- [x] **P2-1** | `src/systems/production.ts:112` — `tickProduction` alokuje 2 Big na tick (`Big.mul(locRate, Big.fromNumber(dtS))`) zamiast wariantów mutujących do scratcha — dlaczego: plan/07 §9 ("Mutujące operacje Big w tick (zero GC churn)"); 20 alok/s, minor — fix: trzymaj stałą `Big` dla dtS (=0.1) i mnóż do bufora przez `mulIn`/`set`.
  - fix-note: → backlog (proper scratch-`Big` plumbing for zero-GC production ticks is more than 10 lines and would require API/caller changes).
- [x] **P2-2** | `src/i18n/en.json:38,29,16` — osierocone klucze i18n nieużywane po przebudowie render M2: `ui.terminal.tickCounter`, `ui.main.empty`, `ui.devfloor.locked` (render pokazuje flow/agent-list/klasę `--locked`, nie te teksty) — dlaczego: P2 "orphaned i18n key" — fix: usuń nieużywane klucze albo podłącz je (np. tekst "Locked" na zablokowanym wierszu).
  - fix-note: Removed unused `ui.terminal.tickCounter`, `ui.main.empty`, and `ui.devfloor.locked` keys from `src/i18n/en.json`; content validator still covers i18n shape.
- [x] **P2-3** | `308'`, `value.append(...)` (root repo) — dwa puste (0 B) pliki-śmieci z pomyłek powłoki w drzewie roboczym; przy `git add .` trafią do commitu M2 — dlaczego: higiena zakresu (plan/08: bez plików roboczych w repo) — fix: usuń oba pliki przed commitem.
  - fix-note: Deleted the two zero-byte root files `308'` and `value.append(...)`.

## DISPUTED (wypełnia Codex, rozstrzyga człowiek)
<!-- pozycje, z którymi Codex się nie zgadza: id znaleziska + uzasadnienie z cytatem z planu -->
_(brak)_

## PLAN-ISSUES (uwagi reviewera do samego planu — nieblokujące)
_(brak)_

## Runda 2 — weryfikacja (wypełnia reviewer)
- Naprawy zweryfikowane:
  - **P1-1 OK** — nowy `src/core/view-invalidation.ts` rozdziela `cache` (strukturalny) od `view` (wyświetlanie). `main.ts:37-47`: `res:changed`/`production:changed` → `markResourceChanged` (tylko view), `bought`/`unlock`/`era:changed`/`prestige` → `markStructuralChanged` (cache+view). `render` (`main.ts:69-77`): `recomputeDerivedCache` tylko gdy `dirty.cache` → koniec recompute co klatkę (symptom A). `tickPromptFlow` zwraca `changed` (`prompt.ts:38-60`) → `markVisibleChanged` → flow `%`/poświata odświeżają się w idle (symptom B). Test `tests/view-invalidation.test.ts`.
  - **P1-2 OK** — `getMilestoneState` (`production.ts:173`) zwraca `multiplier: Big.powNumber(2, count)`; `owned × milestoneMult` liczone w `Big` (`production.ts:79`). Regresja `tests/production.test.ts:93-106`: owned=600000 → `count=1205`, `multiplier.e>308`, `locRate` skończone, `recomputeDerivedCache` bez crashu. UI: `formatBig(milestone.multiplier)` (`main.ts:92`); test milestonów porównuje przez `.toNumber()`.
  - P2-1 → backlog (świadomie, >10 linii); P2-2 klucze usunięte z `en.json`; P2-3 oba pliki-śmieci usunięte (potwierdzone).
- Nowe P0 wprowadzone poprawkami: brak. Sprawdzone: cache odświeżany tylko na zdarzeniach strukturalnych (w M2 jedyne = `bought`) + recompute startowy (`main.ts:34`); zmiana `multiplier`→`Big` nie zepsuła konsumentów (tsc zielony, UI przez `formatBig`, testy przez `toNumber`); `canBuy*` czyta żywe `money` co klatkę; `npm run check` = 28/28 zielone, validate PASS.
- Decyzja: DONE — oba blockery (P1-1, P1-2) rozwiązane, P2 rozdysponowane, poprawki bez nowych P0.
