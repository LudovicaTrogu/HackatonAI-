---
title: DR-002 — Taskboard della flotta di agenti/skill per Accanto
traces_to: DR-002
date: 2026-09-14
note: ogni task è atomico ed eseguibile singolarmente. Ai prompt di subagente va anteposto il BLOCCO-CONTESTO.
---

# DR-002 — Taskboard esecutivo

Decisione di riferimento: [DR-002-decisione-flotta-agenti.md](DR-002-decisione-flotta-agenti.md).
Struttura: 2 track paralleli (worktree/branch isolati), skeleton-first, phase-gate, gate SR reale finale.

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

CONTRATTO MESSAGGI (congelato in lib/messages.js dal task S1 — NON modificarlo):
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

REGOLE DI ESECUZIONE:
- Lavora SOLO nel tuo perimetro file. Se ti serve un file fuori perimetro, FERMATI e
  segnalalo — non modificarlo.
- Ambiente Windows; genera i file in UTF-8 SENZA BOM.
- Non introdurre effetti esterni non richiesti. Commit (se richiesti) in italiano, brevi,
  sul "perché"; mai committare API key o dati reali.
- Chiudi SEMPRE riportando: file toccati, come hai soddisfatto l'acceptance,
  quali INV hai presidiato.
```

---

## Task board

| Task | Titolo | Track | Esecutore | Dipende da | Size |
|---|---|---|---|---|---|
| TK-001 | G0 · Freeze modulo demo + DOM | — | human (+agent) | — | S |
| TK-002 | S1 · Fondazione + contratto messaggi | A | agent | TK-001 | M |
| TK-003 | S2 · Nucleo privilegiato (fallback-first) | A | agent | TK-002 | M |
| TK-004 | S3 · Nucleo pagina + a11y | B | agent | TK-002 | M |
| TK-005 | S4 · Demo & fallback rete-safe | A | agent | TK-001 | S |
| TK-006 | G-FASE · Integrazione + SEC-GATE (go/no-go) | — | human | TK-003,004,005 | S |
| TK-007 | S2b · Chiamata LLM reale | A | agent | TK-006 | S |
| TK-008 | S5 · Suite test L1/L2 + spike Playwright | B | agent | TK-004 | M |
| TK-009 | S6 · 3 deliverable + nota AI | B | either | demo osservabile | S |
| TK-010 | Skill extract-field-context | B | agent | TK-004 | S |
| TK-011 | Skill prompt-da-dato-non-fidato | A | agent | TK-003 | S |
| TK-012 | Skill announce-aria-live | B | agent | TK-004 | S |
| TK-013 | Skill test-annuncio-screen-reader | B | agent | TK-008 | S |
| TK-014 | G-SR · Test screen reader reale | — | human | build integrata | S |

Percorso critico demo-safe: **TK-001 → TK-002 → (TK-003 ‖ TK-004 ‖ TK-005) → TK-006**.
Il resto è Fase 2 e non deve mai sacrificare G-SR (TK-014).

---

## TK-001 · G0 — Freeze modulo demo + DOM

```yaml
task_id: TK-001
traces_to: DR-002
outcome: modulo PA di demo scelto e congelato; copia statica sintetica in demo/; DOM con contesto testuale leggibile sui 2-3 campi target; dominio host_permissions deciso
acceptance_evidence: demo/index.html carica in Chrome; ogni campo target ha label/legenda/aria-describedby leggibili; nessun dato reale; dominio annotato in docs/
allowed_scope: [demo/, docs/]
forbidden_scope: [codice estensione, dati reali]
depends_on: []
size: S
executor: human (scelta) + agent (scaffold)
```

**Checklist umana (~10 min):** scegli il modulo (mock realistico consigliato); individua 2-3
campi critici; verifica in DevTools che ognuno abbia `<label for>` o `aria-labelledby`; decidi
il dominio (es. `http://localhost`). Se il DOM non è semantico, ricostruiscilo pulito ora.

