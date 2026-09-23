# Sistema Notifiche Push - Guida Operativa

## 📋 Panoramica

Il sistema di notifiche push è composto da tre componenti principali:

1. **Notification Service** (`src/shared/services/notifications.js`)
   - Accoda notifiche nel database PostgreSQL
   - Fallback automatico a invio diretto se DB non disponibile

2. **Worker** (`scripts/worker-notifications.js`)
   - Processo in background che processa le notifiche dalla coda
   - Retry automatico con backoff esponenziale
   - Cleanup notifiche vecchie e stuck

3. **WebPush Service** (`src/shared/services/webpush.js`)
   - Invio effettivo delle notifiche push tramite web-push
   - Gestione subscriptions e cleanup

## 🚀 Avvio Sistema

### 1. Avvia il Server
```powershell
npm start
```

### 2. Avvia il Worker (in un terminale separato)
```powershell
npm run worker:notifications
```

### 3. Test Sistema (opzionale)
```powershell
# Test senza accodare notifiche
npm run test:notifications

# Test con accodamento notifica di prova
npm run test:notifications:queue
```

## ⚙️ Configurazione Worker

Nel file `scripts/worker-notifications.js`:

```javascript
const CONFIG = {
    POLL_INTERVAL_MS: 2000,         // Controlla DB ogni 2 secondi
    BATCH_SIZE: 10,                  // Processa max 10 notifiche per volta
    RETRY_DELAY_BASE_MS: 2000,       // Base per backoff (2s, 4s, 8s, 16s...)
    MAX_RETRY_DELAY_MS: 120000,      // Max 2 minuti tra retry
    CLEANUP_INTERVAL_MS: 3600000,    // Cleanup ogni ora
    CLEANUP_AFTER_DAYS: 7,           // Rimuovi notifiche >7 giorni
    PROCESSING_TIMEOUT_MS: 30000,    // Timeout per singola notifica
    MAX_STUCK_MINUTES: 10            // Reset notifiche stuck >10 min
};
```

### Ottimizzazioni Consigliate

- **Basso traffico**: `POLL_INTERVAL_MS: 5000` (5 secondi)
- **Medio traffico**: `POLL_INTERVAL_MS: 2000` (2 secondi) ✅ **ATTUALE**
- **Alto traffico**: `POLL_INTERVAL_MS: 1000` (1 secondo)

## 📊 Monitoring

### Verifica Stato Sistema
```powershell
npm run test:notifications
```

Output mostra:
- ✅ Connessione database
- ✅ Tabella notifications
- 📊 Statistiche coda (pending/sending/sent/failed)
- 📱 Subscriptions registrate (admin/utenti)
- 🧪 Ultime 5 notifiche processate
- ⚠️ Notifiche stuck (se presenti)

### Log Worker

Il worker mostra log dettagliati:

```
🚀 [WORKER] Avvio worker notifiche push
[WORKER] Configurazione:
  - Poll interval: 2000ms
  - Batch size: 10
[WORKER] ✅ Connessione database OK
[WORKER] ✅ Tabella notifications OK
[WORKER] 📋 Processando notifica 123
[WORKER] Dettagli: tipo=user, attempt=1/3
[WORKER] Payload validato: "Prenotazione confermata" - Prenotazione per Campo 1...
[WORKER] Invio a 1 utente: [42]
[WEBPUSH] 📤 sendNotificationToUsers chiamato
[WEBPUSH] ✅ Notifica 1 inviata con successo
[WORKER] ✅ Notifica 123 inviata con successo (sent: 1, failed: 0)
```

### Query Diagnostiche Database

```sql
-- Statistiche coda
SELECT status, COUNT(*) as count, MIN(created_at) as oldest
FROM notifications
GROUP BY status;

-- Notifiche failed con errori
SELECT id, type, attempts, last_error, created_at
FROM notifications
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;

-- Notifiche pending in attesa
SELECT id, type, user_ids, payload->>'title' as title, 
       send_after, attempts, created_at
FROM notifications
WHERE status = 'pending'
ORDER BY priority DESC, created_at ASC;

-- Subscriptions attive
SELECT user_id, is_admin, error_count, 
       created_at, last_success_at
FROM push_subscriptions
WHERE error_count < 5
ORDER BY created_at DESC;
```

## 🐛 Troubleshooting

### Problema: Notifiche non vengono inviate

**Cause comuni:**

1. **Worker non avviato**
   ```powershell
   npm run worker:notifications
   ```

2. **Nessuna subscription registrata**
   - Verifica con: `npm run test:notifications`
   - Gli utenti devono abilitare notifiche dal browser

