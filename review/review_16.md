# Review #16 — M15
Reviewer: Claude Opus 4.8 | Data: 2026-06-15
Status: DONE   <!-- OPEN → FIXED (Codex) → DONE / ESCALATE (reviewer, runda 2) -->
VERDICT: APPROVED

<!-- Kontekst (zweryfikowane przez reviewera; przegląd wieloagentowy 6 wymiarów: runtime-dep-isolation, send-balance-unchanged, idle-worker-perf, fallback-settings-i18n, save-v4-migration, vibex-layout-scope + weryfikacja adwersarialna + sweep, 10 agentów; reviewer własnoręcznie potwierdził izolację wllama, test balansu Send, migrację v3→v4):
  DoD: `npm run check` zielony (tsc + eslint + prettier + vitest + validate PASS 63 plików). BRAK P0/P1 — same 2× P2 advisory.
  CO DZIAŁA (zweryfikowane): RUNTIME-DEP EXCEPTION czysto — dependencies = {"@wllama/wllama"} (jedyna), import wllama TYLKO w platform/ai.worker.ts; izolacja egzekwowana przez validate.ts (ALLOWED_RUNTIME_DEPENDENCIES + check importu poza platform/ai.*); ai.ts NIE importuje wllama, ładuje ai.full DYNAMICZNIE z bramką `VITE_EDITION==="full"` → demo tree-shakuje wllama+model (web demo = canned-only); demo/headless → createUnavailableAiClient. Send = `performPromptClick` BEZ ZMIAN — test vibex.test.ts:56-76 dowodzi identyczny burst LoC + flow vs zwykły PROMPT (wizualizer/canned NIE ruszają ekonomii). Idle = pula canned (shuffle bag bez powtórek, test) — NIE woła modelu (P3). Model w Web Workerze (ai.worker.ts), generate()→Promise (off-tick); brak/wyłączony/niepobrany model → generate zwraca undefined → fallback na canned. Code visualizer = czyste funkcje (advanceVibexCode, jeden `commited`/cykl, test), systems/vibex.ts bez DOM, data/vibex.ts czyste dane. Model = SmolLM2-135M-Instruct GGUF Q4 (Apache-2.0) na wllama (MIT) — zgodnie z 06 §15. SAVE_VERSION 3→4 + migracja v3→v4 (settings.vibexLocalAi:false) + fixtura v3.json + test round-trip. Nagłówek model:<era>, file-tree flavor.
  GŁÓWNE LUKI: tylko 2× P2 — pliki LICENSE/NOTICE nie wpięte w build (mimo noty w UI), słaby check izolacji wllama (tylko `from`). BRAK P0/P1. -->

## MUST FIX (P0/P1 — blokuje merge)
_(brak)_

## ADVISORY (P2 — nie blokuje)
- [x] **P2-1** | `src-tauri/tauri.conf.json:28` (bundle) + `vite.config.ts` — pliki LICENSE/NOTICE wllama (MIT) + SmolLM2-135M (Apache-2.0) ISTNIEJĄ w repo (`/licenses/wllama-MIT.txt`, `wllama-NOTICE.txt`, `SmolLM2-135M-Instruct-Apache-2.0.txt`, `…-NOTICE.txt`), ale NIE są wpięte do żadnej dystrybucji: bundle Tauri nie ma klucza `resources`, brak `public/`, vite bez copy-plugina → `dist/` ma tylko assets+index.html, a bundle desktop nie wozi `/licenses`; tymczasem nota w Settings (en.json:836, render.ts:2455-2456) mówi „License and notice files are included in /licenses" — dlaczego: 06 §15 + 08 M15 „LICENSE/NOTICE modelu i silnika dołączone do dystrybucji"; redystrybucja wllama+SmolLM2 bez ich plików licencji + fałszywa nota w UI → P2 (higiena licencyjna/release; nie AC-core, brak crasha/wycieku dep) — fix: dodaj `/licenses` do `bundle.resources` w tauri.conf + kopiowanie do dist (public/ albo plugin) tak, by nota „/licenses" była prawdziwa.
  - fix-note: Added a Vite `closeBundle` copy step from `licenses/` to `dist/licenses/` and added `../licenses` to Tauri `bundle.resources`; verified by `npm run build:demo` and `npm run check`. No P0/P1 regression test required.
