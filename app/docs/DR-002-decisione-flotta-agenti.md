---
decision_id: DR-002
mode: decisione di direzione (metodologia / taskificazione) → taskificazione
depth: standard-light (7 reviewer, Round 1 in isolamento, uscita anticipata)
status: ACCEPTED_WITH_CONDITIONS
session_state: CLOSED
decision_owner: owner del progetto (utente)
relatore: Orchestratore (non decide)
relates_to: DR-001
date: 2026-09-14
taskboard: docs/DR-002-taskboard.md
---

# DR-002 — Struttura della flotta di skill/agenti per implementare Accanto

## Domanda

Quale struttura di flotta di skill e agenti adottare per implementare il prototipo
Accanto in modo agentico entro il time-box dell'hackathon (4h nette, team di 2), e
quali requisiti e vincoli deve rispettare ogni stream? La scelta deve massimizzare la
probabilità di una demo funzionante senza violare i confini non negoziabili
(sicurezza + accessibilità), tenendo conto della richiesta di riusabilità delle skill
e di test automatici di accessibilità.

## Decisione

**OPT-C minimale** — flotta a **perimetri mappati sulla frontiera di fiducia**,
*skeleton-first*, con **phase-gate** e Fase 2 (di default OFF, ma qui attivata dalle
scelte dell'owner). È simultaneamente il consenso di 6 reviewer su 7 e l'"OPT-A con
guardie" del Critico.

Con tre disposizioni dell'owner che spostano lo scope oltre il minimo raccomandato:

1. **Riuso di pari rango (EV-007):** le 4 skill riutilizzabili sono cittadini di prima
   classe (generiche + testate con una 2ª fixture), non estratte a posteriori.
2. **Budget 4h nette + "testare tutto" (EV-008):** lo stream di test-automation passa da
   condizionale a pianificato, con la guardia del cap sullo spike Playwright.
3. **2 orchestratori paralleli:** worktree/branch isolati per track + diff-review
   all'integrazione + SEC-GATE statico (risolve BC-1).

## Motivazioni (tracciate a criteri ed evidenze)

- **OPT-B respinta 7/7.** ~8-10 file (EV-004) su <1,5 file/agente accoppiati: il costo di
  coordinamento (C5) supera il lavoro; `manifest.json` è un chokepoint serializzante; il
  tree condiviso (AS-002) produce merge conflict. Contro-intuitivo (Critico, Governance):
  più specializzazione = **più** rischio sul blocker di sicurezza C2, perché EV-003 è un
  invariante trasversale che nessun singolo agente possiede se lo si frammenta.
- **Frontiera di fiducia (Governance).** EV-004 non è solo una struttura file: è già una
  frontiera privilegiato (background/options: chiave, rete) ↔ pagina (content/context:
  contenuto non fidato). Il perimetro degli agenti deve mapparla → beneficio doppio su C5 e C2.
- **Verifica (Test, Complessità, Critico, Senior, Governance).** Playwright+virtual-SR su
  MV3 (EV-008) non è affidabile nel time-box (UNK-001): fuori dal percorso critico, mai come
  gate. Il gate a11y che chiude C3 è il **test manuale con screen reader reale** (EV-010),
  irriducibile. Rischio #1: "sembra accessibile" si chiude solo con EV-010.
- **Precedenza.** C1 (demo, tema+DR-001) e C2 (sicurezza) dominano; le scelte dell'owner
  su riuso/test sono perseguite in parallelo (track B) senza spostare il percorso critico,
  protetto dal phase-gate a ~T+2h.

## Alternative scartate (con differenze)

- **OPT-B (flotta a stream specializzati):** si guadagna parallelismo teorico ma si perde su
  C5/C6 (coordinamento) **e su C2** (invariante di sicurezza frammentato). Respinta 7/7.
- **OPT-A pura (flotta minima):** identica a OPT-C in Fase 1 ma senza phase-gate esplicito:
  si perde il checkpoint go/no-go e la reversibilità dichiarata (C7).
- **OPT-D (singolo loop):** pavimento sicuro a 4h, ma perde la retirement anticipata del
  rischio con lo skeleton e non sfrutta la struttura file già definita.

## Dissenso residuo (attribuito)

Il **Critico** mantiene: (a) il vero collo di bottiglia non è il codegen (AS-001) ma il ciclo
load/reload/debug MV3 + verifica umana (EV-010) + freeze del DOM (UNK-003) — «ogni flotta
ottimizza la variabile sbagliata»; (b) EV-007/EV-008 sono `REPORTED`, servono lo sviluppatore
non Marco, e il tema penalizza i tool-per-dev. L'owner ha esercitato l'autorità alzando il peso
di C4/test; mitigazione incorporata: G0 in testa, percorso critico protetto dal phase-gate,
riuso/test in parallelo su track B.

## Blocker affrontati

- **BC-1** (scrittura concorrente su tree condiviso rompe tracciabilità + enforcement EV-003)
  → worktree/branch isolati per track + diff-review + SEC-GATE.
- **BC-2** (sicurezza garantita solo con invarianti congelati + gate umano su host_permissions)
  → INV-1..INV-10 ratificati; gate umano su host_permissions/dominio/dipendenze.
- **BLK-T01** (C3 chiuso solo da EV-010) → slot G-SR fisso, non comprimibile, bloccante.

## Vincoli trasversali (i "paletti")

**Invarianti congelati (nessun agente li modifica; traccia a EV-003/DR-001):**
INV-1 chiave solo in chrome.storage, usata solo nel service worker · INV-2 fetch solo dal SW ·
INV-3 host_permissions = solo dominio demo, mai `<all_urls>` · INV-4 escludere password/pagamento
(isSensitive) · INV-5 contenuto pagina nel prompt come dato delimitato · INV-6 niente
auto-compilazione/invio · INV-7 niente furto di focus, output solo via aria-live=polite/role=status
+ Esc · INV-8 niente build step/bundler/framework/npm runtime · INV-9 demo solo dati sintetici ·
INV-10 DR-001 non ridiscusso.

**Matrice di autonomia (anti over-gating):** dentro-perimetro con acceptance verde → autonomia
piena; tocco fuori perimetro o di un INV-* → STOP/rollback; modifica a host_permissions / nuovo
dominio / nuova dipendenza / rimozione esclusione password → gate umano; scelta modulo demo e
test SR reale → gate umano. Nessun altro gate.

**Segnali di deriva:** chiave o chrome.storage.get in content; fetch in content; host_permissions
che si allarga; selettori password/cc non esclusi; prompt.js che concatena il contenuto come
istruzione; comparsa di build step; codice di auto-fill; spostamento di focus; Fase 1 non
end-to-end alla deadline del phase-gate.

## Piano di validazione e reversione

- **Validazione a piramide:** L1 check statici (manifest/grep chiave) → L2 test DOM su fixture
  (senza Playwright) → L3 gate manuale EV-010. Spike Playwright+virtual-SR con cap 20 min e degrado.
- **Reversal path:** ogni stream di Fase 2 è opzionale; se il budget stringe si taglia senza
  perdere lo skeleton demo-safe garantito dal phase-gate.

## Ignoti aperti

- UNK-003 DOM del modulo demo (chiuso da G0/TK-001, precondizione a tutto il codice).
- UNK-001 fattibilità Playwright+virtual-SR (isolata dietro lo spike con cap).
- EV-006 budget: risolto dall'owner a **4h nette da ora**.

## Cosa cambierebbe la decisione

- Un vincolo esplicito dei giudici che imponga parallelismo massimo o artefatti diversi.
- Scoperta che il DOM del modulo demo non è semantico (rende debole l'estrazione) → riscrivere
  demo/ prima del codice.
- Fallimento dello spike Playwright → S5 degrada, la struttura resta invariata.

## Nota di processo

Panel di 7 reviewer (Governance agentica, Delivery, Complessità, Ingegnere senior, Architetto
dei test, Piattaforma/DevEx, Critico), modelli misti (opus/sonnet) per diversità dei modi di
fallimento. Round 1 in isolamento parallelo; tutti `completed`. Uscita anticipata dichiarata
dopo la Sintesi 1: i conflitti residui (peso del riuso, spike) sono owner-decidibili, non
risolvibili con altri round. Esclusi dal panel di base con motivo: Analista dei requisiti
(requisiti già ratificati in DR-001/CLAUDE.md/tema) e Architetto di sistema (architettura
dell'estensione già decisa in DR-001). Nessun Ingegnere della sicurezza dedicato: i confini
sono `VERIFIED` non negoziabili, e il compito della flotta è preservarli (mandato affidato a
Governance agentica). Convergenza 6/7 su OPT-C; l'unico dissenso (Critico → OPT-A) collassa
sulla stessa struttura con Fase-2 default-OFF.

Taskificazione operativa: vedi [DR-002-taskboard.md](DR-002-taskboard.md).
