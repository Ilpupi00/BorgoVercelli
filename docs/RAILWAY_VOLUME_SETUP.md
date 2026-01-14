# Guida Setup Railway Volume per Immagini Persistenti

## Problema Risolto

Su Railway, il filesystem del container è **effimero** - ogni deploy cancella tutti i file.
Le immagini caricate dagli utenti venivano perse ad ogni deployment.

## Soluzione Implementata

Utilizziamo **Railway Volumes** - storage persistente montato su `/data/uploads` che sopravvive ai redeploy.

---

## 📋 Setup Passo-Passo

### 1. Creare il Volume su Railway

1. Vai su **Railway Dashboard** → Il tuo progetto
2. Clicca sul servizio dell'applicazione (quello Node.js)
3. Vai alla tab **"Variables"** o **"Settings"**
4. Scorri fino a **"Volumes"**
5. Clicca **"+ New Volume"**
6. Configura:
   - **Name**: `uploads-volume`
   - **Mount Path**: `/data`
7. Clicca **"Add"**

**⚠️ IMPORTANTE**: Il volume deve essere creato PRIMA di fare il deploy con il nuovo codice.

---

### 2. Deploy dell'Applicazione

Dopo aver creato il volume:

```bash
git add .
git commit -m "feat: add Railway Volume for persistent uploads"
git push
```

Railway farà automaticamente il deploy e monterà il volume su `/data`.

---

### 3. Verificare il Funzionamento

#### Durante il Deploy

Controlla i log di Railway per vedere:

```
[MULTER] Upload directory: /data/uploads
[APP] Serving uploads from: /data/uploads
```

#### Dopo il Deploy

1. Carica un'immagine (es. foto profilo utente)
2. Verifica che sia visibile
3. Fai un nuovo deploy o riavvia il servizio
4. ✅ L'immagine dovrebbe essere ancora lì!

---

## 🔧 Come Funziona

### Configurazione Ambiente

Il codice rileva automaticamente se gira su Railway:

```javascript
// src/core/config/multer.js
const uploadDir = process.env.RAILWAY_ENVIRONMENT
  ? "/data/uploads" // ← Railway: volume persistente
  : path.join(process.cwd(), "src", "public", "uploads"); // ← Locale: filesystem normale
```

### Percorsi File

- **Upload**: Le immagini vengono salvate in `/data/uploads/` su Railway
- **Database**: Salva solo l'URL relativo: `/uploads/filename.jpg`
- **Serving**: Express serve i file da `/data/uploads` tramite l'endpoint `/uploads`

---

## 🗂️ Struttura File

### Su Railway (Production)

```
/data/
  └── uploads/
      ├── user_123_1699999999999.jpg
      ├── squadra_1700000000000_logo.png
      └── ...
```

### In Locale (Development)

```
src/
  └── public/
      └── uploads/
          ├── user_1_1699999999999.jpg
          └── ...
```

---

## 📊 Gestione Database

### Percorsi Salvati nel DB

**✅ Formato corretto** (relativo):

```sql
-- Tabella immagine_profilo_utente
immagine_profilo_utente_url = '/uploads/user_123_1699999999999.jpg'
```

**❌ Formato vecchio** (da aggiornare):

```sql
-- Percorso assoluto da correggere
immagine_profilo_utente_url = 'src/public/uploads/user_123_1699999999999.jpg'
```

### Script di Migrazione (se necessario)

Se hai immagini con percorsi vecchi nel DB:

```sql
-- PostgreSQL: Correggi percorsi esistenti
UPDATE immagine_profilo_utente
SET immagine_profilo_utente_url = '/uploads/' ||
    SUBSTRING(immagine_profilo_utente_url FROM '[^/]+$')
WHERE immagine_profilo_utente_url LIKE 'src/public/uploads/%';

-- Verifica
SELECT immagine_profilo_utente_url
FROM immagine_profilo_utente
WHERE immagine_profilo_utente_url LIKE '/uploads/%';
```

---

## 🔄 Migrare Immagini Esistenti

Se hai già immagini in produzione da salvare:

### Opzione 1: Download e Re-upload (Consigliato)

1. **Scarica le immagini** dal vecchio deployment (se ancora accessibili)
2. **Ricrea il volume** su Railway
3. **Ricarica manualmente** le immagini tramite l'app

### Opzione 2: Copia Manuale via Railway CLI

```bash
# Installa Railway CLI
npm i -g @railway/cli

# Login
railway login

# Connect al progetto
railway link

# Accedi al container
railway run bash

# All'interno del container
mkdir -p /data/uploads
# Copia file se disponibili...
```

---

## 🛠️ Troubleshooting

### Problema: "File not found" dopo deploy

**Causa**: Il volume non è stato creato o non è montato correttamente.

**Soluzione**:

1. Verifica che il volume esista nella dashboard Railway
2. Controlla i log per vedere se `/data` è accessibile
3. Riavvia il servizio

### Problema: Immagini duplicate localmente e su Railway

**Causa**: In locale usi `src/public/uploads`, su Railway usi `/data/uploads`.

**Soluzione**: È normale! Sono ambienti separati. Puoi:

- Ignorare `src/public/uploads` nel `.gitignore`
- Usare immagini diverse per test locali

### Problema: Spazio volume pieno

**Soluzione**:

1. Railway offre **10GB gratuiti** per volume
2. Monitora l'uso nella dashboard
3. Implementa pulizia automatica di file vecchi se necessario

---

## 📁 File Modificati

- ✅ `src/core/config/multer.js` - Configurazione upload path dinamico
- ✅ `src/features/auth/routes/login_register.js` - Upload foto profilo
- ✅ `src/app.js` - Serving file statici da volume
- ✅ `railway.toml` - Configurazione Railway con volume mount

---

## 💡 Best Practices

### 1. Nomi File Unici

Usa timestamp per evitare conflitti:

```javascript
const uniqueName = Date.now() + "-" + file.originalname;
```

### 2. Validazione Tipo File

Accetta solo immagini:

```javascript
if (!file.mimetype.startsWith("image/")) {
  return cb(new Error("Solo immagini permesse"));
}
```

### 3. Limite Dimensioni

Max 5MB per file:

```javascript
limits: {
  fileSize: 5 * 1024 * 1024;
}
```

### 4. Percorsi Relativi nel DB

Salva sempre URL relativi, non percorsi assoluti:

```javascript
// ✅ Buono
const filePath = "/uploads/" + filename;

// ❌ Male
const filePath = "/data/uploads/" + filename;
```

---

## 🔗 Riferimenti

- [Railway Volumes Documentation](https://docs.railway.app/reference/volumes)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Express.js Static Files](https://expressjs.com/en/starter/static-files.html)

---

## ✅ Checklist Deploy

Prima di fare il deploy finale:

- [ ] Volume creato su Railway con nome `uploads-volume`
- [ ] Mount path configurato su `/data`
- [ ] File `railway.toml` committato nel repository
- [ ] Codice aggiornato e testato localmente
- [ ] Database con percorsi corretti (`/uploads/...`)
- [ ] Git push eseguito
- [ ] Verificato nei log: `Upload directory: /data/uploads`
- [ ] Testato upload di un'immagine
- [ ] Testato che l'immagine persiste dopo redeploy

---

**🎉 Setup Completato!**

Le tue immagini ora sono persistenti e non verranno più cancellate ad ogni deploy su Railway.
