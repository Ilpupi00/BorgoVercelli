# Sistema Permessi Sidebar Admin

## 📋 Modifiche Implementate

Ho implementato un sistema di permessi nella sidebar dell'area admin che mostra solo le voci di menu pertinenti al ruolo dell'utente.

## 🎯 Obiettivo

Rimuovere dalla sidebar le voci che non sono rilevanti per il ruolo dell'utente, migliorando l'esperienza utente e riducendo la confusione.

## 🔐 Matrice Visibilità Menu

### 📄 Sezione Contenuti
**Visibile per:** Admin, Presidente, Vicepresidente, Segretario

Voci:
- 📰 Gestisci Notizie
- 📅 Gestisci Eventi
- 🖼️ Gestisci Galleria

**Ruoli esclusi:**
- ❌ Dirigente (4) - può vedere solo le proprie notizie tramite altre interfacce
- ❌ Gestore Campo (6) - non gestisce contenuti

---

### 👥 Sezione Squadre
**Visibile per:** Admin, Presidente, Vicepresidente, Segretario, Dirigente

Voci:
- 👥 Gestisci Squadre

**Nota:** Il Dirigente vede solo le squadre assegnate (logica gestita a livello backend)

**Ruoli esclusi:**
- ❌ Gestore Campo (6) - non gestisce squadre

---

### ⚽ Sezione Campi & Campionati
**Visibile per:** Admin, Presidente, Vicepresidente, Segretario, Gestore Campo

Voci:
- ⚽ Gestisci Campi (tutti)
- 🏆 Gestisci Campionati (solo Admin, Presidente, Vicepresidente, Segretario)

**Ruoli esclusi:**
- ❌ Dirigente (4) - non gestisce campi né campionati
- ⚠️ Gestore Campo (6) - vede solo "Gestisci Campi", NON "Gestisci Campionati"

---

### 👤 Sezione Utenti
**Visibile per:** SOLO Admin

Voci:
- 👤 Gestore Utenti
- ⭐ Gestisci Recensioni

**Ruoli esclusi:**
- ❌ Tutti gli altri ruoli - funzionalità riservata esclusivamente all'amministratore

---

### 🔧 Sezione Strumenti
**Visibile per:** Tutti i ruoli admin

Voci:
- 📋 Prenotazioni (tutti)
- 📊 Statistiche (solo Admin)

---

### 🏠 Torna al Sito
**Visibile per:** Tutti i ruoli

---

## 📊 Riepilogo per Ruolo

### 1️⃣ Admin (ID: 1)
Vede **TUTTO**:
- ✅ Contenuti (Notizie, Eventi, Galleria)
- ✅ Squadre
- ✅ Campi & Campionati
- ✅ Utenti & Recensioni
- ✅ Prenotazioni & Statistiche
- ✅ Torna al Sito

### 2️⃣ Presidente (ID: 2)
- ✅ Contenuti (Notizie, Eventi, Galleria)
- ✅ Squadre
- ✅ Campi & Campionati
- ❌ Utenti & Recensioni
- ✅ Prenotazioni
- ❌ Statistiche
- ✅ Torna al Sito

### 3️⃣ Vicepresidente (ID: 3)
**Stesso del Presidente**
- ✅ Contenuti (Notizie, Eventi, Galleria)
- ✅ Squadre
- ✅ Campi & Campionati
- ❌ Utenti & Recensioni
- ✅ Prenotazioni
- ❌ Statistiche
- ✅ Torna al Sito

### 4️⃣ Dirigente (ID: 4)
**Menu minimale**:
- ❌ Contenuti
- ✅ Squadre (solo assegnate)
- ❌ Campi & Campionati
- ❌ Utenti & Recensioni
- ✅ Prenotazioni
- ❌ Statistiche
- ✅ Torna al Sito

### 5️⃣ Segretario (ID: 5)
**Stesso di Presidente e Vicepresidente**:
- ✅ Contenuti (Notizie, Eventi, Galleria)
- ✅ Squadre
- ✅ Campi & Campionati
- ❌ Utenti & Recensioni
- ✅ Prenotazioni
- ❌ Statistiche
- ✅ Torna al Sito

### 6️⃣ Gestore Campo (ID: 6)
**Focus su campi e prenotazioni**:
- ❌ Contenuti
- ❌ Squadre
- ✅ Gestisci Campi (NO campionati)
- ❌ Utenti & Recensioni
- ✅ Prenotazioni
- ❌ Statistiche
- ✅ Torna al Sito

---

## 🛠️ Implementazione Tecnica

### File Modificato
- `src/shared/views/partials/sidebar.ejs`

### Logica Applicata

```ejs
<!-- Esempio: Sezione Contenuti -->
<% if ([1, 2, 3, 5].includes(user.tipo_utente_id)) { %>
  <!-- Contenuti visibili solo per Admin, Presidente, Vicepresidente, Segretario -->
<% } %>

<!-- Esempio: Solo Admin -->
<% if (user.tipo_utente_id === 1) { %>
  <!-- Contenuto visibile solo per Admin -->
<% } %>
```

### Condizionali Usate

1. **Array.includes()** per gruppi di ruoli:
   ```javascript
   [1, 2, 3, 5].includes(user.tipo_utente_id)
   ```

2. **Confronto diretto** per ruolo singolo:
   ```javascript
   user.tipo_utente_id === 1
   ```

3. **Spaziatura dinamica** per evitare margini inutili:
   ```ejs
   <li class="nav-item <%= [1, 2, 3, 5].includes(user.tipo_utente_id) ? '' : 'mt-3' %>">
   ```

---

## ✅ Vantaggi

1. **UX Migliorata**: Ogni utente vede solo ciò che gli compete
2. **Meno Confusione**: Niente voci inutili o non accessibili
3. **Più Professionale**: Interfaccia pulita e pertinente
4. **Sicurezza**: Riduce la superficie di attacco nascondendo funzionalità non autorizzate
5. **Performance**: Meno rendering di elementi non necessari

---

## 🔒 Nota Sicurezza

⚠️ **IMPORTANTE**: Questo sistema filtra solo la **visualizzazione** delle voci di menu. La sicurezza effettiva è implementata nei middleware backend (`isAdmin`, `canManageCampi`, ecc.) che proteggono le route.

Il filtro della sidebar è un miglioramento UX, NON una misura di sicurezza!

---

## 📅 Data Implementazione

15 Dicembre 2025

---

## 🔄 Testing

Per testare:
1. Accedere con utenti di ruoli diversi
2. Verificare che la sidebar mostri solo le voci pertinenti
3. Controllare che i link funzionino correttamente
4. Verificare che l'accesso alle route sia protetto dai middleware backend

---

## 📝 Note Future

Se in futuro si aggiungono nuovi ruoli o permessi:
1. Aggiornare la logica condizionale in `sidebar.ejs`
2. Aggiornare questo documento
3. Verificare che i middleware backend siano allineati
