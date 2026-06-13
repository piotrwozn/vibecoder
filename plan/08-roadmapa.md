# 08 — Roadmapa implementacji (milestony dla pracy z Codexem)

> Każdy milestone = osobna, mergowalna całość z kryteriami akceptacji (AC). Rób JEDEN milestone naraz, w kolejności. Po każdym: testy zielone + ręczny smoke test + commit. Prompty startowe dla Codexa: §14.

**Definition of Done (każdy milestone):** `npm run check` przechodzi (tsc --noEmit + eslint + vitest + validate content), gra bootuje bez błędów konsoli, save z poprzedniego milestone'u się wczytuje (od M4), AC odhaczone.

## M0 — Szkielet projektu (½ dnia)
- [ ] `npm create vite` (vanilla-ts), tsconfig strict, eslint+prettier, vitest, struktura folderów z `07 §1` (puste moduły z TODO), `npm run check` script.
- [ ] `index.html` + layout grid z `06 §3` (puste panele, tokeny z `06 §2` w theme.css), fonty vendorowane.
- [ ] `core/loop.ts` tickujący licznik testowy widoczny na ekranie.
- **AC:** dev server działa, licznik tyka 10 Hz, lighthouse perf > 95 na pustym szkielecie.

## M1 — Big numbers + format (1 dzień)
- [ ] `core/bignum.ts` wg spec `07 §6` (z wariantami mutującymi i metodami kosztów z `03 §1`), `core/format.ts` wg `03 §10`.
- **AC:** testy property vs number (1e±300) zielone; `bulkCost`/`maxAffordable` zgodne z brute-force w testach; format: tabela przykładów z `03 §10` jako test snapshot.

## M2 — Stan + produkcja + klik + agenci E1 (2 dni)
- [ ] `core/state.ts` (pełny typ z `07 §2`, default), `core/bus.ts`, `data/constants.ts` (WSZYSTKIE stałe z `03 §11` + `04 §5`).
- [ ] `systems/production.ts` (wzór `03 §2` + DerivedCache), `systems/prompt.ts` (klik+flow `03 §4`), zakup agentów (koszty, milestony formułowe `03 §3.3`).
- [ ] Ekran Dev Floor (minimalny): lista agentów E1, kup ×1/×10/MAX, licznik LoC.
- **AC:** klikanie + 3 typy agentów działają; milestone ×2 przy 10 szt. widoczny; tick < 2 ms przy 1000 agentów (test perf w dev panelu).

## M3 — Compute/hardware + projekty + money (2 dni)
- [ ] `systems/compute.ts` (cap, blokada zakupu), `systems/projects.ts` (plansza, build, ship, portfolio, sloty, Refactor), `systems/hype.ts`.
- [ ] Ekran Projects + topbar zasobów + tooltip mnożników (`06 §5` — wersja v1).
- **AC:** pełna pętla: klik→LoC→projekt→$→agent→ściana compute→hardware; hype rośnie i zanika wg `03 §5`; Refactor obniża debt (debt jeszcze bez bugów).

## M4 — Save/load + offline + settings (1–2 dni)
- [ ] `core/save.ts` + `migrations.ts` (SAVE_VERSION=1), autosave, export/import base64; `platform/web.ts`; `systems/offline.ts` (zamknięte formy `03 §7`) + modal powrotu; background-tab catch-up (`07 §3`).
- [ ] Ekran Settings (notacja, autosave, dźwięk placeholder, export/import, wipe).
- **AC:** reload = identyczny stan; 1h symulowanego offline = dokładnie wzór (test jednostkowy); zepsuty JSON w localStorage → gra startuje z naprawą, nie crashem.

## M5 — Debt + bugi + unlocki + terminal (2 dni)
- [ ] `systems/debt.ts` (przyrost, debtEff, bugi z seedowanego RNG, incydenty — szkielet), `systems/unlocks.ts` (evaluator Condition `07 §5`), widoczność ???/odblokowane.
- [ ] Terminal: commit log (ring buffer, throttle), przycisk PROMPT z flow-meterem, cząstki kliku (pula).
- **AC:** debt realnie dusi produkcję wg wzoru (tooltip pokazuje debtEff); bug pojawia się, fix działa; ten sam seed = te same bugi (test determinizmu).

