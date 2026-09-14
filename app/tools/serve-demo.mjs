// tools/serve-demo.mjs — server statico per la demo. `npm run serve`.
//
// Serve SOLO la cartella demo/ su http://localhost:8080, perché il manifest limita
// l'estensione a http://localhost/* (INV-3) e una pagina aperta come file:// non
// riceverebbe il content script.
//
// Zero dipendenze, solo moduli nativi di Node: INV-8 vieta dipendenze npm, e un server
// di sviluppo non deve essere l'eccezione che introduce un node_modules nel repo.
//
// Alternativa equivalente senza Node, già documentata nel RUNBOOK:
//   cd demo && python -m http.server 8080

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../demo", import.meta.url)));
const PORT = Number(process.env.PORT) || 8080;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const server = createServer(async (req, res) => {
  // new URL() normalizza "..", "%2e%2e" e le barre ripetute prima che il path tocchi il disco.
  const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const filePath = resolve(join(ROOT, urlPath.endsWith("/") ? `${urlPath}index.html` : urlPath));

  // Difesa contro il path traversal: dopo la risoluzione il file DEVE stare dentro demo/.
  // Senza questo controllo un GET /../manifest.json servirebbe file fuori dalla demo.
  if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) {
    res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    res.end("403 — fuori da demo/");
    return;
  }

  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      "content-type": MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream",
      // Niente cache: durante la demo si ricarica di continuo dopo ogni modifica.
      "cache-control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("404");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Demo servita su http://localhost:${PORT}/index.html`);
  console.log(`Cartella: ${ROOT}`);
  console.log("Ctrl+C per fermare.");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Porta ${PORT} occupata. Riprova con:  PORT=8081 npm run serve`);
    process.exit(1);
  }
  throw err;
});
