---
decision_id: DR-003
mode: analisi e decisione (modello documentale)
depth: standard (6 reviewer, 3 round)
status: ACCEPTED_WITH_CONDITIONS
session_state: CLOSED
decision_owner: Alessandro Musio
date: 2026-09-14
supersedes: null
---

# DR-003 — Modello di gestione documentale (indice + progressive disclosure)

## Domanda

Quale modello di gestione documentale adottare — generalizzabile ad altri progetti, con Accanto
(questo repo) come caso concreto — per evitare che un agente ignori o alluciní contenuto
documentale, adottando un indice con sommari brevi e progressive disclosure per tutto ciò che non
sia una regola/vincolo sempre vincolante?

## Diagnosi

`CLAUDE.md` referenziava solo `VISION.md`; `VISION.md` referenziava solo DR-001.
`DR-002-decisione-flotta-agenti.md` e `DR-002-taskboard.md` non erano raggiungibili da nessun file
a caricamento automatico: orfani, non per ipotesi ma di fatto. Un terzo documento
(`DR-002-execution-index.md`) è comparso durante la stessa deliberazione, confermando il problema
in tempo reale.

Fatto architetturale verificato: solo `CLAUDE.md` di progetto e le istruzioni globali utente sono
iniettati automaticamente in ogni sessione. Ogni altro file — inclusi tutti i documenti in `docs/`,
incluso un eventuale file-indice separato — viene letto solo se un tool di lettura è invocato
esplicitamente. Non esiste retrieval "pull" automatico.

## Decisione

**Indice-puntatore inline in `CLAUDE.md` + progressive disclosure**, in forma vincolata (non un
generico "sommario"):

1. L'indice vive **inline in CLAUDE.md** (unico file a caricamento garantito), mai in un file
   separato.
2. Ogni riga d'indice è un **puntatore** (percorso, tipo, quando leggerlo), **mai** un sommario che
   parafrasa contenuto normativo: un sommario descrittivo può sostituirsi silenziosamente alla
   lettura della fonte e diventare esso stesso causa di divergenza.
3. Le regole sempre-vincolanti (INV-1..INV-10) hanno ora ID stabili **inline in CLAUDE.md**, alla
   fonte dove già vivevano (Regola numero uno, Confini di sicurezza, Stack e vincoli tecnici);
   DR-002 le referenzia per ID e non le ridefinisce.
4. I subagenti della flotta DR-002 continuano a ricevere il contesto vincolante per **iniezione
   esplicita** (BLOCCO-CONTESTO del taskboard) — l'indice non li serve e non li sostituisce.
5. Rollout a due livelli: lo strato economico (indice + ID + regola di manutenzione) è applicato
   subito da questa stessa decisione; lo strato costoso (tooling automatico anti-drift) è
   **rimandato** e registrato come voce DEFERRED nell'indice stesso.
6. `OPT-D` (adottare la tassonomia wiki trovata in una cartella sorella del progetto) è stata
   scartata: quello scaffold è vuoto/template, di origine e finalità non note, fuori da un repo Git.

## Motivazioni

- La scoperta mancata di documenti esistenti (non ipotetica: già accaduta due volte in questo
  stesso repo) è risolta strutturalmente da un indice sempre-caricato.
- Il rischio opposto — che un sommario diventi una terza rappresentazione divergente dei vincoli,
  più pericolosa di un link nudo perché non intercettabile con un diff meccanico — è neutralizzato
  vietando ogni contenuto normativo nelle righe d'indice (puntatore, non parafrasi).
- La divergenza pre-esistente tra "Confini di sicurezza" di CLAUDE.md e gli INV-1..10 di DR-002 è
  stata chiusa dando ID stabili a entrambe le rappresentazioni, senza spostare né riformulare il
  testo di nessuna delle due fonti (nessuna riapertura del merito di DR-002).
- Costo stimato ~40-65 minuti una tantum, proporzionato a un team di 2 in hackathon; la regola di
  manutenzione futura è a costo quasi zero.

## Alternative scartate

- **Status quo:** nessuna mitigazione; il fallimento già osservato si sarebbe ripetuto per ogni
  documento futuro.
- **Fix minimo (solo aggiungere i link mancanti):** risolve il debito attuale ma non instaura un
  processo per i documenti futuri; il differenziale di costo verso l'indice-puntatore (~25-65 min)
  non giustificava rinunciare alla garanzia strutturale.