## M6 — Research + upgrade'y + automatyzacja cz.1 (2 dni)
- [ ] `systems/research.ts` + ekran drzewka (SVG); `data/upgrades.ts` (unikalne z `09 §5`) + sekcja w Dev Floor; `systems/automation.ts` (auto-prompt, auto-buy, auto-fix — `02 §7` poz. 1–3).
- **AC:** wszystkie efekty researchu/upgrade'ów przechodzą przez DerivedCache (zero liczenia w tick); automatyzacje mają toggle w UI i działają.

## M7 — Fabuła engine + Akt 0–1 + comms dock (2–3 dni)
- [ ] `systems/story.ts` (kolejka, triggery co 1 s, choices, inbox), `data/story/act0.ts act1.ts` (17 eventów — teksty z `05 §4–5` do `i18n/en.json`), comms dock UI (chat/mail/feed, badge, typing animacja, archiwum).
- [ ] `i18n/i18n.ts` + przeniesienie WSZYSTKICH dotychczasowych stringów UI do `en.json`.
- **AC:** przejście Aktu 0+1 wg triggerów na świeżym savie (test w sim!); brak stringów w kodzie (validate.ts to sprawdza); wybór a1_10 działa w obu wariantach.

## M8 — Prestiż W1: REWRITE + drzewko Insight (2 dni)
- [ ] `systems/prestige.ts` (insightGain `04 §2`, reset selektywny, sekwencja boot), ekran Rewrite+ tab 1 (prognoza co tracisz/zyskujesz), `data/prestige.ts` drzewko 25 węzłów (`09 §8`), event a1_08/a1_09.
- **AC:** pełny cykl: rewrite → insight → węzły działają → szybszy restart; prognoza zgodna z faktem (test); save przed/po migruje się.

## M9 — Content Aktów 2–5 + ery E3–E10 + EXIT (4–6 dni, największy)
- [ ] `data/`: wszystkie generatory/hardware/projekty/upgrade'y er E3–E10 (`09 §2–7`), eventy a2–a5 (beaty z `05 §6`; sceny oznaczone ⚠️ — napisać teksty wg zasad `05 §1`, wrzucić do en.json), incydenty pełne, EXIT (`04 §3`) + perki Equity + tab 2, run modifiers (Board Seat).
- [ ] Finał: sekwencja a5_11/a5_12, 3 endingi, modal pełnoekranowy.
- **AC:** sim przechodzi kampanię w 45–70h czasu gry (`10 §3` strategia "sane"); wszystkie eventy odpalają się w simie ≥1 raz; EXIT resetuje dokładnie to, co `04 §1`.

## M10 — Endless: ITERATION + Paradox + echoes (2 dni)
- [ ] Warstwa 3 (`04 §4`): softcap shift, paradoxGain, sklep Paradox, tab 3, auto-rewrite rule builder, eventy echoes, glitch-kosmetyka per ending.
- **AC:** sim robi 5 iteracji bez ściany; po 100h symulowanych liczby nie przepełniają Big (e < 9e15 — margines kosmiczny).

## M11 — Polish: dźwięk, juice, a11y, achievementy, stats (2–3 dni)
- [ ] WebAudio bleeps (5), wszystkie animacje z `06 §6`, achievementy (`09 §10`) + ekran, Stats ze sparkline, skróty klawiszowe, reduced-motion, kontrast audit, opcjonalny data-rain (jeśli budżet pozwala).
- **AC:** budżety perf z `07 §9` trzymają się na realnym late-game savie (dev panel); axe-core bez błędów krytycznych.

