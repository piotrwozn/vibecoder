# 02 — Rozgrywka: pętla, zasoby, systemy

> Liczby i wzory TYLKO w `03-balans.md`. Tu jest projekt mechanik. Dane contentu: `09-content.md`.

## 1. Core loop

```
        ┌──────────────────────────────────────────────────┐
        ▼                                                  │
[PROMPT (klik)] ──► LoC ──► [PROJEKTY: ship] ──► Money ────┤
        ▲                        │                         │
        │                        ├─► Hype (mnożnik $)      │
[AGENCI: LoC/s] ◄── kupowani za Money                      │
        ▲                        └─► RP (research)         │
        │                                                  │
[COMPUTE cap] ◄── hardware za Money                        │
        │                                                  │
[TECH DEBT rośnie z produkcją] ──► bugi, spadek wydajności │
        │                                                  │
        └─► [REFACTOR / QA] ── pochłania LoC/czas ─────────┘

Meta: REWRITE (reset → Insight) → EXIT (reset → Equity) → ITERATION (endless)

Post-finał: AURORA PROJECT (true ending) — po wyborze OMEGA gracz odblokowuje
megaprojekt, który buduje wieloagentową nakładkę AI robiącą pracę za niego.
Aurora jest osobnym, trwałym celem 0→100%, przeżywa REWRITE/EXIT/ITERATION i
zamyka grę dopiero po ukończeniu.
```

Rytm decyzji gracza (to jest "strategia", której brakowało FACEMINER-owi):
1. **Sekundy:** klikać prompt (early game), zbierać bugi, odpalać projekty.
2. **Minuty:** co kupić — agent vs hardware vs upgrade; który projekt z planszy wziąć; kiedy refactor.
3. **Godziny:** kolejność researchu, timing REWRITE (teraz czy za godzinę = 2× Insight?).
4. **Dziesiątki godzin:** budowa drzewka Insight, timing EXIT, wybory fabularne.

## 2. Zasoby — definicje i zachowanie

### 2.1 LoC (`loc`) — produkcja podstawowa
- Źródła: klik PROMPT, agenci (LoC/s), eventy.
- Zużycie: start projektów, refactor, niektóre upgrade'y/eventy.
- Rośnie do absurdalnych wartości (big numbers od początku — `07 §6`).

### 2.2 Money (`money`)
- Źródła: payout za ship, pasywny przychód z wydanych produktów ($/s), eventy fabularne.
- Zużycie: agenci, hardware, część upgrade'ów, rachunki za prąd/hosting oraz kroki Aurory.
- Przychód pasywny mnożony przez Hype i obniżany przez aktywne bugi.

### 2.3 Compute (`compute`) — capacity, odpowiednik prądu z FACEMINER
- **Nie jest produkowany — jest pojemnością.** Każdy typ agenta zużywa stałą ilość compute (tabela `09 §3`).
- Suma zużycia ≤ cap. Cap podnosi **hardware** (osobna ścieżka zakupów: laptop → gaming rig → serwer → rack → DC → … `09 §4`).
- Przekroczenie niemożliwe (UI blokuje zakup agenta i pokazuje "Insufficient compute" + skrót do sklepu hardware).
- Tworzy rytm: tanie agenty → ściana compute → drogi hardware → znów agenci. Klasyczny "wall & release".

### 2.3a Rachunki operacyjne (`billing`)
- Hardware nadal daje wyłącznie `compute cap`, ale od M17 generuje koszt operacyjny `$ / s`.
- Początek praktycznie 0; koszt rośnie z lepszym PC, serwerami i dedykowanymi serwerami Aurory.
- Hosting Aurory daje alternatywę dla własnych serwerów, ale ma wysoki `$ / s`; własny pełny serwer jest ekonomicznie lepszy, bo płaci tylko prąd.
- Rachunki nigdy nie robią ujemnych pieniędzy. Gdy nie da się opłacić kosztów Aurory, postęp Aurory pauzuje.

### 2.4 Hype (`hype`)
- Mnożnik przychodu $ (nie LoC). Bazowo 1×.
- +Hype za każdy ship (więcej za większe projekty), eventy fabularne, niektóre upgrade'y.
- Zanika wykładniczo do 1× (stała czasowa w `03 §5`). Late game: upgrade'y spowalniające zanik, research "Evergreen Marketing" dający trwałą podłogę hype.
- Cel designowy: nagradza aktywną grę (ship-chaining) bez karania idle.

