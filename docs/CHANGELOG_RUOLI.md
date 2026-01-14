# Changelog - Sistema Ruoli Aggiornato v2.0

## [2.0.0] - 2024-12-14

### 🎉 Aggiunte

#### Nuovi Ruoli

- **Segretario (ID: 5)**: Gestione completa di tutte le squadre e contenuti
- **Gestore Campo (ID: 6)**: Gestione dedicata di campi sportivi e prenotazioni

#### Nuove Funzionalità

- **Multi-squadra per Dirigenti**: I dirigenti possono ora gestire più squadre contemporaneamente
- **Permessi Estesi**: Presidente, Vicepresidente e Segretario hanno accesso a tutte le squadre
- **Badge Ruoli**: Visualizzazione migliorata dei ruoli nelle interfacce utente

### 🔄 Modifiche

#### Backend

- **Middleware Auth** (`src/core/middlewares/auth.js`):

  - Aggiunto `isGestoreCampo()` - verifica accesso gestore campo
  - Aggiunto `isStaffOrAdmin()` - verifica accesso staff generale
  - Aggiunto `canManageCampi()` - verifica permessi gestione campi
  - Aggiornato `isSquadraDirigente()` - supporto multi-ruolo per squadre
  - Aggiornato `canEditNotizia()` - permessi estesi per staff

- **DAO Dirigenti** (`src/features/squadre/services/dao-dirigenti-squadre.js`):

  - `getDirigenteByUserId()` ora ritorna **array** invece di singolo oggetto
  - Supporto completo per dirigenti con multiple squadre

- **Routes Admin** (`src/features/admin/routes/admin.js`):
  - Route campi ora usano `canManageCampi` invece di solo `isAdmin`
  - Route prenotazioni accessibili a Gestore Campo

#### Frontend

- **Profilo Utente** (`src/features/auth/views/profilo.ejs`):

  - Badge per nuovo ruolo Gestore Campo
  - Icona dedicata: 📋 Clipboard Check

- **Gestore Utenti** (`src/features/admin/views/Contenuti/Gestore_Utenti.ejs`):
  - Opzione Gestore Campo nei form creazione/modifica
  - Badge mobile view aggiornati
  - Visualizzazione corretta in tabella desktop

### 🗄️ Database

#### Migration

- `database/migrations/add_new_roles.sql`:
  - Inserimento ruolo Segretario (ID: 5)
  - Inserimento ruolo Gestore Campo (ID: 6)
  - Gestione conflitti con ON CONFLICT

#### Test

- `database/migrations/test_new_roles.sql`:
  - Script di verifica per nuovi ruoli
  - Test integrità referenziale
  - Verifica conteggi e permessi

### 📚 Documentazione

#### Nuovi Documenti

- `docs/SISTEMA_RUOLI_AGGIORNATO.md`:
  - Guida completa al nuovo sistema
  - Matrice permessi dettagliata
  - Istruzioni di deployment
  - Scenari di testing

#### Script

- `scripts/deploy-new-roles.sh`:
  - Script automatizzato di deployment
  - Checklist interattiva
  - Verifica step-by-step

### ⚠️ Breaking Changes

1. **DAO Dirigenti**:

   ```javascript
   // PRIMA (v1.x)
   const dirigente = await getDirigenteByUserId(userId);
   if (dirigente) {
     console.log(dirigente.squadra_id);
   }

   // DOPO (v2.0)
   const dirigenti = await getDirigenteByUserId(userId);
   if (dirigenti.length > 0) {
     dirigenti.forEach((d) => console.log(d.squadra_id));
   }
   ```

2. **Middleware isSquadraDirigente**:
   - Ora supporta anche Presidente, Vicepresidente e Segretario
   - Dirigenti verificati tramite array invece di singolo oggetto

### 🔐 Matrice Permessi Completa

| Ruolo          | Squadre      | Contenuti | Campi | Prenotazioni | Utenti | Statistiche |
| -------------- | ------------ | --------- | ----- | ------------ | ------ | ----------- |
| Admin          | ✅ Tutte     | ✅ Tutti  | ✅    | ✅           | ✅     | ✅          |
| Presidente     | ✅ Tutte     | ✅ Tutti  | ✅    | ✅           | ❌     | ❌          |
| Vicepresidente | ✅ Tutte     | ✅ Tutti  | ✅    | ✅           | ❌     | ❌          |
| Segretario     | ✅ Tutte     | ✅ Tutti  | ✅    | ✅           | ❌     | ❌          |
| Dirigente      | ⚠️ Assegnate | ⚠️ Propri | ❌    | ❌           | ❌     | ❌          |
| Gestore Campo  | ❌           | ❌        | ✅    | ✅           | ❌     | ❌          |
| Utente         | ❌           | ❌        | ❌    | ⚠️ Proprie   | ❌     | ❌          |

### 📋 Checklist Deployment

- [ ] Backup database effettuato
- [ ] Migration `add_new_roles.sql` eseguita
- [ ] Test migration passati
- [ ] Server riavviato
- [ ] Test admin completati
- [ ] Test segretario completati
- [ ] Test gestore campo completati
- [ ] Test dirigente multi-squadra completati
- [ ] Badge visualizzati correttamente

### 🐛 Bug Fix

- Nessun bug fix in questa release (nuova implementazione)

### 🔮 Roadmap Futura

- [ ] Dashboard dedicata per Gestore Campo
- [ ] Notifiche push per cambio ruolo
- [ ] Log audit per cambio permessi
- [ ] Export report per ruolo
- [ ] Multi-lingua per nomi ruoli

### 👥 Contributors

- Sistema implementato seguendo le specifiche richieste
- Design moderno e mobile-first
- Zero duplicazione di codice

### 📞 Supporto

Per problemi o domande:

- Consulta `docs/SISTEMA_RUOLI_AGGIORNATO.md`
- Verifica `database/migrations/test_new_roles.sql`
- Esegui `scripts/deploy-new-roles.sh`

---

**Versione**: 2.0.0  
**Data**: 14 Dicembre 2024  
**Tipo**: Major Release  
**Breaking Changes**: Sì (DAO Dirigenti)
