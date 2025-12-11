# Sistema Upload Immagini Eventi

## 📸 Panoramica

Sistema completo di upload immagini per gli eventi con interfaccia moderna, responsive e supporto light/dark theme.

## ✨ Caratteristiche

### Frontend
- **Drag & Drop**: Trascina le immagini direttamente nell'area di upload
- **Preview in tempo reale**: Visualizza l'immagine prima del caricamento
- **Animazioni fluide**: Transizioni smooth e feedback visivo
- **Responsive**: Ottimizzato per mobile, tablet e desktop
- **Light/Dark Theme**: Supporto completo per entrambi i temi
- **Validazione**: Controllo formato (PNG, JPG, GIF) e dimensione (max 5MB)
- **Progress bar**: Indicatore di caricamento animato

### Backend
- **Upload sicuro**: Validazione server-side con Multer
- **Storage persistente**: Salvataggio su volume Railway (`/data/uploads`)
- **Database integration**: Tabella IMMAGINI con relazione eventi
- **API RESTful**: Endpoints per upload/eliminazione

## 🏗️ Architettura

### Database
```sql
-- Tabella IMMAGINI
CREATE TABLE IMMAGINI (
  id SERIAL PRIMARY KEY,
  url VARCHAR(500),
  tipo VARCHAR(50),           -- 'evento'
  entita_riferimento VARCHAR(100), -- 'evento'
  entita_id INTEGER,          -- ID dell'evento
  ordine INTEGER DEFAULT 1,
  descrizione TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### File Modificati

#### Backend
- **`src/features/eventi/routes/eventi.js`**
  - `POST /evento/:id/upload-immagine` - Upload nuova immagine
  - `DELETE /evento/:id/immagine` - Elimina immagine evento

- **`src/features/eventi/services/dao-eventi.js`**
  - `getEventoById()` - Esteso per includere immagini associate

- **`src/features/admin/services/dao-admin.js`**
  - `insertImmagine()` - Inserisce record nella tabella IMMAGINI
  - `deleteImmaginiByEntita()` - Elimina immagini per entità

#### Frontend
- **`src/features/eventi/views/evento.ejs`**
  - Sezione upload con preview e drag & drop
  - Visualizzazione immagine esistente

- **`src/public/assets/scripts/crea_evento.js`**
  - `initializeImageUpload()` - Gestisce upload e interazioni
  - Drag & drop handler
  - Preview manager
  - API calls per upload/delete

- **`src/public/assets/styles/evento-upload.css`**
  - Stili moderni con gradients e animazioni
  - Supporto light/dark theme completo
  - Media queries responsive (mobile-first)

## 🎨 Design System

### Light Theme
- Upload area: Gradiente blu/grigio chiaro
- Hover: Accent blu (#3b82f6)
- Shadows: Soft e leggere

### Dark Theme  
- Upload area: Gradiente slate scuro
- Hover: Blu più luminoso (#60a5fa)
- Shadows: Più profonde per contrasto

### Responsive Breakpoints
- **Mobile** (< 768px): Layout compatto, icone ridotte
- **Tablet** (768px+): Dimensioni intermediate
- **Desktop** (1024px+): Layout completo con max-height 400px
- **Large Desktop** (1280px+): Max-height 450px

## 🚀 Utilizzo

### Per Amministratori/Dirigenti

#### 1. Creare Nuovo Evento con Immagine
1. Vai su `/evento/crea-evento`
2. Compila i campi dell'evento
3. Nell'area **"Immagine Evento"**:
   - Clicca su "Seleziona File" o
   - Trascina l'immagine nell'area evidenziata
4. Visualizza la preview
5. Salva l'evento

**Nota**: Per nuovi eventi, l'immagine viene salvata solo dopo il primo salvataggio dell'evento.

#### 2. Modificare Evento Esistente
1. Vai su `/evento/crea-evento/:id`
2. Se presente, vedrai l'immagine attuale
3. Per sostituirla:
   - Clicca "Elimina" sull'immagine esistente
   - Carica una nuova immagine
4. L'upload avviene automaticamente

#### 3. Eliminare Immagine
1. Apri l'evento in modifica
2. Clicca il pulsante "🗑️ Elimina" sull'immagine
3. Conferma l'eliminazione
4. L'immagine viene rimossa dal server e dal database

## 🔧 API Endpoints

### Upload Immagine
```javascript
POST /evento/:id/upload-immagine
Content-Type: multipart/form-data

