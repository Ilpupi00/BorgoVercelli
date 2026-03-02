# Setup Redis per Sessioni e Notifiche Push

## Panoramica

Redis è configurato per:
1. **Sessioni**: Memorizza le sessioni utente in Redis invece che in memoria
2. **Notifiche Push**: Coda per le notifiche push con Pub/Sub
3. **Cache**: Disponibile per cache dati

## Installazione

### Opzione 1: Docker (Consigliato)

#### Setup completo con Docker Compose
```bash
# Avvia Redis + PostgreSQL + App
docker-compose up -d

# Log Redis
docker logs -f borgo-vercelli-redis

# Test connessione
docker exec -it borgo-vercelli-redis redis-cli ping
# Output: PONG
```

#### Solo Redis (se hai già PostgreSQL)
```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine

# Test
redis-cli ping
# Output: PONG
```

### Opzione 2: Installazione locale Windows

#### 1. Scarica Redis
- Vai su https://github.com/microsoftarchive/redis/releases
- Scarica `Redis-x64-X.X.X.msi`

#### 2. Installa
```bash
# Esegui il .msi
# Di default va a C:\Program Files\Redis
```

#### 3. Avvia il servizio
```powershell
# PowerShell Admin
redis-server.exe

# Oppure come servizio Windows (già installato automaticamente)
# Cerca "Services" -> Redis -> Start
```

#### 4. Test
```bash
redis-cli ping
# Output: PONG
```

### Opzione 3: WSL2 + Redis

```bash
# Nel tuo WSL2 Ubuntu
sudo apt-get update
sudo apt-get install -y redis-server

# Avvia
sudo service redis-server start

# Test
redis-cli ping
```

## Configurazione Variabili d'Ambiente

Copia il file `.env.example` e adatta per il tuo ambiente:

```bash
cp .env.example .env
```

### Per sviluppo locale
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=          # Vuoto se non hai password
REDIS_DB=0               # Database 0-15
SESSION_SECRET=dev-key   # Cambia in produzione
```

### Per Docker Compose
```env
REDIS_HOST=redis         # Nome del servizio docker
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
SESSION_SECRET=your-secret-key
```

### Per Railway (Produzione)
```env
# Railway fornisce REDIS_URL
# Esempio: redis://default:password@url:port

# La configurazione automaticamente:
# - Parsa REDIS_URL
# - Estrae host, port, password
# Oppure specifica manualmente:
REDIS_HOST=your-railway-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

## Primi Test

### 1. Test connessione Redis
```bash
npm start
# Dovrebbe vedere:
# ✅ Redis connesso (host: 127.0.0.1:6379, db: 0)
```

### 2. Test sessioni
```bash
# Apri browser
# http://localhost:3000

# Login con un utente
# Cookie di sessione now memorizzato in Redis!

# Verifica in redis-cli
redis-cli
> KEYS *
> GET "sess:<session-id>"
```

### 3. Test notifiche push (opzionale)
```bash
node scripts/test-notification-system.js
# Invia notifiche tramite Redis queue
```

## Comandi Redis Utili

```bash
# Connessione
redis-cli

# Database
SELECT 0              # Seleziona database 0
SELECT 1              # Seleziona database 1
FLUSHDB              # Svuota database corrente
FLUSHALL             # Svuota tutti i database

# Chiavi
KEYS *               # Elenca tutte le chiavi
KEYS "sess:*"        # Elenca solo chiavi sessioni
GET <chiave>         # Leggi valore
DEL <chiave>         # Elimina
TTL <chiave>         # Tempo di scadenza

# Statistiche
INFO                 # Stats generali
DBSIZE              # Numero di chiavi
MEMORY STATS        # Uso memoria

# Monitor (debug)
MONITOR             # Vedi tutti i comandi in real-time
```

## Topologia Redis

```
                    ┌─────────────────────────────────────┐
                    │        Express App (Main)            │
                    └─────────────────────────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
        │  Sessions    │   │  Pub/Sub     │   │   Queue      │
        │  Store       │   │  Notifiche   │   │  Notifiche   │
        └──────────────┘   └──────────────┘   └──────────────┘
                │                   │                   │
                └───────────────────┼───────────────────┘
                                    ▼
                        ┌─────────────────────────┐
                        │     Redis Server        │
                        │   (Sessioni + Dati)     │
                        └─────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌─────────────┐ ┌───────────────┐ ┌──────────┐
            │ Persistence │ │ Replication   │ │ Cluster  │
            │ (optional)  │ │ (optional)    │ │(optional)│
            └─────────────┘ └───────────────┘ └──────────┘
```

## Performance Tips

### 1. Connection Pooling
Redis è già configurato con `maxRetriesPerRequest: null` per le sessioni (essenziale).

### 2. Memory Management
```bash
# Monitor memoria
redis-cli INFO | grep used_memory

# Configura eviction policy nelle sessioni
# maxmemory-policy: allkeys-lru (default per sessioni)
```

### 3. Async Operations
Tutti i moduli Redis usano Promise/async-await per non bloccare.

## Troubleshooting

### ❌ "Error: connect ECONNREFUSED 127.0.0.1:6379"
```bash
# Redis non è avviato

# Soluzione 1: Docker
docker run -d -p 6379:6379 redis:7

# Soluzione 2: Locale (Windows)
redis-server.exe

# Soluzione 3: WSL2
sudo service redis-server start
```

### ❌ "Redis non disponibile - funzionamento degradato"
- L'app continua a funzionare anche senza Redis (graceful degradation)
- Sessioni andranno in memoria volatila
- Notifiche potrebbero non funzionare

### ❌ Sessioni non persistono
```bash
# Verifica che RedisStore sia configurato
grep -n "RedisStore" src/app.js

# Verifica REDIS_HOST corretta
echo $REDIS_HOST  # o su Windows: $env:REDIS_HOST
```

### ❌ Lentezza di connessione
```bash
# Aumenta timeout in src/core/config/redis.js
retryStrategy: (times) => Math.min(times * 50, 5000)
```

## Roadmap Futures

- [ ] Redis Sentinel per HA
- [ ] Redis Cluster per scalabilità
- [ ] Cache layer con Redis per query frequenti
- [ ] Rate limiting con Redis
- [ ] WebSocket live updates via Pub/Sub

## Link Utili

- [Redis Docs](https://redis.io/docs/)
- [IORedis (client Node.js)](https://github.com/luin/ioredis)
- [connect-redis](https://github.com/tj/connect-redis)
- [Redis Best Practices](https://redis.io/docs/getting-started/deployment-patterns/)

## Support

Per problemi:
1. Controlla i log: `docker logs borgo-vercelli-redis`
2. Connettiti con `redis-cli` e verifica lo stato
3. Vedi documenti nei `./docs` per dettagli specifici
