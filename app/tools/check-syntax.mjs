// tools/check-syntax.mjs — controllo sintattico di tutti i sorgenti JS. `npm run check`.
//
// Perché esiste: i task TK-003.1, TK-003.3, TK-004.1, TK-004.2 e TK-003.2 sono stati chiusi
// con la nota "node --check non eseguibile, verifica manuale", perché Node è gestito da fnm
// e non compariva nei path che gli agenti cercavano. Questo script rende il check ripetibile
// e toglie quella nota dal giro.
//
// NON è la suite di test: i controlli sugli invarianti di sicurezza (INV-1/2/3) sono TK-008.1,
// e i test a11y sul pannello sono TK-008.2. Qui si verifica solo che i file siano parsabili.
//
// Zero dipendenze (INV-8).

import { readdir } from "node:fs/promises";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const IGNORA = new Set(["node_modules", ".git", ".codegraph"]);

async function trovaSorgenti(dir) {
  const voci = await readdir(dir, { withFileTypes: true });
  const risultati = [];
  for (const voce of voci) {
    if (IGNORA.has(voce.name)) continue;
    const percorso = join(dir, voce.name);
    if (voce.isDirectory()) {
      risultati.push(...(await trovaSorgenti(percorso)));
    } else if ([".js", ".mjs"].includes(extname(voce.name))) {
      risultati.push(percorso);
    }
  }
  return risultati;
}

const sorgenti = (await trovaSorgenti(ROOT)).sort();
let falliti = 0;

for (const file of sorgenti) {
  const nome = relative(ROOT, file);
  const esito = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (esito.status === 0) {
    console.log(`  OK    ${nome}`);
  } else {
    falliti += 1;
    console.error(`  FAIL  ${nome}`);
    console.error(esito.stderr.trim().split("\n").slice(0, 5).join("\n"));
  }
}

console.log(`\n${sorgenti.length} file controllati, ${falliti} falliti.`);
process.exit(falliti === 0 ? 0 : 1);
