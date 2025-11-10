# MVP: Migrazione da SQLite a PostgreSQL - Guida Operativa Completa

**Data creazione**: 10 Novembre 2025  
**Versione**: 1.0  
**Target**: Agente di turno / Sviluppatore backend

---

## 📋 INDICE

1. [Stato attuale migrazione](#stato-attuale)
2. [Prerequisiti](#prerequisiti)
3. [Setup ambiente](#setup-ambiente)
4. [Modifiche già applicate](#modifiche-applicate)
5. [Modifiche rimanenti richieste](#modifiche-rimanenti)
6. [Procedura di test](#procedura-test)
7. [Deploy in produzione](#deploy-produzione)
8. [Rollback](#rollback)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 STATO ATTUALE {#stato-attuale}

### ✅ Completato

1. **Dipendenze installate**
   - `pg` (driver PostgreSQL) aggiunto a package.json
   - Eseguito: `npm install pg`

2. **Configurazione ambiente**
   - Creato `.env.example` con template variabili PostgreSQL
   - Variabili richieste: PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE

3. **Modulo database convertito**
   - File: `src/core/config/database.js`
   - Sostituita connessione SQLite con `pg.Pool`
   - Creati wrapper compatibili: `get()`, `all()`, `run()`, `query()`
   - Pool configurato con max 20 connessioni, timeout 30s

4. **Script SQL PostgreSQL**
   - File: `create_postgres_db.sql` pronto per creare schema
   - Tutte le tabelle convertite con tipi PostgreSQL (SERIAL, TIMESTAMP, BOOLEAN)

5. **Conversione automatica eseguita**
   - Script `convert-sqlite-to-postgres.js` eseguito
   - Placeholder `?` → `$1, $2, ...` convertiti in tutti i DAO
   - Funzioni date SQLite → PostgreSQL:
     - `datetime('now')` → `NOW()`
     - `date('now')` → `CURRENT_DATE`
     - `date('now', '-30 days')` → `CURRENT_DATE - INTERVAL '30 days'`

### ⚠️ Parzialmente completato

6. **Conversione DAO**
   - File DAO hanno placeholder convertiti
   - Funzioni date convertite
   - **MANCA**: Conversione callback → async/await per tutti i DAO
   - **MANCA**: Sostituzione `this.lastID` e `this.changes`

---

## 📦 PREREQUISITI {#prerequisiti}

### Software richiesto

- PostgreSQL 12+ installato e avviato
- Node.js 14+ 
- npm/yarn
- Accesso admin al server PostgreSQL

### Credenziali necessarie

- Host PostgreSQL (es. `localhost` o IP server)
- Porta (default: `5432`)
- Username con privilegi CREATE DATABASE
- Password
- Nome database (es. `borgovercelli`)

### Backup

- ✅ Backup dump SQLite esistente salvato
- ✅ Repository git con commit pulito prima delle modifiche
- ⚠️ **PRIMA DI PROCEDERE**: eseguire `git commit -am "Backup prima migrazione PostgreSQL"`

---

## 🔧 SETUP AMBIENTE {#setup-ambiente}

### 1. Creare database PostgreSQL

```bash
# Connettersi a PostgreSQL
psql -U postgres -h localhost

# Creare il database
CREATE DATABASE borgovercelli;

# Connettersi al database
\c borgovercelli

# Eseguire lo schema
\i create_postgres_db.sql

# Verificare tabelle create
\dt

# Uscire
\q
```

### 2. Configurare variabili ambiente

Creare file `.env` nella root del progetto:

```env
# Database PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=<TUA_PASSWORD>
PG_DATABASE=borgovercelli

# Porta applicazione
PORT=3000

# Ambiente
NODE_ENV=development
```

**IMPORTANTE**: NON committare il file `.env` (già in `.gitignore`)

### 3. Installare dipendenze (se non fatto)

```bash
npm install
```

---

## ✅ MODIFICHE GIÀ APPLICATE {#modifiche-applicate}

### File modificati

1. **`src/core/config/database.js`**
   - ✅ Sostituito SQLite con PostgreSQL Pool
   - ✅ Esportati wrapper: get, all, run, query
   - ✅ Gestione connessione e chiusura pool

2. **`.env.example`**
   - ✅ Template con variabili PostgreSQL

3. **`package.json`**
   - ✅ Aggiunta dipendenza `pg`

4. **Tutti i file DAO** (conversione automatica parziale):
   - ✅ Placeholder `?` → `$1, $2, ...`
   - ✅ Funzioni date SQLite → PostgreSQL
   - ⚠️ CALLBACK ANCORA DA CONVERTIRE (vedi sezione successiva)

### File creati

1. **`create_postgres_db.sql`**
   - Schema completo PostgreSQL
   - Tabelle con tipi corretti (SERIAL, TIMESTAMP, BOOLEAN)
   - Foreign key e constraints

2. **`convert-sqlite-to-postgres.js`**
   - Script helper per conversioni automatiche

3. **`convert-advanced.py`**
   - Script Python per conversioni avanzate

4. **`MVP_MIGRATION.md`** (questo file)
   - Documentazione completa migrazione

---

## 🚧 MODIFICHE RIMANENTI RICHIESTE {#modifiche-rimanenti}

### CRITICO: Conversione callback → async/await

**Tutti i file DAO** devono essere convertiti da callback-based a async/await.

#### Pattern da convertire:

**PRIMA (SQLite callback):**
```javascript
exports.getUser = function(id) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM utenti WHERE id = ?`;
        sqlite.get(sql, [id], (err, user) => {
            if (err) return reject({ error: err.message });
            resolve(user);
        });
    });
}
```

**DOPO (PostgreSQL async/await):**
```javascript
exports.getUser = async function(id) {
    try {
        const sql = `SELECT * FROM utenti WHERE id = $1`;
        const user = await db.get(sql, [id]);
        return user;
    } catch (err) {
        throw { error: err.message };
    }
}
```

#### Sostituzioni necessarie:

1. **Rimuovere Promise wrapper** quando possibile
2. **Aggiungere async** alle funzioni
3. **Usare await** invece di callback
4. **try/catch** invece di reject()
5. **this.lastID** → `result.rows[0].id` (con RETURNING id)
6. **this.changes** → `result.rowCount`

### File DAO da completare (ordine priorità):

#### 1. **CRITICO** - `src/features/users/services/dao-user.js`
   - Funzioni autenticazione: `createUser`, `getUser`, `getUserById`
   - Funzioni profilo: `updateUser`, `updateProfilePicture`
   - Funzioni password: `changePassword`, `saveResetToken`
   - Funzioni admin: `sospendiUtente`, `bannaUtente`, `revocaSospensioneBan`
   - ~30 funzioni da convertire

#### 2. **CRITICO** - `src/features/prenotazioni/services/dao-prenotazione.js`
   - `prenotaCampo`, `getDisponibilitaCampo`
   - `getAllPrenotazioni`, `getPrenotazioniByUserId`
   - `updateStatoPrenotazione`, `deletePrenotazione`
   - `checkAndUpdateScadute`, `deleteScadute`
   - ~15 funzioni da convertire

#### 3. **CRITICO** - `src/features/prenotazioni/services/dao-campi.js`
   - Gestione campi e orari
   - ~10 funzioni

#### 4. **IMPORTANTE** - `src/features/eventi/services/dao-eventi.js`
   - Creazione/modifica eventi
   - Partecipazioni
   - ~12 funzioni

#### 5. **IMPORTANTE** - `src/features/notizie/services/dao-notizie.js`
   - CRUD notizie
   - ~8 funzioni

#### 6. **MEDIA** - Altri DAO:
   - `src/features/galleria/services/dao-galleria.js`
   - `src/features/campionati/services/dao-campionati.js`
   - `src/features/squadre/services/dao-squadre.js`
   - `src/features/squadre/services/dao-dirigenti-squadre.js`
   - `src/features/squadre/services/dao-membri-societa.js`
   - `src/features/recensioni/services/dao-recensioni.js`

### Verificare Routes con query dirette

Alcuni route potrebbero avere query SQL dirette invece di usare DAO.

#### File da controllare:

1. **`src/features/admin/routes/admin.js`**
   - Verificare non usi `db` direttamente

2. **`src/features/auth/routes/login_register.js`**
   - Verificare login/register usino DAO

3. **`src/shared/routes/*.js`**
   - Cercare `db.get`, `db.all`, `db.run` diretti

#### Comando per cercare:

```bash
# Powershell
Get-ChildItem -Path src -Filter "*.js" -Recurse | Select-String -Pattern "db\.(get|all|run)\("
```

### Script create-admin.js

File: `src/server/create-admin.js`

**Azione**: Verificare che usi il nuovo modulo database e converte callback se necessario.

---

## 🧪 PROCEDURA DI TEST {#procedura-test}

### Test pre-deploy (ambiente sviluppo)

#### 1. Setup database test

```bash
# Creare database di test
createdb borgovercelli_test -U postgres

# Eseguire schema
psql -U postgres -d borgovercelli_test -f create_postgres_db.sql
```

#### 2. Configurare .env per test

```env
PG_DATABASE=borgovercelli_test
NODE_ENV=development
```

#### 3. Avviare applicazione

```bash
npm start
```

Verificare log di connessione:
```
[database] Connecting to PostgreSQL database: borgovercelli_test
[database] Connected to PostgreSQL successfully at <timestamp>
```

#### 4. Test funzionali minimi (checklist MVP)

- [ ] **Registrazione utente**
  - Aprire `/registrazione`
  - Registrare nuovo utente
  - Verificare email univoca (errore se duplicata)
  
- [ ] **Login**
  - Aprire `/login`
  - Login con credenziali create
  - Verificare redirect a profilo/homepage

- [ ] **Profilo utente**
  - Visualizzare profilo utente loggato
  - Modificare nome/cognome/telefono
  - Upload immagine profilo

- [ ] **Prenotazione campo**
  - Visualizzare campi disponibili
  - Selezionare data e orario
  - Creare prenotazione
  - Verificare stato "in_attesa"

- [ ] **Lista prenotazioni utente**
  - Visualizzare "Le mie prenotazioni"
  - Verificare prenotazione appena creata

- [ ] **Creazione evento** (se utente autorizzato/admin)
  - Creare nuovo evento
  - Verificare salvataggio
  - Visualizzare nella lista eventi

- [ ] **Visualizzazione notizie**
  - Homepage con notizie pubblicate
  - Click su notizia → visualizzazione dettaglio

- [ ] **Upload immagini**
  - Galleria: upload immagine
  - Verifica salvataggio in DB e filesystem

#### 5. Test admin (se applicabile)

- [ ] Accesso pannello admin
- [ ] Visualizzazione statistiche
- [ ] Gestione prenotazioni (accetta/rifiuta)
- [ ] Sospensione utente
- [ ] Revoca sospensione

#### 6. Verifica dati nel database

```sql
-- Contare record principali
SELECT 'utenti' as tabella, COUNT(*) FROM utenti
UNION ALL
SELECT 'prenotazioni', COUNT(*) FROM prenotazioni
UNION ALL
SELECT 'eventi', COUNT(*) FROM eventi
UNION ALL
SELECT 'notizie', COUNT(*) FROM notizie
UNION ALL
SELECT 'immagini', COUNT(*) FROM immagini;

-- Verificare ultimi record inseriti
SELECT * FROM utenti ORDER BY created_at DESC LIMIT 5;
SELECT * FROM prenotazioni ORDER BY created_at DESC LIMIT 5;
```

### Test di regressione

Dopo ogni modifica DAO, ri-eseguire i test funzionali relativi.

**Esempio**: Dopo aver modificato `dao-prenotazione.js`, testare:
- Creazione prenotazione
- Lista prenotazioni
- Cancellazione prenotazione
- Check disponibilità campi

---

## 🚀 DEPLOY IN PRODUZIONE {#deploy-produzione}

### Pre-deploy checklist

- [ ] Tutti i DAO convertiti e testati
- [ ] Test funzionali MVP completati con successo
- [ ] Database di staging popolato e testato
- [ ] Variabili ambiente production configurate
- [ ] Backup database di produzione esistente (se presente)
- [ ] Piano di rollback definito
- [ ] Downtime pianificato e comunicato (se necessario)

### Step deploy

#### 1. Preparazione database production

```bash
# Connettersi al server production
ssh user@production-server

# Creare database
createdb borgovercelli_prod -U postgres

# Eseguire schema
psql -U postgres -d borgovercelli_prod -f create_postgres_db.sql

# (Opzionale) Importare dati da dump se disponibile
# psql -U postgres -d borgovercelli_prod -f dump_data.sql
```

#### 2. Configurare variabili ambiente production

File: `.env` (su server production)

```env
PG_HOST=localhost  # o IP database server
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=<PASSWORD_SICURA>
PG_DATABASE=borgovercelli_prod

PORT=3000
NODE_ENV=production
```

#### 3. Deploy codice

```bash
# Pull codice aggiornato
git pull origin main

# Installare dipendenze
npm install --production

# (Opzionale) Build se necessario
# npm run build

# Riavviare servizio
pm2 restart borgovercelli
# oppure
systemctl restart borgovercelli
```

#### 4. Monitoraggio post-deploy

```bash
# Monitorare log applicazione
pm2 logs borgovercelli
# oppure
tail -f /var/log/borgovercelli/app.log

# Verificare connessione database
# Cercare: [database] Connected to PostgreSQL successfully
```

#### 5. Smoke test production

- Aprire homepage: verificare caricamento
- Test login con utente admin
- Visualizzare una pagina di ogni sezione principale
- Controllare metriche/errori per prime 24h

---

## ⏪ ROLLBACK {#rollback}

### Rollback rapido (se deploy fallisce)

#### Scenario 1: Errore di connessione DB

```bash
# 1. Fermare applicazione
pm2 stop borgovercelli

# 2. Ripristinare file .env con configurazione SQLite
# (tenere backup .env.sqlite-backup)
cp .env.sqlite-backup .env

# 3. Checkout versione precedente codice
git checkout <commit-pre-migrazione>

# 4. Reinstallare dipendenze vecchie
npm install

# 5. Riavviare
pm2 start borgovercelli
```

#### Scenario 2: Errori nei DAO

Se solo alcuni DAO hanno problemi:

1. Identificare il DAO problematico dai log
2. Revertire solo quel file alla versione funzionante
3. Riavviare applicazione
4. Correggere offline e re-deploy

```bash
# Revert singolo file
git checkout <commit> -- src/features/users/services/dao-user.js

# Riavvia
pm2 restart borgovercelli
```

### Ripristino completo database

Se i dati sono corrotti:

```bash
# Eliminare database corrotto
dropdb borgovercelli_prod -U postgres

# Ripristinare da backup
pg_restore -U postgres -d borgovercelli_prod backup_pre_migrazione.dump
```

---

## 🔧 TROUBLESHOOTING {#troubleshooting}

### Errori comuni e soluzioni

#### 1. `Error: connect ECONNREFUSED`

**Causa**: PostgreSQL non raggiungibile

**Soluzione**:
- Verificare PostgreSQL avviato: `systemctl status postgresql`
- Controllare host/porta in `.env`
- Verificare firewall: `sudo ufw allow 5432/tcp`

#### 2. `error: password authentication failed`

**Causa**: Credenziali errate

**Soluzione**:
- Verificare username/password in `.env`
- Controllare file `pg_hba.conf` per metodo autenticazione
- Reset password: `ALTER USER postgres PASSWORD 'newpassword';`

#### 3. `error: relation "UTENTI" does not exist`

**Causa**: Nome tabella case-sensitive o schema non creato

**Soluzione**:
- PostgreSQL è case-sensitive: usare nomi lowercase
- Verificare script conversione eseguito su tutti i DAO
- Verificare schema creato: `\dt` in psql

#### 4. `TypeError: db.get is not a function`

**Causa**: Import modulo database errato

**Soluzione**:
```javascript
// ❌ ERRATO
const db = require('./database');
db.get(...) // undefined

// ✅ CORRETTO
const db = require('./database');
// db.get, db.all, db.run sono esportati
```

#### 5. `error: bind message supplies 5 parameters, but prepared statement "" requires 3`

**Causa**: Numero placeholder non corrisponde a parametri

**Soluzione**:
- Contare placeholder `$1, $2, ...` nella query
- Contare elementi nell'array parametri
- Devono coincidere esattamente

#### 6. `UnhandledPromiseRejectionWarning`

**Causa**: Funzione async non gestisce errore

**Soluzione**:
```javascript
// ❌ ERRATO
exports.getUser = async (id) => {
    const user = await db.get(...); // può lanciare errore
    return user;
}

// ✅ CORRETTO
exports.getUser = async (id) => {
    try {
        const user = await db.get(...);
        return user;
    } catch (err) {
        throw { error: err.message };
    }
}
```

#### 7. `this.lastID is undefined`

**Causa**: Pattern SQLite non convertito

**Soluzione**:
```javascript
// ❌ ERRATO (SQLite)
db.run(sql, params, function(err) {
    const id = this.lastID;
})

// ✅ CORRETTO (PostgreSQL)
const sql = `INSERT INTO ... RETURNING id`;
const result = await db.run(sql, params);
const id = result.rows[0].id;
```

---

## 📊 METRICHE DI SUCCESSO MVP

### Criteri di accettazione

- ✅ Server si avvia senza errori
- ✅ Connessione a PostgreSQL riuscita
- ✅ Registrazione nuovo utente funziona
- ✅ Login utente funziona
- ✅ Creazione prenotazione funziona
- ✅ Visualizzazione eventi/notizie funziona
- ✅ Upload immagini funziona
- ✅ Nessun errore critico nei log per 1 ora

### Metriche di performance (opzionali)

- Tempo risposta medio endpoint < 500ms
- Nessuna query > 2 secondi
- Pool connessioni PostgreSQL < 50% utilizzo

---

## 📝 LOG DELLE MODIFICHE

### Sessione 1 - 10 Nov 2025

**Completato**:
- ✅ Installazione driver `pg`
- ✅ Creazione `.env.example`
- ✅ Conversione modulo `database.js`
- ✅ Creazione schema PostgreSQL `create_postgres_db.sql`
- ✅ Conversione automatica placeholder e funzioni date
- ✅ Creazione script helper conversione
- ✅ Documentazione MVP completa

**Prossimi step**:
- ⏳ Conversione manuale callback → async/await per tutti i DAO
- ⏳ Test funzionali completi
- ⏳ Deploy staging
- ⏳ Deploy production

---

## 📞 CONTATTI E SUPPORTO

**In caso di problemi durante la migrazione**:

1. Controllare questa documentazione (sezione Troubleshooting)
2. Verificare log applicazione e PostgreSQL
3. Consultare team backend/senior developer
4. Documentare problema e soluzione trovata in questo file

**File di log utili**:
- Application log: `pm2 logs` o `/var/log/borgovercelli/`
- PostgreSQL log: `/var/log/postgresql/postgresql-<version>-main.log`
- Query slow log: configurare in `postgresql.conf`

---

## ✅ CHECKLIST FINALE AGENTE

Prima di chiudere il task, verificare:

- [ ] Tutti i DAO convertiti (callback → async/await)
- [ ] Test funzionali MVP eseguiti e passati
- [ ] Database production creato e configurato
- [ ] Variabili ambiente production configurate
- [ ] Codice deployato in production
- [ ] Smoke test production eseguiti
- [ ] Monitoraggio attivo prime 24h
- [ ] Documentazione aggiornata con eventuali issue riscontrati
- [ ] Backup pre-migrazione disponibile per rollback

---

**Fine documento MVP Migrazione PostgreSQL**
