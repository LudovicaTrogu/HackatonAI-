---
title: Deliverable 2 — Percorso Assistito (before/after)
traces_to: TK-009.2, VISION.md §2
base: VISION.md, docs/deliverable-1-persona-barriera.md, docs/action-log.md, demo/index.html, manifest.json
date: 2026-09-14
---

# Percorso Assistito — prima e dopo Accanto

> Deliverable 2 del tema "Accessibilità Digitale". Riusa il percorso già definito in [VISION.md](VISION.md#2-percorso-assistito-deliverable-2); qui il confronto before/after è ancorato allo **stesso campo e alla stessa persona** del Deliverable 1 ([deliverable-1-persona-barriera.md](deliverable-1-persona-barriera.md)): Marco su `#classe-invalidita` nel modulo `demo/index.html`.

## Nota sullo stato dell'implementazione

Il blocco "Prima" descrive un comportamento **osservabile oggi** in `demo/index.html` (nessuna estensione caricata: il campo espone solo etichetta + hint via `aria-describedby`, letti dallo screen reader).

Il blocco "Dopo" descrive il comportamento **di progetto**, vincolato dai contratti già congelati nel repo — `manifest.json` (comando `spiega-campo`, scorciatoia `Alt+Shift+A`), `lib/messages.js` (contratto richiesta/risposta `ACCANTO_EXPLAIN`) e gli invarianti INV-1..INV-10 in [CLAUDE.md](../../CLAUDE.md) — non ancora un giro end-to-end verificato: `content.js`, `background.js` e `lib/fallback.js` sono a questa data placeholder (TK-002.3 WIP; TK-003.x/TK-004.x TODO in [DR-002-execution-index.md](DR-002-execution-index.md)). La verifica reale con screen reader del giro completo è il gate TK-014, ancora da eseguire. Questo documento non afferma di aver osservato il "dopo" in esecuzione; lo specifica come contratto vincolante per l'implementazione.

## Prima (senza Accanto) — osservato

Marco tabula fino a `#classe-invalidita`. Lo screen reader annuncia:

> *"Classe di invalidità, menù a comparsa"* — poi le opzioni: *"— Seleziona —, Da 0% a 33%, Da 34% a 66%, Da 67% a 99%, 100%"*.

Il campo ha un hint associato via `aria-describedby` (`hint-classe-invalidita`: "Percentuale di invalidità civile riconosciuta dalla commissione medica competente"), quindi lo screen reader lo legge se configurato per farlo — ma anche sentendolo, Marco non sa **da dove prendere quel dato** (ha un verbale della commissione medica, non sa se corrisponde a una "classe" o va letto altrove) né **perché il modulo lo chiede in quella forma**. Si ferma prima di poter scegliere un'opzione (dettaglio del blocco in [deliverable-1-persona-barriera.md](deliverable-1-persona-barriera.md)).

## Dopo (con Accanto) — di progetto

1. Marco tabula fino a `#classe-invalidita`, come sempre: nessun cambiamento nel modo in cui naviga il modulo.
2. Non capendo cosa scrivere, preme la scorciatoia dedicata **Alt+Shift+A** (comando `spiega-campo`, `manifest.json`) — da tastiera, senza cercare un pulsante a schermo.
3. Il content script legge `document.activeElement` (il `<select>` con focus), ne estrae il contesto (etichetta "Classe di invalidità", hint associato, tipo di campo) e lo invia al service worker con il messaggio `ACCANTO_EXPLAIN` (contratto in `lib/messages.js`).
4. Il service worker produce una spiegazione in parole semplici — dalla chiamata LLM (Fase 2) o, se rete/LLM non disponibili, dal fallback precaricato (`lib/fallback.js`, Fase 1) — senza mai auto-compilare o suggerire una scelta specifica (INV-6): riformula cosa chiede il campo e a cosa corrisponde, non "quale opzione scegliere per il tuo caso".
5. La spiegazione arriva al content script e viene annunciata in una regione ARIA live (`aria-live="polite"`, `role="status"`), **senza spostare il focus** dal `<select>` (INV-7): Marco resta esattamente dove era.
6. Marco ascolta la spiegazione, capisce a cosa si riferisce la fascia percentuale richiesta, e — restando lui a decidere il valore, dato che sa leggere il proprio verbale — seleziona l'opzione corretta e prosegue con **Tab** verso `#impegnativa` e `#esenzione-ticket`, dove può ripetere lo stesso gesto se necessario.
7. Il suggerimento resta disponibile solo su richiesta esplicita: nessun annuncio automatico al cambio di campo, per non sovrapporsi alla voce nativa dello screen reader (VISION.md §2).

## Cosa cambia, esattamente

| | Prima | Dopo |
|---|---|---|
| Navigazione | Tab, come sempre | Tab, come sempre (nessun cambiamento) |
| Su blocco | si ferma, non sa cosa scrivere | preme Alt+Shift+A, ottiene una spiegazione |
| Canale dell'aiuto | nessuno (solo hint statico, insufficiente) | regione ARIA live, letta dallo screen reader |
| Focus | — | invariato (INV-7): Marco non perde il posto |
| Chi decide il valore da inserire | Marco (con o senza aiuto) | Marco (l'estensione spiega, non compila né consiglia nel merito — INV-6) |
| Esito | abbandono, tentativo a caso, o aiuto di terzi | Marco completa il campo e il modulo in autonomia |

## Perché è lo stesso confronto, non due scenari diversi

Il "prima" e il "dopo" condividono campo (`#classe-invalidita`), persona (Marco) e modulo (`demo/index.html`): l'unica variabile è la presenza di Accanto. Questo è il confronto richiesto per la demo dal vivo (vedi [docs/demo-script.md](demo-script.md)) e per la misura di successo in [VISION.md §7](VISION.md#7-come-si-misura-il-successo-in-demo).
