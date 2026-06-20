# 06 — UI/UX i kierunek artystyczny

> Estetyka: **nowoczesne IDE/terminal** (decyzja z wizji). 100% DOM/CSS/SVG, zero bitmap, zero canvas (wyjątek: opcjonalny efekt tła §7). Implementacja: `07 §4` (ui/), budżety perf: `07 §9`.

## 1. Kierunek artystyczny

Gra wygląda jak **fikcyjny workspace developera w 202X**: dock aplikacji, panele à la VS Code/Linear/Vercel dashboard, terminal z żywym logiem commitów. Wszystko diegetyczne (filar P1): kupowanie agentów to "spawning processes", prestiż to ekran `git init`, fabuła przychodzi do inboxa i czatu.

Mood: ciemno, kontrastowo, neonowe akcenty używane *oszczędnie* (akcent = informacja, nie dekoracja). Im później w fabule, tym więcej subtelnych glitchy (Akt 4–5) — degradacja estetyki jako narzędzie narracji.

## 2. Design tokens (do `src/ui/theme.css` jako CSS custom properties)

```css
:root {
  /* tła — warstwy głębokości */
  --bg-0: #07090d;   /* tło aplikacji */
  --bg-1: #0c1016;   /* panele */
  --bg-2: #11161f;   /* karty, wiersze */
  --bg-3: #182030;   /* hover/aktywne */
  --border: #1f2937; --border-bright: #2e3d54;
  /* tekst */
  --fg-0: #e6edf7;   /* primary */
  --fg-1: #9fb0c7;   /* secondary */
  --fg-2: #5d6b80;   /* muted/disabled */
  /* akcenty */
  --acc: #46e2b4;        /* primary akcent — "terminal green", nowoczesny mint */
  --acc-2: #7c8cff;      /* secondary — indygo (research, prestiż W1) */
  --gold: #ffc86b;       /* money, payouty */
  --warn: #ffb224; --danger: #ff5d5d;     /* debt, bugi */
  --hype: #ff7ad9;       /* hype */
  --paradox: #b388ff;    /* endless */
  /* typografia */
  --font-mono: "JetBrains Mono", ui-monospace, monospace;  /* liczby, terminal, kod */
  --font-ui: "Inter", system-ui, sans-serif;               /* labelki, fabuła */
  /* geometria */
  --r-s: 6px; --r-m: 10px; --r-l: 14px;
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-6: 24px;
  --glow-acc: 0 0 12px color-mix(in srgb, var(--acc) 35%, transparent);
}
```
Fonty: JetBrains Mono + Inter **vendorowane lokalnie** (woff2 w repo — desktop działa offline; żadnych CDN-ów w runtime). Liczby zawsze mono + `font-variant-numeric: tabular-nums` (brak "skakania" przy tickach!).

## 3. Layout główny (desktop-first, breakpointy §8)

> ⚠️ **Aktualizacja UI (czerwiec 2026, sekcje §10–§16).** Top-level powłoka gry zmienia się z pojedynczego, stałego layoutu 3-kolumnowego na **metaforę pulpitu systemu operacyjnego**: ekran startowy → pulpit z ikonami → każda funkcja w osobnym **oknie**. Ten układ 3-kolumnowy (§3) **nie jest już ekranem głównym gry** — jego elementy zostają **rozdzielone**: terminal+prompt+„kod" trafiają do okna **Vibex** (§15), comms dock rozpada się na osobne apki Chat/Mail/Feed (§14), topbar zasobów zastępują **karteczki** (§13). Komponenty wspólne (§5), juice (§6), tokeny (§2), a11y (§8) i anti-patterns (§9) **obowiązują nadal wewnątrz okien**. Czytaj §3 i §10–§16 razem; przy konflikcie wygrywa §10–§16.

