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
| TK-001.1 | G0 · Decisione modulo/campi/dominio | — | human | — | TODO | | |
| TK-001.2 | G0 · Scaffold demo/index.html | — | agent | TK-001.1 | TODO | | |
| TK-001.3 | G0 · Verifica DOM semantico | — | human | TK-001.2 | TODO | | |
| TK-002.1 | S1 · Contratto lib/messages.js | A | agent | TK-001.1 | TODO | | |
| TK-002.2 | S1 · manifest.json | A | agent | TK-002.1 | TODO | | |
| TK-002.3 | S1 · Placeholder + load-check | A | agent | TK-002.2 | TODO | | |
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
| TK-009.1 | S6 · Persona & Barriera | B | either | demo osservabile | TODO | | |
| TK-009.2 | S6 · Percorso Assistito (before/after) | B | either | demo osservabile | TODO | | |
| TK-009.3 | S6 · Autonomia & Limiti + nota AI | B | either | TK-006 | TODO | | |
| TK-010 | Skill extract-field-context | B | agent | TK-004.1 | TODO | | |
| TK-011 | Skill prompt-da-dato-non-fidato | A | agent | TK-003.1 | TODO | | |
| TK-012 | Skill announce-aria-live | B | agent | TK-004.2 | TODO | | |
| TK-013 | Skill test-annuncio-screen-reader | B | agent | TK-008.1/.2/.3 | TODO | | |
| TK-014 | G-SR · Test screen reader reale | — | human | build integrata | TODO | | |

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
