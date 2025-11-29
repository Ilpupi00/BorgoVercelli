# Sistema Modifica Prenotazioni - Admin e User

## 📋 Overview
Sistema completo per la gestione e modifica delle prenotazioni con comportamenti differenziati per amministratori e utenti standard.

## 🎯 Funzionalità Implementate

### 1. **Visualizzazione Prenotazioni nel Gestore Utenti**
**File**: `Gestore_utenti.js` - `visualizzaUtente()`

#### Caratteristiche:
- ✅ Carica automaticamente tutte le prenotazioni dell'utente
- ✅ Mostra tabella completa con:
  - Campo prenotato
  - Data e orario (inizio - fine)
  - Stato con badge colorato (In Attesa, Confermata, Annullata, Completata, Scaduta)
  - Telefono di contatto
  - Documento identità (CF o ID) se presente
  - Pulsante "Modifica" per ogni prenotazione
- ✅ Tabella scrollabile (max-height: 400px)
- ✅ Header sticky per la tabella
- ✅ Messaggio "Nessuna prenotazione" se vuoto

#### Endpoint Utilizzato:
```javascript
GET /api/prenotazioni/user/:userId
```

---

### 2. **Modal Modifica Prenotazione Admin**
**File**: `Gestore_Utenti.ejs` - Modal `modificaPrenotazioneModal`

#### Campi del Form:
- 🏟️ **Campo** (select dropdown)
- 📅 **Data** (date picker)
- ⏰ **Ora Inizio** (time picker)
- ⏰ **Ora Fine** (time picker)
- 📱 **Telefono** (required, pattern validation)
- 📄 **Tipo Documento** (dropdown: Nessuno/CF/ID)
- 🆔 **Codice Fiscale** (mostrato se tipo=CF, 16 caratteri)
- 🪪 **Numero Documento** (mostrato se tipo=ID, min 5 caratteri)
- 📝 **Note** (textarea opzionale)

#### Validazioni Client-Side:
- Telefono: Pattern `^\+39\s?[0-9]{9,10}$`
- Auto-normalizzazione: aggiunge `+39` se mancante
- Rimozione caratteri non validi in tempo reale
- Toggle dinamico campi CF/ID in base a selezione
- Uppercase automatico per CF e ID

#### Alert Informativi:
- 🔵 **Info**: "Come amministratore, puoi modificare tutti i campi senza cambiare lo stato"
- 🟡 **Warning**: "L'utente riceverà una notifica della modifica"

---

### 3. **Logica Modifica Admin**
**File**: `Gestore_utenti.js` - `modificaPrenotazioneAdmin()` e `salvaModificaPrenotazioneAdmin()`

#### Flusso Operativo:

**Step 1 - Caricamento Dati** (`modificaPrenotazioneAdmin`):
```javascript
1. Fetch prenotazione esistente: GET /api/prenotazioni/:id
2. Fetch lista campi disponibili: GET /api/prenotazioni/campi
3. Popola select campi con opzione corrente selezionata
4. Popola tutti i campi del form con dati esistenti
5. Gestisce tipo documento (trigger change event per mostrare campi)
6. Mostra modal Bootstrap
```

**Step 2 - Salvataggio** (`salvaModificaPrenotazioneAdmin`):
```javascript
1. Validazione form HTML5 (checkValidity)
2. Validazione telefono con regex JavaScript
3. Costruzione payload con flag modified_by_admin: true
4. PUT /api/prenotazioni/:id con tutti i dati
5. Chiusura modal e notifica successo
6. Ricarica automatica modal visualizza utente (aggiorna lista)
```

---

### 4. **Route Backend PUT `/prenotazioni/:id`**
**File**: `prenotazione.js` - Route PUT

#### Comportamento Differenziato:

##### 🔴 **Admin Modifica** (`isAdmin === true` o `modified_by_admin === true`):
- ✅ Modifica **TUTTI** i campi
- ✅ **NON** cambia lo stato della prenotazione
- ✅ Lo stato rimane invariato (in_attesa, confermata, ecc.)
- 📧 Notifica **solo l'utente** proprietario

##### 🟢 **User Modifica** (`isAdmin === false` e `modified_by_admin === false`):
- ✅ Modifica tutti i campi
- ⚠️ **Se stato era "confermata"** → torna automaticamente a **"in_attesa"**
- ⚠️ Richiede **nuova approvazione** dall'admin
- 📧 Notifica **admin** (richiesta approvazione) + **utente** (conferma modifica)

#### Validazioni Server-Side:

