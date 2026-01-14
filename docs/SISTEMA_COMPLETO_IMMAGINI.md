# 📸 Sistema Completo Upload e Gestione Immagini

## 🎯 Panoramica

Sistema unificato per **Eventi** e **Notizie** con:

- ✅ Upload drag & drop moderno
- ✅ Editor immagini professionale (crop, resize, rotate, flip)
- ✅ Preview in tempo reale
- ✅ Light/Dark theme completo
- ✅ Mobile-first responsive
- ✅ Integrazione Cropper.js

---

## 🚀 Funzionalità Implementate

### Per **Eventi** e **Notizie**

#### 1. Upload Immagini

- **Drag & Drop** HTML5
- **Click per selezionare** file
- **Preview immediata** con FileReader API
- **Validazione client-side** (tipo, dimensione)
- **Progress bar** animata
- **Auto-upload** per entità esistenti

#### 2. Editor Immagini Avanzato

- **Crop** con aspect ratio predefiniti:
  - Libero (nessun vincolo)
  - 16:9 (widescreen)
  - 4:3 (standard)
  - 1:1 (quadrato)
  - 3:4 (verticale/mobile)
- **Zoom** slider 0-200%
- **Rotazione** -180° a +180°
- **Flip** orizzontale/verticale
- **Reset** alle impostazioni iniziali
- **Preview real-time** delle modifiche

#### 3. Gestione Immagini

- **Modifica** immagini esistenti
- **Elimina** con conferma
- **Sostituisci** con nuove immagini
- **Persistenza** su volume Railway

---

## 📁 File Modificati/Creati

### Backend

#### Eventi

- `src/features/eventi/routes/eventi.js`
  - `POST /evento/:id/upload-immagine` - Upload
  - `DELETE /evento/:id/immagine` - Elimina

#### Notizie

- `src/features/notizie/routes/notizie.js`
  - `POST /notizia/:id/upload-immagine` - Upload
  - `DELETE /notizia/:id/immagine` - Elimina

### Frontend

#### Templates

- `src/features/eventi/views/evento.ejs` - UI upload eventi
- `src/features/notizie/views/notizia.ejs` - UI upload notizie

#### JavaScript

- `src/public/assets/scripts/crea_evento.js` - Gestione upload eventi
- `src/public/assets/scripts/crea_notizie.js` - Gestione upload notizie
- `src/public/assets/scripts/image-editor-common.js` - Editor condiviso (NUOVO)

#### CSS

- `src/public/assets/styles/evento-upload.css` - Stili upload
- `src/public/assets/styles/image-editor.css` - Stili editor (NUOVO)

---

## 🎨 UI/UX Features

### Upload Area

```
┌─────────────────────────────────┐
│  ☁️ Drag & Drop Area             │
│                                 │
│  Trascina un'immagine qui       │
│  PNG, JPG, GIF fino a 5MB       │
│                                 │
│  [📁 Seleziona File]             │
└─────────────────────────────────┘
```

### Image Editor Modal

```
┌──────────────────────────────────────────┐
│  ✂️ Modifica Immagine              [×]    │
├──────────────────────────────────────────┤
│                                          │
│  [  Immagine con Cropper.js  ]           │
│                                          │
├──────────────────────────────────────────┤
│  Proporzioni:                            │
│  [🔓] [📺 16:9*] [🖼️ 4:3] [⬜ 1:1] [📱 3:4]│
│                                          │
│  Zoom:     [━━━●━━━━━] 100%              │
│  Rotazione: [━━━━●━━━━] 0°                │
│                                          │
│  [↔️ Flip H] [↕️ Flip V] [↺ Reset]         │
├──────────────────────────────────────────┤
│  [Annulla]          [✅ Salva Modifiche]  │
└──────────────────────────────────────────┘
```

---

## 💻 Utilizzo

### Per Amministratori/Dirigenti

#### Caricare Immagine Evento

1. Vai a `/evento/crea-evento` o `/evento/crea-evento/:id`
2. Trascina immagine nell'area o clicca "Seleziona File"
3. Visualizza preview
4. (Opzionale) Clicca "Modifica" per editare
5. Salva evento

