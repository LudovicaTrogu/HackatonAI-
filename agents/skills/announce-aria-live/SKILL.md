---
name: announce-aria-live
description: >
  Annuncia un testo a uno screen reader tramite una regione ARIA live, senza mai spostare il focus
  e con chiusura via Esc. Usala quando devi mostrare un messaggio (esito, suggerimento, conteggio,
  errore) a un utente che naviga da tastiera con screen reader e NON vuoi rubargli il focus dal
  punto in cui si trova. Modulo ES puro, zero dipendenze, nessun build step, portabile in qualunque
  pagina o content script.
---

# announce-aria-live

Skill riutilizzabile estratta e generalizzata dalla logica di annuncio di `content.js` del progetto
**Accanto** (estensione MV3 di accessibilità). Impacchetta `announce(text, { politeness })` in un
modulo generico: **nessun** aggancio al modulo demo, ai nomi di classe di Accanto, a `chrome.*` o a
`lib/*`.

## Perché esiste

Un output pensato per uno screen reader deve essere annunciato **da solo** quando cambia, e **non**
deve spostare il focus dell'utente: chi naviga da tastiera perderebbe il punto in cui stava
lavorando. Questa skill incapsula quel pattern in modo corretto e riutilizzabile.

Garanzie (equivalenti generici dell'invariante INV-7 di Accanto):

1. L'output vive in una regione `role="status"` (polite) o `role="alert"` (assertive) con
   `aria-live`, così lo screen reader la annuncia automaticamente al cambio di testo.
2. La regione si chiude con **Esc**.
3. Il modulo **non chiama mai** `.focus()` né `.select()`: verificabile per analisi statica e con un
   self-check a runtime che confronta `document.activeElement` prima/dopo l'annuncio ed emette un
   `console.warn` esplicito su ogni divergenza.

## Interfaccia

Import (path relativo alla posizione del modulo):

```js
import { announce, clear, createAnnouncer } from "./announce-aria-live.js";
```

### `announce(text, opts?) → HTMLElement`

API comoda con un'unica regione live per pagina (annunciatore singleton sul `document` globale).

| Parametro          | Tipo                          | Default    | Descrizione                                      |
|--------------------|-------------------------------|------------|--------------------------------------------------|
| `text`             | `string`                      | —          | Testo da annunciare (inserito come `textContent`).|
| `opts.politeness`  | `"polite"` \| `"assertive"`   | `"polite"` | `polite` → `role=status`; `assertive` → `role=alert`. |

Ritorna la regione live (`HTMLElement`).

### `clear() → void`

Svuota e nasconde la regione dell'annunciatore singleton (equivalente alla pressione di Esc).

### `createAnnouncer(options?) → { announce, clear, destroy, getRegion }`

Crea un annunciatore indipendente. Utile per più regioni distinte, per un `document` diverso da
quello globale (test o iframe), o per controllare il ciclo di vita.

| Opzione            | Tipo       | Default                | Descrizione                                    |
|--------------------|------------|------------------------|------------------------------------------------|
| `document`         | `Document` | `document` globale     | Documento su cui operare (rende il modulo testabile fuori dal browser). |
| `regionId`         | `string`   | `"aria-live-announcer"`| `id` della regione live.                       |
| `regionClassName`  | `string`   | `"aria-live-announcer"`| Classe CSS della regione live.                 |
| `closeOnEscape`    | `boolean`  | `true`                 | Se `true`, Esc chiude la regione.              |

`announce(text, { politeness })` ha la stessa firma di sopra. `destroy()` rimuove regione e listener
Esc. `getRegion()` ritorna la regione corrente o `null`.

## Esempio

```js
import { announce } from "./announce-aria-live.js";

// L'utente ha il focus su un campo e preme una scorciatoia: annuncia SENZA spostare il focus.
document.addEventListener("keydown", (e) => {
  if (e.altKey && e.key.toLowerCase() === "a") {
    e.preventDefault();
    announce("Questo campo chiede la tua classe di invalidità.", { politeness: "polite" });
    // Il focus resta dov'era: l'utente continua a digitare.
  }
});
```

Regione live multipla / assertiva:

```js
import { createAnnouncer } from "./announce-aria-live.js";

const ricerca = createAnnouncer({ regionId: "ricerca-annunci" });
ricerca.announce("3 risultati trovati.", { politeness: "assertive" }); // role=alert
```

## Prova su 2 pagine

### A) Fixture apribili nel browser (verifica con screen reader)

Due pagine con struttura DOM diversa, entrambe generiche (nessun aggancio ad Accanto):

- `fixtures/pagina-1-modulo.html` — form multi-campo; con il focus in un campo premi
  **Alt+A** → annuncio polite; il focus resta nel campo (continua a digitare); **Esc** chiude.
- `fixtures/pagina-2-ricerca.html` — barra di ricerca; scrivi e premi **Invio** → annuncio
  assertivo del numero di risultati; il focus resta nella casella; **Esc** chiude.

Gli `import` usano un path relativo, quindi funzionano anche aprendo i file da `file://` in Chrome/
Edge. Ogni fixture mostra un box "Focus attuale" e stampa in console `focus invariato dopo
announce: true`. Per la prova reale, attiva uno screen reader (NVDA, oppure Narrator con
`Win + Ctrl + Invio`) e verifica che l'annuncio venga letto senza che il cursore lasci il campo.

### B) Verifica programmatica (zero dipendenze)

`test/verify.mjs` esercita la skill su due `document`-stub diversi (senza jsdom, per rispettare la
portabilità) con il test runner nativo di Node:

```
cd skills/announce-aria-live
node --test
```

Output atteso (verificato):

```
# tests 3
# pass 3
# fail 0
```

I test provano, su due pagine: regione creata con `role`/`aria-live` corretti; testo presente
nella regione (annuncio presente); `activeElement` invariato prima/dopo l'annuncio (focus fermo);
Esc svuota/nasconde la regione; `assertive` → `role=alert`. Un quarto controllo statico verifica
che il sorgente non contenga `.focus(` né `.select(`.

## Come garantisce il non-furto di focus

- **Costruttivamente**: il modulo tocca il DOM solo con `createElement`/`appendChild`/
  `setAttribute`/`textContent`/`hidden` — operazioni che non spostano il focus — e non chiama mai
  `.focus()`/`.select()`/`.click()` su alcun elemento.
- **A runtime**: `announce()` legge `document.activeElement` prima di toccare il DOM e lo ricontrolla
  subito dopo; su divergenza emette un `console.warn` (mai silenzioso).
- **In test**: `test/verify.mjs` asserisce `activeElement` invariato + assenza statica di `.focus(`/
  `.select(`.

## Portabilità

UTF-8 senza BOM · nessuna dipendenza npm · nessun build step · path-agnostico (import relativi) ·
`document` iniettabile. Testabile con `node --test`, senza `npm install`.
