# Riepilogo Migrazione SQLite → PostgreSQL

## 📋 Modifiche Effettuate

### 1. Configurazione Database (`src/core/config/database.js`)
- ✅ Rimosso supporto SQLite
- ✅ Implementato pool di connessioni PostgreSQL usando `pg`
- ✅ Richiesta obbligatoria di `DATABASE_URL` (app termina se assente)
- ✅ Supporto SSL automatico (in produzione o se `PGSSLMODE=require`)
- ✅ Wrapper di compatibilità con API sqlite3-like (`.get()`, `.all()`, `.run()`)
- ✅ Conversione automatica dei placeholder `?` → `$1, $2, $n` per Postgres

### 2. Conversioni SQL Implementate

#### Funzioni DateTime
| SQLite | PostgreSQL |
|--------|-----------|
| `datetime('now')` | `NOW()` |
| `date('now')` | `CURRENT_DATE` |
| `date('now', '-30 days')` | `CURRENT_DATE - INTERVAL '30 days'` |
| `date('now', '-6 months')` | `CURRENT_DATE - INTERVAL '6 months'` |
| `datetime('now', '-30 days')` | `NOW() - INTERVAL '30 days'` |
| `strftime('%Y-%m', campo)` | `TO_CHAR(campo, 'YYYY-MM')` |

#### Tipi Booleani
| SQLite | PostgreSQL |
|--------|-----------|
| `attivo = 1` | `attivo = true` |
| `attivo = 0` | `attivo = false` |
| `pubblicata = 1` | `pubblicata = true` |
| `visibile = 0` | `visibile = false` |
| `SET attivo = 1` | `SET attivo = true` |

#### Confronti Timestamp
```sql
-- SQLite (vecchio)
datetime(data_prenotazione || ' ' || substr((ora_fine || ':00'), 1, 8)) <= datetime('now')

-- PostgreSQL (nuovo)
(data_prenotazione::timestamp + (COALESCE(ora_fine, '00:00')::time)) <= NOW()
```

### 3. File Modificati

#### DAO Files (Data Access Objects)
- ✅ `src/features/prenotazioni/services/dao-prenotazione.js`
- ✅ `src/features/prenotazioni/services/dao-campi.js`
- ✅ `src/features/squadre/services/dao-squadre.js`
- ✅ `src/features/squadre/services/dao-dirigenti-squadre.js`
- ✅ `src/features/users/services/dao-user.js`
- ✅ `src/features/recensioni/services/dao-recensioni.js`
- ✅ `src/features/notizie/services/dao-notizie.js`
- ✅ `src/features/eventi/services/dao-eventi.js`

#### Configurazione e Deployment
- ✅ `src/core/config/database.js` - Connessione Postgres-only
- ✅ `package.json` - Aggiunta dipendenza `pg`
- ✅ `.env.example` - Documentazione variabili ambiente
- ✅ `Procfile` - Configurazione Railway
- ✅ `RAILWAY.md` - Guida deployment
- ✅ `scripts/test-db.js` - Script test connessione

### 4. Schema Database

#### File Schema PostgreSQL
- ✅ `create_postgres_db.sql` - Schema completo per Postgres
  - Tutte le tabelle con tipi Postgres nativi
  - Uso di `SERIAL` invece di `AUTOINCREMENT`
  - Campi `BOOLEAN` invece di `INTEGER (0/1)`
  - Vincoli di integrità referenziale
  - Indici e chiavi uniche

## 🔧 Dipendenze Aggiunte

```json
{
  "pg": "^8.11.0"
}
```

## 📝 Variabili d'Ambiente Richieste

### Railway (Produzione)
```bash
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production  # Opzionale, attiva SSL
```

### Locale (Sviluppo)
```bash
DATABASE_URL=postgresql://localhost:5432/borgo_vercelli
# oppure
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_password
PG_DATABASE=borgo_vercelli
```

## 🚀 Come Testare

### Test Connessione Database
```bash
# Imposta DATABASE_URL nel tuo .env
node scripts/test-db.js
```

### Avvio Applicazione
```bash
npm start
```

## ✅ Checklist Migrazione

- [x] Rimossa dipendenza da SQLite
- [x] Aggiunto supporto PostgreSQL
- [x] Convertite tutte le funzioni `datetime()`
- [x] Convertiti tutti i booleani da 1/0 a true/false
- [x] Convertite tutte le funzioni `strftime()`
- [x] Convertite tutte le funzioni `date()`
- [x] Aggiornati placeholder `?` → `$n` (automatico nel wrapper)
- [x] Testata compatibilità timestamp
- [x] Documentazione aggiornata
- [x] Script di test creato

## 📋 Operazioni Rimanenti

### Prima del Deploy su Railway
1. ✅ Verificare che il servizio Railway abbia il plugin PostgreSQL attivo
2. ✅ Verificare che `DATABASE_URL` sia impostato automaticamente
3. ⚠️ **Eseguire lo schema iniziale:**
   ```bash
   # Opzione 1: Manualmente via psql
   psql $DATABASE_URL -f create_postgres_db.sql
   
   # Opzione 2: Tramite pgAdmin o Railway GUI
   ```
4. ⚠️ **Migrare i dati da SQLite (se necessario):**
   - Esportare dati da SQLite
   - Trasformare dump per Postgres
   - Importare in Railway

### Testing Post-Deploy
1. Verificare connessione al database
2. Testare funzionalità CRUD
3. Verificare prenotazioni e gestione date
4. Testare statistiche dashboard admin
5. Verificare gestione immagini

## 🐛 Problemi Noti Risolti

1. ✅ **Placeholder mismatch**: Risolto con conversione automatica `?` → `$n`
2. ✅ **datetime() non esiste**: Sostituito con `NOW()`
3. ✅ **Booleani come interi**: Convertiti a `true/false`
4. ✅ **strftime() non esiste**: Sostituito con `TO_CHAR()`
5. ✅ **date() con intervalli**: Sostituito con `CURRENT_DATE - INTERVAL`
6. ✅ **Confronto timestamp**: Usato cast esplicito `::timestamp` e `::time`

## 📚 Risorse Utili

- [PostgreSQL Date/Time Functions](https://www.postgresql.org/docs/current/functions-datetime.html)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)
- [node-postgres (pg) Documentation](https://node-postgres.com/)
- [Railway PostgreSQL Plugin](https://docs.railway.app/databases/postgresql)

## 🎯 Prossimi Passi Consigliati

1. **Eseguire migrazione dati** se hai dati esistenti in SQLite
2. **Testare l'applicazione** su Railway con dati reali
3. **Configurare backup automatici** su Railway
4. **Monitorare le query lente** con pg_stat_statements
5. **Ottimizzare indici** basandosi sull'uso reale

---

**Data Migrazione**: 11 Novembre 2024  
**Versione**: 1.0.0  
**Status**: ✅ Completata - Pronta per deploy su Railway
