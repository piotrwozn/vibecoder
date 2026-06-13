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
