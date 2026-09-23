# Sistema di Gestione Annullamenti Prenotazioni

## Descrizione

Implementazione di un sistema che distingue tra annullamenti di prenotazioni fatti dall'utente e quelli fatti dall'amministratore, con diverse possibilità di riattivazione.

## Funzionalità

### Regole di Annullamento e Riattivazione

1. **Annullamento da parte dell'utente**
   - L'utente può annullare le proprie prenotazioni con stato "confermata" o "in_attesa"
   - L'annullamento viene tracciato come `annullata_da = 'user'`
   - L'utente **può riattivare** la prenotazione, che tornerà in stato "in_attesa"

2. **Annullamento da parte dell'admin**
   - L'amministratore può annullare qualsiasi prenotazione
   - L'annullamento viene tracciato come `annullata_da = 'admin'`
   - L'utente **NON può riattivare** la prenotazione
   - Solo l'admin può riattivare prenotazioni annullate da admin

## Modifiche al Database

### Nuova Colonna

```sql
ALTER TABLE PRENOTAZIONI 
ADD COLUMN IF NOT EXISTS annullata_da VARCHAR(10);
```

**Valori possibili:**
- `'user'` - Annullamento fatto dall'utente stesso
- `'admin'` - Annullamento fatto dall'amministratore
- `NULL` - Prenotazione non annullata o annullamento precedente alla feature

## File Modificati

### Backend

1. **database/migrations/add_annullata_da_column.sql**
   - Migration SQL per aggiungere la colonna `annullata_da`

2. **src/features/prenotazioni/services/dao-prenotazione.js**
   - Modificato `updateStatoPrenotazione()` per accettare e salvare il parametro `annullata_da`
   - Quando lo stato cambia a "annullata", salva chi ha fatto l'annullamento
   - Quando lo stato cambia da "annullata" a altro, resetta `annullata_da` a NULL

3. **src/features/prenotazioni/routes/prenotazione.js**
   - Aggiunto middleware `isLoggedIn` alla route PATCH `/prenotazioni/:id/stato`
   - Implementata logica per determinare se l'utente è admin (`tipo_utente_id === 1`)
   - Validazione riattivazione: impedisce agli utenti di riattivare prenotazioni annullate da admin
   - Passa il parametro `annullata_da` al DAO quando si annulla

### Frontend

4. **src/public/assets/scripts/components/MiePrenotazioni.js**
   - Modificato `getActionButtons()`:
     - Mostra pulsante "Riattiva" solo se `annullata_da !== 'admin'`
     - Mostra pulsante disabilitato "Annullata da Admin" se annullata dall'admin
   - Modificato `reactivatePrenotazione()`:
     - Gestione migliorata degli errori con messaggi specifici
   - Modificato `viewDetails()`:
     - Mostra chi ha annullato la prenotazione nei dettagli

### Script Utility

5. **scripts/apply-annullata-da-migration.js**
   - Script per applicare la migration al database
   - Include verifica della corretta applicazione

## Installazione e Utilizzo

### 1. Applicare la Migration

#### Opzione A: Script Automatico (con DATABASE_URL configurato)

Se hai la variabile d'ambiente `DATABASE_URL` configurata:

```powershell
node scripts/apply-annullata-da-migration.js
```

#### Opzione B: SQL Manuale (Railway o altro PostgreSQL)

Se stai usando Railway o devi applicare manualmente:

1. Connettiti al tuo database PostgreSQL
2. Esegui il file SQL: `database/migrations/add_annullata_da_column.sql`

**Metodo 1 - Railway CLI:**
```powershell
# Connetti al database Railway
railway run psql

# Poi nel prompt psql:
\i database/migrations/add_annullata_da_column.sql
```

**Metodo 2 - psql diretto:**
```powershell
# Sostituisci con la tua DATABASE_URL
psql "postgresql://user:password@host:port/database" -f database/migrations/add_annullata_da_column.sql
```

**Metodo 3 - pgAdmin o DBeaver:**
- Apri il file `database/migrations/add_annullata_da_column.sql`
- Copia il contenuto
- Esegui nella console SQL del tuo client

