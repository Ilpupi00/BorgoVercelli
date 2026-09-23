# Sistema di Promemoria Automatico Prenotazioni

## Data implementazione
29 Novembre 2025

## Obiettivo
Implementare un sistema automatico che invia notifiche push agli utenti 2 ore prima dell'inizio della loro prenotazione confermata.

## Modifiche Implementate

### 1. Database - Nuova Colonna `reminder_sent`

**File**: `database/migrations/add_reminder_sent_to_prenotazioni.sql`

Aggiunta colonna `reminder_sent` alla tabella `PRENOTAZIONI`:
- **Tipo**: BOOLEAN
- **Default**: FALSE
- **Scopo**: Tracciare se il promemoria è già stato inviato per evitare duplicati

**Indice Creato**:
```sql
CREATE INDEX idx_prenotazioni_reminder_check 
ON PRENOTAZIONI (stato, reminder_sent, data_prenotazione, ora_inizio)
WHERE stato = 'confermata' AND reminder_sent = false;
```

Questo indice parziale ottimizza le query del worker che cerca solo prenotazioni confermate senza promemoria inviato.

### 2. Worker di Promemoria

**File**: `src/server/workers/booking-reminder-worker.js`

Nuovo worker che:
- Controlla ogni **10 minuti** se ci sono prenotazioni imminenti
- Invia notifiche **2 ore prima** dell'inizio (con finestra di tolleranza di ±15 minuti)
- Marca le prenotazioni come `reminder_sent = true` dopo l'invio
- Processa solo prenotazioni con stato `confermata`
- Lavora solo su prenotazioni del giorno corrente

**Configurazione**:
```javascript
const CONFIG = {
    CHECK_INTERVAL_MS: 60000 * 10,  // Controlla ogni 10 minuti
    REMINDER_HOURS_BEFORE: 2,        // Invia promemoria 2 ore prima
    REMINDER_WINDOW_MINUTES: 15      // Finestra di tolleranza ±15 minuti
};
```

**Funzioni Principali**:
1. `getBookingsNeedingReminder()` - Query per trovare prenotazioni da notificare
2. `sendBookingReminder(booking)` - Invia la notifica push
3. `markReminderSent(bookingId)` - Marca come inviato
4. `processReminders()` - Loop principale di controllo

### 3. Query SQL del Worker

```sql
SELECT 
    p.id,
    p.utente_id,
    p.campo_id,
    p.data_prenotazione as data,
    p.ora_inizio,
    p.ora_fine,
    p.reminder_sent,
    c.nome as campo_nome,
    u.nome as utente_nome,
    u.cognome as utente_cognome
FROM PRENOTAZIONI p
JOIN CAMPI c ON p.campo_id = c.id
JOIN UTENTI u ON p.utente_id = u.id
WHERE p.stato = 'confermata'
AND p.reminder_sent = false
AND p.data_prenotazione = CURRENT_DATE
AND (
    EXTRACT(EPOCH FROM (
        (p.data_prenotazione + p.ora_inizio::time) - NOW()
    )) / 3600 
) BETWEEN 1.75 AND 2.25
ORDER BY p.data_prenotazione, p.ora_inizio
```

Questa query trova prenotazioni che:
- Sono confermate
- Non hanno già ricevuto promemoria
- Sono previste per oggi
- Iniziano tra 1.75 e 2.25 ore (2 ore ±15 minuti)

### 4. Formato Notifica Push

```javascript
{
    title: '⚽ Promemoria Prenotazione',
    body: 'Ciao [Nome]! Tra 2 ore hai la prenotazione al [Campo] (HH:MM - HH:MM)',
    icon: '/assets/images/Logo.png',
    badge: '/assets/images/Logo.png',
    data: {
        url: '/profilo',
        type: 'booking_reminder',
        booking_id: id
    },
    actions: [
        {
            action: 'view',
            title: 'Vedi Prenotazione'
        }
    ]
}
```

### 5. Integrazione nel Server

**File**: `src/server/www`

Il worker viene avviato automaticamente all'avvio del server:

```javascript
try {
    const bookingReminderWorker = require('./workers/booking-reminder-worker');
    bookingReminderWorker.start();
    console.log('✅ Booking Reminder Worker avviato');
} catch (error) {
    console.error('❌ Errore avvio Booking Reminder Worker:', error.message);
}
```

