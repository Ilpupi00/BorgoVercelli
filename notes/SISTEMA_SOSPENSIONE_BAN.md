# Sistema di Sospensione e Ban Utenti

## Panoramica
Sistema completo per la gestione della sospensione temporanea e del ban permanente degli utenti, con notifiche email automatiche e interfaccia amministrativa integrata.

## Funzionalità Implementate

### 1. Database
**File**: `database/migrations/add_user_status.sql`

Nuove colonne aggiunte alla tabella `UTENTI`:
- `stato` (TEXT): Stato dell'utente - 'attivo', 'sospeso', 'bannato' (default: 'attivo')
- `motivo_sospensione` (TEXT): Motivo della sospensione/ban
- `data_inizio_sospensione` (TEXT): Data e ora inizio sospensione
- `data_fine_sospensione` (TEXT): Data e ora fine sospensione (NULL per ban permanente)
- `admin_sospensione_id` (INTEGER): ID dell'admin che ha applicato la sospensione/ban

### 2. Model
**File**: `src/models/user.js`

Nuovi metodi aggiunti alla classe User:
- `isAttivo()`: Verifica se l'utente è attivo
- `isSospeso()`: Verifica se l'utente è sospeso
- `isBannato()`: Verifica se l'utente è bannato
- `isSospensioneScaduta()`: Verifica se la sospensione è scaduta

### 3. DAO (Data Access Object)
**File**: `src/services/dao-user.js`

Nuove funzioni:
- `sospendiUtente(userId, adminId, motivo, dataFine)`: Sospende un utente temporaneamente
- `bannaUtente(userId, adminId, motivo)`: Banna un utente permanentemente
- `revocaSospensioneBan(userId)`: Revoca sospensione o ban
- `verificaSospensioniScadute()`: Verifica e riattiva automaticamente sospensioni scadute
- `getStatoUtente(userId)`: Recupera lo stato di un utente

Query aggiornate:
- `getAllUsers()`: Ora include i campi di stato

### 4. Email Service
**File**: `src/services/email-service.js`

Nuovi template email:
- `sendSospensioneEmail(toEmail, userName, motivo, dataFine)`: Email per notifica sospensione
- `sendBanEmail(toEmail, userName, motivo)`: Email per notifica ban
- `sendRevocaEmail(toEmail, userName)`: Email per notifica riattivazione account

Ogni email include:
- Design moderno e responsive
- Gradiente di colori appropriato (warning per sospensione, danger per ban, success per revoca)
- Informazioni complete sul motivo e durata (se applicabile)
- Istruzioni per contattare l'amministrazione

### 5. Routes API
**File**: `src/routes/admin.js`

Nuove route (riservate agli admin):
- `POST /api/admin/utenti/:id/sospendi`: Sospende un utente
  - Body: `{ motivo: string, durataGiorni: number }`
- `POST /api/admin/utenti/:id/banna`: Banna un utente
  - Body: `{ motivo: string }`
- `POST /api/admin/utenti/:id/revoca`: Revoca sospensione/ban
- `GET /api/admin/utenti/:id/stato`: Recupera lo stato di un utente

### 6. Middleware di Autenticazione
**File**: `src/middlewares/auth.js`

Aggiornamento `isLoggedIn` middleware:
- Verifica automaticamente lo stato dell'utente ad ogni richiesta
- Blocca l'accesso agli utenti bannati
- Blocca l'accesso agli utenti sospesi
- Verifica automaticamente se la sospensione è scaduta e riattiva l'account
- Mostra messaggi appropriati per ogni stato

### 7. Frontend - Vista Amministratore
**File**: `src/views/Admin/Contenuti/Gestore_Utenti.ejs`

Modifiche:
- Badge di stato per ogni utente (Attivo, Sospeso, Bannato)
- Pulsante "Sospendi/Banna" per utenti attivi
- Pulsante "Revoca" per utenti sospesi/bannati
- Colori distintivi per ogni stato

Nuovi modali:
1. **Modal Scelta** (`sceltaSospendiBanModal`): Scelta tra sospensione e ban
2. **Modal Sospensione** (`sospensioneModal`): Form per sospendere con motivo e durata
3. **Modal Ban** (`banModal`): Form per bannare con motivo
4. **Modal Revoca** (`revocaModal`): Conferma riattivazione account

### 8. Frontend - JavaScript
**File**: `src/public/javascripts/components/Gestore_utenti.js`

