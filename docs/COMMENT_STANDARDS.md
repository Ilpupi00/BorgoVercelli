# 📝 Guida agli Standard di Commentazione del Codice

## Panoramica

Questo documento definisce gli standard per commentare il codice nel progetto Borgo Vercelli.

---

## 🔷 JavaScript / Node.js - JSDoc

### File Header (Obbligatorio per ogni file)

```javascript
/**
 * @fileoverview Breve descrizione del file e del suo scopo
 * @module path/del/modulo
 * @description Descrizione dettagliata delle funzionalità fornite dal file.
 * Può essere multi-linea per spiegare il contesto.
 */
```

### Funzioni ed Export

```javascript
/**
 * Breve descrizione della funzione in una riga
 * 
 * Descrizione dettagliata opzionale che spiega:
 * - Cosa fa la funzione
 * - Logica particolare
 * - Note importanti
 * 
 * @function nomeFunzione
 * @async (se la funzione è asincrona)
 * @param {tipo} nomeParametro - Descrizione del parametro
 * @param {tipo} [parametroOpzionale] - Parametro opzionale
 * @returns {Promise<tipo>|tipo} Descrizione di cosa ritorna
 * @throws {Error} Quando e perché lancia errori
 * 
 * @example
 * // Esempio di utilizzo
 * const result = await nomeFunzione(param1, param2);
 */
function nomeFunzione(parametro1, parametro2) {
    // Logica interna commentata dove necessario
}
```

### Classi

```javascript
/**
 * Descrizione della classe
 * 
 * @class NomeClasse
 * @description Descrizione dettagliata dello scopo della classe
 */
class NomeClasse {
    /**
     * Costruttore della classe
     * @param {tipo} param - Descrizione parametro
     */
    constructor(param) {
        /** @type {tipo} Descrizione proprietà */
        this.proprieta = param;
    }
    
    /**
     * Metodo della classe
     * @param {tipo} param - Descrizione
     * @returns {tipo} Descrizione ritorno
     */
    metodo(param) {
        // Implementazione
    }
}
```

### Costanti e Variabili Importanti

```javascript
/**
 * Descrizione della costante
 * @constant {tipo}
 */
const COSTANTE = 'valore';

/**
 * Descrizione della variabile
 * @type {tipo}
 */
let variabile = valoreiniziale;
```

### Commenti Inline

```javascript
function esempio() {
    // Commento breve per spiegare la riga successiva
    const risultato = operazioneComplessa();
    
    /* 
     * Commento multi-linea per spiegare
     * una sezione di codice più complessa
     */
    if (condizione) {
        // Azione
    }
}
```

### Sezioni di Codice

```javascript
// ==================== NOME SEZIONE ====================
// Usare per dividere file lunghi in sezioni logiche

// ==================== AUTENTICAZIONE ====================
function login() { }
function logout() { }

// ==================== GESTIONE PROFILO ====================
function updateProfile() { }
function deleteProfile() { }
```

---

## 🔷 EJS (Template)

### File Header

```ejs
<%# 
  File: nome-file.ejs
  Descrizione: Breve descrizione della pagina
  Feature: Nome feature (es. auth, notizie, prenotazioni)
  
  Parametri richiesti:
  - parametro1: descrizione
  - parametro2: descrizione
%>
```

### Sezioni della Pagina

```ejs
<%# ==================== HEAD E STILI ==================== %>
<head>
    <%# Stili specifici per questa pagina %>
    <link href="/assets/styles/NomeFile.css" rel="stylesheet">
</head>

<%# ==================== CONTENUTO PRINCIPALE ==================== %>
<main>
    <%# Descrizione di questa sezione %>
    <div class="container">
        ...
    </div>
</main>

<%# ==================== FOOTER ==================== %>
```

### Blocchi Condizionali e Cicli

```ejs
<%# Verifica se l'utente è autenticato %>
<% if (isLoggedIn) { %>
    <%# Mostra menu utente %>
    <div class="user-menu">...</div>
<% } else { %>
    <%# Mostra bottoni login/registrazione %>
    <div class="auth-buttons">...</div>
<% } %>

<%# Ciclo sugli elementi con controllo array vuoto %>
<% if (items && items.length > 0) { %>
    <% items.forEach(item => { %>
        <%# Render singolo item %>
        <div><%= item.nome %></div>
    <% }); %>
<% } else { %>
    <%# Messaggio quando non ci sono elementi %>
    <p>Nessun elemento disponibile</p>
<% } %>
```

---

## 🔷 CSS

### File Header

```css
/**
 * File: nome-file.css
 * Descrizione: Stili per [pagina/componente]
 * Feature: nome-feature
 */
```

### Sezioni

