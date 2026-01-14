# Struttura del Progetto - Borgo Vercelli

Questo documento descrive l'organizzazione del codice sorgente del progetto.

## 📁 Struttura delle Directory

```
src/
├── app.js                          # Entry point principale dell'applicazione
├── server/                         # Server e script di avvio
│   ├── www                        # Script di avvio del server HTTP
│   └── create-admin.js            # Script per creare utenti amministratori
│
├── core/                          # Componenti core dell'applicazione
│   ├── config/                    # Configurazioni
│   │   └── database.js           # Configurazione database SQLite
│   ├── middlewares/               # Middleware Express
│   │   ├── auth.js               # Middleware di autenticazione e autorizzazione
│   │   ├── getUser.js            # Middleware per recupero utente
│   │   └── jwt.js                # Middleware per gestione JWT (Remember Me)
│   └── models/                    # Modelli dati del database
│       ├── campionato.js
│       ├── campo.js
│       ├── dirigenteSquadra.js
│       ├── evento.js
│       ├── giocatore.js
│       ├── immagine.js
│       ├── notizia.js
│       ├── prenotazione.js
│       ├── recensione.js
│       ├── squadra.js
│       └── user.js
│
├── features/                      # Funzionalità organizzate per dominio
│   ├── admin/                    # Pannello amministrazione
│   │   ├── routes/               # Route del pannello admin
│   │   └── views/                # View EJS per admin
│   │
│   ├── auth/                     # Autenticazione e profilo utente
│   │   ├── routes/               # Route per login, registrazione, reset password
│   │   └── views/                # View per login, registrazione, profilo
│   │
│   ├── campionati/               # Gestione campionati
│   │   ├── routes/               # Route per campionati
│   │   ├── services/             # DAO per campionati
│   │   └── views/                # View per visualizzazione campionati
│   │
│   ├── eventi/                   # Gestione eventi
│   │   ├── routes/               # Route per eventi
│   │   ├── services/             # DAO per eventi
│   │   └── views/                # View per eventi
│   │
│   ├── galleria/                 # Galleria immagini
│   │   ├── routes/               # Route per galleria
│   │   ├── services/             # DAO per immagini
│   │   └── views/                # View per galleria
│   │
│   ├── notizie/                  # Gestione notizie
│   │   ├── routes/               # Route per notizie
│   │   ├── services/             # DAO per notizie
│   │   └── views/                # View per notizie
│   │
│   ├── prenotazioni/             # Sistema prenotazioni campi
│   │   ├── routes/               # Route per prenotazioni
│   │   ├── services/             # DAO per prenotazioni e campi
│   │   └── views/                # View per prenotazioni
│   │
│   ├── recensioni/               # Gestione recensioni
│   │   ├── routes/               # Route per recensioni
│   │   ├── services/             # DAO per recensioni
│   │   └── views/                # View per recensioni
│   │
│   ├── squadre/                  # Gestione squadre e dirigenti
│   │   ├── routes/               # Route per squadre
│   │   ├── services/             # DAO per squadre, dirigenti e membri società
│   │   └── views/                # View per squadre e società
│   │
│   └── users/                    # Gestione utenti
│       ├── routes/               # Route per operazioni utente
│       └── services/             # DAO per utenti
│
├── shared/                        # Componenti condivisi tra features
│   ├── routes/                   # Route generiche
│   │   ├── index.js             # Route homepage, squadre, ecc.
│   │   ├── session.js           # Gestione sessioni
│   │   ├── search.js            # Ricerca globale
│   │   └── email.js             # Invio email
│   ├── services/                 # Servizi condivisi
│   │   └── email-service.js     # Servizio per invio email
│   └── views/                    # View condivise
│       ├── homepage.ejs         # Homepage
│       ├── contatti.ejs         # Pagina contatti
│       ├── error.ejs            # Pagina errore
│       ├── privacy.ejs          # Privacy policy
│       ├── regolamento.ejs      # Regolamento
│       ├── search.ejs           # Risultati ricerca
│       └── partials/            # Componenti riutilizzabili (navbar, footer, ecc.)
│
└── public/                       # Asset statici
    ├── assets/
    │   ├── images/              # Immagini statiche (loghi, icone)
    │   ├── scripts/             # JavaScript client-side
    │   │   ├── components/      # Componenti JavaScript riutilizzabili
    │   │   └── utils/           # Utility JavaScript
    │   └── styles/              # Fogli di stile CSS
    └── uploads/                 # File caricati dagli utenti
```

## 🎯 Principi di Organizzazione

### 1. **Separazione per Dominio (Feature-Based)**

Ogni funzionalità principale ha la sua directory in `features/` con:

- **routes**: gestione delle richieste HTTP
- **services**: logica di business e accesso ai dati (DAO)
- **views**: template EJS specifici

### 2. **Core Centralizzato**

Elementi condivisi come configurazioni, middleware e modelli sono centralizzati in `core/`.

### 3. **Shared Components**

Componenti utilizzati da più features sono in `shared/`:

- Route generiche
- Servizi comuni (email)
- View utilizzate da più sezioni

### 4. **Asset Pubblici Organizzati**

Gli asset statici sono in `public/assets/` divisi per tipo:

- `/assets/images/` - Immagini statiche
- `/assets/scripts/` - JavaScript
- `/assets/styles/` - CSS
- `/uploads/` - Upload utenti

## 🔗 Path di Riferimento

### Import tra Moduli

**Da una feature ad un'altra:**

```javascript
const daoUser = require("../../users/services/dao-user");
```

**Da una feature al core:**

```javascript
const db = require("../../../core/config/database");
const { isLoggedIn } = require("../../../core/middlewares/auth");
```

**Da shared alle features:**

```javascript
const daoNotizie = require("../../features/notizie/services/dao-notizie");
```

### URL Asset Statici

Nelle view EJS, usa questi path:

```html
<!-- CSS -->
<link href="/assets/styles/Common.css" rel="stylesheet" />

<!-- JavaScript -->
<script src="/assets/scripts/login.js"></script>

<!-- Immagini statiche -->
<img src="/assets/images/Logo.png" alt="Logo" />

<!-- Upload utenti -->
<img src="/uploads/user_123_photo.jpg" alt="Foto profilo" />
```

## 🚀 Avvio del Progetto

```bash
# Avvia il server
npm start

# Il server parte su http://localhost:3000
# Entry point: src/server/www → src/app.js
```

## 📝 Note

- Tutti i path relativi sono stati aggiornati per riflettere la nuova struttura
- Le views sono configurate in `app.js` per cercare in tutte le directory features
- I file statici sono serviti automaticamente da `/public`
- Gli upload sono accessibili tramite `/uploads`

## 🔧 Manutenzione

Quando aggiungi nuove funzionalità:

1. **Crea una nuova feature directory** se necessario:

   ```
   features/nuova-feature/
   ├── routes/
   ├── services/
   └── views/
   ```

2. **Aggiungi la view directory in app.js** se crei nuove views

3. **Segui i pattern di import** già stabiliti nel progetto

4. **Asset statici**: usa sempre `/assets/` prefix
