# Struttura agentica — Accanto

Come è stato costruito Accanto in modo **agentico** entro il time-box dell'hackathon (4h nette, team di 2). Questa cartella contiene le **skill riutilizzabili** prodotte dalla flotta; le decisioni di metodo e la taskificazione vivono nei documenti in [`../app/docs/`](../app/docs/).

## La flotta (decisione DR-002)

Struttura **OPT-C minimale**: perimetri degli agenti **mappati sulla frontiera di fiducia** dell'estensione — privilegiato (`background.js`/`options` = chiave + rete) ↔ pagina (`content.js`/contesto = contenuto non fidato) — *skeleton-first*, con **phase-gate** a ~T+2h e Fase 2 opzionale.

- **2 orchestratori paralleli** su worktree/branch isolati per track, con diff-review all'integrazione e un **SEC-GATE** statico.
- **Track A (percorso critico):** estensione MV3 end-to-end su un modulo demo → demo funzionante.
- **Track B (parallelo):** skill riutilizzabili di pari rango + test-automation, tagliabili senza perdere lo skeleton demo-safe.
- **Gate umani non comprimibili:** scelta del modulo demo, `host_permissions`/dominio/dipendenze, e il **test manuale con screen reader reale** (unico gate che chiude l'accessibilità).

Panel decisionale: 7 reviewer a modelli misti (Governance agentica, Delivery, Complessità, Ingegnere senior, Architetto dei test, Piattaforma/DevEx, Critico). Dettaglio completo, motivazioni e dissenso in [`../app/docs/DR-002-decisione-flotta-agenti.md`](../app/docs/DR-002-decisione-flotta-agenti.md); taskificazione operativa in [`../app/docs/DR-002-taskboard.md`](../app/docs/DR-002-taskboard.md) e stato in [`../app/docs/DR-002-execution-index.md`](../app/docs/DR-002-execution-index.md).

## Invarianti congelati (nessun agente li modifica)

Fonte unica: [`../CLAUDE.md`](../CLAUDE.md). In sintesi: chiave solo in `chrome.storage` e usata solo nel service worker (INV-1), `fetch` solo dal SW (INV-2), `host_permissions` = solo dominio demo (INV-3), esclusione campi password/pagamento (INV-4), contenuto pagina come dato delimitato nel prompt (INV-5), nessuna auto-compilazione (INV-6), nessun furto di focus / output solo via `aria-live` (INV-7), nessun build step (INV-8), solo dati sintetici in demo (INV-9), DR-001 non ridiscusso (INV-10).

## Skill riutilizzabili (`skills/`)

Ogni skill è generica, testata su una 2ª fixture e documentata nel suo `SKILL.md`.

| Skill | Cosa fa | Invarianti di riferimento |
|---|---|---|
| [`skills/extract-field-context/`](skills/extract-field-context/) | Estrae il contesto del campo attivo (etichetta, hint `aria-describedby`, tipo), escludendo i campi sensibili | INV-4 |
| [`skills/prompt-da-dato-non-fidato/`](skills/prompt-da-dato-non-fidato/) | Costruisce il prompt trattando il contenuto di pagina come **dato delimitato**, non come istruzione | INV-5 |
| [`skills/announce-aria-live/`](skills/announce-aria-live/) | Annuncia il testo in una regione `aria-live="polite"` / `role="status"` senza spostare il focus | INV-7 |
