// lib/messages.js — CONTRATTO MESSAGGI (congelato da TK-002.1, vedi docs/DR-002-taskboard.md).
// Nessun altro file lo ridefinisce: chi ha bisogno del contratto lo importa da qui.

/**
 * @typedef {Object} FieldContext
 * @property {string} label - Etichetta del campo (label, aria-label o aria-labelledby).
 * @property {string|null} hint - Testo di aiuto associato (aria-describedby o testo vicino), se presente.
 * @property {string|null} placeholder - Placeholder del campo, se presente.
 * @property {string} fieldType - Tipo del campo (es. "text", "select-one", "password", ...).
 * @property {boolean} isSensitive - true se il campo è type="password" o ha autocomplete di
 *   pagamento (cc-*): in tal caso label/hint/placeholder NON vengono letti né inviati (INV-4).
 */

export const ACCANTO_EXPLAIN = "ACCANTO_EXPLAIN";

/**
 * Messaggio richiesta content → background.
 * @param {FieldContext} fieldContext
 * @returns {{type: string, fieldContext: FieldContext}}
 */
export function createExplainRequest(fieldContext) {
  return { type: ACCANTO_EXPLAIN, fieldContext };
}

/**
 * Risposta di successo background → content.
 * @param {string} explanation
 * @returns {{ok: true, explanation: string}}
 */
export function createExplainSuccess(explanation) {
  return { ok: true, explanation };
}

/**
 * Risposta di errore background → content.
 * @param {string} error
 * @returns {{ok: false, error: string}}
 */
export function createExplainError(error) {
  return { ok: false, error };
}
