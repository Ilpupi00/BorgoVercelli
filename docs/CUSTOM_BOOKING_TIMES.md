# Sistema di Prenotazione con Orari Personalizzati

## Panoramica

Implementazione di un sistema che permette agli utenti di prenotare campi con orari personalizzati, oltre agli slot predefiniti. Il sistema include validazione robusta per prevenire duplicati e sovrapposizioni.

## Architettura

### 1. Database Layer (PostgreSQL)

#### Migration: `add_exclusion_constraint.sql`

**Funzionalità:**
- Abilita l'estensione `btree_gist` per supportare vincoli di esclusione con range
- Aggiunge colonne timestamp (`inizio_timestamp`, `fine_timestamp`) per facilitare i controlli
- Crea un trigger automatico per mantenere sincronizzate le colonne timestamp
- **Vincolo di esclusione:** Previene sovrapposizioni a livello database

```sql
ALTER TABLE PRENOTAZIONI
ADD CONSTRAINT prenotazioni_no_overlap 
EXCLUDE USING GIST (
    campo_id WITH =, 
    tstzrange(inizio_timestamp, fine_timestamp) WITH &&
)
WHERE (stato != 'annullata' AND stato != 'rifiutata');
```

**Benefici:**
- Elimina race conditions
- Garantisce integrità dei dati a livello database
- Prestazioni ottimizzate con indici GIST

#### Struttura Tabelle

**PRENOTAZIONI:**
- `campo_id` - ID del campo prenotato
- `data_prenotazione` - Data (YYYY-MM-DD)
- `ora_inizio` - Orario inizio (HH:MM)
- `ora_fine` - Orario fine (HH:MM)
- `inizio_timestamp` - Timestamp completo inizio (auto-generato)
- `fine_timestamp` - Timestamp completo fine (auto-generato)
- `stato` - Stato prenotazione (in_attesa, confermata, annullata, rifiutata)

**ORARI_CAMPI:**
- `campo_id` - ID del campo
- `giorno_settimana` - 0-6 (0=Domenica, NULL=tutti i giorni)
- `ora_inizio` - Orario inizio slot
- `ora_fine` - Orario fine slot
- `attivo` - Se lo slot è attivo

---

### 2. Server Layer (Express/Node.js)

#### Endpoint: `POST /prenotazione/prenotazioni/check`

**Scopo:** Validazione pre-booking di orari personalizzati

**Input:**
```json
{
  "campo_id": 1,
  "data": "2025-12-15",
  "inizio": "14:00",
  "fine": "15:30"
}
```

**Output (successo):**
```json
{
  "ok": true
}
```

**Output (errore):**
```json
{
  "ok": false,
  "message": "Orario si sovrappone a una prenotazione esistente"
}
```

**Validazioni eseguite:**

1. **Formato dati:**
   - Formato orari: HH:MM
   - Validità data
   
2. **Logica business:**
   - `inizio < fine`
   - Anticipo minimo 2 ore da ora corrente
   
3. **Controllo duplicati esatti:**
   ```sql
   SELECT id FROM PRENOTAZIONI 
   WHERE campo_id = $1 AND data_prenotazione = $2 
   AND ora_inizio = $3 AND ora_fine = $4 
   AND stato NOT IN ('annullata', 'rifiutata')
   ```

4. **Controllo sovrapposizioni prenotazioni:**
   ```sql
   SELECT id FROM PRENOTAZIONI 
   WHERE campo_id = $1 AND data_prenotazione = $2 
   AND stato NOT IN ('annullata', 'rifiutata')
   AND NOT (ora_fine <= $3 OR ora_inizio >= $4)
   ```

5. **Controllo sovrapposizioni orari default:**
   ```sql
   SELECT id FROM ORARI_CAMPI 
   WHERE campo_id = $1 
   AND (giorno_settimana = $2 OR giorno_settimana IS NULL)
   AND attivo = TRUE
   AND NOT (ora_fine <= $3 OR ora_inizio >= $4)
   ```

**Messaggi di errore:**
- "Formato orario non valido. Usa HH:MM"
- "Intervallo non valido: l'orario di inizio deve essere precedente alla fine"
- "Devi prenotare con almeno 2 ore di anticipo"
- "Orario già prenotato (duplicato esatto)"
- "Orario si sovrappone a una prenotazione esistente"
- "Orario vietato dai blocchi di default per questo giorno"

#### Endpoint: `POST /prenotazione/prenotazioni` (aggiornato)

**Modifiche:**
- Normalizzazione orari (rimozione secondi se presenti)
- Validazione formato HH:MM
- Controllo ordine orari (inizio < fine)
- Anticipo minimo 2 ore
- Chiamata a `checkOrarioCustom()` per validazione completa
- Gestione errori constraint violation (code 23P01)

**Gestione errori DB:**
```javascript
if (err.code === '23P01' || err.message.includes('prenotazioni_no_overlap')) {
    return resolve({ 
        error: 'Orario si sovrappone a una prenotazione esistente' 
    });
}
```

#### DAO: `dao-prenotazione.js`

