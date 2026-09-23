# Guida Rapida: Test Sistema Orari Personalizzati

## 1. Setup Database

```bash
# Connettiti al database
psql -U your_username -d borgo_vercelli

# Esegui la migration
\i database/migrations/add_exclusion_constraint.sql

# Verifica che sia andato a buon fine
\d+ prenotazioni
# Dovresti vedere le colonne inizio_timestamp e fine_timestamp

# Verifica il constraint
\d prenotazioni
# Dovresti vedere "prenotazioni_no_overlap" EXCLUDE USING gist
```

## 2. Test Rapido via UI

### Test 1: Prenotazione orario custom valido ✅

1. Apri `http://localhost:3000/prenotazione`
2. Clicca "Prenota ora" su un campo
3. Seleziona data: **domani**
4. Clicca link "inserisci un orario personalizzato"
5. Inserisci:
   - Ora Inizio: `15:00`
   - Ora Fine: `16:30`
6. Compila telefono (es: `+39 3331234567`)
7. Clicca "Conferma Prenotazione"
8. **Risultato atteso:** ✅ "Prenotazione in attesa di approvazione"

### Test 2: Tentativo duplicato esatto ❌

1. Ripeti Test 1 con **stessi orari** (15:00-16:30)
2. **Risultato atteso:** ❌ "Orario già prenotato (duplicato esatto)"

### Test 3: Sovrapposizione parziale ❌

1. Prenota ora: apri modal
2. Inserisci orario custom:
   - Ora Inizio: `15:30` (sovrappone 15:00-16:30 esistente)
   - Ora Fine: `17:00`
3. **Risultato atteso:** ❌ "Orario si sovrappone a una prenotazione esistente"

### Test 4: Orari adiacenti (OK) ✅

1. Inserisci orario custom:
   - Ora Inizio: `16:30` (fine del precedente)
   - Ora Fine: `18:00`
2. **Risultato atteso:** ✅ Prenotazione creata (gli adiacenti sono OK)

### Test 5: Anticipo insufficiente ❌

1. Seleziona data: **oggi**
2. Inserisci orario tra 1 ora
3. **Risultato atteso:** ❌ "Devi prenotare con almeno 2 ore di anticipo"

### Test 6: Orario già nel passato ❌

1. Seleziona data: **ieri**
2. Qualsiasi orario
3. **Risultato atteso:** ❌ Bloccato (data non valida)

## 3. Test via API (Postman/curl)

### Endpoint: Check disponibilità

```bash
curl -X POST http://localhost:3000/prenotazione/prenotazioni/check \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{
    "campo_id": 1,
    "data": "2025-12-15",
    "inizio": "14:00",
    "fine": "15:30"
  }'
```

**Risposta attesa (OK):**
```json
{
  "ok": true
}
```

**Risposta attesa (conflitto):**
```json
{
  "ok": false,
  "message": "Orario si sovrappone a una prenotazione esistente"
}
```

### Endpoint: Crea prenotazione

```bash
curl -X POST http://localhost:3000/prenotazione/prenotazioni \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{
    "campo_id": 1,
    "data_prenotazione": "2025-12-15",
    "ora_inizio": "14:00",
    "ora_fine": "15:30",
    "telefono": "+39 3331234567",
    "note": "Test prenotazione custom"
  }'
```

**Risposta attesa (successo):**
```json
{
  "success": true,
  "id": 123,
  "utente_id": 1
}
```

**Risposta attesa (conflitto):**
```json
{
  "error": "Orario si sovrappone a una prenotazione esistente",
  "conflict": true
}
```

## 4. Test Database Diretto

### Test constraint di esclusione

