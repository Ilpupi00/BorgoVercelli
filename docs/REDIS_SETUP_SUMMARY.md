# Redis Setup - Resoconto Completamento

## ✅ Configurazione Completata

Questo documento riassume il setup di Redis per sessioni e notifiche push nel progetto BorgoVercelli.

## 📋 File Creati/Modificati

### Nuovi File

| File                          | Descrizione                                                      |
| ----------------------------- | ---------------------------------------------------------------- |
| `src/core/config/redis.js`    | Configurazione centralizzata Redis con client e helper functions |
| `docker-compose.yml`          | Compose per eseguire Redis + PostgreSQL + App in locale          |
| `scripts/test-redis.js`       | Suite di test completa per Redis (10 test automatici)            |
| `.env.example`                | Template variabili d'ambiente con Redis                          |
| `docs/REDIS_SETUP.md`         | Guida completa setup Redis (locale + Docker + Railway)           |
| `docs/REDIS_QUICKSTART.md`    | Quick start in 5 minuti                                          |
| `docs/RAILWAY_REDIS_SETUP.md` | Guida Railway + Redis                                            |

### File Modificati

| File             | Cambiamento                                                           |
| ---------------- | --------------------------------------------------------------------- |
| `src/app.js`     | Aggiunto import Redis e configurazione RedisStore per express-session |
| `src/server/www` | Aggiunto initRedis() e cleanup on shutdown                            |
| `package.json`   | Aggiunto script `test:redis`                                          |
| `.env`           | Aggiunto variabili Redis (leggi il file locale)                       |

## 🚀 Quick Start

### Per Sviluppo con Docker (Consigliato)

```bash
# Avvia tutto (Redis + PostgreSQL + App)
docker-compose up -d

# Testa
npm run test:redis

# Se vedi ✅ PASSED: 10, Redis è pronto!
```

### Per Sviluppo Locale

```bash
# 1. Avvia Redis localmente
redis-server

# 2. Avvia app
npm start

# 3. Testa
npm run test:redis
```

### Per Produzione su Railway

1. Crea servizio Redis in Railway Dashboard
2. Aggiungi variabili: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
3. Deploy: `git push`

## 🏗️ Architettura

```
┌─────────────────────────────┐
│   Express Application       │
├─────────────────────────────┤
│  Session Store (RedisStore) │
│  Pub/Sub (Notifiche)        │
│  Queue (Notifiche Push)     │
└─────────────────────────────┘
            │
            ▼
┌─────────────────────────────┐
│    Redis Server             │
│  - Sessioni (TTL: 7 giorni) │
│  - Pub/Sub Channels         │
│  - Queue di notifiche       │
└─────────────────────────────┘
```

## 📊 Features Attivate

✅ **Sessioni Redis**: Persistenza sessioni in Redis

- TTL: 7 giorni
- Secure cookies con httpOnly
- Automatic cleanup di sessioni scadute

✅ **Pub/Sub Ready**: Infrastruttura per notifiche real-time

- Canali Pub/Sub configurati
- Helper function per publish/subscribe

✅ **Queue Ready**: Coda Redis per notifiche asincrone

- Push/pop notifiche
- Lungherzzza queue monitorabile

✅ **Helper Functions**: Utility per operazioni Redis

- `set(key, value, ttl)` - Save
- `get(key)` - Load
- `del(key)` - Delete
- `publishNotification(channel, data)` - Pub
- `subscribeNotification(channel, callback)` - Sub
- `pushNotificationToQueue(queue, data)` - Enqueue
- `popNotificationFromQueue(queue)` - Dequeue

## 📈 Comandi Utili

```bash
# Test completo
npm run test:redis

# Access Redis CLI
redis-cli

# Nel CLI:
KEYS "sess:*"           # Vedi sessioni
GET "sess:session-id"   # Leggi sessione
DBSIZE                  # Numero di chiavi
FLUSHDB                 # Pulisci database
```

## 🔐 Sicurezza

- ✅ Password Redis configurabile via `REDIS_PASSWORD`
- ✅ Cookies secure/httpOnly per sessioni
- ✅ Session secret configurabile per firma cookie
- ✅ TTL per scadenza automatica sessioni

## 🚨 Troubleshooting

### Redis non connesso?

```bash
# Verifica Redis è in running
redis-cli ping
# Dovrebbe rispondere: PONG

# Se ECONNREFUSED, avvia Redis
redis-server
```

### Test fallisce?

```bash
# Verifica dipendenze
npm ls ioredis connect-redis

# Verifica variabili .env
echo $REDIS_HOST
echo $REDIS_PORT
```

### Sessioni perdute?

- Redis deve restare avviato
- Verifica `REDIS_HOST` in .env
- Controlla log: `npm start`

## 📚 Documentazione Completa

Altre guide disponibili:

- `docs/REDIS_SETUP.md` - Setup dettagliato
- `docs/REDIS_QUICKSTART.md` - Quick start
- `docs/RAILWAY_REDIS_SETUP.md` - deployment Railway

## ✨ Prossimi Step

Opzionali:

1. **Rate Limiting**: express-rate-limit + Redis store
2. **Cache Layer**: Cache query frequenti in Redis
3. **Live Updates**: WebSocket + Pub/Sub Redis
4. **Job Queue**: Bull + Redis per asincroni

## 📝 Note Importanti

1. **Persistenza volontaria**: `appendonly yes` nel docker-compose
2. **Memory Management**: Redis auto-cleanup chiavi scadute
3. **Cluster Ready**: Configurazione supporta sia single instance che cluster
4. **Railway Friendly**: Supporta REDIS_URL di Railway

## ✅ Status

| Componente       | Status        |
| ---------------- | ------------- |
| Redis Config     | ✅ Completo   |
| Express Sessions | ✅ Confgurato |
| Pub/Sub          | ✅ Ready      |
| Queue            | ✅ Ready      |
| Docker Support   | ✅ Completo   |
| Railway Support  | ✅ Supportato |
| Test Suite       | ✅ 10/10 test |
| Documentation    | ✅ Completa   |

---

**Setup ultimato il**: Febbraio 26, 2026
**Versione Redis**: 7-alpine
**Versione IORedis**: 5.9.3