## M12 — Wydania: demo web + desktop Tauri (2 dni + bufor)
- [ ] Demo gating (`07 §10`), ekran "Get full game", build web (`VITE_EDITION=demo`) + deploy (itch.io zip/pages).
- [ ] `src-tauri` init, ikony, platform/desktop.ts (pliki+backupy+atomic), updater, GitHub Actions: matrix build Win/macOS/Linux, artefakty instalatorów.
- [ ] Soak test 8h (`10 §5`), balans finalny simem, QA checklist (`10 §6`).
- **AC:** instalator działa na czystym Windows; demo w przeglądarce; save demo importuje się do desktop; auto-update z wersji testowej przechodzi.

**Suma: ~25–30 dni roboczych** (z Codexem realnie szybciej przy dyscyplinie milestone'ów).

## 13. Zasady pracy z Codexem (przeczytaj zanim zaczniesz)

1. **Jeden milestone = jedna rozmowa/PR.** Nie mieszaj zakresów; kontekst z `plan/` podawaj wybiórczo (patrz §14).
2. **Liczby tylko z planu.** Jeśli Codex proponuje stałą — każ mu wskazać źródło w `03`/`04`/`09`. Brak źródła = poprawka planu NAJPIERW.
3. **Po każdym tasku:** `npm run check`. Czerwone = nie idziemy dalej.
4. **Zakaz zależności runtime.** Codex lubi dorzucać biblioteki — odrzucaj (filar P2). DevDeps wolno.
5. **Zakaz logiki w `data/` i DOM w `systems/`** — validate.ts + review importów.
6. Gdy Codex utknie na czymś wizualnym: daj mu screenshot. Gdy na balansie: odpal sim i wklej wynik.
7. Commituj często z prefixem milestone'u: `M3: project board UI`.

## 14. Szablony promptów dla Codexa

**Start milestone'u:**
> Read AGENTS.md, then plan/08-roadmapa.md section M<N>, plus the plan files it references (e.g. 03 §…, 07 §…, 09 §…). Implement M<N> exactly as specified. Constants only from plan files — if a needed constant is missing, stop and ask. Run `npm run check` before declaring done. Do not add runtime dependencies.

**Naprawa/iteracja:**
> Bug in M<N> scope: <opis + kroki/screenshot/log>. Root-cause it, fix, add a regression test in tests/, run `npm run check`.

**Content (M9):**
> Transcribe the data tables from plan/09-content.md §<X> into src/data/<plik>.ts following the existing schema in that file. No invented values; keep ids exactly as in the plan. Then run `npm run validate` and fix reported issues.

**Teksty fabularne (M9):**
> Write the missing story texts marked ⚠️ in plan/05-fabula.md §6 for act <N>, following the writing rules in §1 and each beat's PL guidelines. Output as i18n entries for src/i18n/en.json under story.<id>.*. Keep chat lines ≤ 2 sentences.

## 15. Pętla review — manualna, przez folder `review/`

Pracujesz ręcznie, na zmianę z dwoma narzędziami (Codex = implementacja i poprawki; Claude Code = review). Wymiana między nimi idzie **przez pliki w `review/`**, nie przez wklejanie raportów do czatu — każda sesja jest samowystarczalna.

1. Codex: implementuje M\<N\> (Prompt A z `12 §1`) → kończy HANDOFF-em, `npm run check` zielony.
2. Ty → Claude Code: Prompt B (`12 §2`). Reviewer zapisuje znaleziska do **`review/review_<k>.md`** (kolejny wolny numer, format z `review/_template.md`) z checkboxami `[ ]`.
3. Ty → Codex: Prompt C (`12 §3`) z podaną ścieżką pliku review. Codex naprawia, odhacza `[x]` i dopisuje fix-note pod każdym punktem.
4. Ty → Claude Code: Prompt B w trybie rundy 2 — weryfikuje odhaczone pozycje w TYM SAMYM pliku, ustawia `Status: DONE` albo `ESCALATE`. **Max 2 rundy, potem merge.**

Anty-ping-pong: reviewer cytuje plan, nie gust; runda 2 = zero nowych P1/P2; pozycje DISPUTED rozstrzygasz Ty (poprawka planu albo nakaz wykonania); nierozwiązane P2 przepisujesz do backlogu `11 §5`. Pliki review zostają w repo jako historia decyzji.
