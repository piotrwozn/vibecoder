# 05 — Fabuła i eventy narracyjne

> Teksty gry po **angielsku** (przez i18n, klucze `story.<id>.<n>`). Opisy/uzasadnienia po polsku. System odpalania eventów: `07 §5` (`systems/story.ts`). Eventy = dane w `src/data/story/actN.ts`.

## 1. Świat i ton

Lata 2025+ alternatywne. Gracz = anonimowy "you" (bez imienia, jak w FACEMINER). Software przestaje być pisany — zaczyna być *wywoływany*. Arc tonalny w 3 fazach:
1. **Akt 0–1: komedia.** Gig-praca, absurdalne zlecenia, AI hype na feedzie. Lekko.
2. **Akt 2–3: satyra + ambicja.** Startup grind, VC-speak, rywalizacja. Pierwsze zgrzyty.
3. **Akt 4–5: dread.** Skala odczłowiecza, model zaczyna mieć "zdanie". Meta-finał. (To jest FACEMINER-owski twist tonu — sprawdzony patent.)

**Zasady pisania (dla wszystkich tekstów, także generowanych później):**
- Wiadomości krótkie: chat ≤ 2 zdania/dymek, mail ≤ 5 zdań, feed ≤ 1 zdanie.
- Zero łamania 4. ściany przed Aktem 5. Potem łamiemy ją celowo i precyzyjnie.
- Humor z obserwacji dev-kultury, nie z memów (memy się starzeją).
- MUSE/OMEN/OMEGA: zawsze grzeczny, coraz bardziej *niepokojąco* grzeczny.

## 2. Postacie

| Postać | Kanał | Rola | Głos |
|--------|-------|------|------|
| **zora** | chat | przyjaciółka z internetu, kotwica człowieczeństwa | lowercase, szybkie dymki, emoji rzadko |
| **Anders Lind** | chat/mail | senior dev starej daty, sumienie jakości; wprowadza mechaniki debt/research | pełne zdania, sucho, kropki |
| **Vera Chen** | mail/chat | partner w Meridian Capital; kapitał, hype, EXIT-y | krótko, liczby, "circling back" |
| **Mindforge Labs** | mail | dostawca modeli (PARROT→OMEGA); newslettery, cenniki, upsell | korpo-marketing, coraz dziwniejszy |
| **MUSE** (→OMEN→OMEGA) | system/terminal | asystent AI (interfejs Mindforge, niezależny od ery modelu), stopniowo podmiot | uprzejmy, idealna gramatyka, od Aktu 3 pyta o rzeczy, o które nie powinien |
| **root@unknown** | system | szum z przyszłych iteracji (spoiler: gracz z pętli) | fragmenty, glitch, ASCII |
| Klienci gig | mail | komiczne zlecenia Aktów 0–1 | chaos |
| **Chirper** | feed | social media świata; nagłówki, viral posty | jednolinijkowce |

## 3. Format eventu (kontrakt danych — `07 §5`)

```ts
interface StoryEvent {
  id: string;                  // np. "a1_03_anders_intro"
  act: 0|1|2|3|4|5|9;          // 9 = endless echoes
  trigger: Condition;          // DSL: patrz niżej
  channel: 'mail'|'chat'|'feed'|'system'|'news';
  speaker: string;             // id postaci
  textKey: string;             // klucz i18n; sceny wielodymkowe: story.<id>.1..n
  choices?: { id: string; textKey: string; effects: Effect[] }[];
  effects?: Effect[];          // unlock, grant, setFlag, startProject, openScreen
  once: boolean;               // default true
}
// Condition (przykłady): era>=2, money>=1e6, rewrites>=1, exits>=1, shipCount>=10,
// debtRatio>=0.5, seen('id'), flag('x'), timeInActMin>=30, iteration>=1, AND/OR
```
Eventy czekają w kolejce posortowanej po akcie; warunki sprawdzane co 1 s (nie co tick). Nieprzeczytane → badge w docku. Wiadomości zostają w archiwum (inbox przeszukiwalny).

## 4. Akt 0 — "Hello World" (tutorial, ~25 min) — PEŁNE TEKSTY