```
┌──┬───────────────────────────────┬──────────────────┐
│D │ TOPBAR: $ LoC compute hype    │ MODEL: GOLEM v3  │ ← zasoby + era, sticky
│O ├───────────────────────────────┴──────────────────┤
│C │                                │  COMMS DOCK      │
│K │   GŁÓWNY WIDOK (ekran z docka) │  (chat/mail/feed │
│  │                                │   — zakładki,    │
│⌄ │                                │   badge unread)  │
│  ├────────────────────────────────┤                  │
│  │ TERMINAL: commit log + PROMPT  │                  │
└──┴────────────────────────────────┴──────────────────┘
```
- **Dock (lewo, ikony):** Dev Floor (agenci+hardware) / Projects / Research / Rewrite+ / Stats / Achievements / Settings. Ikony SVG inline, badge przy nowych unlockach.
- **Terminal (dół, stała wysokość, zwijany):** przewijany log ("commits" od agentów — czysty flavor, ring buffer 200 linii) + wielki przycisk/pole **PROMPT** z flow-meterem.
- **Comms dock (prawo, zwijany):** fabuła. Nieprzeczytane = badge + delikatny pulse. Wiadomości wjeżdżają z animacją typing (skippable).
- Ekrany przełączane bez przeładowania (show/hide sekcji, nie re-render — `07 §9`).

## 4. Ekrany — wymagania funkcjonalne