**Prompt agente (scaffold demo/)** — *anteponi BLOCCO-CONTESTO*:
```text
RUOLO: costruisci la copia statica del modulo di demo per Accanto.
PERIMETRO: puoi scrivere SOLO in demo/. Non toccare altro.
COMPITO: crea demo/index.html — un modulo PA sintetico e realistico con almeno 3 campi
etichettati semanticamente (<label for>/aria-labelledby, eventuale aria-describedby),
di cui ALMENO uno type="password" e/o un campo pagamento (autocomplete="cc-number")
come casi negativi per INV-4. Usa SOLO dati sintetici (INV-9). Alto contrasto, HTML valido,
nessuno script di build. Aggiungi in cima un commento con l'elenco dei campi target e il
loro scopo (servirà a S4 per i fallback).
ACCEPTANCE: apri demo/index.html nel browser; i 3 campi target espongono contesto testuale
nel DOM; il campo password/pagamento è presente ed etichettato.
OUTPUT: contenuto di demo/index.html + elenco dei campi target con label esatte.
```

---

## TK-002 · S1 — Fondazione + contratto messaggi (Track A)

```yaml
task_id: TK-002
traces_to: DR-002
outcome: estensione MV3 caricabile a vuoto; manifest con scorciatoia, service worker, content script su dominio ristretto; contratto messaggi e schema FieldContext congelati in lib/messages.js
acceptance_evidence: chrome://extensions carica senza errori; scorciatoia registrata; lib/messages.js esporta type e shape documentati
allowed_scope: [manifest.json, lib/messages.js, struttura cartelle, docs/action-log]
forbidden_scope: [logica interna di background.js/content.js/lib/context.js/lib/prompt.js, allargare host_permissions, build step/npm]
depends_on: [TK-001]
size: M
executor: agent
```

**Prompt** — *anteponi BLOCCO-CONTESTO*:
```text
RUOLO: sei il subagente FONDAZIONE (Track A). Poni le basi che gli altri stream useranno.
PERIMETRO: scrivi SOLO manifest.json e lib/messages.js (+ crea la struttura cartelle). NON
scrivere la logica di background.js/content.js/lib/context.js/lib/prompt.js.
COMPITO:
1) manifest.json (MV3): name, version, description; "commands" con una scorciatoia dedicata
   (es. Alt+Shift+A) per l'azione "spiega campo"; "background" service_worker=background.js
   type=module; "content_scripts" su matches ristretti al SOLO dominio demo di TK-001 (INV-3);
   "permissions": ["storage","activeTab","scripting" se serve]; NIENTE <all_urls>.
2) lib/messages.js: esporta la costante del type ("ACCANTO_EXPLAIN"), factory per richiesta e
   per le due forme di risposta, e un commento JSDoc con lo shape FieldContext ESATTO del
   BLOCCO-CONTESTO. Questo file è il contratto: gli altri lo importano, nessuno lo riscrive.
3) crea file segnaposto vuoti (background.js, content.js, content.css, lib/context.js,
   lib/prompt.js, lib/fallback.js, options.html, options.js) con "// TODO: <stream>" così
   l'estensione carica senza errori.
ACCEPTANCE: carica l'estensione unpacked; nessun errore; la scorciatoia compare in
chrome://extensions/shortcuts; lib/messages.js documenta contratto e FieldContext.
OUTPUT: manifest.json completo, lib/messages.js completo, elenco dei segnaposto.
```

---

## TK-003 · S2 — Nucleo privilegiato, fallback-first (Track A)

```yaml
task_id: TK-003
traces_to: DR-002
outcome: service worker che riceve il comando e FieldContext e risponde con una spiegazione (inizialmente da fallback, nessun LLM); options salva la API key in chrome.storage; lib/prompt.js costruisce il prompt trattando il contenuto come dato
acceptance_evidence: dal SW un ACCANTO_EXPLAIN riceve { ok:true, explanation }; grep "apiKey|API_KEY" su content.js/lib/context.js = VUOTO (INV-1); nessuna fetch in content (INV-2)
allowed_scope: [background.js, options.html, options.js, lib/prompt.js]
forbidden_scope: [content.js, content.css, lib/context.js, demo/, lib/messages.js (solo import), esporre la chiave, contenuto pagina come istruzioni, auto-invio]
depends_on: [TK-002]
size: M
executor: agent
```

