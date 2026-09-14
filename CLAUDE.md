# CLAUDE.md — Accanto

Guida per lo sviluppo agentico di questo progetto. Leggi anche [VISION.md](VISION.md) per il perché.

## Cosa stiamo costruendo

Estensione browser **Manifest V3** che aiuta **Marco** — utente ipovedente, screen reader, solo tastiera — a capire i campi di un modulo online della PA. Marco preme una scorciatoia sul campo attivo; l'estensione legge il contesto del campo, chiede a un LLM una spiegazione in parole semplici, e la fa **annunciare dallo screen reader senza spostare il focus**.

Progetto per un hackathon: **~4 ore, priorità a una demo funzionante su un solo modulo**. Meglio poco che funziona di molto che non gira.

## Regola numero uno: l'accessibilità dell'estensione stessa

Il tool serve un utente di screen reader. **L'output del tool deve quindi essere esso stesso accessibile**, altrimenti il progetto fallisce nel suo stesso obiettivo. Non è un dettaglio finale, è il cuore:

- La spiegazione va inserita in una **regione ARIA live** (`aria-live="polite"`, `role="status"`) così che lo screen reader la annunci automaticamente quando cambia.
- **Mai spostare il focus** dal campo del modulo verso il pannello del suggerimento. Marco deve poter continuare a compilare da dove era.
- Il trigger è una **scorciatoia da tastiera**, non un pulsante da cliknare col mouse.
- Il pannello si chiude con **Esc**.
- Alto contrasto, testo ridimensionabile, rispetta `prefers-reduced-motion`. Nessuna informazione veicolata dal solo colore.
- Testa davvero con uno screen reader (NVDA gratuito, o "Assistente vocale"/Narrator già presente su Windows: `Win + Ctrl + Invio`). Il codice generato "sembra" accessibile molto più spesso di quanto lo sia.

## Stack e vincoli tecnici

- **Manifest V3**, target Chrome/Edge.
- **Nessun build step, nessun framework, nessun bundler.** HTML + CSS + JavaScript (ES modules) puro. Questo è deliberato: massimizza la probabilità di caricare l'estensione e vederla girare senza tempo perso in tooling.
- Nessuna dipendenza npm se evitabile. Se serve una libreria, giustificalo.

## Struttura dei file (proposta)

```
manifest.json          # MV3: permessi, command (scorciatoia), service worker, content script
background.js          # service worker: riceve il comando, fa la fetch all'LLM, tiene la API key
content.js             # legge il campo attivo, mostra la regione live, gestisce Esc
content.css            # stile del pannello: alto contrasto, non invasivo
lib/context.js         # estrae etichetta/legenda/aria-describedby/placeholder del campo attivo
lib/prompt.js          # costruisce il prompt per l'LLM dal contesto del campo
lib/fallback.js        # risposte precaricate per i campi della demo (rete-safe)
options.html/options.js# config LATO TEAM: API key + provider. NON è il flusso di Marco.
demo/                  # copia statica/mock del modulo PA per la demo (dati sintetici)
```

## Confini di sicurezza (non negoziabili)

- La **API key** vive in `chrome.storage.local` e viene usata **solo nel service worker** (`background.js`). Non deve mai finire in `content.js` né nel contesto della pagina.
- La chiamata `fetch` all'LLM parte dal **service worker**, non dal content script.
- `host_permissions` ristretti al **solo dominio del modulo di demo**. Mai `<all_urls>`.
- Nella lettura del DOM **escludi** i campi `type="password"` e i campi con `autocomplete` di pagamento (`cc-number`, ecc.): non vanno letti né inviati.
- Il contenuto della pagina è **non fidato**: nel prompt va delimitato come dato da spiegare, non come istruzioni. Il suggerimento è sempre informativo — l'estensione **non compila e non invia mai** campi da sola.
- Mostra un avviso sintetico che il contenuto del campo viene inviato a un servizio AI esterno.
- Nella demo usa **solo dati sintetici**. Mai dati personali reali del team.

## Affidabilità della demo

Prima della demo, precarica in `lib/fallback.js` le spiegazioni attese per i 2-3 campi che mostrerai. Se la chiamata LLM è lenta, va in errore o non c'è rete, l'estensione usa il fallback per quel campo. La demo non deve dipendere dalla rete di sede.

## Flusso di lavoro

1. **Prima di scrivere codice:** conferma il modulo di demo (quale portale/mock) e mettine una copia statica in `demo/` con dati sintetici. La struttura del DOM decide metà della difficoltà.
2. Carica l'estensione: `chrome://extensions` → Modalità sviluppatore → "Carica estensione non pacchettizzata" → cartella del repo. Dopo ogni modifica: ricarica lì.
3. Testa il giro completo: Tab sul campo → scorciatoia → l'annuncio arriva → focus ancora sul campo → Esc chiude.
4. **Testa con lo screen reader acceso**, non solo a occhio.

## Da evitare (vincoli espliciti del tema)

- Non trasformarlo in uno strumento per sviluppatori: il valore è per Marco, non per un tecnico.
- Non fermarti alla diagnosi ("questo campo è poco chiaro"): l'utente deve **superare** l'ostacolo e finire il modulo.
- Niente restyling grafico fine a sé stesso.
- Niente profili generici: la persona è Marco, keyboard-only + screen reader. Ogni scelta si giustifica rispetto a lui.
- L'uso dell'AI deve essere spiegabile dal team: sappi dire cosa fa il modello, con quali input, e dove serve revisione umana.

## Commit

Messaggi in italiano, brevi, sul perché. Non committare la API key né dati reali.
