// lib/context.js — TK-004.1 · funzione pura extractFieldContext(element) -> FieldContext.
// Contratto FieldContext congelato in lib/messages.js (TK-002.1): lo importiamo solo come tipo
// (JSDoc), nessuna dipendenza a runtime introdotta qui.
//
// INV-4: se il campo è type="password" o ha un token autocomplete di pagamento (cc-*, o i token
// "transaction-currency"/"transaction-amount" dello spec WHATWG autocomplete), la funzione imposta
// isSensitive=true e NON restituisce alcun testo del campo (label vuota, hint/placeholder null).
//
// Nessun selettore hardcoded sul modulo di demo: demo/index.html è stato letto solo come
// riferimento della forma del DOM, non per derivarne id/classi specifici.

/** @typedef {import('./messages.js').FieldContext} FieldContext */

/**
 * Token autocomplete relativi a carte di pagamento (WHATWG HTML autocomplete attribute).
 * Qualunque token che inizia con "cc-", oltre a "transaction-currency"/"transaction-amount",
 * è considerato dato di pagamento.
 */
function isPaymentAutocompleteToken(token) {
  if (!token) return false;
  const t = token.toLowerCase();
  return t.startsWith("cc-") || t === "transaction-currency" || t === "transaction-amount";
}

/**
 * Determina se un elemento di form è "sensibile" (INV-4): password o dato di pagamento.
 * @param {Element} element
 * @returns {boolean}
 */
function computeIsSensitive(element) {
  const type = (element.getAttribute("type") || "").toLowerCase();
  if (type === "password") return true;

  const autocomplete = element.getAttribute("autocomplete") || "";
  const tokens = autocomplete.trim().split(/\s+/).filter(Boolean);
  return tokens.some(isPaymentAutocompleteToken);
}

/**
 * Normalizza spazi/newline di un testo estratto dal DOM.
 * @param {string|null|undefined} text
 * @returns {string}
 */
function normalizeText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

/**
 * Risolve una lista di id (separati da spazio, come in aria-labelledby/aria-describedby)
 * nel testo concatenato degli elementi referenziati.
 * @param {Element} element - elemento di partenza, per accedere a ownerDocument
 * @param {string|null} idsAttr
 * @returns {string|null}
 */
function resolveIdRefsText(element, idsAttr) {
  if (!idsAttr) return null;
  const doc = element.ownerDocument;
  if (!doc) return null;

  const ids = idsAttr.trim().split(/\s+/).filter(Boolean);
  const parts = ids
    .map((id) => doc.getElementById(id))
    .filter((el) => el != null)
    .map((el) => normalizeText(el.textContent));

  const joined = normalizeText(parts.join(" "));
  return joined.length > 0 ? joined : null;
}

/**
 * Cerca una <label> associata all'elemento: via <label for="id">, oppure via label
 * antenato (etichetta implicita, <label>Testo <input></label>).
 * @param {Element} element
 * @returns {string|null}
 */
function findAssociatedLabelText(element) {
  const doc = element.ownerDocument;

  // <label for="id">
  if (doc && element.id) {
    const explicit = doc.querySelector(`label[for="${CSS.escape(element.id)}"]`);
    if (explicit) {
      const text = normalizeText(explicit.textContent);
      if (text.length > 0) return text;
    }
  }

  // <label>...<input>...</label> (etichetta implicita)
  const ancestorLabel = element.closest ? element.closest("label") : null;
  if (ancestorLabel) {
    // Esclude il testo del controllo stesso (es. testo di un option selezionato non applicabile
    // qui, ma per sicurezza si clona e si rimuove l'elemento corrente prima di leggere il testo).
    const clone = ancestorLabel.cloneNode(true);
    const idOrTagSelector = element.tagName ? element.tagName.toLowerCase() : null;
    if (idOrTagSelector) {
      const toRemove = clone.querySelector(idOrTagSelector);
      if (toRemove) toRemove.remove();
    }
    const text = normalizeText(clone.textContent);
    if (text.length > 0) return text;
  }

  return null;
}

/**
 * Heuristica generica (nessun selettore specifico del modulo demo) per un hint "vicino":
 * il primo fratello successivo dell'elemento (o del suo elemento wrapper diretto) che sia
 * un nodo di testo semplice (non un altro controllo di form, non una label).
 * @param {Element} element
 * @returns {string|null}
 */
function findNearbyHintText(element) {
  const nonHintTags = new Set(["LABEL", "INPUT", "SELECT", "TEXTAREA", "BUTTON", "FIELDSET"]);

  let sibling = element.nextElementSibling;
  while (sibling) {
    if (!nonHintTags.has(sibling.tagName)) {
      const text = normalizeText(sibling.textContent);
      if (text.length > 0) return text;
    }
    // Se il fratello successivo è già un altro controllo/etichetta, non c'è hint vicino.
    if (nonHintTags.has(sibling.tagName)) break;
    sibling = sibling.nextElementSibling;
  }

  return null;
}

/**
 * Estrae il contesto accessibile di un campo di form, in forma di FieldContext.
 * Funzione pura: nessuna rete, nessun accesso a chrome.storage, nessun side effect.
 *
 * @param {Element} element - il campo di form attivo (input/select/textarea).
 * @returns {FieldContext}
 */
export function extractFieldContext(element) {
  const fieldType =
    (element.type && String(element.type)) ||
    (element.tagName ? element.tagName.toLowerCase() : "unknown");

  if (computeIsSensitive(element)) {
    // INV-4: nessun testo del campo va letto né restituito.
    return {
      label: "",
      hint: null,
      placeholder: null,
      fieldType,
      isSensitive: true,
    };
  }

  const ariaLabel = element.getAttribute("aria-label");
  const ariaLabelledby = element.getAttribute("aria-labelledby");

  let label =
    resolveIdRefsText(element, ariaLabelledby) ||
    (ariaLabel && normalizeText(ariaLabel)) ||
    findAssociatedLabelText(element) ||
    "";

  const ariaDescribedby = element.getAttribute("aria-describedby");
  const hint = resolveIdRefsText(element, ariaDescribedby) || findNearbyHintText(element);

  const placeholder = element.getAttribute("placeholder");

  return {
    label,
    hint: hint || null,
    placeholder: placeholder ? normalizeText(placeholder) : null,
    fieldType,
    isSensitive: false,
  };
}
