---
title: RUNBOOK — far girare la demo di Accanto
traces_to: TK-015 (DR-002)
status: WIP (i passi 3-5 si verificano quando la Fase 1 è DONE)
updated: 2026-09-14
---

# RUNBOOK — Accanto (demo locale)

Come far girare la demo end-to-end su una macchina nuova. Solo dati sintetici (INV-9);
la API key resta lato team / service worker (INV-1).

## Prerequisiti
- Chrome o Edge (target Manifest V3).
- Un server statico locale: **Node.js** (via gli script del repo) **oppure** Python, già presente
  su Windows. Serve perché la pagina va aperta da `http://localhost`.
- Uno screen reader per la verifica: NVDA (gratuito) oppure Narrator (`Win + Ctrl + Invio`).

## 1. Servire il modulo di demo su http://localhost
Il manifest limita l'estensione a `http://localhost/*` (INV-3), quindi la pagina va servita da
localhost (non aperta come `file://`: con `file://` il content script non viene iniettato e la
scorciatoia non risponde).

Dalla cartella **`app/`**:

```
cd app
npm run serve
```

Nessun `npm install`: il progetto non ha dipendenze (INV-8) e lo script usa solo moduli nativi
di Node. Se la porta 8080 è occupata: `PORT=8081 npm run serve`.

In alternativa, senza Node, da dentro `app/demo/`:

```
cd app/demo
python -m http.server 8080
```

Con entrambi, apri poi `http://localhost:8080/index.html`. (Le match pattern di Chrome ignorano
la porta: `http://localhost/*` copre anche `:8080`.)

> Il server espone **solo** la cartella `demo/`: `manifest.json` e il codice dell'estensione non
> sono raggiungibili via HTTP.

## 2. Caricare l'estensione unpacked
1. Vai a `chrome://extensions`, attiva **Modalità sviluppatore**.
2. **Carica estensione non pacchettizzata** → seleziona la cartella **`app/`** (quella con `manifest.json`).
3. Verifica che non compaiano errori.
4. Controlla la scorciatoia: `chrome://extensions/shortcuts` → deve esserci **Alt+Shift+A** per "spiega campo".

> Nota: dopo ogni modifica al codice, torna su `chrome://extensions` e premi **ricarica** sull'estensione.

## 3. Configurare la API key + provider — *opzionale oggi*
Apri la pagina Opzioni dell'estensione (`chrome://extensions` → Dettagli → Opzioni estensione),
inserisci API key e provider e salva: finiscono in `chrome.storage.local` come `{ apiKey, provider }`
e vengono usati **solo** nel service worker (INV-1). Nella pagina è visibile l'avviso che il
contenuto del campo viene inviato a un servizio AI esterno.

> **Oggi questo passo non serve per far girare la demo.** L'architettura è *fallback-first*: le
> spiegazioni dei 3 campi target arrivano da `lib/fallback.js` e nessuna chiamata di rete viene
> mai eseguita. La chiave verrà effettivamente letta solo quando TK-007.1 attiverà la fetch.

## 4. Eseguire il giro
1. Con lo screen reader attivo, **Tab** fino a un campo target: **Classe di invalidità** (`#classe-invalidita`).
2. Premi **Alt+Shift+A**.
3. Atteso: l'annuncio della spiegazione arriva via regione ARIA live, **il focus resta sul campo** (INV-7).
4. **Esc** chiude il pannello.
5. Ripeti su **Impegnativa** (`#impegnativa`) ed **Esenzione ticket** (`#esenzione-ticket`).
6. Sul campo sensibile **PIN area riservata** (`#pin-area-riservata`, `type=password`): l'estensione
   **non** deve leggerlo né spiegarlo (INV-4).

## 5. Fallback rete-safe
Disattiva la rete e ripeti il passo 4 sui campi target: deve comparire comunque la spiegazione
precaricata. Serve a rendere la demo indipendente dalla rete di sede.

Oggi il fallback è l'**unica** sorgente di spiegazione, quindi questo passo deve dare lo stesso
identico risultato del passo 4, rete o non rete. Quando TK-007.1 avrà attivato la fetch, tornerà
a essere un test che distingue davvero due percorsi.

## Verifiche di sviluppo (facoltative, non servono alla demo)

```
cd app
npm run check    # controllo sintattico di tutti i sorgenti JS
```

Non è la suite di test: i controlli sugli invarianti di sicurezza sono TK-008.1 e i test a11y
sul pannello sono TK-008.2, entrambi ancora da scrivere.

## Stato
Passi 1-5 **scrivibili per intero**: tutto il codice della Fase 1 esiste (TK-003.2, TK-003.3,
TK-004.2, TK-004.3, TK-005.1 sono DONE).

⚠️ **Non ancora eseguiti in un browser.** `background.js`, `options.*` e `content.css` sono stati
scritti e verificati solo staticamente: il primo giro reale è il gate **TK-006 (SEC-GATE)**, e la
verifica con screen reader è **TK-014**. Finché quei due gate non sono passati, questo runbook
descrive il comportamento *atteso*, non ancora *osservato*. Aggiornare questo file dopo TK-006.
