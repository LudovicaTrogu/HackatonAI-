# Accanto

Estensione browser **Manifest V3** che aiuta chi naviga con **screen reader e solo tastiera** a capire i campi di un modulo online della PA. L'utente preme una scorciatoia sul campo attivo; l'estensione ne legge il contesto, chiede a un LLM una spiegazione in parole semplici e la fa **annunciare dallo screen reader senza spostare il focus**.

> Hackathon Agentic Coding · Tema "Accessibilità Digitale". Il nome viene dal tema: *la soluzione deve mettersi accanto a chi ha la difficoltà.* Visione completa: [`app/docs/VISION.md`](app/docs/VISION.md).

## Struttura del repository

```
/
├── app/            soluzione sviluppata (estensione MV3, demo, test, docs)
├── agents/         struttura agentica (skill riutilizzabili + mappa della flotta)
├── presentation/   presentazione HTML (brand Accenture)
└── README.md
```

- **[`app/`](app/)** — codice dell'estensione (`manifest.json`, `background.js`, `content.js`, `content.css`, `options.*`, `lib/`), il modulo di demo (`app/demo/`), gli script di dev (`app/tools/`), i test (`app/tests/`) e tutta la documentazione di progetto (`app/docs/`).
- **[`agents/`](agents/)** — le skill riutilizzabili prodotte dalla flotta di agenti e la mappa di come Accanto è stato costruito. Vedi [`agents/README.md`](agents/README.md).
- **[`presentation/`](presentation/)** — presentazione HTML del progetto (brand Accenture).
- **[`CLAUDE.md`](CLAUDE.md)** — guida per lo sviluppo agentico e invarianti non negoziabili (INV-1..INV-10).

## Come far girare la demo

Guida completa in [`app/docs/RUNBOOK.md`](app/docs/RUNBOOK.md). In breve, da `app/`:

```bash
cd app
npm run serve   # serve app/demo/ su http://localhost:8080 (il content script non gira su file://)
npm run check   # controllo sintattico di tutti i sorgenti (node --check)
```

Poi in `chrome://extensions` → Modalità sviluppatore → **Carica estensione non pacchettizzata** → seleziona la cartella `app/`. Configura la API key dalla pagina Opzioni dell'estensione (lato team). Test del giro completo: Tab sul campo → <kbd>Alt+Shift+A</kbd> → l'annuncio arriva → il focus resta sul campo → <kbd>Esc</kbd> chiude.

> Non serve alcun build step: l'estensione si carica così com'è (INV-8). Node.js è usato solo dagli script di sviluppo, senza dipendenze npm a runtime.

## Vincoli non negoziabili

Sicurezza e accessibilità sono il cuore del progetto, non un dettaglio finale. Gli invarianti INV-1..INV-10 (chiave solo nel service worker, nessun furto di focus, `host_permissions` ristretti, solo dati sintetici in demo, ...) sono definiti in [`CLAUDE.md`](CLAUDE.md) e sono la fonte unica per l'intera flotta di agenti.
