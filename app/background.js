// background.js — TK-003.3 · S2 · Nucleo privilegiato (service worker MV3, ES module).
// Due responsabilità, nessun'altra:
//   (1) TRIGGER  : chrome.commands.onCommand "spiega-campo" (manifest.json) → inoltro al content
//                  script della tab attiva con { type: "ACCANTO_TRIGGER_EXPLAIN" }.
//   (2) RISPOSTA : chrome.runtime.onMessage per ACCANTO_EXPLAIN → risposta fallback-first.
//
// Strategia di questa fase: FALLBACK-FIRST. Nessun LLM, nessuna rete, nessuna API key: la
// spiegazione arriva esclusivamente da lib/fallback.js (spiegazioni precaricate per i 3 campi
// target della demo). Se il campo non è coperto si risponde { ok:false }: non si inventa nulla.
//
// INVARIANTI PRESIDIATI QUI:
//   INV-1 — nessuna lettura di chrome.storage e nessuna chiave in questo file: nulla di segreto
//           può quindi finire in un messaggio verso content.js / pagina / DOM.
//   INV-2 — nessuna fetch: la rete vivrà SOLO in questo file, ma ancora non esiste (vedi (3)).
//   INV-4 — fieldContext.isSensitive === true → risposta d'errore immediata, senza chiamare
//           getFallback, senza buildPrompt, senza rete. Presidio lato service worker, indipendente
//           dal short-circuit che content.js già fa in locale.
//   INV-6 — questo file non tocca mai il DOM della pagina: nessuna auto-compilazione/auto-invio.
//
// NOTA SUI TESTI D'ERRORE: sono messaggi tecnici destinati a content.js, non a Marco. content.js
// sostituisce qualunque { ok:false } con NEUTRAL_ERROR_MESSAGE prima di annunciarlo, quindi qui
// si usano stringhe brevi e diagnostiche.

import { ACCANTO_EXPLAIN, createExplainSuccess, createExplainError } from "./lib/messages.js";
import { getFallback } from "./lib/fallback.js";

/** @typedef {import("./lib/messages.js").FieldContext} FieldContext */

// Forma del messaggio di trigger background → content. VINCOLANTE: content.js definisce in locale
// la costante TRIGGER_TYPE con esattamente questo valore (vedi "ASSUNZIONE NON CONGELATA" in testa
// a content.js e il suo listener chrome.runtime.onMessage). Non esiste un secondo protocollo.
const ACCANTO_TRIGGER_EXPLAIN = "ACCANTO_TRIGGER_EXPLAIN";

// Nome del comando così come dichiarato in manifest.json → "commands".
const COMMAND_EXPLAIN_FIELD = "spiega-campo";

/**
 * Invia il trigger al content script di una tab. Fire-and-forget: content.js NON chiama
 * sendResponse sul trigger, quindi la Promise di chrome.tabs.sendMessage può rigettare con
 * "The message port closed before a response was received". Può inoltre rigettare con
 * "Could not establish connection. Receiving end does not exist." se nella tab non c'è alcun
 * content script (pagina fuori da host_permissions, chrome://, tab appena creata). Entrambi i casi
 * sono attesi e non sono errori applicativi: vengono assorbiti qui per non sporcare la console del
 * service worker con rejection non gestite.
 *
 * @param {number} tabId
 * @returns {void}
 */
function sendTriggerToTab(tabId) {
  try {
    const sending = chrome.tabs.sendMessage(tabId, { type: ACCANTO_TRIGGER_EXPLAIN });
    if (sending && typeof sending.catch === "function") {
      sending.catch(() => {
        // Nessun destinatario o canale chiuso: comportamento atteso, si ignora.
      });
    }
  } catch (err) {
    // Difensivo: alcune condizioni (tabId non più valido) possono lanciare in modo sincrono.
    void err;
  }
}