### 6. Fix Endpoint Prenotazioni Utente

**Problema**: Endpoint `/api/prenotazioni/user/:id` non esisteva, causando errore 404 in "Visualizza Utente"

**Soluzione**:
1. Aggiunto endpoint in `src/features/prenotazioni/routes/prenotazione.js`:
```javascript
router.get('/prenotazioni/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const prenotazioni = await daoPrenotazione.getPrenotazioniByUserId(userId);
        res.json(prenotazioni);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
```

2. Corretto URL nel frontend (`Gestore_utenti.js`):
```javascript
const responsePrenotazioni = await fetch(`/prenotazione/prenotazioni/user/${id}`);
```

**Nota**: L'endpoint usa il prefisso `/prenotazione` configurato in `app.js`

## Come Funziona il Flusso Completo

1. **Creazione Prenotazione**: `reminder_sent` viene impostato a `false` di default
2. **Conferma Admin**: La prenotazione passa a stato `confermata`
3. **Controllo Worker**: Ogni 10 minuti, il worker cerca prenotazioni che iniziano tra ~2 ore
4. **Invio Notifica**: Se trova prenotazioni, invia notifica push tramite `queueNotificationForUsers`
5. **Marcatura**: Imposta `reminder_sent = true` per evitare re-invio
6. **Ricezione Utente**: L'utente riceve la notifica sul dispositivo con push attivo

## Log di Sistema

Il worker produce log dettagliati:
```
[BOOKING-REMINDER] 🔍 Controllo prenotazioni per promemoria...
[BOOKING-REMINDER] 📋 Trovate 3 prenotazione/i da notificare
[BOOKING-REMINDER] 📬 Invio promemoria per prenotazione 71 a utente 2
[BOOKING-REMINDER] 📋 Dettagli: Calcio a 5 - venerdì 29 novembre 19:00-20:00
[BOOKING-REMINDER] ✅ Promemoria inviato con successo per prenotazione 71
[BOOKING-REMINDER] 📊 Riepilogo: 3 successo, 0 falliti
```

## Configurazione Personalizzabile

Per modificare il timing dei promemoria, editare `CONFIG` in `booking-reminder-worker.js`:

```javascript
const CONFIG = {
    CHECK_INTERVAL_MS: 60000 * 10,    // Frequenza controllo
    REMINDER_HOURS_BEFORE: 2,          // Ore prima della prenotazione
    REMINDER_WINDOW_MINUTES: 15        // Finestra di tolleranza
};
```

## Testing

### Test Manuale
1. Creare una prenotazione confermata che inizia tra ~2 ore
2. Verificare che `reminder_sent` sia `false`
3. Attendere il prossimo ciclo del worker (max 10 minuti)
4. Verificare ricezione notifica push
5. Verificare che `reminder_sent` sia `true` nel database

### Test Immediato
Eseguire manualmente da Node.js console:
```javascript
const worker = require('./src/server/workers/booking-reminder-worker');
await worker.processReminders();
```

## Dipendenze
- Sistema notifiche push configurato (VAPID keys)
- Utenti con subscription push attive
- Database PostgreSQL con colonna `reminder_sent`
- Worker notifiche principale già attivo

## Note Importanti

1. **Precisione Timing**: Il promemoria viene inviato nella finestra 1h45m - 2h15m prima dell'inizio
2. **Una Sola Volta**: Grazie a `reminder_sent`, ogni prenotazione riceve max 1 promemoria
3. **Solo Confermate**: Prenotazioni in attesa o annullate non ricevono promemoria
4. **Solo Oggi**: Controlla solo prenotazioni del giorno corrente per efficienza
5. **Graceful Degradation**: Se push non configurato, il worker continua senza errori fatali

## Possibili Miglioramenti Futuri

- [ ] Configurazione orario promemoria da admin panel
- [ ] Notifiche multiple (es. 1 giorno prima + 2 ore prima)
- [ ] Email di backup se push non disponibile
- [ ] Dashboard con statistiche promemoria inviati
- [ ] Test A/B su timing ottimale promemoria
- [ ] Possibilità utente di disabilitare promemoria nel profilo
