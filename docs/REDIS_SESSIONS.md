# Gestione Sessioni con Redis

## Panoramica

Le sessioni degli utenti sono ora persistenti in **Redis** anziché in memoria. Questo significa:

- ✅ Sessioni persistono tra i restart del server
- ✅ Sessioni condivise tra più istanze dell'app (scalabilità)
- ✅ TTL automatico: sessioni scadono dopo 7 giorni
- ✅ Secure cookies con `httpOnly` e `sameSite`

## Architettura

```
┌─────────────────┐
│   Browser       │
└────────┬────────┘
         │
    ┌────▼─────────────────────────────┐
    │  Express Session (express-session)│
    │  ├─ RedisStore                    │
    │  ├─ Cookie: express.sid           │
    │  └─ TTL: 7 giorni                │
    └────┬────────────────────────────┬─┘
         │                            │
         ▼                            ▼
    ┌──────────────┐          ┌──────────────┐
    │ Browser      │          │  Redis       │
    │ Cookie       │◄────────►│  sess:XXXXX  │
    │ express.sid  │          │  {passport}  │
    └──────────────┘          └──────────────┘
```

## Flow Login

```
1. POST /session
   └─ Validate credentials
   └─ req.logIn(user)
   └─ Passport serializes user ID
   └─ express-session creates session
   └─ RedisStore saves to Redis
   └─ Set express.sid cookie
   └─ Response: Login OK

2. Successiva richiesta
   └─ Browser invia cookie express.sid
   └─ express-session legge da Redis
   └─ RedisStore retrieves session
   └─ Passport deserializes user
   └─ req.user disponibile
```

## Flow Logout

```
1. DELETE /session
   └─ req.logout()
   └─ express-session destroys session
   └─ RedisStore deletes sess:XXXXX
   └─ Clear express.sid cookie
   └─ Response: Logout OK

2. Successiva richiesta
   └─ No session in Redis
   └─ req.user = undefined
```

## Configurazione (src/app.js)

```javascript
// Import
const { RedisStore } = require("connect-redis");
const { redisClient } = require("./core/config/redis");

// Setup
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      httpOnly: true, // No JS access
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax", // CSRF protection
    },
  })
);
```

## API Endpoint

### Login

```bash
POST /session
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "remember": true  # Optional: remember me for 7 days
}

Response:
{
  "message": "Login effettuato",
  "showNotificationPrompt": true
}

Headers:
Set-Cookie: express.sid=abc123...; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800
```

### Logout

```bash
DELETE /session

Response:
{
  "message": "Logout effettuato"
}

Headers:
Set-Cookie: express.sid=; Path=/; Max-Age=0
Set-Cookie: rememberToken=; Path=/; Max-Age=0
```

### Get Current User

```bash
GET /session/user

Response (if authenticated):
{
  "id": 1,
  "email": "user@example.com",
  "nome": "John",
  "cognome": "Doe",
  "role": "user"
}

Response (if not authenticated):
{
  "user": null
}
```

### Get Session Stats (Admin Only)

```bash
GET /session/stats/redis

Response:
{
  "success": true,
  "totalSessions": 5,
  "sessions": [
    {
      "id": "abc123xyz",
      "userId": 1,
      "createdAt": "2026-02-26T21:00:00.000Z"
    }
  ],
  "timestamp": "2026-02-26T21:05:00.000Z"
}
```

### Clear All Sessions (Admin Only)

```bash
DELETE /session/admin/clear-all

Response:
{
  "success": true,
  "message": "Tutte le sessioni sono state cancellate",
  "clearedSessions": 5
}
```

## Logging

### Session Created

```
[SESSION] 📝 Sessione creata per utente 1 (user@example.com)
[SESSION] 🔑 Session ID: abc123xyz
[SESSION] 💾 Salvata in Redis con TTL: 7 giorni
```

### Session Destroyed

```
[SESSION] 📝 Sessione cancellata per utente 1
[SESSION] 🔑 Session ID: abc123xyz
[SESSION] 🗑️  Rimossa da Redis
```

## Redis Keys

