# 03 — Balans: wzory, stałe, pacing

> JEDYNE źródło prawdy dla liczb. W kodzie: wszystkie stałe w `src/data/constants.ts`, wzory w `systems/`. Wartości startowe są **zweryfikowane symulacją** (`tools/sim` — patrz `10-jakosc.md §3`); tuning po playtestach zmienia TEN plik, potem kod.

## 0. Konwencje

- Liczby w grze: typ `Big` `{m: number, e: number}` = m × 10^e (spec `07 §6`).
- Czas: sekundy. Tick logiki: 10 Hz (dt = 0,1 s).
- `n` = liczba posiadanych sztuk, `lvl` = poziom.

## 1. Koszty — wzór uniwersalny

```
cost(n) = baseCost × growth^n          // koszt (n+1)-szej sztuki
bulkCost(n, k) = baseCost × growth^n × (growth^k − 1) / (growth − 1)
maxAffordable(n, budget): k = floor(log_growth(budget×(growth−1)/(baseCost×growth^n) + 1))
```

- Agenci: `growth` 1,10–1,15 (per typ, tabela `09 §3`; wyższe tiery = niższy growth).
- Hardware: `growth` 1,8–2,2 (skokowe, rzadkie zakupy). **Komponenty (M16, `§3.4`/`09 §4`):** PC `growth` 1,45–1,60 (poziomy skończone, kupowane często), serwer `growth` 2,0–2,2 (jak stare tiery).
- Upgrade'y unikalne: koszty stałe (tabela `09 §5`).
- Model ery E(k): koszt podany wprost w `09 §2` (skok ×250–2500 między erami, fabularne droższe).

## 2. Produkcja LoC

```
locRate = Σ_typ [ n_typ × baseRate_typ × milestoneMult_typ × synergyMult_typ ]
          × eraMult × upgradesMult × researchMult × debtEff × prestigeMult × achievMult

prestigeMult = insightMult × equityMult × paradoxMult     // wzory w 04
debtEff      = patrz §6
eraMult      = 1,5^(eraIndex−1)                            // pasywny bonus samego posiadania modelu
```

**Cache:** każdy człon mnożnika przeliczany TYLKO przy zdarzeniu zmieniającym go (zakup/odblokowanie/prestiż), nie co tick — `07 §9`.

## 3. Agenci

### 3.1 Parametry bazowe (pełna tabela `09 §3`)
Projektowane tak, by kolejny tier był wart zakupu przy ~25–50 sztukach poprzedniego:
```
baseRate_tier(t) ≈ baseRate(t−1) × 8
baseCost_tier(t) ≈ baseCost(t−1) × 12
```
W obrębie ery 2–3 agentów, między erami skok ×20–30 kosztu względem ostatniego agenta poprzedniej ery (wartości wiążące: `09 §3`).

### 3.2 Zużycie compute
`computeUse_typ` stałe per typ (tabela `09 §3`). Hardware capy dobrane tak, by ściana compute pojawiała się ~2× na erę (tabela `09 §4`).

### 3.3 Milestony formułowe (globalna mechanika)
```
progi: 10, 25, 50, 100, 250, 500, 1000, potem co 500
milestoneMult = 2^(liczba osiągniętych progów)
```
Zero ręcznego contentu; UI pokazuje pasek do następnego progu.

### 3.4 Hardware: compute z komponentów (M16)

Hardware = **cap compute** (capacity, nie produkcja — `02 §3`). Od M16 budowany z **komponentów** w dwóch fazach (model: `06 §16`, tabele: `09 §4`).

```
totalCap = HW_BASE_CAP + Σ_komponent capContribution(level)
capContribution(level) = 0 gdy level=0; firstLevelCap + (level−1) × capPerLevel gdy level>0
koszt poziomu (level → level+1) = baseCost × growth^level     // uniwersalny wzór §1, n = level
HW_BASE_CAP = 6                                                // goła maszyna startowa, bez komponentów
```

