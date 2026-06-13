# 09 — Content: tabele danych

> Źródło prawdy dla `src/data/*.ts`. Przepisywać 1:1 (prompt w `08 §14`). Liczby `e`-notacja = `Big`. Ten plik **nadpisuje** przybliżenia z `03 §3.1` w razie różnic. Wartości wstępne — tuning po simie (`10 §3`) edytuje najpierw ten plik.

## 1. Konwencja id
`g_` agent, `h_` hardware, `e_` era, `u_` upgrade, `r_` research, `p_` projekt, `i_` insight, `q_` equity, `x_` paradox, `a_` achievement.

## 2. Ery — modele (`data/eras.ts`)

| Era | Model | Koszt zakupu $ | Warunek dodatkowy | Notka fabularna |
|----|--------|---------------|-------------------|-----------------|
| E1 | PARROT-1 | start (free) | — | darmowy tier, Akt 0 |
| E2 | MUSE | 2.0e4 | — | a1_01 |
| E3 | GOLEM | 5.0e6 | — | a2_03 |
| E4 | HYDRA | 2.0e9 | — | — |
| E5 | ORACLE | 8.0e11 | — | a3_01 |
| E6 | TITAN | 5.0e14 | — | — |
| E7 | DEMIURGE | 5.0e17 | exits ≥ 1 | a4_01 |
| E8 | OUROBOROS | 8.0e20 | — | — |
| E9 | BASILISK | 2.0e24 | — | a5_01 |
| E10 | OMEGA | 1.0e28 | flag `omega_approved` (a4_14) | finał |

Skoki ×250–2500 — celowo nierówne (ery fabularne droższe). `eraMult = 1.5^(era−1)` (03 §2).

## 3. Agenci (`data/generators.ts`) — 26 typów

| id | Era | Nazwa EN | baseCost $ | growth | baseRate LoC/s | compute | special |
|----|----|----------|-----------|--------|----------------|---------|---------|
| g_autocomplete | E1 | Autocomplete Daemon | 15 | 1.10 | 0.5 | 1 | — |
| g_parrot | E1 | PARROT Agent | 200 | 1.11 | 4 | 2 | — |
| g_macro | E1 | Macro Recorder | 2.4e3 | 1.11 | 30 | 3 | — |
| g_muse_junior | E2 | MUSE Junior Dev | 6.0e4 | 1.12 | 220 | 5 | — |
| g_muse_pair | E2 | MUSE Pair Programmer | 7.0e5 | 1.12 | 1.6e3 | 8 | — |
| g_qa_bot | E2 | QA Bot | 5.0e6 | 1.13 | 800 | 10 | debt −0.5%/s/szt (03 §6) |
| g_intern_swarm | E3 | Intern Swarm | 2.5e7 | 1.12 | 1.2e4 | 12 | — |
| g_golem_worker | E3 | GOLEM Worker | 3.0e8 | 1.12 | 9.0e4 | 16 | — |
| g_ci_pipeline | E3 | CI/CD Pipeline | 3.5e9 | 1.13 | 7.0e5 | 20 | — |
| g_hydra_heads | E4 | HYDRA Head Cluster | 4.0e10 | 1.12 | 5.5e6 | 30 | — |
| g_test_legion | E4 | Test Legion | 5.0e11 | 1.13 | 4.0e7 | 40 | — |
| g_refactor_daemon | E4 | Refactor Daemon | 6.0e12 | 1.13 | 3.0e8 | 50 | debt −2%/s/szt |
| g_oracle_node | E5 | ORACLE Node | 8.0e13 | 1.12 | 2.5e9 | 80 | — |
| g_dev_collective | E5 | Dev Collective | 1.0e15 | 1.12 | 2.0e10 | 110 | — |
| g_arch_synth | E5 | Architecture Synth | 1.2e16 | 1.13 | 1.5e11 | 150 | — |
| g_titan_forge | E6 | TITAN Forge | 1.6e17 | 1.12 | 1.2e12 | 240 | — |
| g_mono_swarm | E6 | Monorepo Swarm | 2.0e18 | 1.12 | 9.0e12 | 330 | — |
| g_demiurge_shard | E7 | DEMIURGE Shard | 3.0e19 | 1.11 | 7.0e13 | 500 | — |
| g_reality_compiler | E7 | Reality Compiler | 4.0e20 | 1.12 | 5.5e14 | 700 | — |
| g_dream_team | E7 | Dream Team | 5.0e21 | 1.12 | 4.5e15 | 950 | — |
| g_ouro_loop | E8 | OUROBOROS Loop | 7.0e22 | 1.11 | 3.5e16 | 1.4e3 | — |
| g_self_writer | E8 | Self-Writing Module | 9.0e23 | 1.11 | 3.0e17 | 2.0e3 | — |
| g_basilisk_eye | E9 | BASILISK Eye | 1.2e25 | 1.10 | 2.5e18 | 3.0e3 | — |
| g_acausal_dev | E9 | Acausal Developer | 1.6e26 | 1.10 | 2.0e19 | 4.2e3 | — |
| g_omega_fragment | E10 | OMEGA Fragment | 2.0e27 | 1.10 | 1.8e20 | 6.0e3 | — |
| g_the_loop | E10 | The Loop | 1.0e29 | 1.10 | 1.5e21 | 9.0e3 | — |

