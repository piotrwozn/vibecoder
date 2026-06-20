# Review #5 — M4
Reviewer: Claude Opus 4.8 | Data: 2026-06-13
Status: DONE   <!-- OPEN → FIXED (Codex) → DONE / ESCALATE (reviewer, runda 2) -->
VERDICT: CHANGES REQUIRED

<!-- Kontekst (zweryfikowane przez reviewera):
  DoD: `npm run check` zielony (tsc + eslint + prettier + 41× vitest + validate PASS).
  AC reload=identyczny: save.test.ts:21-49 round-trip (Big→string via toJSON, Set→array, settings, lastSeen) repaired=false.
  AC 1h offline=wzór: offline.test.ts (loc=2×3600, money=income(hype=1)=5×3600 NIE 5×4×3600, hype→max(1,4×0.5)=2, playtimeS/lastSeen) == 03 §7. getProjectIncomeRate(state, hype=1) override potwierdzony.
  AC zepsuty JSON→naprawa: save.test.ts:51-64 ("{broken" → default + repaired=true, brak crashu).
  SAVE_VERSION=1, migracje indeksowane poprawnie (v0→v1, v1 = 0 migracji repaired=false, future-version clamp), fixture v1.json wczytuje się repaired=false (10 §4). base64 export/import + adopcja edition demo→full (§7). Klucz "vibecoder_save" (§7). Autosave 10 s + visibilitychange/beforeunload (§7). loop.ts catchUp: >2000 ms → ścieżka offline, render(0), 0 ticków (07 §3). web.ts w platform/ (localStorage OK). Big dla loc/money/debt/insight. Bez scope creep. -->

## MUST FIX (P0/P1 — blokuje merge)
- [x] **P1-1** | `src/ui/render.ts:277` — `updateDevFloor` woła `updateSettings` przy KAŻDEJ aktualizacji widoku, a `updateSettings` (`:836-839`) bezwarunkowo ustawia `autosaveS.value`/`notation.value`/`sound.checked` bez sprawdzenia fokusu; przy aktywnej produkcji `res:changed` ustawia `dirty.view` co tick → widok odświeża się co klatkę → pole liczbowe „autosave” jest resetowane do zatwierdzonej wartości ~60×/s, kasując wpisywaną cyfrę → po kupnie agentów NIE da się zmienić interwału autosave (event `change` na blur czyta nadpisaną wartość) — dlaczego: AC M4 „Ekran Settings (… autosave …)” wymaga działającej kontrolki; w stanie z produkcją (normalna gra) kontrolka jest niefunkcjonalna — fix: w `updateSettings` pomijaj zapis do pola, które ma fokus (`document.activeElement`), albo zapisuj tylko gdy wartość faktycznie się zmieniła i pole nie jest edytowane.
  - fix-note: `updateSettings` now skips the focused Settings control and uses `updateEditableSettingValue` for autosave; covered by `tests/render.test.ts`.

## ADVISORY (P2 — nie blokuje)
- [x] **P2-1** | `src/core/save.ts:477` — `repairBig` (i analogicznie `repairStats` `:762`) zakłada, że `Big.from` rzuci na złe dane, ale `Big.from({})`/`Big.from([])`/`{x:1}` trafia w gałąź `new Big(value.m, value.e)` (`bignum.ts:44`) z `m/e===undefined`, a konstruktor (`bignum.ts:17`) domyśla je do `0,0` → pole Big o kształcie obiektu/tablicy jest po cichu zerowane, BEZ `mark()` (zostaje `repaired=false`, brak ostrzeżenia) — dlaczego: plan/07 §7 „Save … najwyżej naprawiany z defaultami + log”; naprawa powinna być zaraportowana (nie cicha) — uwaga: save gry zawsze serializuje Big jako string, więc dotyczy tylko sav-ów zepsutych/obcych (brak utraty PRAWIDŁOWYCH danych) — fix: waliduj typ wejścia (string/number) przed `Big.from`, w innym wypadku `mark()` + fallback.
  - fix-note: → backlog (root-cause fix must cover both `repairBig` and `repairStats` shared Big-input validation; more than 10 lines).

## DISPUTED (wypełnia Codex, rozstrzyga człowiek)
<!-- pozycje, z którymi Codex się nie zgadza: id znaleziska + uzasadnienie z cytatem z planu -->
_(brak)_

## PLAN-ISSUES (uwagi reviewera do samego planu — nieblokujące)
- AC M4 „reload = identyczny stan” jest nieosiągalne BIT-w-bit dla wartości `Big` przy formacie serializacji z `07 §6`: `toString` używa `toPrecision(15)` (`bignum.ts:528`), więc mantysa wymagająca 16–17 cyfr znaczących (typowe po mnożeniach/dzieleniach $/LoC) nie round-trip'uje dokładnie (dryf ~1e-15, w granicach `NUMERIC_TOLERANCE_E=-12` silnika). To wybór formatu z §6, nie defekt M4 — sugestia: doprecyzować AC na „identyczny w granicach precyzji serializacji Big” albo użyć `toPrecision(17)` w `toString`.

## Runda 2 — weryfikacja (wypełnia reviewer)
- Naprawy zweryfikowane:
  - **P1-1 OK** — `updateSettings` (`render.ts:831-849`) czyta `document.activeElement` i pomija zapis do skupionej kontrolki (notation/sound przez gard `activeElement !== node`, autosave przez `updateEditableSettingValue`); `updateEditableSettingValue` (`:870-886`) zwraca wcześnie gdy `focused` i dirty-checkuje `value`/`defaultValue` w przeciwnym razie. Pole „autosave” nie jest już kasowane podczas edycji. Test `tests/render.test.ts:29-47` (focused → wartość „1” zachowana; idle → aktualizacja do „15”).
  - P2-1 → backlog (świadomie, P2, wspólna walidacja wejścia Big w `repairBig`/`repairStats` >10 linii).
- Nowe P0 wprowadzone poprawkami: brak. `document.activeElement` to tani odczyt (bez alokacji/trawersu) w ścieżce renderu; logika focus-skip poprawna; `updateEditableSettingValue` dirty-checkuje przed zapisem; `npm run check` zielony, validate PASS.
- Decyzja: DONE — jedyny blocker (P1-1) rozwiązany, P2-1 → backlog, poprawka bez nowych P0.
