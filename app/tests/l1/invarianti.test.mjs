// tests/l1/invarianti.test.mjs — TK-008.1 · gate statico sugli invarianti di sicurezza.
// Esecuzione: `npm run test:l1` (oppure `node --test tests/l1/`). Esce ≠0 su violazione.
//
// COSA GARANTISCE: che il codice sorgente non contenga le violazioni di INV-1/2/3/8 che una
// lettura statica può vedere. Nessun browser, nessuna dipendenza.
//
// COSA NON GARANTISCE (leggere prima di fidarsi del verde): non esegue nulla, quindi non può
// dire se l'estensione funziona. Il comportamento reale è TK-006 (SEC-GATE) e TK-014 (screen
// reader). Un verde qui significa "nessuna violazione visibile staticamente", non "conforme".
//
// I detector sono funzioni pure esportate e testati in DUE direzioni:
//   1. sui file reali del repo  → devono passare;
//   2. su campioni mutati       → devono FALLIRE.
// Senza la direzione 2 un gate è decorativo: passerebbe anche se il detector fosse rotto.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { soloCodice } from "./helpers/sorgente.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const leggi = (p) => readFileSync(ROOT + p, "utf8");
const leggiJson = (p) => JSON.parse(leggi(p));

const DOMINIO_ATTESO = "http://localhost/*";

// ---------------------------------------------------------------------------
// Detector (funzioni pure: input esplicito, nessuna lettura di file al loro interno)
// ---------------------------------------------------------------------------

/**
 * INV-3. Validazione POSITIVA: ogni match pattern deve essere esattamente il dominio demo.
 * Preferita alla ricerca di "<all_urls>" perché una lista chiusa cattura in una riga sola anche
 * i wildcard di schema/host e qualunque allargamento futuro che nessuno ha previsto.
 * (I pattern proibiti non si scrivono qui in chiaro: contengono la sequenza che chiude
 * un commento a blocco. Sono elencati nei casi negativi più sotto.)
 * @returns {string[]} pattern non ammessi (vuoto = conforme)
 */
export function patternTroppoAmpi(manifest) {
  const trovati = [];
  const raccogli = (lista, dove) => {
    for (const p of lista ?? []) {
      if (p !== DOMINIO_ATTESO) trovati.push(`${dove}: ${p}`);
    }
  };

  raccogli(manifest.host_permissions, "host_permissions");
  for (const cs of manifest.content_scripts ?? []) raccogli(cs.matches, "content_scripts.matches");
  for (const war of manifest.web_accessible_resources ?? []) {
    raccogli(war.matches, "web_accessible_resources.matches");
  }
  return trovati;
}

/**
 * INV-1. La chiave e lo storage non devono comparire nel codice lato pagina, in nessuna forma
 * (`chrome.storage.local.get`, `.sync.set`, `.onChanged`... non solo `chrome.storage.get`).
 * @returns {string[]} pattern violati
 */
export function violazioniChiave(codice) {
  const trovati = [];
  if (/apiKey/i.test(codice)) trovati.push("apiKey");
  if (/chrome\s*\.\s*storage/.test(codice)) trovati.push("chrome.storage");
  return trovati;
}

/**
 * INV-2. Nessuna rete nel codice lato pagina. Copre le API realistiche, non solo `fetch`.
 * @returns {string[]} pattern violati
 */
