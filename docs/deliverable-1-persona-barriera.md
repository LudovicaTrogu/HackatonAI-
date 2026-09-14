---
title: Deliverable 1 — Persona & Barriera
traces_to: TK-009.1, VISION.md §1
base: VISION.md, docs/action-log.md, demo/index.html
date: 2026-09-14
---

# Persona & Barriera

> Deliverable 1 del tema "Accessibilità Digitale". Riusa la persona e la barriera già definite in [VISION.md](../VISION.md#1-persona--barriera-deliverable-1); qui l'ancoraggio è al modulo di demo reale (`demo/index.html`), con il momento del blocco descritto su un campo specifico, non in generale.

## Chi è Marco

Marco, 45 anni, è **ipovedente severo**. Usa uno **screen reader** (NVDA o Narrator) e naviga **esclusivamente da tastiera**: si sposta tra i campi di un modulo con **Tab**, non usa il mouse e non vede il layout della pagina. Sente solo ciò che lo screen reader gli legge: l'etichetta del campo attivo e, se presente e associata correttamente nel DOM, il suo testo di aiuto.

## Il compito e il modulo

Marco sta compilando online la **domanda di prestazione per invalidità civile** (mock sintetico in `demo/index.html`, stile INPS, nessun dato reale). Dopo aver superato l'area riservata (codice fiscale + PIN — quest'ultimo è il campo sensibile che Accanto non legge mai, INV-4) e i dati anagrafici, arriva alla sezione **"Dati della domanda"**, che contiene tre campi:

1. `#classe-invalidita` — "Classe di invalidità" (menù a tendina)
2. `#impegnativa` — "Impegnativa" (campo di testo)
3. `#esenzione-ticket` — "Esenzione ticket" (campo di testo)

## Il momento esatto del blocco

Marco tabula fino al primo campo della sezione: **`#classe-invalidita`**. Lo screen reader annuncia:

> *"Classe di invalidità, menù a comparsa"*

e legge le opzioni disponibili: *"— Seleziona —, Da 0% a 33%, Da 34% a 66%, Da 67% a 99%, 100%"*.

Il campo ha in realtà un testo di aiuto nel DOM (`<p class="hint" id="hint-classe-invalidita">`, collegato via `aria-describedby`), ma il problema non è l'assenza di markup: è che **Marco non sa a quale percentuale corrisponde la sua situazione**. Lui sa di avere un verbale della commissione medica, ma non sa se quel numero si traduce in "classe" o se deve leggerlo altrove sul documento; l'etichetta e le opzioni del menù non gli dicono **da dove prendere quel dato** né **perché il modulo lo sta chiedendo in quella forma**.

A questo punto, prima ancora di poter scegliere un'opzione, Marco si ferma: non ha un'informazione mancante nel senso di "non l'ho compilata", ma un ostacolo di comprensione — non sa collegare ciò che possiede (il verbale) a ciò che il campo richiede (una fascia percentuale). Oggi, senza aiuto, le sue opzioni sono: indovinare una fascia a caso (rischiando un errore sulla domanda), abbandonare il modulo, o chiedere a una persona vedente di leggergli il documento cartaceo e dirgli cosa scegliere — perdendo l'autonomia che la tastiera e lo screen reader gli avrebbero altrimenti garantito.

Lo stesso tipo di blocco si ripete, in forma più lieve, sugli altri due campi target: su `#impegnativa` Marco sa di dover inserire "un numero", ma non è sicuro se si riferisca al numero della prescrizione del medico di base o a un altro codice presente sul documento; su `#esenzione-ticket` non è certo se il codice richiesto sia quello che ha eventualmente ricevuto dalla ASL o un valore diverso. In tutti e tre i casi la barriera è la stessa: **l'etichetta esiste ed è accessibile, ma non basta a collegare il dato che Marco ha in mano al campo che il modulo chiede**.

## Perché non è un profilo generico

Questa barriera non è "un modulo poco chiaro" in astratto: è specifica di un utente che **non può guardare** l'intero modulo per farsi un'idea d'insieme, non può cercare un tooltip col mouse, e non ha alcun canale visivo per confrontare il testo di aiuto con il proprio documento cartaceo. Per un utente vedente lo stesso `hint` accanto al campo potrebbe bastare a orientarsi per tentativi; per Marco, che sente i campi uno alla volta in sequenza tramite Tab, la mancanza di un aiuto contestuale **su richiesta, nel momento in cui serve**, è ciò che trasforma un'incertezza in un blocco totale del percorso.