3. **Notifiche stuck**
   - Controllate da cleanup automatico ogni ora
   - Reset manuale: notifiche in 'sending' >10 min vengono resettate

### Problema: Errori VAPID (403)

**Causa**: Chiavi VAPID non corrispondono tra server e subscriptions.

**Soluzione:**
1. Verifica `.env` ha chiavi VAPID valide
2. Elimina vecchie subscriptions:
   ```sql
   DELETE FROM push_subscriptions;
   ```
3. Utenti devono ri-abilitare notifiche

### Problema: Errori 410/404 (subscription scadute)

**Comportamento normale** - il sistema:
- Rimuove automaticamente subscriptions scadute
- Log: `🗑️ Subscription scaduta (410) - rimozione`
- Utente deve ri-abilitare notifiche se vuole riceverle

### Problema: Worker consuma troppa CPU

**Soluzione**: Aumenta `POLL_INTERVAL_MS`
```javascript
POLL_INTERVAL_MS: 5000  // Da 2s a 5s
```

### Problema: Notifiche troppo lente

**Soluzione**: Diminuisci `POLL_INTERVAL_MS` e aumenta `BATCH_SIZE`
```javascript
POLL_INTERVAL_MS: 1000  // Da 2s a 1s
BATCH_SIZE: 20          // Da 10 a 20
```

## 📝 Gestione Errori

### Classificazione Errori

Il sistema classifica gli errori per gestirli appropriatamente:

| Errore | Status Code | Azione | Retry |
|--------|-------------|--------|-------|
| VAPID mismatch | 403 | Incrementa error_count | ✅ Si |
| Unauthorized | 401 | Fallisce immediatamente | ❌ No |
| Not Found | 404 | Rimuove subscription | ❌ No |
| Gone | 410 | Rimuove subscription | ❌ No |
| Server Error | 5xx | Incrementa error_count | ✅ Si |
| Timeout | - | Retry con backoff | ✅ Si |
| Payload invalido | - | Marca failed | ❌ No |

### Backoff Esponenziale

I retry seguono questa progressione:

| Tentativo | Delay |
|-----------|-------|
| 1 | 2s |
| 2 | 4s |
| 3 | 8s |
| 4 | 16s |
| 5 | 32s |
| 6+ | 120s (max) |

Dopo `max_attempts` (default 3), la notifica viene marcata come `failed`.

## 🔧 Manutenzione

### Pulizia Manuale Notifiche Vecchie

```sql
-- Rimuovi notifiche sent/failed >30 giorni
DELETE FROM notifications
WHERE status IN ('sent', 'failed')
  AND updated_at < NOW() - INTERVAL '30 days';
```

### Reset Notifiche Stuck

```sql
-- Reset manuale notifiche stuck
UPDATE notifications
SET status = 'pending', 
    last_error = 'Reset manuale',
    updated_at = NOW()
WHERE status = 'sending'
  AND updated_at < NOW() - INTERVAL '5 minutes';
```

### Cleanup Subscriptions Errori

```sql
-- Rimuovi subscriptions con molti errori
DELETE FROM push_subscriptions
WHERE error_count >= 10;
```

## 📈 Best Practices

1. **Avvia sempre worker in produzione**
   - Usa process manager (PM2, systemd)
   - Esempio PM2:
     ```bash
     pm2 start "npm run worker:notifications" --name "push-worker"
     pm2 save
     ```

2. **Monitora metriche**
   - Notifiche pending accumulate = worker in difficoltà
   - Failed rate alto = problema configurazione VAPID
   - Esegui `test:notifications` giornalmente

3. **Backup subscriptions**
   - Le subscriptions sono critiche
   - Backup regolare tabella `push_subscriptions`

4. **Priorità notifiche**
   - Usa `priority: 2` per notifiche critiche
   - Usa `priority: 0` per notifiche informative

5. **Rate limiting**
   - Non inviare >10 notifiche/minuto per utente
   - Usa `sendAfter` per programmare invii

## 🚦 Stati Notifica

| Stato | Descrizione |
|-------|-------------|
| `pending` | In attesa di processamento |
| `sending` | In fase di invio (worker attivo) |
| `sent` | Inviata con successo |
| `failed` | Fallita dopo max tentativi |

## 📞 Supporto

Per problemi persistenti:
1. Raccogli log: worker + server
2. Esegui diagnostica: `npm run test:notifications`
3. Controlla tabelle: `notifications` + `push_subscriptions`
4. Verifica chiavi VAPID in `.env`