```sql
-- Setup: crea una prenotazione
INSERT INTO PRENOTAZIONI 
(campo_id, data_prenotazione, ora_inizio, ora_fine, stato, telefono, created_at, updated_at) 
VALUES (1, '2025-12-20', '10:00', '12:00', 'in_attesa', '+39 3331234567', NOW(), NOW());

-- Test 1: Duplicato esatto (deve fallire)
INSERT INTO PRENOTAZIONI 
(campo_id, data_prenotazione, ora_inizio, ora_fine, stato, telefono, created_at, updated_at) 
VALUES (1, '2025-12-20', '10:00', '12:00', 'in_attesa', '+39 3331234567', NOW(), NOW());
-- ERRORE ATTESO: conflicting key value violates exclusion constraint "prenotazioni_no_overlap"

-- Test 2: Sovrapposizione (deve fallire)
INSERT INTO PRENOTAZIONI 
(campo_id, data_prenotazione, ora_inizio, ora_fine, stato, telefono, created_at, updated_at) 
VALUES (1, '2025-12-20', '11:00', '13:00', 'in_attesa', '+39 3331234567', NOW(), NOW());
-- ERRORE ATTESO: conflicting key value violates exclusion constraint "prenotazioni_no_overlap"

-- Test 3: Adiacenti (deve riuscire)
INSERT INTO PRENOTAZIONI 
(campo_id, data_prenotazione, ora_inizio, ora_fine, stato, telefono, created_at, updated_at) 
VALUES (1, '2025-12-20', '12:00', '14:00', 'in_attesa', '+39 3331234567', NOW(), NOW());
-- SUCCESSO ATTESO

-- Test 4: Stesso orario ma campo diverso (deve riuscire)
INSERT INTO PRENOTAZIONI 
(campo_id, data_prenotazione, ora_inizio, ora_fine, stato, telefono, created_at, updated_at) 
VALUES (2, '2025-12-20', '10:00', '12:00', 'in_attesa', '+39 3331234567', NOW(), NOW());
-- SUCCESSO ATTESO

-- Test 5: Stesso orario ma data diversa (deve riuscire)
INSERT INTO PRENOTAZIONI 
(campo_id, data_prenotazione, ora_inizio, ora_fine, stato, telefono, created_at, updated_at) 
VALUES (1, '2025-12-21', '10:00', '12:00', 'in_attesa', '+39 3331234567', NOW(), NOW());
-- SUCCESSO ATTESO

-- Test 6: Prenotazione annullata non blocca (deve riuscire)
UPDATE PRENOTAZIONI SET stato = 'annullata' WHERE id = 1;
INSERT INTO PRENOTAZIONI 
(campo_id, data_prenotazione, ora_inizio, ora_fine, stato, telefono, created_at, updated_at) 
VALUES (1, '2025-12-20', '10:00', '12:00', 'in_attesa', '+39 3331234567', NOW(), NOW());
-- SUCCESSO ATTESO (la prenotazione annullata non conta)
```

### Verifica timestamp automatici

```sql
-- Inserisci una prenotazione
INSERT INTO PRENOTAZIONI 
(campo_id, data_prenotazione, ora_inizio, ora_fine, stato, telefono, created_at, updated_at) 
VALUES (1, '2025-12-25', '14:00', '16:00', 'in_attesa', '+39 3331234567', NOW(), NOW())
RETURNING id, inizio_timestamp, fine_timestamp;

-- Verifica che i timestamp siano stati popolati correttamente
-- inizio_timestamp dovrebbe essere: 2025-12-25 14:00:00
-- fine_timestamp dovrebbe essere: 2025-12-25 16:00:00
```

## 5. Checklist Verifica Completa

- [ ] Migration eseguita senza errori
- [ ] Estensione btree_gist attiva
- [ ] Constraint prenotazioni_no_overlap presente
- [ ] Trigger update_prenotazione_timestamps attivo
- [ ] Colonne inizio_timestamp e fine_timestamp esistono
- [ ] Test UI: orario custom valido funziona
- [ ] Test UI: duplicato esatto bloccato
- [ ] Test UI: sovrapposizione bloccata
- [ ] Test UI: adiacenti permessi
- [ ] Test UI: anticipo minimo verificato
- [ ] Test API: /check restituisce ok/not ok correttamente
- [ ] Test API: /prenotazioni crea con successo
- [ ] Test API: /prenotazioni blocca conflitti
- [ ] Test DB: constraint blocca insert sovrapposti
- [ ] Test DB: timestamp auto-generati correttamente

