---
title: DR-002 — Taskboard della flotta di agenti/skill per Accanto (task atomici)
traces_to: DR-002
date: 2026-09-14
note: task atomici (un file / una funzione, un solo output verificabile). Ai prompt di subagente va anteposto il BLOCCO-CONTESTO. Lo stato di esecuzione vive in DR-002-execution-index.md.
---

# DR-002 — Taskboard esecutivo (atomico)

Decisione: [DR-002-decisione-flotta-agenti.md](DR-002-decisione-flotta-agenti.md).
Indice di esecuzione (stato live): [DR-002-execution-index.md](DR-002-execution-index.md).

Principio di split: **sotto-task sequenziali dentro lo stesso perimetro**, un file/una funzione
per task, un solo criterio di acceptance. Riduce l'allucinazione senza aggiungere costo di merge.

---

## BLOCCO-CONTESTO — da anteporre a OGNI prompt di subagente

```text
Progetto: "Accanto" — estensione browser Manifest V3 (Chrome/Edge), NESSUN build step
(HTML/CSS/JS puro, ES modules; niente bundler/framework/npm a runtime). Aiuta Marco
(ipovedente, screen reader, solo tastiera) a capire i campi di un modulo della PA:
preme una scorciatoia sul campo attivo → l'estensione legge il contesto del campo →
un LLM genera una spiegazione in parole semplici → la spiegazione è annunciata dallo
screen reader via regione ARIA live SENZA spostare il focus.

Repo: c:\local_git\hack\HackatonAI-  (leggi VISION.md, CLAUDE.md, docs/DR-001 per il
perché; sono canonici, NON ridiscuterli).

CONTRATTO MESSAGGI (congelato in lib/messages.js dal task TK-002.1 — NON modificarlo):
- richiesta content→background: { type: "ACCANTO_EXPLAIN", fieldContext: FieldContext }
- risposta background→content:  { ok: true, explanation: string } | { ok: false, error: string }
- FieldContext = { label: string, hint: string|null, placeholder: string|null,
                   fieldType: string, isSensitive: boolean }

INVARIANTI NON NEGOZIABILI (violarli = STOP/rollback, non "fixare a modo tuo"):
INV-1  API key solo in chrome.storage, usata SOLO nel service worker (background.js),
       mai in content.js / pagina / DOM.
INV-2  fetch/rete SOLO dal service worker.
INV-3  host_permissions = solo il dominio del modulo demo, mai <all_urls>.
INV-4  context.js NON legge type=password né campi pagamento (autocomplete cc-*):
       imposta isSensitive=true e nessuna spiegazione viene richiesta.
INV-5  il contenuto della pagina nel prompt è DATO delimitato, mai istruzioni al modello.
INV-6  nessuna auto-compilazione o auto-invio di campi.
INV-7  output solo via aria-live="polite"/role="status", chiudibile con Esc,
       MAI spostare il focus dal campo.
INV-8  nessun build step/bundler/framework/dipendenza npm a runtime.
INV-9  demo solo dati sintetici, mai dati personali reali.
INV-10 DR-001 è canonico, non ridiscuterlo.

ANTI-ALLUCINAZIONE (regole dure):
- NON inventare. Se un file che ti serve non esiste, o manca un'informazione, o il contratto
  non copre il tuo caso: FERMATI e segnalalo (STOP), non supporre.
- Prima di scrivere, LEGGI i file esistenti citati nel task e l'indice di esecuzione
  (DR-002-execution-index.md) per sapere cosa è già fatto. Non assumere lo stato.
- NON ricreare file già esistenti e congelati: importali.
- Produci SOLO ciò che il COMPITO chiede: nessun file, funzione, dipendenza o "miglioria" extra.
- Resta nel PERIMETRO. Se ti serve un file fuori perimetro, FERMATI e segnalalo.

REGOLE DI ESECUZIONE:
- Ambiente Windows; genera i file in UTF-8 SENZA BOM.
- Non introdurre effetti esterni non richiesti. Commit (se richiesti) in italiano, brevi,
  sul "perché"; mai committare API key o dati reali.
- ULTIMO PASSO OBBLIGATORIO: aggiorna la tua riga in DR-002-execution-index.md (Stato + Evidenza)
  e, se hai trovato un blocco, aggiungi una riga nel Log dell'indice.
- Chiudi riportando: file toccati, come hai soddisfatto l'acceptance, quali INV hai presidiato.
```