**Telefono**:
```javascript
// Obbligatorio
if (!telefono || telefono.trim().length === 0) {
    return 400 - "Numero di telefono obbligatorio"
}

// Pattern validation
const phoneRegex = /^\+39\s?[0-9]{9,10}$/;
if (!phoneRegex.test(telefono.trim())) {
    return 400 - "Formato telefono non valido"
}
```

**Documento Identità**:
```javascript
// Tipo documento: solo 'CF' o 'ID'
if (tipo_documento && tipo_documento !== 'CF' && tipo_documento !== 'ID') {
    return 400 - "Tipo documento non valido"
}

// Se CF: 16 caratteri + pattern italiano
if (tipo_documento === 'CF') {
    if (codice_fiscale.length !== 16) return 400
    const cfPattern = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
    if (!cfPattern.test(codice_fiscale)) return 400
}

// Se ID: minimo 5 caratteri
if (tipo_documento === 'ID') {
    if (numero_documento.length < 5) return 400
}
```

---

### 5. **Sistema Notifiche Push**

#### 📨 **Admin Modifica Prenotazione**:
```javascript
// Notifica all'utente
{
  title: '✏️ Prenotazione Modificata',
  body: 'L\'amministratore ha modificato la tua prenotazione: [Campo] - [Data] [Ora]',
  url: '/users/mie-prenotazioni',
  tag: 'prenotazione-[ID]-modified-admin',
  requireInteraction: true
}
```

#### 📨 **User Modifica Prenotazione (Confermata → In Attesa)**:

**Notifica agli Admin**:
```javascript
{
  title: '🔄 Prenotazione Modificata - Richiesta Approvazione',
  body: 'Utente ha modificato prenotazione (torna in attesa): [Campo] - [Data] [Ora]',
  url: '/admin/prenotazioni',
  tag: 'prenotazione-[ID]-modified-user',
  requireInteraction: true
}
```

**Notifica all'Utente (conferma)**:
```javascript
{
  title: '⏳ Prenotazione In Attesa di Approvazione',
  body: 'La tua modifica è stata salvata. La prenotazione è tornata in attesa di conferma: [Campo] - [Data] [Ora]',
  url: '/users/mie-prenotazioni',
  tag: 'prenotazione-[ID]-modified-user-confirm'
}
```

---

## 🔐 Autorizzazioni e Sicurezza

### Middleware Applicati:
- ✅ `isLoggedIn` - Richiede autenticazione per PUT
- ✅ Verifica `tipo_utente_id === 1` per privilegi admin

### Flag `modified_by_admin`:
- Inviato dal frontend quando l'admin modifica
- Garantisce che lo stato non cambi anche se l'utente loggato non ha tipo_utente_id=1
- Doppia verifica: `isAdmin || modified_by_admin`

---

## 📊 Flussi Completi

### Flusso Admin:
```
1. Admin apre Gestore Utenti
2. Clicca "Visualizza" su un utente
3. Vede tabella con tutte le prenotazioni
4. Clicca "Modifica" su una prenotazione
5. Modal si apre con dati pre-popolati
6. Admin modifica campi (es: telefono, data, ora)
7. Clicca "Salva Modifiche"
8. Backend: aggiorna prenotazione SENZA cambio stato
9. Notifica push inviata all'utente
10. Modal si chiude e lista prenotazioni si aggiorna
```

### Flusso User (da implementare in area utente):
```
1. User vede le proprie prenotazioni
2. Clicca "Modifica" su prenotazione confermata
3. Modal si apre (simile a quello admin)
4. User modifica campi
5. Clicca "Salva"
6. Backend: se era confermata → torna in_attesa
7. Notifica push agli admin (richiesta approvazione)
8. Notifica push all'utente (conferma modifica)
9. Modal si chiude con messaggio "La prenotazione è tornata in attesa"
```

---

## 🧪 Test Consigliati

### Test Admin:
- [ ] Visualizza utente con 0 prenotazioni → mostra "Nessuna prenotazione"
- [ ] Visualizza utente con N prenotazioni → mostra tabella scrollabile
- [ ] Modifica prenotazione in_attesa → stato rimane in_attesa
- [ ] Modifica prenotazione confermata → stato rimane confermata
- [ ] Inserisce telefono senza +39 → auto-normalizza
- [ ] Inserisce CF valido → salva correttamente
- [ ] Inserisce ID valido → salva correttamente
- [ ] Utente riceve notifica push della modifica admin

