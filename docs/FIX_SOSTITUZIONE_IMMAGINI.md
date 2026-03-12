# 🔄 Fix Sostituzione Immagini

## 📋 Problema Risolto

**Problema**: Quando si riapriva un evento/notizia con un'immagine esistente e si voleva sostituire l'immagine, il sistema richiedeva di caricarla due volte e faceva reload della pagina.

**Causa**:

- Il sistema faceva `window.location.reload()` dopo ogni upload
- Non c'era un modo chiaro per sostituire un'immagine esistente
- L'UI non gestiva correttamente la transizione tra immagine esistente e nuova

## ✅ Modifiche Implementate

### 1. Aggiunto Pulsante "Sostituisci"

**File**:

- `src/features/eventi/views/evento.ejs`
- `src/features/notizie/views/notizia.ejs`

**Modifica**: Aggiunto pulsante verde "Sostituisci" nelle immagini esistenti

```html
<button type="button" class="btn btn-sm btn-success replace-image-btn">
  <i class="bi bi-arrow-repeat"></i> Sostituisci
</button>
```

### 2. Rimosso Reload Automatico

**File**:

- `src/public/assets/scripts/crea_evento.js`
- `src/public/assets/scripts/crea_notizie.js`

**Prima**:

```javascript
if (result.success) {
  showSuccessMessage("Immagine caricata con successo!");
  setTimeout(() => {
    window.location.reload(); // ❌ Reload forzato
  }, 1500);
}
```

**Dopo**:

```javascript
if (result.success) {
  showSuccessMessage("Immagine caricata con successo!");
  // Aggiorna l'immagine nella preview senza reload
  if (result.imageUrl) {
    currentImageUrl = result.imageUrl;
    previewImg.src = result.imageUrl;
  }
}
```

### 3. Gestione Intelligente delle Preview

**Novità**:

- Quando selezioni una nuova immagine, l'immagine esistente viene nascosta automaticamente
- Il pulsante "Rimuovi" nella preview ripristina l'immagine esistente (se c'è)
- L'eliminazione dell'immagine esistente mostra l'area upload senza reload

**Codice**:

```javascript
// Nascondi immagine corrente quando selezioni nuova foto
if (currentImagePreview) {
  currentImagePreview.classList.add("d-none");
}

// Pulsante Rimuovi ripristina immagine esistente
if (currentImagePreview) {
  currentImagePreview.classList.remove("d-none");
} else {
  uploadArea.classList.remove("d-none");
}
```

### 4. Supporto Editor Immagini su Nuove Foto

**Novità**: Ora puoi modificare anche le foto appena caricate (prima dell'upload) con il pulsante "Modifica" nella preview

```javascript
// Edit preview
if (editPreviewBtn) {
  editPreviewBtn.addEventListener("click", () => {
    if (currentImageUrl) {
      openImageEditor(currentImageUrl);
    }
  });
}
```

### 5. Eliminazione Senza Reload

**Prima**: L'eliminazione faceva reload della pagina

**Dopo**: L'eliminazione rimuove l'elemento e mostra l'area upload immediatamente

```javascript
if (result.success) {
  showSuccessMessage("Immagine eliminata con successo!");
  // Nascondi preview corrente e mostra area upload
  if (currentImagePreview) {
    currentImagePreview.classList.add("d-none");
  }
  if (uploadArea) {
    uploadArea.classList.remove("d-none");
  }
}
```

## 🎯 Flusso Utente Migliorato

### Scenario 1: Creare Evento/Notizia con Immagine

1. Apri form creazione
2. Trascina/Seleziona immagine
3. Visualizza preview
4. (Opzionale) Modifica con editor
5. Salva form
6. ✅ Fatto - 1 solo caricamento

### Scenario 2: Sostituire Immagine Esistente

1. Apri evento/notizia in modifica
2. Vedi immagine corrente con 3 pulsanti:
   - **🔄 Sostituisci** - Apre selezione file
   - **✂️ Modifica** - Apre editor immagini
   - **🗑️ Elimina** - Rimuove immagine
3. Clicca "Sostituisci"
4. Seleziona nuova immagine
5. Visualizza preview (immagine vecchia nascosta)
6. (Opzionale) Modifica con editor
7. Salva form
8. ✅ Fatto - 1 solo caricamento, nessun reload

### Scenario 3: Modificare Immagine Esistente

1. Apri evento/notizia in modifica
2. Clicca "✂️ Modifica" sull'immagine
3. Usa editor: crop, zoom, rotate, flip
4. Salva modifiche
5. Salva form
6. ✅ Fatto

### Scenario 4: Eliminare Immagine

1. Apri evento/notizia in modifica
2. Clicca "🗑️ Elimina"
3. Conferma eliminazione
4. L'immagine sparisce, appare area upload
5. ✅ Fatto - senza reload

## 🔧 Variabili JavaScript Aggiunte

### crea_evento.js e crea_notizie.js

```javascript
const replaceImageBtn = document.querySelector(".replace-image-btn");
const editPreviewBtn = document.getElementById("editPreviewBtn");
const currentImagePreview = document.getElementById("currentImagePreview");
let currentImageUrl = null;
```

## 📱 Compatibilità

- ✅ Desktop: Funziona perfettamente
- ✅ Mobile: Touch-friendly, pulsanti grandi
- ✅ Tablet: Layout responsive
- ✅ Light/Dark Theme: Stili adattati

## 🐛 Bug Risolti

1. ✅ **Doppio caricamento**: Ora carica una volta sola
2. ✅ **Reload inutile**: Nessun reload dopo upload/delete
3. ✅ **Confusione UI**: Chiaro quando puoi sostituire
4. ✅ **Perdita modifiche**: Preview mantiene lo stato

## 🎨 UI Aggiornata

### Pulsanti Immagine Esistente

```
[🔄 Sostituisci] [✂️ Modifica] [🗑️ Elimina]
   Verde          Blu         Rosso
```

### Pulsanti Nuova Preview

```
[✂️ Modifica] [❌ Rimuovi]
   Blu         Rosso
```

## 🚀 Come Testare

1. **Test Sostituzione**:

   ```bash
   npm start
   # Vai a /evento/crea-evento/:id (con immagine esistente)
   # Clicca "Sostituisci"
   # Seleziona nuova immagine
   # Verifica che non faccia reload
   # Salva e verifica nuova immagine
   ```

2. **Test Eliminazione**:

   ```bash
   # Apri evento con immagine
   # Clicca "Elimina"
   # Verifica che mostri area upload senza reload
   ```

3. **Test Editor su Preview**:
   ```bash
   # Carica nuova immagine
   # Clicca "Modifica" nella preview
   # Modifica con editor
   # Verifica che applichi modifiche
   ```

## 📝 Note Tecniche

- **currentImageUrl**: Mantiene URL immagine corrente per editor
- **currentImagePreview**: Riferimento DOM all'immagine esistente
- **replaceImageBtn**: Trigger selezione file per sostituzione
- **Nessun reload**: Tutti gli aggiornamenti via manipolazione DOM

## ✨ Vantaggi

- 🚀 **Più veloce**: Nessun reload = risposta immediata
- 💪 **Più intuitivo**: Pulsante "Sostituisci" chiaro
- 🎯 **Meno click**: Un caricamento invece di due
- 🔄 **Più flessibile**: Puoi editare anche prima dell'upload
- 💾 **Meno banda**: Nessun reload = meno richieste

---

**Data**: 11 Dicembre 2024  
**Versione**: 2.1.0  
**Impatto**: Eventi e Notizie
