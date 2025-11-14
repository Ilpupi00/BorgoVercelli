# BorgoVercelli - Gestione Campi Sportivi

Applicazione web per la gestione di campi sportivi, squadre, prenotazioni e notizie.

## 🚀 Quick Start

### Sviluppo Locale

```bash
# Installa dipendenze
npm install

# Configura variabili d'ambiente
cp .env.example .env
# Modifica .env con le tue credenziali

# Avvia il server
npm start
```

L'app sarà disponibile su `http://localhost:3000`

## 📦 Deploy su Railway

### Setup Volume Persistente per Immagini

**IMPORTANTE**: Le immagini caricate dagli utenti vengono salvate in un **Railway Volume** persistente.

1. **Crea il Volume su Railway:**
   - Dashboard Railway → Progetto → Servizio Node.js
   - Tab "Settings" → Sezione "Volumes"
   - Click "+ New Volume"
   - Name: `uploads-volume`
   - Mount Path: `/data`

2. **Deploy:**
   ```bash
   git push
   ```

3. **Verifica nei log:**
   ```
   [MULTER] Upload directory: /data/uploads
   [APP] Serving uploads from: /data/uploads
   ```

📖 **Documentazione completa**: [`docs/RAILWAY_VOLUME_SETUP.md`](./docs/RAILWAY_VOLUME_SETUP.md)

## 📂 Struttura Progetto

```
src/
├── app.js              # Configurazione Express principale
├── core/               # Core framework (config, models, middlewares)
├── features/           # Moduli feature-based
│   ├── admin/         # Pannello amministrazione
│   ├── auth/          # Login e registrazione
│   ├── notizie/       # Gestione notizie
│   ├── eventi/        # Gestione eventi
│   ├── prenotazioni/  # Sistema prenotazioni
│   ├── recensioni/    # Sistema recensioni
│   └── squadre/       # Gestione squadre
├── shared/            # Componenti condivisi (routes, services)
└── public/            # Assets statici (CSS, JS, immagini)
```

## 🗄️ Database

- **Sviluppo**: SQLite (`database/database.db`)
- **Produzione**: PostgreSQL (Railway)

### Migrazioni

```bash
# Schema iniziale
psql $DATABASE_URL < database/migrations/schema.sql

# Popola dati di esempio
psql $DATABASE_URL < database/migrations/popola_*.sql
```

## 🔧 Variabili d'Ambiente

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Session
SESSION_SECRET=your-secret-key

# Email (opzionale)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## 📚 Documentazione

- [Quick Start Guide](./docs/QUICK_START_GUIDE.md)
- [Railway Volume Setup](./docs/RAILWAY_VOLUME_SETUP.md)
- [Testing Guide](./docs/TESTING_GUIDE.md)
- [Admin System](./docs/MODIFICHE_ADMIN_SYSTEM.md)

## 🛠️ Tecnologie

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (prod) / SQLite (dev)
- **Template Engine**: EJS
- **Authentication**: Passport.js
- **File Upload**: Multer
- **Deployment**: Railway

## 📝 License

MIT