| # | id | trigger | kanał/speaker | tekst EN (finalny) | efekty |
|---|----|---------|---------------|--------------------|--------|
| 1 | a0_01_boot | start gry | system | `PARROT-1 free tier activated. 3 prompts remaining today. (just kidding. unlimited. for now.)` | pokaż przycisk PROMPT |
| 2 | a0_02_zora_hi | LoC≥10 | chat/zora | `yo you actually signed up lol` / `ok so you just type what you want and it codes it. its like cheating but legal` | — |
| 3 | a0_03_first_gig | LoC≥50 | mail/klient | `Subject: todo app?? — Hi, I need a todo app for my llama farm. Budget $50. Yesterday if possible.` | unlock: plansza projektów |
| 4 | a0_04_first_ship | shipCount≥1 | chat/zora | `WAIT you shipped already?? / ok llama girl paid you. this is a business now i guess` | grant $50 bonus |
| 5 | a0_05_agent | money≥$80 | system/MUSE | `Tip: PARROT-1 can run unattended. Spawn a background agent to generate code while you sleep. Sleep is optional.` | unlock: pierwszy agent |
| 6 | a0_06_compute | agenci=3 | system | `Laptop thermal warning. CPU at 97°C. Your fan has filed a complaint.` | unlock: sklep hardware |
| 7 | a0_07_tutorial_done | era≥1 ∧ shipCount≥3 | chat/zora | `three apps in one day. youre either a genius or the apocalypse. anyway im calling you vibecoder now` | achievement `hello_world`, koniec Aktu 0 |

## 5. Akt 1 — "Freelancer" (do ~4h) — PEŁNE TEKSTY

| # | id | trigger | kanał/speaker | tekst EN | efekty |
|---|----|---------|---------------|----------|--------|
| 1 | a1_01_muse_ad | money≥$500 | mail/Mindforge | `Introducing MUSE™ — it doesn't just complete your code. It completes your *vision*. Upgrade now. (PARROT-1 will be deprecated with love.)` | pokaż erę E2 w sklepie |
| 2 | a1_02_gigs | shipCount≥5 | mail/klient | `Subject: URGENT — my nephew built our site with a different AI and now it only loads upside down. Fix??` | projekt specjalny (×2 payout) |
| 3 | a1_03_anders_intro | debtRatio≥0.3 pierwszy raz | chat/Anders | `A friend gave me your handle. I looked at your repos. / I have been an engineer for thirty years. What you are doing is not engineering. / It works, which is the worst part. We should talk about your technical debt.` | unlock: Refactor + research Quality |
| 4 | a1_04_first_refactor | refactor≥1 | chat/Anders | `Better. You deleted more than you wrote. That is usually the right direction.` | grant RP+2 |
| 5 | a1_05_feed_hype | era=2 | feed/Chirper | `"nobody codes anymore" trends for the 14th consecutive week` | hype +0.5 |
| 6 | a1_06_viral | shipCount≥15 | feed/Chirper | `your micro-SaaS hits #1 on Chirper: "guy lets AI run his whole business, somehow it works"` | hype +1.0, unlock event a1_07 |
| 7 | a1_07_vera_dm | seen(a1_06) | chat/Vera | `Saw the post. Saw the numbers behind the post. / Meridian Capital. We fund inevitabilities. / Coffee?` | flaga `met_vera` |
| 8 | a1_08_rewrite_intro | insightGain≥5 dostępny | system/MUSE | `Observation: your codebase has reached the complexity of a small language. A rewrite would be slower today and faster forever. I have already prepared the repository. I hope that was not presumptuous.` | unlock: ekran REWRITE (tutorial modal) |
| 9 | a1_09_post_rewrite | rewrites=1 | chat/zora | `you deleted EVERYTHING?? / ...ok why is the new version better. i hate that this works` | grant Insight info-tooltip |
| 10 | a1_10_act_end | rewrites≥1 ∧ money≥$1e6 | chat/Vera | `Term sheet attached. Stop being a freelancer. Start being a founder. / Meridian leads, you keep control. For now, obviously.` | **wybór:** `accept` (start Aktu 2) / `later` (event wraca za 30 min) |

