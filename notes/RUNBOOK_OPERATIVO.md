# RUNBOOK OPERATIVO: Migrazione PostgreSQL
# Comandi pronti all'uso per l'agente di turno

## 🎯 QUICK START

### 1. Setup Database (5 min)

```powershell
# Avviare PostgreSQL (se non già avviato)
# Windows: Verifica servizio PostgreSQL attivo

# Creare database
psql -U postgres -h localhost
```

```sql
-- In psql:
CREATE DATABASE borgovercelli;
\c borgovercelli
\i create_postgres_db.sql
\dt
-- Verificare tabelle create (deve mostrare ~15 tabelle)
\q
```

### 2. Configurare Ambiente (2 min)

```powershell
# Copiare template e modificare
Copy-Item .env.example -Destination .env

# Modificare .env con editor:
# PG_HOST=localhost
# PG_PORT=5432
# PG_USER=postgres
# PG_PASSWORD=<TUA_PASSWORD>
# PG_DATABASE=borgovercelli
```

### 3. Installare Dipendenze (già fatto, verifica)

```powershell
npm install
```

### 4. Test Avvio

```powershell
npm start
```

**Cercare nel log**:
```
[database] Connecting to PostgreSQL database: borgovercelli
[database] Connected to PostgreSQL successfully
```

Se vedi questi messaggi → ✅ Connessione OK

---

## 🔨 CONVERSIONE DAO (CORE TASK)

### Checklist Conversione Singolo DAO

Per ogni file DAO, seguire questi step:

#### Step 1: Backup
```powershell
# Creare backup del file originale
Copy-Item src/features/users/services/dao-user.js -Destination src/features/users/services/dao-user.js.backup
```

#### Step 2: Pattern da cercare e sostituire

**A. Import database**
```javascript
// CERCA:
const sqlite = require('../../../core/config/database');

// SOSTITUISCI CON:
const db = require('../../../core/config/database');
```

**B. Callback → Async/Await**
```javascript
// PATTERN VECCHIO (da sostituire):
exports.funzione = function(params) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM utenti WHERE id = $1`;
        sqlite.get(sql, [params.id], (err, row) => {
            if (err) return reject({ error: err.message });
            resolve(row);
        });
    });
}

// PATTERN NUOVO (sostituire con):
exports.funzione = async function(params) {
    try {
        const sql = `SELECT * FROM utenti WHERE id = $1`;
        const row = await db.get(sql, [params.id]);
        return row;
    } catch (err) {
        throw { error: err.message };
    }
}
```

**C. INSERT con RETURNING**
```javascript
// PATTERN VECCHIO:
db.run(`INSERT INTO utenti (...) VALUES ($1, $2, $3)`, [...], function(err) {
    if (err) return reject(err);
    const id = this.lastID; // ❌ NON FUNZIONA in PostgreSQL
    resolve({ id });
});

// PATTERN NUOVO:
const sql = `INSERT INTO utenti (...) VALUES ($1, $2, $3) RETURNING id`;
const result = await db.run(sql, [...]);
const id = result.rows[0].id; // ✅ CORRETTO
return { id };
```

**D. Conteggio righe modificate**
```javascript
// PATTERN VECCHIO:
db.run(`DELETE FROM utenti WHERE id = $1`, [id], function(err) {
    const deleted = this.changes; // ❌ NON FUNZIONA
});

