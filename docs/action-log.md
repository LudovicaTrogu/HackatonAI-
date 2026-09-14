---
title: Action Log — decisioni operative
traces_to: DR-002
---

# Action Log

## G0 — Modulo di demo, campi target, dominio (TK-001.1)

- **Data:** 2026-09-14
- **Modulo scelto:** domanda di invalidità civile, stile INPS (mock sintetico in `demo/index.html`, nessun dato reale).
- **Campi target per l'estensione** (in ordine di comparsa nel modulo):
  1. `#classe-invalidita` — "Classe di invalidità"
  2. `#impegnativa` — "Impegnativa"
  3. `#esenzione-ticket` — "Esenzione ticket"
- **Campo sensibile (negativo, INV-4):** `#pin-area-riservata` (`type="password"`) — non va mai letto né spiegato dall'estensione.
- **Dominio per `host_permissions` (INV-3):** `http://localhost` — nessuna dipendenza da rete esterna nella demo.
- **Decisione presa da:** Alessandro Musio (owner), tramite conferma diretta.
