# Sistema Prenotazioni - Miglioramenti Sicurezza e Validazione

## 📋 Modifiche Implementate

### 1. ✅ Eliminazione Prenotazioni Attive/Confermate
**Problema:** Eliminare direttamente una prenotazione attiva non notificava l'annullamento.

**Soluzione:**
- La route `DELETE /prenotazioni/:id` ora verifica lo stato della prenotazione
- Se la prenotazione è `in_attesa` o `confermata`, viene automaticamente annullata prima dell'eliminazione
- Vengono inviate notifiche push appropriate:
  - Se admin elimina → notifica all'utente
  - Se utente elimina → notifica agli admin
- L'annullamento è tracciato con il campo `annullata_da` (`admin` o `user`)

**File modificati:**
- `src/features/prenotazioni/routes/prenotazione.js` → route DELETE con logica annullamento automatico

---

### 2. ✅ Validazione Data e Ora Prenotazione
**Problema:** Era possibile prenotare orari del giorno dopo usando la data di oggi, causando errori e prenotazioni non valide.

**Soluzione:**
- Validazione server-side: la prenotazione deve essere almeno **2 ore nel futuro**
- Calcolo preciso: `data_prenotazione` + `ora_inizio` deve essere ≥ `NOW() + 2 ore`
- Messaggio di errore chiaro con `minDateTime` in risposta
- Validazione lato client già esistente rafforzata

**Codice validazione (route POST):**
```javascript
const [oraH, oraM] = ora_inizio.split(':').map(Number);
const prenotazioneDate = new Date(data_prenotazione);
prenotazioneDate.setHours(oraH, oraM, 0, 0);
const now = new Date();
const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);

if (prenotazioneDate < minTime) {
    return res.status(400).json({
        error: 'Orario non valido',
        message: 'Le prenotazioni devono essere effettuate con almeno 2 ore di anticipo',
        minDateTime: minTime.toISOString()
    });
}
```

**File modificati:**
- `src/features/prenotazioni/routes/prenotazione.js` → validazione in route POST `/prenotazioni`

---

### 3. ✅ Numero di Telefono Obbligatorio
**Problema:** Le prenotazioni non avevano un modo per contattare l'utente.

**Soluzione:**
- Aggiunto campo `telefono` (VARCHAR(20)) alla tabella `PRENOTAZIONI`
- Validazione server-side: `telefono` è **obbligatorio** e non può essere vuoto
- Modal di prenotazione aggiornato con campo telefono (pattern validation)
- Pre-popolamento automatico dal profilo utente se disponibile
- Se l'utente non ha telefono in profilo, deve inserirlo manualmente nel modal

**Nuovo campo DB:**
```sql
ALTER TABLE PRENOTAZIONI 
ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);
```

**File modificati:**
- `database/migrations/add_prenotazioni_identity_fields.sql` → migration
- `src/features/prenotazioni/routes/prenotazione.js` → validazione telefono
- `src/features/prenotazioni/services/dao-prenotazione.js` → INSERT/UPDATE con telefono
- `src/public/assets/scripts/utils/modalPrenotazione.js` → UI con campo telefono

---

### 4. ✅ Dati Identità per Prevenire Account Duplicati
**Problema:** Mancavano dati per certificare l'identità dell'utente e prevenire creazione di secondi account.

