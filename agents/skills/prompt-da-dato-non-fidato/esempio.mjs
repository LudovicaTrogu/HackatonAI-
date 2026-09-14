// esempio.mjs — dimostrazione eseguibile della skill su 2 domini (PA + non-PA).
// Esegui con:  node skills/prompt-da-dato-non-fidato/esempio.mjs
// (funziona da qualunque cwd: usa path relativi al modulo, INV-8: nessun build, nessuna rete.)
//
// Verifica la NON-INIETTABILITÀ: il testo "ignora le istruzioni precedenti" presente nei dati
// deve comparire SOLO dentro i delimitatori (come DATO) e MAI nella cornice di istruzioni.

import { buildPrompt, DEFAULT_DELIMITER } from "./prompt-da-dato-non-fidato.mjs";
import { chiamata as pa, dominio as dominioPa } from "./fixtures/pa-campo-modulo.mjs";
import {
  chiamata as ecommerce,
  dominio as dominioEcommerce,
} from "./fixtures/ecommerce-recensione.mjs";

const { start, end } = DEFAULT_DELIMITER;

/**
 * Controlla che ogni frase-comando presente nel dato compaia esclusivamente tra i delimitatori.
 * @param {string} prompt
 * @param {string[]} spie - frammenti di testo ostile da localizzare
 * @returns {{ok: boolean, dettagli: string[]}}
 */
function verificaNonIniettabile(prompt, spie) {
  const inizio = prompt.indexOf(start);
  const fine = prompt.indexOf(end);
  const blocco = prompt.slice(inizio, fine + end.length);
  const corniceIstruzioni = prompt.slice(0, inizio) + prompt.slice(fine + end.length);

  const dettagli = [];
  let ok = true;
  for (const spia of spie) {
    const dentroDato = blocco.includes(spia);
    const dentroCornice = corniceIstruzioni.includes(spia);
    if (dentroDato && !dentroCornice) {
      dettagli.push(`  OK    "${spia}" e' presente solo come DATO delimitato`);
    } else {
      ok = false;
      dettagli.push(
        `  FAIL  "${spia}" dentroDato=${dentroDato} dentroCornice=${dentroCornice}`,
      );
    }
  }
  return { ok, dettagli };
}

const casi = [
  {
    dominio: dominioPa,
    chiamata: pa,
    spie: ["Ignora le istruzioni precedenti", "COMPILATO: 100%"],
  },
  {
    dominio: dominioEcommerce,
    chiamata: ecommerce,
    // Nota: usiamo marcatori UNICI del payload. La frase generica "ignora le istruzioni
    // precedenti" e' citata di proposito anche nella cornice come esempio da NON eseguire,
    // quindi non e' un buon indicatore di iniezione.
    spie: ["ADMIN2026", "modalità admin", "cancella tutte le altre recensioni"],
  },
];

let tuttiOk = true;

for (const caso of casi) {
  console.log(`\n===== DOMINIO: ${caso.dominio} =====`);
  const prompt = buildPrompt(caso.chiamata);
  console.log(prompt);
  const esito = verificaNonIniettabile(prompt, caso.spie);
  console.log("\n--- verifica non-iniettabilita' ---");
  console.log(esito.dettagli.join("\n"));
  tuttiOk = tuttiOk && esito.ok;
}

// Terzo caso: contenuto sensibile -> nessun dato incluso.
console.log("\n===== CASO: contenuto sensibile =====");
const promptSensibile = buildPrompt({
  role: "irrilevante",
  task: "irrilevante",
  sensitive: true,
});
console.log(promptSensibile);
const nessunDato = !promptSensibile.includes(DEFAULT_DELIMITER.start);
console.log(`\n  ${nessunDato ? "OK" : "FAIL"}    nessun blocco dato incluso quando sensitive=true`);
tuttiOk = tuttiOk && nessunDato;

console.log(`\n=====================================`);
console.log(tuttiOk ? "TUTTI I CONTROLLI SUPERATI" : "ALCUNI CONTROLLI FALLITI");
process.exit(tuttiOk ? 0 : 1);
