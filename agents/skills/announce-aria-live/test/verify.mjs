// verify.mjs — prova programmatica della skill announce-aria-live.
//
// PORTABILE: usa SOLO il test runner nativo di Node (`node --test`) e node:assert. Nessuna
// dipendenza npm, nessun build step. Per non trascinare jsdom (che richiederebbe `npm install`,
// vietato dalla regola di portabilità), qui c'è un DOM-stub minimo — solo le API che la skill
// tocca davvero — così la verifica gira ovunque ci sia Node.
//
// Esecuzione (dalla cartella skills/announce-aria-live/):
//   node --test
// oppure, indicando il file:
//   node --test test/verify.mjs
//
// Cosa prova, su DUE "pagine" (due document-stub con struttura diversa, come le fixture HTML):
//   - la regione live viene creata con role e aria-live corretti;
//   - il testo annunciato finisce nella regione (annuncio PRESENTE);
//   - document.activeElement NON cambia durante l'annuncio (focus FERMO, INV-7);
//   - Esc svuota/nasconde la regione;
//   - politeness "assertive" mappa su role="alert".
// Più un controllo statico: il sorgente della skill non contiene .focus( né .select(.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { createAnnouncer } from "../announce-aria-live.js";

const HERE = dirname(fileURLToPath(import.meta.url));

// --- DOM-stub minimo -------------------------------------------------------

class FakeElement {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.attributes = {};
    this.children = [];
    this.parentNode = null;
    this._textContent = "";
    this.hidden = false;
    this.id = "";
    this.className = "";
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return name in this.attributes ? this.attributes[name] : null; }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  removeChild(child) {
    this.children = this.children.filter((c) => c !== child);
    child.parentNode = null;
    return child;
  }
  contains(node) {
    if (node === this) return true;
    return this.children.some((c) => c.contains(node));
  }
  get textContent() { return this._textContent; }
  set textContent(v) { this._textContent = String(v); }
}

/** Crea un document-stub. `fields` è un elenco di id di campi "focalizzabili". */
function makeDocument(fields) {
  const listeners = {};
  const body = new FakeElement("body");
  const doc = {
    body,
    activeElement: null,
    createElement: (tag) => new FakeElement(tag),
    addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); },
    removeEventListener: (type, fn) => {
      if (listeners[type]) listeners[type] = listeners[type].filter((f) => f !== fn);
    },
    // helper di test (non fanno parte dell'API DOM):
    _dispatch: (type, event) => { (listeners[type] || []).forEach((fn) => fn(event)); },
    _focus: (el) => { doc.activeElement = el; },
  };
  // Registra i campi focalizzabili dentro il body.
  doc._fields = {};
  for (const id of fields) {
    const el = new FakeElement("input");
    el.id = id;
    body.appendChild(el);
    doc._fields[id] = el;
  }
  return doc;
}

// --- Prova parametrica su due pagine diverse -------------------------------

const PAGES = [
  {
    nome: "pagina-1-modulo (form multi-campo)",
    fields: ["nome", "email", "messaggio"],
    focusOn: "nome",
    politeness: "polite",
    expectedRole: "status",
    text: "Sei nel campo nome. Annuncio di prova.",
  },
  {
    nome: "pagina-2-ricerca (barra di ricerca)",
    fields: ["q"],
    focusOn: "q",
    politeness: "assertive",
    expectedRole: "alert",
    text: "servizi: 3 risultati trovati.",
  },
];

for (const page of PAGES) {
  test(`annuncio presente e focus fermo — ${page.nome}`, () => {
    const doc = makeDocument(page.fields);
    const field = doc._fields[page.focusOn];
    doc._focus(field); // il focus è sul campo, come per un utente da tastiera

    const announcer = createAnnouncer({ document: doc });
    const focusPrima = doc.activeElement;

    const region = announcer.announce(page.text, { politeness: page.politeness });

    // 1. Regione live creata con gli attributi giusti.
    assert.equal(region.getAttribute("aria-live"), page.politeness, "aria-live errato");
    assert.equal(region.getAttribute("role"), page.expectedRole, "role errato");
    assert.equal(region.getAttribute("aria-atomic"), "true", "aria-atomic mancante");
    assert.equal(region.hidden, false, "la regione deve essere visibile dopo l'annuncio");

    // 2. Annuncio PRESENTE: il testo è nella regione.
    assert.equal(region.textContent, page.text, "il testo annunciato non è nella regione");

    // 3. Focus FERMO (INV-7): activeElement invariato.
    assert.equal(doc.activeElement, focusPrima, "il focus si è spostato durante l'annuncio");
    assert.equal(doc.activeElement, field, "il focus non è più sul campo originale");

    // 4. Esc svuota/nasconde la regione, senza toccare il focus.
    doc._dispatch("keydown", { key: "Escape" });
    assert.equal(region.hidden, true, "Esc non ha nascosto la regione");
    assert.equal(region.textContent, "", "Esc non ha svuotato la regione");
    assert.equal(doc.activeElement, field, "Esc non deve spostare il focus");
  });
}

test("statica: il sorgente non chiama mai .focus() né .select()", async () => {
  const src = await readFile(join(HERE, "..", "announce-aria-live.js"), "utf8");
  // Rimuove i commenti di riga per non contare le occorrenze nella documentazione.
  const codeOnly = src
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, ""))
    .join("\n");
  assert.ok(!/\.focus\s*\(/.test(codeOnly), "trovata una chiamata .focus() nel codice");
  assert.ok(!/\.select\s*\(/.test(codeOnly), "trovata una chiamata .select() nel codice");
});