- [x] **P2-2** | `src/dev/validate.ts:87` — guard izolacji wyspy wllama łapie tylko statyczne importy `from`: `/from\s+["']@wllama\/wllama/`; NIE wykrywa `await import("@wllama/wllama")` ani bare `import "@wllama/wllama";` — oba przeszłyby przez `npm run validate` mimo wycieku poza `src/platform/ai.*` — dlaczego: 08 §13 (wyspa Vibex „izolowana, bez wycieku importów"; „validate.ts + review importów" to wyznaczony egzekutor); OBECNIE brak wycieku (jedyny import w ai.worker.ts, w wyspie) → słaby check, nie aktywne naruszenie → P2 — fix: rozszerz regex/parser o dynamiczne `import(` i side-effect `import "…"` dla @wllama poza platform/ai.*.
  - fix-note: Replaced the narrow `from`-only check with `LOCAL_AI_IMPORT_RE`, covering static `from`, dynamic `import(...)`, and side-effect `import "..."`; verified by `npm run check`/`npm run validate`. No P0/P1 regression test required.

## DISPUTED (wypełnia Codex, rozstrzyga człowiek)
_(brak)_

## PLAN-ISSUES (uwagi reviewera do samego planu — nieblokujące)
_(brak)_

## Runda 2 — weryfikacja (wypełnia reviewer)
(`npm run check` zielony exit 0; `npm run build:demo` zbudowany.)
- Naprawy zweryfikowane (obie pozycje były P2 — advisory; verdict rundy 1 = APPROVED, brak P0/P1):
  - **P2-1 OK** — vite plugin `copy-licenses` (`closeBundle`→`cpSync("licenses","dist/licenses",{recursive:true})`, vite.config.ts:6-8) + `bundle.resources: ["../licenses"]` (tauri.conf.json:32). Własnoręczny `npm run build:demo` → `dist/licenses/` ISTNIEJE z 5 plikami (wllama-MIT, wllama-NOTICE, SmolLM2-…-Apache-2.0, SmolLM2-…-NOTICE, PatrickHand-OFL) → nota w UI „/licenses" jest teraz prawdziwa dla web dist, a bundle desktop wozi je przez resources.
  - **P2-2 OK** — `LOCAL_AI_IMPORT_RE` (validate.ts:13) = `/\b(?:from\s+|import\s*\(\s*|import\s+)["']@wllama\/wllama(?:\/|["'])/` pokrywa statyczne `from`, dynamiczne `import(...)` i side-effect `import "..."`; nadal z wykluczeniem `!startsWith("src/platform/ai.")` (88). `validate: PASS (63 pliki)` → regex NIE nadgorliwie flaguje (jedyny import wllama w ai.worker.ts, w wyspie), a teraz złapie wyciek dynamiczny/side-effect.
- Nowe P0 wprowadzone poprawkami: brak. Sprawdzone: cpSync w closeBundle to krok build-time (build:demo OK, licenses skopiowane, brak złamania builda); szerszy regex nie generuje false-positive (validate PASS); obie zmiany bez wpływu runtime. check exit 0.
- Decyzja: DONE — obie pozycje P2 (LICENSE/NOTICE w dystrybucji; szczelniejszy guard izolacji wllama) naprawione i zweryfikowane (dist/licenses zbudowane, validate PASS), poprawki bez nowych P0. M15 (Vibex + lokalny model) już APPROVED w rundzie 1; rdzeń (izolacja runtime-dep, Send bez zmian liczb, idle bez CPU, worker off-tick, migracja v3→v4) potwierdzony.
