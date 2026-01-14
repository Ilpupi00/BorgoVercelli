# 🔍 Guida Debug Upload Immagini

## 🐛 Debug Attivato

Ho aggiunto logging dettagliato in `crea_evento.js` per identificare il problema.

## 📊 Come Testare

### 1. Apri la Console del Browser

```
Chrome/Edge: F12 o Cmd+Option+I (Mac)
Firefox: F12 o Cmd+Option+K (Mac)
Safari: Cmd+Option+C (Mac) - abilita prima Developer menu
```

### 2. Vai alla Pagina Evento

```
http://localhost:3000/evento/crea-evento
o
http://localhost:3000/evento/crea-evento/:id (con id esistente)
```

### 3. Verifica Log nella Console

#### Al Caricamento Pagina

Dovresti vedere:

```
🖼️ Inizializzazione upload immagini...
📋 Elementi trovati: {
    immagineInput: true,
    selectImageBtn: true,
    dropZone: true,
    uploadArea: true,
    newImagePreview: true,
    currentImagePreview: true/false,
    deleteImageBtns: 0/1,
    replaceImageBtn: true/false,
    editImageBtns: 0/1
}
✅ Pulsante Sostituisci trovato, aggiungo listener
✅ Pulsante Modifica Preview trovato
✅ Pulsante Modifica Esistente 1 trovato
```

#### Quando Selezioni File

Dovresti vedere:

```
📁 File selezionato: { name: "foto.jpg", type: "image/jpeg", size: 123456 }
✅ Validazione passata
```

#### Durante Upload

Dovresti vedere:

```
📤 Upload immagine al server... { fileName: "foto.jpg", eventoId: "123" }
📥 Risposta server: 200
📊 Risultato: { success: true, message: "...", imageUrl: "/uploads/..." }
```

## 🔍 Problemi Comuni

### Problema 1: "❌ immagineInput non trovato!"

**Causa**: Elemento `<input type="file" id="immagineInput">` non presente
**Soluzione**: Verifica che `evento.ejs` contenga l'input con id corretto

### Problema 2: "⚠️ Pulsante Sostituisci non trovato"

**Causa**: Nessuna immagine esistente o pulsante non renderizzato
**Verifica**:

- Console mostra `currentImagePreview: false`?
- Nel DOM c'è `<div id="currentImagePreview">`?

### Problema 3: "❌ Funzione openImageEditor non disponibile"

**Causa**: Script `image-editor-common.js` non caricato
**Soluzione**:

```html
<script src="/assets/scripts/image-editor-common.js" defer></script>
```

### Problema 4: Upload non parte

**Causa**: Evento non ha ID
**Verifica**:

```javascript
const form = document.getElementById("eventoForm");
const eventoId = form.getAttribute("data-evento-id");
console.log("Evento ID:", eventoId);
```

### Problema 5: Immagine non appare

**Causa**: URL immagine non corretto o file non accessibile
**Verifica**:

1. Console mostra errore 404 per `/uploads/...`?
2. Verifica che la cartella uploads esista
3. Controlla permessi cartella

## 🛠️ Fix Rapidi

### Fix 1: Ricrea Evento con Immagine

```sql
-- Verifica immagini esistenti
SELECT * FROM IMMAGINI WHERE entita_riferimento = 'evento';

-- Se mancano, aggiungi una di test
INSERT INTO IMMAGINI (url, tipo, entita_riferimento, entita_id, ordine, created_at)
VALUES ('/uploads/test-image.jpg', 'evento', 'evento', 1, 1, datetime('now'));
```

### Fix 2: Verifica Uploads Directory

```bash
# Verifica cartella uploads esiste
ls -la src/public/uploads/

# Se non esiste, creala
mkdir -p src/public/uploads/
chmod 755 src/public/uploads/
```

### Fix 3: Test Upload Manuale

```bash
# Copia immagine di test
cp /path/to/test-image.jpg src/public/uploads/

# Verifica sia accessibile
curl http://localhost:3000/uploads/test-image.jpg
```

## 📋 Checklist Debugging

- [ ] Console mostra "🖼️ Inizializzazione upload immagini..."
- [ ] Tutti gli elementi sono `true` nel log "📋 Elementi trovati"
- [ ] Pulsanti hanno listener attaccati (vedi ✅ nei log)
- [ ] Click su "Sostituisci" mostra "🔄 Click su Sostituisci"
- [ ] Selezione file mostra "📁 File selezionato"
- [ ] Upload mostra "📤 Upload immagine al server"
- [ ] Risposta server è 200 con success: true
- [ ] Immagine appare nella preview

## 🚨 Se Ancora Non Funziona

### Invia i Log

Copia TUTTI i log della console e invia:

1. Log al caricamento pagina
2. Log quando clicchi pulsante
3. Log quando selezioni file
4. Log durante upload
5. Eventuali errori in rosso

### Informazioni Aggiuntive

- URL pagina esatta
- Hai un evento esistente con immagine? (ID?)
- Stai creando nuovo evento o modificando?
- Quale pulsante non funziona esattamente?

## 🔧 Rimuovi Logging (Dopo Debug)

Quando tutto funziona, rimuovi i `console.log` per produzione:

```bash
# Cerca tutti i console.log aggiunti
grep -n "console.log" src/public/assets/scripts/crea_evento.js

# Oppure commentali
sed -i '' 's/console.log(/\/\/ console.log(/g' src/public/assets/scripts/crea_evento.js
```

---

**Ricorda**: I log sono tuoi amici! Ti dicono esattamente cosa succede. 🐛✨