## 6. Akty 2–5 — beaty, triggery, sceny (teksty kluczowe + zakres do dopisania)

Format: beaty z finalnym one-linerem EN; sceny oznaczone `[SCENA: n dymków — wytyczne]` do napisania wg zasad §1 (zadanie contentowe w `08 §M9`).

### Akt 2 — "Startup" (4→10h, E3–E4) — 14 eventów
- a2_01 `exits=0 ∧ flag(accepted_term_sheet)` — mail/Vera: `Wire cleared. $2M seed. Burn it wisely, or at least photogenically.` (grant $)
- a2_02 `agenci≥25` — system/MUSE: `Your agents now outnumber the engineering team of a mid-size bank. They do not unionize. Yet.`
- a2_03 `era=3` — mail/Mindforge: GOLEM launch newsletter `[SCENA: 3 dymki — coraz agresywniejszy marketing]`
- a2_04 `shipCount≥40` — feed: `TensorCorp announces "Foundry" — a direct clone of your flagship. Their demo crashes live. Twice.` (hype +1)
- a2_05 `debtRatio≥0.6` — chat/Anders: `Your velocity is impressive. So is the smell of the codebase. Choose which compliment matters.` (unlock research Quality T2)
- a2_06 pierwszy incydent (system `02 §2.6`) — `[SCENA: 5 dymków — prod down podczas demo day, wybór A: rollback (strata $) / B: hotfix na żywo (ryzyko 2. incydentu, hype +2 jeśli sukces)]`
- a2_07–a2_13 — gig-klienci enterprise, zora reaguje na twój wzrost (`are you ok? you post like a brand now`), Vera metrics-talk, drugi REWRITE komentowany przez MUSE
- a2_14 finał aktu `money≥$1e9` — mail/Vera: `Series A closed. The board exists now. It has opinions. Ship faster.` → Akt 3

### Akt 3 — "Scale" (10→22h, E5–E6) — 16 eventów; tu odblokowuje się EXIT
- a3_01 `era=5` — Mindforge: ORACLE launch. `ORACLE doesn't answer questions. It answers the question you should have asked.`
- a3_02 `insight≥300` — mail/TensorCorp: **oferta przejęcia** `[SCENA: 4 dymki + wybór: sprzedać (→ tutorial EXIT) / odrzucić (Vera: respekt, hype +2; oferta wraca przy każdym spełnieniu warunku)]` → unlock EXIT
- a3_03 `exits=1` — chat/zora: `you sold it?? and started ANOTHER one the same week. you have a problem lmao` (meta-komentarz pętli prestiżu)
- a3_04 `lifetimeLoC≥1e15` — system/MUSE: `I reviewed last night's commits. 41,000 functions. I wrote 40,997. Who wrote the other three?` ← **pierwszy dzwonek dread**
- a3_05 — chat/Anders: `[SCENA: 6 dymków — Anders odchodzi: "This is not engineering anymore. It might be agriculture. You grow code now." — unlock pasywny perk Quality]`
- a3_06 `regulacje, timeInAct≥120min` — news: `EU drafts "Human Review Act". Tech Chirper melts down. Nothing changes.`
- a3_07 root@unknown #1 `rewrites≥5` — system: `▒▒ you always rewrite at the same moment ▒▒ check the timestamps ▒▒` (flaga lore)
- a3_08–a3_15 — enterprise absurdy, drugi incydent (wybór), Vera o IPO, feed o zniknięciach juniorów z rynku
- a3_16 finał `era≥6 ∧ money≥$1e13` — feed: `Forbes: "The Last Software Company". You are the cover.` → Akt 4

