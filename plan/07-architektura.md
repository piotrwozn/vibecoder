# 07 — Architektura techniczna

> Stack: **TypeScript (strict) + Vite**. Zero zależności runtime (filar P2). DevDeps: `vite`, `typescript`, `vitest`, `eslint`, `prettier`, `@tauri-apps/cli` (desktop). Bez frameworków, bez bibliotek bignum — własna implementacja §6.

## 1. Struktura repo

```
/
├── AGENTS.md                  # instrukcje dla Codexa (w korzeniu repo)
├── plan/                      # te dokumenty
├── index.html
├── package.json  vite.config.ts  tsconfig.json
├── src/
│   ├── main.ts                # bootstrap: load save → init systems → start loop
│   ├── core/
│   │   ├── loop.ts            # fixed timestep + rAF render
│   │   ├── state.ts           # GameState: typ, default, (de)serializacja
│   │   ├── save.ts            # autosave, slots, export/import, migracje
│   │   ├── migrations.ts      # SAVE_VERSION + lista migracji
│   │   ├── bus.ts             # typowany event bus
│   │   ├── bignum.ts          # klasa Big (§6)
│   │   ├── format.ts          # formatowanie liczb/czasu (03 §10)
│   │   └── rng.ts             # seedowane RNG (mulberry32) — determinizm bugów
│   ├── data/                  # CONTENT — tylko dane, zero logiki (filar P4)
│   │   ├── constants.ts       # stałe z 03 §11 i 04 §5
│   │   ├── generators.ts  hardware.ts  eras.ts  upgrades.ts
│   │   ├── research.ts  projects.ts  achievements.ts
│   │   ├── prestige.ts        # drzewko Insight, perki Equity, sklep Paradox
│   │   └── story/act0.ts … act5.ts  echoes.ts
│   ├── systems/               # logika — czyste funkcje (state, dt) → mutacje
│   │   └── (12 modułów wg mapy 02 §11)
│   ├── ui/
│   │   ├── render.ts          # rejestr komponentów + dirty flags (§9)
│   │   ├── dom.ts             # helpery el(), text(), pooling
│   │   ├── theme.css  layout.css
│   │   ├── components/        # 06 §5
│   │   └── screens/           # 06 §4 (devfloor.ts, projects.ts, …)
│   ├── i18n/
│   │   ├── i18n.ts            # t(key, params), ładowanie słownika
│   │   └── en.json            # cały tekst gry (pl.json w przyszłości)
│   ├── platform/
│   │   ├── platform.ts        # interfejs (§10)
│   │   ├── web.ts             # localStorage, brak fs
│   │   └── desktop.ts         # Tauri: pliki, backupy, okno
│   └── dev/
│       ├── cheats.ts          # panel ?dev=1 (§11)
│       └── validate.ts        # walidacja contentu (10 §2)
├── tools/sim/                 # headless symulator balansu (10 §3)
├── src-tauri/                 # boilerplate Tauri (generowany, minimalny Rust)
└── tests/                     # vitest
```

## 2. Stan gry — jeden obiekt, serializowalny

```ts
interface GameState {
  v: number;                          // SAVE_VERSION
  meta: { createdAt: number; lastSeen: number; playtimeS: number; edition: 'demo'|'full' };
  res: { loc: Big; money: Big; rp: number; insight: Big; equity: number; paradox: number;
         hype: number; debt: Big; computeUsed: number; computeCap: number };
  lifetime: { loc: Big; money: Big; locSinceExit: Big; insightSinceExit: number };
  owned: { generators: Record<string, number>; hardware: Record<string, number>;
           upgrades: Set<string>; research: Set<string>;        // Set → serializowane jako string[]
           insightNodes: Set<string>; equityPerks: Set<string>; paradoxItems: Set<string> };
  era: number;
  projects: { board: ProjectOffer[]; active: ActiveBuild[]; portfolio: Product[];
              boardRefreshAt: number; prioritySetting: 'payout'|'revenue'|'rp' };
  bugs: ActiveBug[];
  flow: { meter: number; activeUntil: number };
  prestige: { rewrites: number; exits: number; iteration: number; endingChoice?: 'merge'|'unplug'|'fork' };
  story: { seen: Set<string>; flags: Set<string>; inbox: InboxEntry[]; act: number;
           choices: Record<string, string> };
  automation: Record<string, AutomationRule>;     // toggles + progi
  stats: Record<string, number|Big>;              // liczniki do achievementów/stats
  settings: { notation: 'suffix'|'sci'; sound: boolean; volume: number; reducedFx: boolean;
              autosaveS: number; lang: string };
  rngSeed: number;
}
```
Zasady: **wszystko w jednym drzewie**, brak stanu w modułach systemów (czyste funkcje). Cache'e pochodne (mnożniki) żyją POZA savem w `DerivedCache` i są przeliczane od zera przy load/prestiżu.