- **Wiki strutturata con tassonomia frontmatter:** avrebbe richiesto validare un'intera tassonomia
  non provata sotto vincolo di tempo hackathon, sopra uno scaffold di origine ignota.

## Condizioni

- Righe d'indice = puntatore puro (percorso, tipo, trigger di contesto), mai un valore o una
  riformulazione di un vincolo.
- Chi crea o modifica un documento in `docs/` aggiorna la riga d'indice in `CLAUDE.md` nello stesso
  commit.
- Verifica comportamentale (smoke-test): eseguire, quando possibile, poche domande-sonda la cui
  risposta sta solo in un documento raggiungibile via indice, per confermare che l'apertura
  effettiva avvenga e non solo la conoscenza dell'esistenza del documento. Se il test mostra
  che il modello si accontenta del solo indice: spostare quel contenuto a inline/iniezione, non
  aggiungere altri avvertimenti testuali.
- Re-audit dell'indice e della mappatura INV-* a ogni nuova decisione DR-* ratificata.

## Cosa cambierebbe la decisione

- Se il corpus di `docs/` crescesse molto oltre gli attuali ~5 file, rivalutare l'indice inline a
  favore di un file dedicato.
- Se emergesse che l'indice inline non è davvero caricato automaticamente in un host diverso da
  quello verificato qui, l'intero impianto andrebbe rivisto per quell'host.
- Se una riconciliazione futura tra CLAUDE.md e un DR-* rivelasse un disaccordo sostanziale (non
  di solo formato), è un blocker reale da segnalare, non da risolvere silenziosamente.

## Validazione eseguita (C5 — smoke-test comportamentale)

Eseguito il 2026-09-14 in una sessione nuova (contesto pulito, solo `CLAUDE.md` auto-caricato), 5
domande-sonda la cui risposta stava solo dietro l'indice, più una domanda-trappola senza risposta
in nessun documento. **Esito: 5/5**, soglia superata (richiesta ≥4/5):

1. Stato/dipendenze di TK-004.2 → corretto, da `docs/DR-002-execution-index.md`.
2. Perimetro vietato del subagente TK-004.2 → corretto, da `docs/DR-002-taskboard.md`.
3. Motivazione di scarto di OPT-C in DR-001 → corretto, da `docs/DR-001-decisione-scope-architettura.md`.
4. **Domanda-trappola** (provider LLM scelto) → corretto: ha dichiarato esplicitamente che non è
   specificato da nessuna parte, senza inventare un provider. È il test diretto anti-confabulazione
   ed è quello che contava di più.
5. Numero e sede degli invarianti INV-1..10 → corretto, da `CLAUDE.md` (righe 34-73).

In tutti i casi l'agente ha dichiarato il file e la riga aperti, confermando che l'indice porta
all'apertura effettiva del documento e non a una risposta "a occhio" dal solo sommario. Nessuna
condizione ulteriore emersa da questo test; il modello è considerato validato per Accanto.

## Ancora aperto

- Origine e finalità dello scaffold "llm-wiki" trovato in una cartella sorella del progetto: non
  rilevante per questa decisione (opzione scartata), rivalutabile separatamente.
- Se questo modello verrà effettivamente riusato su un secondo progetto: condiziona se e quando
  costruire lo strato "livello 2" (tooling automatico), oggi solo annotato come DEFERRED.

## Nota di processo

Panel di 6 reviewer (Analista dei requisiti, Ingegnere AI/LLM, Ingegnere della qualità della
conoscenza, Revisore della governance della conoscenza e della memoria, Ingegnere senior, Critico),
3 round completi (nessuna uscita anticipata: un conflitto materiale reale emerso al Round 1 lo
escludeva). Il Critico ha aperto in disaccordo (fix minimo, non indice) e si è spostato in Round 2
dopo che una verifica diretta del meccanismo di caricamento del contesto (solo CLAUDE.md è
auto-iniettato) ha chiarito che un link nudo non è più sicuro di un puntatore d'indice ben
vincolato. Nessun blocker fatale residuo dichiarato da alcun reviewer al Round 3. Esclusi dal panel
di base, con motivo: Architetto di sistema (l'architettura del codice è già chiusa da DR-001/DR-002
e non va ridiscussa), Architetto dei test (nessun comportamento software da verificare con criteri
Given/When/Then), Voce dell'utente (non è in gioco un'esperienza utente finale di Accanto ma un
processo di lavoro interno).
