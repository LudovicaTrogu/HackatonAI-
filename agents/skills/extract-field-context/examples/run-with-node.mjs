// skills/extract-field-context/examples/run-with-node.mjs
// Esempio eseguibile che PROVA la skill su 2 fixture HTML diverse, in puro Node (>=18),
// SENZA alcuna dipendenza npm (coerente con "niente build/bundler/npm a runtime").
//
// Uso:
//   node skills/extract-field-context/examples/run-with-node.mjs
//
// La skill (extract-field-context.js) è pensata per girare nel DOM del browser. Per dimostrarla
// da riga di comando qui sotto c'è un MICRO-DOM minimale: NON fa parte della skill, serve solo
// al test. Implementa unicamente ciò che extractFieldContext tocca (getAttribute, ownerDocument,
// getElementById, querySelector, closest, cloneNode, textContent, nextElementSibling, .type).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { extractFieldContext } from "../extract-field-context.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, "..", "fixtures");

// ----------------------------------------------------------------------------
// MICRO-DOM (test-only, zero dipendenze) --------------------------------------
// ----------------------------------------------------------------------------
const VOID_TAGS = new Set(["input", "meta", "br", "img", "hr", "link", "area", "base", "col"]);

class TextNode {
  constructor(text) {
    this.nodeType = 3;
    this.data = text;
    this.parentNode = null;
  }
  get textContent() {
    return this.data;
  }
  cloneNode() {
    return new TextNode(this.data);
  }
}

class ElementNode {
  constructor(tag, attrs, doc) {
    this.nodeType = 1;
    this.tagName = tag.toUpperCase();
    this.attributes = attrs; // { lowercaseName: value }
    this.childNodes = [];
    this.parentNode = null;
    this.ownerDocument = doc;
  }
  get id() {
    return this.getAttribute("id") || "";
  }
  get type() {
    const t = this.tagName;
    if (t === "INPUT") return (this.getAttribute("type") || "text").toLowerCase();
    if (t === "SELECT") return "select-one";
    if (t === "TEXTAREA") return "textarea";
    return undefined;
  }
  get children() {
    return this.childNodes.filter((n) => n.nodeType === 1);
  }
  getAttribute(name) {
    const v = this.attributes[name.toLowerCase()];
    return v === undefined ? null : v;
  }
  get nextElementSibling() {
    if (!this.parentNode) return null;
    const sibs = this.parentNode.children;
    const i = sibs.indexOf(this);
    return i >= 0 && i + 1 < sibs.length ? sibs[i + 1] : null;
  }
  get textContent() {
    return this.childNodes.map((n) => n.textContent).join("");
  }
  closest(selector) {
    const want = selector.toUpperCase();
    let cur = this;
    while (cur && cur.nodeType === 1) {
      if (cur.tagName === want) return cur;
      cur = cur.parentNode;
    }
    return null;
  }
  _matches(tag, attr, val) {
    if (tag && this.tagName !== tag.toUpperCase()) return false;
    if (attr && this.getAttribute(attr) !== val) return false;
    return true;
  }
  querySelector(selector) {
    const m = selector.match(/^(\w+)?(?:\[([\w-]+)="([^"]*)"\])?$/);
    if (!m) return null;
    const [, tag, attr, val] = m;
    const stack = [...this.children];
    while (stack.length) {
      const el = stack.shift();
      if (el._matches(tag, attr, val)) return el;
      stack.unshift(...el.children);
    }
    return null;
  }
  cloneNode() {
    // deep clone
    const copy = new ElementNode(this.tagName, { ...this.attributes }, this.ownerDocument);
    for (const child of this.childNodes) {
      const c = child.cloneNode();
      c.parentNode = copy;
      copy.childNodes.push(c);
    }
    return copy;
  }
  remove() {
    if (!this.parentNode) return;
    const i = this.parentNode.childNodes.indexOf(this);
    if (i >= 0) this.parentNode.childNodes.splice(i, 1);
  }
}

class DocumentNode extends ElementNode {
  constructor() {
    super("#document", {}, null);
    this.ownerDocument = this;
    this._ids = new Map();
  }
  getElementById(id) {
    return this._ids.get(id) || null;
  }
}

function parseHtml(html) {
  const doc = new DocumentNode();
  const stack = [doc];
  let i = 0;
  const push = (node) => {
    const parent = stack[stack.length - 1];
    node.parentNode = parent;
    parent.childNodes.push(node);
  };

  while (i < html.length) {
    if (html[i] === "<") {
      if (html.startsWith("<!--", i)) {
        i = html.indexOf("-->", i);
        i = i === -1 ? html.length : i + 3;
        continue;
      }
      if (html[i + 1] === "!") {
        // doctype or declaration
        i = html.indexOf(">", i);
        i = i === -1 ? html.length : i + 1;
        continue;
      }
      if (html[i + 1] === "/") {
        // closing tag
        const end = html.indexOf(">", i);
        if (stack.length > 1) stack.pop();
        i = end === -1 ? html.length : end + 1;
        continue;
      }
      // opening tag
      const end = html.indexOf(">", i);
      const raw = html.slice(i + 1, end);
      const selfClosing = raw.endsWith("/");
      const body = selfClosing ? raw.slice(0, -1) : raw;
      const nameMatch = body.match(/^([a-zA-Z][\w:-]*)/);
      const tag = nameMatch ? nameMatch[1] : "unknown";
      const attrs = {};
      const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*"([^"]*)")?/g;
      let am;
      const attrStr = body.slice(tag.length);
      while ((am = attrRe.exec(attrStr)) !== null) {
        if (!am[1]) continue;
        attrs[am[1].toLowerCase()] = am[2] === undefined ? "" : am[2];
      }
      const el = new ElementNode(tag, attrs, doc);
      push(el);
      if (attrs.id) doc._ids.set(attrs.id, el);
      if (!selfClosing && !VOID_TAGS.has(tag.toLowerCase())) stack.push(el);
      i = end === -1 ? html.length : end + 1;
    } else {
      const next = html.indexOf("<", i);
      const text = html.slice(i, next === -1 ? html.length : next);
      if (text.length) push(new TextNode(text));
      i = next === -1 ? html.length : next;
    }
  }
  return doc;
}

