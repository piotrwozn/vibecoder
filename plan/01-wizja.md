# 01 — Wizja i założenia

> Część planu implementacji gry **VIBECODER** (tytuł roboczy). Indeks: `plan/README.md`.

## 1. Pitch

**VIBECODER** to narracyjna gra idle/incremental, w której grasz vibecoderem: zaczynasz od ręcznego wklepywania promptów do darmowego modelu AI, a kończysz zarządzając rojem samodoskonalących się agentów, które piszą cały software świata. Inspiracja strukturą FACEMINER (klimat, narracja przez fałszywy interfejs, eskalacja od garażu do skali planetarnej), ale:

- zamiast kopania twarzy — **generowanie kodu i shipowanie produktów**,
- zamiast 2–3h fabuły — **50h+ kampanii** w 6 aktach,
- **3 warstwy prestiżu** (FACEMINER nie miał żadnej),
- **nowoczesna oprawa** "IDE/terminal" zamiast retro-1999,
- **endless mode** zaprojektowany od początku, nie doklejony.

Ton: satyra na AI hype przechodząca stopniowo w egzystencjalny niepokój (arc podobny do FACEMINER: zaczyna się zabawnie, kończy niepokojąco).

## 2. Filary projektu (decyzje nadrzędne)

| # | Filar | Co to znaczy w praktyce |
|---|-------|------------------------|
| P1 | **Gra jest interfejsem** | Całe UI udaje narzędzia developerskie (IDE, terminal, chat, feed). Brak "HUD-u gry" — fikcja diegetyczna jak w FACEMINER. |
| P2 | **Zero silnika, zero zależności w runtime** | Czysty TypeScript + DOM. Vite tylko jako bundler. Żadnych frameworków UI, żadnych bibliotek w bundlu produkcyjnym. |
| P3 | **Wydajność jest cechą gry** | Idle gra chodzi godzinami w tle: budżet CPU < 3% idle, stały RAM, brak wycieków. Szczegóły: `07-architektura.md §9`. |
| P4 | **Wszystko jest danymi** | Generatory, upgrade'y, projekty, eventy fabularne = typowane pliki danych. Dodanie contentu po premierze nie wymaga zmian w systemach. |
| P5 | **Liczby mają jedno źródło prawdy** | Wszystkie stałe i wzory są w `03-balans.md` i trafiają do `src/data/constants.ts`. Codex nie wymyśla liczb. |
| P6 | **Nieskończoność by design** | Po finale fabuły gra skaluje się bez końca (warstwa 3 prestiżu + softcapy). Żaden system nie może mieć twardego sufitu. |
| P7 | **Save jest święty** | Wersjonowane savy + migracje od wersji 0.1. Aktualizacja gry nigdy nie psuje postępu. Save z demo importuje się do pełnej wersji. |

## 3. Platformy i dystrybucja

| Wydanie | Platforma | Zakres | Technologia |
|---------|-----------|--------|-------------|
| **Demo** | Przeglądarka (itch.io embed / własna strona) | Akt 0 + Akt 1, do pierwszego REWRITE, ery E1–E2 | Ten sam kod, build z flagą `VITE_EDITION=demo` |
| **Pełna gra** | Instalowana na PC (Windows/macOS/Linux) | Całość + endless | Ten sam kod w opakowaniu **Tauri 2** (rekomendacja; fallback: Electron) — szczegóły `11-wydania.md` |

Kluczowe: **jedna baza kodu**. Warstwa `platform/` abstrahuje różnice (zapis: localStorage vs pliki na dysku; okno; auto-update). Demo to nie osobny projekt, tylko build-time gating contentu.

Dlaczego Tauri, a nie Electron: instalator ~10 MB vs ~150 MB, niższe zużycie RAM, natywne webview. Koszt: toolchain Rust przy buildzie (ale kodu Rust nie piszemy — sam boilerplate). Jeśli build Tauri okaże się problemem, przełączenie na Electron to wymiana warstwy `platform/desktop` (zaplanowana w architekturze).

## 4. Zakres

### 4.1 W zakresie (full game 1.0)
- Kampania 6 aktów, ~50–60h do finału (pacing: `03-balans.md §8`).
- 10 er technologicznych (generacje modeli AI), 26 generatorów, ~60 unikalnych upgrade'ów + upgrade'y formułowe, drzewko researchu 30 węzłów, ~30 szablonów projektów, ~50 achievementów (`09-content.md`).
- Prestiż: REWRITE → EXIT → SINGULARITY LOOP (`04-prestiz.md`).
- Systemy: produkcja kodu, projekty/shipping, hype, dług techniczny, bugi/incydenty, compute jako capacity, automatyzacja (`02-rozgrywka.md`).
- Fabuła przez wiadomości (mail/chat/feed) — ~80 eventów (`05-fabula.md`).
- Offline progress, autosave, export/import sava, statystyki, ustawienia, achievementy.
- i18n: gra po angielsku, cały tekst przez warstwę lokalizacji (PL jako przyszły language pack).
- Dźwięk: subtelne UI bleeps generowane WebAudio (zero assetów audio).