**Nuova funzione:** `checkOrarioCustom(campo_id, data, ora_inizio, ora_fine)`

Esegue i 3 controlli principali:
1. Duplicato esatto
2. Sovrapposizione con prenotazioni
3. Sovrapposizione con orari default

**Funzione aggiornata:** `prenotaCampo()`
- Filtra prenotazioni annullate/rifiutate nei controlli
- Gestisce errori del vincolo di esclusione
- Restituisce messaggi user-friendly

---

### 3. Client Layer (JavaScript)

#### File: `modalPrenotazione.js`

**Nuove funzionalità UI:**

1. **Toggle orario predefinito/custom:**
   - Link "inserisci un orario personalizzato"
   - Sezione con input `type="time"` per inizio/fine
   - Pulsante "Torna alla selezione orari predefiniti"

2. **Validazione client-side:**
   
   **Formato e ordine:**
   ```javascript
   if (ora_inizio >= ora_fine) {
       // Errore: inizio deve essere < fine
   }
   ```
   
   **Anticipo minimo 2 ore:**
   ```javascript
   const bookingDateTime = new Date(data);
   bookingDateTime.setHours(h, m, 0, 0);
   const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
   
   if (bookingDateTime < minTime) {
       // Errore: anticipo insufficiente
   }
   ```
   
   **Duplicato esatto (UI):**
   ```javascript
   const existingBadges = document.querySelectorAll('#orariDisponibili-X .badge');
   const customSlot = `${ora_inizio}-${ora_fine}`;
   const isDuplicate = existingBadges.some(badge => 
       badge.textContent.trim() === customSlot
   );
   ```

3. **Chiamata API di verifica:**
   ```javascript
   const checkRes = await fetch('/prenotazione/prenotazioni/check', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
           campo_id, data, inizio: ora_inizio, fine: ora_fine
       })
   });
   
   const checkResult = await checkRes.json();
   if (!checkResult.ok) {
       // Mostra errore specifico all'utente
   }
   ```

4. **Submit finale:**
   - Se validazione OK, chiama `POST /prenotazioni` come gli slot predefiniti
   - Passa gli stessi dati (campo_id, data, ora_inizio, ora_fine, ecc.)

**Workflow completo:**

```
1. Utente clicca "Prenota ora"
2. Modal si apre con orari predefiniti
3. Utente clicca "inserisci orario personalizzato"
4. UI mostra input time inizio/fine
5. Utente inserisce 14:00 - 15:30
6. Validazioni client:
   ✓ Formato valido
   ✓ Inizio < Fine
   ✓ Anticipo >= 2 ore
   ✓ Non duplicato esatto (UI)
7. Chiamata POST /check:
   ✓ Nessuna sovrapposizione con prenotazioni
   ✓ Nessuna sovrapposizione con orari default
8. POST /prenotazioni per creare
9. Constraint DB verifica ancora (ultimo controllo)
10. Prenotazione creata con successo
```

---

## Regola di Sovrapposizione

Due intervalli `[s1, f1)` e `[s2, f2)` si sovrappongono se:

```
NOT (f1 <= s2 OR s1 >= f2)
```

**Equivalente a:**
```
f1 > s2 AND s1 < f2
```

**Esempi:**

| Slot 1 | Slot 2 | Sovrapposizione | Motivo |
|--------|--------|-----------------|---------|
| 10:00-12:00 | 11:00-13:00 | ✅ Sì | 11:00 è tra 10:00 e 12:00 |
| 10:00-12:00 | 12:00-14:00 | ❌ No | 12:00 = 12:00 (adiacenti) |
| 10:00-12:00 | 09:00-10:30 | ✅ Sì | 10:00 è tra 09:00 e 10:30 |
| 10:00-12:00 | 14:00-16:00 | ❌ No | Completamente separati |

---

## Messaggi Utente

### Client-side (immediati)
- ✅ "Intervallo non valido"
- ✅ "Devi prenotare con almeno 2 ore di anticipo"
- ✅ "Orario già presente" (duplicato UI)

### Server-side (dopo chiamata API)
- ✅ "Orario già prenotato (duplicato esatto)"
- ✅ "Orario si sovrappone a una prenotazione esistente"
- ✅ "Orario vietato dai blocchi di default per questo giorno"
- ✅ "Errore server" (generico)

---

## Testing

### Test Manuali Consigliati

1. **Orario valido custom:**
   - Inserire 15:00-16:30 per domani
   - ✅ Deve creare prenotazione

2. **Duplicato esatto:**
   - Creare 14:00-15:00
   - Tentare di ricreare 14:00-15:00
   - ❌ Deve bloccare

3. **Sovrapposizione parziale:**
   - Creare 10:00-12:00
   - Tentare 11:00-13:00
   - ❌ Deve bloccare

4. **Adiacenti (OK):**
   - Creare 10:00-12:00
   - Creare 12:00-14:00
   - ✅ Deve permettere entrambi

5. **Anticipo insufficiente:**
   - Tentare prenotazione tra 1 ora
   - ❌ Deve bloccare

