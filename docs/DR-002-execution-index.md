---
title: DR-002 — Indice di esecuzione (execution ledger)
traces_to: DR-002
taskboard: DR-002-taskboard.md
updated: 2026-09-14
---

# DR-002 — Indice di esecuzione

Fonte di verità dello stato dei task. Il taskboard è in [DR-002-taskboard.md](DR-002-taskboard.md).

## Regole d'uso (obbligatorie per ogni esecutore, umano o agente)

1. **Prima di iniziare un task**: LEGGI questo indice. Verifica che le sue dipendenze siano `DONE`.
   Se una dipendenza non è `DONE` → non partire (stato `BLOCKED`), non assumere.
2. **Durante**: metti la tua riga a `WIP`.
3. **Ultimo passo del task**: aggiorna la tua riga (`Stato` + `Evidenza/Output` + `Aggiornato`) e,
   se hai trovato un blocco o hai dovuto fare STOP, aggiungi una riga nel **Log** in fondo.
4. **Un file, un owner**: rispetta la "Mappa file → task". Se ti serve un file di cui non sei owner,
   FERMATI e segnalalo nel Log — non modificarlo.
5. Non marcare `DONE` senza l'evidenza di acceptance del task.

Stati: `TODO` · `WIP` · `BLOCKED` · `DONE` · `SKIP`.

## Stato dei task

