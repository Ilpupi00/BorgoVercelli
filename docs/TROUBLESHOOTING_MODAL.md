# Troubleshooting Modal Prenotazione

## Problema: Mancano i campi documento e/o i bottoni

### 🔍 Diagnosi Rapida

Apri la console del browser (F12) e cerca eventuali errori JavaScript.

### ✅ Verifica Veloce

1. **Apri la pagina** `/prenotazione`
2. **Apri la console** (F12 → tab Console)
3. **Clicca "Prenota"** su un campo
4. **Controlla la console** - dovresti vedere:
   ```
   Modal HTML creato e aggiunto al DOM
   Footer presente: true
   Numero bottoni: 2
   Campi documento: 2
   Modal elementi: {tipoDocSelect: true, cfGroup: true, ...}
   ```

### 🐛 Se i campi documento non si vedono

**CAUSA:** I campi CF e Numero Documento sono **nascosti di default** finché non selezioni il tipo.

**SOLUZIONE:**
1. Nel modal, trova il menu a tendina "Tipo di Documento"
2. Seleziona "Codice Fiscale" → apparirà il campo CF
3. Oppure seleziona "Documento di Identità" → apparirà il campo per il numero documento

Questo è **comportamento corretto** - i campi appaiono solo quando scegli il tipo!

### 🐛 Se i bottoni non si vedono

#### Possibile causa 1: Conflitto CSS

Apri la console e digita:
```javascript
const footer = document.querySelector('#modalPrenotazioneCampo .modal-footer');
if (footer) {
    console.log('Display:', window.getComputedStyle(footer).display);
    console.log('Visibility:', window.getComputedStyle(footer).visibility);
}
```

Se `display` è `none`, c'è un conflitto CSS.

**SOLUZIONE:** Il JavaScript ora forza `display: flex` sul footer.

#### Possibile causa 2: Modal troncato

Il modal potrebbe essere tagliato dallo scroll.

**SOLUZIONE:** Scrolla in basso nel modal - i bottoni dovrebbero essere in fondo.

#### Possibile causa 3: Bootstrap non caricato

Verifica che Bootstrap sia caricato:
```javascript
console.log('Bootstrap:', typeof bootstrap !== 'undefined');
```

### 🧪 Script di Test Completo

Copia e incolla nella console del browser (dopo aver cliccato "Prenota"):

```javascript
// Incolla il contenuto di scripts/test-modal-prenotazione-browser.js
```

Oppure carica direttamente:
```html
<script src="/scripts/test-modal-prenotazione-browser.js"></script>
```

### 🔧 Fix Manuale Temporaneo

Se i bottoni continuano a non vedersi, apri la console e digita:

```javascript
// Fix footer invisibile
const footer = document.querySelector('#modalPrenotazioneCampo .modal-footer');
if (footer) {
    footer.style.display = 'flex !important';
    footer.style.visibility = 'visible !important';
    footer.style.opacity = '1 !important';
    console.log('✅ Footer forzato visibile');
}

// Mostra campi documento per test
const cfGroup = document.querySelector('#codiceFiscaleGroup');
const numDocGroup = document.querySelector('#numeroDocumentoGroup');
if (cfGroup) {
    cfGroup.style.display = 'block';
    console.log('✅ Campo CF mostrato');
}
if (numDocGroup) {
    numDocGroup.style.display = 'block';
    console.log('✅ Campo numero documento mostrato');
}
```

### 📸 Screenshot Aspettato

Il modal dovrebbe mostrare:

```
┌─────────────────────────────────────────┐
│ 📅 Prenota il campo: Campo Calcio    [X]│ ← Header blu
├─────────────────────────────────────────┤
│                                         │
│ 🕐 Data e Orario                        │
│   [Data] [Orario]                       │
│                                         │
│ ──────────────────────────────────────  │
│                                         │
│ 📞 Dati di Contatto                     │
│   [Telefono*]                           │
│                                         │
│ ──────────────────────────────────────  │
│                                         │
│ 🪪 Documento di Identità                │
│   [Tipo Documento ▼]                    │
│   (qui appare campo CF o NumDoc)        │ ← Nascosti finché non selezioni tipo
│                                         │
│ ──────────────────────────────────────  │
│                                         │
│ 💬 Note Aggiuntive                      │
│   [Note...]                             │
│                                         │
├─────────────────────────────────────────┤
│                [Annulla] [Conferma ✓]   │ ← Footer con bottoni
└─────────────────────────────────────────┘
```

### 🔍 Controllo File Modificati

Verifica che questi file siano stati aggiornati correttamente:

1. **modalPrenotazione.js**
   ```bash
   # Deve contenere il nuovo HTML con footer
   grep -n "modal-footer" src/public/assets/scripts/utils/modalPrenotazione.js
   ```

2. **modalPrenotazione.css**
   ```bash
   # Deve esistere
   ls -la src/public/assets/styles/modalPrenotazione.css
   ```

3. **prenotazione.ejs**
   ```bash
   # Deve includere il CSS
   grep "modalPrenotazione.css" src/features/prenotazioni/views/prenotazione.ejs
   ```

### 🚀 Riavvio Server

Se hai modificato i file, riavvia il server:

```powershell
# Ctrl+C per fermare
npm start
```

Poi ricarica la pagina nel browser con **Ctrl+Shift+R** (hard reload).

### 📞 Debug Avanzato

Se il problema persiste:

1. **Apri DevTools** (F12)
2. **Tab Elements**
3. **Cerca** `modalPrenotazioneCampo`
4. **Ispeziona** la struttura HTML
5. **Tab Computed** → verifica gli stili applicati al footer

### ✉️ Segnala Bug

Se dopo tutti questi controlli il problema persiste, raccogli:

1. Screenshot del modal
2. Console errors (se presenti)
3. Output dello script di test
4. Browser e versione

---

## ✅ Checklist

- [ ] Modal si apre cliccando "Prenota"
- [ ] Header blu visibile con titolo campo
- [ ] Campo Data presente
- [ ] Campo Orario presente
- [ ] Campo Telefono presente
- [ ] Menu "Tipo Documento" presente
- [ ] Selezionando "CF" appare campo Codice Fiscale
- [ ] Selezionando "ID" appare campo Numero Documento
- [ ] Campo Note presente
- [ ] **Bottone "Annulla" visibile in basso**
- [ ] **Bottone "Conferma Prenotazione" visibile in basso**
- [ ] Console non mostra errori JavaScript

Se tutti i checkbox sono spuntati, il sistema funziona correttamente! ✅
