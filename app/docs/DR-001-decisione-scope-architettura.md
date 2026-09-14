---
decision_id: DR-001
mode: decisione (architettura)
depth: mirata (4 reviewer, 1 round)
status: ACCEPTED_WITH_CONDITIONS
session_state: CLOSED
decision_owner: owner del progetto (utente)
date: 2026-09-14
---

# DR-001 — Scope e architettura del prototipo Accanto

## Domanda

Quale scope e architettura adottare per il prototipo del Tema 01 (persona da supportare, forma tecnica, onboarding, meccanismo di rilevamento del contesto) dato un budget di ~4 ore per un team di 2?

## Decisione

**MVP mirato (OPT-B)** con quattro precisazioni emerse dal panel:

1. **Persona:** Marco — ipovedente, screen reader, navigazione solo da tastiera. Servizio: modulo online PA (stile INPS), reale o copia realistica.
2. **Forma tecnica:** estensione **Manifest V3** (non bookmarklet). La scarsa esperienza del team con MV3 non è un ostacolo perché lo sviluppo è full-agentico, il che annulla il vantaggio di costo che avrebbe avuto uno script iniettato.
3. **Rilevamento:** solo focus da tastiera (tab / `activeElement`), niente mouse.
4. **Suggerimento su richiesta esplicita** (scorciatoia), non automatico a ogni focus.

## Motivazioni

- **Vincolo di budget (precedenza #2).** Tutti e 4 i reviewer hanno classificato l'idea originale intera (OPT-A: mouse + tab + scelta agente, senza scoping) come **blocker di fattibilità**, non come rischio: non realizzabile in 4 ore per 2 persone. Ridotta ai suoi elementi essenziali, OPT-A collassa in OPT-B.
- **Vincolo del tema (precedenza #1).** L'onboarding "scegli agente / inserisci API key" non deve stare nel percorso di Marco: chiedere una scelta tecnica a una persona con una difficoltà viola *"usabile dalla persona stessa, non da un tecnico"*. Va configurato dal team prima della demo.
- **Coerenza persona-meccanismo.** Il tab-focus è deterministico e demo-safe (Ingegnere senior) ed è l'unico coerente con un utente keyboard-only. Il mouse-tracking sarebbe rumore per Marco.
- **Accessibilità dell'output.** Un suggerimento automatico a ogni focus si sovrappone all'annuncio nativo dello screen reader (Voce dell'utente): il trigger esplicito è una condizione tecnica, non solo una preferenza UX.

## Alternative scartate

- **OPT-A (visione originale intera):** si perde un onboarding flessibile multi-agente e il doppio tracciamento. Scartata perché blocker di fattibilità e di sicurezza (superficie troppo ampia da mettere in sicurezza in 4h).
- **OPT-C (bookmarklet come prodotto finale):** si perde l'artefatto installabile. Scartata perché il meccanismo di installazione stesso rischia di diventare la barriera per la persona; inoltre lo sviluppo agentico toglie il suo unico vantaggio (velocità di scaffolding).

## Condizioni (dalla disposizione dell'owner + blocker del panel)

- Solo dati sintetici nel modulo di demo.
- `host_permissions` ristretti al dominio di demo; niente lettura di campi password/pagamento.
- API key in `chrome.storage`, usata solo nel service worker, mai in contesto pagina.
- Fallback precaricato per i campi mostrati in demo.
- **Test manuale con screen reader reale** riservato esplicitamente (~15-20 min): l'agentic coding accelera il codice ma non sostituisce la verifica dell'annuncio/focus.

## Cosa cambierebbe la decisione

- Un vincolo esplicito dei giudici che imponga un artefatto diverso.
- Scoperta che il modulo di demo scelto ha un DOM senza contesto testuale leggibile (renderebbe debole l'estrazione).

## Ancora aperto

- Quale modulo PA specifico usare in demo.
- Quale provider LLM.

## Nota di processo

Panel mirato a 4 reviewer (Ingegnere senior, Ingegnere della sicurezza, Voce dell'utente, Critico), 1 round indipendente in isolamento, nessun Round 2/3 (profondità mirata). Esclusi dal panel di base per budget: Analista dei requisiti, Architetto di sistema, Architetto dei test. Convergenza 4/4 sul declassare OPT-A; nessun dissenso residuo materiale.