// PATTERN NUOVO:
const result = await db.run(`DELETE FROM utenti WHERE id = $1`, [id]);
const deleted = result.rowCount; // ✅ CORRETTO
```

### Lista File DAO da Convertire (Priorità)

#### 🔴 CRITICI (fare per primi)

1. **dao-user.js** (~30 funzioni)
```powershell
code src/features/users/services/dao-user.js
```
Funzioni chiave:
- createUser
- getUser, getUserById
- updateUser, updateProfilePicture
- changePassword
- sospendiUtente, bannaUtente

2. **dao-prenotazione.js** (~15 funzioni)
```powershell
code src/features/prenotazioni/services/dao-prenotazione.js
```
Funzioni chiave:
- prenotaCampo
- getDisponibilitaCampo
- getAllPrenotazioni
- updateStatoPrenotazione
- checkAndUpdateScadute

3. **dao-campi.js** (~10 funzioni)
```powershell
code src/features/prenotazioni/services/dao-campi.js
```

#### 🟡 IMPORTANTI (fare dopo critici)

4. **dao-eventi.js**
```powershell
code src/features/eventi/services/dao-eventi.js
```

5. **dao-notizie.js**
```powershell
code src/features/notizie/services/dao-notizie.js
```

#### 🟢 SECONDARI (fare per ultimi)

6. **dao-galleria.js**
7. **dao-campionati.js**
8. **dao-squadre.js**
9. **dao-dirigenti-squadre.js**
10. **dao-membri-societa.js**
11. **dao-recensioni.js**

---

## 🧪 TEST DOPO OGNI CONVERSIONE

### Dopo aver convertito dao-user.js

```powershell
# Riavviare server
# Ctrl+C per fermare, poi:
npm start
```

**Test manuali**:
1. Aprire browser: `http://localhost:3000/registrazione`
2. Registrare nuovo utente
3. Login con utente creato
4. Modificare profilo
5. Upload foto profilo

**Verifica DB**:
```powershell
psql -U postgres -d borgovercelli
```
```sql
SELECT * FROM utenti ORDER BY created_at DESC LIMIT 5;
```

### Dopo aver convertito dao-prenotazione.js

**Test manuali**:
1. Visualizzare campi disponibili
2. Creare prenotazione
3. Visualizzare "Le mie prenotazioni"

**Verifica DB**:
```sql
SELECT * FROM prenotazioni ORDER BY created_at DESC LIMIT 5;
```

---

## 📊 COMANDI VERIFICA DATABASE

### Connessione rapida
```powershell
psql -U postgres -d borgovercelli
```

### Query utili

```sql
-- Contare tutte le tabelle
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public';

-- Contare record per tabella
SELECT 'utenti' as tabella, COUNT(*) as conteggio FROM utenti
UNION ALL
SELECT 'prenotazioni', COUNT(*) FROM prenotazioni
UNION ALL
SELECT 'eventi', COUNT(*) FROM eventi
UNION ALL
SELECT 'notizie', COUNT(*) FROM notizie
UNION ALL
SELECT 'immagini', COUNT(*) FROM immagini
UNION ALL
SELECT 'squadre', COUNT(*) FROM squadre
UNION ALL
SELECT 'campi', COUNT(*) FROM campi;

-- Ultimi 10 record creati (qualsiasi tabella)
SELECT 'utenti' as tipo, id, created_at FROM utenti
UNION ALL
SELECT 'prenotazioni', id, created_at FROM prenotazioni
ORDER BY created_at DESC LIMIT 10;

-- Verificare connessioni attive
SELECT count(*) as connessioni_attive 
FROM pg_stat_activity 
WHERE datname = 'borgovercelli';

-- Visualizzare query lente (>1 secondo)
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '1 second';
```

### Backup database

```powershell
# Backup completo
pg_dump -U postgres -d borgovercelli -F c -f backup_borgovercelli_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump

# Backup solo schema
pg_dump -U postgres -d borgovercelli --schema-only -f schema_backup.sql

# Backup solo dati
pg_dump -U postgres -d borgovercelli --data-only -f data_backup.sql
```

### Ripristino backup

```powershell
# Ripristinare da dump
pg_restore -U postgres -d borgovercelli -c backup_file.dump

# Ripristinare da SQL
psql -U postgres -d borgovercelli -f backup_file.sql
```

---

## 🔍 DEBUG E LOG

### Visualizzare log applicazione

```powershell
# Se usi PM2
pm2 logs borgovercelli

# Se usi npm start (console)
# I log sono già visibili nella console
```

### Cercare errori specifici

```powershell
# Cercare errori di database nei log
pm2 logs borgovercelli | Select-String "error"

# Cercare query fallite
pm2 logs borgovercelli | Select-String "SQL|query"
```

### Abilitare log query PostgreSQL (debug)

```powershell
# Modificare postgresql.conf
# Windows: C:\Program Files\PostgreSQL\<version>\data\postgresql.conf
```

