# 📑 Indice Documentazione Progetto

## 📝 Documentazione Tecnica

### Standard e Guide

| Documento | Descrizione | Link |
|-----------|-------------|------|
| **Standard Commentazione** | Guide complete per JSDoc, EJS e CSS | [COMMENT_STANDARDS.md](./COMMENT_STANDARDS.md) |
| **Rapporto Commenti** | Stato implementazione e workflow | [COMMENTI_RAPPORTO.md](./COMMENTI_RAPPORTO.md) |
| **Esempio DAO** | File di esempio completamente commentato | [ESEMPIO_DAO_COMMENTATO.js](./ESEMPIO_DAO_COMMENTATO.js) |

### Struttura Progetto

| Documento | Descrizione | Link |
|-----------|-------------|------|
| **Struttura src/** | Organizzazione directory e moduli | [../src/README.md](../src/README.md) |
| **Guida Riorganizzazione** | Modifiche e come orientarsi | [../RIORGANIZZAZIONE.md](../RIORGANIZZAZIONE.md) |
| **Rapporto Riorganizzazione** | Report completo con statistiche | [../RAPPORTO_RIORGANIZZAZIONE.md](../RAPPORTO_RIORGANIZZAZIONE.md) |

### Feature Specifiche

| Documento | Descrizione | Link |
|-----------|-------------|------|
| **Admin System** | Miglioramenti pannello admin | [ADMIN_IMPROVEMENTS.md](./ADMIN_IMPROVEMENTS.md) |
| **Sistema Sospensione/Ban** | Gestione utenti sospesi | [MODIFICHE_ADMIN_SYSTEM.md](./MODIFICHE_ADMIN_SYSTEM.md) |
| **Modal e Bottoni** | UI components | [MODIFICHE_MODAL_BOTTONI.md](./MODIFICHE_MODAL_BOTTONI.md) |

## 🛠️ Script e Tool

| Script | Descrizione | Comando |
|--------|-------------|---------|
| **add-comments.sh** | Aggiunge header automatici | `./scripts/add-comments.sh` |
| **create-admin** | Crea utente amministratore | `node src/server/create-admin.js` |

## 📚 Guide Rapide

### Quick Start - Commentazione

```bash
# 1. Leggi gli standard
cat docs/COMMENT_STANDARDS.md

# 2. Aggiungi header base
./scripts/add-comments.sh

# 3. Consulta esempio completo
cat docs/ESEMPIO_DAO_COMMENTATO.js
```

### Quick Start - Sviluppo

```bash
# 1. Installa dipendenze
npm install

# 2. Configura database
# (il database è già incluso in database/database.db)

# 3. Avvia server
npm start

# 4. Apri browser
open http://localhost:3000
```

## 📖 Template Pronti

### JavaScript (JSDoc)

```javascript
/**
 * @fileoverview Descrizione file
 * @module path/modulo
 */

/**
 * Descrizione funzione
 * @param {tipo} param - Descrizione
 * @returns {tipo} Descrizione
 */
exports.funzione = function(param) {
    // ...
};
```

### EJS

```ejs
<%# 
  File: nome.ejs
  Descrizione: Cosa fa
  Parametri: cosa riceve
%>
```

### CSS

```css
/**
 * File: nome.css
 * Descrizione: Cosa stila
 */

/* ==================== SEZIONE ==================== */
```

## 🔍 Ricerca Rapida

### Dove Trovare...

| Cosa Cerchi | Dove Guardare |
|-------------|---------------|
| **Route di una feature** | `src/features/[feature]/routes/` |
| **Logica business** | `src/features/[feature]/services/` |
| **View template** | `src/features/[feature]/views/` |
| **Modelli database** | `src/core/models/` |
| **Middleware** | `src/core/middlewares/` |
| **Config database** | `src/core/config/database.js` |
| **JavaScript client** | `src/public/assets/scripts/` |
| **Stili CSS** | `src/public/assets/styles/` |

## 📊 Statistiche Progetto

- **Features**: 10 (admin, auth, campionati, eventi, galleria, notizie, prenotazioni, recensioni, squadre, users)
- **File JavaScript**: ~150+
- **View EJS**: ~44
- **CSS Files**: ~30
- **DAO Services**: ~12
- **Route Files**: ~14

## ✅ Checklist Qualità

Prima di considerare completo un modulo:

- [ ] Tutti i file hanno header JSDoc/commento
- [ ] Funzioni pubbliche documentate
- [ ] Parametri e return spiegati
- [ ] Esempi per funzioni complesse
- [ ] Sezioni logiche organizzate
- [ ] Logica complessa commentata inline
- [ ] Test funzionali passano
- [ ] Nessun errore di sintassi

## 🎯 Priorità Documentazione

### 🔴 Alta Priorità
1. File `app.js`
2. Tutti i DAO in `features/*/services/`
3. Middleware in `core/middlewares/`
4. Route principali

### 🟡 Media Priorità
5. Modelli in `core/models/`
6. Route condivise
7. JavaScript client-side

### 🟢 Bassa Priorità
8. View EJS (header e sezioni)
9. CSS (header e sezioni)

## 🤝 Contribuire

Quando aggiungi codice:

1. **Segui standard** in `COMMENT_STANDARDS.md`
2. **Documenta mentre scrivi**
3. **Usa template** per consistenza
4. **Aggiorna** questa documentazione se necessario

## 📞 Supporto

- **Documentazione completa**: Leggi tutti i file in `docs/`
- **Esempi**: Consulta file commentati come riferimento
- **Standard**: Segui `COMMENT_STANDARDS.md`

---

📝 **Mantieni aggiornato questo indice quando aggiungi nuova documentazione!**

---

_Ultimo aggiornamento: 10 Novembre 2025_