**Prompt** — *anteponi BLOCCO-CONTESTO*:
```text
RUOLO: sei il subagente NUCLEO PRIVILEGIATO (Track A). Possiedi il lato fidato: chiave, rete,
prompt. Regola d'oro: chiave e rete NON escono mai da qui (INV-1, INV-2).
PERIMETRO: scrivi SOLO background.js, options.html, options.js, lib/prompt.js. Importa (non
modificare) lib/messages.js.
COMPITO:
1) background.js (service worker, ES module): listener del command (scorciatoia) che chiede al
   content script attivo di leggere il campo; chrome.runtime.onMessage per ACCANTO_EXPLAIN:
   se isSensitive=true rispondi { ok:false, error:"campo sensibile" } senza chiamare nulla
   (INV-4); altrimenti in questa fase usa una risposta di fallback (placeholder o import da
   lib/fallback.js) e rispondi { ok:true, explanation }. Prepara (non attivare) il punto di
   innesto per la fetch LLM di TK-007 — fetch SOLO qui (INV-2).
2) options.html + options.js: form lato team per salvare API key e provider in
   chrome.storage.local + avviso esplicito di invio del contenuto a un servizio AI esterno.
3) lib/prompt.js: buildPrompt(fieldContext) → stringa; il contesto va in una sezione DELIMITATA
   come dato non fidato, mai come istruzioni (INV-5); chiede una spiegazione in parole semplici
   di COSA chiede il campo e PERCHÉ, senza inventare requisiti né consigliare nel merito.
ACCEPTANCE: FieldContext non sensibile → { ok:true, explanation }; isSensitive=true → nessuna
chiamata; la chiave è solo in chrome.storage e non appare in file di content.
OUTPUT: i 4 file + conferma di INV-1/2/4/5/6.
```

---

## TK-004 · S3 — Nucleo pagina + a11y (Track B)

```yaml
task_id: TK-004
traces_to: DR-002
outcome: content script che alla scorciatoia estrae il FieldContext, chiede la spiegazione al SW e la annuncia in una regione ARIA live senza spostare il focus, chiudibile con Esc; lib/context.js estrae con esclusione password/pagamento
acceptance_evidence: sul demo, Tab→scorciatoia→annuncio in aria-live→activeElement invariato→Esc chiude; su password/pagamento isSensitive=true e nessuna spiegazione (INV-4)
allowed_scope: [content.js, content.css, lib/context.js]
forbidden_scope: [background.js, options.*, lib/prompt.js, demo/, lib/messages.js (solo import), fetch/rete, lettura chiave, spostare il focus]
depends_on: [TK-002]
size: M
executor: agent
```

**Prompt** — *anteponi BLOCCO-CONTESTO*:
```text
RUOLO: sei il subagente NUCLEO PAGINA & A11Y (Track B). Il tuo output DEVE essere accessibile:
è il cuore del progetto. Testa ogni scelta contro uno screen reader.
PERIMETRO: scrivi SOLO content.js, content.css, lib/context.js. Importa (non modificare)
lib/messages.js. NON fare rete, NON leggere la chiave.
COMPITO:
1) lib/context.js: extractFieldContext(element) → FieldContext. Estrae label (<label for>,
   aria-labelledby, aria-label), hint (aria-describedby o testo vicino), placeholder, fieldType.
   isSensitive=true se type="password" o autocomplete cc-*/pagamento e in tal caso non
   restituire testi del campo (INV-4). Nessun selettore hardcoded sul modulo specifico.
2) content.js: alla ricezione del comando legge document.activeElement, costruisce il
   FieldContext, invia ACCANTO_EXPLAIN al SW, mostra la risposta in una regione ARIA live
   (aria-live="polite", role="status"). NON spostare MAI il focus (INV-7). Esc chiude. Se
   { ok:false } annuncia un messaggio neutro. Emetti in un commento i class name CSS usati.
3) content.css: pannello ad alto contrasto, non invasivo, testo ridimensionabile, rispetta
   prefers-reduced-motion, nessuna informazione dal solo colore.
ACCEPTANCE: giro completo Tab→scorciatoia→annuncio→focus fermo→Esc; test su campo password che
isSensitive=true e non parte nessuna spiegazione.
OUTPUT: i 3 file + conferma INV-2/1/4/7 + nota su come hai verificato il non-furto di focus.
```

---

## TK-005 · S4 — Demo & fallback rete-safe (Track A)

