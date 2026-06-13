# 10 — Jakość: testy, symulator balansu, narzędzia, QA

## 1. `npm run check` (bramka każdego commita — `08` DoD)
`tsc --noEmit` → `eslint` → `vitest run` → `node dev/validate` . Czerwone = stop.

## 2. Walidator contentu (`src/dev/validate.ts`, uruchamialny w CI)
Sprawdza dane z `data/` strukturalnie — łapie literówki zanim staną się bugami:
- unikalność wszystkich id; prefiksy zgodne z `09 §1`,
- każdy `unlock`/`trigger` odwołuje się do istniejących id/flag (graf referencji bez wiszących krawędzi),
- monotoniczność: koszty agentów/hardware rosną z tierem; `growth` w zakresach z `03 §1`,
- każdy klucz i18n użyty w danych istnieje w `en.json` i odwrotnie (osierocone klucze = warning),
- każdy event fabularny osiągalny (warunek nie jest sprzeczny, np. `era>=3` przy `act:1`),
- brak stringów UI poza i18n (skan `ui/` po literałach).

## 3. Symulator balansu (`tools/sim`) — najważniejsze narzędzie projektu
Headless: importuje `systems/` + `data/` (bez DOM — wymusza architekturę `07 §12`), kroki po 1 s (nie 0,1 — szybkość), strategie botów:
- **sane** — kupuje co ma najlepszy ROI, refactor przy debtEff<0,8, rewrite gdy +50% insight, gra "aktywnie" 2h/dzień + idle;
- **idle_only** — bez klików, logowanie raz/8h;
- **maxer** — gra optymalnie non stop (dolna granica czasów).

Wyjście: CSV (czas, LoC/s, $, era, rewrites, exits) + raport kamieni vs tabela `03 §8`. Uruchomienie: `npm run sim -- --strategy sane --hours 80`.
**Kryterium:** kamienie pacingu w oknie ±30%. Poza oknem → kręcimy stałymi (kolejność pokręteł: koszty er → progi insight → growth agentów) i commitujemy nowy baseline CSV.
Drugi tryb: `--sweep` — przebieg po siatce 2–3 stałych, tabela wyników (do tuningu bez zgadywania).

## 4. Testy save-compat (krytyczne dla filaru P7)
`tests/fixtures/saves/v1.json, v2.json…` — po KAŻDYM wydaniu dodajemy zamrożony save tej wersji. Test: każdy fixture → migracje → walidacja stanu → boot headless 60 s bez błędu. Dodatkowo test odporności: save uszkodzony (ucięty JSON, brakujące pola, NaN) → gra startuje z naprawą + raportem, nigdy crash.

## 5. Testy wydajności
- **Mikro:** benchmark w vitest: `tick()` na savie late-game (fixture z sim po 60h) < 2 ms; `bignum` ops bez alokacji (licznik w teście).
- **Soak:** scenariusz ręczny przed wydaniem: 8h na ×100 time-warp z otwartym dev-panelem; heap płaski (zrzut co godzinę), FPS stabilny. Checklist w §6.
- **Budżety** z `07 §9` mierzone w dev-panelu (ms/tick, ms/frame, heap) — regresja >20% blokuje merge.

## 6. QA checklist przedwydaniowa (skrót; pełną listę utrzymywać w repo)
1. Świeży start → Akt 0 płynny, brak soft-locków (3 osoby/persony: klikacz, czytacz, ignorant tutoriali).
2. Reload w każdym ekranie = stan identyczny. Export → wipe → import = identyczny.
3. Demo: gating działa, nic z E3+ nie wycieka w UI, ekran upsell, eksport sava.
4. Desktop: instalacja na czystym systemie, save w appData, backupy rotują, update z poprzedniej wersji, uninstall nie kasuje sava.
5. Offline 1 min / 1h / 30h (cap) / zmiana czasu systemowego wstecz (zegar cofnięty → brak ujemnych przyrostów!).
6. a11y: nawigacja klawiaturą wszystkich ekranów, reduced-motion, kontrast.
7. Finał + wszystkie 3 endingi + wejście w ITERATION (save przed finałem w fixtures).
8. 30 min gry z dźwiękiem — nic nie trzeszczy, mute działa.

## 7. Definicja buga balansowego
"Strategia degenerate": jeśli sim/gracz znajdzie pętlę dającą >×10 przewagi nad 'sane' (np. spam refresh planszy, rewrite co 3 min) — to bug P1: gasić mechaniką (cooldown/próg), nie nerfem liczb, i dopisać strategię do sima jako regresję.