| Ekran | Musi mieć |
|-------|-----------|
| **Dev Floor** | lista agentów (wiersz: ikona, nazwa, ilość, LoC/s, koszt, pasek do milestone'a), przyciski ×1/×10/×100/MAX, sekcja hardware z paskiem compute `used/cap`, sekcja "obsolete" zwijana |
| **Projects** | 3–5 slotów ofert (karta: nazwa, koszt LoC, payout, $/s, czas, tagi), pasek aktywnych buildów, portfolio produktów (z bug-badge i przyciskiem fix), przycisk Refactor zawsze widoczny + wskaźnik debt |
| **Research** | drzewko 3 gałęzie (SVG linie połączeń), węzeł: koszt RP, opis efektu, stan (locked/można/kupione) |
| **Rewrite+** | 3 taby warstw prestiżu; każdy: "co tracisz/zyskujesz/prognoza" (`04 §6`), drzewko Insight, perki Equity, sklep Paradox; taby ukryte do odblokowania |
| **Stats** | liczniki lifetime, per-run, rekordy, czas gry, wykres LoC/s ostatniej godziny (SVG sparkline, próbka/30 s) |
| **Achievements** | siatka kart, ukryte jako "???", licznik globalnego bonusu |
| **Settings** | notacja liczb, autosave interval, motyw glitch on/off, reduced motion, dźwięk on/off + głośność, export/import sava (textarea+plik), wipe save (double-confirm), język (en; pl później), credits |

## 5. Komponenty wspólne (vanilla, `src/ui/components/`)

`ResourceCounter` (animowane przejścia liczb — interpolacja w rAF, nie skok), `BuyButton` (stany: stać/nie stać/max, długie przytrzymanie = autorepeat), `ProgressBar` (transform scaleX, nie width!), `Card`, `Tooltip` (jeden globalny, pozycjonowany, pokazuje breakdown mnożników — **kluczowe dla czytelności balansu**), `Modal` (queue, ESC), `Toast` (max 3, stack), `Tabs`, `Badge`, `Sparkline` (SVG path).

Tooltip mnożników (wzór z Antimatter Dimensions): hover na LoC/s pokazuje pełne drzewko: baza × milestones × era × research × debt × prestiż = total. Bez tego balans jest czarną skrzynką.

## 6. Juice (tani, wydajny)

- Klik PROMPT: linia "kodu" wystrzeliwuje w terminalu + cyfra `+N LoC` unosi się i gaśnie (CSS animation, pula 10 elementów reużywanych — zero alokacji DOM w pętli).
- Ship: karta projektu "kompiluje się" (pasek) → flash `--gold` → toast z payoutem → wpis w terminalu `[SHIPPED] llama-todo v1.0`.
- Flow state: subtelna poświata `--acc` wokół terminala, licznik combo.
- Milestone/unlock: badge pop + 1 bleep.
- REWRITE: pełnoekranowa sekwencja 2–3 s — linie repo "spadają", `git init`, kursor mruga. (Najważniejsza animacja w grze — rytuał prestiżu.)
- Akt 4–5: rzadki glitch (chromatic shift na 100 ms, max raz/min, wyłączany w settings).
- Dźwięk: WebAudio — 5 syntezowanych bleepów (klik, ship, unlock, message, error), zero plików audio. Master gain z settings, domyślnie 30%.

## 7. Tło (opcjonalny smaczek, niski priorytet)

Bardzo subtelny "data rain" za panelami: pojedynczy `<canvas>` 30 fps, 60 znaków, opacity 0.05, wyłączony przy `prefers-reduced-motion` i w settings. Jeśli zagraża budżetowi perf — wycinamy bez żalu (jest na liście "nice to have" w `08 §M11`).

## 8. Responsywność i dostępność

- Breakpointy: ≥1280 pełny 3-kolumnowy; 900–1279 comms dock jako wysuwany overlay; <900 (web demo na laptopach/tabletach) dock → bottom tabs, terminal zwinięty do paska. Mobile portrait: oficjalnie niewspierany w 1.0, ale nie może się wysypać (overflow scroll).
- Klawiatura: `Space`=prompt, `1–7`=ekrany, `B`=buy max zaznaczonego, `Esc`=modal. Focus rings widoczne (`:focus-visible`).
- `prefers-reduced-motion`: wyłącza juice-animacje, zostawia zmiany stanu.
- Kontrast: wszystkie pary tekst/tło ≥ 4.5:1 (sprawdzić tokenami, nie na oko).
- Liczby-skróty zawsze z pełną wartością w tooltipie.

## 9. Anti-patterns (zakazy)

- Żadnych layout-shiftów od tickujących liczb (tabular-nums + stałe szerokości kolumn).
- Żadnych animacji `width/height/top/left` — tylko `transform`/`opacity`.
- Żadnych spinnerów: gra nigdy nie "ładuje" poza bootem (<1 s).
- Modal nigdy nie przerywa akcji gracza bez powodu fabularnego (wyjątki: finał, pierwszy rewrite).
- Czerwony (`--danger`) zarezerwowany dla debt/bugów — nigdy do dekoracji.

---

# AKTUALIZACJA UI — powłoka „desktop OS" (sekcje §10–§17)

> Decyzje właściciela (czerwiec 2026). Te sekcje **nadpisują** top-level layout z §3 (patrz nota tam). Wszystkie zasady §2/§5/§6/§8/§9 obowiązują **wewnątrz okien**. Milestony realizujące: `08 §M13–M16`.

## 10. Przegląd nowej powłoki i decyzje zamrożone

Gra przestaje być jednym ekranem-IDE; staje się **symulacją pulpitu komputera dewelopera**. Pełniej realizuje filar P1 („gra jest interfejsem"): gracz dosłownie „siada do komputera".

**Przepływ scen (scene state machine):** `BOOT` (§11) → `DESKTOP` (§12) z dowolną liczbą otwartych **okien** apek. Pierwsze uruchomienie nowego sava zawsze przez `BOOT`; przy wczytaniu istniejącego sava startujemy w `DESKTOP` (chyba że gracz wybierze „Quit to title"). Scena i stan okien są częścią `GameState.ui` (zapis = bump `SAVE_VERSION` + migracja, AGENTS rule 7).

**Inwentarz apek (ikony na pulpicie) i mapowanie na ekrany z §4:**

| Apka (ikona) | Treść / źródło | Uwaga |
|---|---|---|
| **Vibex** | główna pętla: prompt, terminal, „kod" | §15; nagłówek pokazuje `model: <NAZWA>` |
| **Agents** | dawny Dev Floor: agenci + Compute used/cap | §17; **rename z „Dev Floor"** (decyzja) |
| **Hardware** | budowa sprzętu z komponentów | §16; wydzielone z Dev Floor |
| **Upgrades** | sklep upgrade'ów (`09 §5`) | §17; wydzielone z Dev Floor |
| **Research** | drzewko RP | jak §4 |
| **Projects** | plansza + portfolio | jak §4 |
| **Stats / Achievements / Settings** | jak §4 | Settings współdzielone z bootem (§11) |
| **Chat / Mail / Feed** | fabuła, 3 osobne apki | §14; zastępują comms dock z §3 |

**Decyzje zamrożone w tej aktualizacji:**

1. „Dev Floor" → **Agents** (§17).
2. Vibex używa **lokalnego modelu** SmolLM2-135M-Instruct (Apache-2.0, komercyjnie OK) na silniku **wllama** (MIT) — szczegóły i warunki w §15. To **świadomy, izolowany wyjątek od P2**.
3. Top-level zasoby pokazują **karteczki** (§13), nie topbar. Model/era → nagłówek Vibex (nie karteczka).
4. Każda apka otwiera się w **osobnym, przesuwalnym oknie** „dość dużym, by wszystko było widać" (§12, point 5).

**Nowe tokeny do `theme.css` (dodać do §2):** `--note-yellow / --note-mint / --note-pink` (pastele post-it) + `--note-ink` (ciemny atrament, kontrast ≥4.5:1 na pastelu), `--win-titlebar`, `--win-titlebar-active`, `--win-shadow`, `--crt-glow`. Font odręczny: `--font-hand` (woff2 vendorowany lokalnie — kandydaci na licencji SIL OFL: „Caveat", „Patrick Hand"; **zweryfikować licencję** przed wrzuceniem, zero CDN).

## 11. Ekran startowy (scena BOOT) + animacja wejścia

**Wygląd:** ciemny pokój (tło `--bg-0`, winieta), na środku **monitor**, którego ekran „**miga na biało**" — subtelny flicker + scanline/CRT (`--crt-glow`), klimat włączonego kompa w ciemności. Zero bitmap: pokój i monitor = CSS/SVG; flicker = `@keyframes` na `opacity/box-shadow` (NIE width/height, §9).

**Na ekranie monitora (treść boota, styl terminalowo-bootowy):** logo/tytuł (np. ASCII „VIBECODER"), przyciski: **START GAME** (lub **CONTINUE** gdy istnieje save) · **SETTINGS** · **wybór języka** (na teraz EN; PL jako placeholder, `07 §8`) · **Credits**. Minimalistycznie.

**Settings z boota** = współdzielony komponent z apką Settings (§4), podzbiór: język, dźwięk+głośność, reduced motion, glitch on/off, „Skip intro". (Jedno źródło stanu ustawień.)

**Animacja „wchodzenia w ekran":** po START → kamera **zoomuje w monitor** aż jego ekran wypełni viewport → cięcie do `DESKTOP` (§12). Czas 1,5–2,5 s, wyłącznie `transform: scale()+translate()` + `opacity` (§9). **Skippable** (klik/Esc). Przy `prefers-reduced-motion` → bez zoomu, proste `opacity` fade. Bleep „unlock/boot" (§6, z settings).

**Kiedy boot:** zawsze przy pierwszym uruchomieniu; potem zależnie od „Skip intro"; z gry powrót przez „Quit to title" (Settings). Boot to **nie** „ładowanie" (zakaz spinnerów, §9) — to scena; faktyczny boot silnika < 1 s.

**a11y:** wszystkie przyciski fokusowalne, obsługa klawiatury, focus-visible, kontrast ≥4.5:1.

## 12. Pulpit, ikony, menedżer okien

**Pulpit = „ekran komputera":** tapeta (proceduralny gradient + opcjonalny subtelny „data-rain" z §7 jako tło, wyłączalny / reduced-motion), ikony rozmieszczone w siatce jak na desktopie, label pod ikoną. Wygląda jak prawdziwy, czyjś komputer (immersja P1).

**Ikony:** SVG inline (§nowe ikony do `ui/icons`). Apka zablokowana = wyszarzona / „???" do spełnienia unlocku (spójnie z systemem widoczności `02 §8`); badge przy nowościach/unread (§14).

**Otwieranie:** klik/dbl-klik ikony → otwiera **okno** apki (renderuje w nim ekran z §4).

**Menedżer okien (`ui/wm/`):**

- **Okno** = pasek tytułu (ikona + nazwa + `model:` tylko dla Vibex; przyciski **minimize / maximize-restore / close**) + obszar treści + opcjonalny status bar.
- **Przesuwalne** za pasek tytułu (`transform: translate`, bez layout-shift). **Resizable** (uchwyt; min-size per apka, max = pulpit). **Maximize** = wypełnia pulpit minus pas karteczek (§13).
- **Min-size „żeby wszystko było widać" (point 5):** Vibex ≥ 1000×640, Agents ≥ 860×560, Hardware ≥ 960×620, pozostałe ≥ 760×520 (tuning po smoke). Na ekranach < 900 px (web/laptop) okna otwierają się **zmaksymalizowane** (breakpointy §8).
- **Wiele okien naraz** dozwolone; **z-order** (klik = na wierzch; aktywne okno: `--win-titlebar-active` + `--glow-acc`). **Jedno okno na apkę** (ponowny klik ikony = focus istniejącego, nie duplikat).
- **Persist:** pozycja/rozmiar/otwarte/zminimalizowane w `GameState.ui.windows` (+migracja). „Reset window layout" w Settings.
- **Klawiatura:** skróty otwierają apki (zaktualizować mapowanie z §8 pod nowy zestaw apek), `Esc` zamyka/minimalizuje aktywne, `Tab`/`Ctrl+Tab` cykluje okna; focus-visible na kontrolkach paska tytułu.
- **Perf (P3, `07 §9`):** okno zamknięte/zminimalizowane = `display:none`, jego apka **nic nie liczy** (dirty-flag, nie render w tickach); przeciąganie/resize bez alokacji DOM (transform); brak re-renderu przy przełączaniu okien.

**Warstwy zawsze-na-wierzchu (nad pulpitem i oknami):** karteczki statystyk (§13) i powiadomienia narożne (§14) — nie chowają się z żadnym oknem.

## 13. Pasek statystyk — karteczki samoprzylepne (point 4)

Zamiast topbaru (§3): globalny HUD z **karteczek post-it** przyklejonych u góry ekranu (warstwa nad wszystkim), każda lekko obrócona (±2–4°, losowo, stabilnie per-sesja), z cieniem. Pismo **odręczne, ale czytelne** (`--font-hand`, vendorowane). Tła: `--note-yellow/-mint/-pink`; atrament `--note-ink` (kontrast ≥4.5:1 — wymóg, sprawdzić tokenami nie „na oko", §8).

**Trzy karteczki (lewy → prawy):**

1. **Money** (lewy górny róg): `$ <money>` + pod spodem `<money/s> /s`.
2. **LoC**: `<loc> LoC` + `<loc/s> /s` + mniejszy dopisek `LoC = Lines of Code`.
3. **Trzecia**: `RP <rp>` · `Compute <used>/<cap>` · `Hype <hype>×`.

**Zasady liczb (mimo odręcznego fontu):** `font-variant-numeric: tabular-nums`, `ResourceCounter` (interpolacja w rAF, §5), **zero layout-shift** (stałe szerokości pól). Skróty (`1.23e9`) zawsze z pełną wartością w tooltipie (§8). Tooltip mnożników (§5) podpięty pod `LoC/s` i `Money/s`.

**Model/era:** NIE na karteczce — w nagłówku okna Vibex (`model: GOLEM v3.1`, `02 §5`). **Reduced-motion:** liczby skokowo, karteczki bez „kołysania". Sumaryczny `Compute used/cap` jest tu (zawsze widoczny, zwięźle); pełne rozbicie zużycia → apka Agents (§17) — to realizuje prośbę z point 2 („żeby szczegóły Dev Floor nie były cały czas na ekranie").

## 14. Powiadomienia narożne + apki Chat / Mail / Feed (point 2: rozdzielenie comms)

Comms dock z §3 **znika**. Fabuła (`systems/story.ts`, `05-fabula`) routowana do **trzech osobnych apek**: **Chat**, **Mail**, **Feed**. Treść eventów i triggery **bez zmian** — zmienia się tylko prezentacja (kanał → apka).

**Powiadomienia (prawy górny róg, nad oknami):** gdy przychodzi event → **krótki toast** „New mail" / „New chat message" / „New post in feed" + ikona kanału. Reużywa `Toast` (§5: max 3, stack), auto-znika ~5 s. Klik w toast = otwiera właściwą apkę na nowej pozycji. **Treści NIE widać w toaście — trzeba wejść w apkę** (wymóg gracza).

**Ikona apki:** badge z licznikiem unread + delikatny pulse (zachowanie z §3). Okno apki = lista wątków/wiadomości, typing-animacja wjazdu (skippable), archiwum. Bleep „message" (§6, z settings). Settings: „Do not disturb" wycisza pulse/typing/toasty (i `prefers-reduced-motion` tłumi animacje).

## 15. Vibex — apka główna (point 3)

Okno Vibex, **trzy strefy**:

**A) Lewy panel — „pliki" (fake file tree):** lista plików projektu (`app/main.ts`, `core/loop.ts`, `systems/agents.ts`…), aktualnie „edytowany" plik podświetlony. **Nieklikalny — czysty flavor** (wymóg gracza). Aktualizuje podświetlenie, gdy wizualizer przechodzi do kolejnego pliku.

**B) Środek — wizualizer kodu (code stream):** po **każdym Send** (niezależnie czy gracz wpisał własny prompt, czy uruchomił canned) „pisze się" kod — linie pojawiają się linia-po-linii (może być abstrakcyjny/pseudokod; pula fragmentów w `data/`). Co jakiś czas **czyści się i przechodzi do kolejnego fikcyjnego pliku** (zmienia podświetlenie w panelu A). Raz na cykl **wszystko się czyści, a w terminalu pojawia się `commited`** (pisownia celowa za graczem; do decyzji `commited` vs `committed`). Animacja = transform/opacity, pula reużywanych elementów (§6, zero alokacji w pętli).

**C) Prawy panel — terminal promptów:** pole na własny prompt + duży przycisk **Send**. To jest **aktywna akcja PROMPT** z `02 §3` / `03 §4` (Send = burst LoC + flow meter; **mechanika bez zmian**, tylko UI przeniesione tu).