## 3. Pętla gry

```ts
// core/loop.ts — fixed timestep, odporna na lagi i background tab
const TICK = 1000 / C.TICK_HZ;            // 100 ms
let acc = 0, last = performance.now();
function frame(now: number) {
  acc += now - last; last = now;
  acc = Math.min(acc, 2000);              // klamra po lagach; dłuższe przerwy → offline path
  while (acc >= TICK) { tick(state, TICK / 1000); acc -= TICK; }
  render(state, acc / TICK);              // alpha do interpolacji liczników
  requestAnimationFrame(frame);
}
// tick(): production → projects → hype → debt/bugs(co 1s) → automation → story(co 1s) → unlocks(co 1s) → stats
```
- Background tab: rAF staje; po powrocie `acc` > 2 s → przeliczenie przez **ścieżkę offline** (§7) zamiast pętli ticków. Identyczna matematyka = brak różnicy exploitów.
- Rzeczy "co 1 s" (story, unlocks, bugi) na liczniku ticków, nie osobnych timerach.

## 4. Event bus (komunikacja systemy→UI, bez sprzężeń)

```ts
type Events = {
  'res:changed': keyof GameState['res'];
  'bought': { kind: 'generator'|'hardware'|'upgrade'|'research'|...; id: string };
  'shipped': { projectId: string; payout: Big };
  'bug:spawned'|'bug:fixed': { productId: string };
  'story:message': { eventId: string };
  'prestige': { layer: 1|2|3 };
  'unlock': { kind: string; id: string };
  'era:changed': number;
};
```
Systemy emitują; UI subskrybuje i ustawia dirty flags; `DerivedCache` subskrybuje `bought/prestige/era/...` i przelicza mnożniki **tylko wtedy** (filar wydajności).

## 5. Content jako dane + warunki

```ts
// Wzorzec definicji (data/) — przykład generatora:
{ id: 'g_intern_swarm', era: 3, baseCost: big(2.5e6), growth: 1.12,
  baseRate: big(450), computeUse: 8, unlock: { era: 3 } }

// Condition — dyskryminowana unia, NIE funkcje (serializowalność, walidacja, sim):
type Condition = { era?: number; moneyGte?: string; locLifetimeGte?: string;
  rewritesGte?: number; exitsGte?: number; shipCountGte?: number; debtRatioGte?: number;
  seen?: string; flag?: string; timeInActMinGte?: number; iterationGte?: number;
  all?: Condition[]; any?: Condition[] };

// Effect — analogicznie: { grant?: {res, amount} ; setFlag?; unlock?; startProject?; openModal? }
```
`systems/unlocks.ts` i `systems/story.ts` mają wspólny evaluator `checkCondition(state, c)`. Eventy fabularne trzymane w posortowanej kolejce "pending dla bieżącego aktu" — sprawdzanie to O(kilka) co sekundę, nie skan 80 eventów.

## 6. Big numbers — spec klasy `Big`

Bez bibliotek. Reprezentacja: `{ m: number, e: number }`, niezmiennik `1 ≤ |m| < 10` lub `m=0`; `e` jako zwykły number (zakres do ±9e15 wykładnika — wystarczy na wieczność endless).

```ts
ops: add, sub (różnica e > 15 → zwróć większy), mul, div, pow(b, n), powBig,
     log10, cmp, max, min, floor, fromNumber, toNumber (clamp przy e>308), eq0, gte
format(b, notation): wg 03 §10;  serializacja: "1.234e56" (string w JSON)
```
Wymagania: **bez alokacji w hot path** — operacje mają warianty mutujące `addIn(a,b)` używane w tick(); immutable warianty do logiki zakupów. Testy property-based vs `number` w zakresie 1e±300 (`tests/bignum.test.ts`). Suma geometryczna kosztów i `maxAffordable` (03 §1) jako metody statyczne.

## 7. Save, migracje, offline

- **Autosave:** co `settings.autosaveS` (default 10 s, debounce) + na `visibilitychange/beforeunload` + przed prestiżem. Zapis przez `platform.save()` (§10).
- **Format:** JSON; `Big` jako string; `Set` jako array. Klucz/plik: `vibecoder_save`. Desktop dodatkowo: rotacja 3 backupów + zapis atomowy (tmp→rename).
- **Migracje:** `SAVE_VERSION` int; `migrations: ((raw: any) => any)[]` uruchamiane sekwencyjnie od `raw.v` do aktualnej. Test CI: fixture save'ów każdej wydanej wersji musi się wczytać (10 §4). Save NIGDY nie jest odrzucany — najwyżej naprawiany z defaultami + log.
- **Export/import:** base64(JSON) do schowka/pliku; import waliduje strukturę i wersję (w tym save z demo → full: `meta.edition` przepisywane, zawartość bez zmian — pełna kompatybilność).
- **Offline:** `lastSeen` vs now; zamknięte formy z 03 §7 (zero pętli po czasie); pojedynczy modal z podsumowaniem. Ta sama funkcja obsługuje background-tab catch-up (§3).

