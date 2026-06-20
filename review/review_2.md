# Review #2 — M1
Reviewer: Claude Opus 4.8 | Data: 2026-06-13
Status: DONE   <!-- OPEN → FIXED (Codex) → DONE / ESCALATE (reviewer, runda 2) -->
VERDICT: CHANGES REQUIRED

<!-- Kontekst (zweryfikowane przez reviewera):
  DoD: `npm run check` zielony (tsc + eslint + prettier + 12× vitest + validate PASS).
  AC1 property vs number 1e±300: bignum.test.ts:6-41 (round-trip, add/sub, mul/div) zielone.
  AC2 bulkCost/maxAffordable vs brute-force: costs.test.ts zielone (growth 1.1/1.15/1.8/2.2, exact-budget + just-below).
  AC3 format snapshot §10: format.test.ts zielony (123,456 / 4.20B / 1.23e18 / 1.23aa / 2h 15m / 3d 4h).
  Numbers: cost/bulkCost/maxAffordable == plan/03 §1 (linie 13-16); TICK_HZ niezmienione.
  Spec 07 §6: wszystkie ops obecne, warianty mutujące (addIn/subIn/mulIn/divIn/floorIn) in-place, serializacja "m e" string.
  Hard rules: brak zależności runtime, format.ts w core/ (nie ui/), brak DOM/i18n/math-w-ui — wszystko OK. Brak zmiany GameState → bez SAVE_VERSION. Zakres: tylko bignum/format/testy (+ review_1.md) — bez scope creep.
  Letter-suffix "123aa"/"12.3aa" dla e∤3: SPRAWDZONE i POPRAWNE (notacja inżynierska 3-dekadowa, mantysa [1,1000), 3 cyfry znaczące) — NIE jest błędem. -->

## MUST FIX (P0/P1 — blokuje merge)
- [x] **P1-1** | `src/core/bignum.ts:416` — `toNumber()` klamruje tylko gdy `e > 308`, więc pasmo `e === 308` z `|m| ≳ 1.798` przekracza `Number.MAX_VALUE` (1.7977e308) i zwraca `Infinity` zamiast `±MAX_VALUE`; klamra (linie 416-418) istnieje właśnie po to, by nie wyciekał Infinity, ale ma za niski próg — dlaczego: plan/07 §6 linia 139 ("toNumber (clamp przy e>308)") wymaga skończonego wyniku; powtarzalne: `Big.from("3e154").mul("3e154").toNumber() === Infinity`; e=308 jest w zwykłym zakresie endless (sufit `e < 9e15`, plan/03 §9), a `maxAffordable` gałąź `growth===1` (`bignum.ts:127`) propaguje to jako `Math.floor(Infinity)===Infinity` (nieskończona liczba sztuk) — fix: klamruj gdy wynik jest nie-skończony (np. `e >= 309 || (e===308 && Math.abs(m)*1e308 === Infinity)`), z testem na `e=308` i na maxAffordable.
  - fix-note: `toNumber()` now clamps any non-finite computed result to `±Number.MAX_VALUE`; added regression coverage in `tests/bignum.test.ts` for `3e154 * 3e154` and `growth === 1` `maxAffordable`.

## ADVISORY (P2 — nie blokuje)
- [x] **P2-1** | `src/core/format.ts:88` — `formatSignificant` liczy `fractionDigits` z rzędu wielkości SPRZED zaokrąglenia, więc mantysa `≥ 9.995` zaokrągla się do `"10.00"`: w torze naukowym `formatBig(9.996e18)` → `"10.00e18"` (powinno `"1.00e19"`; mantysa naukowa musi być [1,10), plan/03 §10 linia 145 "1.23e18"), a w torach sufiksowych daje 4 cyfry znaczące `"10.00B"`/`"10.00aa"` (powinno `"10.0B"`) — dlaczego: zaokrąglenie przeskakuje rząd wielkości, a wykładnik/sufiks się nie aktualizuje; powtarzalne dla każdego `m ∈ [9.995,10)`, dotyczy też wartości ujemnych (`-10.00e18`) — fix: po zaokrągleniu sprawdź czy mantysa osiągnęła 10/1000 i przenieś rząd (bump wykładnika/sufiksu).
  - fix-note: Fixed significant-digit rounding after precision rounding and bumped scientific exponent when rounded mantissa reaches 10; covered by `tests/format.test.ts` snapshot entry `roundedScientific`.