6. **Conflitto con orari default:**
   - Se campo ha blocco 14:00-15:00 (ORARI_CAMPI)
   - Tentare 14:30-16:00
   - ❌ Deve bloccare

### Test Database

Verificare constraint:
```sql
-- Deve fallire (sovrapposizione)
INSERT INTO PRENOTAZIONI 
(campo_id, data_prenotazione, ora_inizio, ora_fine, stato) 
VALUES (1, '2025-12-15', '10:30', '11:30', 'in_attesa');

INSERT INTO PRENOTAZIONI 
(campo_id, data_prenotazione, ora_inizio, ora_fine, stato) 
VALUES (1, '2025-12-15', '11:00', '12:00', 'in_attesa');
-- ERROR: conflicting key value violates exclusion constraint
```

---

## Sicurezza e Performance

### Sicurezza
1. ✅ Autenticazione richiesta (`isLoggedIn` middleware)
2. ✅ Validazione input server-side
3. ✅ Sanitizzazione parametri SQL (prepared statements)
4. ✅ Protezione CSRF (gestita da Express)

### Performance
1. ✅ Indice GIST per range queries
2. ✅ Indice su (campo_id, inizio_timestamp, fine_timestamp)
3. ✅ WHERE clause per filtrare stati non attivi
4. ✅ LIMIT 1 nelle query di controllo

### Scalabilità
- Vincolo DB garantisce atomicità anche con alto traffico
- No lock espliciti necessari
- Gestione automatica race conditions

---

## Deployment

### Prerequisiti
- PostgreSQL 12+
- Extension btree_gist disponibile

### Installazione

1. **Eseguire migration:**
   ```bash
   psql -U your_user -d your_database -f database/migrations/add_exclusion_constraint.sql
   ```

2. **Verificare estensione:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'btree_gist';
   ```

3. **Verificare constraint:**
   ```sql
   SELECT conname, contype FROM pg_constraint 
   WHERE conrelid = 'prenotazioni'::regclass;
   ```

4. **Test rapido:**
   - Creare una prenotazione via UI
   - Tentare sovrapposizione
   - Verificare blocco

---

## Manutenzione

### Log importanti da monitorare
- Errori 409 (Conflict) - indicano tentativi di prenotazioni sovrapposte
- Errori 23P01 (Exclusion violation) - constraint DB attivato
- Errori validazione client - UX da migliorare

### Query utili

**Prenotazioni sovrapposte (audit):**
```sql
SELECT p1.id, p1.ora_inizio, p1.ora_fine, p1.stato,
       p2.id, p2.ora_inizio, p2.ora_fine, p2.stato
FROM PRENOTAZIONI p1
JOIN PRENOTAZIONI p2 ON p1.campo_id = p2.campo_id 
    AND p1.data_prenotazione = p2.data_prenotazione
    AND p1.id < p2.id
WHERE NOT (p1.ora_fine <= p2.ora_inizio OR p1.ora_inizio >= p2.ora_fine)
    AND p1.stato NOT IN ('annullata', 'rifiutata')
    AND p2.stato NOT IN ('annullata', 'rifiutata');
```

**Statistiche orari custom:**
```sql
SELECT COUNT(*) as custom_bookings
FROM PRENOTAZIONI p
LEFT JOIN ORARI_CAMPI oc ON p.campo_id = oc.campo_id 
    AND p.ora_inizio = oc.ora_inizio 
    AND p.ora_fine = oc.ora_fine
WHERE oc.id IS NULL
    AND p.created_at >= NOW() - INTERVAL '30 days';
```

---

## Troubleshooting

### Problema: "Errore 23P01 anche se slot sembra libero"
**Soluzione:** Verificare timestamp columns aggiornati correttamente
```sql
SELECT id, data_prenotazione, ora_inizio, ora_fine, 
       inizio_timestamp, fine_timestamp 
FROM PRENOTAZIONI 
WHERE campo_id = X AND data_prenotazione = 'YYYY-MM-DD';
```

### Problema: "Constraint non attivo"
**Soluzione:** Ricreare constraint
```sql
ALTER TABLE PRENOTAZIONI DROP CONSTRAINT IF EXISTS prenotazioni_no_overlap;
-- Poi rieseguire migration
```

### Problema: "Performance lente su controlli"
**Soluzione:** Rebuild indici GIST
```sql
REINDEX INDEX idx_prenotazioni_timestamps;
```

---

## Futuro

### Possibili miglioramenti

1. **Cache orari disponibili** (Redis)
2. **Notifiche real-time** (WebSocket) su nuove prenotazioni
3. **Suggerimenti intelligenti** slot alternativi in caso di conflitto
4. **Dashboard analytics** orari più richiesti
5. **Rate limiting** su endpoint check (prevenire abuse)

---

## Riferimenti

- PostgreSQL Exclusion Constraints: https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION
- btree_gist extension: https://www.postgresql.org/docs/current/btree-gist.html
- Range Types: https://www.postgresql.org/docs/current/rangetypes.html

---

**Autore:** GitHub Copilot  
**Data:** Dicembre 2025  
**Versione:** 1.0
