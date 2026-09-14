---
title: Script della demo live — Accanto (before/after)
traces_to: TK-016 (DR-002)
nota: questa è la SCALETTA operativa da recitare; il documento di consegna per i giudici è il deliverable TK-009.2 (Percorso Assistito).
updated: 2026-09-14
---

# Script della demo live — Accanto

Obiettivo: mostrare, sulla stessa persona e sugli stessi campi, il **prima** (blocco) e il
**dopo** (autonomia), come chiede il tema. Durata target ~3-4 minuti.

## Setup (prima di iniziare)
- Modulo demo servito su `http://localhost:8080` (vedi [RUNBOOK.md](RUNBOOK.md)), estensione caricata,
  API key configurata (o modalità fallback).
- **Screen reader attivo** (NVDA o Narrator) e **schermo spento / occhi chiusi**: la demo si giudica
  a occhi chiusi, solo tastiera + voce.
- Persona: **Marco** (o un membro del team che lo impersona, keyboard-only).
- Campi scelti: **Classe di invalidità**, **Impegnativa** (2 campi; il 3° `Esenzione ticket` come riserva).

## Ruoli (team di 2)
- **Narratore:** spiega cosa sta succedendo e la parte "dove contribuisce l'AI".
- **Operatore (Marco):** naviga solo da tastiera con lo screen reader.

## Scena 1 — PRIMA (senza Accanto) · ~30-40s
1. Marco tabula fino a **Classe di invalidità**.
2. Lo screen reader legge **solo l'etichetta** — nessun aiuto su *cosa* scrivere o *dove* trovarlo.
3. Marco si ferma: "non so cosa inserire qui." → **il blocco** è mostrato dal vivo.

## Scena 2 — DOPO (con Accanto) · ~60-90s
1. Sullo stesso campo, Marco preme **Alt+Shift+A**.
2. La spiegazione in parole semplici viene **annunciata dallo screen reader** via regione ARIA live.
3. **Il focus resta sul campo** (Marco continua da dove era — punto chiave di accessibilità, INV-7).
4. Marco capisce, compila, preme **Esc** per chiudere il pannello, e prosegue.
5. Ripete su **Impegnativa**: stesso gesto, stesso risultato → completa il campo in autonomia.
6. (Opzionale) mostra il campo **PIN area riservata**: premendo la scorciatoia **non** parte alcuna
   spiegazione — l'estensione non legge campi sensibili (INV-4). Rafforza il messaggio di sicurezza.

## Frase sull'AI (obbligatoria per il tema)
> "La spiegazione è generata da un LLM a partire dal solo contesto del campo. È un **aiuto alla
> comprensione**, non un'istruzione ufficiale: Accanto non compila mai i campi al posto di Marco.
> La revisione umana serve perché il modello può fraintendere un campo mal etichettato — per questo
> il testo è dichiarato come aiuto, e i campi sensibili non vengono mai letti."

## Backup / rischi in demo
- Se cade la rete: il **fallback precaricato** garantisce comunque l'annuncio sui campi target (rete-safe).
- Se la scorciatoia non risponde: ricaricare l'estensione da `chrome://extensions` e riprovare.

## Chiusura (~15s)
"Marco è arrivato in fondo a un modulo che prima non riusciva a completare da solo, senza aiuto vedente."

---
*Rifinire dopo il G-FASE (TK-006): confermare scorciatoia, campi e tempi contro la build reale.*