### Test User (futuro):
- [ ] Modifica prenotazione in_attesa → stato rimane in_attesa
- [ ] Modifica prenotazione confermata → stato diventa in_attesa
- [ ] Admin riceve notifica push richiesta approvazione
- [ ] User riceve notifica conferma modifica
- [ ] Validazione telefono funziona correttamente

---

## 📁 File Modificati

### Frontend:
1. **`Gestore_utenti.js`**:
   - `visualizzaUtente()` - Carica e mostra prenotazioni
   - `modificaPrenotazioneAdmin()` - Apre modal con dati
   - `salvaModificaPrenotazioneAdmin()` - Salva modifiche

2. **`Gestore_Utenti.ejs`**:
   - Modal `modificaPrenotazioneModal` con form completo
   - Script inline per toggle tipo documento e validazione telefono

### Backend:
3. **`prenotazione.js`**:
   - Route `PUT /prenotazioni/:id` completamente riscritta:
     - Aggiunto `isLoggedIn` middleware
     - Validazione telefono pattern
     - Validazione documenti CF/ID
     - Logica differenziata admin/user
     - Sistema notifiche push per entrambi i casi
     - Gestione cambio stato automatico per user

---

## 🎨 UX/UI Highlights

### Badge Stato Prenotazione:
- 🟡 **In Attesa**: `badge bg-warning`
- 🟢 **Confermata**: `badge bg-success`
- 🔴 **Annullata**: `badge bg-danger`
- 🔵 **Completata**: `badge bg-info`
- ⚫ **Scaduta**: `badge bg-secondary`

### Icone Bootstrap:
- 📍 `bi-geo-alt` - Campo
- 📅 `bi-calendar` - Data
- ⏰ `bi-clock` - Orario
- 📱 `bi-telephone` - Telefono
- 📄 `bi-card-text` - Tipo Documento
- 🆔 `bi-person-vcard` - Codice Fiscale
- 🪪 `bi-credit-card` - Documento ID
- ✏️ `bi-pencil` - Modifica
- ✅ `bi-check-circle` - Conferma
- ❌ `bi-x-circle` - Annulla

---

## 🚀 Deploy e Attivazione

### Riavvio Server:
```powershell
npm start
```

### Test Manuale:
1. Login come admin
2. Vai su `/admin/gestore-utenti`
3. Clicca occhio su un utente con prenotazioni
4. Verifica tabella prenotazioni visibile
5. Clicca matita "Modifica" su una prenotazione
6. Modifica campo telefono o data
7. Salva e verifica notifica push all'utente

---

## 📝 Note Tecniche

### Compatibilità:
- Bootstrap 5.3.4
- JavaScript ES6+
- Fetch API (nativa)
- Bootstrap Modal API

### Performance:
- Lazy loading prenotazioni (caricamento solo all'apertura modal)
- Caching lista campi nel browser
- Validazione client-side per ridurre chiamate server
- Debouncing su input telefono

### Accessibilità:
- Label con icone e testo
- ARIA labels su modal
- Feedback visivo con invalid-feedback
- Keyboard navigation supportata

---

## 🔮 Future Enhancements

1. **Area Utente**:
   - Implementare stesso modal modifica in `/users/mie-prenotazioni`
   - Aggiungere alert warning "La prenotazione tornerà in attesa"
   
2. **Storico Modifiche**:
   - Tabella `prenotazioni_modifiche` con campo `modified_by`, `modified_at`, `old_values`, `new_values`
   - Mostrare cronologia modifiche nel modal visualizza
   
3. **Validazione Avanzata**:
   - Controllo conflitti orari in tempo reale
   - Suggerimenti orari alternativi
   - Verifica disponibilità campo prima del submit

4. **Notifiche Email**:
   - Inviare anche email oltre a push notification
   - Template HTML per modifiche prenotazione

---

## ✅ Checklist Completamento

- [x] Visualizzazione prenotazioni in Gestore Utenti
- [x] Modal modifica prenotazione per admin
- [x] Logica JavaScript modifica (caricamento + salvataggio)
- [x] Route PUT con validazione telefono
- [x] Route PUT con validazione documenti
- [x] Comportamento differenziato admin/user
- [x] Sistema notifiche push per admin
- [x] Sistema notifiche push per user
- [x] Cambio stato automatico user (confermata → in_attesa)
- [x] Auto-normalizzazione telefono (+39 prefix)
- [x] Toggle dinamico campi CF/ID
- [x] Documentazione completa

---

**Data Implementazione**: 29 Novembre 2025  
**Versione**: 1.0.0  
**Autore**: Sistema Borgo Vercelli - Prenotazioni
