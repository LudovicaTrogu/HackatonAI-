// announce-aria-live.js — skill riutilizzabile: annuncia un testo a uno screen reader tramite una
// regione ARIA live, SENZA mai spostare il focus e con chiusura via Esc.
//
// Estratta e generalizzata dalla logica di annuncio di content.js del progetto "Accanto"
// (ensurePanel/announce/closePanel). Qui NON c'è alcun aggancio al modulo demo, ai nomi di classe
// di Accanto, a chrome.* o a lib/*: è un modulo ES puro, path-agnostico, usabile in qualunque
// pagina o content script.
//
// GARANZIE (le stesse dell'invariante INV-7 di Accanto, rese generiche):
//   1. L'output vive in una regione con role="status"/role="alert" e aria-live, così lo screen
//      reader lo annuncia da solo quando il testo cambia.
//   2. La regione si chiude con Esc.
//   3. Il modulo NON chiama MAI .focus() né .select() su alcun elemento: verificabile per
//      analisi statica (grep) e con un self-check a runtime che confronta document.activeElement
//      prima e dopo l'annuncio ed emette un console.warn esplicito su ogni divergenza.
//
// PORTABILITÀ: UTF-8 senza BOM, nessuna dipendenza, nessun build step. Il documento su cui operare
// è iniettabile via opzione `document` (default: il `document` globale), così il modulo è
// testabile anche fuori dal browser con un DOM minimo.

"use strict";

/** Opzioni di default della regione live. Sovrascrivibili per istanza. */
const DEFAULT_OPTIONS = {
  // id/classe della regione: valori neutri, cambiabili per non collidere con la pagina ospite.
  regionId: "aria-live-announcer",
  regionClassName: "aria-live-announcer",
  // se true, Esc svuota/nasconde la regione (INV-7). Cambiabile se la pagina gestisce Esc altrove.
  closeOnEscape: true,
};

/** Politeness ammesse e mapping al role coerente (polite→status, assertive→alert). */
const ROLE_BY_POLITENESS = {
  polite: "status",
  assertive: "alert",
};

/**
 * Crea un annunciatore indipendente legato a un `document`. Utile quando servono più regioni
 * distinte o un controllo esplicito del ciclo di vita (destroy). Per l'uso comune basta la
 * funzione `announce` esportata più sotto, che usa un annunciatore singleton sul `document` globale.
 *
 * @param {object} [options]
 * @param {Document} [options.document] documento su cui operare (default: `document` globale).
 * @param {string}   [options.regionId] id della regione live.
 * @param {string}   [options.regionClassName] classe CSS della regione live.
 * @param {boolean}  [options.closeOnEscape] se true, Esc chiude la regione.
 * @returns {{ announce: (text: string, opts?: {politeness?: "polite"|"assertive"}) => HTMLElement,
 *            clear: () => void, destroy: () => void, getRegion: () => HTMLElement|null }}
 */
export function createAnnouncer(options = {}) {
  const doc =
    options.document || (typeof document !== "undefined" ? document : undefined);
  if (!doc) {
    throw new Error(
      "announce-aria-live: nessun document disponibile. Passa options.document."
    );
  }

  const config = { ...DEFAULT_OPTIONS, ...options };

  /** @type {HTMLElement|null} */
  let regionEl = null;
  /** @type {((event: KeyboardEvent) => void)|null} */
  let escHandler = null;

  function ensureRegion() {
    if (regionEl && doc.body && doc.body.contains(regionEl)) {
      return regionEl;
    }
    const region = doc.createElement("div");
    region.id = config.regionId;
    region.className = config.regionClassName;
    // role/aria-live iniziali "polite"; announce() li riallinea alla politeness richiesta.
    region.setAttribute("role", ROLE_BY_POLITENESS.polite);
    region.setAttribute("aria-live", "polite");
    // aria-atomic garantisce che lo screen reader legga l'intero contenuto a ogni cambio.
    region.setAttribute("aria-atomic", "true");
    region.hidden = true;

    doc.body.appendChild(region);
    regionEl = region;

    if (config.closeOnEscape && !escHandler) {
      escHandler = (event) => {
        if (event && event.key === "Escape" && regionEl && !regionEl.hidden) {
          clear();
        }
      };
      doc.addEventListener("keydown", escHandler);
    }
    return region;
  }

  /**
   * Annuncia `text` nella regione live senza mai spostare il focus.
   * @param {string} text
   * @param {{politeness?: "polite"|"assertive"}} [opts]
   * @returns {HTMLElement} la regione live.
   */
  function announce(text, opts = {}) {
    const politeness =
      opts.politeness === "assertive" ? "assertive" : "polite";

    // Self-check INV-7: memorizza il focus PRIMA di toccare il DOM.
    const focusBefore = doc.activeElement;

    const region = ensureRegion();
    region.setAttribute("aria-live", politeness);
    region.setAttribute("role", ROLE_BY_POLITENESS[politeness]);
    region.hidden = false;
    // textContent (non innerHTML): il testo è trattato come dato, non come markup.
    region.textContent = String(text == null ? "" : text);

    // Self-check INV-7: il focus NON deve essere cambiato da questa funzione.
    if (doc.activeElement !== focusBefore) {
      // Mai silenzioso: una regressione emerge anche fuori da un test manuale.
      // eslint-disable-next-line no-console
      console.warn(
        "announce-aria-live: il focus è cambiato durante l'annuncio — possibile violazione INV-7.",
        { prima: focusBefore, dopo: doc.activeElement }
      );
    }
    return region;
  }

  /** Svuota e nasconde la regione (chiusura con Esc). Non tocca mai il focus. */
  function clear() {
    if (regionEl && !regionEl.hidden) {
      regionEl.hidden = true;
      regionEl.textContent = "";
    }
  }

  /** Rimuove la regione e il listener Esc. Non tocca mai il focus. */
  function destroy() {
    if (escHandler) {
      doc.removeEventListener("keydown", escHandler);
      escHandler = null;
    }
    if (regionEl && regionEl.parentNode) {
      regionEl.parentNode.removeChild(regionEl);
    }
    regionEl = null;
  }

  function getRegion() {
    return regionEl;
  }

  return { announce, clear, destroy, getRegion };
}

/** Annunciatore singleton condiviso, creato pigramente sul `document` globale. */
let sharedAnnouncer = null;

/**
 * API comoda per il caso d'uso più frequente: un'unica regione live per pagina.
 * Firma richiesta dal task: `announce(text, { politeness })`.
 *
 * @param {string} text testo da annunciare.
 * @param {{politeness?: "polite"|"assertive"}} [opts]
 * @returns {HTMLElement} la regione live.
 */
export function announce(text, opts = {}) {
  if (!sharedAnnouncer) {
    sharedAnnouncer = createAnnouncer();
  }
  return sharedAnnouncer.announce(text, opts);
}

/** Chiude (svuota+nasconde) la regione dell'annunciatore singleton. */
export function clear() {
  if (sharedAnnouncer) sharedAnnouncer.clear();
}

export default announce;