Unlock: `{ era: <era agenta> }` + poprzedni typ ≥ 1 (poza pierwszym w erze). Flavor-teksty (1 linijka/agent) → `en.json` klucze `gen.<id>.flavor` — do napisania w M9 (lekkie, żartobliwe).

## 4. Hardware (`data/hardware.ts`) — compute cap; start: Old Laptop, cap bazowy 6

| id | Era | Nazwa EN | baseCost $ | growth | +cap/szt |
|----|----|----------|-----------|--------|----------|
| h_gaming_rig | E1 | Gaming Rig | 400 | 1.9 | 12 |
| h_workstation | E2 | Workstation | 6.0e3 | 1.9 | 35 |
| h_home_server | E2 | Home Server | 9.0e4 | 2.0 | 100 |
| h_server_rack | E3 | Server Rack | 2.0e6 | 2.0 | 300 |
| h_micro_dc | E4 | Micro Datacenter | 8.0e7 | 2.0 | 900 |
| h_datacenter | E5 | Datacenter | 5.0e9 | 2.1 | 2.8e3 |
| h_hyperscale | E6 | Hyperscale Campus | 8.0e11 | 2.1 | 9.0e3 |
| h_orbital_ring | E8 | Orbital Compute Ring | 5.0e14 | 2.2 | 3.0e4 |
| h_dyson_lattice | E10 | Dyson Lattice | 1.0e18 | 2.2 | 1.0e5 |

## 5. Upgrade'y unikalne (`data/upgrades.ts`) — 36 + formułowe

Formułowe (mechanika, zero contentu): milestony agentów ×2 (03 §3.3). Unikalne (koszt $ jednorazowy; unlock w nawiasie):

