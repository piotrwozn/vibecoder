# Review #4 — M3
Reviewer: Claude Opus 4.8 | Data: 2026-06-13
Status: DONE   <!-- OPEN → FIXED (Codex) → DONE / ESCALATE (reviewer, runda 2) -->
VERDICT: CHANGES REQUIRED

<!-- Kontekst (zweryfikowane przez reviewera):
  DoD: `npm run check` zielony (tsc + eslint + prettier + 34× vitest + validate PASS).
  AC pełna pętla: klik→LoC (prompt M2) → projekt (startProject, koszt LoC) → $ (completeBuild payout + tickProjectIncome) → agent (buyGenerator $) → ściana compute (canFitCompute blokuje, test compute.test.ts:15) → hardware (buyHardware podnosi cap 6→18, test compute.test.ts:18-25). Działa.
  AC hype: addShipHype 0.15×tier, cap 5; tickHype 1+(h-1)·exp(-dt/90) → testy hype.test.ts zgodne z 03 §5.3.
  AC Refactor obniża debt: debt ×0.4 (REFACTOR_DEBT_MULT), test projects.test.ts:58-73 (1000→400); koszt 60 s·locRate, build 30 s == 03 §6.
  Liczby: projekty E1 (25/1.0/15, 300/1.2/20, 2e3/0.8/40+1RP) == 09 §7; hardware h_gaming_rig (400/1.9/+12), cap start 6 == 09 §4; payout=costLoC×valueRatio, revenue=payout×0.004, income=Σrev×bugPenalty×hype×prestiż == 03 §5.1-5.2.
  Hard rules: brak zależności runtime; data/ czyste; systems/ bez DOM; Big dla cost/payout/revenue/income; getGeneratorMaxAffordable = min(money,compute) — MAX szanuje ścianę compute. GameState: ActiveBuild/Product/ProjectOffer rozszerzone, v=1 (brak save do M4 → bez migracji — OK). Zakres: compute/projects/hype + ekran Projects + topbar + tooltip — bez scope creep. -->

## MUST FIX (P0/P1 — blokuje merge)
- [x] **P1-1** | `src/ui/render.ts:384` — odczyt „Income” na ekranie Projects jest renderowany RAZ przez `createSummaryItem` (`:821-827`, węzeł tekstowy nigdzie nie zapamiętany), a `updateProjects` (`:663-668`) odświeża refactor/offers/builds/portfolio, ale NIE podsumowania dochodu → po zshipowaniu projektu pieniądze rosną co tick (`tickProjectIncome`), lecz „Income” stale pokazuje `$0.00/s` na zawsze — dlaczego: plan/06 §4 (ekran Projects musi pokazywać przychód portfolio); `view.incomeRate` jest liczone poprawnie co klatkę (`main.ts:228`), ale nie trafia do DOM — fix: zapamiętaj węzeł tekstowy dochodu przy tworzeniu i aktualizuj go w `updateProjects` przez `setText`.
  - fix-note: Stored the Projects income summary text node and update it from each new `ProjectsView` during `updateProjects`; covered by `tests/render.test.ts`.

## ADVISORY (P2 — nie blokuje)
- [x] **P2-1** | `src/systems/projects.ts:114` — `getProjectIncomeRate` przelicza `calculatePrestigeMultiplier` (Big.pow) + pętla po portfolio przy KAŻDYM ticku (`tickProjectIncome`) i jeszcze raz co klatkę (`main.ts:228`), zamiast użyć `cache.multipliers.prestige` — dlaczego: plan/07 §9 (mnożniki przeliczane eventowo, nie co tick; suma przychodu portfolio zmienia się tylko przy ship/bug) — fix: przekaż/odczytaj prestige z DerivedCache i cache'uj sumę `Σ revenue×bugPenalty`, mnożąc tylko przez żywy hype co tick.
  - fix-note: → backlog (requires changing project-income/cache API and caller wiring; more than 10 lines).
