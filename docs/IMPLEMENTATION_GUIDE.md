# IMPLEMENTATION GUIDE: Sistema Temi Dinamici

Questa guida descrive come integrare e attivare il nuovo sistema di temi dinamici nel progetto **BorgoVercelli**.

## 🚀 Architettura del Sistema
Il sistema è basato su 3 pilastri principali:
1. **Database & API (Server-side):** Permette persistenza reale delle preferenze per gli utenti autenticati e configurazione globale da parte degli admin.
2. **Middleware Express:** Intercetta ogni richiesta, risolve la priorità del tema (DB > Cookie > Globale > Fallback) e inietta le Variabili CSS direttamente nell'<head> del documento HTML.
3. **JS Client-side (`client-tema-switcher.js`):** Sostituisce i colori "al volo" (senza refresh) manipolando `document.documentElement.style` e si occupa di sincronizzare in background eventuali modifiche al tema globale.

## 🛠️ Step 1: Esecuzione della Migrazione SQL
Devi creare le tabelle nel database Postgres per salvare le configurazioni:

1. Apri la shell del tuo database (Railway o locale).
2. Esegui lo script presente in: `database/migrations/migration_themes.sql`
   _Lo script creerà le 3 tabelle `tema_config`, `tema_personalizzato`, `tema_preferenza_utente` e i trigger associati._

## 🛠️ Step 2: Modifiche in `src/app.js`

Apri `src/app.js` e fai le seguenti modifiche:

**A. Registra le route admin e user API**
(Trova la sezione "MONTAGGIO ROUTE", verso la fine del file, dove monti `routesAdmin`)
```javascript
// Importa le route dei temi (in cima dove ci sono gli import route)
const routesAdminTema = require("./features/admin/routes/admin-tema");
const routesApiTemaUser = require("./features/users/routes/api-tema-user");

// ...
// Montale prima o vicino a routesAdmin
app.use("/admin", routesAdminTema);
app.use("/api", routesApiTemaUser);
```

**B. Aggiungi il Middleware Globale del Tema**
(Importante: Questo va aggiunto DOPO la configurazione di `passport.session()` e del middleware che imposta `res.locals.user`, ma PRIMA che partano i Router)
```javascript
// Importa il middleware
const { loadTema } = require("./core/middlewares/middleware-tema");

// ...
// Sotto app.use(normalizeUser); o app.use(jwtAuth);
app.use(loadTema);
```

## 🛠️ Step 3: Aggiornamento del Layout/Template globale

Devi modificare il template base del progetto (solitamente `header`, `head`, `layout` o un partial come `theme-includes.ejs`).

**A. Inserimento CSS Dinamico (nell'<head>)**
Apri `src/shared/views/partials/theme-includes.ejs` e assicurati che stampi la variabile `temaCSS` fornita dal middleware:
```html
<!-- TEMA DINAMICO GENERATO DAL MIDDLEWARE -->
<% if (typeof temaCSS !== 'undefined') { %>
    <style id="dynamic-theme-style"><%- temaCSS %></style>
<% } %>

<!-- CSS base variabili -->
<link rel="stylesheet" href="/assets/styles/theme-variables.css">
```

**B. Importazione Client-side Switcher**
Prima della chiusura del `</body>`, aggiungi il nuovo script che rimpiazza i vecchi gestori (es. `theme-manager.js`):
```html
<script src="/assets/scripts/client-tema-switcher.js"></script>
```

## 🛠️ Step 4: Modifiche Navbar (Dropdown Temi)
Assicurati che la tua Navbar (`src/shared/views/partials/navbar.ejs`) abbia il dropdown temi che punta ai nuovi "data-tema". 

Esempio corretto:
```html
<li class="nav-item dropdown">
  <button class="nav-link dropdown-toggle" id="theme-dropdown-btn" data-bs-toggle="dropdown">
    <i class="bi bi-circle-half"></i> Tema
  </button>
  <ul class="dropdown-menu">
    <li><button class="dropdown-item" data-tema="light">Tema Chiaro</button></li>
    <li><button class="dropdown-item" data-tema="dark">Tema Scuro</button></li>
    <li><button class="dropdown-item" data-tema="sport">Tema Sportivo</button></li>
    <li><button class="dropdown-item" data-tema="nature">Tema Natura</button></li>
  </ul>
</li>
```
(Lo script `client-tema-switcher.js` aggancerà automaticamente gli eventi click a tutti i bottoni che hanno l'attributo `data-tema="x"`).

## 🛠️ Step 5: Aggiunta del Link nel Pannello Admin
Apri la sidebar dell'admin (`src/features/admin/views/partials/sidebar.ejs` o simile) e aggiungi la voce per gestire i temi:
```html
<li class="nav-item">
    <a href="/admin/temi" class="nav-link text-white <%= (typeof activePage !== 'undefined' && activePage === 'temi') ? 'active bg-primary' : '' %>">
        <i class="bi bi-palette-fill me-2"></i> Gestione Temi
    </a>
</li>
```

---

## 🔍 Troubleshooting (Domande Frequenti)

**Q: Quando l'utente cambia tema, l'intero sito ricarica?**
A: No, `client-tema-switcher.js` estrae le variabili CSS da un API JSON (o un hardcoded fallback locale) e aggiorna *al volo* le variabili in `:root`. Parallelamente invia una chiamata AJAX (POST `/api/user/tema-preferenza`) per salvare la preferenza nel DB.

**Q: Come funziona il FOUC (Flash of Unstyled Content)? È gestito?**
A: Sì. Diversamente dal vecchio localStorage in cui il DOM partiva bianco e poi JS lo colorava scuro, ora il server sa *prima di inviare l'HTML* quale tema ha l'utente. Il middleware stampa un tag `<style>` inline nell'<head> bloccando il parsing fino all'applicazione delle giuste root variables. JS entra in gioco solo *dopo* per futuri cambi.

**Q: Cosa succede se si cancella un Tema Personalizzato attualmente usato dagli utenti?**
A: Il DAO contiene la query che, quando elimina il tema, cancella in cascata o svuota i record nella tabella `tema_preferenza_utente` legati a quello slug. Al successivo reload, il middleware farà fallback sul tema Globale.

**Q: I CSS esistenti si spaccheranno?**
A: No. Il file `theme-variables.css` mantiene gli stessi nomi di variabile usati precedentemente nel file originale (es. `--primary-color`, `--card-bg`). L'unica differenza è che non si usano più selettori rigidi come `[data-theme="dark"]`, ma semplicemente `:root { ... }` con i valori iniettati dinamicamente.
