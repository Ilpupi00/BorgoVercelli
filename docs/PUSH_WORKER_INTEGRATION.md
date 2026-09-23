# Worker Notifiche Push - Integrazione Server

## 📋 Panoramica

Il worker per processare le notifiche push è ora **integrato direttamente nel server principale** e si avvia automaticamente all'avvio dell'applicazione.

## ✅ Modifiche Implementate

### 1. Nuovo Modulo Worker
**File:** `src/server/workers/notifications-worker.js`

Funzionalità:
- ✅ Polling automatico ogni 1 secondo per notifiche pending
- ✅ Processamento batch (max 30 notifiche per ciclo)
- ✅ Concorrenza limitata (max 12 invii paralleli)
- ✅ Retry automatico con backoff esponenziale
- ✅ Timeout per operazioni lente (30s)
- ✅ Reset automatico notifiche "stuck" in sending
- ✅ Cleanup periodico notifiche vecchie (7 giorni)
- ✅ Gestione errori classificata (VAPID, auth, timeout, validation)
- ✅ Cache subscriptions per batch (riduce query DB)

### 2. Integrazione in `src/app.js`
Il worker viene avviato automaticamente dopo l'inizializzazione del server:

```javascript
// Import del worker
const notificationsWorker = require('./server/workers/notifications-worker');

// Avvio automatico con setImmediate (dopo init server)
setImmediate(async () => {
  await notificationsWorker.startWorker();
});

// Graceful shutdown su SIGTERM/SIGINT
process.on('SIGTERM', async () => {
  await notificationsWorker.stopWorker();
});
```

### 3. Fallback Client Anon
**File:** `src/public/assets/scripts/push-notifications.js`

Quando `POST /push/subscribe` ritorna 401 (utente non autenticato), il client prova automaticamente `POST /push/subscribe-anon` per salvare la subscription come test (user_id = 0).

## 🚀 Come Usare

### Avvio Automatico
Il worker parte automaticamente quando avvii il server:

```bash
npm start
# oppure
node src/server/index.js
```

### Log del Worker
Il worker stampa log prefissati con `[WORKER]`:

```
[APP] 🚀 Avvio worker notifiche push...
[WORKER] 🚀 Avvio worker notifiche push integrato
[WORKER] ✅ Connessione database OK
[WORKER] ✅ Worker avviato e in esecuzione
[WORKER] 📦 Batch: 3 notifiche, 12 subscriptions caricate
[WORKER] 📋 Processando notifica 42 (tipo: admin, attempt: 1)
[WORKER] ✅ Notifica 42 inviata (sent: 3, failed: 0)
```

### Monitoraggio Stato
Il worker espone una funzione per ottenere statistiche:

```javascript
const stats = notificationsWorker.getStats();
// { processed: 150, failed: 3 }
```

### Arresto Manuale
Se necessario, puoi arrestare il worker:

```javascript
await notificationsWorker.stopWorker();
```

## 📊 Configurazione

Parametri configurabili in `src/server/workers/notifications-worker.js`:

```javascript
const CONFIG = {
    POLL_INTERVAL_MS: 1000,         // Polling ogni 1s
    BATCH_SIZE: 30,                  // Max 30 notifiche per batch
    CONCURRENCY: 12,                 // Max 12 invii paralleli
    RETRY_DELAY_BASE_MS: 2000,       // Base backoff: 2s
    MAX_RETRY_DELAY_MS: 120000,      // Max delay: 2 minuti
    CLEANUP_INTERVAL_MS: 3600000,    // Cleanup ogni ora
    CLEANUP_AFTER_DAYS: 7,           // Rimuovi dopo 7 giorni
    PROCESSING_TIMEOUT_MS: 30000,    // Timeout: 30s
    MAX_STUCK_MINUTES: 10            // Reset stuck dopo 10 min
};
```

## 🔍 Verifica Funzionamento

### 1. Inserisci una Notifica di Test

```bash
node scripts/insert-test-notif.js
```

### 2. Verifica che il Worker la Processi

Guarda i log del server — dovresti vedere:

```
[WORKER] 📦 Batch: 1 notifiche, X subscriptions caricate
[WORKER] 📋 Processando notifica <id>...
[WORKER] ✅ Notifica <id> inviata
```

### 3. Controlla lo Stato nel DB

```bash
node scripts/inspect-notifications.js
```

Verifica che la notifica sia nello stato `sent` con `sent_at` popolato.

## 🐛 Troubleshooting

### Worker Non Parte
**Sintomo:** Nessun log `[WORKER]` all'avvio del server

**Cause possibili:**
1. Database non raggiungibile → verifica `DATABASE_URL`
2. Tabella `notifications` non esiste → esegui migration
3. Errore durante import → controlla log errori all'avvio

**Fix:**
```bash
# Verifica connessione DB
node scripts/test-db.js

# Verifica tabella notifications
psql $DATABASE_URL -c "SELECT COUNT(*) FROM notifications;"
```

