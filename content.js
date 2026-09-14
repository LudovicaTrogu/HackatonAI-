// content.js — TK-004.2 · riceve il trigger della scorciatoia "spiega-campo", legge il campo
// attivo (document.activeElement), costruisce il FieldContext con extractFieldContext (TK-004.1),
// invia ACCANTO_EXPLAIN al service worker (contratto lib/messages.js, TK-002.1 — congelato) e
// annuncia la risposta in una regione ARIA live SENZA MAI spostare il focus dal campo (INV-7).
// Esc chiude il pannello. Nessuna fetch/rete (INV-2), nessuna lettura di API key (INV-1): l'unica
// comunicazione verso l'esterno di questo file è chrome.runtime.sendMessage/onMessage (message
// passing interno all'estensione, non è una "fetch/rete" verso l'esterno).
//
// CLASS NAME CSS emessi per TK-004.3 (content.css deve usare ESATTAMENTE questi):
//   .accanto-panel        — contenitore del pannello di spiegazione (la regione ARIA live)
//   .accanto-panel__text  — nodo di testo dentro il pannello (il contenuto che viene annunciato)
// Stato esposto via attributo (mai solo colore) sul contenitore:
//   data-accanto-state="info" | "sensitive" | "error"
//
// COME È STATA VERIFICATA L'ASSENZA DI FURTO DI FOCUS (INV-7):
// 1) Analisi statica: in questo file non compare alcuna chiamata a .focus()/.select()/.click() su
//    elementi diversi dal campo di modulo stesso; il pannello viene creato/aggiornato solo con
//    createElement/appendChild/textContent/attributi — operazioni che non spostano il focus.
// 2) Self-check a runtime: announce() legge document.activeElement PRIMA di mostrare il pannello e
//    lo ricontrolla SUBITO DOPO; se sono diversi, viene loggato un console.warn esplicito (mai
//    silenzioso) così una regressione emerge anche fuori da un test manuale.
// 3) Verifica manuale raccomandata su demo/index.html (ambiente browser non disponibile in questa
//    sessione agente, quindi non esercitata qui): Tab sul campo target → Alt+Shift+A → l'annuncio
//    viene letto dallo screen reader → Tab successivo riprende correttamente dal campo seguente
//    (prova che il focus non è mai stato spostato sul pannello) → Esc chiude il pannello. Passo
//    da eseguire ai gate TK-006 (SEC-GATE) e TK-014 (screen reader reale).
// Nota per TK-014: hidden→false e la valorizzazione del testo avvengono nello stesso turno
// sincrono (pattern comune per toast/live-region). Se in verifica con NVDA/Narrator l'annuncio non
// dovesse scattare in modo affidabile, un possibile fix documentato qui è separare i due passi su
// due tick (requestAnimationFrame) — non applicato ora per non introdurre complessità non richiesta.
//
// ASSUNZIONE NON CONGELATA — da allineare con TK-003.3 (owner di background.js, ancora TODO):
// lib/messages.js congela SOLO il contratto content→background (ACCANTO_EXPLAIN) e le risposte
// background→content ({ok:true,...}/{ok:false,...}). Non esiste un contratto congelato per il
// messaggio "trigger" background→content che deve avvisare questo content script che la
// scorciatoia da tastiera "spiega-campo" (manifest.json → chrome.commands) è stata premuta, perché
// background.js è tuttora solo un placeholder TODO. Questo file definisce quindi in modo
// PROVVISORIO e LOCALE la costante ACCANTO_TRIGGER_EXPLAIN = "ACCANTO_TRIGGER_EXPLAIN" e ascolta
// chrome.runtime.onMessage per messaggi di forma { type: "ACCANTO_TRIGGER_EXPLAIN" }. Quando
// TK-003.3 implementerà l'inoltro (chrome.commands.onCommand → chrome.tabs.sendMessage), DEVE
// inviare esattamente questa forma, oppure questo file va aggiornato in coordinamento — non
// inventare un secondo protocollo parallelo. Segnalato anche in docs/DR-002-execution-index.md.
//
// DIPENDENZA SU manifest.json DA VERIFICARE (fuori dal mio perimetro — allowed_scope=[content.js]
// per questo task, owner di manifest.json è TK-002.2):
// Questo file importa lib/messages.js e lib/context.js con import() DINAMICO, non con un import
// statico in testa al file, perché Manifest V3 non supporta static import nei content script
// dichiarati via "content_scripts" (il campo "type":"module" lì non ha effetto: appena si usa un
// import statico il browser genera "Cannot use import statement outside a module"). L'import()
// dinamico verso un URL chrome-extension:// da un content script richiede però che il file sia
// elencato in "web_accessible_resources" nel manifest, altrimenti la import() fallisce a runtime
// (viene comunque intercettata dal try/catch qui sotto e mostra un messaggio neutro, non un errore
// muto). Al momento manifest.json NON lo dichiara. Serve aggiungere, indicativamente:
//   "web_accessible_resources": [
//     { "resources": ["lib/messages.js", "lib/context.js"], "matches": ["http://localhost/*"] }
//   ]
// Non lo aggiungo qui perché fuori dal mio allowed_scope: segnalato nel Log dell'indice per
// l'owner di manifest.json e per il gate TK-006.

