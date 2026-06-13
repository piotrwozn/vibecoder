# VIBECODER — plan implementacji

Idle/incremental o vibecodingu: od darmowego tieru PARROT-1 do osobliwości. Inspiracja strukturą FACEMINER + prestiż (3 warstwy), kampania 50h+, endless, nowoczesna oprawa "IDE/terminal". Bez silnika: TypeScript + Vite, zero zależności runtime. **Web demo** (Akt 0–1) + **pełna gra instalowana na PC** (Tauri).

## Pliki planu

| Plik | Zawartość | Czytaj gdy |
|------|-----------|------------|
| `01-wizja.md` | pitch, filary P1–P7, platformy, zakres, słownik | zawsze najpierw |
| `02-rozgrywka.md` | core loop, zasoby, agenci, projekty, debt, automatyzacja | projektujesz/implementujesz system |
| `03-balans.md` | WSZYSTKIE wzory i stałe, pacing 50h+, notacja | dotykasz liczb |
| `04-prestiz.md` | REWRITE / EXIT / ITERATION, drzewka, wzory | M8, M9, M10 |
| `05-fabula.md` | postacie, 6 aktów, ~83 eventy z triggerami, finał, echoes | M7, M9 |
| `06-ui-ux.md` | art direction, tokeny CSS, layout, ekrany, juice, a11y | każdy task UI |
| `07-architektura.md` | struktura, typy, pętla, save, Big, i18n, platform, wydajność | M0–M4 i przy każdej wątpliwości technicznej |
| `08-roadmapa.md` | milestony M0–M12, AC, zasady i prompty dla Codexa | **start każdej sesji z Codexem** |
| `09-content.md` | tabele: ery, 26 agentów, hardware, upgrade'y, research, projekty, drzewka prestiżu, achievementy | M2+, głównie M9 |
| `10-jakosc.md` | check, walidator contentu, **symulator balansu**, QA | M1+, przed każdym wydaniem |
| `11-wydania.md` | demo vs full, Tauri, CI, wersjonowanie, rozwój po 1.0, ryzyka | M12 i planowanie 1.x |
| `12-prompty.md` | gotowe prompty: implementer (GPT-5.5) + ultra-review (Opus 4.8) + fix, protokół anty-ping-pong | **kopiuj-wklej przy każdym milestone** |

Plus `/AGENTS.md` w korzeniu repo — twarde zasady dla Codexa (czyta je automatycznie).

## Jak z tego korzystać (Ty + Codex)

1. Otwórz `08-roadmapa.md`, weź **najniższy nieukończony milestone**.
2. Daj Codexowi prompt startowy z `08 §14` (wskazuje, które sekcje planu czytać).
3. Po implementacji: `npm run check` + ręczny smoke + odhacz AC w roadmapie (edytuj plik — to żywy dokument).
4. Liczby się nie zgadzają / gra nudna w X godzinie → odpal sim (`10 §3`), popraw stałe w `03`/`09`, dopiero potem kod.
5. Nowe pomysły w trakcie → dopisz do `11 §5` (backlog), nie do bieżącego milestone'u.

## Stan decyzji (zamrożone)

TS+Vite, zero runtime deps • oprawa: nowoczesne IDE/terminal • język gry: EN przez i18n (PL po 1.0) • kampania 50h+ • demo web = Akt 0–1 + E2, save przenosi się do pełnej wersji • desktop: Tauri 2 (fallback Electron) • tytuł roboczy: VIBECODER.
