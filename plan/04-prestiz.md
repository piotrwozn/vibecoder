# 04 — Prestiż: REWRITE → EXIT → SINGULARITY LOOP

> Trzy warstwy. Każda resetuje więcej, daje trwalsze bonusy i ma uzasadnienie fabularne (`05-fabula.md`). FACEMINER nie miał prestiżu — to nasza główna przewaga strukturalna.

## 1. Przegląd warstw

| Warstwa | Nazwa diegetyczna | Co resetuje | Co zostaje | Waluta | Pierwszy raz |
|---------|-------------------|-------------|------------|--------|--------------|
| 1 | **REWRITE** ("przepisujemy od zera, tym razem dobrze") | LoC, $, agenci, hardware, projekty, debt, hype, era→E1 | RP + research, Insight, Equity, achievementy, fabuła | **Insight** | ~2–3h |
| 2 | **EXIT** (sprzedaż firmy / acquihire) | wszystko z W1 + Insight i jego drzewko + research/RP | Equity + perki Equity, fabuła, achievementy | **Equity** | ~18–22h |
| 3 | **ITERATION** (pętla osobliwości, po finale fabuły) | wszystko z W2 + Equity | Paradox, meta-modyfikatory, kosmetyka | **Paradox** | po finale (~60h+) |

## 2. Warstwa 1 — REWRITE

### 2.1 Fantazja
Klasyk dev-kultury: "ten kod się nie da utrzymać, przepisujemy". Fabularnie: nowy framework, nowy hype-stack. Ekran REWRITE stylizowany na `git init` + spadające linie starego repo.