- [x] **P2-2** | `src/main.ts:158` — `createGeneratorView` liczy pełne `getGeneratorMaxAffordable` (Big.maxAffordable per generator) co klatkę tylko po to, by ustalić `canBuyMax = maxAffordable>0`, co jest równoważne tańszemu warunkowi `canBuy1` (money≥cost1 ∧ compute≥1); dodatkowo `syncActiveBuilds`/`syncProducts` (`render.ts:692,727`) robią `querySelector` kontenerów list co klatkę zamiast trzymać referencje — dlaczego: plan/07 §9 (bez zbędnej pracy/alokacji w hot-path renderu; przy aktywnym buildzie/dochodzie widok odświeża się co klatkę) — fix: wyprowadź `canBuyMax` z warunku „stać na ≥1” i zapamiętaj węzły list zamiast `querySelector`.
  - fix-note: → backlog (complete finding includes both generator max-affordable and retained list-node plumbing; more than 10 lines).
- [x] **P2-3** | `src/main.ts:303-313` — tooltip mnożników LoC/s pomija człony `baza` i `milestones`; pokazuje tylko era/research/debt/prestige/upgrades/achievements (z czego większość = 1.00x), więc wypisane mnożniki nie zgadzają się z `total` (milestone ×2 przy 10 szt. jest dominującym czynnikiem w E1) — dlaczego: plan/06 §5 linia 78 ("baza × milestones × era × research × debt × prestiż = total") — fix: dodaj człon milestone/base do rozbicia (AC dopuszcza „wersja v1”, więc nieblokujące).
  - fix-note: → backlog (needs new derived breakdown data for base/milestone components; more than 10 lines).
- [x] **P2-4** | `src/systems/projects.ts:34` — `boardRefreshAt` jest ustawiane w `refreshProjectBoard`, ale nigdy nie odczytywane (brak odświeżania planszy po `PROJECT_REFRESH_S`); plansza pokazuje wszystkie projekty ery, więc pole jest martwe — dlaczego: niewykorzystane pole stanu / niezaimplementowany mechanizm (`state.projects.boardRefreshAt`, `C.PROJECT_REFRESH_S`) — fix: albo wykorzystaj `boardRefreshAt` w ticku do rotacji ofert, albo usuń pole do czasu implementacji (M6 auto-refresh `09 §6`).
  - fix-note: `tickProjects` now reads `boardRefreshAt` and calls `refreshProjectBoard` after `PROJECT_REFRESH_S`; no regression test required for P2.

## DISPUTED (wypełnia Codex, rozstrzyga człowiek)
<!-- pozycje, z którymi Codex się nie zgadza: id znaleziska + uzasadnienie z cytatem z planu -->
_(brak)_

## PLAN-ISSUES (uwagi reviewera do samego planu — nieblokujące)
_(brak)_

## Runda 2 — weryfikacja (wypełnia reviewer)
- Naprawy zweryfikowane:
  - **P1-1 OK** — `createSummaryItem` (`render.ts:849`) zapamiętuje węzeł tekstowy dochodu w `projectSummaryNodes`; `updateProjects` (`:669`) → `updateProjectSummary` → `updateProjectSummaryIncome` (`:676-688`) ustawia `income.data = view.incomeRate` co klatkę (z dirty-checkiem). „Income” aktualizuje się po shipie. Test `tests/render.test.ts`.
  - **P2-4 OK** (zaimplementowane) — `tickProjects` (`projects.ts:71-74`) odświeża planszę gdy `playtimeS >= boardRefreshAt` i ustawia `changed=true`; `refreshProjectBoard` zbraja timer (`+PROJECT_REFRESH_S`), idempotentne dla E1 (ta sama lista ofert), bez utraty stanu / pętli.
  - P2-1, P2-2, P2-3 → backlog (świadomie, P2, >10 linii — dozwolone wg AGENTS.md).
- Nowe P0 wprowadzone poprawkami: brak. Sprawdzone: `projectSummaryNodes` jest module-global jak istniejące mapy wierszy (jeden mount); odświeżanie planszy nie tworzy ani nie gubi wierszy DOM (E1 = stałe 3 oferty, te same id), brak nieskończonego odświeżania; `npm run check` zielony, validate PASS.
- Decyzja: DONE — jedyny blocker (P1-1) rozwiązany, P2 rozdysponowane (3× backlog, 1× naprawione), poprawki bez nowych P0.
