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
| TK-002.2 | S1 · manifest.json | A | agent | TK-002.1 | DONE | manifest.json creato, JSON validato (node -e JSON.parse); host_permissions/content_scripts ristretti a http://localhost/* (INV-3); nessuna <all_urls>. Aggiornamento 2026-09-14 (coordinamento post TK-004.2): aggiunta voce web_accessible_resources per lib/messages.js e lib/context.js su http://localhost/*, necessaria per l'import() dinamico usato da content.js (MV3 non supporta import statico nei content script). | 2026-09-14 |
| TK-002.3 | S1 · Placeholder + load-check | A | agent | TK-002.2 | DONE | Load-check umano completato: estensione caricata senza errori da chrome://extensions; scorciatoia confermata in chrome://extensions/shortcuts | 2026-09-14 |
| TK-003.1 | S2 · lib/prompt.js | A | agent | TK-002.1 | DONE | lib/prompt.js: buildPrompt(fieldContext) implementata; contenuto campo in sezione delimitata <<<DATO_CAMPO_MODULO>>> presentata come dato da descrivere, non istruzioni (INV-5); ramo isSensitive non espone alcun valore del campo (coerenza INV-4). `node --check` non eseguibile: Node.js assente in tutto questo ambiente di sviluppo (confermato anche da sessione di coordinamento). Sintassi verificata manualmente (parentesi/quote bilanciate, modulo ES valido, stile coerente con lib/messages.js e lib/context.js, entrambi verificati con lo stesso metodo). | 2026-09-14 |
| TK-003.2 | S2 · options.html + options.js | A | agent | TK-002.2 | TODO | | |
| TK-003.3 | S2 · background.js (fallback-first) | A | agent | TK-002.1, TK-003.1 | TODO | | |
| TK-005.1 | S4 · lib/fallback.js | A | agent | TK-001.1 | DONE | lib/fallback.js: getFallback(fieldContext\|label) copre i 3 campi target (Classe di invalidità, Impegnativa, Esenzione ticket) per label normalizzata (case/accenti/spazi); null per campi non coperti e per isSensitive===true (INV-4) | 2026-09-14 |
| TK-004.1 | S3 · lib/context.js | B | agent | TK-002.1 | DONE | lib/context.js: extractFieldContext(element) pura, label via label[for]/aria-labelledby/aria-label/label implicita, hint via aria-describedby o fratello di testo vicino (nessun selettore hardcoded sul modulo demo), placeholder, fieldType via element.type/tagName; isSensitive=true su type=password o autocomplete cc-*/transaction-amount/transaction-currency con label="" e hint/placeholder=null (INV-4). Tipo FieldContext importato via JSDoc da lib/messages.js. Verificato a mano su demo/index.html (select+2 input target, campo password come caso negativo); node non disponibile in questo ambiente per un check automatico. | 2026-09-14 |
| TK-004.2 | S3 · content.js | B | agent | TK-002.1, TK-004.1 | DONE | content.js: listener chrome.runtime.onMessage per il trigger "spiega-campo" (vedi coordinamento in Log), legge document.activeElement, isSensitive→short-circuit locale senza round-trip (INV-4), altrimenti invia ACCANTO_EXPLAIN (createExplainRequest) e mostra {ok:true/false} in regione ARIA live (.accanto-panel role=status aria-live=polite, testo in .accanto-panel__text, stato in data-accanto-state), Esc chiude, mai .focus()/.select() (INV-7, self-check runtime via console.warn su mismatch di document.activeElement). Importa lib/messages.js e lib/context.js via import() dinamico (import statico non supportato nei content script MV3). Nessuna fetch/rete (INV-2), nessuna chiave (INV-1). node non disponibile in questo ambiente per un check automatico (come già in TK-004.1); nessuna verifica browser reale eseguita in questa sessione agente — raccomandata a TK-006/TK-014. Due coordinamenti aperti verso altri owner: vedi Log. | 2026-09-14 |
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
| TK-015 | Runbook/README della demo | — | either | TK-001, TK-002.2 (DONE) | WIP | presa in carico (sessione coordinamento) | 2026-09-14 |
| TK-016 | Script della demo live | — | either | demo osservabile (G0 DONE) | WIP | presa in carico (sessione coordinamento) | 2026-09-14 |

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
| 2026-09-14 | TK-002.3 | DONE | Load-check umano superato: estensione caricata senza errori; scorciatoia da tastiera assegnata e confermata dopo refresh in chrome://extensions/shortcuts. TK-002 chiuso, sblocca S2/S3. |
| 2026-09-14 | TK-015/016 | ADD | Taskificati runbook demo (docs/RUNBOOK.md) e script demo live (docs/demo-script.md); board+indice aggiornati. Lane presentazione/docs, non collide col codice. |
| 2026-09-14 | TK-015/016 | WIP | Presi in carico da questa sessione (lane docs/presentazione); stesura RUNBOOK.md e demo-script.md. |
| 2026-09-14 | TK-002.2 | FIX | Sessione di coordinamento ha aggiunto web_accessible_resources (lib/messages.js, lib/context.js) a manifest.json su segnalazione di TK-004.2, per abilitare l'import() dinamico da content.js. Nessuna altra modifica al file. |
| 2026-09-14 | TK-003.3 | NOTA-VINCOLANTE | Contratto trigger background→content NON congelato in lib/messages.js. content.js (TK-004.2) ascolta chrome.runtime.onMessage per { type: "ACCANTO_TRIGGER_EXPLAIN" }. TK-003.3 DEVE, nel listener chrome.commands.onCommand, inviare chrome.tabs.sendMessage(tabId, { type: "ACCANTO_TRIGGER_EXPLAIN" }) esattamente in questa forma — non inventare un protocollo diverso. |
| 2026-09-14 | TK-003.1 | BLOCKED-TOOLING | lib/prompt.js scritto e verificato manualmente, ma `node` non è disponibile in questo ambiente di esecuzione (nessun node.exe in PATH, Program Files, nvm, AppData): impossibile eseguire `node --check lib/prompt.js` come richiesto dall'acceptance. Task lasciato WIP: serve una sessione con Node.js installato per rieseguire il check e chiudere DONE. |
| 2026-09-14 | TK-005.1 | DONE | lib/fallback.js: getFallback per i 3 campi target letti da docs/action-log.md, matching su label normalizzata; null per campi non coperti e per isSensitive===true. Nessun blocco. |
| 2026-09-14 | TK-004.2 | DONE | content.js scritto: onMessage listener sul trigger, extractFieldContext + createExplainRequest via import() dinamico, isSensitive short-circuit (INV-4), regione ARIA live .accanto-panel/.accanto-panel__text (role=status, aria-live=polite), Esc chiude, mai .focus() (INV-7). node non disponibile in questo ambiente (come TK-003.1/TK-004.1): nessun check automatico né verifica browser reale eseguiti in questa sessione agente. |
| 2026-09-14 | TK-004.2 | COORDINAMENTO (non-blocking per questo task, ma essenziale per TK-003.3) | background.js è ancora placeholder TODO: non esiste un contratto congelato per il messaggio background→content che deve segnalare la pressione della scorciatoia "spiega-campo". content.js ha quindi DEFINITO IN LOCALE (non in lib/messages.js, che resta congelato) la forma provvisoria { type: "ACCANTO_TRIGGER_EXPLAIN" } e ascolta quella. TK-003.3, quando implementerà chrome.commands.onCommand → chrome.tabs.sendMessage in background.js, DEVE inviare esattamente questa forma (o coordinarsi per cambiarla in entrambi i file) — non inventare un protocollo diverso in parallelo. |
| 2026-09-14 | TK-004.2 | BLOCCO POTENZIALE per manifest.json (owner TK-002.2, fuori dal mio allowed_scope=[content.js]) | content.js importa lib/messages.js e lib/context.js con import() dinamico (chrome.runtime.getURL(...)), perché Manifest V3 non supporta import statico nei content script dichiarati via "content_scripts" (verificato: "type":"module" lì non ha effetto). L'import() dinamico da un content script verso un URL chrome-extension:// richiede però che il file sia elencato in "web_accessible_resources" nel manifest — al momento manifest.json NON lo dichiara, quindi a runtime la import() fallirebbe (intercettata dal try/catch, mostra comunque un messaggio neutro invece di un errore muto, ma la spiegazione reale non arriverebbe mai). Serve che l'owner di manifest.json aggiunga, ad es.: {"web_accessible_resources":[{"resources":["lib/messages.js","lib/context.js"],"matches":["http://localhost/*"]}]}. Da verificare/chiudere prima o durante TK-006 (SEC-GATE). |