#### Caricare Immagine Notizia

1. Vai a `/crea-notizie` o `/crea-notizie?id=:id`
2. Trascina immagine nell'area o clicca "Seleziona File"
3. Visualizza preview
4. (Opzionale) Clicca "Modifica" per editare
5. Salva notizia

#### Modificare Immagine Esistente

1. Apri evento/notizia in modifica
2. Clicca pulsante "✂️ Modifica" sull'immagine
3. Usa i controlli dell'editor:
   - **Proporzioni**: Seleziona ratio desiderato
   - **Zoom**: Ingrandisci/Riduci con slider
   - **Rotazione**: Ruota con slider
   - **Flip**: Specchia orizzontalmente o verticalmente
   - **Reset**: Ripristina impostazioni originali
4. Clicca "Salva Modifiche"
5. Salva il form principale

#### Eliminare Immagine

1. Apri evento/notizia in modifica
2. Clicca pulsante "🗑️ Elimina"
3. Conferma eliminazione
4. L'immagine viene rimossa immediatamente

---

## 🎨 Editor Immagini - Dettagli

### Aspect Ratio Presets

| Ratio  | Uso Ideale                 | Icona |
| ------ | -------------------------- | ----- |
| Libero | Nessun vincolo             | 🔓    |
| 16:9   | Video, header, widescreen  | 📺    |
| 4:3    | Standard, monitor classici | 🖼️    |
| 1:1    | Social media, avatar       | ⬜    |
| 3:4    | Mobile, verticale          | 📱    |

### Controlli

#### Zoom

- Range: 0% - 200%
- Incremento: 1%
- Shortcut: Rotella mouse (su canvas)

#### Rotazione

- Range: -180° a +180°
- Incremento: 1°
- Reset automatico su Reset button

#### Flip

- **Orizzontale**: Specchia sull'asse verticale
- **Verticale**: Specchia sull'asse orizzontale
- Applicabile multiplo (2 flip = originale)

#### Reset

- Ripristina tutte le modifiche
- Mantiene immagine originale
- Resetta zoom, rotazione, flip, crop

---

## 🔧 Integrazione Tecnica

### Cropper.js Configuration

```javascript
{
    aspectRatio: 16 / 9,      // Default ratio
    viewMode: 1,              // Restrict crop box
    dragMode: 'move',         // Move image by default
    autoCropArea: 1,          // Full area
    guides: true,             // Show grid
    center: true,             // Show center indicator
    cropBoxMovable: true,     // Moveable crop box
    cropBoxResizable: true,   // Resizable crop box
    responsive: true,         // Responsive to window
    modal: true,              // Show dark backdrop
    background: false         // No background
}
```

### Output Image Quality

```javascript
{
    maxWidth: 1920,
    maxHeight: 1080,
    fillColor: '#fff',
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    format: 'image/jpeg',
    quality: 0.95
}
```

---

## 🌐 API Endpoints

### Eventi

#### Upload Immagine

```http
POST /evento/:id/upload-immagine
Content-Type: multipart/form-data

Body:
  - immagine: File

Response:
{
  "success": true,
  "message": "Immagine caricata con successo",
  "imageUrl": "/uploads/1234567890-event.jpg"
}
```

#### Elimina Immagine

```http
DELETE /evento/:id/immagine
Content-Type: application/json

Response:
{
  "success": true,
  "message": "Immagine eliminata con successo"
}
```

### Notizie

#### Upload Immagine

```http
POST /notizia/:id/upload-immagine
Content-Type: multipart/form-data

Body:
  - immagine: File

Response:
{
  "success": true,
  "message": "Immagine caricata con successo",
  "imageUrl": "/uploads/1234567890-news.jpg"
}
```

#### Elimina Immagine

```http
DELETE /notizia/:id/immagine
Content-Type: application/json

Response:
{
  "success": true,
  "message": "Immagine eliminata con successo"
}
```

---

## 🎨 Temi

### Light Theme

