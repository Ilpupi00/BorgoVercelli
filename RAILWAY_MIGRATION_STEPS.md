# Railway Database Migration Steps

## Overview
This document contains the steps needed to update your Railway PostgreSQL database to match the schema expected by your application code.

## Critical Issues Found

### 1. Missing Columns in Tables
Several tables are missing columns that the application code expects to exist.

### 2. this.lastID Pattern
Many DAO files still use `this.lastID` which doesn't work with PostgreSQL. They need to use the RETURNING clause instead.

### 3. Boolean Comparisons
Some queries still use `attivo = 1` or `pubblicato = 1` instead of `true`.

---

## Step 1: Update Database Schema

Connect to your Railway PostgreSQL database and run these ALTER TABLE statements:

```sql
-- Add missing columns to CAMPIONATI table
ALTER TABLE CAMPIONATI ADD COLUMN IF NOT EXISTS promozione_diretta INTEGER DEFAULT 2;
ALTER TABLE CAMPIONATI ADD COLUMN IF NOT EXISTS playoff_start INTEGER;
ALTER TABLE CAMPIONATI ADD COLUMN IF NOT EXISTS playoff_end INTEGER;
ALTER TABLE CAMPIONATI ADD COLUMN IF NOT EXISTS playout_start INTEGER;
ALTER TABLE CAMPIONATI ADD COLUMN IF NOT EXISTS playout_end INTEGER;
ALTER TABLE CAMPIONATI ADD COLUMN IF NOT EXISTS retrocessione_diretta INTEGER DEFAULT 2;

-- Add missing columns to CAMPI table
ALTER TABLE CAMPI ADD COLUMN IF NOT EXISTS descrizione TEXT;
ALTER TABLE CAMPI ADD COLUMN IF NOT EXISTS Docce BOOLEAN;

-- Add missing columns to GIOCATORI table
ALTER TABLE GIOCATORI ADD COLUMN IF NOT EXISTS Nome VARCHAR(255);
ALTER TABLE GIOCATORI ADD COLUMN IF NOT EXISTS Cognome VARCHAR(255);
ALTER TABLE GIOCATORI ADD COLUMN IF NOT EXISTS Nazionalità VARCHAR(255);
ALTER TABLE GIOCATORI ADD COLUMN IF NOT EXISTS immagini_id INTEGER;

-- Add foreign key for GIOCATORI.immagini_id (if IMMAGINI table exists)
ALTER TABLE GIOCATORI ADD CONSTRAINT fk_giocatori_immagini 
    FOREIGN KEY (immagini_id) REFERENCES IMMAGINI(id);

-- Add missing TIPI_UTENTE records (Admin and Regular User)
-- ID 1 = Amministratore (used by admin checks in code)
-- ID 5 = Utente normale (default for new registrations)
INSERT INTO TIPI_UTENTE (id, nome, descrizione) VALUES (1, 'Amministratore', 'Amministratore del sistema') ON CONFLICT (id) DO NOTHING;
INSERT INTO TIPI_UTENTE (id, nome, descrizione) VALUES (5, 'Utente', 'Utente normale del sistema') ON CONFLICT (id) DO NOTHING;
```

---

## Step 2: Remaining Code Issues to Fix

### Files with `this.lastID` that need RETURNING clause:

1. **src/features/squadre/services/dao-squadre.js**
   - Line 139: `createSquadra()` ✅ NEEDS FIX
   - Line 475: Uses `this.lastID` in nested callback ✅ NEEDS FIX

2. **src/features/prenotazioni/services/dao-prenotazione.js**
   - Line 236: INSERT prenotazione ✅ NEEDS FIX

3. **src/features/users/services/dao-user.js**
   - Line 291: INSERT user ✅ NEEDS FIX

4. **src/features/squadre/services/dao-dirigenti-squadre.js**
   - Line 99: INSERT dirigente ✅ NEEDS FIX
   - Line 167: INSERT dirigente ✅ NEEDS FIX

5. **src/features/recensioni/services/dao-recensioni.js**
   - Line 86: INSERT recensione ✅ NEEDS FIX

6. **src/features/prenotazioni/services/dao-campi.js**
   - Line 142: INSERT campo ✅ NEEDS FIX
   - Line 218: INSERT orario ✅ NEEDS FIX

7. **src/features/notizie/services/dao-notizie.js**
   - Line 171: INSERT notizia ✅ NEEDS FIX

8. **src/features/eventi/services/dao-eventi.js**
   - Line 122: INSERT evento ✅ NEEDS FIX

9. **src/features/campionati/services/dao-campionati.js**
   - Line 201: INSERT campionato ✅ NEEDS FIX
   - Line 449: INSERT squadra_campionato ✅ NEEDS FIX

10. **src/features/galleria/services/dao-galleria.js**
    - Line 203: INSERT ✅ NEEDS FIX
    - Line 245: INSERT ✅ NEEDS FIX

### Pattern to Fix:

**BEFORE (SQLite pattern):**
```javascript
sqlite.run(sql, params, function(err) {
    if (err) return reject(err);
    resolve({ id: this.lastID });
});
```

**AFTER (PostgreSQL pattern):**
```javascript
const sql = `INSERT INTO ... RETURNING id`;
sqlite.run(sql, params, function(err, result) {
    if (err) return reject(err);
    resolve({ id: result.rows[0].id });
});
```

---

## Step 3: Files Already Fixed

✅ **src/features/galleria/services/dao-galleria.js** - `insertImmagine()` (line ~88)
✅ **src/features/squadre/services/dao-squadre.js** - `createGiocatore()` (line ~293)
✅ **src/features/squadre/services/dao-squadre.js** - `addGiocatore()` (line ~384)
✅ **src/features/eventi/services/dao-eventi.js** - Removed `immagini_id` from SELECTs
✅ **src/features/campionati/services/dao-campionati.js** - Fixed `attivo = 1` → `attivo = true`
✅ **create_postgres_db.sql** - Updated with all missing columns

---

## Step 4: Verification Checklist

After running the ALTER TABLE statements and deploying updated code:

- [ ] CAMPIONATI table has all 6 new columns
- [ ] CAMPI table has descrizione and Docce columns
- [ ] GIOCATORI table has Nome, Cognome, Nazionalità, immagini_id columns
- [ ] No more "column does not exist" errors in Railway logs
- [ ] No more "Cannot read properties of undefined (reading 'lastID')" errors
- [ ] All INSERT operations return proper IDs
- [ ] Application functions correctly

---

## Priority Order

1. **IMMEDIATE**: Run the ALTER TABLE statements on Railway (Step 1)
2. **HIGH**: Fix remaining `this.lastID` issues in all DAO files (Step 2)
3. **MEDIUM**: Re-test all create/insert operations
4. **LOW**: Review for any other SQLite-specific patterns

---

## Notes

- The `immagini_id` column was NOT added to the EVENTI table because events are linked to images via `IMMAGINI.entita_id`, not the other way around
- All boolean comparisons should use `true`/`false` instead of `1`/`0`
- The database wrapper already handles `?` → `$1, $2, ...` conversion
- RETURNING clause is the PostgreSQL way to get inserted IDs