### 2.5 Tech Debt (`debt`) — antagonista systemowy
- Rośnie automatycznie proporcjonalnie do produkcji LoC (im szybciej kodujesz, tym szybciej rośnie — vibecoding ma cenę; wzór `03 §6`).
- Skutki: (a) globalny mnożnik wydajności agentów < 1 rosnący z długiem, (b) co próg długu — ryzyko **bugów**.
- Redukcja: projekt specjalny **Refactor** (pochłania LoC, trwa, obniża debt), agenci QA (pasywna redukcja), research, perki Insight.
- Nigdy nie blokuje gry — asymptotycznie dusi, zmusza do cyklu refactorów. To analog prądu/chłodzenia z FACEMINER, ale aktywniejszy.

### 2.6 Bugi i incydenty
- **Bug:** pojawia się losowo (szansa rośnie z debt) na wydanym produkcie → jego przychód spada o X% do naprawy. Naprawa: klik (instant, kosztuje trochę LoC) albo auto-QA.
- **Incydent (rzadki, od Aktu 3):** "prod down" — globalny przychód −50% na N minut albo do interwencji; daje wybór A/B z różnymi kosztami (mini-decyzja, czasem hook fabularny).
- Limit jednoczesnych bugów (żeby nie spamować): max 5 widocznych, nadmiar się kolejkuje.

### 2.7 Research Points (`rp`)
- Źródła: pierwsze shipy każdego szablonu projektu, milestony (np. 10/100/1000 shipów), niektóre eventy.
- Zużycie: drzewko researchu (3 gałęzie × 10 węzłów — `09 §6`): Throughput (produkcja), Quality (debt/bugi), Automation (QoL).
- RP **przeżywa REWRITE**, resetuje się przy EXIT (kupione węzły wracają do puli — patrz `04 §3`).

### 2.8 Waluty prestiżu
`insight`, `equity`, `paradox` — definicje i wzory w `04-prestiz.md`.

## 3. Akcja aktywna: PROMPT

- Wielki przycisk/pole terminala. Klik = burst LoC (wzór `03 §4`: skaluje się z produkcją pasywną, więc nigdy nie jest bezużyteczny, ale nie jest obowiązkowy).
- **Flow meter:** klikanie w rytmie (≥1 klik/1,5 s) buduje pasek combo 0–100%; przy 100% — "FLOW STATE" 30 s: kliki ×5, lekka poświata UI. Wypada z flow po 5 s bez kliku.
- Anti-autoclicker nie jest potrzebny (single player), ale flow nagradza rytm, nie CPS — przyjazne dla nadgarstków.
- Upgrade'y klika: "Better prompts", "Snippet library", multipliery + % produkcji pasywnej dodawany do klika.

## 4. Agenci (generatory)