```yaml
task_id: TK-005
traces_to: DR-002
outcome: lib/fallback.js con spiegazioni precaricate per i campi target; usato quando la rete è assente/lenta/in errore
acceptance_evidence: con rete disattivata, i campi target producono comunque un annuncio corretto via fallback
allowed_scope: [lib/fallback.js, demo/ (rifiniture non strutturali)]
forbidden_scope: [background.js, content.js, options.*, lib/context.js, lib/prompt.js, dati reali]
depends_on: [TK-001]
size: S
executor: agent
```

**Prompt** — *anteponi BLOCCO-CONTESTO*:
```text
RUOLO: sei il subagente DEMO & FALLBACK (Track A). Rendi la demo indipendente dalla rete.
PERIMETRO: scrivi SOLO lib/fallback.js (e rifiniture non strutturali in demo/).
COMPITO: lib/fallback.js esporta getFallback(fieldContext|label) → string|null, con spiegazioni
precaricate in parole semplici per i 2-3 campi target elencati in TK-001, coerenti col tono di
lib/prompt.js, senza inventare requisiti. Ritorna null per campi non coperti. Solo dati sintetici.
ACCEPTANCE: disattiva la rete; sui campi target l'estensione annuncia comunque la spiegazione.
OUTPUT: lib/fallback.js + elenco dei campi coperti.
```

---

## TK-006 · G-FASE — Integrazione + SEC-GATE (gate umano, go/no-go)

```yaml
task_id: TK-006
traces_to: DR-002
outcome: track integrati; walking skeleton end-to-end verde su 1 campo con fallback; checklist sicurezza passata; decisione go/no-go per la Fase 2
acceptance_evidence: giro completo funzionante + checklist EV-003 tutta verde + tempo residuo annotato
allowed_scope: [merge/diff-review, docs/action-log]
forbidden_scope: [scrivere nuova logica in questo gate]
depends_on: [TK-003, TK-004, TK-005]
size: S
executor: human
```

**Checklist SEC-GATE (nessun merge senza tutto verde):**
- [ ] `apiKey` / `chrome.storage.get(<key>)` assenti in content.js e lib/context.js (INV-1)
- [ ] nessuna fetch/XMLHttpRequest in content.js (INV-2)
- [ ] host_permissions = solo dominio demo, nessun <all_urls> (INV-3)
- [ ] type=password e campi cc-* esclusi → isSensitive=true (INV-4)
- [ ] prompt.js: contenuto pagina come dato delimitato, non istruzioni (INV-5)
- [ ] nessun codice di auto-compilazione/invio (INV-6)
- [ ] focus non si sposta dopo la scorciatoia; Esc chiude (INV-7)
- [ ] nessun build step/npm runtime introdotto (INV-8)
- [ ] Go/No-Go Fase 2 registrato in docs/action-log con tempo residuo

---

## TK-007 · S2b — Chiamata LLM reale (Track A)

```yaml
task_id: TK-007
traces_to: DR-002
outcome: background.js sostituisce il fallback con la fetch reale all'LLM; il fallback resta come rete-safe
acceptance_evidence: con API key valida la scorciatoia produce una spiegazione reale annunciata; con rete OFF subentra il fallback
allowed_scope: [background.js, lib/prompt.js]
forbidden_scope: [content side, options salvo lettura chiave, INV-1/2/5]
depends_on: [TK-006]
size: S
executor: agent
```

**Prompt** — *anteponi BLOCCO-CONTESTO*:
```text
RUOLO: NUCLEO PRIVILEGIATO, fase 2 (Track A). Attivi la chiamata LLM reale.
PERIMETRO: SOLO background.js e lib/prompt.js.
COMPITO: all'handler ACCANTO_EXPLAIN (campo non sensibile) leggi la API key da chrome.storage,
costruisci il prompt con lib/prompt.js e fai la fetch al provider (SOLO qui, INV-2). Su
errore/timeout/no-rete usa getFallback. Non loggare la chiave. Contenuto pagina = dato delimitato
(INV-5).
ACCEPTANCE: chiave valida → spiegazione reale; rete OFF → fallback; la chiave non compare in
log/messaggi verso la pagina.
OUTPUT: diff di background.js e lib/prompt.js + conferma INV-1/2/5.
```

---