- **Faza 1 (PC):** każdy komponent ma skończony `maxLevel`; `×10/MAX` klampuje do `maxLevel`. Pełny tier PC daje zawsze **+10 compute**: CPU +2, RAM +2, SSD +1, PSU +0, Cooling +2, GPU +3. PSU jest kosztem/bramką/prądem, ale **nie dodaje compute**. Dla PC `firstLevelCap == capPerLevel`, więc wartość nie rośnie co upgrade. Σ zmaksowanych PC = **`HW_PC_MAX_CAP = 182`** (CPU 40 + GPU 60 + RAM 32 + PSU 0 + Cooling 32 + SSD 12 + baza 6). Pełny build PC ≈ **$7,2 mln** — wypada na styku E2→E3 (tam, gdzie w starym balansie zaczynała się serwerownia).
- **Bramka fazy 2:** `pcComplete` = wszystkie komponenty PC na `maxLevel`. Dopiero wtedy odblokowuje się ścieżka serwerowa (zgodnie z wizją: „zmaksuj PC, potem buduj serwer").
- **Faza 2 (serwer):** moduły compute mają `maxLevel = ∞` (cap ograniczany **kosztem**, nie sufitem — filar P6). Pełny tier serwera daje zawsze **+20 compute**: rack/obudowa +0, board +4, PDU/PSU +0, cooling +4, net +4 i jeden moduł compute +8. **Obudowy** (`isEnclosure = true`, np. pusta szafa) dają `capPerLevel = 0` — są prerekwizytem/bramką kolejnych modułów i skalą wizualną, same nie dają compute.
- Ściana compute nadal ~2×/era (`§3.2`); wartości serwera są zakotwiczone w starych tierach (migracja `09 §4`), więc rytm „wall & release" zachowany. Wartości wstępne — tuning po simie (`10 §3`).

## 4. Klik PROMPT

```
clickPower = clickBase × clickUpgrades × (1 + clickSynergy × locRate × 1s)
clickBase = 1 LoC
clickSynergy = 0,02 (→ klik ≈ 2% sekundy produkcji + baza)   // research podnosi do 0,10
FLOW: pasek +8%/klik, −20%/s gdy brak klika po 5 s; przy 100%: kliki ×5 przez 30 s, potem reset paska
```

## 5. Projekty, przychód, hype

### 5.1 Projekt (szablony `09 §7`)
```
costLoC(tier)  ≈ 30 s × locRate oczekiwany dla tiera     // wartości wpisane na sztywno w tabeli
payout$        ≈ costLoC × valueRatio (0,45–1,5 zależnie od szablonu; E1/E2 celowo niżej)
costStart      = costLoC × (1 + projectsStarted × REVENUE_RATIO) × (1 + templateStarted × FLOW_GAIN)
revenue$/s     ≈ payout × 0,004                           // zwrot inwestycji ~250 s pasywnie
buildTime      = 15–120 s (tier), −% z researchu
rpReward       = 1–3 × tier (tylko pierwsze N shipów szablonu)
```

### 5.2 Przychód globalny
```
income$ = Σ produkty [ revenue_i × bugPenalty_i ] × hype × prestigeMult × upgradesMult
bugPenalty = 0,4 gdy bug aktywny na produkcie, 1,0 po naprawie
shownNetIncome$/s = income$/s − powerBill$/s − auroraHosting$/s
```

### 5.3 Hype
```
ship: hype += 0,15 × tier (mały) … 1,0 (duży launch fabularny)
zanik: hype(t+dt) = 1 + (hype(t) − 1) × exp(−dt/τ),  τ = 90 s
cap bazowy: 5×; research/perki: cap do 10×, τ do 300 s, podłoga hype 1,5×
```

## 6. Tech Debt

```
przyrost:  dDebt = locRate × debtFactor × (1 − quality) × dt
debtFactor = 0,01;  quality = 0 startowo, rośnie z researchem Quality do 0,9
wydajność: debtEff = 1 / (1 + debt/D0)^0,35,  D0 = 1000 × eraMult^2  (skaluje się z erą)
bugi:      co 60 s test: P(bug) = min(0,25, debt/(D0×20)) → bug na losowym produkcie
Refactor:  projekt specjalny, koszt = 60 s produkcji, czas 30 s, efekt: debt ×= 0,4
QA agent:  pasywnie debt −0,5%/s per sztuka (tabela 09 §3)
```
Design target: gracz robi refactor co ~10–15 min w mid-game; ignorowanie debt przez godzinę = produkcja ~×0,5.

## 7. Rachunki operacyjne

```
powerBill$/s      = Σ hardwareLevel_i × powerRate_i + dedicatedAuroraServers × auroraServerPower
auroraHosting$/s  = hostedAuroraServers × AURORA_HOSTING_PER_SERVER_S
shownNetMoney$/s  = projectIncome$/s − powerBill$/s − auroraHosting$/s
```

- `powerRate_i` jest tabelą per hardware w `09 §4.4`.
- Hardware UI pokazuje koszt następnego poziomu jako `−powerRate_i $/s`; pełny jeden tier PC kosztuje łącznie **10 $/s**, a serwery trzymają tę samą ostrą skalę rachunków.
- Tier gate zasilania: poziom 1 części jest startowy, ale zakup poziomu `N ≥ 2` dla PC części innych niż PSU wymaga `h_psu_pc ≥ min(N, h_psu_pc.maxLevel)`; analogicznie zakup poziomu `N ≥ 2` dla serwerowych części innych niż PSU/obudowy wymaga `h_srv_psu ≥ N`.
- `auroraServerPower` = suma stawek: `h_rack + h_srv_board + h_srv_psu + h_srv_cooling + h_srv_net + h_exotic_core` = **260 280 $/s**.
- Hosting Aurory = **2,0e29 $/s / serwer** (`09 §12`), bez upfrontu, można go kupić jako alternatywę dla własnego bundle'a.
- UI Money/s pokazuje wartość signed netto, również na minusie, żeby rachunki były czytelne.
- Rachunki odejmują Money co ticku, ale nigdy poniżej zera. Jeżeli gracz nie ma środków na pełny koszt operacyjny Aurory za tick, postęp Aurory pauzuje.

## 8. Offline

```
locOffline   = locRate(zapisany) × min(tOffline, offlineCap) × offlineEff
$Offline     = income(zapisany, hype=1) × min(tOffline, offlineCap) × offlineEff
offlineEff   = 1,0;  offlineCap = 8h (research: 12h, 24h)
auto-systemy: auto-ship symulowany zamkniętą formą (ile projektów = floor(t / cykl)), bez RNG
debt/bugi/hype: zamrożone offline; hype po powrocie = max(1, hype × 0,5)
```
Deterministyczne — żadnych pętli po sekundach (`07 §7`).

## 9. AURORA PROJECT true ending

Aurora jest po-finale OMEGA. OMEGA choice nadal odblokowuje ITERATION i flavor,
ale pełne ukończenie gry (`completeH` w simie od M17) = `aurora.completed`.

```
auroraProgress = Σ completedPhasePercent + currentPhaseProgress
phaseProgress += dt × activeServerRatio
activeServerRatio = min(1, (dedicatedServers + hostedServers) / requiredServers)
```

- Fazy i koszty są w `09 §12`.
- Każda faza wymaga opłaty upfront: `costLoC`, `costMoney`, a następnie czasu `workS`.
- Faza bez wymaganych serwerów ma `activeServerRatio=1`.
- Gdy wymagane serwery nie są spełnione albo billing Aurory nie jest opłacony, faza stoi.
- Pacing: po spłaszczeniu PC/serwer compute `sane 100h` nie musi kończyć OMEGA; stabilny wynik to midgame/Akt 3+. Aurora nadal ma dodawać **min. 20 h** po OMEGA, gdy true-ending route w końcu do niej dotrze.

## 10. Pacing kampanii (wolniejszy hardware, true ending po 100h+)

Tabela celów — sim ma trafiać w te okna ±30% (strategia "sensowny gracz", `10 §3`):

| Kamień | Czas skumulowany | Era | Wielkość liczb (LoC/s) |
|--------|------------------|-----|------------------------|
| Tutorial done (Akt 0) | 5–15 min | E1 | 10¹ |
| Pierwszy REWRITE | 2–3h | E2 | 10⁴ |
| Akt 1 finał | 2,5–4h | E2–E3 | 10⁶ |
| Akt 2 finał | 8–10h | E4 | 10¹⁰ |
| Pierwszy EXIT | 18–22h | E5 | 10¹³ |
| Akt 3 finał | 45–55h | E6 | 10¹⁸ |
| Akt 4 finał | 58–64h | E8 | 10²⁶ |
| Drugi/trzeci EXIT | po finale / endless | E7–E9 | — |
| Akt 5 finał OMEGA (story end) | 100h+ | E10 | 10³⁵⁺ |
| AURORA PROJECT true ending | po OMEGA + 20h+ | E10+ | post-finał |
| Endless (ITERATION 1+) | po OMEGA / obok Aurory | E10+ | bez sufitu |

Mechanizm dopasowania tempa: koszty er (`09 §2`) + progi Insight (`04 §2`) to główne pokrętła. NIE strzelamy w te liczby ręcznie — sim liczy, my korygujemy stałe.

## 11. Softcapy i endless

```
locRate efektywny powyżej 10^(35 + 15×iteration):  nadwyżka^0,9   // łagodny softcap przesuwany przez ITERATION
koszt agentów powyżej n=1000: growth efektywny += 0,01 co kolejne 500 sztuk (anti-degeneracja MAX-buy)
paradoxMult i przesuwanie softcapów: 04 §4
```
Zasada: żadnych twardych capów (filar P6); wszystko skaluje się potęgowo z malejącym wykładnikiem.

## 12. Notacja liczb (format `07 §6`)

- < 1e6: pełne z separatorami (`123,456`)
- 1e6–1e15: sufiksy `M, B, T` z 3 cyframi znaczącymi (`4.20B`)
- ≥ 1e15: naukowa `1.23e18` (default) lub sufiksy literowe `aa, ab…` (ustawienie)
- Czas: `2h 15m`, `3d 4h`

## 13. Stałe startowe (do `constants.ts`)

```ts
export const C = {
  TICK_HZ: 10,
  CLICK_BASE: 1, CLICK_SYNERGY: 0.02,
  FLOW_GAIN: 0.08, FLOW_DECAY: 0.20, FLOW_MULT: 5, FLOW_DURATION: 30,
  HYPE_TAU: 90, HYPE_CAP: 5,
  DEBT_FACTOR: 0.01, DEBT_EFF_EXP: 0.35, DEBT_D0_BASE: 1000,
  BUG_CHECK_INTERVAL: 60, BUG_P_MAX: 0.25, BUG_PENALTY: 0.4, BUG_MAX_ACTIVE: 5,
  REVENUE_RATIO: 0.004,
  OFFLINE_CAP_H: 8, OFFLINE_HYPE_KEEP: 0.5,
  ERA_MULT: 1.5,
  HW_BASE_CAP: 6, HW_PC_MAX_CAP: 182, HW_PHASE2_UNLOCK: 'pcComplete',   // hardware komponentowy §3.4 / 09 §4
  MILESTONES: [10, 25, 50, 100, 250, 500, 1000], MILESTONE_STEP_AFTER: 500,
  PROJECT_REFRESH_S: 60,
  SOFTCAP_LOC_EXP: 0.9, SOFTCAP_LOC_AT_E: 35, SOFTCAP_SHIFT_PER_ITER: 15,
} as const;
```
(Wartości prestiżu: `04 §5`. Tabele per-encja: `09`.)