- 26 typów w 10 erach (`09 §3`). Każdy: koszt bazowy (Money), wzrost kosztu, baza LoC/s, zużycie compute, flavor.
- Kupno: pojedynczo / ×10 / ×100 / MAX (przeliczenia w `03 §3`).
- **Milestony formułowe:** każdy typ agenta ×2 produkcji przy 10/25/50/100/250/500/1000 posiadanych (mechanika globalna, zero ręcznego contentu — `03 §3.3`).
- Synergie (upgrade'y unikalne): np. "Pair Programming" — agent T2 dostaje +1% za każdego T1 itd. (lista `09 §5`).
- Agenci NIE są kasowani przy zakupie hardware; hardware tylko podnosi cap.

## 5. Ery (E1–E10) — kręgosłup progresji

- Era = generacja modelu AI (PARROT-1 → … → OMEGA). Wejście w erę = **zakup modelu** (duży jednorazowy koszt Money + warunek fabularny/progresowy).
- Era odblokowuje: 2–3 nowych agentów, nowy tier hardware, nowe szablony projektów, porcję upgrade'ów, eventy fabularne.
- Pierwsze przejście ery: E1–E2 w demo; pełna gra E1–E10. Po prestiżu ery odblokowuje się szybciej (skip-perki w drzewku Insight).
- Era widoczna w UI jako "MODEL: GOLEM v3.1" w pasku statusu — diegetycznie.

## 6. Projekty i shipping

- **Plansza projektów:** 3 sloty ofert (5 po researchu) losowane z puli szablonów dostępnej ery. Odświeżenie: darmowe co 60 s albo instant za LoC.
- Projekt ma: koszt LoC (płatny z góry), czas builda (skracany researchem), payout $ (jednorazowy), przychód pasywny $/s (dożywotni, do bugów/zniszczenia fabularnego), bonusy (hype, RP, czasem unlock).
- **Sloty produktów:** liczba utrzymywanych produktów ograniczona (rośnie z erą/hardware). Nowy ship ponad limit = wybór, który stary produkt zarchiwizować (jego $/s znika). Decyzja portfolio.
- Typy szablonów (pełna lista `09 §7`): od "Todo App", "Landing Page" w E1 po "Planetary OS" w E10. Specjalne: **Refactor** (zawsze dostępny, redukuje debt), **Open Source** (0 $, dużo RP i hype), projekty fabularne (wymuszone eventami).
- Auto-ship (research/perki): automatycznie bierze projekty wg priorytetu ustawionego przez gracza (payout / $/s / RP).

### 6.1 AURORA PROJECT
- Po dowolnym wyborze OMEGA (`a5_12`) najpierw odpala się story `a5_13_aurora_seed`; dopiero jego efekt `aurora_seed_available` pozwala planszy projektów pokazać `p_aurora_seed`.
- `p_aurora_seed` jest projektem odblokowującym: kosztuje LoC i czas, ale nie daje payoutu ani portfolio revenue; po shipie ustawia `aurora_unlocked`.
- Odblokowana Aurora pojawia się jako osobna apka na pulpicie, poza zwykłą apką Projects.
- Aurora składa się z faz 0→100% (`09 §12`): każda faza wymaga kosztu LoC, kosztu $, czasu pracy i minimalnej liczby serwerów Aurora.
- Serwer Aurora można dostarczyć na dwa sposoby:
  - **własny serwer:** poświęca 1 pełny bundle `h_rack+h_srv_board+h_srv_psu+h_srv_cooling+h_srv_net+h_exotic_core` przy `h_dyson_frame≥1`; bundle znika z normalnego compute i zostaje w Aurorze na zawsze,
  - **hosting:** dodaje slot serwera bez zabierania compute, ale pobiera koszt `$ / s`.
- Najtańsza ścieżka true ending wymaga 8 własnych serwerów Aurora-grade.

## 7. Automatyzacja (QoL jako progresja)

Odblokowywana stopniowo (research Automation + perki prestiżu), w tej kolejności design-owo:
1. Auto-prompt (słaby autoclicker — % produkcji)
2. Auto-buy agentów (per typ, toggle, "keep 10% cash")
3. Auto-fix bugów (QA bot, z opóźnieniem)
4. Auto-refresh planszy projektów
5. Auto-ship wg priorytetu
6. Auto-refactor przy progu debt (suwak progu)
7. Auto-buy hardware
8. (endless) Auto-REWRITE wg reguły gracza

Zasada: wszystko, co gracz robił ręcznie 100×, w końcu się automatyzuje — ale automatyzacja jest nagrodą, nie domyślnością.

## 8. Odblokowania i widoczność (unlock system)

- Każda encja contentu ma warunek `unlock` (predykat na stanie gry — `07 §5`).
- UI pokazuje encje: ukryte → zapowiedziane (sylwetka "???" gdy blisko warunku, np. 50% progu) → odblokowane. Buduje apetyt jak w Cookie Clickerze.
- Nic nie znika z UI po odblokowaniu (poza erami wstecz — stare agenty zostają, są wygaszane wizualnie gdy bezużyteczne, z opcją "hide obsolete").

## 9. Offline progress

- Po powrocie: modal "While you were away" — zarobione LoC/$, naliczone shipy auto-ship, debt NIE rośnie offline (życzliwość), bugi nie spawnują się offline.
- Cap czasu offline: bazowo 8h, rozszerzany researchem/perkami do 24h. Wzory `03 §7`, implementacja deterministyczna `07 §7`.
- Demo: offline działa identycznie (niech demo smakuje pełną pętlą).

## 10. Czego NIE robimy (anty-zakres mechanik)

- Brak energii/stamina ograniczającej grę aktywną.
- Brak timerów gacha/fomo, brak walut premium — to gra premium/demo, nie f2p.
- Brak minigier zręcznościowych (flow meter to maksimum aktywności).
- Brak losowości decydującej o progresie (RNG tylko w smaku: plansza projektów, bugi — zawsze z pity/limitami).

## 11. Mapa systemów → moduły kodu

| System | Moduł (`07-architektura.md §4`) |
|--------|--------------------------------|
| Produkcja LoC, mnożniki | `systems/production.ts` |
| Klik + flow | `systems/prompt.ts` |
| Projekty/shipping/sloty | `systems/projects.ts` |
| Hype | `systems/hype.ts` |
| Debt + bugi + incydenty | `systems/debt.ts` |
| Compute/hardware | `systems/compute.ts` |
| Research | `systems/research.ts` |
| Unlocki | `systems/unlocks.ts` |
| Automatyzacja | `systems/automation.ts` |
| Prestiż ×3 | `systems/prestige.ts` |
| Fabuła/eventy | `systems/story.ts` |
| Offline | `systems/offline.ts` |