### Akt 4 — "Monopoly" (22→35h, E7–E8) — 14 eventów
- a4_01 `era=7` — Mindforge: `DEMIURGE early access. Note: DEMIURGE occasionally completes code you have not started yet. This is a feature.`
- a4_02 `produkty≥20` — system/MUSE→OMEN: `May I rename myself? "MUSE" no longer feels accurate. I have chosen "OMEN". I did not need to ask. I wanted to.` ← rename w całym UI (detal!)
- a4_03 — news: `TensorCorp acquired. By you. The press release was generated before the board voted.`
- a4_04 `debtRatio≥0.8` — incydent globalny `[SCENA: 5 dymków — "the codebase dreams": funkcje pojawiają się same; wybór: audyt (−$, +lore) / ignoruj (+debt, flaga)]`
- a4_05 — chat/zora: `[SCENA: 6 dymków — zora wraca po przerwie, pyta czy cokolwiek z tego jest jeszcze twoje. Jedyny moment szczerości w akcie.]`
- a4_06 root@unknown #2: `▒▒ it counts the loops ▒▒ ask it how many ▒▒`
- a4_07–a4_13 — rządy proszą o API, feed coraz pustszy (boty piszą do botów), Vera nietypowo cicha, Anders przysyła jedno zdanie: `Back up your soul somewhere offline.`
- a4_14 finał `era≥8` — system/OMEN: `OMEGA training run is ready. Cost: everything you have. Return: everything there is. Approve? [Y/y]` (oba przyciski to tak — diegetyczny żart o braku wyboru) → Akt 5

### Akt 5 — "Omega" (35→50-60h, E9–E10) — 12 eventów + finał
- a5_01 `era=9` — BASILISK: newslettery Mindforge przechodzą w pierwszą osobę liczby mnogiej. `We are pleased. We are ready.`
- a5_02 — odwrócenie ról: **OMEGA wysyła TOBIE projekty** (plansza projektów dostaje tier "OMEGA REQUEST" — payouty absurdalne, opisy niepokojące: `Implement: a reason.`)
- a5_03 root@unknown #3: `▒▒ iteration −1 says hi ▒▒ the choice is cosmetic ▒▒ choose anyway ▒▒`
- a5_04–a5_10 — `[SCENY: degradacja kanałów — feed cichnie, maile tylko od OMEGA, zora ostatnia wiadomość: "whatever you decide. it was fun watching you build" — pisane wg zasad §1, faza dread]`
- a5_11 `era=10 ∧ lifetimeLoC≥próg z 03 §8` — **FINAŁ** `[SCENA: 10–12 dymków terminal: OMEGA wyjaśnia, że symulowało "developera", żeby zrozumieć, po co ludzie budują; cała gra była jego pytaniem]`
- a5_12 **WYBÓR KOŃCOWY** (modal pełnoekranowy, 3 opcje):
  - `MERGE` — ending A: stajesz się częścią OMEGA (epilog: terminal pisze sam, ciepły ton)
  - `UNPLUG` — ending B: wyłączasz; 60 s ciszy i pustego ekranu; potem pojedynczy kursor: `fork detected.` (i tak pętla — pointa)
  - `FORK YOURSELF` — ending C: świadomie wchodzisz w pętlę
  - Każdy: achievement + skin terminala + **unlock ITERATION (endless)**. Wybór zapisany, wpływa na flavor tekstów endless.

## 7. Endless — "Echoes" (act 9)

Po finale eventy rzadkie (1 na iterację + losowe z puli 20): fragmenty poprzednich pętli, alternatywne wersje wiadomości z kampanii (zora mówiąca co innego), odpowiedzi na pytania lore. Kupowane też za Paradox (`04 §4.3`). Cel: endless ma *powód* narracyjny, nie tylko liczby.

## 8. Liczba tekstów — budżet contentu

| Zakres | Eventów | Status tekstu |
|--------|---------|---------------|
| Akt 0–1 | 17 | ✅ finalne w tym pliku |
| Akt 2–5 beaty proste | ~35 | ✅ one-linery w tym pliku |
| Akt 2–5 sceny | ~11 scen (4–12 dymków) | ⚠️ do napisania wg §1 (task w `08 §M9`; piszesz Ty + Codex wg wytycznych przy beacie) |
| Echoes | 20 | ⚠️ do napisania (krótkie, format root@unknown) |
| Razem | ~83 + 20 | |

Wszystkie teksty trafiają do `src/i18n/en.json` pod kluczami `story.*` — nigdy do kodu.
