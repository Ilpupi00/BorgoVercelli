# Setup Redis su Railway

## Panoramica

Questa guida spiega come configurare Redis su Railway per le sessioni e le notifiche push.

## Step 1: Creare il servizio Redis in Railway

1. **Accedi a Railway**

   - Vai su [railway.app](https://railway.app)
   - Apri il tuo progetto BorgoVercelli

2. **Aggiungi Redis**

   - Clicca su `+ New Services` (oppure `Create`)
   - Seleziona `Redis`
   - Railway crea automaticamente un servizio Redis con variabili d'ambiente

3. **Verifica le variabili**
   - Railway inietterà automaticamente `REDIS_URL`
   - Consulta la sezione "Networking" per verificare host e port

## Step 2: Configurare le variabili d'ambiente

### Opzione A: Usare REDIS_URL automatico (Consigliato)

Se Railway fornisce `REDIS_URL`, la configurazione carica automaticamente:

- Host
- Port
- Password

File: `src/core/config/redis.js`

```javascript
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  // ...
};
```

Se Railway usa `REDIS_URL`, aggiungi nel `.env`:

```bash
REDIS_URL=redis://default:password@hostname:6379
```

La configurazione farà il parse automaticamente.

### Opzione B: Variabili singole

Nel Dashboard Railway, aggiungi come variabili d'ambiente:

```
REDIS_HOST=<host-fornito-da-railway>
REDIS_PORT=<port-fornito-da-railway>
REDIS_PASSWORD=<password-generata>
REDIS_DB=0
SESSION_SECRET=<chiave-segreta-casuale>
```

## Step 3: Aggiornare il Dockerfile (opzionale)

Se usi il deployment via Dockerfile, assicurati che Redis sia già nel config:

```dockerfile
# Nel nostro Dockerfile, Node.js si connetterà a Redis tramite le variabili d'ambiente
# Noop aggiuntive necessarie
```

## Step 4: Deploy e Test

1. **Deploy**

   ```bash
   git add .
   git commit -m "Add Redis setup for sessions and notifications"
   git push
   # Railway deploya automaticamente
   ```

2. **Verifica i log**

   - Dashboard Railway → Logs
   - Cerca: `✅ Redis connesso`
   - Se vedi questo, Redis funziona!

3. **Verifica le sessioni**
   - Accedi al sito
   - Le sessioni ora persistono in Redis (non perdono al restart!)
   - Test: restart del server → sessione ancora attiva

## Step 5: Monitoraggio

### Dashboard Railway

In Railway puoi monitorare:

- CPU/Memory del servizio Redis
- Connessioni attive
- Operazioni Redis

### Comandi di debug

Se hai accesso SSH al servizio:

```bash
# Se Railway fornisce accesso SSH/terminal
ssh-into-railway-redis

redis-cli
> PING
PONG

> DBSIZE
123  # numero di chiavi

> KEYS sess:*
# lista delle sessioni
```

## Troubleshooting

### ❌ "REDIS_URL not found"

**Problema**: Railway non ha iniettato REDIS_URL

**Soluzione**:

1. Nel dashboard Railway, vai a "Variables"
2. Verifica che il servizio Redis sia linkato al progetto app
3. Se manca, clicca su Redis → Reference to project
4. Restart l'app (Railway lo farà automaticamente)

### ❌ "ECONNREFUSED Redis"

**Problema**: L'app non riesce a connettersi a Redis

**Soluzione**:

1. Verifica che Redis sia stato creato (dovrebbe vedere un servizio Redis nel dashboard)
2. Controlla REDIS_HOST e REDIS_PORT nelle variabili d'ambiente
3. Railway da di default un REDIS_URL in formato: `redis://default:password@host:port`
4. Se usi variabili separate, verifica che host e port siano corretti

### ❌ Sessioni perdute su restart

**Problema**: Le sessioni vengono cancellate quando riavvii

**Motivo**: Stai ancora usando store in memoria

**Soluzione**:

- Assicurati che `RedisStore` sia configurato in `src/app.js`
- Verifica che `REDIS_HOST` sia configurato
- Controlla che Redis sia avviato: `npm run test:redis`

## Performance su Railway

### Configurazione suggerita

- **Piano Redis**: Almeno il piano "Starter" per applicazioni piccole-medie
- **Memory Limit**: Minimo 512MB per 1000+ sessioni concurrent
- **Connection Pool**: Automaticamente gestito da `ioredis`

### Ottimizzazioni

1. **Session Timeout**: Configurato a 7 giorni in `src/app.js`
2. **Cleanup Automatico**: Redis pulisce chiavi scadute automaticamente
3. **Async/Await**: Non blocca il server durante operazioni Redis

## Next Steps - Features Future

Dopo che Redis è configurato, puoi aggiungere:

1. **Rate Limiting**

   ```javascript
   const rateLimit = require("express-rate-limit");
   const RedisRateLimitStore = require("rate-limit-redis");
   ```

2. **Cache Layer**

   ```javascript
   // Cache query frequenti
   const cached = await redis.get("cache:users:leaders");
   ```

3. **WebSocket Live Updates**

   ```javascript
   // Pub/Sub per notifiche real-time
   redis.subscribe("updates:channel", (msg) => {
     io.emit("update", msg);
   });
   ```

4. **Job Queue**
   ```javascript
   // Bull + Redis per coda di job asincroni
   npm install bull
   ```

## References

- [Railway Docs - Redis](https://docs.railway.app/databases/redis)
- [IORedis + Railway](https://github.com/luin/ioredis#redis-on-railway)
- [Express Session](https://github.com/expressjs/session)
- [Railway Networking](https://docs.railway.app/deploy/networking)

## Support

Se hai problemi:

1. Verifica che Redis sia in running nel dashboard
2. Controlla le variabili d'ambiente
3. Guarda i log di Railway per errori
4. Testare localmente: `npm run test:redis`