- Upload area: Gradiente grigio chiaro
- Editor modal: Sfondo bianco
- Controlli: Blu (#3b82f6)
- Testo: Scuro (#1e293b)

### Dark Theme

- Upload area: Gradiente slate scuro
- Editor modal: Sfondo slate (#1e293b)
- Controlli: Blu chiaro (#60a5fa)
- Testo: Chiaro (#e2e8f0)

---

## 📱 Responsive

### Mobile (< 768px)

- Editor modal: 95vw
- Canvas: max-height 300px
- Pulsanti: Touch-friendly (44px min)
- Layout: Colonna singola

### Tablet (768px - 1023px)

- Editor modal: 90vw
- Canvas: max-height 350px
- Layout: Bilanciato

### Desktop (1024px+)

- Editor modal: 1200px max
- Canvas: max-height 600px
- Layout: Completo

---

## 🔒 Sicurezza

### Client-Side

- ✅ Validazione tipo file
- ✅ Validazione dimensione (5MB max)
- ✅ Preview sicura (FileReader)
- ✅ Sanitizzazione input

### Server-Side

- ✅ Multer validation
- ✅ Autenticazione richiesta
- ✅ Autorizzazione (admin/dirigente)
- ✅ Verifica esistenza entità
- ✅ Sanitizzazione nome file
- ✅ Storage isolato

---

## 🐛 Troubleshooting

### Editor non si apre

1. Verifica console per errori JavaScript
2. Controlla caricamento Cropper.js CDN
3. Verifica che `image-editor-common.js` sia caricato
4. Controlla conflitti con altri script

### Immagine croppa male

1. Assicurati che l'immagine sia caricata completamente
2. Prova a resettare l'editor
3. Verifica proporzioni selezionate
4. Controlla dimensioni immagine originale

### Modifiche non salvate

1. Clicca "Salva Modifiche" nell'editor
2. Poi salva il form principale (evento/notizia)
3. Verifica console per errori di upload
4. Controlla connessione di rete

### Dark theme non funziona

1. Verifica caricamento `image-editor.css`
2. Controlla attributo `[data-theme="dark"]`
3. Verifica sistema tema globale
4. Clear cache browser

---

## ✅ Test Completati

- [x] Upload drag & drop
- [x] Upload click
- [x] Preview immagine
- [x] Editor crop
- [x] Editor zoom
- [x] Editor rotate
- [x] Editor flip H/V
- [x] Editor reset
- [x] Salvataggio modifiche
- [x] Eliminazione immagine
- [x] Light theme
- [x] Dark theme
- [x] Responsive mobile
- [x] Responsive tablet
- [x] Responsive desktop
- [x] Validazione client
- [x] Validazione server
- [x] Autenticazione
- [x] Autorizzazione

---

## 🚀 Deploy

### Locale

```bash
npm start
# Testa su: http://localhost:3000
```

### Railway

```bash
git add .
git commit -m "feat: Add image upload and editor for events and news"
git push origin main
# Railway auto-deploy
```

### Verifica Post-Deploy

1. Testa upload su evento
2. Testa editor su evento
3. Testa upload su notizia
4. Testa editor su notizia
5. Verifica storage persistente
6. Testa dark theme
7. Testa responsive mobile

---

## 📚 Librerie Utilizzate

- **Cropper.js** v1.6.1 - Editor immagini professionale
- **Bootstrap** v5.3.4 - Framework UI
- **Bootstrap Icons** v1.11.3 - Icone moderne

---

## 🔄 Futuri Miglioramenti

- [ ] Supporto immagini multiple per entità
- [ ] Galleria con lightbox
- [ ] Filtri Instagram-style
- [ ] Watermark automatico
- [ ] Compressione intelligente
- [ ] Lazy loading
- [ ] CDN integration
- [ ] Image optimization service (TinyPNG, etc.)
- [ ] Gestione EXIF data
- [ ] Thumbnail automatici

---

**Versione**: 2.0.0  
**Data**: 11 Dicembre 2024  
**Sistema**: Borgo Vercelli
