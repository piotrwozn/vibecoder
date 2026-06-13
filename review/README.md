# Folder `review/` — wymiana Codex ↔ Claude Code przez pliki

Tu lądują review milestone'ów. Proces: `plan/08 §15`, prompty: `plan/12-prompty.md`.

## Zasady
- Jeden plik = jeden cykl review jednego milestone'u: `review_1.md`, `review_2.md`, … (kolejny wolny numer; obie rundy w tym samym pliku).
- Plik tworzy **reviewer** (Claude Code/Opus) na bazie `_template.md`. Codex go **edytuje tylko w wyznaczonych miejscach**: odhacza `[ ]`→`[x]`, wypełnia `fix-note:` i sekcję DISPUTED. Treści znalezisk nie zmienia.
- Cykl życia `Status:` w nagłówku: `OPEN` (reviewer) → `FIXED` (Codex po poprawkach) → `DONE` albo `ESCALATE` (reviewer w rundzie 2). `ESCALATE` = decyzja należy do człowieka.
- Plików nie kasujemy — to historia decyzji projektu (commitowane do git).
- Severity: **P0/P1 blokują merge** (sekcja MUST FIX), **P2 nie blokuje** (ADVISORY; Codex naprawia tylko, gdy poprawka <10 linii — reszta idzie do backlogu `plan/11 §5`).