export function violazioniRete(codice) {
  const api = [
    [/\bfetch\s*\(/, "fetch()"],
    [/\bXMLHttpRequest\b/, "XMLHttpRequest"],
    [/\bsendBeacon\s*\(/, "navigator.sendBeacon()"],
    [/\bnew\s+WebSocket\b/, "new WebSocket"],
    [/\bnew\s+EventSource\b/, "new EventSource"],
    [/\bnew\s+Request\b/, "new Request"],
  ];
  return api.filter(([re]) => re.test(codice)).map(([, nome]) => nome);
}

/**
 * INV-8. Nessuna dipendenza a runtime. Rende eseguibile una regola finora solo dichiarata:
 * il package.json del repo serve agli script di sviluppo e deve restare senza `dependencies`.
 * @returns {string[]} dipendenze runtime trovate
 */
export function dipendenzeRuntime(pkg) {
  return Object.keys(pkg.dependencies ?? {});
}

// ---------------------------------------------------------------------------
// 1. I detector funzionano davvero (casi negativi su campioni mutati)
// ---------------------------------------------------------------------------

describe("i detector falliscono sulle violazioni (se questi passano, il gate è vivo)", () => {
  test("INV-3: riconosce <all_urls>, *://*/* e host allargati", () => {
    assert.notEqual(patternTroppoAmpi({ host_permissions: ["<all_urls>"] }).length, 0);
    assert.notEqual(patternTroppoAmpi({ host_permissions: ["*://*/*"] }).length, 0);
    assert.notEqual(patternTroppoAmpi({ host_permissions: ["http://*/*"] }).length, 0);
    assert.notEqual(
      patternTroppoAmpi({ content_scripts: [{ matches: ["https://esempio.test/*"] }] }).length,
      0
    );
    assert.deepEqual(patternTroppoAmpi({ host_permissions: [DOMINIO_ATTESO] }), []);
  });

  test("INV-1: riconosce apiKey e ogni forma di chrome.storage", () => {
    assert.notEqual(violazioniChiave("const k = cfg.apiKey;").length, 0);
    assert.notEqual(violazioniChiave("chrome.storage.local.get(['x'])").length, 0);
    assert.notEqual(violazioniChiave("chrome . storage . sync . set({})").length, 0);
    assert.deepEqual(violazioniChiave("const panel = document.createElement('div');"), []);
  });

  test("INV-2: riconosce le API di rete oltre fetch", () => {
    assert.notEqual(violazioniRete("await fetch(url)").length, 0);
    assert.notEqual(violazioniRete("new XMLHttpRequest()").length, 0);
    assert.notEqual(violazioniRete("navigator.sendBeacon(u, d)").length, 0);
    assert.notEqual(violazioniRete("new WebSocket(u)").length, 0);
    assert.deepEqual(violazioniRete("chrome.runtime.sendMessage(msg)"), []);
  });

  test("INV-8: riconosce una dipendenza runtime", () => {
    assert.notEqual(dipendenzeRuntime({ dependencies: { jsdom: "^24.0.0" } }).length, 0);
    assert.deepEqual(dipendenzeRuntime({ devDependencies: { jsdom: "^24.0.0" } }), []);
  });
});

// ---------------------------------------------------------------------------
// 2. Lo strip di commenti e stringhe (senza, il gate sarebbe rosso su codice conforme)
// ---------------------------------------------------------------------------

describe("vista solo-codice", () => {
  test("rimuove commenti di riga, a blocco e contenuto delle stringhe", () => {
    const codice = soloCodice(`
      // qui si parla di fetch e di apiKey
      /* e anche chrome.storage.local.get in un blocco */
      const msg = "non fare fetch qui";
      const vero = chrome.runtime.sendMessage;
    `);
    assert.deepEqual(violazioniChiave(codice), []);
    assert.deepEqual(violazioniRete(codice), []);
    assert.match(codice, /chrome\.runtime\.sendMessage/);
  });

  test("NON nasconde il codice vero accanto a un commento", () => {
    const codice = soloCodice(`await fetch(u); // nessuna fetch qui, giuro`);
    assert.deepEqual(violazioniRete(codice), ["fetch()"]);
  });
});

// ---------------------------------------------------------------------------
// 3. Il repo reale è conforme
// ---------------------------------------------------------------------------

describe("il codice del repo rispetta gli invarianti", () => {
  const manifest = leggiJson("manifest.json");

  test("INV-3 · nessun permesso oltre il dominio demo", () => {
    assert.deepEqual(patternTroppoAmpi(manifest), []);
  });

  test("INV-3 · host_permissions è dichiarato e ristretto", () => {
    assert.deepEqual(manifest.host_permissions, [DOMINIO_ATTESO]);
  });

  for (const file of ["content.js", "lib/context.js"]) {
    test(`INV-1 · ${file} non vede la chiave né lo storage`, () => {
      assert.deepEqual(violazioniChiave(soloCodice(leggi(file))), []);
    });
  }

  test("INV-2 · content.js non fa rete (solo message passing)", () => {
    assert.deepEqual(violazioniRete(soloCodice(leggi("content.js"))), []);
  });

  test("INV-8 · nessuna dipendenza a runtime", () => {
    assert.deepEqual(dipendenzeRuntime(leggiJson("package.json")), []);
  });
});
