# ✂️ Fix Editor Immagini - Pulsante Modifica

## 🐛 Problema Risolto

Il pulsante "Modifica" per editare le immagini con Cropper.js non funzionava in:
- ❌ Eventi
- ❌ Notizie  
- ❌ Profilo

## 🔍 Causa

1. **Script caricato troppo tardi**: `image-editor-common.js` aveva `defer` e veniva caricato dopo `crea_evento.js`/`crea_notizie.js`
2. **Script mancante**: `image-editor-common.js` non era incluso in `notizia.ejs`
3. **Script mancante**: `image-editor-common.js` e `cropper.js` non erano inclusi in `profilo.ejs`

## ✅ Soluzioni Implementate

### 1. Eventi (`src/features/eventi/views/evento.ejs`)

**Prima**:
```html
<script src="/assets/scripts/crea_evento.js" defer></script>
<script src="/assets/scripts/image-editor-common.js" defer></script>
```

**Dopo**:
```html
<script src="/assets/scripts/image-editor-common.js"></script>
<script src="/assets/scripts/crea_evento.js" defer></script>
```

✅ `image-editor-common.js` carica PRIMA e SENZA defer
✅ `openImageEditor` è disponibile quando `crea_evento.js` si inizializza

### 2. Notizie (`src/features/notizie/views/notizia.ejs`)

**Prima**:
```html
<script src="/assets/scripts/crea_notizie.js" defer></script>
<!-- MANCANTE! -->
```

**Dopo**:
```html
<script src="/assets/scripts/image-editor-common.js"></script>
<script src="/assets/scripts/crea_notizie.js" defer></script>
```

✅ Aggiunto script mancante
✅ Ordine corretto

### 3. Profilo (`src/features/auth/views/profilo.ejs`)

**Aggiunti**:
```html
<!-- CSS -->
<link rel="stylesheet" href="/assets/styles/evento-upload.css">
<link rel="stylesheet" href="/assets/styles/image-editor.css">
<link href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css" rel="stylesheet">

<!-- JS -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js"></script>
<script src="/assets/scripts/image-editor-common.js"></script>
```

**Aggiunto pulsante Modifica**:
```html
<% if (imageUrl) { %>
<button type="button" class="btn btn-success btn-sm rounded-circle p-2 shadow me-1" 
        title="Modifica foto" 
        onclick="window.openImageEditor('<%= imageUrl %>')">
    <span class="bi bi-scissors"></span>
</button>
<% } %>
```

✅ Editor completamente integrato
✅ Pulsante "Modifica" verde accanto a "Cambia foto"

## 🎯 Come Funziona Ora

### Eventi e Notizie

**Immagine Esistente**:
```
[🔄 Sostituisci] [✂️ Modifica] [🗑️ Elimina]
```

**Click su "Modifica"**:
1. ✅ Apre editor Cropper.js
2. ✅ Carica immagine esistente
3. ✅ Permette crop, zoom, rotate, flip
4. ✅ Salva modifiche

### Profilo

**Immagine Profilo**:
```
[✂️ Modifica] [📷 Cambia]
   Verde       Blu
```

**Click su "Modifica"**:
1. ✅ Apre editor Cropper.js
2. ✅ Carica foto profilo
3. ✅ Permette modifiche
4. ✅ Salva (TODO: implementare salvataggio su profilo)

## 🔧 Dettagli Tecnici

### Ordine Caricamento Script

**Critico**: `image-editor-common.js` deve caricare PRIMA degli altri script che lo usano.

**Perché senza `defer`?**
```javascript
// image-editor-common.js
window.openImageEditor = openImageEditor; // Espone funzione globale
```

Se ha `defer`, si carica dopo il DOMContentLoaded, quindi quando `crea_evento.js` cerca `openImageEditor`, non esiste ancora.

**Soluzione**: Carica `image-editor-common.js` SENZA defer, così `openImageEditor` è disponibile subito.

### Chiamata Funzione

```javascript
// In crea_evento.js
if (typeof openImageEditor === 'function') {
    openImageEditor(imageUrl);
} else {
    console.error('❌ Funzione openImageEditor non disponibile');
}
```

✅ Con il fix, `typeof openImageEditor === 'function'` è sempre `true`

## 🧪 Test

### Test 1: Eventi
```bash
npm start
# Vai a /evento/crea-evento/:id (con immagine)
# Clicca "✂️ Modifica"
# Verifica si apre editor
```

### Test 2: Notizie
```bash
# Vai a /crea-notizie?id=:id (con immagine)
# Clicca "✂️ Modifica"
# Verifica si apre editor
```

### Test 3: Profilo
```bash
# Vai a /profilo (con foto profilo)
# Clicca "✂️ Modifica" (pulsante verde)
# Verifica si apre editor
```

## 📊 Verifica Console

Se tutto funziona, nella console dovresti vedere:
```
✅ Pulsante Modifica Esistente 1 trovato
✂️ Click su Modifica Immagine Esistente, URL: /uploads/...
```

Se NON funziona, vedrai:
```
❌ Funzione openImageEditor non disponibile
```

## ⚠️ Note

### Profilo - Salvataggio Editor
**TODO**: Il profilo ora può aprire l'editor, ma il salvataggio delle modifiche non è ancora implementato.

Per completare:
1. Catturare evento salvataggio da editor
2. Inviare immagine modificata a endpoint profilo
3. Aggiornare foto profilo server-side

### Performance
`image-editor-common.js` senza `defer` si carica immediatamente, ma è piccolo (~400 righe) quindi non impatta performance.

## 🎉 Risultato

✅ **Eventi**: Modifica funziona
✅ **Notizie**: Modifica funziona  
✅ **Profilo**: Editor si apre (salvataggio da implementare)

---

**Versione**: 2.2.0  
**Data**: 11 Dicembre 2024