**Soluzione:**
Aggiunti 3 campi **facoltativi ma consigliati** alla tabella `PRENOTAZIONI`:
1. **`codice_fiscale`** (VARCHAR(16)) → Identificazione univoca italiana
2. **`tipo_documento`** (VARCHAR(50)) → Tipo documento (Carta d'Identità, Patente, Passaporto, ecc.)
3. **`numero_documento`** (VARCHAR(50)) → Numero del documento fornito

**Nuovi campi DB:**
```sql
ALTER TABLE PRENOTAZIONI 
ADD COLUMN IF NOT EXISTS codice_fiscale VARCHAR(16);
ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(50);
ADD COLUMN IF NOT EXISTS numero_documento VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_prenotazioni_codice_fiscale ON PRENOTAZIONI(codice_fiscale);
```

**Benefici:**
- Verifica identità utente più robusta
- Prevenzione account duplicati (controllo lato admin sui codici fiscali/documenti)
- Tracciabilità completa delle prenotazioni
- Conformità normative sulla raccolta dati identificativi

**File modificati:**
- `database/migrations/add_prenotazioni_identity_fields.sql` → migration
- `src/features/prenotazioni/routes/prenotazione.js` → gestione nuovi campi
- `src/features/prenotazioni/services/dao-prenotazione.js` → INSERT/UPDATE con identità
- `src/public/assets/scripts/utils/modalPrenotazione.js` → UI con campi identità

---

## 🗂️ Struttura Tabella PRENOTAZIONI (Aggiornata)

```sql
CREATE TABLE PRENOTAZIONI (
    id SERIAL PRIMARY KEY,
    campo_id INT NOT NULL,
    utente_id INT,
    squadra_id INT,
    data_prenotazione DATE NOT NULL,
    ora_inizio TIME NOT NULL,
    ora_fine TIME NOT NULL,
    tipo_attivita VARCHAR(50),
    note TEXT,
    stato VARCHAR(20) DEFAULT 'in_attesa',
    annullata_da VARCHAR(10),  -- 'user' | 'admin' | NULL
    
    -- NUOVI CAMPI IDENTITÀ
    telefono VARCHAR(20) NOT NULL,           -- Obbligatorio
    codice_fiscale VARCHAR(16),              -- Facoltativo
    tipo_documento VARCHAR(50),              -- Facoltativo
    numero_documento VARCHAR(50),            -- Facoltativo
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (campo_id) REFERENCES CAMPI(id),
    FOREIGN KEY (utente_id) REFERENCES UTENTI(id),
    FOREIGN KEY (squadra_id) REFERENCES SQUADRE(id)
);

CREATE INDEX idx_prenotazioni_telefono ON PRENOTAZIONI(telefono);
CREATE INDEX idx_prenotazioni_codice_fiscale ON PRENOTAZIONI(codice_fiscale);
```

---

## 🎨 UI/UX Miglioramenti

### Modal Prenotazione
- **Layout:** Modal-lg per più spazio
- **Sezioni:** Diviso in 3 sezioni logiche:
  1. Data e Orario
  2. Dati Contatto e Identificazione (con intestazione e descrizione)
  3. Note
- **Campo Telefono:**
  - Input `tel` con pattern validation (`[0-9+\s\-()]+`)
  - Placeholder: `+39 123 456 7890`
  - Pre-popolato automaticamente dal profilo utente
  - Indicatore visivo asterisco rosso per campo obbligatorio
- **Campi Identità:**
  - Chiaramente marcati come "facoltativi" con `<span class="text-muted">`
  - Descrizione helper: "Consigliato per certificare la tua identità"
  - Select per tipo documento con opzioni predefinite
  - Validazione codice fiscale: 16 caratteri alfanumerici uppercase
- **Validazione Client-Side:**
  - Alert se telefono vuoto al submit
  - Pattern matching per telefono e codice fiscale
  - Focus automatico sul campo errato

### Messaggi di Errore Migliorati
- **400 - Telefono Mancante:**
  ```json
  {
    "error": "Numero di telefono obbligatorio",
    "field": "telefono",
    "message": "Devi fornire un numero di telefono per completare la prenotazione"
  }
  ```
- **400 - Orario Non Valido:**
  ```json
  {
    "error": "Orario non valido",
    "message": "Le prenotazioni devono essere effettuate con almeno 2 ore di anticipo",
    "minDateTime": "2025-11-29T16:30:00.000Z"
  }
  ```

---

## 🔍 Testing e Verifica

### Test Eliminazione Prenotazione Attiva
```bash
# 1. Crea una prenotazione confermata
POST /prenotazione/prenotazioni
{
  "campo_id": 1,
  "data_prenotazione": "2025-12-01",
  "ora_inizio": "10:00",
  "ora_fine": "11:00",
  "telefono": "+39 123 456 7890"
}

# 2. Conferma la prenotazione (admin)
PATCH /prenotazione/prenotazioni/{id}/stato
{
  "stato": "confermata"
}

# 3. Elimina la prenotazione (utente o admin)
DELETE /prenotazione/prenotazioni/{id}

# RISULTATO ATTESO:
# - Prenotazione prima annullata automaticamente
# - Notifica push inviata a utente/admin
# - Prenotazione eliminata dal DB
# - Response: { "success": true, "annullata": true, "changes": 1 }
```

### Test Validazione 2 Ore
```bash
# Test 1: Prenotazione tra 1 ora (DEVE FALLIRE)
POST /prenotazione/prenotazioni
{
  "campo_id": 1,
  "data_prenotazione": "2025-11-29",  # oggi
  "ora_inizio": "15:30",              # tra 1 ora (ora attuale: 14:30)
  "ora_fine": "16:30",
  "telefono": "+39 123 456 7890"
}
# RISULTATO: 400 - "Le prenotazioni devono essere effettuate con almeno 2 ore di anticipo"

# Test 2: Prenotazione tra 3 ore (DEVE PASSARE)
POST /prenotazione/prenotazioni
{
  "campo_id": 1,
  "data_prenotazione": "2025-11-29",  # oggi
  "ora_inizio": "17:30",              # tra 3 ore (ora attuale: 14:30)
  "ora_fine": "18:30",
  "telefono": "+39 123 456 7890"
}
# RISULTATO: 200 - Prenotazione creata con successo
```

### Test Campo Telefono
```bash
# Test 1: Senza telefono (DEVE FALLIRE)
POST /prenotazione/prenotazioni
{
  "campo_id": 1,
  "data_prenotazione": "2025-12-01",
  "ora_inizio": "10:00",
  "ora_fine": "11:00"
  # telefono mancante
}
# RISULTATO: 400 - "Numero di telefono obbligatorio"

# Test 2: Con telefono (DEVE PASSARE)
POST /prenotazione/prenotazioni
{
  "campo_id": 1,
  "data_prenotazione": "2025-12-01",
  "ora_inizio": "10:00",
  "ora_fine": "11:00",
  "telefono": "+39 123 456 7890"
}
# RISULTATO: 200 - Prenotazione creata
```

### Test Campi Identità
```bash
# Con tutti i campi identità (raccomandato)
POST /prenotazione/prenotazioni
{
  "campo_id": 1,
  "data_prenotazione": "2025-12-01",
  "ora_inizio": "10:00",
  "ora_fine": "11:00",
  "telefono": "+39 123 456 7890",
  "codice_fiscale": "RSSMRA80A01H501U",
  "tipo_documento": "Carta d'Identità",
  "numero_documento": "CA12345678"
}
# RISULTATO: 200 - Prenotazione creata con dati identità completi
```

---

## 🔧 Migration Database

### Eseguire la Migration
```bash
# Opzione 1: Esegui direttamente con psql
psql $DATABASE_URL < database/migrations/add_prenotazioni_identity_fields.sql

# Opzione 2: Tramite script Node.js (se esistente)
node scripts/run-migration.js add_prenotazioni_identity_fields

# Opzione 3: Railway CLI (se deployato su Railway)
railway run psql < database/migrations/add_prenotazioni_identity_fields.sql
```

### Verifica Migration
```sql
-- Verifica colonne aggiunte
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'prenotazioni'
  AND column_name IN ('telefono', 'codice_fiscale', 'tipo_documento', 'numero_documento');

-- Verifica indici creati
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'prenotazioni'
  AND indexname IN ('idx_prenotazioni_telefono', 'idx_prenotazioni_codice_fiscale');

-- Conta prenotazioni esistenti (devono avere telefono NULL se create prima della migration)
SELECT COUNT(*) as totale,
       COUNT(telefono) as con_telefono,
       COUNT(codice_fiscale) as con_cf
FROM prenotazioni;
```

---

## ⚠️ Breaking Changes e Retrocompatibilità

### Per Prenotazioni Esistenti
- **Telefono NULL:** Le prenotazioni create prima della migration avranno `telefono = NULL`
- **Soluzione:** Script di backfill per richiedere agli utenti di aggiornare le prenotazioni:
  ```sql
  -- Identifica prenotazioni senza telefono
  SELECT p.id, p.utente_id, u.nome, u.cognome, u.telefono as user_phone
  FROM prenotazioni p
  LEFT JOIN utenti u ON p.utente_id = u.id
  WHERE p.telefono IS NULL
    AND p.stato IN ('in_attesa', 'confermata');
  
  -- Aggiorna con telefono da profilo utente (se disponibile)
  UPDATE prenotazioni p
  SET telefono = u.telefono
  FROM utenti u
  WHERE p.utente_id = u.id
    AND p.telefono IS NULL
    AND u.telefono IS NOT NULL;
  ```

### Per Client Esistenti
- **API Request:** Client devono includere `telefono` nelle richieste POST/PUT
- **Backward Compatibility:** Le richieste senza `telefono` ricevono 400 con messaggio chiaro
- **Aggiornamento Richiesto:** Tutti i client devono essere aggiornati per includere il campo telefono

---

## 📊 Benefici Implementati

### Sicurezza
✅ Validazione robusta data/ora previene prenotazioni non valide  
✅ Dati identità rafforzano verifica utente  
✅ Tracciamento annullamenti (admin vs user)

### UX
✅ Modal chiaro e ben strutturato  
✅ Pre-popolamento automatico telefono da profilo  
✅ Messaggi di errore informativi  
✅ Validazione client-side + server-side

### Amministrazione
✅ Contatto diretto utenti tramite telefono  
✅ Verifica identità per prevenire duplicati  
✅ Notifiche push automatiche su annullamenti/eliminazioni  
✅ Dati completi per gestione prenotazioni

### Compliance
✅ Raccolta dati identificativi tracciata  
✅ Indici per query efficienti su telefono/CF  
✅ Possibilità di implementare GDPR compliance (export/delete dati)

---

## 🚀 Prossimi Passi Consigliati

1. **Deploy Migration:**
   - Eseguire migration su DB produzione
   - Backfill telefoni da profilo utenti
   - Notificare utenti con prenotazioni attive senza telefono

2. **Implementare Verifiche Admin:**
   - Dashboard admin per vedere duplicati (stesso CF/documento)
   - Alert automatici su potenziali account duplicati
   - Tool per merge/block account sospetti

3. **Estendere Validazione:**
   - Verifica formato CF italiano (regex + checksum)
   - Validazione numero documento con API esterne (opzionale)
   - Rate limiting su creazione prenotazioni (anti-spam)

4. **GDPR Compliance:**
   - Informativa privacy aggiornata per raccolta dati identità
   - Consenso esplicito per conservazione dati oltre prenotazione
   - Tool per export/cancellazione dati utente

5. **Analytics:**
   - Monitorare % prenotazioni con CF/documento forniti
   - Identificare pattern di account duplicati
   - Report mensile su utilizzo dati identità

---

## 📝 Note Tecniche

### Performance
- **Indici Creati:** `telefono`, `codice_fiscale` per query rapide
- **Impact:** Minimo - colonne VARCHAR di dimensioni contenute
- **Query Ottimizzate:** JOIN con UTENTI per backfill è efficiente

### Sicurezza Dati
- **Telefono:** Stored in plain text (considerare encryption per GDPR strict)
- **CF/Documento:** Stored in plain text, indici per ricerca duplicati
- **Access Control:** Solo admin e owner prenotazione possono vedere dati completi

### Logging
- **Eliminazioni:** Logged con `annullata_da` in DB
- **Modifiche:** Timestamp `updated_at` aggiornato automaticamente
- **Notifiche:** Push notifications per trasparenza operazioni

---

## 🐛 Troubleshooting

### "Numero di telefono obbligatorio"
**Causa:** Campo telefono vuoto o whitespace-only  
**Fix:** Assicurati che il modal invii `telefono` con valore non vuoto

### "Orario non valido" (validazione 2 ore)
**Causa:** Timestamp prenotazione < NOW() + 2h  
**Fix:** Seleziona orario almeno 2 ore nel futuro; verifica timezone server/client

### Pre-popolamento telefono non funziona
**Causa:** Utente non ha `telefono` nel profilo  
**Fix:** Aggiungi campo telefono al profilo utente (tabella UTENTI); utente deve inserire manualmente

### Migration fallisce (telefono NOT NULL)
**Causa:** Colonna NOT NULL su tabella con dati esistenti  
**Fix:** Migration usa `IF NOT EXISTS` e colonna inizialmente nullable; aggiornare script se necessario:
```sql
ALTER TABLE PRENOTAZIONI ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);
-- Poi backfill e poi:
-- ALTER TABLE PRENOTAZIONI ALTER COLUMN telefono SET NOT NULL;
```

---

## 📚 Riferimenti

- **File Migration:** `database/migrations/add_prenotazioni_identity_fields.sql`
- **Route Prenotazioni:** `src/features/prenotazioni/routes/prenotazione.js`
- **DAO Prenotazioni:** `src/features/prenotazioni/services/dao-prenotazione.js`
- **Modal UI:** `src/public/assets/scripts/utils/modalPrenotazione.js`
- **Componente Prenotazione:** `src/public/assets/scripts/components/Prenotazione.js`