### 2.2 Wzory
```
insightGain = floor( (lifetimeLoC / 1e7) ^ 0.42 )        // lifetimeLoC od ostatniego REWRITE? NIE — od ostatniego EXIT, patrz niżej
insightMult (globalny, LoC i $) = (1 + insight) ^ 0.75
```
> Dzielnik 1e7 skalibrowany symulacją; próg 18 Insight = 9,5e9 LoC. Finalna kalibracja simem w M2+ (`10 §3`).
- Licznik `lifetimeLoC` liczy się od ostatniego **EXIT** (kumulacja między rewrite'ami) → każdy kolejny REWRITE w ramach jednego "życia firmy" daje przyrost, ale malejący → naturalna zachęta do pchania dalej zamiast farmienia tego samego progu.
- Próg sensowności: UI pokazuje "REWRITE now: +N Insight". Przycisk aktywny od `insightGain ≥ 18` pierwszego razu (potem ≥ +25% obecnego stanu — anty-klikanie prestiżu co 5 min).
- Target pacingu: pierwszy REWRITE +5–8 Insight; w Akcie 2 rewrite co ~60–90 min.

### 2.3 Drzewko Insight (25 węzłów, pełna lista `09 §8`)
Wydawanie Insight = trwałe perki (do EXIT). Gałęzie:
- **Velocity:** +% LoC, start z N agentami po rewrite, tańsi agenci.
- **Capital:** +% $, start z kapitałem, lepsze payouty, hype trwalszy.
- **Craft:** mniej debt, lepszy quality, auto-QA wcześniej, offline cap+.
- Węzły kluczowe (gating QoL): `keep_automation` (automatyzacje przeżywają rewrite), `era_skip` (start w E2/E3/E4), `project_memory` (plansza projektów pamięta tier).

Koszty węzłów: 5 → 500 Insight (geometrycznie w głąb gałęzi). Suma wszystkich: ~3000 Insight (nieosiągalne przed pierwszym EXIT — celowo, wybory > kompletowanie).

## 3. Warstwa 2 — EXIT

### 3.1 Fantazja
Sprzedajesz firmę (TensorCorp? Meridian? fabuła daje opcje). Dostajesz **Equity**. Zaczynasz "nowy startup" w świecie, który pamięta twoją legendę.

### 3.2 Wzory
```
equityGain = floor( (totalInsightEarned_thisRun / 25) ^ 0.6 )     // totalInsightEarned od ostatniego EXIT
equityMult (globalny) = 1 + 0.30 × equity ^ 0.7
```
> Przy progu 220 Insight: gain = (8.8)^0.6 ≈ 3 — zgodne z targetem 3–5; sensowny sim wychodzi od ~5 Equity zamiast farmić do 10+.
- Warunek odblokowania 1. EXIT: event fabularny Aktu 3 (oferta przejęcia) + ≥ 220 Insight earned.
- Target: 1. EXIT = 3–5 Equity; kampania zwykle robi 1–2 EXIT-y, a kolejne resetowe decyzje przechodzą do endless.

### 3.3 Perki Equity (15 pozycji, lista `09 §9`)
Trwałe na zawsze (przeżywają wszystko poza twardym resetem sava):
- **Founder's Instinct:** RP nie resetuje się przy EXIT (kupowalne raz — zmienia regułę z `02 §2.7`).
- **Angel Network:** start po EXIT z mnożnikiem $ ×10 przez pierwszą godzinę.
- **Serial Founder:** `era_skip` działa po EXIT.
- **Board Seat:** odblokowuje **run modifiers** (challenge runs: "No-Click", "Debt Storm", "Indie Dev" — własne mnożniki nagród Equity ×1,5–3).
- Resztę projektować jako QoL + otwieracze buildów, nie czyste cyfry.

## 4. Warstwa 3 — SINGULARITY LOOP (endless)

### 4.1 Fantazja
Po finale fabuły (`05 §6`): pętla. Model OMEGA forkuje rzeczywistość — każda ITERATION to "kolejny przebieg symulacji". Estetyka subtelnie się gliczuje (kosmetyka za Paradox).

### 4.2 Wzory
```
warunek ITERATION k→k+1: locRate ≥ 10^(35 + 15k) utrzymane 10 min   // = próg softcapu z 03 §9
paradoxGain = 2^k                                   // rośnie wykładniczo z głębokością pętli
paradoxMult = (1 + paradox) ^ 0.5                   // globalny
efekt pętli: softcap LoC przesunięty o +15 wykładnika; koszty bazowe wszystkiego ×10^(5k); produkcja bazowa ×2^(3k)
```
Netto: każda pętla wykonalna, kolejna wymaga przebudowy strategii (inne drzewka, inne run modifiers). Brak końca by design; statystyka "deepest iteration" to lokalny "wynik".

### 4.3 Sklep Paradox
Meta-ulepszenia (działają wszędzie): +sloty automatyzacji reguł (mini-skrypty "if debt>X then refactor"), kosmetyka (motywy terminala, glitch-skiny), mnożniki startowe, "Echoes" — fragmenty alternatywnych dialogów fabularnych (nagroda dla lore-hunterów).

## 5. Stałe prestiżu (do `constants.ts`)

```ts
export const PRESTIGE = {
  INSIGHT_DIV: 1e7, INSIGHT_EXP: 0.42, INSIGHT_MULT_EXP: 0.75,
  REWRITE_MIN_FIRST: 18, REWRITE_MIN_GAIN_RATIO: 0.25,
  EQUITY_DIV: 25, EQUITY_EXP: 0.6, EQUITY_MULT_K: 0.30, EQUITY_MULT_EXP: 0.7,
  EXIT_MIN_INSIGHT: 220,
  PARADOX_BASE: 2, PARADOX_MULT_EXP: 0.5,
  ITER_SOFTCAP_BASE_E: 35, ITER_SOFTCAP_STEP_E: 15, ITER_HOLD_S: 600,
  ITER_COST_E_PER_K: 5, ITER_PROD_POW_PER_K: 3,
} as const;
```

## 6. UX prestiżu (krytyczne — tu idle gry umierają)

- Ekran każdej warstwy pokazuje: **co dokładnie tracisz / co zyskujesz / prognozę** ("po REWRITE wrócisz tu w ~20 min, będziesz ×2,3 szybszy").
- Pierwszy REWRITE jest **eventem fabularnym z poradnikiem** (`05 §3`, event `act1_rewrite_intro`) — gracz nie może go przegapić ani zrobić przypadkiem (modal z potwierdzeniem + checkbox przy późniejszych "nie pytaj").
- Statystyki per warstwa: liczba resetów, czasy, rekordy (ekran Stats).
- Po prestiżu: sekwencja "boot" (2–3 s animacji terminala) — rytuał, nie loading.
