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

---

## Aktualizacja UI — powłoka „desktop OS" (milestony M13–M16)

> Decyzje właściciela (czerwiec 2026). Pełna specyfikacja: `06 §10–§17`. Te milestony **przebudowują top-level UI** (z jednego layoutu §3 na pulpit z oknami) — nie ruszają ekonomii (`02`/`03`). Ta sama dyscyplina: jeden milestone = jeden PR, `npm run check` zielony, AC odhaczone. **Kolejność/zależności:** M13 (powłoka) najpierw; **M14 wymaga istniejącej fabuły z M7**; **M16** — dane (tabele komponentów + migracja) już zdefiniowane w `09 §4.1–4.3` i `03 §3.4`, gotowe do implementacji; **M15** — lokalny model jest desktop-first (web demo bez modelu), więc część „model" może lądować w oknie M12, a reszta Vibex wcześniej.

## M13 — Powłoka desktop: boot + pulpit + okna + karteczki (2–3 dni)
- [ ] Scena **BOOT** (`06 §11`): ciemny pokój + migający monitor (CSS/SVG, reduced-motion safe); przyciski START / CONTINUE / SETTINGS / język / credits; Settings współdzielone z apką Settings.
- [ ] Animacja wejścia: napisy znikają, efekt odpalenia działa tylko w monitorze (`opacity`/pseudo-warstwa CRT, skippable, reduced-motion = fade) → scena **DESKTOP**.
- [ ] Pulpit + ikony apek (`06 §12`); menedżer okien `ui/wm/`: przesuwanie/resize/min/max/close, z-order, jedno okno na apkę, min-size per apka; persist `GameState.ui.windows` (+ bump `SAVE_VERSION` + migracja).
- [ ] Karteczki statystyk (`06 §13`): 3 post-ity (Money + Money/s; LoC + LoC/s + dopisek „LoC = Lines of Code"; RP + Compute used/cap + Hype); `--font-hand` vendorowany (zweryfikować licencję), tabular-nums, ResourceCounter, tooltip mnożników; warstwa nad oknami.
- [ ] Nowe tokeny (`06 §2/§10`); skróty klawiszowe pod nowy zestaw apek (`06 §8/§12`).
- **AC:** boot→monitor power-on→desktop działa i jest skippable; `prefers-reduced-motion` = fade; okno otwiera się w granicach min-size…pulpit; układ okien przeżywa reload (test save/migracja); karteczki bez layout-shiftu przy tickach (tabular-nums); budżet perf `07 §9` trzyma się (okno zamknięte/min nic nie liczy).

## M14 — Apki: podział ekranów + Chat/Mail/Feed + powiadomienia (2 dni)
- [ ] Opakować istniejące ekrany (`06 §4`) w okna; rozdzielić dawny Dev Floor → **Agents** (lista agentów + rozbicie Compute) / **Hardware** / **Upgrades** (`06 §17`).
- [ ] Rozdzielić comms dock → apki **Chat / Mail / Feed**: routing kanału z `systems/story.ts` (treść i triggery eventów **bez zmian**); badge unread + pulse na ikonie.
- [ ] Powiadomienia narożne (`06 §14`): toasty „New mail/chat/feed" (reuse `Toast`), klik → otwiera właściwą apkę; **treść tylko w apce**; bleep „message"; „Do not disturb" w Settings.
- **AC:** każda apka działa w oknie z funkcjami sprzed podziału; toast nie pokazuje treści wiadomości; unread liczone poprawnie i zerowane po otwarciu; przejście Aktu 0–1 nadal odpala się wg triggerów (regression jak M7).

## M15 — Vibex: terminal promptów + pula humoru + lokalny model + wizualizer kodu (3–4 dni)
- [ ] Układ Vibex (`06 §15`): lewy fake file-tree (**nieklikalny**), środek code-stream, prawy terminal + **Send**; nagłówek `model: <era>` (`02 §5`).
- [ ] Send = istniejąca akcja PROMPT (`02 §3`/`03 §4`) podpięta **bez zmian w balansie**; flow meter.
- [ ] Pula generyczna `vibex.canned.*` (pary prompt↔odpowiedź, **z humorem**; ⚠️ teksty do napisania jak fabuła; shuffle bag; idle **nie woła modelu** → P3).
- [ ] Wizualizer kodu: pisanie linii → czyszczenie → przejście do kolejnego fikcyjnego pliku (podświetlenie w file-tree) → raz na cykl `commited` w terminalu; pula reużywanych elementów (`transform`/`opacity`); fragmenty w `data/` (bez logiki).
- [ ] Lokalny model w `platform/ai.ts` + **Web Worker**: **wllama** (MIT) + **SmolLM2-135M-Instruct** (Apache-2.0, GGUF Q4 ≈95–135 MB); system-prompt z humorem, ≤~60 tok; **desktop** = pobranie+cache (offline po pobraniu), **web demo** = canned-only; Settings: toggle „Vibex local AI" + „Download model" (rozmiar/postęp) + nota licencyjna; fallback na pulę gdy brak modelu.
- [ ] LICENSE/NOTICE modelu i silnika dołączone do dystrybucji; **wyjątek od P2 udokumentowany i izolowany** w `platform/ai.*` (jedyna dozwolona wyspa zależności runtime).
- **AC:** idle pokazuje pary canned **bez kosztu CPU** (P3); wpisany prompt → odpowiedź modelu **w workerze bez zacięcia ticka** (budżet `07 §9`); brak/wyłączony model → fallback na pulę; **liczby niezmienione** (test: Send daje identyczny burst LoC jak przed przebudową UI).

## M16 — Hardware: komponenty PC → serwer od zera (2–3 dni)
- [x] **Dane zdefiniowane:** tabele komponentów (PC + serwer) i migracja w `09 §4.1–4.3`; wzory/stałe (`totalCap`, `HW_BASE_CAP=6`, `HW_PC_MAX_CAP=182`, `pcComplete`) w `03 §3.4`. (Liczby wstępne — tuning po simie.)
- [ ] Przepisać `data/hardware.ts` 1:1 z `09 §4` (schemat: `id, phase pc|server, slot, maxLevel, baseCost, growth, firstLevelCap?, capPerLevel, unlock, isEnclosure`).
- [ ] `systems/compute.ts`: cap liczony z komponentów/faz/slotów; **faza 2 (serwer) odblokowana po zmaksowaniu PC**; szafa sama = 0 cap; blokada zakupu gdy nie stać.
- [ ] Apka Hardware: SVG płyty głównej + szafy rack, sloty, „wskakiwanie" komponentu, liczniki `+cap` (`transform`/`opacity`).
- [ ] Migracja save: stare tiery hardware → ekwiwalent cap/komponentów; bump `SAVE_VERSION` + fixture test.
- **AC:** faza 1 daje cap i odblokowuje fazę 2 po maxie PC; szafa bez modułów = 0 cap; sim balansu (`10 §3`) przechodzi z nowym hardware bez regresji rytmu „wall & release"; stary save migruje się zachowując dostępny cap.

## M17 — AURORA PROJECT true ending (3–5 dni)
- [ ] Plan-first: dopisać liczby Aurory/billingu do `03 §7/§9` i `09 §4.4/§12`.
- [ ] `GameState.aurora` + `SAVE_VERSION` bump + migracja; Aurora przeżywa REWRITE/EXIT/ITERATION.
- [ ] `p_aurora_seed` po OMEGA: unlock-only projekt, ship → `aurora_unlocked`, osobna ikona Aurora.
- [ ] `systems/aurora.ts`: fazy 0→100, opłata kroku, progress, dedykacja serwera, hosting, complete.
- [ ] `systems/billing.ts`: prąd hardware + hosting Aurory, net Money/s i tooltip rozbicia.
- [ ] UI: apka Aurora, Aurora UI nody, licznik Aurora-ready servers w Hardware.
- [ ] Story: eventy `a5_13–a5_17`, victory true ending.
- [ ] Sim: `completeH = auroraCompleteH`, osobno `omegaCompleteH`; `sane 100h` kończy Aurorę ≥20h po OMEGA.
- **AC:** OMEGA choice nie kończy technicznie gry; `p_aurora_seed` odblokowuje Aurorę; 8 własnych serwerów daje tańszą ścieżkę niż hosting; billing nie robi ujemnych pieniędzy; Aurora complete odpala true ending i przechodzi `npm run check` + sim 100h.

**Suma M0–M12: ~25–30 dni roboczych.** **M13–M16 (aktualizacja UI „desktop OS"): ~9–12 dni** (z Codexem realnie szybciej przy dyscyplinie milestone'ów).

## 13. Zasady pracy z Codexem (przeczytaj zanim zaczniesz)

1. **Jeden milestone = jedna rozmowa/PR.** Nie mieszaj zakresów; kontekst z `plan/` podawaj wybiórczo (patrz §14).
2. **Liczby tylko z planu.** Jeśli Codex proponuje stałą — każ mu wskazać źródło w `03`/`04`/`09`. Brak źródła = poprawka planu NAJPIERW.
3. **Po każdym tasku:** `npm run check`. Czerwone = nie idziemy dalej.
4. **Zakaz zależności runtime.** Codex lubi dorzucać biblioteki — odrzucaj (filar P2). DevDeps wolno. **Jedyny zatwierdzony wyjątek:** wyspa Vibex local-AI w `platform/ai.*` (`wllama` + model GGUF) — izolowana, bez wycieku importów; `06 §15`, `M15`.
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