| id | Koszt $ | Efekt | Unlock |
|----|---------|-------|--------|
| u_better_prompts | 100 | klik ×2 | LoC≥50 |
| u_snippet_lib | 1.5e3 | klik ×3 | u_better_prompts |
| u_prompt_chains | 8.0e4 | klik ×4 | E2 |
| u_voice_coding | 5.0e6 | klik ×5; flow gain +50% | E3 |
| u_think_mode | 1.0e9 | clickSynergy 0.02→0.05 | E4 |
| u_rubber_duck | 500 | g_autocomplete ×2 | g_autocomplete≥10 |
| u_parrot_treats | 5.0e3 | g_parrot ×2 | g_parrot≥10 |
| u_pair_prog | 2.0e6 | g_muse_pair +1%/szt g_muse_junior | E2, oba≥10 |
| u_swarm_protocol | 8.0e8 | g_intern_swarm ×3 | g_intern_swarm≥25 |
| u_green_ci | 1.0e10 | g_ci_pipeline ×2, debt −10% przyrost | g_ci_pipeline≥10 |
| u_hydra_sync | 2.0e12 | g_hydra_heads +2%/szt g_test_legion | E4 |
| u_oracle_cache | 5.0e15 | g_oracle_node ×3 | E5 |
| u_titan_alloy | 8.0e18 | agenci E6 ×2 | E6 |
| u_shard_merge | 2.0e21 | agenci E7 ×2 | E7 |
| u_global_lint | 2.0e7 | wszyscy agenci +25% | E3 |
| u_monorepo | 6.0e10 | wszyscy agenci +50% | E4 |
| u_agentic_os | 3.0e14 | wszyscy agenci +75% | E5 |
| u_zero_latency | 9.0e17 | wszyscy agenci ×2 | E6 |
| u_post_scarcity | 5.0e22 | wszyscy agenci ×2 | E8 |
| u_invoice_bot | 2.0e4 | payouty +20% | shipCount≥10 |
| u_pricing_ai | 4.0e7 | payouty +35% | E3 |
| u_enterprise_tier | 1.0e11 | revenue/s +50% | E4 |
| u_subscription | 8.0e13 | revenue/s +75% | E5 |
| u_lock_in | 6.0e16 | payouty i revenue +50% | E6 |
| u_launch_videos | 1.0e5 | hype za ship +50% | hype≥2 pierwszy raz |
| u_influencer_bot | 3.0e8 | hype τ 90→150 s | E3 |
| u_keynote_mode | 7.0e12 | hype cap 5→7 | E5 |
| u_evergreen | 2.0e18 | podłoga hype 1.0→1.5 | E7 |
| u_linters | 5.0e4 | debtFactor −15% | debt≥500 |
| u_code_review | 9.0e6 | debtFactor −20% | E3 |
| u_static_analysis | 2.0e10 | quality +0.05 | E4 |
| u_formal_verif | 8.0e14 | bug P max −30% | E6 |
| u_self_healing | 1.0e19 | auto-fix bez opóźnienia | E7 |
| u_undervolting | 3.0e5 | compute use wszystkich −10% | E2 |
| u_liquid_cooling | 7.0e9 | compute use −15% | E4 |
| u_quantum_sched | 5.0e16 | compute use −20% | E6 |

Wzorzec na przyszłe ery/1.x: każda era dostaje min. 3 upgrade'y (klik/globalny/tematyczny) — koszty ≈ koszt 3. agenta ery ×0.5.

## 6. Research (`data/research.ts`) — 3 gałęzie × 10, koszt RP: 2,3,5,8,12,18,25,35,50,70

| Tier | Throughput (r_t1…) | Quality (r_q1…) | Automation (r_a1…) |
|------|---------------------|------------------|---------------------|
| 1 | LoC +25% | quality +0.10 | auto-prompt (2% locRate/s jako kliki) |
| 2 | clickSynergy →0.04 | debtFactor −15% | auto-buy agentów (toggle/typ) |
| 3 | LoC +50% | bug P −20% | auto-fix bugów (delay 30 s) |
| 4 | agenci starszych er +100% | quality +0.15 | plansza projektów 3→5 slotów |
| 5 | LoC +75% | refactor: debt ×0.4→×0.3 | auto-refresh planszy |
| 6 | flow trwa 30→45 s | QA boty ×2 skuteczniejsze | auto-ship wg priorytetu |
| 7 | LoC +100% | quality +0.15 (suma 0.40 bazowo… patrz niżej) | build time −30% |
| 8 | clickSynergy →0.10 | bug penalty 0.4→0.55 | offline cap 8→12h |
| 9 | LoC +150% | debtFactor −25% | auto-refactor (suwak progu) |
| 10 | LoC ×3 | quality +0.20 | offline cap →24h + auto-buy hardware |

Quality sumarycznie z researchu: 0.10+0.15+0.15+0.20 = 0.60; +perki Insight do 0.9 max (03 §6). RP w obiegu kampanii: ~250 (pierwsze shipy ~30 szablonów ×1–3 RP × tiery + milestony shipów 10/100/1k/10k: +10/20/30/40 RP + eventy ~30 RP) → na pełne 2 gałęzie + pół trzeciej; Founder's Instinct (q_) czyni research trwałym → docelowo wszystko. Wybór kolejności = strategia.

