# Guida Rapida - Sistema Sospensione/Ban Utenti

## 🚀 Come Iniziare

### 1. Riavvia il Server
```bash
# Ferma il server corrente (Ctrl+C nel terminale del server)
# Oppure cerca il processo e terminalo
pkill -f "node.*www"

# Avvia il server
cd /workspaces/Sito_BorgoVercelli
npm start
```

### 2. Accedi come Amministratore
- Vai su: `http://localhost:3000/login`
- Usa le credenziali admin
- Naviga su "Pannello Admin" → "Gestione Utenti"

## 📋 Operazioni Disponibili

### Sospendere un Utente
1. Trova l'utente nella lista
2. Clicca sull'icona 🚫 (ban) nella colonna "Azioni"
3. Seleziona "Sospendi Temporaneamente"
4. Compila il form:
   - **Motivo**: Spiega perché l'utente viene sospeso
   - **Durata**: Scegli da 1 giorno a 1 anno
5. Clicca "Conferma Sospensione"
6. ✅ L'utente riceverà una email automatica

**Cosa succede:**
- L'utente non può più accedere al sito
- Riceve una email con motivo e durata
- Alla scadenza, l'account viene riattivato automaticamente
- Badge "⏸️ Sospeso" appare nella lista utenti

### Bannare un Utente (Permanente)
1. Trova l'utente nella lista
2. Clicca sull'icona 🚫 (ban) nella colonna "Azioni"
3. Seleziona "Banna Permanentemente"
4. Compila il form:
   - **Motivo**: Spiega dettagliatamente il motivo del ban
5. Clicca "Conferma Ban"
6. ✅ L'utente riceverà una email automatica

**Cosa succede:**
- L'utente non può più accedere al sito
- Riceve una email con motivo e istruzioni per richiedere lo sblocco
- Il ban è permanente finché un admin non lo revoca
- Badge "🚫 Bannato" appare nella lista utenti

### Revocare Sospensione/Ban
1. Trova l'utente sospeso/bannato nella lista (badge giallo/nero)
2. Clicca sull'icona ✓ (check-circle) nella colonna "Azioni"
3. Conferma la riattivazione
4. ✅ L'utente riceverà una email di riattivazione

**Cosa succede:**
- L'account viene immediatamente riattivato
- L'utente riceve una email di conferma
- Può accedere nuovamente al sito
- Badge "✓ Attivo" torna nella lista utenti

## 🎨 Badge di Stato

| Badge | Significato | Azioni Disponibili |
|-------|-------------|-------------------|
| ✓ Attivo (verde) | Utente normale | Visualizza, Modifica, Sospendi/Banna, Elimina |
| ⏸️ Sospeso (giallo) | Sospensione temporanea | Visualizza, Modifica, Revoca, Elimina |
| 🚫 Bannato (nero) | Ban permanente | Visualizza, Modifica, Revoca, Elimina |

## 📧 Email Automatiche

### Email di Sospensione
- **Oggetto**: "Account Sospeso - Borgo Vercelli"
- **Contenuto**: Motivo, durata, data scadenza, contatti assistenza
- **Design**: Header giallo/arancione (warning)

### Email di Ban
- **Oggetto**: "Account Bannato - Borgo Vercelli"
- **Contenuto**: Motivo, istruzioni per richiedere sblocco, contatti
- **Design**: Header rosso (danger)

### Email di Riattivazione
- **Oggetto**: "Account Riattivato - Borgo Vercelli"
- **Contenuto**: Conferma riattivazione, link per accedere
- **Design**: Header verde (success)

## 🔒 Sicurezza

### Protezioni Implementate
- ✅ Solo gli admin possono sospendere/bannare
- ✅ Utenti sospesi/bannati vengono disconnessi automaticamente
- ✅ Verifica stato ad ogni richiesta autenticata
- ✅ Log dell'admin che ha eseguito l'azione (tracciabilità)
- ✅ Verifica automatica sospensioni scadute ogni 5 minuti

### Esperienza Utente Bloccato
Se un utente sospeso/bannato tenta di accedere:
```
🚫 Account sospeso/bannato

Il tuo account è temporaneamente sospeso fino al [DATA].
Motivo: [MOTIVO]

Contatta l'amministrazione per maggiori informazioni.
```

## 🧪 Test Manuale

### Test Completo
1. **Crea un utente di test**
   - Admin → Gestione Utenti → "Crea Nuovo Utente"
   - Email: test@example.com

2. **Sospendi l'utente**
   - Clicca ban → Sospendi → 1 giorno
   - Verifica email ricevuta
   - Prova ad accedere con quell'utente → Bloccato ✓

3. **Revoca la sospensione**
   - Clicca check-circle → Conferma
   - Verifica email ricevuta
   - Prova ad accedere → Funziona ✓

4. **Banna l'utente**
   - Clicca ban → Banna Permanentemente
   - Verifica email ricevuta
   - Prova ad accedere → Bloccato ✓

5. **Revoca il ban**
   - Clicca check-circle → Conferma
   - Verifica email ricevuta
   - Prova ad accedere → Funziona ✓

## 🐛 Troubleshooting

### Email non arrivano
- Verifica configurazione SMTP in `.env`
- Controlla console server per errori email
- Le email vengono inviate in modo asincrono, non bloccano l'operazione

### Utente sospeso può ancora accedere
- Assicurati che il server sia stato riavviato dopo l'aggiornamento
- Verifica che il middleware `isLoggedIn` sia applicato alle route protette
- Controlla che la data di fine sospensione sia futura

### Modal non si aprono
- Verifica console browser per errori JavaScript
- Assicurati che Bootstrap JS sia caricato
- Controlla che le funzioni globali siano esposte (window.*)

### Database errors
- Verifica che la migrazione sia stata eseguita:
  ```bash
  sqlite3 /workspaces/Sito_BorgoVercelli/database/database.db "PRAGMA table_info(UTENTI);"
  ```
- Cerca le colonne: stato, motivo_sospensione, data_inizio_sospensione, data_fine_sospensione

## 📚 Documentazione Completa

Per informazioni tecniche dettagliate, vedi:
- `docs/SISTEMA_SOSPENSIONE_BAN.md` - Documentazione tecnica completa
- `src/services/dao-user.js` - Funzioni DAO con commenti
- `src/routes/admin.js` - API endpoints

## ✨ Features Bonus

### Verifica Automatica
Il sistema verifica automaticamente ogni 5 minuti se ci sono sospensioni scadute e le riattiva automaticamente.

### Design Moderno
- Modali responsive e accessibili
- Animazioni smooth
- Colori distintivi per ogni stato
- Icone intuitive
- Mobile-friendly

### Tracking Admin
Ogni azione viene tracciata con l'ID dell'admin che l'ha eseguita per audit e tracciabilità.

## 🎯 Best Practices

1. **Motivi Chiari**: Spiega sempre chiaramente il motivo della sospensione/ban
2. **Durata Proporzionata**: Usa durate appropriate alla gravità
3. **Comunicazione**: Gli utenti ricevono email automatiche, ma considera un follow-up per casi gravi
4. **Revisione Periodica**: Controlla periodicamente la lista utenti bannati
5. **Appeal Process**: Rispondi alle richieste di sblocco in modo tempestivo

## 📞 Supporto

Per problemi o domande:
- Email: info@borgovercelli.it
- Console del server per log dettagliati
- Browser DevTools per debugging frontend