```bash
# Sessione
redis-cli
> KEYS "sess:*"
1) "sess:abc123xyz"

# Contenuto
> GET "sess:abc123xyz"
{
  "cookie": {
    "originalMaxAge": 604800000,
    "expires": "2026-03-05T21:00:00.000Z",
    "httpOnly": true,
    "path": "/"
  },
  "passport": {
    "user": 1
  }
}

# TTL
> TTL "sess:abc123xyz"
(integer) 604799  # 7 giorni in secondi
```

## Monitoring

### Check Active Sessions

```bash
redis-cli KEYS "sess:*" | wc -l
```

### Watch Session Activity

```bash
redis-cli MONITOR | grep "sess:"
```

### Get Session Details

```bash
redis-cli GET "sess:abc123xyz" | jq .
```

## Environment Variables

```bash
# .env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=          # empty for local
SESSION_SECRET=your-secret-key-change-in-production
```

## Troubleshooting

### Sessione non persiste dopo restart

```bash
# Verifica Redis è running
redis-cli ping
# PONG

# Verifica REDIS_HOST in .env
echo $REDIS_HOST
```

### Sessione non si crea

```bash
# Verifica RedisStore è configurato in app.js
grep -n "RedisStore" src/app.js

# Verifica redisClient è importato
grep -n "redisClient" src/app.js

# Test carica modulo
node -e "require('dotenv').config(); const r = require('./src/shared/routes/session'); console.log('OK');"
```

### Cookie express.sid non impostato

```bash
# Verifica httpOnly: true
grep -A5 "httpOnly" src/app.js

# Verifica sameSite: lax
grep -A5 "sameSite" src/app.js

# In sviluppo, secure: false è OK
# In produzione, secure: true richiede HTTPS
```

### "Remember Me" non funziona

```javascript
// Verifica JWT token generato
POST /session
{
  "remember": true  // Required
}

// Verifica cookie rememberToken
Document.cookie  // Browser dev tools
```

## Best Practices

### 1. Session Secret

```bash
# Change in production
SESSION_SECRET=`openssl rand -base64 32`
```

### 2. HTTPS in Produzione

```javascript
// app.js
cookie: {
  secure: process.env.NODE_ENV === "production", // Force HTTPS
  httpOnly: true,
  sameSite: "strict",
}
```

### 3. Session Timeout

```bash
# Attuale: 7 giorni
maxAge: 1000 * 60 * 60 * 24 * 7

# Per cambiarla, modifica in app.js
maxAge: 1000 * 60 * 60 * 24 * 30  # 30 days
maxAge: 1000 * 60 * 60  # 1 hour
```

### 4. Monitor Redis Memory

```bash
redis-cli INFO memory | grep used_memory_human
redis-cli DBSIZE  # Numero di chiavi
```

## Performance

| Operazione               | Tempo Medio |
| ------------------------ | ----------- |
| Login                    | < 10ms      |
| Get Session              | < 5ms       |
| Logout                   | < 10ms      |
| Clear All (100 sessions) | < 50ms      |

## FAQ

### Q: Come salvo dati custom in sessione?

```javascript
req.session.customData = "valore";
await new Promise((resolve) => req.session.save(resolve));
```

### Q: Come scade la sessione?

```javascript
// Automaticamente dopo 7 giorni di inattività
// Oppure manualmente
req.logout(() => {
  /* ... */
});
```

### Q: Posso usare 2 database Redis?

```javascript
// Si, nel redis.js
const sessionDB = 0;
const notificationsDB = 1;

// Oppure 2 istanze Redis diverse
```

### Q: Come faccio backup delle sessioni?

```bash
# Export
redis-cli BGSAVE

# Redis persistence: AOF
appendonly yes
```

## Link Utili

- [Express Session Docs](https://github.com/expressjs/session)
- [Connect Redis Docs](https://github.com/tj/connect-redis)
- [Redis TTL](https://redis.io/commands/expire/)
- [Http-Only Cookies](https://owasp.org/www-community/attacks/xss/#stored-xss-attacks)
- [SameSite Cookie](https://web.dev/samesite-cookies-explained/)