## 6. Troubleshooting Comuni

### Errore: "Cannot find module modalPrenotazione.js"
```bash
# Verifica che il file esista
ls src/public/assets/scripts/utils/modalPrenotazione.js
# Riavvia il server
npm restart
```

### Errore: "btree_gist extension not available"
```sql
-- Come superuser
CREATE EXTENSION btree_gist;
```

### Errore: "Constraint already exists"
```sql
-- Rimuovi e ricrea
ALTER TABLE PRENOTAZIONI DROP CONSTRAINT IF EXISTS prenotazioni_no_overlap;
-- Poi riesegui la migration
```

### Modal non mostra sezione custom time
```javascript
// Apri console browser (F12)
// Verifica errori JavaScript
// Controlla che gli elementi esistano:
console.log(document.querySelector('#linkOrarioCustom'));
console.log(document.querySelector('#customTimeSection'));
```

### Check endpoint sempre restituisce "ok: true" anche con conflitto
```javascript
// Verifica che la funzione checkOrarioCustom sia stata aggiunta
// In dao-prenotazione.js cerca:
exports.checkOrarioCustom = async (campo_id, data, ora_inizio, ora_fine) => {
```

## 7. Verifica Visuale

### Browser DevTools

1. **Network tab:**
   - Verifica chiamata POST a `/prenotazioni/check`
   - Status 200, response `{ "ok": true/false }`
   
2. **Console:**
   - Nessun errore JavaScript
   - Log di debug: "Chiamata checkOrarioCustom..."

3. **Elements:**
   - `#customTimeSection` con classe `d-none` inizialmente
   - Rimossa classe `d-none` dopo click su link

### Database

```sql
-- Verifica prenotazioni create
SELECT id, campo_id, data_prenotazione, ora_inizio, ora_fine, 
       stato, inizio_timestamp, fine_timestamp, created_at
FROM PRENOTAZIONI
ORDER BY created_at DESC
LIMIT 10;
```

## 8. Performance Check

```sql
-- Verifica indici
EXPLAIN ANALYZE
SELECT id FROM PRENOTAZIONI 
WHERE campo_id = 1 
  AND data_prenotazione = '2025-12-20'
  AND stato != 'annullata'
  AND NOT (ora_fine <= '14:00' OR ora_inizio >= '16:00');
-- Dovrebbe usare "idx_prenotazioni_timestamps"

-- Query time dovrebbe essere < 1ms per poche righe
```

## 9. Log da Monitorare

```bash
# Server logs
tail -f logs/app.log | grep -E "CHECK ORARIO|PRENOTAZIONE"

# Cerca:
# [CHECK ORARIO] Chiamata checkOrarioCustom...
# [PRENOTAZIONE] Validazione server-side...
# [DAO] checkOrarioCustom - duplicato/sovrapposizione trovata
```

## 10. Rollback (se necessario)

Se qualcosa non funziona e vuoi tornare indietro:

```sql
-- Rimuovi constraint
ALTER TABLE PRENOTAZIONI DROP CONSTRAINT IF EXISTS prenotazioni_no_overlap;

-- Rimuovi trigger
DROP TRIGGER IF EXISTS trigger_update_prenotazione_timestamps ON PRENOTAZIONI;
DROP FUNCTION IF EXISTS update_prenotazione_timestamps();

-- Rimuovi colonne timestamp (ATTENZIONE: perderai i dati)
ALTER TABLE PRENOTAZIONI DROP COLUMN IF EXISTS inizio_timestamp;
ALTER TABLE PRENOTAZIONI DROP COLUMN IF EXISTS fine_timestamp;

-- Rimuovi estensione (se non usata altrove)
DROP EXTENSION IF EXISTS btree_gist;
```

---

**Pronto per il test!** 🚀

Inizia con i test UI (più user-friendly), poi passa ai test API e DB per verifica tecnica approfondita.
