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
- Un server statico locale (es. Python già presente su Windows): serve per `http://localhost`.
- Uno screen reader per la verifica: NVDA (gratuito) oppure Narrator (`Win + Ctrl + Invio`).

## 1. Servire il modulo di demo su http://localhost
Il manifest limita l'estensione a `http://localhost/*` (INV-3), quindi la pagina va servita da
localhost (non aperta come `file://`). Da dentro `demo/`:

```
cd demo
python -m http.server 8080
```

Apri poi `http://localhost:8080/index.html`. (Le match pattern di Chrome ignorano la porta:
`http://localhost/*` copre anche `:8080`.)

## 2. Caricare l'estensione unpacked
1. Vai a `chrome://extensions`, attiva **Modalità sviluppatore**.
2. **Carica estensione non pacchettizzata** → seleziona la **cartella radice del repo** (quella con `manifest.json`).
3. Verifica che non compaiano errori.
4. Controlla la scorciatoia: `chrome://extensions/shortcuts` → deve esserci **Alt+Shift+A** per "spiega campo".

> Nota: dopo ogni modifica al codice, torna su `chrome://extensions` e premi **ricarica** sull'estensione.

## 3. Configurare la API key + provider  — ⚠️ TODO (dipende da TK-003.2, oggi placeholder)
Quando `options.html`/`options.js` saranno DONE: apri la pagina Opzioni dell'estensione, inserisci
API key e provider (salvati in `chrome.storage.local`, usati solo nel service worker — INV-1),
e conferma l'avviso che il contenuto del campo viene inviato a un servizio AI esterno.
*(Finché la Fase 1 non è DONE, questo passo non è eseguibile: la demo gira in modalità fallback.)*

## 4. Eseguire il giro  — parziale finché la Fase 1 non è DONE (TK-003.3 / TK-004.2)
1. Con lo screen reader attivo, **Tab** fino a un campo target: **Classe di invalidità** (`#classe-invalidita`).
2. Premi **Alt+Shift+A**.
3. Atteso: l'annuncio della spiegazione arriva via regione ARIA live, **il focus resta sul campo** (INV-7).
4. **Esc** chiude il pannello.
5. Ripeti su **Impegnativa** (`#impegnativa`) ed **Esenzione ticket** (`#esenzione-ticket`).
6. Sul campo sensibile **PIN area riservata** (`#pin-area-riservata`, `type=password`): l'estensione
   **non** deve leggerlo né spiegarlo (INV-4).

## 5. Fallback rete-safe  — ⚠️ TODO (dipende da TK-005.1 / TK-003.3)
Disattiva la rete e ripeti il passo 4 sui campi target: deve comparire comunque una spiegazione
precaricata (fallback). Serve a rendere la demo indipendente dalla rete di sede.

## Stato
Bozza WIP. I passi 1-2 sono eseguibili ora (manifest + demo pronti). I passi 3-5 diventano
verificabili quando `TK-003.2`, `TK-003.3`, `TK-004.2`, `TK-005.1` sono DONE (vedi
[DR-002-execution-index.md](DR-002-execution-index.md)). Aggiornare questo file al momento del G-FASE (TK-006).