**SQL da eseguire:**
```sql
ALTER TABLE PRENOTAZIONI 
ADD COLUMN IF NOT EXISTS annullata_da VARCHAR(10);

COMMENT ON COLUMN PRENOTAZIONI.annullata_da IS 'Indica chi ha annullato: user (utente stesso) o admin (amministratore)';
```

### 2. Verificare l'Applicazione della Migration

Dopo aver eseguito la migration, verifica che la colonna sia stata aggiunta:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'prenotazioni' 
AND column_name = 'annullata_da';
```

Dovresti vedere:
```
 column_name  | data_type | is_nullable 
--------------+-----------+-------------
 annullata_da | character varying | YES
```

### 3. Riavviare l'Applicazione

Dopo aver applicato la migration, riavvia il server:

```powershell
npm start
```

oppure su Railway, fai un nuovo deploy o riavvia il servizio dal dashboard.

## Esempi di Utilizzo

### Scenario 1: Utente annulla e riattiva la propria prenotazione

1. Utente va su "Le Mie Prenotazioni"
2. Clicca "Annulla" su una prenotazione confermata
3. La prenotazione passa a stato "annullata" con `annullata_da = 'user'`
4. L'utente vede il pulsante "Riattiva" ✅
5. Cliccando "Riattiva", la prenotazione torna a "in_attesa"

### Scenario 2: Admin annulla una prenotazione

1. Admin accede al pannello di gestione prenotazioni
2. Annulla una prenotazione utente
3. La prenotazione passa a stato "annullata" con `annullata_da = 'admin'`
4. L'utente NON vede il pulsante "Riattiva" ❌
5. L'utente vede "Annullata da Admin" (pulsante disabilitato)

### Scenario 3: Admin riattiva prenotazione annullata da admin

1. Solo l'admin può cambiare lo stato di prenotazioni con `annullata_da = 'admin'`
2. L'utente riceve errore 403 se tenta di riattivarla

## API Endpoint Modificato

### PATCH `/prenotazione/prenotazioni/:id/stato`

**Richiede autenticazione:** ✅ (middleware `isLoggedIn`)

**Body Request:**
```json
{
  "stato": "annullata" | "in_attesa" | "confermata"
}
```

**Comportamento:**
- Se `stato = 'annullata'`:
  - Determina automaticamente `annullata_da` in base al ruolo dell'utente
  - Admin: `annullata_da = 'admin'`
  - Utente: `annullata_da = 'user'`

- Se `stato = 'in_attesa'` o `'confermata'` (riattivazione):
  - Verifica se la prenotazione è annullata da admin
  - Permette riattivazione solo se annullata dall'utente o se chi riattiva è admin
  - Resetta `annullata_da` a NULL

**Response Success:**
```json
{
  "success": true,
  "changes": 1
}
```

**Response Error (403):**
```json
{
  "error": "Non autorizzato",
  "message": "Non puoi riattivare una prenotazione annullata dall'amministratore"
}
```

## Testing

### Test Manuali Consigliati

1. ✅ Utente annulla prenotazione → può riattivare
2. ✅ Admin annulla prenotazione → utente non può riattivare
3. ✅ Admin annulla prenotazione → admin può riattivare
4. ✅ Utente annulla e riattiva → stato torna a "in_attesa"
5. ✅ Prenotazioni vecchie (annullata_da = NULL) → comportamento normale

## Note Tecniche

- La colonna `annullata_da` è nullable per compatibilità con prenotazioni esistenti
- Le prenotazioni annullate prima di questa feature avranno `annullata_da = NULL`
- Prenotazioni con `annullata_da = NULL` possono essere riattivate dagli utenti (comportamento legacy)
- Il controllo `tipo_utente_id === 1` identifica gli amministratori

## Troubleshooting

### La colonna annullata_da non esiste
Esegui la migration: `node scripts/apply-annullata-da-migration.js`

### Errore 403 quando provo a riattivare
La prenotazione è stata annullata da un admin. Solo gli admin possono riattivarla.

### Il pulsante "Riattiva" non compare
- Verifica che la prenotazione sia in stato "annullata"
- Verifica che `annullata_da !== 'admin'`
- Ricarica la pagina per aggiornare i dati

## Compatibilità

- ✅ PostgreSQL
- ✅ Node.js Express
- ✅ Bootstrap 5.3.4
- ✅ Sistema di autenticazione esistente

## Autore

Implementato il 26 Novembre 2025
