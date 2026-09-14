// tests/l1/helpers/sorgente.mjs — vista "solo codice" di un sorgente JS.
//
// PERCHÉ ESISTE (non è una raffinatezza): una grep ingenua su questo repo sarebbe ROSSA oggi,
// su codice perfettamente conforme. content.js contiene 2 occorrenze di "fetch" e lib/context.js
// 1 di "chrome.storage" — tutte dentro i commenti che DOCUMENTANO il rispetto dell'invariante
// ("Nessuna fetch/rete (INV-2)"). Un gate di sicurezza che fallisce sui commenti che spiegano
// perché è conforme non è un gate: è rumore che il team imparerà a ignorare.
//
// Perciò, prima di cercare pattern proibiti, si rimuovono commenti e letterali di stringa.
// I letterali diventano quote vuote invece di sparire, così le posizioni non collassano e il
// codice resta sintatticamente leggibile a occhio in caso di debug.
//
// LIMITE DICHIARATO: non è un parser JavaScript. Non copre l'accesso offuscato
// (chrome["storage"], globalThis["fe"+"tch"], eval). È deliberato: qui l'avversario è la fretta,
// non un malintenzionato. Coprire l'offuscamento costerebbe tempo senza ridurre il rischio reale.

/**
 * Restituisce il sorgente privato di commenti e del contenuto dei letterali di stringa.
 * @param {string} sorgente
 * @returns {string}
 */
export function soloCodice(sorgente) {
  let out = "";
  let i = 0;
  const n = sorgente.length;

  while (i < n) {
    const c = sorgente[i];
    const next = sorgente[i + 1];

    // Commento di riga
    if (c === "/" && next === "/") {
      while (i < n && sorgente[i] !== "\n") i += 1;
      continue;
    }

    // Commento a blocco
    if (c === "/" && next === "*") {
      i += 2;
      while (i < n && !(sorgente[i] === "*" && sorgente[i + 1] === "/")) i += 1;
      i += 2;
      continue;
    }

    // Letterale di stringa: si conserva la coppia di quote, si scarta il contenuto.
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      out += quote;
      i += 1;
      while (i < n) {
        if (sorgente[i] === "\\") {
          i += 2;
          continue;
        }
        if (sorgente[i] === quote) break;
        i += 1;
      }
      out += quote;
      i += 1;
      continue;
    }

    out += c;
    i += 1;
  }

  return out;
}