```css
/* ==================== LAYOUT GENERALE ==================== */
.container {
    /* Definizione layout */
}

/* ==================== HEADER ==================== */
.header {
    /* Stili header */
}

/* ==================== COMPONENTI ==================== */
/* Card */
.card {
    /* Stili card */
}

/* Bottoni */
.btn-primary {
    /* Stile bottone primario */
}

/* ==================== RESPONSIVE ==================== */
/* Tablet */
@media (max-width: 768px) {
    /* Stili per tablet */
}

/* Mobile */
@media (max-width: 576px) {
    /* Stili per mobile */
}
```

### Commenti per Regole Specifiche

```css
.elemento {
    /* Fix per bug specifico in Safari */
    -webkit-transform: translateZ(0);
    
    /* Transizione smooth per hover */
    transition: all 0.3s ease;
}
```

---

## 📋 Esempi Completi

### DAO (Data Access Object)

```javascript
/**
 * @fileoverview Data Access Object per la gestione delle notizie
 * @module features/notizie/services/dao-notizie
 * @description Fornisce metodi per operazioni CRUD sulle notizie,
 * inclusa gestione autori, categorie e paginazione.
 */

'use strict';

const db = require('../../../core/config/database');
const Notizia = require('../../../core/models/notizia');

// ==================== LETTURA ====================

/**
 * Recupera tutte le notizie dal database
 * 
 * @async
 * @function getAllNotizie
 * @returns {Promise<Array<Notizia>>} Array di oggetti notizia
 * @throws {Error} Se errore nel database
 * 
 * @example
 * const notizie = await getAllNotizie();
 * console.log(notizie.length); // 10
 */
exports.getAllNotizie = async function() {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM notizie ORDER BY data_pubblicazione DESC';
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject({ error: 'Errore nel recupero notizie: ' + err.message });
            } else {
                // Mappa le righe in oggetti Notizia
                const notizie = rows.map(row => new Notizia(row));
                resolve(notizie);
            }
        });
    });
};

// ==================== CREAZIONE ====================

/**
 * Crea una nuova notizia
 * 
 * @async
 * @function createNotizia
 * @param {Object} dati - Dati della notizia
 * @param {string} dati.titolo - Titolo della notizia
 * @param {string} dati.contenuto - Contenuto HTML della notizia
 * @param {number} dati.autore_id - ID dell'autore
 * @returns {Promise<Object>} Oggetto con id della notizia creata
 * @throws {Error} Se dati mancanti o errore database
 */
exports.createNotizia = async function(dati) {
    // Validazione input
    if (!dati.titolo || !dati.contenuto) {
        throw new Error('Titolo e contenuto sono obbligatori');
    }
    
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO notizie (titolo, contenuto, autore_id, data_pubblicazione) 
                     VALUES (?, ?, ?, datetime('now'))`;
        
        db.run(sql, [dati.titolo, dati.contenuto, dati.autore_id], function(err) {
            if (err) {
                reject({ error: 'Errore creazione notizia: ' + err.message });
            } else {
                resolve({ id: this.lastID, message: 'Notizia creata con successo' });
            }
        });
    });
};
```

### Route

```javascript
/**
 * @fileoverview Route per la gestione delle notizie
 * @module features/notizie/routes/notizie
 * @description Definisce gli endpoint HTTP per visualizzare, creare,
 * modificare ed eliminare notizie.
 */

'use strict';

const express = require('express');
const router = express.Router();
const daoNotizie = require('../services/dao-notizie');
const { isLoggedIn, isAdminOrDirigente } = require('../../../core/middlewares/auth');

// ==================== ENDPOINT PUBBLICI ====================

/**
 * GET /notizie
 * Visualizza l'elenco di tutte le notizie
 */
router.get('/notizie', async (req, res) => {
    try {
        const notizie = await daoNotizie.getAllNotizie();
        res.render('notizie', { notizie });
    } catch (error) {
        console.error('Errore recupero notizie:', error);
        res.status(500).render('error', { 
            message: 'Errore nel caricamento delle notizie' 
        });
    }
});

// ==================== ENDPOINT PROTETTI ====================

/**
 * POST /notizie/crea
 * Crea una nuova notizia (solo admin/dirigente)
 */
