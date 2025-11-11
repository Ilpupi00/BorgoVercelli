# 🗄️ Configurazione DATABASE_URL per Railway

## ❌ Problema: SIGTERM durante il deploy

L'applicazione viene terminata con `SIGTERM` perché:
1. Non riesce a connettersi al database
2. L'URL del database è errato o mancante
3. Il database non è accessibile dall'esterno

---

## 🔍 Errore Comune: URL Interno vs URL Pubblico

### ❌ URL SBAGLIATO (Interno - NON funziona)
```
postgresql://postgres:password@postgres.railway.internal:5432/railway
```
**Problema**: `postgres.railway.internal` funziona solo **tra servizi Railway**, non dall'app al database.

### ✅ URL CORRETTO (Pubblico - Funziona)
```
postgresql://postgres:password@roundhouse.proxy.rlwy.net:12345/railway
```
**Soluzione**: Usa l'URL pubblico con il proxy di Railway (`*.proxy.rlwy.net`).

---

## 🔧 Come Ottenere l'URL Pubblico del Database

### Metodo 1: Railway Dashboard (Consigliato)

1. **Vai su Railway Dashboard**
   - Apri [railway.app](https://railway.app)
   - Seleziona il tuo progetto

2. **Apri il servizio Database**
   - Clicca sul servizio **PostgreSQL**
   - Vai nella tab **Variables**

3. **Copia DATABASE_URL Pubblico**
   - Cerca la variabile `DATABASE_URL` (o `DATABASE_PUBLIC_URL`)
   - Dovrebbe essere simile a:
     ```
     postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway
     ```
   - Oppure:
     ```
     postgresql://postgres:password@roundhouse.proxy.rlwy.net:45678/railway
     ```

4. **Configura nell'App**
   - Vai al servizio della tua **App Node.js**
   - Tab **Variables**
   - Aggiungi/Aggiorna `DATABASE_URL` con l'URL pubblico copiato

### Metodo 2: Railway CLI

```bash
# 1. Installa Railway CLI (se non già fatto)
npm install -g @railway/cli

# 2. Login
railway login

# 3. Link al progetto
railway link

# 4. Ottieni le variabili
railway variables

# Cerca DATABASE_URL e copiala
```

### Metodo 3: Dalla sezione Connect

1. Vai al servizio **PostgreSQL** su Railway
2. Clicca su **Connect**
3. Copia l'URL di connessione pubblica
4. Dovrebbe includere un hostname tipo `*.proxy.rlwy.net` o `*.railway.app`

---

## ⚙️ Configurazione Completa delle Variabili d'Ambiente

Su Railway, nella tab **Variables** dell'**App Node.js**, configura:

```bash
# Database (OBBLIGATORIO)
DATABASE_URL=postgresql://postgres:password@roundhouse.proxy.rlwy.net:45678/railway

# Email Service (per invio email)
GMAIL_USER=lucalupi03@gmail.com
GMAIL_APP_PASSWORD=ukio kwap dmtr qmhx

# Ambiente
NODE_ENV=production
PORT=3000

# Base URL dell'applicazione
BASE_URL=https://tuo-dominio.railway.app

# JWT per "Ricordami"
JWT_SECRET=your-production-secret-key-change-this
```

---

## 🧪 Test della Connessione

### Test Locale con URL Railway

```bash
# Nel file .env locale, usa temporaneamente l'URL pubblico di Railway
DATABASE_URL=postgresql://postgres:password@roundhouse.proxy.rlwy.net:45678/railway

# Avvia l'app
npm start

# Dovresti vedere:
# [database] Tentativo di connessione a: postgresql://postgres:****@roundhouse.proxy.rlwy.net:45678/railway
# [database] using Postgres via DATABASE_URL
# [database] SSL: enabled
# [database] ✅ Connessione al database stabilita con successo
```

### Verifica Log su Railway

1. Vai alla tab **Deployments** del servizio App
2. Clicca sull'ultimo deployment
3. Guarda i **Logs**
4. Cerca:
   - ✅ `[database] ✅ Connessione al database stabilita con successo`
   - ❌ `[database] ❌ Errore durante la connessione al database`

---

## 🔒 Sicurezza SSL

Il codice è configurato per usare SSL automaticamente in produzione:

```javascript
const useSSL = process.env.NODE_ENV === 'production' || process.env.PGSSLMODE === 'require';

const pool = new Pool({
    connectionString,
    ssl: useSSL ? { rejectUnauthorized: false } : false
});
```

Railway PostgreSQL richiede SSL, quindi assicurati che:
- `NODE_ENV=production` sia impostato su Railway
- Oppure `PGSSLMODE=require`

---

## 🚨 Troubleshooting

### Errore: "Connection refused"

**Causa**: URL del database errato o database non raggiungibile

**Soluzione**:
1. Verifica che `DATABASE_URL` sia l'URL **pubblico**
2. Controlla che il servizio PostgreSQL su Railway sia attivo (Running)
3. Verifica che non ci siano restrizioni di rete

### Errore: "password authentication failed"

**Causa**: Password errata nell'URL

**Soluzione**:
1. Copia nuovamente `DATABASE_URL` dalla dashboard Railway
2. Assicurati di non aver modificato la password manualmente
3. Il formato corretto è: `postgresql://user:password@host:port/database`

### Errore: "SIGTERM" durante il deploy

**Causa**: L'app non riesce a connettersi e si chiude

**Soluzione**:
1. Verifica `DATABASE_URL` sia configurato correttamente
2. Controlla i logs per vedere l'errore specifico
3. Assicurati che SSL sia abilitato (`NODE_ENV=production`)

### Errore: "database does not exist"

**Causa**: Il database specificato nell'URL non esiste

**Soluzione**:
1. Verifica il nome del database nell'URL (di solito `railway`)
2. Controlla nella dashboard PostgreSQL che il database esista
3. Ricrea il database se necessario

---

## 📋 Checklist Pre-Deploy

Prima di fare il deploy su Railway, verifica:

- [ ] `DATABASE_URL` configurato nelle Variables dell'app
- [ ] `DATABASE_URL` è l'URL **pubblico** (contiene `.proxy.rlwy.net` o `.railway.app`)
- [ ] `NODE_ENV=production` impostato
- [ ] Servizio PostgreSQL su Railway è attivo (Running)
- [ ] Altre variabili d'ambiente necessarie configurate (GMAIL_*, JWT_SECRET, ecc.)
- [ ] File `.env` è nel `.gitignore` (non commitare credenziali!)

---

## 🔄 Auto-Deploy

Dopo aver configurato correttamente `DATABASE_URL`:

```bash
# 1. Commit modifiche
git add .
git commit -m "Fix: Database connection configuration for Railway"

# 2. Push al repository
git push origin main

# 3. Railway farà auto-deploy
# Monitora i logs per verificare il successo
```

---

## 📊 Monitoring

Dopo il deploy, monitora:

1. **Logs del Deploy**
   ```
   [database] Tentativo di connessione a: postgresql://...
   [database] using Postgres via DATABASE_URL
   [database] SSL: enabled
   [database] ✅ Connessione al database stabilita con successo
   Server is running on http://localhost:3000
   ```

2. **Metriche Database**
   - Vai al servizio PostgreSQL
   - Tab **Metrics**
   - Verifica connessioni attive e performance

3. **Errori nell'App**
   - Monitora eventuali errori di query SQL
   - Controlla che le tabelle esistano
   - Verifica che le migration siano state eseguite

---

## 🆘 Support

Se continui ad avere problemi:

1. **Verifica Railway Status**
   - [status.railway.app](https://status.railway.app)

2. **Railway Discord**
   - Chiedi supporto nella community

3. **Railway Docs**
   - [docs.railway.app/databases/postgresql](https://docs.railway.app/databases/postgresql)

---

Ultimo aggiornamento: 2025-11-11
