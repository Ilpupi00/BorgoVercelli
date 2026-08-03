# Modifiche app.js necessarie per il Sistema Temi Dinamici

Per attivare correttamente il nuovo sistema dei temi, dovrai apportare alcune integrazioni mirate nel file `src/app.js`.
Ecco dove e cosa incollare, rispettando rigorosamente l'ordine dei middleware di Express.

### 1. Includere le nuove routes
Cerca la sezione intitolata `// ==================== IMPORT ROUTE ====================`. Aggiungi le seguenti righe:

```javascript
// Route per gestione temi (Admin e API Utenti)
const routesAdminTema = require("./features/admin/routes/admin-tema");
const routesApiTemaUser = require("./features/users/routes/api-tema-user");
```

### 2. Aggiungere il Middleware del Tema
Trova la sezione in cui è definito `const normalizeUser = require("./core/middlewares/normalizeUser");` e montato tramite `app.use(normalizeUser);`.
Subito sotto quella riga (o sotto `app.use(jwtAuth);`), devi inserire il middleware di caricamento tema:

```javascript
// Normalizzazione utente (esiste già)
const normalizeUser = require("./core/middlewares/normalizeUser");
app.use(normalizeUser);

// [NUOVO] - Middleware Sistema Temi
// Deve trovarsi DOPO il middleware delle sessioni e di passport/normalizeUser
// in modo che req.user sia già popolato
const { loadTema } = require("./core/middlewares/middleware-tema");
app.use(loadTema);
```

### 3. Montare le Routes
Cerca la sezione `// ==================== MONTAGGIO ROUTE ====================` (verso la fine del file, dove monti `app.use("/", routesAdmin);`).
Aggiungi le route dei temi:

```javascript
// ...
app.use("/prenotazione", routesPrenotazione); 
app.use("/", routesAdmin); // Pannello amministrazione base

// [NUOVO] - Route temi (admin e API)
app.use("/admin", routesAdminTema);
app.use("/api", routesApiTemaUser);

app.use("/campionato", routesCampionati); 
app.use("/users", routesUsers);
// ...
```

---

## ✅ Checklist di Verifica (Test Rapidi)

Dopo aver applicato queste modifiche e riavviato il server, esegui questi test rapidi:

1. **Test Middleware Injector:**
   - Apri una pagina in incognito.
   - Premi `Ctrl+U` (o `Cmd+Option+U` su Mac) per vedere il sorgente.
   - Cerca nell'<head> la stringa `<style id="dynamic-theme-style">`.
   - Se c'è, il middleware funziona.

2. **Test Route Admin:**
   - Fai login con un account admin.
   - Naviga a `/admin/temi`.
   - Dovresti vedere la dashboard con le 3 tab. Prova a cliccare "Provalo" su un tema predefinito.

3. **Test Persistenza API:**
   - Mentre sei loggato, attiva il tema "Sportivo" (o dark).
   - Ricarica la pagina. Il tema sportivo dovrebbe restare.
   - Spegni e riaccendi il browser, loggati di nuovo: il tema sportivo dovrebbe ripristinarsi subito.

## Note Sull'Ordine dei Middleware
È fondamentale che `loadTema` sia posizionato **dopo** che `cookie-parser` e `session`/`passport` abbiano completato il loro lavoro. Se viene posizionato troppo in alto, `req.user` o `req.cookies` saranno undefined e il sistema ricorrerà sempre al tema globale per tutti. Il posizionamento corretto (come indicato al punto 2) garantisce l'accesso a tutte le variabili necessarie.
