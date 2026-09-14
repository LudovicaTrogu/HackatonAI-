---
name: extract-field-context
description: Estrae da un elemento di form il contesto accessibile (label, hint, placeholder, fieldType) come oggetto FieldContext, impostando isSensitive per campi password o di pagamento (autocomplete cc-*). Funzione pura, generica e portabile. Usare quando serve leggere in modo affidabile il "significato" di un campo di form dal DOM senza toccare i campi sensibili.
---

# extract-field-context

Skill riutilizzabile che impacchetta la logica di estrazione generica del progetto Accanto
(`lib/context.js`, TK-004.1) in un modulo autonomo, portabile e documentato.

Data una `Element` di un campo di form (input / select / textarea), restituisce un oggetto
`FieldContext` con l'etichetta, l'eventuale testo di aiuto, il placeholder e il tipo del campo.
Per i campi **sensibili** (password o dati di pagamento) NON legge né restituisce alcun testo
del campo e imposta `isSensitive = true`.

## Caratteristiche

- **Generica**: nessun selettore hardcoded, nessun aggancio a un modulo specifico. Funziona su
  qualunque form HTML semantico.
- **Portabile**: ES module puro, nessuna dipendenza a runtime, nessun build/bundler/npm, UTF-8
  senza BOM, path-agnostica.
- **Pura**: nessuna rete, nessun accesso a storage, nessun side effect.

## Interfaccia

```js
import { extractFieldContext } from "./extract-field-context.js";
// oppure: import extractFieldContext from "./extract-field-context.js";

/** @returns {FieldContext} */
const ctx = extractFieldContext(element);
```

### Input

- `element: Element` — il campo di form da descrivere (tipicamente `document.activeElement`).

### Output — `FieldContext`

| Campo         | Tipo             | Descrizione |
|---------------|------------------|-------------|
| `label`       | `string`         | Etichetta del campo. Risoluzione, in ordine: `aria-labelledby` → `aria-label` → `<label for>` / label antenata (implicita). `""` se assente o se il campo è sensibile. |
| `hint`        | `string \| null` | Testo di aiuto: `aria-describedby`, altrimenti il primo fratello successivo che sia testo semplice. `null` se assente o campo sensibile. |
| `placeholder` | `string \| null` | Attributo `placeholder` normalizzato. `null` se assente o campo sensibile. |
| `fieldType`   | `string`         | `element.type` (es. `"text"`, `"email"`, `"select-one"`, `"password"`) o il tag name in fallback. |
| `isSensitive` | `boolean`        | `true` se `type="password"` o autocomplete di pagamento (`cc-*`, `transaction-currency`, `transaction-amount`). |

### Regola di sensibilità (INV-4)

Un campo è sensibile se:

- ha `type="password"`, **oppure**
- ha un token `autocomplete` che inizia con `cc-` (es. `cc-number`, `cc-exp`, `cc-csc`) o pari a
  `transaction-currency` / `transaction-amount` (WHATWG HTML autocomplete).

Per un campo sensibile la funzione restituisce **sempre**
`{ label: "", hint: null, placeholder: null, fieldType, isSensitive: true }`:
nessun testo del campo viene letto o esposto.

## Esempio d'uso

```html
<label for="email">Indirizzo email</label>
<input id="email" type="email" placeholder="nome@esempio.it"
       aria-describedby="emailHint" />
<span id="emailHint">La useremo solo per le comunicazioni sull'ordine.</span>
```

```js
const ctx = extractFieldContext(document.getElementById("email"));
// {
//   label: "Indirizzo email",
//   hint: "La useremo solo per le comunicazioni sull'ordine.",
//   placeholder: "nome@esempio.it",
//   fieldType: "email",
//   isSensitive: false
// }
```

Campo di pagamento:

```html
<input id="card" type="text" autocomplete="cc-number" placeholder="0000 0000 0000 0000" />
```

```js
extractFieldContext(document.getElementById("card"));
// { label: "", hint: null, placeholder: null, fieldType: "text", isSensitive: true }
```

## File della skill

```
skills/extract-field-context/
  SKILL.md                        questo documento (interfaccia + esempio)
  extract-field-context.js        il modulo generico (unica dipendenza a runtime: il DOM)
  fixtures/
    checkout-form.html            2ª fixture #1 — checkout e-commerce (non-PA), copre cc-number
    login-form.html               2ª fixture #2 — login web app (non-PA), copre password
  examples/
    run-with-node.mjs             esempio eseguibile: prova la skill sulle 2 fixture in puro Node
```

## Come è stata provata

La skill gira nel DOM del browser. Per una prova riproducibile da riga di comando,
`examples/run-with-node.mjs` include un micro-DOM minimale (test-only, zero dipendenze npm) che
implementa solo le API DOM usate dalla funzione, carica le due fixture ed esegue i controlli.

```bash
node skills/extract-field-context/examples/run-with-node.mjs
```

Output atteso (sintesi): `19/19 check superati`, con `isSensitive=true` e nessun testo per il
campo `cc-number` della fixture di checkout e per il campo `password` della fixture di login;
label/hint/placeholder/fieldType corretti per i campi non sensibili di entrambe le fixture.

Uso nel browser (senza Node): aprire una qualunque delle fixture e importare il modulo, es.

```js
import { extractFieldContext } from "../extract-field-context.js";
console.log(extractFieldContext(document.querySelector('[name="password"]')));
```
