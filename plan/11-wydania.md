# 11 — Wydania, dystrybucja, rozwój po premierze

## 1. Wydania

| Kanał | Co | Build |
|-------|----|----|
| **Web demo** | itch.io (embed HTML) i/lub własna strona | `VITE_EDITION=demo npm run build` → statyczny folder, zip na itch |
| **Pełna gra desktop** | Windows `.msi/.exe`, macOS `.dmg`, Linux `.AppImage/.deb` | Tauri 2: `npm run tauri build` w CI (matrix 3 OS) |
| (później) | Steam | ten sam build Tauri + steamworks; decyzja po 1.0 |

Demo = marketing pełnej wersji: kończy się na finale Aktu 1 ekranem "Get the full game" + **eksport sava, który importuje pełna wersja** (silny motywator zakupu; mechanizm `07 §10`).

## 2. Wersjonowanie
- SemVer: `MAJOR.MINOR.PATCH` (1.0.0 = premiera). `SAVE_VERSION` (int) niezależny — bump tylko gdy zmienia się struktura sava; każda zmiana = migracja + fixture (`10 §4`).
- Changelog `CHANGELOG.md` + in-game "What's new" modal (raz po updacie, z i18n).
- Git tag per release; build CI z taga; artefakty w GitHub Releases.

## 3. Auto-update (desktop)
Tauri updater: manifest JSON na GitHub Releases/Pages, podpisy kluczem (wygenerować RAZ, trzymać bezpiecznie — utrata klucza = użytkownicy muszą reinstalować!). Update flow: cichy download → propozycja restartu (nigdy wymuszony restart w trakcie gry — idle gra "gra" cały czas). Web demo: cache-busting przez hash w nazwach plików (Vite default) + `<meta>` wersja.

## 4. Pipeline CI (GitHub Actions)
1. **PR:** `npm run check` + sim smoke (`--strategy sane --hours 5` — łapie katastrofy balansu).
2. **main:** jak wyżej + build web demo → deploy preview.
3. **tag v\*:** pełny sim (80h), build demo + matrix Tauri (Win/macOS/Linux), upload artefaktów, draft release z changelogiem.

## 5. Rozwój po premierze (wymaganie: gra ma rosnąć)

Architektura już to wspiera (filary P4/P6/P7). Proces dodawania contentu:
1. Nowa era/agenci/projekty: dopisać wiersze w `plan/09` → przepisać do `data/` → `validate` + sim → migracja sava NIE jest potrzebna (nowe id są addytywne).
2. Nowe eventy fabularne: `data/story/` + klucze i18n; warunek `iterationGte`/`exitsGte` pozwala celować w weteranów.
3. Nowe mechaniki: nowy moduł w `systems/` + pole w stanie → bump `SAVE_VERSION` + migracja z defaultem.

Pomysły do backlogu 1.x (kolejność wg sygnałów od graczy):
- **1.1:** PL lokalizacja (`pl.json` — architektura gotowa), 3. warstwa run modifiers, QoL z feedbacku.
- **1.2:** "Side gigs" — krótkie wyzwania tygodniowe (lokalne, bez serwera: seed z daty).
- **1.3:** Nowa era E11+ ("epilog: po OMEGA") + akt epilogu, nowe echoes.
- **2.0:** Steam + achievementy Steam + cloud saves (przez Steam, nie własny backend).

Zasady live-ops bez serwera: wszystko offline-first, zero kont, zero telemetrii sieciowej (opcjonalny "share stats" = eksport obrazka PNG z canvas — viral, prywatny).

## 6. Licencje i assety
- Fonty: JetBrains Mono (OFL), Inter (OFL) — vendorowane, licencje w `/licenses`.
- Zero assetów graficznych/audio z zewnątrz (wszystko proceduralne) → zero problemów licencyjnych.
- Nazwy modeli/firm fikcyjne (`01 §6`) — sprawdzić przed premierą, czy nie kolidują ze znakami towarowymi (szybki research nazw).

## 7. Ryzyka projektu i mitygacje

| Ryzyko | Mitygacja |
|--------|-----------|
| Balans 50h+ "na papierze" nie zagra | sim od M2, kamienie `03 §8` sprawdzane co milestone; tuning stałych, nie przepisywanie systemów |
| Scope creep contentu Aktów 2–5 | M9 ma twardy zakres = tabele z `09`; nowe pomysły → backlog 1.x |
| Tauri: problemy z buildem na czyimś OS | platform-layer wymienny na Electron (`07 §10`); decyzja najpóźniej w M12 |
| Wydajność DOM przy late-game | budżety od M2 w dev-panelu, soak testy; architektura dirty-flags od początku, nie "potem zoptymalizujemy" |
| Save corruption u graczy | atomic write + 3 backupy + naprawa zamiast odrzucenia (`07 §7`, `10 §4`) |
| Wypalenie solo-deva 😉 | milestony są małe i kończą się grywalnym buildem; po M5 gra jest już "grą" |
