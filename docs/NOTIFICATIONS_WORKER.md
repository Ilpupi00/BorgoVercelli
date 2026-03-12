# Sistema di Notifiche Push con Worker

Sistema completo di gestione notifiche push con accodamento su database e worker asincrono.

## 📋 Architettura

```
┌─────────────────┐
│  Route Handler  │ (prenotazione.js)
└────────┬────────┘
         │ accoda notifica
         ▼
┌─────────────────────┐
│ Notifications Queue │ (notifications table)
└────────┬────────────┘
         │ polling ogni 5s
         ▼
┌─────────────────┐
│     Worker      │ (worker-notifications.js)
└────────┬────────┘
         │ invia via web-push
         ▼
┌─────────────────┐
│  Push Service   │ (webpush.js)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Browser FCM   │
└─────────────────┘
```

## 🚀 Setup

### 1. Applica la Migration

```bash
node scripts/apply-notifications-migration.js
```

Questo crea la tabella `notifications` con:

- `id`: ID univoco notifica
- `type`: 'admin' | 'user' | 'all'
- `user_ids`: Array di user_id per notifiche targeted
- `payload`: JSON con title, body, icon, url, tag, requireInteraction
- `status`: 'pending' | 'sending' | 'sent' | 'failed'
- `priority`: 0 (normale), 1 (alta), 2 (critica)
- `send_after`: Timestamp per notifiche programmate
- `attempts` / `max_attempts`: Gestione retry
- `last_error`: Ultimo errore incontrato
- Timestamps: created_at, updated_at, sent_at

### 2. Avvia il Worker

```bash
npm run worker:notifications
```

Oppure in produzione con PM2:

```bash
pm2 start scripts/worker-notifications.js --name notifications-worker
pm2 save
```

### 3. Usa il Servizio nelle Route

```javascript
const notifications = require("../../../shared/services/notifications");

// Notifica agli admin
await notifications.queueNotificationForAdmins({
  title: "🔔 Nuova Prenotazione",
  body: "Campo 1 - 28/11/2025 dalle 10:00 alle 11:00",
  icon: "/assets/images/Logo.png",
  url: "/admin",
  tag: "prenotazione-123",
  requireInteraction: true,
});

// Notifica a utenti specifici
await notifications.queueNotificationForUsers([userId1, userId2], {
  title: "✅ Prenotazione Confermata",
  body: "La tua prenotazione è stata confermata",
  url: "/users/mie-prenotazioni",
});

// Notifica a tutti (broadcast)
await notifications.queueNotificationForAll({
  title: "📢 Annuncio Importante",
  body: "Il campo sarà chiuso domani per manutenzione",
});
```

### 4. Notifiche Programmate e Priorità

```javascript
// Invia tra 1 ora
await notifications.queueNotificationForUsers([userId], payload, {
  sendAfter: new Date(Date.now() + 3600000),
});

// Alta priorità (processata prima)
await notifications.queueNotificationForAdmins(payload, {
  priority: 1,
});

// Più tentativi di retry
await notifications.queueNotificationForUsers([userId], payload, {
  maxAttempts: 5,
});
```

## ⚙️ Configurazione Worker

Modifica `scripts/worker-notifications.js`:

```javascript
const CONFIG = {
  POLL_INTERVAL_MS: 5000, // Polling interval (5 secondi)
  BATCH_SIZE: 10, // Notifiche per batch
  RETRY_DELAY_BASE_MS: 1000, // Base backoff esponenziale
  MAX_RETRY_DELAY_MS: 60000, // Max delay retry (1 minuto)
  CLEANUP_INTERVAL_MS: 3600000, // Cleanup ogni ora
  CLEANUP_AFTER_DAYS: 7, // Rimuovi notifiche dopo 7 giorni
};
```

## 🔄 Gestione Retry e Errori

Il worker implementa:

- **Backoff esponenziale**: 1s → 2s → 4s → 8s → 16s → max 60s
- **Max retry**: Configurabile per notifica (default 3)
- **Gestione errori specifici**:
  - `410 Gone` / `404 Not Found`: Rimuove subscription automaticamente
  - `403 Forbidden` (VAPID mismatch): Marca subscription per re-subscribe
  - Altri errori: Retry con backoff

## 📊 Monitoraggio

### Statistiche nel Log del Worker

Il worker stampa ogni ora:

```
[WORKER] 📊 Statistiche:
  Processate: 145
  Fallite: 3
  pending: 5 (oldest: 2025-11-28T10:00:00.000Z)
  sent: 140
  failed: 3
```

### Query DB per Monitoraggio

```sql
-- Notifiche in coda
SELECT COUNT(*) FROM notifications WHERE status = 'pending';

-- Notifiche fallite
SELECT * FROM notifications WHERE status = 'failed' ORDER BY updated_at DESC;

-- Performance ultimi 7 giorni
SELECT
    DATE(created_at) as date,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) as avg_delay_seconds
FROM notifications
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## 🛠️ Troubleshooting

### Worker non processa notifiche

1. Verifica che il worker sia in esecuzione: `ps aux | grep worker-notifications`
2. Controlla i log del worker per errori
3. Verifica connessione DB: `SELECT 1 FROM notifications;`
4. Controlla che ci siano notifiche pending: `SELECT * FROM notifications WHERE status = 'pending';`

### Notifiche non arrivano

1. Verifica che le notifiche siano in status 'sent': `SELECT * FROM notifications WHERE id = X;`
2. Controlla subscription attive: `SELECT * FROM push_subscriptions WHERE user_id = X;`
3. Verifica VAPID key consistency
4. Controlla browser console e service worker logs

### Performance lente

1. Aumenta `BATCH_SIZE` nel worker
2. Riduci `POLL_INTERVAL_MS` (più polling frequenti)
3. Aggiungi più worker in parallelo (usano `FOR UPDATE SKIP LOCKED`)
4. Ottimizza indici DB:
   ```sql
   ANALYZE notifications;
   REINDEX TABLE notifications;
   ```

## 🔐 Sicurezza

- Le notifiche sono processate dal worker separato dal web server
- Fallback automatico a invio diretto se DB non disponibile
- Validazione user_ids per notifiche targeted
- Rate limiting può essere implementato a livello worker

## 🚢 Deploy su Railway

Aggiungi il worker come processo separato in `railway.toml`:

```toml
[[services]]
name = "web"
command = "npm start"

[[services]]
name = "worker"
command = "npm run worker:notifications"
```

Oppure usa un singolo dyno con PM2:

```json
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'web',
      script: './src/server/www',
      instances: 1
    },
    {
      name: 'worker-notifications',
      script: './scripts/worker-notifications.js',
      instances: 1
    }
  ]
};
```

```bash
pm2 start ecosystem.config.js
```

## 📝 Note Implementative

- **Transazionalità**: Il worker usa `FOR UPDATE SKIP LOCKED` per lock ottimistico
- **Idempotenza**: Le notifiche hanno `tag` univoco per evitare duplicati nel browser
- **Cleanup automatico**: Notifiche sent/failed vengono rimosse dopo 7 giorni
- **Fallback safety**: Se il DB non è disponibile, le notifiche vengono inviate direttamente

## 🎯 Best Practices

1. **Priorità**: Usa priorità alta (1) solo per notifiche critiche (conferme, cancellazioni)
2. **Batch**: Il worker processa fino a 10 notifiche per volta per bilanciare latency e throughput
3. **Retry**: Configura `maxAttempts` in base all'importanza della notifica
4. **Monitoring**: Monitora la tabella notifications per notifiche stuck in 'sending'
5. **Scaling**: Per alto traffico, aumenta BATCH_SIZE e aggiungi più worker