// Polyfill globale minimale usato da extract-field-context.js
if (typeof globalThis.CSS === "undefined") {
  globalThis.CSS = { escape: (s) => String(s).replace(/[^a-zA-Z0-9_-]/g, (c) => "\\" + c) };
}

// ----------------------------------------------------------------------------
// Esecuzione della skill sulle 2 fixture --------------------------------------
// ----------------------------------------------------------------------------
function loadDoc(name) {
  return parseHtml(readFileSync(join(FIXTURES, name), "utf8"));
}

const results = [];
let failures = 0;

function check(desc, condition) {
  const ok = !!condition;
  if (!ok) failures++;
  results.push({ ok, desc });
  console.log(`${ok ? "PASS" : "FAIL"}  ${desc}`);
}

// --- Fixture 1: checkout-form.html (dominio e-commerce, non-PA) ---
console.log("\n== Fixture 1: checkout-form.html ==");
const d1 = loadDoc("checkout-form.html");

const fullName = extractFieldContext(d1.getElementById("fullName"));
console.log("fullName ->", JSON.stringify(fullName));
check("F1 label testo esplicito (<label for>)", fullName.label === "Nome sul citofono di consegna");
check("F1 hint da fratello vicino", fullName.hint === "Serve al corriere per trovarti al piano.");
check("F1 placeholder letto", fullName.placeholder === "Es. Mario Rossi");
check("F1 fieldType = text", fullName.fieldType === "text");
check("F1 non sensibile", fullName.isSensitive === false);

const shipping = extractFieldContext(d1.getElementById("shippingSpeed"));
console.log("shippingSpeed ->", JSON.stringify(shipping));
check("F1 select label", shipping.label === "Velocità di spedizione");
check("F1 select hint via aria-describedby", shipping.hint === "Express arriva entro 24 ore nei giorni feriali.");
check("F1 select fieldType = select-one", shipping.fieldType === "select-one");

const card = extractFieldContext(d1.getElementById("cardNumber"));
console.log("cardNumber ->", JSON.stringify(card));
check("F1 carta (cc-number) isSensitive=true", card.isSensitive === true);
check("F1 carta nessun testo restituito", card.label === "" && card.hint === null && card.placeholder === null);

// --- Fixture 2: login-form.html (dominio login web app, non-PA) ---
console.log("\n== Fixture 2: login-form.html ==");
const d2 = loadDoc("login-form.html");

const email = extractFieldContext(d2.querySelector('[name="email"]'));
console.log("email ->", JSON.stringify(email));
check("F2 label implicita (<label>testo <input></label>)", email.label === "Indirizzo email");
check("F2 placeholder letto", email.placeholder === "nome@esempio.it");
check("F2 fieldType = email", email.fieldType === "email");
check("F2 non sensibile", email.isSensitive === false);

const username = extractFieldContext(d2.querySelector('[name="username"]'));
console.log("username ->", JSON.stringify(username));
check("F2 label via aria-labelledby (multi-id)", username.label === "Accedi al tuo spazio Nome utente");
check("F2 hint via aria-describedby", username.hint === "Il nome scelto in fase di registrazione.");

const password = extractFieldContext(d2.querySelector('[name="password"]'));
console.log("password ->", JSON.stringify(password));
check("F2 password isSensitive=true", password.isSensitive === true);
check("F2 password nessun testo restituito", password.label === "" && password.hint === null && password.placeholder === null);
check("F2 password fieldType conservato", password.fieldType === "password");

// ----------------------------------------------------------------------------
console.log(`\nRisultato: ${results.length - failures}/${results.length} check superati.`);
if (failures > 0) {
  console.error(`${failures} check falliti.`);
  process.exit(1);
}
console.log("Tutti i check superati: la skill funziona su 2 fixture diverse; isSensitive corretto su password/cc.");