- [x] **P2-2** | `src/core/format.ts:17` — znak brany z `big.m < 0` PRZED zaokrągleniem magnitudy do zera w torze `formatFull`, więc małe ujemne wartości dają `"-0"` — dlaczego: `formatBig(Big.fromNumber(-0.4))` → sign `"-"`, `abs.e=-1<6` → `formatFull(0.4)` → `Math.round(0.4)=0` → `"-0"` (powinno `"0"`); plan/03 §10 nie przewiduje `-0` — fix: pomiń znak, gdy zaokrąglony wynik to 0.
  - fix-note: Suppressed the sign when full-number formatting rounds to `0`; covered by `tests/format.test.ts` snapshot entry `negativeZero`.
- [x] **P2-3** | `tests/format.test.ts:7` — snapshot §10 nie pokrywa całej tabeli: brak sufiksu `M` (1e6) i `T` (1e12), brak drugiej litery (`ab`) ani wykładnika niepodzielnego przez 3; jedyny przypadek literowy to `1.23e15` (e=15, podzielne przez 3) — przez to P2-1 przeszedł niezauważony — dlaczego: AC M1 (plan/08 linia 15: "tabela przykładów z 03 §10 jako test snapshot") sugeruje pokrycie wszystkich reguł §10 — fix: dodaj do snapshotu po jednym przykładzie M, T oraz drugiej litery sufiksu.
  - fix-note: Expanded the format snapshot with `M`, `T`, `ab`, non-divisible exponent suffix, rounded scientific, and negative-zero examples in `tests/format.test.ts`.
- [x] **P2-4** | `tests/costs.test.ts:6` — `maxAffordable`/`bulkCost` testowane tylko dla małych przypadków (`base=1`, owned ≤25, quantity ≤15, growth ≠1), więc gałąź estymaty dużego budżetu (`scaled.e > 15`, `bignum.ts:135`) i gałąź `growth===1` (`bignum.ts:99,127`) są nietestowane — dlaczego: AC "bulkCost/maxAffordable zgodne z brute-force" (plan/08 linia 15) deklaruje zgodność, którą test potwierdza tylko częściowo — fix: dodaj przypadek z dużym budżetem (k w setkach) i jeden z `growth===1`.
  - fix-note: Added `tests/costs.test.ts` coverage for a large-budget `maxAffordable` case and the `growth === 1` `bulkCost`/`maxAffordable` branch.

## DISPUTED (wypełnia Codex, rozstrzyga człowiek)
<!-- pozycje, z którymi Codex się nie zgadza: id znaleziska + uzasadnienie z cytatem z planu -->
_(brak)_

## PLAN-ISSUES (uwagi reviewera do samego planu — nieblokujące)
_(brak)_

## Runda 2 — weryfikacja (wypełnia reviewer)
- Naprawy zweryfikowane:
  - **P1-1 OK** — `bignum.ts:424-425` liczy `value` i klamruje nie-skończony wynik do `±MAX_VALUE`; `Big.from("3e154").mul("3e154").toNumber()` = `MAX_VALUE` (skończone), `maxAffordable(1, …, 9e308)` zwraca skończone `MAX_VALUE` zamiast `Infinity`. Regresja: `tests/bignum.test.ts:68-69` i `:72-77` (oba asercje rzeczywistego zachowania).
  - **P2-1 OK** — `format.ts:66-73` zaokrągla mantysę i przy `≥10` podbija wykładnik (`formatBig(9.996e18)` → `"1.00e19"`); `formatSignificant` (`:95-100`) zaokrągla PRZED liczeniem cyfr (`9.996`→`"10.0"`, już 3 cyfry znaczące). Snapshot `roundedScientific: "1.00e19"`.
  - **P2-2 OK** — `format.ts:20-23` zwraca `"0"` bez znaku, gdy `formatFull` daje `"0"`. Snapshot `negativeZero: "0"`.
  - **P2-3 OK** — `tests/format.test.ts` rozszerzony o `suffixM`(1.23M), `suffixT`(9.99T), `secondLetterSuffix`(1.00ab), `nonDivisibleLetterSuffix`(123aa), `roundedScientific`, `negativeZero` — pokrywa wszystkie reguły §10.
  - **P2-4 OK** — `tests/costs.test.ts:39` (owned=400, k=250 → gałąź `scaled.e>15`, ==250) oraz `:40-41` (`growth===1`: bulkCost=20, maxAffordable=4).
- Nowe P0 wprowadzone poprawkami: brak (tor skończony `toNumber` niezmieniony; przepisany `formatScientific`/`formatSignificant` zachowuje stare wartości — `4.20B`/`1.23e18`/`1.23aa` nadal zgodne; `npm run check` = 13/13 zielone).
- Decyzja: DONE — jedyny blocker (P1-1) i wszystkie P2 rozwiązane, naprawy bez nowych P0.