## TK-008 · S5 — Suite test L1/L2 + spike Playwright (Track B)

```yaml
task_id: TK-008
traces_to: DR-002
outcome: test L1 (statici) e L2 (DOM fixture, senza Playwright) verdi e comprensivi; spike Playwright+virtual-SR entro cap, con degrado documentato se fallisce
acceptance_evidence: L1 fallisce su violazioni EV-003; L2 fallisce se il focus si sposta o l'annuncio non arriva; report dello spike (verde o degradato)
allowed_scope: [tests/**, dipendenze SOLO di test]
forbidden_scope: [codice runtime (leggibile, non modificabile), build step runtime, rilassare un INV per far passare un test]
depends_on: [TK-004]
size: M
executor: agent
```

**Prompt** — *anteponi BLOCCO-CONTESTO*:
```text
RUOLO: sei il subagente TEST & A11Y AUTOMATION (Track B). Obiettivo owner: "testare tutto".
Copertura reale, non teatro dei test. Regola dura: prima L1+L2 (economici e affidabili), poi
lo spike Playwright con CAP di 20 minuti.
PERIMETRO: scrivi SOLO in tests/ e configuri dipendenze SOLO di test (isolate dal runtime, INV-8).
COMPITO:
1) L1 — check statici (Node, zero browser): parse manifest.json (no <all_urls>, host ristretto);
   grep che "apiKey"/chrome.storage.get non compaiano in content.js/lib/context.js; nessuna fetch
   in content.js. FALLISCE su ogni violazione EV-003 (INV-1/2/3).
2) L2 — test DOM su fixture (carica demo/ come file, inietta content.js, eventi sintetici):
   verifica (a) esiste aria-live="polite"/role="status", (b) document.activeElement invariato dopo
   il trigger, (c) la regione live riceve testo, (d) Esc chiude, (e) su campo password isSensitive.
3) SPIKE (max 20 min, kill-switch): tenta Playwright + @guidepup/virtual-screen-reader contro
   l'estensione caricata (--load-extension, persistent context). Se entro il cap non è verde e
   stabile, FERMATI, degrada a un check axe-core sul DOM del pannello, e documenta in tests/README
   il limite e il perché (UNK-001). NON sforare il cap.
ACCEPTANCE: L1 e L2 verdi e falliscono davvero sulle violazioni; report spike in tests/README.
OUTPUT: struttura tests/, come lanciarli, esito dello spike, cosa NON è coperto (→ TK-014).
```

---

## TK-009 · S6 — 3 deliverable + nota AI (Track B)

```yaml
task_id: TK-009
traces_to: DR-002
outcome: i 3 deliverable del tema + nota "dove contribuisce l'AI e dove serve revisione umana", coerenti con la demo reale
acceptance_evidence: i 3 documenti esistono, il before/after è sullo stesso campo/persona, la nota AI è verificabile contro il comportamento osservato
allowed_scope: [docs/**]
forbidden_scope: [codice; ridiscutere DR-001]
depends_on: [demo osservabile]
size: S
executor: either
```

**Prompt** — *anteponi BLOCCO-CONTESTO*:
```text
RUOLO: sei il subagente DELIVERABLE (Track B). Racconti il valore per Marco, non la tecnica.
PERIMETRO: scrivi SOLO in docs/. Base: VISION.md (riusala, non riscriverla).
COMPITO: produci/aggiorna i 3 deliverable: (1) Persona & Barriera; (2) Percorso Assistito con il
before/after sullo STESSO campo e stessa persona; (3) Autonomia & Limiti. Aggiungi la nota
"Contributo AI & revisione umana": cosa fa il modello, con quali input, dove serve revisione.
Coerenza obbligatoria col comportamento reale osservato in demo.
ACCEPTANCE: 3 documenti coerenti con la demo; before/after concreto; nota AI verificabile.
OUTPUT: percorsi dei file e sintesi di ogni deliverable.
```

---

## Skill riutilizzabili (riuso ALTO — Fase 2)

Regola comune: la skill è **generica** (nessun aggancio al modulo demo), **portabile** (UTF-8
no-BOM, niente bash/npm-runtime, path-agnostica), **documentata** (interfaccia + esempio) e
provata con una **2ª fixture/use-case** diversa da Accanto. Senza 2ª fixture resta un subagente.

