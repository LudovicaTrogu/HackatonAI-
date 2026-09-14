// lib/fallback.js — TK-005.1: spiegazioni precaricate (rete-safe) per la demo.
//
// Copre SOLO i 3 campi target decisi in docs/action-log.md (G0 / TK-001.1):
//   1. #classe-invalidita — "Classe di invalidità"
//   2. #impegnativa       — "Impegnativa"
//   3. #esenzione-ticket  — "Esenzione ticket"
//
// getFallback(fieldContext|label) -> string|null
//   - Se l'estensione non ha rete o l'LLM non risponde in tempo, background.js può usare
//     questa funzione per garantire comunque un annuncio per i campi mostrati in demo.
//   - Per qualunque campo non tra i 3 coperti, ritorna null (nessuna spiegazione inventata).
//   - Non fa mai rete, non ha side effect: solo un lookup su testo statico (dati sintetici, INV-9).
//
// Nota INV-4: se il chiamante passa un FieldContext con isSensitive === true, ritorna null a
// prescindere dal label — un campo sensibile non deve mai ricevere una spiegazione.

/**
 * @typedef {import('./messages.js').FieldContext} FieldContext
 */

// Chiave = etichetta normalizzata (minuscolo, senza accenti, spazi ridotti).
// Testo coerente con gli hint reali del modulo demo (demo/index.html) e con il tono che avrà
// lib/prompt.js: spiega COSA chiede il campo e PERCHÉ, senza inventare requisiti in più.
const FALLBACK_BY_LABEL = new Map([
  [
    "classe di invalidita",
    "Questo campo chiede la percentuale di invalidità civile riconosciuta dalla commissione " +
      "medica competente, scelta tra le fasce proposte (da 0% a 33%, da 34% a 66%, da 67% a 99%, " +
      "100%). Serve a stabilire quali prestazioni puoi richiedere con questa domanda.",
  ],
  [
    "impegnativa",
    "Qui va inserito il numero dell'impegnativa, cioè il documento medico che autorizza la " +
      "prestazione che stai richiedendo. Lo trovi stampato o scritto sul documento che ti ha " +
      "dato il medico.",
  ],
  [
    "esenzione ticket",
    "Questo campo chiede il codice di esenzione dal pagamento del ticket sanitario, se lo " +
      "possiedi. Se non hai un'esenzione puoi indicarlo come da suggerimento del campo; non è " +
      "un dato obbligatorio se non ne sei in possesso.",
  ],
]);

/**
 * Normalizza un'etichetta per il confronto: minuscolo, senza accenti, spazi collassati.
 * @param {string} label
 * @returns {string}
 */
function normalizeLabel(label) {
  return label
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Restituisce la spiegazione precaricata per uno dei campi target della demo, oppure null
 * se il campo non è coperto (nessuna spiegazione inventata per campi non previsti).
 *
 * @param {FieldContext|string} fieldContextOrLabel - Il FieldContext del campo (vedi
 *   lib/messages.js) oppure direttamente la sua label testuale.
 * @returns {string|null}
 */
export function getFallback(fieldContextOrLabel) {
  if (fieldContextOrLabel == null) {
    return null;
  }

  let label;
  if (typeof fieldContextOrLabel === "string") {
    label = fieldContextOrLabel;
  } else if (typeof fieldContextOrLabel === "object") {
    // INV-4: un campo sensibile non riceve mai una spiegazione, nemmeno dal fallback.
    if (fieldContextOrLabel.isSensitive === true) {
      return null;
    }
    label = fieldContextOrLabel.label;
  } else {
    return null;
  }

  if (typeof label !== "string" || label.trim() === "") {
    return null;
  }

  const key = normalizeLabel(label);
  return FALLBACK_BY_LABEL.get(key) ?? null;
}
