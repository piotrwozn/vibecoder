# Review #<k> — M<N>
Reviewer: <model> | Data: <YYYY-MM-DD>
Status: OPEN   <!-- OPEN → FIXED (Codex) → DONE / ESCALATE (reviewer, runda 2) -->
VERDICT: CHANGES REQUIRED | APPROVED

## MUST FIX (P0/P1 — blokuje merge)
<!-- reviewer wypełnia; Codex odhacza [x] i dopisuje fix-note. Format pozycji: -->
- [ ] **P0-1** | `src/plik.ts:42` — co jest źle — dlaczego (cytat: plan/XX §Y / AC z plan/08 M<N>) — kierunek naprawy (1 zdanie)
  - fix-note: _(wypełnia Codex: co zrobiono + test regresyjny)_

## ADVISORY (P2 — nie blokuje)
- [ ] **P2-1** | `…` — opis — odniesienie do planu
  - fix-note: _(Codex naprawia tylko gdy <10 linii; inaczej wpisz "→ backlog")_

## DISPUTED (wypełnia Codex, rozstrzyga człowiek)
<!-- pozycje, z którymi Codex się nie zgadza: id znaleziska + uzasadnienie z cytatem z planu -->
_(brak)_

## PLAN-ISSUES (uwagi reviewera do samego planu — nieblokujące)
_(brak)_

## Runda 2 — weryfikacja (wypełnia reviewer)
- Naprawy zweryfikowane: <lista id: OK / NADAL ZŁE>
- Nowe P0 wprowadzone poprawkami: _(tylko P0; brak = brak)_
- Decyzja: DONE / ESCALATE + powód
