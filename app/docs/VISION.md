# Accanto — Visione di progetto

> Hackathon Agentic Coding · Tema 01 "Accessibilità Digitale" · team da 2 · ~4 ore
> Nome di lavoro del prototipo: **Accanto** (dal tema: *"la soluzione deve mettersi accanto a chi ha la difficoltà"*).

## In una frase

Un'estensione browser che, quando una persona che naviga da tastiera con uno screen reader si ferma su un campo di un modulo pubblico che non capisce, le spiega **a voce, su richiesta, in parole semplici** cosa serve davvero in quel campo — senza cambiare il significato di ciò che l'ente chiede e senza rubarle il controllo.

## 1. Persona & Barriera (deliverable 1)

**Marco, 45 anni.** Ipovedente severo: usa uno screen reader (NVDA / Narrator) e naviga **esclusivamente da tastiera**, con Tab da un campo all'altro. Non usa il mouse.

**Dove si blocca.** Sta compilando una domanda online di una prestazione su un portale della pubblica amministrazione (es. INPS). Lo screen reader gli legge l'etichetta del campo — *"Classe di invalidità"*, *"Impegnativa"*, *"Esenzione ticket"* — ma l'etichetta da sola non gli dice **cosa deve scrivere, dove trovare l'informazione, perché quel campo esiste**. La pagina non offre aiuto contestuale accessibile. Oggi Marco abbandona, chiede a qualcun altro, o compila a caso e sbaglia.

**Il momento esatto.** Focus su un campo il cui scopo non è chiaro. Prima ancora di scrivere qualsiasi cosa, deve capire.

## 2. Percorso Assistito (deliverable 2)

**Prima (senza Accanto):** Marco tabula fino a "Classe di invalidità" → lo screen reader legge solo l'etichetta → Marco non sa cosa inserire → si ferma.

**Dopo (con Accanto):**
1. Marco tabula fino al campo, come sempre.
2. Quando non capisce, preme **una scorciatoia da tastiera dedicata** (non deve usare il mouse, non deve cercare un pulsante a schermo).
3. Accanto legge il contesto del campo attivo (etichetta, testo vicino, eventuale descrizione ARIA) e genera una spiegazione in linguaggio semplice.
4. La spiegazione viene **annunciata dallo screen reader** tramite una regione live, **senza spostare il focus** dal campo: Marco continua da dove era.
5. Marco capisce cosa serve, compila il campo e prosegue **in autonomia** fino alla fine del modulo.

Il suggerimento è **su richiesta esplicita**, mai automatico a ogni cambio di campo: un annuncio automatico si sovrapporrebbe alla voce nativa dello screen reader e disorienterebbe l'utente. Il controllo resta a Marco.

## 3. Autonomia & Limiti (deliverable 3)

**Autonomia guadagnata:** Marco porta a termine da solo un modulo che prima non riusciva a completare senza aiuto esterno.

**Cosa è stato semplificato senza tradire:** la spiegazione riformula in parole semplici *cosa chiede* il campo e *perché*, ma non inventa requisiti, non dà consigli su cosa rispondere nel merito, non altera il significato di ciò che l'ente domanda.

**Dove ha contribuito l'AI e dove serve revisione umana:** l'AI genera la spiegazione del campo a partire dal contesto della pagina. La revisione umana serve perché il modello può fraintendere un campo mal etichettato o "allucinare" un requisito: per questo la spiegazione è dichiarata come *aiuto alla comprensione*, non come istruzione ufficiale, e non compila mai i campi al posto dell'utente.

**Limiti che restano:**
- Funziona bene solo su campi con un minimo di contesto testuale leggibile dal DOM; su moduli fatti solo di immagini o campi non etichettati l'aiuto è più debole.
- Il prototipo copre un solo modulo/scenario di demo; non è generalizzato a tutti i portali.
- Dipende da un servizio LLM esterno: senza rete, funziona solo il fallback precaricato.

## 4. Forma tecnica (decisione DR-001)

- **Estensione browser Manifest V3** (Chrome/Edge), senza build step: HTML/CSS/JS puro.
- **Rilevamento del campo:** solo focus da tastiera (`document.activeElement`), nessun tracciamento del mouse — coerente con un utente keyboard-only.
- **Trigger:** scorciatoia da tastiera esplicita.
- **Output accessibile:** regione ARIA live, nessun furto di focus, chiudibile con Esc.
- **Onboarding tecnico (API key / provider):** configurato **dal team** nelle opzioni dell'estensione, **prima** della demo. Non fa parte del percorso di Marco.

Dettagli implementativi e vincoli per lo sviluppo agentico: vedi [CLAUDE.md](../../CLAUDE.md). Motivazioni della scelta: vedi [DR-001-decisione-scope-architettura.md](DR-001-decisione-scope-architettura.md).

## 5. Perimetro delle 4 ore

**Dentro:**
- Estensione MV3 minima funzionante su **un** modulo di demo scelto.
- Estrazione contesto del campo attivo + chiamata LLM + annuncio accessibile.
- Pagina opzioni per la API key (lato team).
- Risposte di fallback precaricate per lo scenario di demo.
- I tre deliverable del tema (questo documento è la base).

**Fuori:**
- Design visivo curato (l'UI è funzionale e ad alto contrasto, non altro).
- Supporto multi-portale / multi-lingua.
- Scelta di provider/agente esposta all'utente finale.
- Pubblicazione sullo store, packaging di distribuzione.
- Auto-compilazione dei campi.

## 6. Rischi noti e mitigazioni (dalla roundtable)

| Rischio | Mitigazione |
|---|---|
| Chiamata LLM lenta o irraggiungibile in demo | Risposte di fallback precaricate per i campi mostrati |
| Suggerimento che si sovrappone allo screen reader | Trigger esplicito + regione live "polite" + nessun furto di focus |
| Dati personali reali inviati al provider LLM | Solo dati sintetici nel modulo di demo |
| API key esposta o in contesto pagina | Chiave in `chrome.storage`, usata solo nel service worker, mai iniettata nella pagina |
| Prompt injection da contenuto ostile in pagina | Suggerimento sempre informativo, mai azione automatica; il contenuto di pagina è trattato come non fidato nel prompt |
| Permessi troppo ampi | `host_permissions` ristretti al solo dominio di demo |

## 7. Come si misura il successo in demo

Marco (o chi lo impersona, a occhi chiusi / a schermo spento, usando solo screen reader e tastiera) completa il modulo di demo **dall'inizio alla fine senza aiuto vedente**, usando Accanto sui 2-3 campi critici. Il "prima" (blocco) e il "dopo" (completamento) sono mostrati sullo stesso campo, con la stessa persona.