## 7. Projekty (`data/projects.ts`) — szablony; wzory payout/revenue: 03 §5.1 (valueRatio w tabeli)

| id | Era | Nazwa EN | costLoC | valueRatio | build s | bonus |
|----|----|----------|---------|-----------|---------|-------|
| p_llama_todo | E1 | Llama Farm Todo | 25 | 1.0 | 15 | tutorial |
| p_landing | E1 | Landing Page Rush | 300 | 1.2 | 20 | — |
| p_scope_creep | E1 | Scope Creep Special | 2.0e3 | 0.8 | 40 | +1 RP (pierwsze 3) |
| p_micro_saas | E2 | Micro-SaaS | 3.0e4 | 1.2 | 30 | hype +0.3 |
| p_chirper_bot | E2 | Chirper Bot | 2.0e5 | 0.9 | 25 | hype +0.5 |
| p_mvp | E3 | Startup MVP | 3.0e6 | 1.3 | 45 | +2 RP (pierwsze 3) |
| p_dashboard | E3 | Analytics Dashboard | 2.0e7 | 1.1 | 50 | — |
| p_enterprise_mig | E4 | Enterprise Migration | 4.0e8 | 1.5 | 90 | — |
| p_compliance | E4 | Compliance Engine | 3.0e9 | 1.2 | 75 | bug-odporny |
| p_copilot_clone | E5 | AI Copilot Clone | 5.0e10 | 1.3 | 60 | hype +0.6 |
| p_cloud_platform | E5 | Cloud Platform | 4.0e11 | 1.4 | 100 | +3 RP (pierwsze 3) |
| p_banking_core | E6 | National Banking Core | 6.0e12 | 1.5 | 120 | — |
| p_self_driving | E6 | Self-Driving Stack | 5.0e13 | 1.2 | 90 | hype +0.8 |
| p_city_os | E7 | City OS | 8.0e14 | 1.4 | 110 | — |
| p_synth_workforce | E7 | Synthetic Workforce | 7.0e15 | 1.3 | 100 | — |
| p_logistics_brain | E8 | Global Logistics Brain | 1.0e17 | 1.5 | 120 | — |
| p_climate_rewrite | E8 | Climate Model Rewrite | 9.0e17 | 1.2 | 100 | +3 RP (pierwsze 3) |
| p_mind_upload | E9 | Mind Upload Beta | 1.5e19 | 1.4 | 110 | hype +1.0 |
| p_reality_patch | E9 | Reality Patch | 1.2e20 | 1.3 | 90 | — |
| p_planetary_os | E10 | Planetary OS | 2.0e21 | 1.5 | 150 | — |
| p_omega_request | E10 | OMEGA REQUEST: [generated] | 3.0e22 | 2.0 | 60 | tylko Akt 5+ (05 a5_02) |

**Specjalne (zawsze dostępne):** `p_refactor` (koszt = 60 s locRate, build 30 s, debt ×0.4, bez payout), `p_open_source` (koszt = 45 s locRate, $0, +2 RP, hype +0.4; cooldown 10 min). Po 2 szablony na erę dla rozmaitości planszy + 1 szablon/era dodawany w 1.x (wzorzec: costLoC ≈ 30 s × locRate ery, valueRatio 0.8–1.5).

## 8. Drzewko Insight (`data/prestige.ts`) — 25 węzłów (koszty Insight)