```conf
# Aggiungere/modificare:
log_statement = 'all'
log_duration = on
log_min_duration_statement = 100  # logga query > 100ms
```

Poi riavviare PostgreSQL:
```powershell
# Windows (Admin PowerShell)
Restart-Service postgresql-x64-<version>
```

---

## 🚨 TROUBLESHOOTING RAPIDO

### Errore: "Cannot connect to database"

```powershell
# 1. Verificare PostgreSQL attivo
Get-Service postgresql*

# 2. Se non attivo, avviare
Start-Service postgresql-x64-<version>

# 3. Testare connessione manuale
psql -U postgres -h localhost -d borgovercelli
```

### Errore: "relation does not exist"

```sql
-- Verificare tabelle esistenti
\dt

-- Se mancano tabelle, ricreare schema
\i create_postgres_db.sql
```

### Errore: "password authentication failed"

```powershell
# Modificare .env con password corretta
# oppure resettare password PostgreSQL:
```

```sql
-- In psql (connesso come admin):
ALTER USER postgres PASSWORD 'nuova_password';
```

### Errore: "too many clients"

```sql
-- Verificare connessioni attive
SELECT count(*) FROM pg_stat_activity WHERE datname = 'borgovercelli';

-- Chiudere connessioni idle
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'borgovercelli' 
  AND state = 'idle' 
  AND state_change < current_timestamp - INTERVAL '5 minutes';
```

### Applicazione non si avvia

```powershell
# 1. Verificare .env esiste
Test-Path .env

# 2. Verificare dipendenze installate
npm install

# 3. Verificare errori sintassi
npm run lint  # se configurato

# 4. Avviare in modalità debug
$env:DEBUG="*"; npm start
```

---

## ⚡ COMANDI RAPIDI UTILITÀ

### Reset completo database (⚠️ DATI PERSI)

```powershell
psql -U postgres
```
```sql
DROP DATABASE IF EXISTS borgovercelli;
CREATE DATABASE borgovercelli;
\c borgovercelli
\i create_postgres_db.sql
```

### Riavvio rapido applicazione

```powershell
# Con PM2
pm2 restart borgovercelli

# Con npm (Ctrl+C poi):
npm start
```

### Controllo salute sistema

```powershell
# Verifica PostgreSQL
Get-Service postgresql*

# Verifica spazio disco
Get-PSDrive C

# Verifica memoria
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Select-Object ProcessName, WS, CPU
```

---

## 📋 CHECKLIST GIORNALIERA

**Mattina (inizio lavoro)**:
- [ ] PostgreSQL attivo: `Get-Service postgresql*`
- [ ] Database accessibile: `psql -U postgres -d borgovercelli -c "SELECT 1"`
- [ ] Backup recente disponibile (< 24h)

**Durante sviluppo**:
- [ ] Commit git frequenti (ogni DAO convertito)
- [ ] Test funzionale dopo ogni modifica
- [ ] Log monitorati per errori

**Fine giornata**:
- [ ] Backup database: `pg_dump ...`
- [ ] Commit finale git
- [ ] Documentare problemi incontrati in MVP_MIGRATION.md

---

## 🎓 COMANDI GIT UTILI

```powershell
# Vedere modifiche correnti
git status

# Vedere diff di un file
git diff src/features/users/services/dao-user.js

# Commit singolo file
git add src/features/users/services/dao-user.js
git commit -m "Convertito dao-user.js per PostgreSQL"

# Revert file singolo (se conversione fallita)
git checkout HEAD -- src/features/users/services/dao-user.js

# Creare branch per migrazione (consigliato)
git checkout -b feature/postgresql-migration
git push -u origin feature/postgresql-migration
```

---

## 📞 SUPPORTO E RISORSE

### Documentazione

- PostgreSQL docs: https://www.postgresql.org/docs/
- node-postgres (pg): https://node-postgres.com/
- File principale: `MVP_MIGRATION.md`

### In caso di blocco

1. Controllare `MVP_MIGRATION.md` sezione Troubleshooting
2. Cercare errore specifico nei log
3. Consultare team senior developer
4. Documentare soluzione trovata

---

**FINE RUNBOOK - Buon lavoro! 🚀**
