# Review #17 — M16
Reviewer: Claude Opus 4.8 | Data: 2026-06-15
Status: FIXED   <!-- OPEN → FIXED (Codex) → DONE / ESCALATE (reviewer, runda 2) -->
VERDICT: APPROVED

<!-- Kontekst (zweryfikowane przez reviewera; przegląd wieloagentowy 6 wymiarów: component-numbers, compute-cap-phases, save-migration-v5, balance-sim-ac, hardware-ui-hotpath, hardrules-scope-data + weryfikacja adwersarialna + sweep, 8 agentów; reviewer własnoręcznie potwierdził liczby komponentów PC, stałe HW, sim balansu, baseCost=Big):
  DoD: `npm run check` zielony (tsc + eslint + prettier + vitest + validate PASS 63 plików). BRAK P0/P1 — 1× P2 advisory. M16 = finałowy milestone (przeprojektowanie hardware na komponenty PC→serwer).
  CO DZIAŁA (zweryfikowane): LICZBY — data/hardware.ts == 09 §4 DOKŁADNIE (obie strony): 6 komponentów PC (h_cpu 20/80/1.55/40/start … h_gpu 20/300/1.6/80/h_cooling_pc≥3), 5 obudów (capPerLevel=0, isEnclosure, h_rack…h_dyson_frame), 4 infra serwera (h_srv_board/psu/cooling/net), 8 modułów compute (h_blade…h_exotic_core, capPerLevel 300→1e5); `baseCost: Big` (koszty serwera do 1e18 bezpieczne); stałe 03 §3.4 — HW_BASE_CAP=6, HW_PC_MAX_CAP=3486 (=800+1600+400+320+240+120+6), HW_PHASE2_UNLOCK="pcComplete". COMPUTE (systems/compute.ts): totalCap = HW_BASE_CAP + Σ(level×capPerLevel); koszt poziomu = baseCost×growth^level; pcComplete (wszystkie PC na maxLevel) → faza 2; obudowa (capPerLevel=0) = 0 cap; afford-gate; era-gating. SAVE — SAVE_VERSION 4→5 + migracja v4→v5 (stare tiery h_gaming_rig…h_dyson_lattice → bucket LEGACY_HARDWARE_ID „h_legacy" o cap=Σ(count×capPerLevel), czytany przez compute.ts jako addend → dostępny cap ZACHOWANY, AC) + fixtura/test; OLD_HARDWARE_TIERS == 09 §4.3. AC sim balansu: `npm run sim --strategy sane --hours 80` → complete=yes complete_h=48.57 (w oknie 45-70), events=73/73, max_e=42 — kampania przechodzi z nowym hardware, bez ściany compute (rytm „wall & release" zachowany). data/hardware.ts czyste dane; brak nowego runtime dep; zakres tylko hardware (ekonomia 02/03 nietknięta).
  GŁÓWNE LUKI: tylko 1× P2 — 9 osieroconych kluczy i18n nazw starych tierów. BRAK P0/P1. -->

## MUST FIX (P0/P1 — blokuje merge)
_(brak)_

## ADVISORY (P2 — nie blokuje)
- [x] **P2-1** | `src/i18n/en.json:65-73` — 9 osieroconych kluczy nazw starych tierów hardware (`hardware.h_datacenter/h_dyson_lattice/h_gaming_rig/h_home_server/h_hyperscale/h_micro_dc/h_orbital_ring/h_server_rack/h_workstation .name`): po redesignie M16 stare tiery usunięto z `HARDWARE`; `OLD_HARDWARE_TIERS` (hardware.ts:35-43) odwołuje się do nich tylko po `id` (mapowanie cap w migracji), nigdy po nameKey, a zmigrowane save'y zwijają je do syntetycznego `LEGACY_HARDWARE_ID` „h_legacy" (nie w HARDWARE → nigdy renderowany z nazwą); render mapuje po HARDWARE (`t(hardware.nameKey)`, main.ts:1302), więc te klucze są nieosiągalne (grep poza en.json: 0 referencji) — dlaczego: 09 §4.3 (stare tiery zretirowane do tabeli migracyjnej bez nazw) + higiena „all UI text via i18n"; zero wpływu runtime, ale localizatorzy utrzymują 9 martwych stringów (mogą maskować realnie brakujący klucz) → P2 (orphaned i18n key) — fix: usuń 9 martwych kluczy nazw starych tierów z en.json.
  - fix-note: Usunięto 9 martwych nazw starych tierów hardware z `src/i18n/en.json`; po M16 runtime renderuje wyłącznie aktywne `HARDWARE` i syntetyczny legacy cap nie potrzebuje nameKey.

## DISPUTED (wypełnia Codex, rozstrzyga człowiek)
_(brak)_

## PLAN-ISSUES (uwagi reviewera do samego planu — nieblokujące)
_(brak)_

## Runda 2 — weryfikacja (wypełnia reviewer)
- Naprawy zweryfikowane: _(czeka na FIXED od Codex)_
- Nowe P0 wprowadzone poprawkami: _(tylko P0; brak = brak)_
- Decyzja: _(DONE / ESCALATE)_
