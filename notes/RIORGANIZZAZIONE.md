# 📋 Guida alla Riorganizzazione del Progetto

## ✅ Modifiche Completate

Il progetto è stato completamente riorganizzato per migliorare la manutenibilità e la comprensibilità del codice.

### 🔄 Cosa è Cambiato

#### 1. **Struttura delle Directory**

**PRIMA:**

```
src/
├── bin/
├── config/
├── middlewares/
├── models/
├── public/
│   ├── images/
│   ├── javascripts/
│   └── stylesheets/
├── routes/
├── services/
└── views/
```

**DOPO:**

```
src/
├── server/              # Script di avvio (ex bin/)
├── core/                # Configurazioni, middleware e modelli
│   ├── config/
│   ├── middlewares/
│   └── models/
├── features/            # Funzionalità organizzate per dominio
│   ├── admin/
│   ├── auth/
│   ├── campionati/
│   ├── eventi/
│   ├── galleria/
│   ├── notizie/
│   ├── prenotazioni/
│   ├── recensioni/
│   ├── squadre/
│   └── users/
├── shared/              # Componenti condivisi
│   ├── routes/
│   ├── services/
│   └── views/
└── public/              # Asset statici riorganizzati
    ├── assets/
    │   ├── images/     # ex images/
    │   ├── scripts/    # ex javascripts/
    │   └── styles/     # ex stylesheets/
    └── uploads/
```

#### 2. **Organizzazione per Feature**

Ogni funzionalità principale ora ha la sua directory con:

- `routes/` - Gestione endpoint HTTP
- `services/` - Logica business e DAO
- `views/` - Template EJS specifici

Esempio per la feature "notizie":

```
features/notizie/
├── routes/
│   └── notizie.js
├── services/
│   └── dao-notizie.js
└── views/
    ├── crea_notizia.ejs
    ├── notizie.ejs
    └── visualizza_notizia.ejs
```

#### 3. **Asset Statici**

Gli URL degli asset sono stati aggiornati:

| Prima                     | Dopo                               |
| ------------------------- | ---------------------------------- |
| `/images/logo.png`        | `/assets/images/logo.png`          |
| `/javascripts/login.js`   | `/assets/scripts/login.js`         |
| `/stylesheets/Common.css` | `/assets/styles/Common.css`        |
| `/uploads/photo.jpg`      | `/uploads/photo.jpg` ✓ (invariato) |

### 📝 File Modificati

Tutti i seguenti file sono stati aggiornati con i nuovi path:

#### File di Configurazione

- ✅ `package.json` - Script di avvio aggiornato
- ✅ `src/app.js` - Import e configurazione views
- ✅ `src/core/config/database.js` - Path database corretto

#### Route

- ✅ Tutte le route in `src/features/*/routes/*.js`
- ✅ Route condivise in `src/shared/routes/*.js`

#### Servizi (DAO)

- ✅ Tutti i DAO in `src/features/*/services/*.js`
- ✅ Servizio email in `src/shared/services/email-service.js`

#### Middleware

- ✅ `src/core/middlewares/auth.js`
- ✅ `src/core/middlewares/jwt.js`
- ✅ `src/core/middlewares/getUser.js`

#### Views

- ✅ Tutte le view `.ejs` aggiornate con nuovi path asset
- ✅ Views organizzate per feature
- ✅ Views condivise in `src/shared/views/`

### 🎯 Vantaggi della Nuova Struttura

1. **Più Intuitivo**: Ogni funzionalità è autocontenuta
2. **Scalabile**: Facile aggiungere nuove features
3. **Manutenibile**: Codice correlato è vicino
4. **Modulare**: Dependency chiare tra i moduli
5. **Professionale**: Struttura standard del settore

### 🔍 Come Orientarsi

#### Per trovare una funzionalità:

```
Cerco la gestione delle prenotazioni?
→ features/prenotazioni/
  ├── routes/prenotazione.js     ← Endpoint HTTP
  ├── services/dao-prenotazione.js ← Logica business
  └── views/prenotazione.ejs      ← Template

Cerco un middleware di autenticazione?
→ core/middlewares/auth.js

Cerco il modello Campo?
→ core/models/campo.js

Cerco uno script JavaScript client-side?
→ public/assets/scripts/
```

### ⚙️ Import Pattern

#### Da una feature ad un'altra:

```javascript
// In features/admin/routes/admin.js
const userDao = require("../../users/services/dao-user");
const notizieDao = require("../../notizie/services/dao-notizie");
```

#### Da una feature al core:

```javascript
// In features/eventi/services/dao-eventi.js
const db = require("../../../core/config/database");
const Evento = require("../../../core/models/evento");
```

#### Da shared:

```javascript
// In shared/routes/index.js
const daoNotizie = require("../../features/notizie/services/dao-notizie");
const { isLoggedIn } = require("../../core/middlewares/auth");
```

### ✅ Verifiche Effettuate

- ✅ Syntax check su tutti i file JavaScript
- ✅ Path dei require aggiornati
- ✅ Path database corretto
- ✅ Asset statici accessibili
- ✅ Server si avvia senza errori
- ✅ Connessione al database funzionante

### 🚀 Per Continuare lo Sviluppo

1. **Aggiungere una nuova feature:**

   ```bash
   mkdir -p src/features/nuova-feature/{routes,services,views}
   ```

2. **Aggiungere route alla feature:**

   - Crea `src/features/nuova-feature/routes/nuova-feature.js`
   - Importala in `src/app.js`

3. **Aggiungere views:**

   - Crea le view in `src/features/nuova-feature/views/`
   - Aggiungi il path in `app.set('views', [...])` in `src/app.js`

4. **Asset statici:**
   - Usa sempre `/assets/` prefix
   - Immagini → `/assets/images/`
   - Script → `/assets/scripts/`
   - Stili → `/assets/styles/`

### 📚 Documentazione

Consulta `src/README.md` per la documentazione completa della struttura.

### 🐛 Troubleshooting

**Errore "Cannot find module"?**

- Verifica i path relativi (usa `../`, `../../`, `../../../`)
- I modelli sono in `core/models/`
- Le configurazioni sono in `core/config/`

**Asset non caricati?**

- Verifica che usi `/assets/` come prefix
- Gli upload sono in `/uploads/` (senza assets)

**Database non trovato?**

- Il path è `../../../database/database.db` da `core/config/`
- Il database è nella root del progetto

## 🎉 Conclusione

La riorganizzazione è completa e il progetto è ora più pulito, organizzato e professionale!
