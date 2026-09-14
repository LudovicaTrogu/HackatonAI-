// options.js — Configurazione LATO TEAM (API key + provider). Non è il flusso di Marco.
//
// Contratto storage (congelato da TK-003.2, letto da background.js):
//   chrome.storage.local → { apiKey: string, provider: string }
// Le chiavi sono esattamente `apiKey` e `provider`, non annidate: non rinominarle.
//
// INV-1: la chiave vive solo in chrome.storage.local e viene usata solo nel service worker.
//        Qui non viene mai copiata in localStorage, in un cookie o in un log.
// INV-2: nessuna fetch da questa pagina. Nessun "test della chiave".
// INV-8: nessuna libreria, nessun framework. JS puro.

const PROVIDER_DEFAULT = "anthropic";
const PROVIDER_AMMESSI = ["anthropic", "openai"];

const form = document.getElementById("form-opzioni");
const campoApiKey = document.getElementById("api-key");
const campoProvider = document.getElementById("provider");
const stato = document.getElementById("stato-salvataggio");

/**
 * Scrive un messaggio nella regione live (role="status" / aria-live="polite").
 * Azzera prima il contenuto così che uno screen reader riannunci anche un messaggio
 * identico al precedente (es. due salvataggi di fila).
 * @param {string} messaggio
 * @param {"ok"|"errore"} tipo
 */
function annuncia(messaggio, tipo) {
  stato.textContent = "";
  stato.className = tipo;
  window.setTimeout(() => {
    stato.textContent = messaggio;
  }, 60);
}

/**
 * Normalizza il provider letto da storage a uno dei valori ammessi.
 * @param {unknown} valore
 * @returns {string}
 */
function normalizzaProvider(valore) {
  return PROVIDER_AMMESSI.includes(valore) ? valore : PROVIDER_DEFAULT;
}

/** Ricarica i valori salvati in chrome.storage.local dentro il form. */
function caricaImpostazioni() {
  chrome.storage.local.get({ apiKey: "", provider: PROVIDER_DEFAULT }, (valori) => {
    if (chrome.runtime.lastError) {
      annuncia("Impossibile leggere le impostazioni salvate.", "errore");
      return;
    }
    campoApiKey.value = typeof valori.apiKey === "string" ? valori.apiKey : "";
    campoProvider.value = normalizzaProvider(valori.provider);
  });
}

/** Salva i valori del form in chrome.storage.local. */
function salvaImpostazioni(evento) {
  evento.preventDefault();

  const apiKey = campoApiKey.value.trim();
  const provider = normalizzaProvider(campoProvider.value);

  chrome.storage.local.set({ apiKey, provider }, () => {
    if (chrome.runtime.lastError) {
      annuncia("Salvataggio non riuscito. Riprova.", "errore");
      return;
    }
    if (apiKey === "") {
      annuncia("Impostazioni salvate. Attenzione: nessuna chiave API impostata.", "errore");
    } else {
      annuncia("Impostazioni salvate.", "ok");
    }
  });
}

// Lo script è caricato in fondo al <body>: il DOM del form esiste già qui.
form.addEventListener("submit", salvaImpostazioni);
caricaImpostazioni();