### 4.2 Poza zakresem 1.0 (świadomie)
- Multiplayer, leaderboardy online, konta, telemetria sieciowa.
- Mobile (layout responsywny tak, ale bez wydania mobilnego).
- Steam-specyficzne integracje (achievementy Steam itd.) — przygotowane miejsce, realizacja po 1.0.
- Grafika bitmapowa/canvas-art — oprawa jest w 100% DOM/CSS/SVG proceduralne.

### 4.3 Możliwy rozwój po 1.0 (architektura ma to umożliwiać)
Nowe ery i akty epilogu, content packi (nowe drzewka, challenge runs), sezonowe eventy, mod-friendly format danych, PL lokalizacja. Proces: `11-wydania.md §5`.

## 5. Gracz docelowy i odniesienia

- Fani FACEMINER ([recenzja bitsnpixels](https://bitsnpixels.org/p/faceminer-review-2025-idle-game-capitalism-climate-crisis), [thereviewgeek](https://www.thereviewgeek.com/faceminer-gamereview/), [IncrementalDB](https://www.incrementaldb.com/game/faceminer)) — czyli gracze ceniący idle z **klimatem i fabułą**, nie tylko liczbami.
- Fani głębi: Universal Paperclips (arc narracyjny AI!), Antimatter Dimensions (warstwy prestiżu), Cookie Clicker (czytelność), NGU/Melvor (długość).
- Z FACEMINER bierzemy: eskalację infrastruktury (tam: prąd/chłodzenie → u nas: compute/dług techniczny), narrację przez interfejs, dread. Naprawiamy: brak prestiżu, krótkość, "brak strategii" (zarzut z recenzji — u nas decyzje: alokacja compute, timing prestiżu, kolejność researchu, zarządzanie długiem).

## 6. Tytuł roboczy i nazewnictwo

- Tytuł roboczy: **VIBECODER** (alternatywy do decyzji przed premierą: `SHIP IT`, `PROMPT./`, `/dev/vibe`, `GOLEM.EXE`).
- Fikcyjne nazwy modeli/firm (bez prawdziwych marek): modele er (E1→E10) to PARROT-1, MUSE, GOLEM, HYDRA, ORACLE, TITAN, DEMIURGE, OUROBOROS, BASILISK, OMEGA (`09-content.md §2`). Firmy: Mindforge Labs (dostawca AI), Meridian Capital (inwestor), TensorCorp (rywal).
- W kodzie i danych wszystko po angielsku; teksty gry przez i18n (`07-architektura.md §8`).

## 7. Kryteria sukcesu (mierzalne)

1. Pierwsze REWRITE osiągalne w ~2,5–3h aktywnej gry (sim w `10-jakosc.md §3` to weryfikuje).
2. Finał fabuły: 50–60h. Endless: brak ściany progresu przez kolejne 100h+ symulacji.
3. Idle CPU < 3%, frame < 16 ms, RAM stabilny po 8h sesji (budżety: `07-architektura.md §9`).
4. Demo → pełna wersja: import sava działa.
5. Aktualizacja 1.0 → 1.x nie psuje żadnego sava (testy migracji w CI).

## 8. Słownik (spójność terminów w kodzie i docach)

| Termin | W kodzie | Znaczenie |
|--------|----------|-----------|
| LoC | `loc` | Lines of Code — podstawowy zasób produkcji |
| Money | `money` | Waluta $ z przychodów produktów |
| Compute | `compute` | Pojemność (cap) na aktywnych agentów, z hardware |
| Hype | `hype` | Mnożnik przychodu, zanika do 1× |
| Tech Debt | `debt` | Zasób negatywny, obniża wydajność, rodzi bugi |
| Research Points | `rp` | Waluta drzewka researchu |
| Insight | `insight` | Waluta prestiżu 1 (REWRITE) |
| Equity | `equity` | Waluta prestiżu 2 (EXIT) |
| Paradox | `paradox` | Waluta prestiżu 3 (SINGULARITY LOOP / endless) |
| Agent | `generator` | Jednostka produkująca LoC/s (odpowiednik "building") |
| Project | `project` | Zlecenie/produkt: koszt LoC → payout + przychód pasywny |
| Era | `era` | Generacja modelu AI; bramka contentu E1–E10 |
| Shipping | `ship` | Ukończenie projektu |
| Rewrite | `rewrite` | Prestiż warstwy 1 |
| Exit | `exit` | Prestiż warstwy 2 |
| Iteration | `iteration` | Pętla endless (prestiż 3) |