- **Idle (gracz nic nie wpisał):** nad Send przewija się „**szeroka gama generycznych wiadomości i odpowiedzi**" — pary `fałszywy prompt ↔ fałszywa odpowiedź`, **z humorem** (dev-humor / satyra na AI hype, ton `01 §1`). Pula w i18n `vibex.canned.*` (⚠️ teksty do napisania jak fabuła; losowanie bez powtórek — shuffle bag). **Nie woła modelu** → zero kosztu CPU w idle (P3).
- **Gracz wpisał i wysłał:** odpowiada **prawdziwy, lokalny LLM** (też **z humorem**).

**Nagłówek apki:** `Vibex — model: <NAZWA ERY>` (PARROT-1 … OMEGA, `02 §5` / `09 §2`). Tu pokazujemy model (nie na karteczce).

**Lokalny model — specyfikacja (decyzja właściciela):**

- **Silnik:** **wllama** (licencja **MIT**) — llama.cpp w WebAssembly (SIMD), format **GGUF**, **CPU-only**, bez serwera i bez GPU; działa w przeglądarce i w webview Tauri.
- **Model:** **SmolLM2-135M-Instruct** (HuggingFaceTB) — licencja **Apache-2.0 → użycie komercyjne dozwolone**; GGUF Q4 ≈ **~95–135 MB**. Opcjonalny upgrade jakości: **Qwen2.5-0.5B-Instruct** (Apache-2.0, ~większy). **Dołączyć pliki LICENSE/NOTICE** obu artefaktów do dystrybucji.
- **Humor:** stały **system prompt** nadający personę („zgryźliwy, żartobliwy senior AI pair-programmer"); krótki output (≤ ~60 tokenów, 1–3 zdania), temperatura na urozmaicenie. Opcjonalnie persona skaluje się z erą (PARROT = głupkowaty → OMEGA = niepokojąco błyskotliwy).
- **Wątek:** inference w **Web Workerze**, **nigdy na ticku gry** (P3, budżet `07 §9`). W trakcie: „typing…", brak blokady UI. Jedna generacja naraz; spam odrzucany/kolejkowany.
- **Wyjątek od P2 (zero runtime deps):** świadomy i **zatwierdzony**, **izolowany w `platform/ai.ts` (+ worker)**. Reszta gry pozostaje bez zależności runtime; walidator/review traktują `platform/ai.*` jako jedyną dozwoloną wyspę.
- **Rozmiar vs instalator (~10 MB) i web:**
  - **Desktop (pełna gra, Tauri):** model **pobierany przy pierwszym użyciu Vibex** i cache'owany lokalnie (potem offline) **albo** dołączony jako osobny asset (akceptujemy większy desktop; instalator bazowy zostaje mały).
  - **Web demo:** **bez modelu w bundlu** (za duży) — Vibex w demo jedzie na samej puli generycznej; opcjonalne „Download model" na żądanie.
  - **Fallback** (brak/wyłączony model): wpisane prompty również obsługuje pula generyczna. **Settings:** toggle „Vibex local AI", „Download model" (rozmiar + postęp), nota licencyjna.
- **i18n:** komunikaty UI (Send, „typing…", błędy, zgoda na pobranie) w `en.json`; **wyjścia modelu są generowane** (poza i18n).

**Granica P1/balans:** wizualizer, pliki, model i „commited" to **wyłącznie warstwa wizualna/klimatyczna** — nie zmieniają liczb. Cała ekonomia pozostaje w `02`/`03` (Send = PROMPT burst + flow, bez wyjątków).

## 16. Apka Hardware — komponenty PC → serwer od zera (point 2; decyzja: przeprojektować na komponenty)

Zamiast listy kafelków (stare `09 §4`: Old Laptop→Gaming Rig→…) — **wizualna budowa sprzętu z komponentów**; każdy komponent dokłada trochę **compute (cap)**; dwie fazy.

**Faza 1 — budowa/upgrade PC (płyta główna):** widok **płyty głównej** ze slotami: **CPU, RAM (×sloty), GPU, dysk, chłodzenie, PSU** itd. Każdy komponent ma poziomy/tiery; zakup/upgrade dodaje cap (analogicznie do obecnego compute, `02 §3`). Wizualnie: komponent „wskakuje" w slot, podświetlenie, licznik `+cap`. Gdy **wszystkie komponenty PC na maxie** → odblokowuje się Faza 2.

**Faza 2 — budowa serwera od zera:** start od **pustej szafy rack** — **szafa = 0 compute** (sama obudowa, „od 0"). Dokładamy: płyta serwerowa, zasilanie (PSU/PDU), moduły obliczeniowe, chłodzenie, sieć… — każdy `+cap`. Dalej skalowanie wzwyż (więcej szaf → rzędy → serwerownia/DC), spójnie z eskalacją `02 §3` i fabułą `01 §5` („od garażu do skali planetarnej"). Wizualnie: szafa zapełnia się modułami; kolejne szafy.

**Mechanika (niezmienne zasady):** hardware = **tylko cap compute**, nie produkcja (`02 §3`); zakup blokowany gdy nie stać (komunikat + skrót); agenci nigdy nie kasowani. Komponenty bramkowane **erą** (E1–E10), by sprzęt szedł równo z modelami.

**Dane — ✅ zdefiniowane:** komponenty, koszty, growth, capPerLevel, unlocki i obudowy (szafa `capPerLevel=0`) są w **`09 §4.1–4.3`**; wzory/stałe (`totalCap`, `HW_BASE_CAP=6`, `HW_PC_MAX_CAP=3486`, `pcComplete`) w **`03 §3.4`**. `data/hardware.ts` przepisać 1:1 z `09 §4` (schemat: `{ id, phase: pc|server, slot, maxLevel, baseCost, growth, capPerLevel, unlock, isEnclosure }`). Migracja starych saveów: `09 §4.3`.

**Warstwy kodu:** wizualizacja w `ui/` (SVG płyty/szafy/slotów; transform/opacity), logika cap w `systems/compute.ts` (rozszerzyć o komponenty/fazy/sloty), dane w `data/hardware.ts` (bez logiki, `07 §… / AGENTS rule 3`). i18n nazw/opisów. **Save:** nowy model hardware = bump `SAVE_VERSION` + migracja (stare tiery → ekwiwalent cap/komponentów).

## 17. Apki Agents i Upgrades (rozdzielenie dawnego „Dev Floor")

Dawny Dev Floor (agenci + hardware + upgrade'y, §4) rozbity na **trzy** apki: **Agents**, **Hardware** (§16), **Upgrades**.

- **Agents** (rename z „Dev Floor" — decyzja): pełna lista agentów (wiersz jak §4: ikona, nazwa, ilość, LoC/s, koszt, ×1/×10/×100/MAX, pasek do milestone'a), sekcja „obsolete" zwijana, oraz **rozbicie Compute** (który agent ile zużywa, ile zostało do cap). Sumaryczne `used/cap` dubluje się na karteczce (§13) — w apce są **szczegóły**.
- **Upgrades**: siatka upgrade'ów do kupienia (`09 §5`); karta: nazwa, koszt, efekt, stan `locked/affordable/bought`; respektuje widoczność `02 §8`.