// (1) TRIGGER — scorciatoia da tastiera → content script della tab attiva.
chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== COMMAND_EXPLAIN_FIELD) {
    return;
  }

  // Chrome passa la tab su cui la scorciatoia è stata premuta: se c'è, si usa direttamente
  // (evita una chrome.tabs.query inutile e il rischio di colpire la tab sbagliata).
  if (tab && typeof tab.id === "number" && tab.id >= 0) {
    sendTriggerToTab(tab.id);
    return;
  }

  // Ripiego: nessuna tab fornita dall'evento.
  chrome.tabs
    .query({ active: true, currentWindow: true })
    .then((tabs) => {
      const activeTab = tabs && tabs[0];
      if (activeTab && typeof activeTab.id === "number" && activeTab.id >= 0) {
        sendTriggerToTab(activeTab.id);
      }
    })
    .catch(() => {
      // Nessuna tab interrogabile: niente da fare, nessun errore da propagare.
    });
});

// (2) RISPOSTA — ACCANTO_EXPLAIN → { ok:true, explanation } | { ok:false, error }.
//
// PATTERN ASYNC MV3: il listener è volutamente SINCRONO (non `async`). Un listener dichiarato
// `async` ritorna una Promise, che Chrome interpreta come "valore di ritorno" e non come
// "terrò aperto il canale": sendResponse arriverebbe a canale già chiuso e
// `await chrome.runtime.sendMessage(...)` lato content.js (content.js:174) riceverebbe undefined.
// Qui si risponde sincronamente e si ritorna `true` per mantenere il canale aperto, così il
// pattern resta corretto anche quando TK-007.1 introdurrà una risposta asincrona (vedi (3)).
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== ACCANTO_EXPLAIN) {
    return false; // non è un messaggio nostro: nessuna risposta, canale non trattenuto.
  }

  /** @type {FieldContext|undefined} */
  const fieldContext = message.fieldContext;

  if (!fieldContext || typeof fieldContext !== "object") {
    sendResponse(createExplainError("fieldContext mancante o non valido"));
    return true;
  }

  // INV-4: campo sensibile → stop immediato. Nessun getFallback, nessun buildPrompt, nessuna rete.
  if (fieldContext.isSensitive === true) {
    sendResponse(createExplainError("campo sensibile"));
    return true;
  }

  // (3) PUNTO D'INNESTO FETCH — PREDISPOSTO, **NON ATTIVO** in questo task.
  // Qui, e SOLO qui (INV-2: la rete vive esclusivamente nel service worker), TK-007.1 attiverà la
  // chiamata all'LLM, PRIMA del fallback. Sequenza prevista per TK-007.1:
  //   a) leggere le credenziali dallo storage — contratto congelato da TK-003.3, condiviso con la
  //      pagina opzioni (TK-003.2), da usare senza divergenze:
  //          chrome.storage.local → { apiKey: string, provider: string }
  //      La apiKey resta confinata in questo file: non deve MAI comparire in un messaggio verso
  //      content.js, nel DOM della pagina o in un log (INV-1).
  //   b) costruire il prompt con buildPrompt(fieldContext) da "./lib/prompt.js" (già scritto e
  //      congelato da TK-003.1; qui NON importato perché senza fetch non c'è nulla da interrogare
  //      e sarebbe codice morto). buildPrompt delimita il contenuto della pagina come DATO, mai
  //      come istruzioni al modello (INV-5): non aggirarlo concatenando il contesto a mano.
  //   c) fetch verso il provider, con timeout (AbortController).
  //   d) su risposta valida → sendResponse(createExplainSuccess(testoModello)); su errore, timeout,
  //      chiave assente o risposta non utilizzabile → ricadere sul fallback qui sotto, che resta la
  //      rete di sicurezza della demo (fallback-first diventa fallback-on-error).
  // Trattandosi di codice asincrono, il `return true` già presente in questo listener è la
  // condizione necessaria perché sendResponse differito funzioni: non rendere il listener `async`.

  const explanation = getFallback(fieldContext);

  if (typeof explanation === "string" && explanation !== "") {
    sendResponse(createExplainSuccess(explanation));
    return true;
  }

  // Campo fuori dai 3 target coperti dalla demo: nessuna spiegazione inventata.
  sendResponse(createExplainError("nessuna spiegazione disponibile per questo campo"));
  return true;
});