### Notifiche Non Processate
**Sintomo:** Notifiche rimangono in stato `pending`

**Cause possibili:**
1. `send_after` nel futuro → esegui `node scripts/reset-pending.js`
2. Worker arrestato/crash → riavvia server
3. Subscriptions non presenti → verifica `push_subscriptions`

**Fix:**
```bash
# Reset send_after per notifiche pending
node scripts/reset-pending.js

# Verifica subscriptions
node scripts/debug-batch-send.js
```

### Errori 401/403 nei Log
**Sintomo:** Log mostra `[WORKER] ❌ Errore ... 401/403`

**Cause:**
- 401 → VAPID keys non configurate o errate
- 403 → VAPID mismatch (chiavi cambiate dopo subscription)

**Fix:**
1. Verifica `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` nel `.env`
2. Rigenera chiavi se necessario:
   ```bash
   npx web-push generate-vapid-keys
   ```
3. Aggiorna `.env` e riavvia server
4. I client devono ri-sottoscrivere (eliminare vecchie subscription)

## 📈 Performance

### Throughput Atteso
- **Polling:** 1 batch/secondo
- **Batch size:** 30 notifiche
- **Throughput teorico:** ~30 notifiche/secondo (singolo worker)
- **Concorrenza:** 12 invii paralleli per batch

### Scaling
Per aumentare throughput:
1. Aumenta `CONCURRENCY` (attenzione: più carico DB/push service)
2. Aumenta `BATCH_SIZE` (max 50 consigliato)
3. Riduci `POLL_INTERVAL_MS` (min 500ms consigliato)

Per deployment produzione con traffico alto:
- Considera worker separato con pm2/systemd
- Monitor con health checks e alerting
- Queue Redis per ultra-alta frequenza

## 🔐 Sicurezza

### Variabili d'Ambiente Richieste
```bash
DATABASE_URL=postgres://user:pass@host:5432/dbname
VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>
VAPID_EMAIL=mailto:your-email@example.com
```

### Best Practices
- ✅ Non committare `.env` nel repo
- ✅ Usa variabili d'ambiente in produzione (Railway/Heroku/etc.)
- ✅ Ruota le VAPID keys periodicamente se sospetto compromissione
- ✅ Monitor log per tentativi anomali (rate limit se necessario)

## 🎯 Compatibilità Cross-Browser/OS

Il sistema è testato e compatibile con:

### Browser Desktop
- ✅ Chrome/Chromium (Windows, macOS, Linux)
- ✅ Edge (Windows, macOS)
- ✅ Firefox (Windows, macOS, Linux)
- ✅ Safari (macOS 16+, richiede HTTPS)

### Browser Mobile
- ✅ Chrome Android
- ✅ Firefox Android
- ✅ Safari iOS 16.4+ (richiede "Add to Home Screen" per push)
- ⚠️ Opera/Samsung Internet (supporto base, testare)

### Requisiti Client
1. **HTTPS obbligatorio** (eccetto localhost per test)
2. Service Worker supportato
3. Push API supportata
4. Permessi notifiche concessi dall'utente

## 📝 Script Helper Disponibili

### Diagnostica
```bash
node scripts/check-pending.js          # Lista notifiche pending
node scripts/inspect-notifications.js  # Mostra ultime 30 notifiche
node scripts/debug-batch-send.js       # Test invio a subscriptions
```

### Test Manuali
```bash
node scripts/insert-test-notif.js      # Inserisci singola notifica
node scripts/insert-many-test-notif.js # Inserisci bulk test
node scripts/queue-test.js             # Test queue service
```

### Manutenzione
```bash
node scripts/reset-pending.js          # Reset send_after = NOW()
```

### Worker Standalone (se necessario)
```bash
node scripts/worker-notifications.js   # Avvia worker separato
```

## 🚦 Prossimi Passi

### Test Completo End-to-End
1. ✅ Avvia il server (`npm start`)
2. ✅ Verifica log worker: `[WORKER] ✅ Worker avviato`
3. ✅ Apri browser e vai su `/push/test` (autenticato)
4. ✅ Clicca "Abilita Notifiche" → permesso concesso
5. ✅ Verifica subscription salvata: `GET /push/my-subscriptions`
6. ✅ Inserisci notifica di test: `node scripts/insert-test-notif.js`
7. ✅ Verifica elaborazione nei log del server
8. ✅ Conferma che la notifica appaia sul browser (toast)

### Deploy Produzione
1. Configura variabili d'ambiente su piattaforma (Railway/Heroku/etc.)
2. Assicurati che `DATABASE_URL` e VAPID keys siano impostate
3. Deploy: il worker partirà automaticamente
4. Monitor log per confermare avvio worker
5. Configura alerting per errori critici (es. Sentry)

## 📚 Riferimenti
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [VAPID Protocol](https://datatracker.ietf.org/doc/html/rfc8292)
- [Service Worker Lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