---

## Task board (atomico)

| Task | Titolo | Track | Es. | Dipende da | File (owner) | Size |
|---|---|---|---|---|---|---|
| TK-001.1 | G0 · Decisione modulo/campi/dominio | — | human | — | docs/action-log | S |
| TK-001.2 | G0 · Scaffold demo/index.html | — | agent | TK-001.1 | demo/index.html | S |
| TK-001.3 | G0 · Verifica DOM semantico | — | human | TK-001.2 | (verifica) | S |
| TK-002.1 | S1 · Contratto lib/messages.js | A | agent | TK-001.1 | lib/messages.js | S |
| TK-002.2 | S1 · manifest.json | A | agent | TK-002.1 | manifest.json | S |
| TK-002.3 | S1 · Placeholder + load-check | A | agent | TK-002.2 | (file vuoti) | S |
| TK-003.1 | S2 · lib/prompt.js (funzione pura) | A | agent | TK-002.1 | lib/prompt.js | S |
| TK-003.2 | S2 · options.html + options.js | A | agent | TK-002.2 | options.* | S |
| TK-003.3 | S2 · background.js (fallback-first) | A | agent | TK-002.1, TK-003.1 | background.js | M |
| TK-005.1 | S4 · lib/fallback.js | A | agent | TK-001.1 | lib/fallback.js | S |
| TK-004.1 | S3 · lib/context.js (funzione pura) | B | agent | TK-002.1 | lib/context.js | S |
| TK-004.2 | S3 · content.js | B | agent | TK-002.1, TK-004.1 | content.js | M |
| TK-004.3 | S3 · content.css | B | agent | TK-004.2 | content.css | S |
| TK-006 | G-FASE · Integrazione + SEC-GATE | — | human | TK-003.3, TK-004.2, TK-005.1 | — | S |
| TK-007.1 | S2b · Attiva fetch LLM | A | agent | TK-006 | background.js | S |
| TK-008.1 | S5 · Test L1 statici | B | agent | TK-002.2, TK-004.2 | tests/l1 | S |
| TK-008.2 | S5 · Test L2 DOM fixture | B | agent | TK-004.2 | tests/l2 | M |
| TK-008.3 | S5 · Spike Playwright (cap 20') | B | agent | TK-008.2 | tests/spike | S |
| TK-009.1 | S6 · Deliverable Persona&Barriera | B | either | demo osservabile | docs/ | S |
| TK-009.2 | S6 · Deliverable Percorso Assistito | B | either | demo osservabile | docs/ | S |
| TK-009.3 | S6 · Deliverable Autonomia&Limiti + nota AI | B | either | TK-006 | docs/ | S |
| TK-010 | Skill extract-field-context | B | agent | TK-004.1 | skills/ | S |
| TK-011 | Skill prompt-da-dato-non-fidato | A | agent | TK-003.1 | skills/ | S |
| TK-012 | Skill announce-aria-live | B | agent | TK-004.2 | skills/ | S |
| TK-013 | Skill test-annuncio-screen-reader | B | agent | TK-008.x | skills/ | S |
| TK-014 | G-SR · Test screen reader reale | — | human | build integrata | — | S |

Percorso critico demo-safe: **TK-001.x → TK-002.x → (TK-003.x + TK-005.1 ‖ TK-004.x) → TK-006**.

---

## Fase 0 — G0 (precondizione)

### TK-001.1 · Decisione modulo/campi/dominio (human)
```yaml
outcome: modulo PA scelto; 2-3 campi target elencati con label esatte e scopo; dominio host_permissions deciso; tutto scritto in docs/action-log
acceptance_evidence: docs/action-log contiene modulo, elenco campi target (label+scopo), dominio; almeno 1 campo sensibile (password/pagamento) previsto come caso negativo
allowed_scope: [docs/action-log]
forbidden_scope: [codice, dati reali]
depends_on: []
size: S ; executor: human
```
Checklist: scegli il modulo (mock realistico consigliato); elenca 2-3 campi critici con la label
esatta; decidi il dominio (es. `http://localhost`); prevedi 1 campo password/pagamento come caso
negativo. Scrivi tutto in `docs/action-log`. Aggiorna l'indice.

### TK-001.2 · Scaffold demo/index.html (agent) — *anteponi BLOCCO-CONTESTO*
```yaml
outcome: demo/index.html — modulo PA sintetico con i campi target di TK-001.1
acceptance_evidence: demo/index.html apre nel browser; i campi target hanno <label for>/aria-labelledby (+ eventuale aria-describedby); presente 1 campo password o autocomplete=cc-number
allowed_scope: [demo/index.html] ; forbidden_scope: [tutto il resto]
depends_on: [TK-001.1] ; size: S ; executor: agent
```
```text
RUOLO: costruisci SOLO demo/index.html. LEGGI prima docs/action-log per l'elenco esatto dei campi
target e il dominio (TK-001.1). Se l'elenco non c'è: STOP.
COMPITO: crea un modulo PA sintetico e realistico con i campi target indicati, etichettati
semanticamente, + almeno un campo type="password" o autocomplete="cc-number" (caso negativo INV-4).
Solo dati sintetici (INV-9). Alto contrasto, HTML valido, nessuno script di build. In cima un
commento con l'elenco dei campi e il loro scopo.
ACCEPTANCE: apre nel browser; i campi target espongono contesto testuale; presente il campo sensibile.
OUTPUT: contenuto del file + conferma. Aggiorna l'indice.
```

### TK-001.3 · Verifica DOM semantico (human)
```yaml
outcome: conferma che i campi target sono estraibili (label associata via DOM); se non lo sono, demo/index.html corretto
acceptance_evidence: in DevTools ogni campo target mostra un nome accessibile non vuoto
allowed_scope: [demo/index.html (solo correzioni)] ; depends_on: [TK-001.2] ; size: S ; executor: human
```

---

## Fase 1 — Fondazione (Track A)

### TK-002.1 · lib/messages.js — contratto congelato (agent) — *anteponi BLOCCO-CONTESTO*
```yaml
outcome: lib/messages.js esporta il type ACCANTO_EXPLAIN, factory richiesta/risposte e JSDoc di FieldContext
acceptance_evidence: il file importa senza errori (node --check o import in console); documenta ESATTAMENTE lo shape del BLOCCO-CONTESTO
allowed_scope: [lib/messages.js] ; forbidden_scope: [tutto il resto]
depends_on: [TK-001.1] ; size: S ; executor: agent
```
```text
RUOLO: scrivi SOLO lib/messages.js. È il contratto congelato: nessun altro task lo riscriverà.
COMPITO: esporta la costante TYPE="ACCANTO_EXPLAIN"; una factory per la richiesta
{ type, fieldContext } e due helper per le risposte { ok:true, explanation } / { ok:false, error };
un commento JSDoc con lo shape FieldContext ESATTO del BLOCCO-CONTESTO. Nessun'altra logica.
ACCEPTANCE: node --check passa; lo shape corrisponde al contratto. OUTPUT: file + conferma. Aggiorna l'indice.
```

### TK-002.2 · manifest.json (agent) — *anteponi BLOCCO-CONTESTO*
```yaml
outcome: manifest MV3 con service worker (module), command/scorciatoia, content_scripts su dominio ristretto, permessi minimi
acceptance_evidence: carica in chrome://extensions senza errori; scorciatoia in chrome://extensions/shortcuts; matches = solo dominio di TK-001.1; nessun <all_urls>
allowed_scope: [manifest.json] ; forbidden_scope: [logica dei .js, allargare host_permissions]
depends_on: [TK-002.1] ; size: S ; executor: agent
```
```text
RUOLO: scrivi SOLO manifest.json. LEGGI docs/action-log per il dominio (TK-001.1); se manca: STOP.
COMPITO: MV3; "commands" con scorciatoia dedicata (es. Alt+Shift+A); "background".service_worker=
background.js type=module; "content_scripts".matches ristretti al SOLO dominio demo (INV-3);
"permissions": ["storage","activeTab","scripting" se serve]; MAI <all_urls>.
ACCEPTANCE: carica senza errori; scorciatoia registrata; nessun <all_urls>. OUTPUT: file + conferma. Aggiorna l'indice.
```

### TK-002.3 · Placeholder + load-check (agent) — *anteponi BLOCCO-CONTESTO*
```yaml
outcome: file segnaposto vuoti così l'estensione carica; niente logica
acceptance_evidence: chrome://extensions carica senza errori con tutti i file referenziati presenti
allowed_scope: [background.js, content.js, content.css, lib/context.js, lib/prompt.js, lib/fallback.js, options.html, options.js (solo segnaposto)]
forbidden_scope: [manifest.json, lib/messages.js, logica reale]
depends_on: [TK-002.2] ; size: S ; executor: agent
```
```text
RUOLO: crea SOLO i file segnaposto referenziati dal manifest, con "// TODO: <stream>" e il minimo
per non dare errori (es. background.js e content.js vuoti validi). NON scrivere logica.
ACCEPTANCE: l'estensione carica senza errori. OUTPUT: elenco file creati. Aggiorna l'indice.
```

---

## Fase 1 — Nucleo privilegiato (Track A)

### TK-003.1 · lib/prompt.js — funzione pura (agent) — *anteponi BLOCCO-CONTESTO*
```yaml
outcome: buildPrompt(fieldContext) → string; contesto come DATO delimitato (INV-5)
acceptance_evidence: chiamata con un FieldontContext di esempio produce un prompt che delimita il contenuto e non contiene istruzioni iniettabili; node --check passa
allowed_scope: [lib/prompt.js] ; forbidden_scope: [rete, chiave, altri file]
depends_on: [TK-002.1] ; size: S ; executor: agent
```
```text
RUOLO: scrivi SOLO lib/prompt.js (funzione pura, nessuna rete). Importa il tipo da lib/messages.js.
COMPITO: buildPrompt(fieldContext) → stringa. Il contesto del campo va in una sezione DELIMITATA
come dato non fidato, mai come istruzioni (INV-5). Il prompt chiede una spiegazione in parole
semplici di COSA chiede il campo e PERCHÉ, senza inventare requisiti né consigliare nel merito.
ACCEPTANCE: su un esempio, il contenuto è delimitato e non iniettabile. OUTPUT: file + esempio. Aggiorna l'indice.
```

### TK-003.2 · options.html + options.js (agent) — *anteponi BLOCCO-CONTESTO*
```yaml
outcome: pagina opzioni lato team che salva API key + provider in chrome.storage.local + avviso
acceptance_evidence: salvando, la chiave finisce in chrome.storage.local (DevTools > Application); avviso di invio a servizio AI presente
allowed_scope: [options.html, options.js] ; forbidden_scope: [content side, background.js, esporre la chiave altrove]
depends_on: [TK-002.2] ; size: S ; executor: agent
```
```text
RUOLO: scrivi SOLO options.html e options.js. Config LATO TEAM (non è il flusso di Marco).
COMPITO: form per salvare API key e provider in chrome.storage.local; avviso esplicito che il
contenuto del campo verrà inviato a un servizio AI esterno. La chiave resta qui/nel SW (INV-1).
ACCEPTANCE: la chiave è in chrome.storage.local; avviso presente. OUTPUT: i 2 file. Aggiorna l'indice.
```

### TK-003.3 · background.js — fallback-first (agent) — *anteponi BLOCCO-CONTESTO*
```yaml
outcome: service worker che gestisce comando e ACCANTO_EXPLAIN; risposta da fallback (no LLM ancora); short-circuit su isSensitive; punto d'innesto fetch predisposto ma NON attivo
acceptance_evidence: nel SW, FieldContext non sensibile → { ok:true, explanation }; isSensitive=true → { ok:false } senza chiamare nulla; nessuna chiave nei messaggi verso la pagina
allowed_scope: [background.js] ; forbidden_scope: [content side, options.*, lib/prompt.js (solo import), lib/messages.js (solo import), attivare la fetch]
depends_on: [TK-002.1, TK-003.1] ; size: M ; executor: agent
```
```text
RUOLO: scrivi SOLO background.js (service worker, ES module). Importa lib/messages.js e lib/prompt.js.
COMPITO: listener del command che chiede al content script attivo di leggere il campo;
chrome.runtime.onMessage per ACCANTO_EXPLAIN: se isSensitive=true → { ok:false, error:"campo sensibile" }
senza chiamare nulla (INV-4); altrimenti usa getFallback (import da lib/fallback.js se presente,
altrimenti placeholder locale) e rispondi { ok:true, explanation }. Predisponi (COMMENTATO, non attivo)
il punto per la fetch LLM di TK-007.1 — la fetch vivrà SOLO qui (INV-2). Non esporre la chiave (INV-1).
ACCEPTANCE: vedi acceptance_evidence. OUTPUT: file + conferma INV-1/2/4/5/6. Aggiorna l'indice.
```

### TK-005.1 · lib/fallback.js (agent) — *anteponi BLOCCO-CONTESTO*
```yaml
outcome: getFallback(fieldContext|label) → string|null per i campi target di TK-001.1
acceptance_evidence: con rete OFF, i campi target producono comunque un annuncio; campi non coperti → null
allowed_scope: [lib/fallback.js] ; forbidden_scope: [altri file, dati reali]
depends_on: [TK-001.1] ; size: S ; executor: agent
```
```text
RUOLO: scrivi SOLO lib/fallback.js. LEGGI docs/action-log per i campi target (TK-001.1); se mancano: STOP.
COMPITO: getFallback(fieldContext|label) → spiegazioni precaricate in parole semplici per i 2-3 campi
target, coerenti col tono di lib/prompt.js, senza inventare requisiti; null per campi non coperti.
Solo dati sintetici. ACCEPTANCE: copre i campi target; null altrove. OUTPUT: file + elenco campi. Aggiorna l'indice.
```

---

## Fase 1 — Nucleo pagina (Track B)

### TK-004.1 · lib/context.js — funzione pura (agent) — *anteponi BLOCCO-CONTESTO*
```yaml
outcome: extractFieldContext(element) → FieldContext, con isSensitive per password/pagamento (INV-4)
acceptance_evidence: su un campo etichettato ritorna label/hint/placeholder/fieldType; su type=password o cc-* → isSensitive=true e nessun testo del campo
allowed_scope: [lib/context.js] ; forbidden_scope: [rete, chiave, altri file, selettori hardcoded sul modulo demo]
depends_on: [TK-002.1] ; size: S ; executor: agent
```
```text
RUOLO: scrivi SOLO lib/context.js (funzione pura). Importa il tipo da lib/messages.js.
COMPITO: extractFieldContext(element) → FieldContext. label via <label for>/aria-labelledby/aria-label;
hint via aria-describedby o testo vicino; placeholder; fieldType. isSensitive=true se type="password"
o autocomplete cc-*/pagamento, e in tal caso non restituire testi del campo (INV-4). Nessun selettore
hardcoded sul modulo specifico. ACCEPTANCE: vedi sopra. OUTPUT: file + conferma INV-4. Aggiorna l'indice.
```

### TK-004.2 · content.js (agent) — *anteponi BLOCCO-CONTESTO*
```yaml
outcome: alla scorciatoia legge activeElement, invia ACCANTO_EXPLAIN, annuncia la risposta in regione ARIA live SENZA spostare il focus, Esc chiude
acceptance_evidence: sul demo, Tab→scorciatoia→annuncio in aria-live→document.activeElement invariato→Esc chiude
allowed_scope: [content.js] ; forbidden_scope: [background.js, options.*, lib/prompt.js, fetch/rete, lettura chiave, spostare il focus, lib/messages.js/lib/context.js (solo import)]
depends_on: [TK-002.1, TK-004.1] ; size: M ; executor: agent
```
```text
RUOLO: scrivi SOLO content.js. Importa lib/messages.js e lib/context.js (non modificarli).
COMPITO: alla ricezione del comando dal SW, leggi document.activeElement, costruisci il FieldContext
con extractFieldContext, invia ACCANTO_EXPLAIN, mostra la risposta in una regione ARIA live
(aria-live="polite", role="status"). NON spostare MAI il focus (INV-7). Esc chiude. { ok:false } →
messaggio neutro. Emetti in un commento i class name CSS usati (per TK-004.3). Niente fetch (INV-2),
niente chiave (INV-1). ACCEPTANCE: vedi sopra. OUTPUT: file + i class name + come hai verificato il
non-furto di focus. Aggiorna l'indice.
```

### TK-004.3 · content.css (agent) — *anteponi BLOCCO-CONTESTO*
```yaml
outcome: stile del pannello ad alto contrasto, non invasivo, accessibile
acceptance_evidence: usa i class name emessi da TK-004.2; testo ridimensionabile; rispetta prefers-reduced-motion; nessuna info dal solo colore
allowed_scope: [content.css] ; forbidden_scope: [tutto il resto]
depends_on: [TK-004.2] ; size: S ; executor: agent
```
```text
RUOLO: scrivi SOLO content.css. LEGGI il commento con i class name in content.js (TK-004.2); se mancano: STOP.
COMPITO: stile del pannello: alto contrasto, non invasivo, testo ridimensionabile (unità relative),
prefers-reduced-motion rispettato, nessuna informazione veicolata dal solo colore.
ACCEPTANCE: vedi sopra. OUTPUT: file. Aggiorna l'indice.
```

---

## TK-006 · G-FASE — Integrazione + SEC-GATE (gate umano, go/no-go)
```yaml
outcome: track integrati; walking skeleton verde su 1 campo con fallback; checklist EV-003 passata; go/no-go Fase 2
acceptance_evidence: giro completo funzionante + checklist tutta verde + tempo residuo annotato in docs/action-log
depends_on: [TK-003.3, TK-004.2, TK-005.1] ; size: S ; executor: human
```
Checklist SEC-GATE (nessun merge senza tutto verde): [ ] grep `apiKey`/`chrome.storage.get` assenti in
content.js/lib/context.js (INV-1) · [ ] nessuna fetch in content.js (INV-2) · [ ] host_permissions solo
dominio demo (INV-3) · [ ] password/cc esclusi → isSensitive (INV-4) · [ ] prompt: dato delimitato (INV-5)
· [ ] niente auto-fill (INV-6) · [ ] focus fermo + Esc (INV-7) · [ ] niente build step/npm (INV-8) ·
[ ] Go/No-Go registrato con tempo residuo. Aggiorna l'indice.

---

## Fase 2 — LLM reale (Track A)

### TK-007.1 · Attiva fetch LLM in background.js (agent) — *anteponi BLOCCO-CONTESTO*
```yaml
outcome: background.js sostituisce il fallback con la fetch reale; il fallback resta come rete-safe
acceptance_evidence: con chiave valida → spiegazione reale annunciata; con rete OFF → fallback; chiave mai nei log/messaggi verso la pagina
allowed_scope: [background.js] ; forbidden_scope: [content side, options, lib/prompt.js (solo import), INV-1/2/5]
depends_on: [TK-006] ; size: S ; executor: agent
```
```text
RUOLO: modifica SOLO background.js per attivare il punto d'innesto fetch predisposto in TK-003.3.
COMPITO: leggi la API key da chrome.storage, costruisci il prompt con lib/prompt.js, fai la fetch al
provider (SOLO qui, INV-2). Su errore/timeout/no-rete → getFallback. Non loggare la chiave.
ACCEPTANCE: vedi sopra. OUTPUT: diff + conferma INV-1/2/5. Aggiorna l'indice.
```

---

## Fase 2 — Test (Track B) — obiettivo owner: "testare tutto"

### TK-008.1 · Test L1 statici (agent) — *anteponi BLOCCO-CONTESTO*
```yaml
outcome: check statici (Node, zero browser) che falliscono su violazioni EV-003
acceptance_evidence: il test FALLISCE se: <all_urls> nel manifest, "apiKey"/chrome.storage.get in content.js/lib/context.js, fetch in content.js
allowed_scope: [tests/l1/**] ; forbidden_scope: [codice runtime (leggibile, non modificabile), build step runtime]
depends_on: [TK-002.2, TK-004.2] ; size: S ; executor: agent
```
```text
RUOLO: scrivi SOLO in tests/l1/. Script Node che parsifica manifest.json e grep-a i sorgenti.
COMPITO: verifica no <all_urls>, host ristretto (INV-3); assenza di "apiKey"/chrome.storage.get in
content.js e lib/context.js (INV-1); assenza di fetch/XMLHttpRequest in content.js (INV-2). Esce con
codice ≠0 su violazione. ACCEPTANCE: fallisce davvero sulle violazioni. OUTPUT: come lanciarlo. Aggiorna l'indice.
```

### TK-008.2 · Test L2 DOM fixture (agent) — *anteponi BLOCCO-CONTESTO*
```yaml
outcome: test su demo/ (senza Playwright) del comportamento a11y del pannello
acceptance_evidence: fallisce se: manca aria-live/role=status, il focus si sposta dopo il trigger, la regione non riceve testo, Esc non chiude, password non isSensitive
allowed_scope: [tests/l2/**, deps SOLO di test] ; forbidden_scope: [codice runtime, rilassare un INV per far passare un test]
depends_on: [TK-004.2] ; size: M ; executor: agent
```
```text
RUOLO: scrivi SOLO in tests/l2/. Carica demo/ come file, inietta content.js, usa eventi sintetici.
COMPITO: verifica (a) esiste aria-live="polite"/role="status"; (b) document.activeElement invariato dopo
il trigger (INV-7); (c) la regione live riceve testo; (d) Esc chiude; (e) su campo password isSensitive.
ACCEPTANCE: fallisce sui casi rotti. OUTPUT: come lanciarli + cosa NON copre (→ TK-014). Aggiorna l'indice.
```

### TK-008.3 · Spike Playwright + virtual-SR — cap 20' (agent) — *anteponi BLOCCO-CONTESTO*
```yaml
outcome: tentativo E2E su estensione caricata; se non converge entro 20', degrado documentato
acceptance_evidence: o test E2E verde e stabile, o tests/README documenta il limite (UNK-001) e il degrado a axe + gate manuale
allowed_scope: [tests/spike/**, deps SOLO di test] ; forbidden_scope: [sforare il cap, codice runtime]
depends_on: [TK-008.2] ; size: S ; executor: agent
```
```text
RUOLO: scrivi SOLO in tests/spike/. CAP DURO: 20 minuti. Tenta Playwright + @guidepup/virtual-screen-reader
contro l'estensione caricata (--load-extension, persistent context). Se entro il cap non è verde e stabile:
FERMATI, degrada a un check axe-core sul DOM del pannello, e documenta in tests/README il limite e il perché
(UNK-001). NON sforare. OUTPUT: esito + eventuale nota di degrado. Aggiorna l'indice.
```

---

## Fase 2 — Deliverable (Track B)

### TK-009.1 / .2 / .3 (either) — *anteponi BLOCCO-CONTESTO*
```yaml
TK-009.1: outcome=doc "Persona & Barriera"; base VISION.md; allowed_scope=[docs/]; depends_on=[demo osservabile]
TK-009.2: outcome=doc "Percorso Assistito" con before/after sullo STESSO campo/persona; allowed_scope=[docs/]
TK-009.3: outcome=doc "Autonomia & Limiti" + nota "Contributo AI & revisione umana"; allowed_scope=[docs/]; depends_on=[TK-006]
forbidden_scope: [codice, ridiscutere DR-001] ; size: S ; executor: either
```
```text
RUOLO: scrivi SOLO in docs/ il deliverable indicato. Base: VISION.md (riusala, non riscriverla). Coerenza
OBBLIGATORIA col comportamento reale osservato in demo. Per il before/after: stesso campo, stessa persona.
Per la nota AI: cosa fa il modello, con quali input, dove serve revisione. ACCEPTANCE: documento coerente
con la demo. OUTPUT: percorso + sintesi. Aggiorna l'indice.
```

---

## Fase 2 — Skill riutilizzabili (riuso ALTO)
Regola comune: generica (nessun aggancio al modulo demo), portabile (UTF-8 no-BOM, niente bash/npm-runtime,
path-agnostica), documentata (interfaccia + esempio), provata con una **2ª fixture** diversa da Accanto.

- **TK-010 · extract-field-context** (da lib/context.js): impacchetta la logica di estrazione generica +
  2ª fixture HTML. ACCEPTANCE: funziona su 2 fixture; isSensitive corretto su password/cc.
- **TK-011 · prompt-da-dato-non-fidato** (da lib/prompt.js): buildPrompt generico, contenuto sempre
  delimitato (INV-5), parametrico su lingua/vincolo. ACCEPTANCE: 2 domini (PA + non-PA); non iniettabile.
- **TK-012 · announce-aria-live** (da content.js): announce(text,{politeness}) senza furto di focus (INV-7)
  + Esc. ACCEPTANCE: 2 pagine; focus fermo; annuncio presente.
- **TK-013 · test-annuncio-screen-reader** (da tests/): harness parametrico su URL/selettore (Playwright+
  virtual-SR se lo spike è riuscito, altrimenti L2+axe). ACCEPTANCE: 2 pagine; fallisce se focus si sposta
  o annuncio manca. Documenta i limiti (UNK-001).

Ogni skill: `allowed_scope=[skills/<nome>/**, sua 2ª fixture]`; `forbidden_scope=[codice runtime]`;
ULTIMO PASSO: aggiorna l'indice.

---

## TK-014 · G-SR — Test screen reader reale (gate umano finale, bloccante)
```yaml
outcome: verifica manuale con screen reader reale del giro su 2-3 campi (EV-010)
acceptance_evidence: Marco-proxy a schermo spento completa 2-3 campi con tastiera + NVDA/Narrator; annuncio udibile; focus fermo; Esc chiude; spiegazione comprensibile
depends_on: [build integrata] ; size: S ; executor: human
```
Checklist (~15-20 min, non comprimibile): NVDA o `Win+Ctrl+Invio` (Narrator); schermo spento; per ogni
campo target: Tab → scorciatoia → l'annuncio viene letto? → Tab → il focus era rimasto? → Esc → chiude
pulito? → comprensibile senza vedere? Difetti → issue (non patch che violino un INV). Aggiorna l'indice.