(function () {
  "use strict";

  // Vedi "ASSUNZIONE NON CONGELATA" in testa al file.
  const TRIGGER_TYPE = "ACCANTO_TRIGGER_EXPLAIN";

  const PANEL_ID = "accanto-panel";
  const NEUTRAL_ERROR_MESSAGE =
    "Non riesco a spiegare questo campo in questo momento. Riprova tra poco.";

  /** @type {HTMLElement|null} */
  let panelEl = null;
  /** @type {HTMLElement|null} */
  let panelTextEl = null;

  /**
   * Crea (una sola volta) il pannello di spiegazione come regione ARIA live e lo inserisce nel
   * body. Non tocca mai il focus: solo createElement/appendChild/attributi.
   * @returns {{panel: HTMLElement, text: HTMLElement}}
   */
  function ensurePanel() {
    if (panelEl && panelTextEl && document.body.contains(panelEl)) {
      return { panel: panelEl, text: panelTextEl };
    }

    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.className = "accanto-panel";
    panel.setAttribute("role", "status");
    panel.setAttribute("aria-live", "polite");
    panel.hidden = true;

    const text = document.createElement("p");
    text.className = "accanto-panel__text";
    panel.appendChild(text);

    document.body.appendChild(panel);

    panelEl = panel;
    panelTextEl = text;
    return { panel, text };
  }

  /**
   * Mostra un messaggio nella regione ARIA live, senza mai spostare il focus dal campo attivo.
   * @param {string} message
   * @param {"info"|"sensitive"|"error"} state
   */
  function announce(message, state) {
    const focusBeforeAnnounce = document.activeElement;

    const { panel, text } = ensurePanel();
    panel.setAttribute("data-accanto-state", state);
    panel.hidden = false;
    text.textContent = message;

    // Self-check INV-7 (vedi commento in testa al file).
    if (document.activeElement !== focusBeforeAnnounce) {
      console.warn(
        "Accanto: il focus è cambiato durante l'annuncio — possibile violazione INV-7.",
        { prima: focusBeforeAnnounce, dopo: document.activeElement }
      );
    }
  }

  /** Nasconde il pannello (chiusura con Esc). Non tocca mai il focus. */
  function closePanel() {
    if (panelEl && !panelEl.hidden) {
      panelEl.hidden = true;
      if (panelTextEl) panelTextEl.textContent = "";
    }
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panelEl && !panelEl.hidden) {
      closePanel();
    }
  });

  /**
   * Gestisce il trigger della scorciatoia: legge il campo attivo, applica il short-circuit INV-4
   * sui campi sensibili (nessun round-trip verso il background), altrimenti invia ACCANTO_EXPLAIN
   * e mostra la risposta.
   */
  async function handleTriggerExplain() {
    const active = document.activeElement;
    const isFormField =
      active && ["INPUT", "SELECT", "TEXTAREA"].includes(active.tagName);

    if (!isFormField) {
      announce(
        "Nessun campo di modulo è selezionato. Vai con Tab su un campo e riprova.",
        "info"
      );
      return;
    }

    try {
      const [{ extractFieldContext }, { createExplainRequest }] = await Promise.all([
        import(chrome.runtime.getURL("lib/context.js")),
        import(chrome.runtime.getURL("lib/messages.js")),
      ]);

      const fieldContext = extractFieldContext(active);

      if (fieldContext.isSensitive) {
        // INV-4: nessuna richiesta va al background per campi sensibili — nessun round-trip.
        announce(
          "Questo campo è sensibile (password o dato di pagamento): non viene spiegato, per motivi di sicurezza.",
          "sensitive"
        );
        return;
      }

      const response = await chrome.runtime.sendMessage(createExplainRequest(fieldContext));

      if (response && response.ok) {
        announce(response.explanation, "info");
      } else {
        // { ok:false, error } → messaggio neutro e comprensibile; il dettaglio tecnico grezzo
        // dell'errore non viene mai mostrato all'utente.
        announce(NEUTRAL_ERROR_MESSAGE, "error");
      }
    } catch (err) {
      // Copre anche il fallimento della import() dinamica (es. web_accessible_resources mancanti,
      // vedi commento in testa al file) o l'assenza del background: mai un errore muto per Marco.
      console.warn("Accanto: errore durante la richiesta di spiegazione.", err);
      announce(NEUTRAL_ERROR_MESSAGE, "error");
    }
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.type === TRIGGER_TYPE) {
      handleTriggerExplain();
    }
    // Nessun sendResponse: il trigger è fire-and-forget lato background (vedi ASSUNZIONE sopra).
  });
})();