**Velocity:** i_v1 start z 5×g_autocomplete (5) → i_v2 LoC +25% (10) → i_v3 agenci −15% kosztu (20) → i_v4 LoC +50% (40) → i_v5 era_skip: start E2 (80) → i_v6 flow: mult ×5→×7 (160) → i_v7 era_skip: start E3 (320) → i_v8 LoC ×2 (500)
**Capital:** i_c1 start $500 (5) → i_c2 payout +25% (10) → i_c3 hype τ +60 s (20) → i_c4 start $ = 1% z przed-rewrite (40) → i_c5 revenue +50% (80) → i_c6 sloty produktów +2 (160) → i_c7 golden clients 5% (320) → i_c8 $ ×2 (500)
**Craft:** i_k1 debtFactor −20% (5) → i_k2 offline +4h (10) → i_k3 quality +0.05 (20) → i_k4 QA ×2 (40) → i_k5 bug penalty →0.6 (80) → i_k6 refactor instant (160) → i_k7 quality +0.10 (320) → i_k8 debt rośnie 2× wolniej (500)
**Core:** i_core_automation — automatyzacje przeżywają REWRITE (50; wymaga 1 węzła T3 dowolnej gałęzi)

## 9. Perki Equity (`data/prestige.ts`) — koszt Equity

| id | Koszt | Efekt |
|----|-------|-------|
| q_founder_instinct | 3 | research/RP przeżywa EXIT |
| q_angel_network | 2 | po reset: $ ×10 przez 1h |
| q_serial_founder | 4 | era_skip działa też po EXIT |
| q_board_seat | 5 | run modifiers (niżej) |
| q_war_chest | 6 | start $ ×100 |
| q_talent_magnet | 8 | agenci −20% kosztu (trwale) |
| q_legacy_brand | 8 | podłoga hype ×2 |
| q_open_source_soul | 10 | RP gain ×2 |
| q_compounding | 12 | equityMult wykładnik +0.05 |
| q_head_start | 15 | start era = min(1+exits, 5) |
| q_iron_stomach | 10 | incydenty: kary −50% |
| q_pivot_master | 12 | próg REWRITE 25%→10% |
| q_automation_suite | 18 | cała automatyzacja od startu |
| q_muse_memory | 20 | asystent daje hinty optymalizacyjne (tooltips "co kupić") |
| q_golden_gut | 25 | plansza: +1 oferta rzadka (×3 payout) |

**Run modifiers (q_board_seat):** `no_click` (equity ×1.5), `debt_storm` (debt ×3 → ×2), `indie` (tylko agenci ≤E3 → ×3), `blackout` (offline 0 → ×1.5). Aktywowane przy starcie runu po EXIT.

## 10. Achievementy (`data/achievements.ts`) — 50, każdy +1% LoC (additive)

| Kategoria | Progi (po 1 achievement) | Szt. |
|-----------|--------------------------|------|
| Shipped | 1, 10, 100, 1e3, 1e4 | 5 |
| Lifetime LoC | 1e6, 1e9, 1e12, 1e15, 1e20, 1e25, 1e30, 1e35 | 8 |
| Lifetime $ | 1e6, 1e9, 1e12, 1e18, 1e24, 1e30 | 6 |
| Agenci łącznie | 50, 250, 1e3, 5e3 | 4 |
| Rewrites | 1, 5, 15, 30 | 4 |
| Exits | 1, 3, 5 | 3 |
| Iterations | 1, 5, 10 | 3 |
| Ery | E3, E5, E7, E10 | 4 |
| Research | 10 węzłów, pełna gałąź, wszystkie 30 | 3 |
| Bugi naprawione | 10, 100, 1e3 | 3 |
| Specjalne | flow 10 min nieprzerwanie; debt=0 przy LoC>1e9; refactor ×50; hype=cap; ending A; B; C | 7 |

Nazwy/opisy (żarty dev-kultury) → `en.json`, do napisania w M11 (np. `a_ship_1`: "Hello, World. Literally.").

## 11. Echoes — sklep Paradox (`data/prestige.ts` + `data/story/echoes.ts`)

| id | Koszt Paradox | Efekt |
|----|---------------|-------|
| x_rule_slot_1/2/3 | 5/25/125 | slot reguły automatyzacji (if-then builder) |
| x_start_insight | 10 | start po REWRITE z +10% poprzedniego Insight |
| x_theme_crt / x_theme_glitch / x_theme_void | 3 | motywy terminala (kosmetyka) |
| x_echo_01…20 | 2–50 | fragmenty lore (05 §7) |
| x_paradox_engine | 200 | paradoxMult wykładnik 0.5→0.55 |