router.post('/notizie/crea', isLoggedIn, isAdminOrDirigente, async (req, res) => {
    try {
        // Estrai dati dal body
        const { titolo, contenuto } = req.body;
        
        // Crea notizia con autore corrente
        const result = await daoNotizie.createNotizia({
            titolo,
            contenuto,
            autore_id: req.user.id
        });
        
        res.status(201).json(result);
    } catch (error) {
        console.error('Errore creazione notizia:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

### View EJS

```ejs
<%# 
  File: notizie.ejs
  Descrizione: Pagina di visualizzazione elenco notizie
  Feature: notizie
  
  Parametri richiesti:
  - notizie: Array di oggetti notizia
  - isLoggedIn: Boolean se l'utente è autenticato
  - user: Oggetto utente (se autenticato)
%>

<!DOCTYPE html>
<html lang="it">
<head>
    <%# ==================== META E TITOLO ==================== %>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notizie - Borgo Vercelli</title>
    
    <%# ==================== STILI ==================== %>
    <link href="/assets/styles/Common.css" rel="stylesheet">
    <link href="/assets/styles/Notizie.css" rel="stylesheet">
</head>

<body>
    <%# ==================== HEADER ==================== %>
    <%- include('../partials/navbar') %>
    
    <%# ==================== CONTENUTO PRINCIPALE ==================== %>
    <main class="container">
        <h1>Ultime Notizie</h1>
        
        <%# Mostra bottone crea solo se admin/dirigente %>
        <% if (isLoggedIn && (user.tipo_utente_id === 1 || user.tipo_utente_id === 2)) { %>
            <a href="/notizie/crea" class="btn btn-primary">
                Crea Nuova Notizia
            </a>
        <% } %>
        
        <%# ==================== LISTA NOTIZIE ==================== %>
        <div class="notizie-list">
            <% if (notizie && notizie.length > 0) { %>
                <%# Ciclo su tutte le notizie %>
                <% notizie.forEach(notizia => { %>
                    <article class="notizia-card">
                        <%# Titolo notizia %>
                        <h2><%= notizia.titolo %></h2>
                        
                        <%# Anteprima contenuto %>
                        <p class="preview">
                            <%- notizia.contenuto.substring(0, 200) %>...
                        </p>
                        
                        <%# Link leggi di più %>
                        <a href="/notizie/<%= notizia.id %>" class="btn-link">
                            Leggi di più
                        </a>
                    </article>
                <% }); %>
            <% } else { %>
                <%# Messaggio quando non ci sono notizie %>
                <p class="no-data">Nessuna notizia disponibile al momento.</p>
            <% } %>
        </div>
    </main>
    
    <%# ==================== FOOTER ==================== %>
    <%- include('../partials/footer') %>
    
    <%# ==================== SCRIPTS ==================== %>
    <script src="/assets/scripts/notizie.js"></script>
</body>
</html>
```

### CSS

```css
/**
 * File: Notizie.css
 * Descrizione: Stili per la pagina delle notizie
 * Feature: notizie
 */

/* ==================== LAYOUT PRINCIPALE ==================== */
.notizie-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

/* ==================== CARD NOTIZIA ==================== */
.notizia-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* Effetto hover sulla card */
.notizia-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* Titolo della notizia */
.notizia-card h2 {
    color: #333;
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

/* Anteprima testo */
.notizia-card .preview {
    color: #666;
    line-height: 1.6;
    margin-bottom: 1rem;
}

/* ==================== STATI SPECIALI ==================== */
/* Messaggio quando non ci sono dati */
.no-data {
    text-align: center;
    color: #999;
    padding: 3rem;
    font-style: italic;
}

/* ==================== RESPONSIVE ==================== */
/* Tablet */
@media (max-width: 768px) {
    .notizie-list {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1.5rem;
    }
}

/* Mobile */
@media (max-width: 576px) {
    .notizie-list {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
    
    .notizia-card {
        padding: 1rem;
    }
}
```

---

## ✅ Checklist

Prima di considerare un file "completamente commentato":

### JavaScript
- [ ] Header file con @fileoverview e @module
- [ ] Ogni funzione export ha JSDoc completo
- [ ] Parametri documentati con @param
- [ ] Return documentato con @returns
- [ ] Errori documentati con @throws
- [ ] Esempio di utilizzo con @example (per funzioni pubbliche)
- [ ] Sezioni logiche separate con commenti
- [ ] Commenti inline per logica complessa

### EJS
- [ ] Header file con descrizione e parametri
- [ ] Sezioni principali marcate
- [ ] Blocchi condizionali spiegati
- [ ] Cicli commentati
- [ ] Include spiegati

### CSS
- [ ] Header file con descrizione
- [ ] Sezioni principali separate
- [ ] Regole complesse spiegate
- [ ] Media query organizzate
- [ ] Fix specifici documentati

---

## 🎯 Best Practices

1. **Essere Chiari**: Scrivi come se spiegassi a un nuovo sviluppatore
2. **Essere Concisi**: Commenti brevi ma informativi
3. **Aggiornare**: I commenti devono riflettere il codice attuale
4. **Non Ovvio**: Commenta "perché", non "cosa" (se ovvio dal codice)
5. **Consistenza**: Usa lo stesso stile in tutto il progetto

---

## 📚 Risorse

- [JSDoc Documentation](https://jsdoc.app/)
- [ESLint JSDoc Plugin](https://github.com/gajus/eslint-plugin-jsdoc)
- [Clean Code Comments](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