### TK-010 · Skill `extract-field-context` (Track B, depends_on TK-004, S)
```text
[anteponi BLOCCO-CONTESTO] RUOLO: impacchetta lib/context.js come skill riutilizzabile
"extract-field-context". PERIMETRO: crea la skill (cartella dedicata) + una 2ª fixture HTML
diversa dal modulo demo. COMPITO: estrai la logica generica (label/hint/placeholder/fieldType/
isSensitive con esclusione password/pagamento) da qualsiasi campo HTML, indipendente dal DOM
Accanto; documenta interfaccia extractFieldContext(element)→FieldContext ed esempio; prova su
2 fixture. ACCEPTANCE: funziona su entrambe; isSensitive corretto su password/cc.
OUTPUT: file della skill + esito sulle 2 fixture.
```

### TK-011 · Skill `prompt-da-dato-non-fidato` (Track A, depends_on TK-003, S)
```text
[anteponi BLOCCO-CONTESTO] RUOLO: impacchetta lib/prompt.js come skill "prompt-da-dato-non-fidato".
COMPITO: generalizza buildPrompt(context, opzioni) che inserisce contenuto arbitrario come DATO
delimitato mai come istruzioni (INV-5), parametrico su lingua e vincolo "spiega senza inventare/
non consigliare nel merito". Documenta ed esemplifica; prova su 2 domini (campo PA + un caso
non-PA, es. una voce di bolletta). ACCEPTANCE: il prompt delimita sempre il dato e non contiene
istruzioni iniettabili; funziona su 2 domini. OUTPUT: file della skill + i 2 esempi.
```

### TK-012 · Skill `announce-aria-live` (Track B, depends_on TK-004, S)
```text
[anteponi BLOCCO-CONTESTO] RUOLO: impacchetta il meccanismo di annuncio come skill
"announce-aria-live". COMPITO: funzione generica announce(text, {politeness}) che inietta/aggiorna
una regione aria-live/role=status SENZA spostare il focus (INV-7) e con chiusura Esc, riusabile in
qualsiasi estensione a11y. Documenta ed esemplifica; prova su 2 pagine diverse. ACCEPTANCE: lo
screen reader annuncia; il focus non si sposta; Esc chiude — su 2 fixture. OUTPUT: file della skill
+ nota di verifica del non-furto di focus.
```

### TK-013 · Skill `test-annuncio-screen-reader` (Track B, depends_on TK-008, S)
```text
[anteponi BLOCCO-CONTESTO] RUOLO: impacchetta l'harness di test come skill
"test-annuncio-screen-reader". COMPITO: harness riutilizzabile (Playwright + virtual-SR se lo spike
è riuscito, altrimenti L2 DOM fixture + axe) che verifica su una data pagina: presenza aria-live,
non-furto di focus, arrivo dell'annuncio, chiusura Esc. Parametrico su URL/selettore. Documenta il
limite noto (UNK-001) e il percorso di degrado. ACCEPTANCE: eseguito su 2 pagine, fallisce se il
focus si sposta o l'annuncio manca. OUTPUT: file della skill + istruzioni d'uso + limiti.
```

---

## TK-014 · G-SR — Test screen reader reale (gate umano finale, bloccante)

```yaml
task_id: TK-014
traces_to: DR-002
outcome: verifica manuale con screen reader reale del giro completo su 2-3 campi (EV-010)
acceptance_evidence: Marco-proxy a schermo spento completa 2-3 campi con tastiera + NVDA/Narrator; annuncio udibile; focus fermo; Esc chiude; spiegazione comprensibile
allowed_scope: [docs/action-log, bug report]
forbidden_scope: [in questo gate si segnalano i difetti, non si aggirano gli INV]
depends_on: [build integrata]
size: S
executor: human
```

**Checklist (~15-20 min, non comprimibile):** attiva NVDA o `Win+Ctrl+Invio` (Narrator); schermo
spento; Tab fino al campo target → scorciatoia → l'annuncio viene letto? → Tab successivo → il focus
era rimasto sul campo? → Esc → chiude senza annuncio residuo? → la spiegazione è comprensibile senza
vedere lo schermo? Ripeti sui 2-3 campi. Difetti → issue, non patch che violino un INV.
