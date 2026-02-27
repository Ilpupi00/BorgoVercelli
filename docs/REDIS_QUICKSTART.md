# Redis Setup - Quick Start

## 🚀 Avvia Redis in 5 minuti

### Per sviluppo locale con Docker

```bash
# 1. Installa dotenv (if you don't have it)
# npm install dotenv

# 2. Copia .env.example
cp .env.example .env

# 3. Aggiorna .env per sviluppo locale
# REDIS_HOST=redis        # Usa "redis" per docker-compose
# REDIS_PORT=6379
# SESSION_SECRET=dev-key

# 4. Avvia i servizi
docker-compose up -d

# 5. Verifica
docker logs -f borgo-vercelli-redis
# Dovrebbe vedere: "Ready to accept connections"

# 6. Testa connessione
npm run test:redis
```

### Per sviluppo locale senza Docker

```bash
# 1. Avvia Redis localmente
# Windows: redis-server.exe
# Mac: redis-server
# Linux: sudo service redis-server start

# 2. Copia .env
cp .env.example .env

# 3. Aggiorna .env
# REDIS_HOST=127.0.0.1
# REDIS_PORT=6379
# SESSION_SECRET=dev-key

# 4. Avvia l'app
npm start

# 5. Verifica test
npm run test:redis
```

### Per produzione su Railway

```bash
# 1. Crea servizio Redis in Railway Dashboard
# 2. Aggiungi variabili d'ambiente
REDIS_HOST=<railway-provided>
REDIS_PORT=<railway-provided>
REDIS_PASSWORD=<railway-provided>
SESSION_SECRET=<random-string>

# 3. Deploy
git push

# 4. Verifica nei logs
# Dovrebbe vedere: ✅ Redis connesso
```

## ✅ Verificare il Setup

```bash
# Test completo
npm run test:redis

# Se vedi:
# ✅ PASSED: 10
# ❌ FAILED: 0
# 🎉 TUTTI I TEST PASSATI!

# Allora Redis è configurato correttamente!
```

## 🔍 Comandi Utili

```bash
# Connettiti a Redis
redis-cli

# Test
PING
# PONG

# Vedi le sessioni
KEYS "sess:*"

# Leggi una sessione
GET "sess:<session-id>"

# Pulisci database
FLUSHDB

# Exit
EXIT
```

## 📊 Verifiche Rapide

### 1. Redis è in running?

```bash
redis-cli ping
# Dovrebbe rispondere: PONG
```

### 2. L'app si connette?

```bash
npm start
# Dovrebbe vedere:
# ✅ Redis connesso (host: 127.0.0.1:6379, db0)
```

### 3. Le sessioni funzionano?

```bash
# Apri http://localhost:3000
# Login
# In redis-cli:
KEYS "sess:*"
# Dovrebbe mostrare una sessione
```

## 🆘 Se non funziona

### Redis non è in running

```bash
# Windows
redis-server.exe

# Mac
redis-server

# Linux
sudo service redis-server start

# Docker
docker run -d -p 6379:6379 redis:7
```

### Connessione rifiutata

```bash
# Verifica che Redis ascolta su localhost:6379
redis-cli ping

# Se ECONNREFUSED, Redis non è avviato
# Se PONG, Redis funziona
```

### Port occupata

```bash
# Se port 6379 è occupata, cambia:
# .env: REDIS_PORT=6380
# redis-server --port 6380
```

## 📝 Prossimi step

1. ✅ Redis setup completo
2. ➡️ Leggi [REDIS_SETUP.md](REDIS_SETUP.md) per dettagli
3. ➡️ Integra con notifiche push
4. ➡️ Configura cache layer

## 💡 Tip

Mantieni sempre Redis avviato durante lo sviluppo:

```bash
# Terminal 1
redis-server

# Terminal 2
npm start

# Terminal 3 (opzionale, per debug)
redis-cli
```

## 🎯 Success!

Quando vedi:

```
✅ Redis connesso (host: 127.0.0.1:6379, db: 0)
```

Congrats! Redis è setup e funzionante! 🎉
