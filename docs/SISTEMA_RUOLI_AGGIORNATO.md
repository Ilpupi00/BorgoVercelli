# Sistema Ruoli Aggiornato - Borgo Vercelli

## 📋 Riepilogo Modifiche

### Nuovi Ruoli Aggiunti

1. **Segretario** (ID: 5)
   - Può vedere tutte le squadre
   - Può modificare tutte le squadre
   - Può creare e modificare notizie ed eventi
   - Ha accesso completo alla gestione contenuti

2. **Gestore Campo** (ID: 6)
   - Può accettare, confermare, annullare prenotazioni
   - Può modificare e aggiungere nuovi campi
   - Può gestire gli orari dei campi
   - Ha accesso completo alla gestione prenotazioni

### Ruoli Esistenti Aggiornati

#### Presidente (ID: 2)
- ✅ Può gestire tutte le squadre
- ✅ Può modificare notizie ed eventi
- ✅ Ha accesso completo ai contenuti

#### Vicepresidente (ID: 3)
- ✅ Può gestire tutte le squadre
- ✅ Può modificare notizie ed eventi
- ✅ Stessi permessi del Presidente

#### Dirigente (ID: 4)
- ✅ **NUOVO**: Può gestire **più squadre** contemporaneamente
- ✅ Può modificare solo le proprie notizie
- ✅ Accesso limitato alle squadre assegnate

#### Admin (ID: 1)
- ✅ Accesso completo a tutto il sistema (nessun cambiamento)

## 🗂️ File Modificati

### Backend

1. **Database**
   - `database/migrations/add_new_roles.sql` - Migration per nuovi ruoli

2. **Middleware**
   - `src/core/middlewares/auth.js`
     - Aggiunto `isGestoreCampo` middleware
     - Aggiunto `isStaffOrAdmin` middleware (Admin + Staff)
     - Aggiunto `canManageCampi` middleware (gestione campi e prenotazioni)
     - Aggiornato `isSquadraDirigente` per supportare Presidente, Vicepresidente, Segretario
     - Aggiornato `canEditNotizia` per tutti i ruoli staff

3. **DAO**
   - `src/features/squadre/services/dao-dirigenti-squadre.js`
     - `getDirigenteByUserId` ora ritorna un **array** di squadre invece di singolo oggetto
     - Supporto completo per dirigenti con multiple squadre

4. **Routes**
   - `src/features/admin/routes/admin.js`
     - Route campi ora usano `canManageCampi` invece di solo `isAdmin`
     - Route prenotazioni ora usano `canManageCampi`
   - `src/shared/routes/index.js`
     - Import aggiornati con nuovi middleware

### Frontend

1. **Views**
   - `src/features/auth/views/profilo.ejs`
     - Badge per Gestore Campo
   - `src/features/admin/views/Contenuti/Gestore_Utenti.ejs`
     - Opzione Gestore Campo nei form
     - Badge visualizzazione corretti

## 🔐 Matrice Permessi

| Funzionalità | Admin | Presidente | Vicepresidente | Segretario | Dirigente | Gestore Campo |
|-------------|-------|------------|----------------|------------|-----------|---------------|
| **Squadre** |
| Tutte le squadre | ✅ | ✅ | ✅ | ✅ | ❌ (solo assegnate) | ❌ |
| Multi-squadra | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Contenuti** |
| Notizie (tutte) | ✅ | ✅ | ✅ | ✅ | ❌ (solo proprie) | ❌ |
| Eventi | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Galleria | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Campi & Prenotazioni** |
| Gestione Campi | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Orari Campi | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Gestione Prenotazioni | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Conferma/Annulla | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Sistema** |
| Gestione Utenti | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Statistiche | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Recensioni | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## 🚀 Come Utilizzare i Nuovi Ruoli

### 1. Assegnare Ruolo Segretario
```javascript
// Dall'admin, modificare un utente e selezionare "Segretario" (ID: 5)
// Il segretario avrà accesso a:
- /admin/squadre (tutte)
- /admin/notizie
- /admin/eventi
- /admin/galleria
```

### 2. Assegnare Ruolo Gestore Campo
```javascript
// Dall'admin, modificare un utente e selezionare "Gestore Campo" (ID: 6)
// Il gestore campo avrà accesso a:
- /admin/campi
- /admin/prenotazioni
- /admin/campi/:id/orari
```

### 3. Assegnare Dirigente a Più Squadre
```sql
-- Nel database, creare più record in DIRIGENTI_SQUADRE per lo stesso utente
INSERT INTO DIRIGENTI_SQUADRE (utente_id, squadra_id, ruolo, attivo)
VALUES 
  (123, 1, 'Dirigente', true),
  (123, 3, 'Dirigente', true);
```

## 📝 Middleware Disponibili

```javascript
// Auth middleware esistenti
isLoggedIn              // Verifica login
isAdmin                 // Solo Admin
isDirigente             // Solo Dirigente
isAdminOrDirigente      // Admin o Dirigente

// Nuovi middleware
isGestoreCampo          // Solo Gestore Campo
isStaffOrAdmin          // Admin, Presidente, Vice, Segretario, Gestore
canManageCampi          // Admin, Presidente, Vice, Segretario, Gestore
isSquadraDirigente      // Admin, Presidente, Vice, Segretario o Dirigente della squadra
canEditNotizia          // Admin, Presidente, Vice, Segretario o autore
```

## 🔧 Deployment

### 1. Eseguire Migration Database
```bash
# Connettiti al database
psql -U your_user -d borgo_vercelli

# Esegui la migration
\i database/migrations/add_new_roles.sql
```

### 2. Riavviare il Server
```bash
npm restart
```

### 3. Verificare i Nuovi Ruoli
- Accedi come admin
- Vai su /admin/utenti
- Verifica che i nuovi ruoli siano disponibili nel dropdown
- Crea/Modifica un utente con i nuovi ruoli
- Testa i permessi

## ⚠️ Note Importanti

1. **Breaking Change**: `getDirigenteByUserId` ora ritorna un array invece di un singolo oggetto
2. **Compatibilità**: Tutti i riferimenti a `dirigente.squadra_id` devono essere aggiornati
3. **Multi-squadra**: Il sistema supporta ora dirigenti con più squadre contemporaneamente

## 🐛 Testing

Testare i seguenti scenari:

- [ ] Admin può accedere a tutto
- [ ] Presidente può gestire tutte le squadre
- [ ] Vicepresidente può gestire tutte le squadre  
- [ ] Segretario può gestire tutte le squadre
- [ ] Dirigente può gestire solo squadre assegnate (multi-squadra)
- [ ] Gestore Campo può gestire campi e prenotazioni
- [ ] Gestore Campo NON può accedere a squadre/utenti
- [ ] Dirigente multi-squadra può modificare tutte le sue squadre

## 📞 Supporto

Per problemi o domande, contattare l'amministratore di sistema.