| Task | Titolo | Track | Es. | Dipende da | Stato | Evidenza/Output | Aggiornato |
|---|---|---|---|---|---|---|---|
| TK-001.1 | G0 · Decisione modulo/campi/dominio | — | human | — | DONE | docs/action-log.md | 2026-09-14 |
| TK-001.2 | G0 · Scaffold demo/index.html | — | agent | TK-001.1 | DONE | demo/index.html: 3 campi target etichettati (label+aria-describedby) + 1 campo sensibile (password) come caso negativo INV-4 | 2026-09-14 |
| TK-001.3 | G0 · Verifica DOM semantico | — | human | TK-001.2 | DONE | Confermato da Alessandro Musio: demo/index.html verificato nel browser, label/aria-describedby corretti | 2026-09-14 |
| TK-002.1 | S1 · Contratto lib/messages.js | A | agent | TK-001.1 | DONE | lib/messages.js: ACCANTO_EXPLAIN + createExplainRequest/Success/Error + JSDoc FieldContext | 2026-09-14 |
| TK-002.2 | S1 · manifest.json | A | agent | TK-002.1 | DONE | manifest.json creato, JSON validato (node -e JSON.parse); host_permissions/content_scripts ristretti a http://localhost/* (INV-3); nessuna <all_urls> | 2026-09-14 |
| TK-002.3 | S1 · Placeholder + load-check | A | agent | TK-002.2 | WIP | Placeholder creati (background.js, content.js, content.css, lib/context.js, lib/prompt.js, lib/fallback.js, options.html, options.js). Manca il load-check umano in chrome://extensions (carica senza errori, scorciatoia Alt+Shift+A registrata in chrome://extensions/shortcuts) | 2026-09-14 |
| TK-003.1 | S2 · lib/prompt.js | A | agent | TK-002.1 | TODO | | |
| TK-003.2 | S2 · options.html + options.js | A | agent | TK-002.2 | TODO | | |
| TK-003.3 | S2 · background.js (fallback-first) | A | agent | TK-002.1, TK-003.1 | TODO | | |
| TK-005.1 | S4 · lib/fallback.js | A | agent | TK-001.1 | TODO | | |
| TK-004.1 | S3 · lib/context.js | B | agent | TK-002.1 | TODO | | |
| TK-004.2 | S3 · content.js | B | agent | TK-002.1, TK-004.1 | TODO | | |
| TK-004.3 | S3 · content.css | B | agent | TK-004.2 | TODO | | |
| TK-006 | G-FASE · Integrazione + SEC-GATE | — | human | TK-003.3, TK-004.2, TK-005.1 | TODO | | |
| TK-007.1 | S2b · Attiva fetch LLM | A | agent | TK-006 | TODO | | |
| TK-008.1 | S5 · Test L1 statici | B | agent | TK-002.2, TK-004.2 | TODO | | |
| TK-008.2 | S5 · Test L2 DOM fixture | B | agent | TK-004.2 | TODO | | |
| TK-008.3 | S5 · Spike Playwright (cap 20') | B | agent | TK-008.2 | TODO | | |
| TK-009.1 | S6 · Persona & Barriera | B | either | demo osservabile | DONE | docs/deliverable-1-persona-barriera.md: persona Marco + momento del blocco su #classe-invalidita (demo/index.html), con nota sugli altri 2 campi target | 2026-09-14 |
| TK-009.2 | S6 · Percorso Assistito (before/after) | B | either | demo osservabile | DONE | docs/deliverable-2-percorso-assistito.md: before/after su #classe-invalidita (stesso campo/persona di TK-009.1); "dopo" dichiarato come progetto vincolato dai contratti (manifest.json, lib/messages.js), non ancora verificato end-to-end (TK-014 pendente) | 2026-09-14 |
| TK-009.3 | S6 · Autonomia & Limiti + nota AI | B | either | TK-006 | TODO | | |
| TK-010 | Skill extract-field-context | B | agent | TK-004.1 | TODO | | |
| TK-011 | Skill prompt-da-dato-non-fidato | A | agent | TK-003.1 | TODO | | |
| TK-012 | Skill announce-aria-live | B | agent | TK-004.2 | TODO | | |
| TK-013 | Skill test-annuncio-screen-reader | B | agent | TK-008.1/.2/.3 | TODO | | |
| TK-014 | G-SR · Test screen reader reale | — | human | build integrata | TODO | | |
| TK-015 | Runbook/README della demo | — | either | TK-001, TK-002.2 (DONE) | WIP | docs/RUNBOOK.md bozza: passi 1-2 pronti; 3-5 TODO finché Fase 1 non è DONE | 2026-09-14 |
| TK-016 | Script della demo live | — | either | demo osservabile (G0 DONE) | DONE | docs/demo-script.md: scaletta before/after su 2-3 campi + frase AI | 2026-09-14 |

## Mappa file → task owner (un file, un solo owner)

| File / cartella | Owner | Note |
|---|---|---|
| docs/action-log | TK-001.1 | decisioni G0 (campi target, dominio) |
| demo/index.html | TK-001.2 | (TK-001.3 solo correzioni) |
| lib/messages.js | TK-002.1 | **congelato**: nessun altro lo modifica |
| manifest.json | TK-002.2 | owner unico |
| background.js | TK-003.3 | poi TK-007.1 (stesso owner, sequenziale) |
| options.html / options.js | TK-003.2 | |
| lib/prompt.js | TK-003.1 | |
| lib/fallback.js | TK-005.1 | |
| lib/context.js | TK-004.1 | |
| content.js | TK-004.2 | |
| content.css | TK-004.3 | usa i class name di content.js |
| tests/l1/** | TK-008.1 | |
| tests/l2/** | TK-008.2 | |
| tests/spike/** | TK-008.3 | |
| docs/ (deliverable) | TK-009.1/.2/.3 | |
| skills/extract-field-context/** | TK-010 | |
| skills/prompt-da-dato-non-fidato/** | TK-011 | |
| skills/announce-aria-live/** | TK-012 | |
| skills/test-annuncio-screen-reader/** | TK-013 | |
| docs/RUNBOOK.md | TK-015 | runbook operativo della demo |
| docs/demo-script.md | TK-016 | scaletta demo live (distinta dal deliverable TK-009.2) |

## Milestone

- [ ] **M1 — Walking skeleton demo-safe** (TK-006 = DONE): giro completo su 1 campo con fallback + SEC-GATE verde.
- [ ] **M2 — LLM reale** (TK-007.1 = DONE).
- [ ] **M3 — Testato** (TK-008.1/.2 = DONE; TK-008.3 DONE o degradato documentato).
- [ ] **M4 — Verificato a11y reale** (TK-014 = DONE) → gate finale bloccante.
- [ ] **M5 — Deliverable pronti** (TK-009.x = DONE).

## Log (append-only)

| Data/ora | Task | Evento (WIP/DONE/BLOCKED/STOP) | Nota |
|---|---|---|---|
| 2026-09-14 | — | INIT | Indice creato da DR-002; tutti i task TODO. |
| 2026-09-14 | TK-001.1 | DONE | Modulo scelto: invalidità civile stile INPS; campi target e dominio (http://localhost) registrati in docs/action-log.md. |
| 2026-09-14 | TK-001.2 | DONE | demo/index.html creato con i 3 campi target (#classe-invalidita, #impegnativa, #esenzione-ticket) e il campo sensibile #pin-area-riservata. In attesa di TK-001.3 (verifica umana DevTools). |
| 2026-09-14 | TK-001.3 | DONE | Verifica umana confermata: label/aria-describedby corretti sui campi target. TK-001 chiuso, sblocca TK-002. |
| 2026-09-14 | TK-002.1/.2 | DONE | Contratto messaggi (lib/messages.js) e manifest.json creati; host_permissions/content_scripts ristretti a http://localhost/*, nessuna <all_urls> (INV-3). |
| 2026-09-14 | TK-002.3 | WIP | Placeholder di tutti i file segnaposto creati (background.js, content.js, content.css, lib/context.js, lib/prompt.js, lib/fallback.js, options.html, options.js). Manca il load-check umano in chrome://extensions. |
| 2026-09-14 | TK-015/016 | ADD | Taskificati runbook demo (docs/RUNBOOK.md) e script demo live (docs/demo-script.md); board+indice aggiornati. Lane presentazione/docs, non collide col codice. |
| 2026-09-14 | TK-015/016 | WIP | Presi in carico da questa sessione (lane docs/presentazione); stesura RUNBOOK.md e demo-script.md. |
| 2026-09-14 | TK-016 | DONE | docs/demo-script.md creato (scaletta before/after + frase AI). Rifinire dopo build. |
| 2026-09-14 | TK-015 | WIP | docs/RUNBOOK.md bozza: passi 1-2 eseguibili; 3-5 TODO fino a Fase 1 DONE. |
| 2026-09-14 | TK-009.1 | WIP | Preso in carico: deliverable "Persona & Barriera" in docs/. Dipendenza "demo osservabile" verificata DONE (TK-001.2/.3). |
| 2026-09-14 | TK-009.1 | DONE | docs/deliverable-1-persona-barriera.md creato: ancorato a demo/index.html (#classe-invalidita come momento esatto del blocco) e action-log.md. Indice CLAUDE.md aggiornato (DR-003). |
| 2026-09-14 | TK-009.2 | WIP | Preso in carico: deliverable "Percorso Assistito (before/after)" in docs/. Dipendenza "demo osservabile" verificata DONE (TK-001.2/.3). |
| 2026-09-14 | TK-009.2 | DONE | docs/deliverable-2-percorso-assistito.md creato: before osservato + after di progetto sullo stesso campo/persona di TK-009.1, con nota esplicita che il giro end-to-end non è ancora implementato/verificato (TK-002.3/003.x/004.x/TK-014). Indice CLAUDE.md aggiornato (DR-003). |