Body:
  - immagine: File (image/*)

Response:
{
  "success": true,
  "message": "Immagine caricata con successo",
  "imageUrl": "/uploads/1234567890-event.jpg"
}
```

### Elimina Immagine
```javascript
DELETE /evento/:id/immagine
Content-Type: application/json

Response:
{
  "success": true,
  "message": "Immagine eliminata con successo"
}
```

## 🎯 Validazioni

### Client-Side
- Tipo file: `image/*` (PNG, JPG, GIF, etc.)
- Dimensione: max 5MB
- Preview solo per file immagine validi

### Server-Side
- Multer validation per tipo e dimensione
- Verifica esistenza evento
- Controllo permessi (admin/dirigente)

## 📁 Storage

### Locale (Development)
```
src/public/uploads/
  └── evento_1702388640123_immagine.jpg
```

### Railway (Production)
```
/data/uploads/
  └── evento_1702388640123_immagine.jpg
```

**URL Pubblico**: `/uploads/evento_1702388640123_immagine.jpg`

## 🎨 Personalizzazione CSS

### Modificare Colori Upload Area
```css
/* Light Theme */
.upload-area {
  background: linear-gradient(135deg, #YOUR_COLOR 0%, #YOUR_COLOR2 100%);
}

/* Dark Theme */
[data-theme="dark"] .upload-area {
  background: linear-gradient(135deg, #YOUR_DARK_COLOR 0%, #YOUR_DARK_COLOR2 100%);
}
```

### Modificare Dimensioni Preview
```css
.image-preview-wrapper img {
  max-height: 500px; /* Cambia qui */
}
```

## 🔒 Sicurezza

- ✅ Autenticazione richiesta (isLoggedIn)
- ✅ Autorizzazione (isAdminOrDirigente)
- ✅ Validazione tipo file server-side
- ✅ Limite dimensione file (5MB)
- ✅ Sanitizzazione nome file
- ✅ Storage isolato per ambiente

## 🐛 Troubleshooting

### Immagine non si carica
1. Verifica console browser per errori
2. Controlla dimensione file (< 5MB)
3. Verifica formato (PNG, JPG, GIF)
4. Controlla permessi directory uploads

### Drag & Drop non funziona
1. Verifica browser supporta HTML5 drag & drop
2. Controlla console per errori JavaScript
3. Assicurati che `evento-upload.css` sia caricato

### Preview non si visualizza
1. Controlla FileReader API support
2. Verifica che il file sia un'immagine valida
3. Controlla errori in console

### Immagine non persiste su Railway
1. Verifica volume montato su `/data`
2. Controlla variabile `RAILWAY_ENVIRONMENT`
3. Assicurati che `uploadDir` sia corretto

## 📊 Performance

### Ottimizzazioni Implementate
- Lazy loading delle preview
- Debounce su drag events
- Compressione immagini lato server (opzionale)
- Cache browser per immagini statiche
- Minificazione CSS con animazioni ottimizzate

### Suggerimenti Aggiuntivi
- Considera image CDN per production
- Implementa lazy loading nelle liste eventi
- Aggiungi WebP support per browser moderni
- Cache immagini con service worker

## 🔄 Prossimi Miglioramenti

- [ ] Supporto immagini multiple per evento
- [ ] Crop e resize client-side
- [ ] Compressione automatica
- [ ] Galleria immagini con lightbox
- [ ] Integrazione con cloud storage (S3, Azure Blob)
- [ ] Watermark automatico
- [ ] OCR per immagini con testo

## 📝 Note di Migrazione

Se migri da sistema precedente:

1. **Backup immagini esistenti**
   ```bash
   cp -r src/public/uploads /backup/uploads
   ```

2. **Verifica tabella IMMAGINI**
   ```sql
   SELECT * FROM IMMAGINI WHERE tipo = 'evento';
   ```

3. **Associa immagini esistenti**
   ```sql
   UPDATE IMMAGINI 
   SET entita_riferimento = 'evento', 
       entita_id = <evento_id>
   WHERE tipo = 'evento' AND url LIKE '%evento%';
   ```

## 🤝 Contribuire

Per aggiungere nuove funzionalità:
1. Estendi `evento-upload.css` per nuovi stili
2. Aggiungi handlers in `crea_evento.js`
3. Crea nuovi endpoints in `eventi.js`
4. Aggiorna questa documentazione

---

**Versione**: 1.0.0  
**Data**: 11 Dicembre 2024  
**Autore**: Sistema Borgo Vercelli
