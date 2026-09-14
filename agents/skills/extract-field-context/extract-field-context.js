// skills/extract-field-context/extract-field-context.js
// Skill riutilizzabile "extract-field-context" (TK-010).
//
// Origine: logica GENERICA di estrazione impacchettata da lib/context.js del progetto Accanto
// (funzione pura extractFieldContext, TK-004.1). Qui è resa AUTONOMA e PORTABILE: nessun import
// a runtime, nessun aggancio al modulo demo, path-agnostica. Il tipo FieldContext è documentato
// inline (JSDoc) invece di essere importato, così la skill è usabile in qualunque progetto.
//
// Contratto (FieldContext):
//   { label: string, hint: string|null, placeholder: string|null, fieldType: string, isSensitive: boolean }
//
// INV-4 (regola di sensibilità): se il campo è type="password" oppure ha un token autocomplete di
// pagamento (qualsiasi "cc-*", oppure "transaction-currency"/"transaction-amount" dello spec WHATWG
// autocomplete), la funzione imposta isSensitive=true e NON restituisce alcun testo del campo
// (label = "", hint = null, placeholder = null). Nessun selettore hardcoded su un modulo specifico.

/**
 * @typedef {Object} FieldContext
 * @property {string} label - Etichetta del campo (label, aria-label o aria-labelledby).
 * @property {string|null} hint - Testo di aiuto associato (aria-describedby o testo vicino), se presente.
 * @property {string|null} placeholder - Placeholder del campo, se presente.
 * @property {string} fieldType - Tipo del campo (es. "text", "select-one", "password", ...).
 * @property {boolean} isSensitive - true se il campo è type="password" o ha autocomplete di
 *   pagamento (cc-*): in tal caso label/hint/placeholder NON vengono letti né restituiti.
 */

/**
 * Token autocomplete relativi a carte di pagamento (WHATWG HTML autocomplete attribute).
 * Qualunque token che inizia con "cc-", oltre a "transaction-currency"/"transaction-amount",
 * è considerato dato di pagamento.
 * @param {string} token
 * @returns {boolean}
 */
function isPaymentAutocompleteToken(token) {
  if (!token) return false;
  const t = token.toLowerCase();
  return t.startsWith("cc-") || t === "transaction-currency" || t === "transaction-amount";
}

/**
 * Determina se un elemento di form è "sensibile": password o dato di pagamento.
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
    // Esclude il testo del controllo stesso: si clona la label e si rimuove l'elemento corrente
    // prima di leggere il testo.
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
 * Heuristica generica (nessun selettore specifico del modulo) per un hint "vicino":
 * il primo fratello successivo dell'elemento che sia un nodo di testo semplice
 * (non un altro controllo di form, non una label).
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
 * Funzione pura: nessuna rete, nessun accesso allo storage, nessun side effect.
 *
 * @param {Element} element - il campo di form attivo (input/select/textarea).
 * @returns {FieldContext}
 */
export function extractFieldContext(element) {
  const fieldType =
    (element.type && String(element.type)) ||
    (element.tagName ? element.tagName.toLowerCase() : "unknown");

  if (computeIsSensitive(element)) {
    // Campo sensibile: nessun testo del campo va letto né restituito (INV-4).
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

  const label =
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

export default extractFieldContext;
