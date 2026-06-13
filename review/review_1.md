# Review #1 — M0
Reviewer: Claude Opus 4.8 | Data: 2026-06-13
Status: OPEN   <!-- OPEN → FIXED (Codex) → DONE / ESCALATE (reviewer, runda 2) -->
VERDICT: APPROVED

<!-- Kontekst (zweryfikowane przez reviewera, nie blokuje):
  AC1 dev server/boot: `npm run build` zielony (bundle 2.31 kB gz JS + 1.61 kB gz CSS, fonty vendorowane) — daleko pod budżetem 300 KB (07 §9).
  AC2 licznik 10 Hz: TICK_HZ=10 (constants.ts:2 == 03 §11:152); loop.ts fixed-timestep + test loop.test.ts:7-23 dowodzi 10 ticków/s, dt=0.1 s.
  AC3 lighthouse >95: niemierzone tutaj (brak headless Chrome), ale szkielet minimalny, zero zależności runtime, font-display:swap — brak ryzyka.
  DoD: `npm run check` zielony (tsc --noEmit + eslint + prettier --check + 3× vitest + validate PASS, 45 plików TS).
  Tokeny 06 §2 (26/26), layout 06 §3, warstwy (data/systems/ui), brak zależności runtime, i18n (0 sierot / 0 braków) — wszystko zgodne. -->

## MUST FIX (P0/P1 — blokuje merge)
<!-- reviewer wypełnia; Codex odhacza [x] i dopisuje fix-note. Format pozycji: -->
_(brak — zero P0/P1; M0 spełnia AC i DoD)_

## ADVISORY (P2 — nie blokuje)
- [ ] **P2-1** | `src/dev/validate.ts:86-104` — walidator literałów UI łapie tylko `innerHTML`, `.textContent="..."` i `createTextNode("...")`, ale cały tekst w projekcie idzie przez własny wrapper `text()`/`setText()` (`src/ui/dom.ts:28-38`), więc literały typu `text("PARROT-1")` przechodzą i `npm run check` raportuje PASS — reguła "zakaz stringów UI w kodzie" jest faktycznie nieegzekwowana (cytat: plan/07 §8 linia 159 "grep po literałach w ui/"; AGENTS.md:23) — fix: rozszerz regex tak, by łapał literał w argumencie `text(`/`setText(`/`.append(` w plikach `ui/`.
  - fix-note: _(wypełnia Codex)_
- [ ] **P2-2** | `src/ui/render.ts:107` — zahardkodowany string `"PARROT-1"` (oraz placeholdery wartości `"0"/"0/0"/"1x"` w `:92-95` i `:138`) renderowany przez `text()` zamiast i18n/stanu gry (cytat: AGENTS.md:23 "No string literals in ui/"; uwaga: `"PARROT-1"` to nazwa modelu E1 = content z plan/01 §6 linia 70 / plan/09 §2, więc docelowo pochodzi ze stanu, nie z literału) — fix: w M2 podłącz wartości pod stan/format, a docelowe chrome przez `t()`; nie blokuje szkieletu.
  - fix-note: _(Codex naprawia tylko gdy <10 linii; inaczej wpisz "→ backlog")_
- [ ] **P2-3** | `src/dev/cheats.ts` — brak pliku; struktura 07 §1 wymienia `dev/cheats.ts`, a M0 każe stworzyć foldery z 07 §1 jako puste moduły z TODO — to jedyny wymieniony moduł bez stubu (reszta core/data/systems/platform/ui ma 2-liniowe TODO) (cytat: plan/08 M0 linia 8; plan/07 §1 linia 46) — fix: dodaj `src/dev/cheats.ts` ze stubem `// TODO(M11): panel ?dev=1 (07 §11)` + `export {};`.
  - fix-note: _(Codex naprawia tylko gdy <10 linii; inaczej wpisz "→ backlog")_
- [ ] **P2-4** | `tests/loop.test.ts` — testy pokrywają tylko `createLoopStepper`; `startLoop` (glue rAF: seedowanie `lastMs` z `now()` `loop.ts:67`, aktualizacja `loop.ts:75-76`, guard `stop()`/`isRunning` `loop.ts:71,87-89`) jest nietestowane — AC "licznik tyka 10 Hz" jest pokryte na poziomie steppera (OK), ale integracja pętli z rAF nie (cytat: plan/08 M0 DoD "testy zielone"; check #8) — fix: dodaj test wstrzykujący `requestFrame`+`now` z syntetycznym zegarem i asercję, że po `stop()` nie ma kolejnych klatek.
  - fix-note: _(Codex naprawia tylko gdy <10 linii; inaczej wpisz "→ backlog")_
- [ ] **P2-5** | (historia git) — commity bez prefiksu milestone'u ("add initial implementation files…" / "add initial project documentation…" zamiast "M0: …") (cytat: AGENTS.md:27 hard rule 8; plan/08 §13.7) — fix: stosuj `M<N>:` w kolejnych commitach; historyczne → backlog (bez rebase).
  - fix-note: _(Codex naprawia tylko gdy <10 linii; inaczej wpisz "→ backlog")_

## DISPUTED (wypełnia Codex, rozstrzyga człowiek)
<!-- pozycje, z którymi Codex się nie zgadza: id znaleziska + uzasadnienie z cytatem z planu -->
_(brak)_

## PLAN-ISSUES (uwagi reviewera do samego planu — nieblokujące)
_(brak)_

## Runda 2 — weryfikacja (wypełnia reviewer)
- Naprawy zweryfikowane: <lista id: OK / NADAL ZŁE>
- Nowe P0 wprowadzone poprawkami: _(tylko P0; brak = brak)_
- Decyzja: DONE / ESCALATE + powód