Nuove funzioni (classe GestoreUtente):
- `mostraSospendiBan(id, nome, cognome)`: Mostra modal di scelta
- `mostraSospensione()`: Mostra modal sospensione
- `mostraBan()`: Mostra modal ban
- `tornaScelta()`: Ritorna al modal di scelta
- `confermaSospensione()`: Invia richiesta di sospensione
- `confermaBan()`: Invia richiesta di ban
- `revocaSospensioneBan(id, nome, cognome)`: Mostra modal revoca
- `confermaRevoca()`: Invia richiesta di revoca

Tutte le funzioni sono esposte globalmente per essere chiamate dai template EJS.

### 9. Stili CSS
**File**: `src/public/stylesheets/Admin.css`

Nuovi stili:
- Stili per modali con bordi arrotondati
- Animazioni per pulsanti hover
- Stili per badge di stato
- Responsive design per mobile
- Colori distintivi per header modali (warning, danger, success)

### 10. Verifica Automatica
**File**: `src/app.js`

Middleware aggiunto:
- Verifica automatica ogni 5 minuti delle sospensioni scadute
- Riattivazione automatica degli account con sospensione scaduta
- Esecuzione in background senza bloccare le richieste

## Flusso di Utilizzo

### Sospendere un Utente
1. Admin accede a "Gestione Utenti"
2. Clicca su icona "ban" per un utente attivo
3. Seleziona "Sospendi Temporaneamente"
4. Inserisce motivo e seleziona durata (da 1 giorno a 1 anno)
5. Conferma l'azione
6. L'utente riceve una email con tutti i dettagli
7. L'utente non può più accedere fino alla scadenza

### Bannare un Utente
1. Admin accede a "Gestione Utenti"
2. Clicca su icona "ban" per un utente attivo
3. Seleziona "Banna Permanentemente"
4. Inserisce motivo dettagliato
5. Conferma l'azione
6. L'utente riceve una email di notifica
7. L'utente non può più accedere (permanente)

### Revocare Sospensione/Ban
1. Admin accede a "Gestione Utenti"
2. Clicca su icona "check-circle" per un utente sospeso/bannato
3. Conferma la riattivazione
4. L'utente riceve una email di riattivazione
5. L'utente può nuovamente accedere

### Esperienza Utente
**Utente Bannato tenta il login:**
- Viene immediatamente disconnesso
- Vede messaggio: "Account bannato: il tuo account è stato bannato dal sito. Contatta l'amministrazione..."

**Utente Sospeso tenta il login:**
- Viene immediatamente disconnesso
- Vede messaggio con data fine sospensione e motivo
- Se la sospensione è scaduta, viene riattivato automaticamente

**Utente Sospeso durante navigazione:**
- Se la sospensione viene applicata mentre è loggato
- Alla prossima richiesta autenticata viene disconnesso
- Vede il messaggio appropriato

## Sicurezza e Permessi

- Tutte le route API sono protette da middleware `isAdmin`
- Solo gli amministratori (tipo_utente_id = 1) possono sospendere/bannare
- L'ID dell'admin viene salvato per tracciabilità
- Gli utenti bannati/sospesi vengono automaticamente disconnessi
- Verifica dello stato ad ogni richiesta autenticata

## Email Template

Tutti i template email includono:
- Design responsive e moderno
- Branding "Borgo Vercelli"
- Colori distintivi per tipo di notifica
- Informazioni complete e chiare
- Link di contatto amministrazione
- Footer con informazioni società

## Compatibilità

- Database: SQLite
- Node.js: >= 14.x
- Express: >= 4.x
- Bootstrap: 5.3.4
- Bootstrap Icons: 1.11.3

## Note di Implementazione

1. **Verifica automatica**: Ogni 5 minuti il sistema controlla le sospensioni scadute
2. **Email asincrone**: L'invio email non blocca l'operazione principale
3. **OOP JavaScript**: Tutto il codice JS frontend è in classe ES6
4. **Design System**: Rispetta le linee guida Web 2.0 del progetto
5. **Responsive**: Tutti i componenti sono completamente responsive
6. **Accessibilità**: Uso appropriato di aria-labels e focus management

## Future Implementazioni

- Log delle azioni di sospensione/ban per audit
- Dashboard statistiche sospensioni/ban
- Notifiche push per utenti
- Sistema di appeal per utenti bannati
- Sospensione graduale (warning, sospensione breve, sospensione lunga, ban)