## 8. i18n (własne, minimalne)

```ts
t('ui.devfloor.buy', { n: 10 })         // słownik: płaski JSON z kropkami, interpolacja {n}
tBig('res.loc', bigValue)               // formatowanie liczb wg ustawień
```
- `en.json` ładowany statycznie (import). Architektura: `loadLocale(lang)` z dynamic import — PL doda się jako plik, zero zmian w kodzie.
- ZAKAZ stringów UI w kodzie (lint-check własny w `dev/validate.ts`: grep po literałach w ui/ — lista wyjątków).
- Pluralizacja: prosta funkcja `plural(n, forms)` gotowa na PL (3 formy) od początku.

## 9. Wydajność — budżety i techniki (filar P3)

**Budżety:** tick < 2 ms; render frame < 4 ms przy 60 fps; idle CPU < 3%; RAM stabilny (8h soak test — 10 §5); bundle < 300 KB gz.

| Technika | Gdzie |
|----------|-------|
| Logika 10 Hz, render rAF z interpolacją | `core/loop.ts` |
| `DerivedCache` mnożników, przeliczany eventowo, nie co tick | §4 |
| Dirty flags per komponent: tick ustawia flagę, render odświeża tylko brudne | `ui/render.ts` |
| Aktualizacja **text node'ów**, nie `innerHTML`; brak tworzenia DOM w pętli | `ui/dom.ts` |
| Pule obiektów: cząstki kliku (10), wiersze terminala (ring 200), toasty (3) | komponenty |
| Listy: agenci/projekty re-renderowane tylko przy zmianie struktury; wartości w wierszach przez referencje do text node'ów | screens |
| `contain: content` na panelach; animacje tylko transform/opacity | CSS |
| Mutujące operacje Big w tick (zero GC churn); profil alokacji w DevTools jako test ręczny | `bignum.ts` |
| Brak timerów poza jednym rAF (+ jeden interval autosave) | całość |
| Terminal log: throttle do 10 wpisów/s, nadmiar agregowany ("+1,2K commits") | terminal |

## 10. Warstwa platformy (web demo + desktop full)

```ts
interface Platform {
  edition: 'demo'|'full';
  save(data: string): Promise<void>;  load(): Promise<string|null>;
  listBackups?(): Promise<string[]>;  exportFile?(name: string, data: string): Promise<void>;
  openExternal(url: string): void;
  quit?(): void;  setTitle(t: string): void;
}
```
- **web.ts:** localStorage (+ ostrzeżenie o trybie prywatnym), edition z `import.meta.env.VITE_EDITION`.
- **desktop.ts:** Tauri 2 — plik w `appDataDir`, backupy, atomic write; auto-update Tauri updater (11 §3). Wybór implementacji w `main.ts` po detekcji `window.__TAURI__`.
- **Demo gating:** flaga edition w buildzie. Demo: content do końca Aktu 1 + E2; dalsze encje mają `demoLocked: true` → UI pokazuje ekran "Get the full game" (jeden komponent). Logika systemów IDENTYCZNA — gating tylko na unlockach contentu. Eksport sava zawsze dostępny.

## 11. Tryb deweloperski

`?dev=1` (web) / flaga env (desktop): panel z: time warp (×10/×100, +1h/+8h), grant zasobów, odpalenie dowolnego eventu fabularnego, reset do checkpointów (akt N), pokaz wszystkich unlocków, licznik perf (ms/tick, ms/frame, heap). Wyłączony twardo w buildach produkcyjnych (tree-shaking przez `if (import.meta.env.DEV || flag)`).

## 12. Testy (szczegóły i progi: `10-jakosc.md`)

- `vitest`: bignum (property), format, koszty/bulk/maxAffordable, wzory produkcji, insight/equity/paradox gain, offline determinizm, migracje save, evaluator Condition, walidator contentu.
- Sim headless (`tools/sim`): importuje `systems/` + `data/` bez DOM — wymusza czystość warstw (systems nie może dotykać ui/ — egzekwowane importem w CI).
- Smoke e2e (opcjonalnie, Playwright): boot → klik → kup agenta → save → reload → stan zgodny.
