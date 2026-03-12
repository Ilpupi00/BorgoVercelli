# ✅ Checklist Test Upload Immagini Eventi

## 🧪 Test Funzionali

### Upload Immagine - Nuovo Evento

- [ ] Accedi come Admin/Dirigente
- [ ] Vai a `/evento/crea-evento`
- [ ] Clicca su "Seleziona File"
- [ ] Seleziona immagine JPG < 5MB
- [ ] Verifica preview visualizzata
- [ ] Compila form evento (titolo, data, luogo)
- [ ] Salva evento
- [ ] Verifica redirect corretto
- [ ] Riapri evento in modifica
- [ ] Verifica immagine salvata e visualizzata

### Upload Immagine - Evento Esistente

- [ ] Apri evento esistente in modifica
- [ ] Clicca area upload o "Seleziona File"
- [ ] Seleziona nuova immagine
- [ ] Verifica upload automatico
- [ ] Verifica messaggio successo
- [ ] Ricarica pagina
- [ ] Verifica immagine aggiornata

### Drag & Drop

- [ ] Apri form evento
- [ ] Trascina immagine nell'area upload
- [ ] Verifica effetto hover (bordo blu)
- [ ] Rilascia immagine
- [ ] Verifica preview immediata
- [ ] Verifica animazione smooth

### Eliminazione Immagine

- [ ] Apri evento con immagine
- [ ] Clicca pulsante "🗑️ Elimina"
- [ ] Conferma eliminazione
- [ ] Verifica messaggio successo
- [ ] Verifica area upload riappare
- [ ] Verifica immagine rimossa da server

### Validazioni

- [ ] Prova caricare file PDF → Errore
- [ ] Prova caricare file > 5MB → Errore
- [ ] Prova caricare file TXT → Errore
- [ ] Verifica messaggio errore visibile
- [ ] Verifica animazione shake su errore
- [ ] File PNG valido → Successo
- [ ] File JPG valido → Successo
- [ ] File GIF valido → Successo

---

## 🎨 Test UI/UX

### Layout & Stili

- [ ] Area upload ha gradiente visibile
- [ ] Icona cloud-upload animata (float)
- [ ] Bordi arrotondati (16px)
- [ ] Ombre presenti e morbide
- [ ] Testo centrato e leggibile
- [ ] Pulsante "Seleziona File" stilizzato
- [ ] Hover cambia colore (blu accent)
- [ ] Transizioni fluide (0.3s)

### Preview Immagine

- [ ] Preview appare con animazione fadeInUp
- [ ] Immagine mantiene aspect ratio
- [ ] Max height 400px desktop
- [ ] Pulsante elimina posizionato top-right
- [ ] Hover su pulsante = scale up
- [ ] Backdrop blur su pulsante
- [ ] Box shadow presente

### Progress Bar

- [ ] Progress bar visibile durante upload
- [ ] Animazione striped attiva
- [ ] Colore gradiente blu/viola
- [ ] Scompare dopo upload completo
- [ ] Testo "Caricamento..." visibile

### Stati Interattivi

- [ ] Hover area upload → Scala e ombre
- [ ] Drag over → Bordo blu + scale
- [ ] Loading → Spinner rotante
- [ ] Success → Sfondo verde chiaro
- [ ] Error → Sfondo rosso + shake
- [ ] Focus → Outline blu visibile

---

## 🌓 Test Light/Dark Theme

### Light Theme

- [ ] Area upload: sfondo grigio chiaro
- [ ] Bordi: grigio (#cbd5e1)
- [ ] Icona: blu (#3b82f6)
- [ ] Testo: scuro leggibile
- [ ] Hover: sfondo blu chiaro
- [ ] Shadows: leggere e soft

### Dark Theme

- [ ] Attiva dark theme (toggle o sistema)
- [ ] Area upload: sfondo slate scuro
- [ ] Bordi: grigio scuro (#334155)
- [ ] Icona: blu chiaro (#60a5fa)
- [ ] Testo: bianco/grigio chiaro
- [ ] Hover: sfondo blu scuro
- [ ] Shadows: più profonde
- [ ] Contrasto sufficiente (WCAG AA)

### Transizione Theme

- [ ] Cambio tema smooth (0.3s)
- [ ] Nessun flash/flickering
- [ ] Tutti elementi si aggiornano
- [ ] Pulsanti mantengono stile
- [ ] Preview immagine non affetta

---

## 📱 Test Responsive

### Mobile (< 768px)

- [ ] Area upload compatta
- [ ] Icona 2.5rem
- [ ] Padding ridotto (1.5rem)
- [ ] Testo leggibile
- [ ] Pulsanti tap-friendly (44px min)
- [ ] Preview max-height 300px
- [ ] Touch drag funziona
- [ ] No scroll orizzontale
- [ ] Pulsante elimina visibile

### Tablet (768px - 1023px)

- [ ] Layout bilanciato
- [ ] Icona 3rem
- [ ] Padding medio (2rem)
- [ ] Preview max-height 350px
- [ ] Spaziature adeguate
- [ ] Drag & drop fluido

### Desktop (1024px+)

- [ ] Layout completo
- [ ] Icona 3.5rem
- [ ] Padding generoso (2.5rem)
- [ ] Preview max-height 400px
- [ ] Hover effects visibili
- [ ] Animazioni smooth

### Large Desktop (1280px+)

- [ ] Preview max-height 450px
- [ ] Proporzioni mantenute
- [ ] Nessun elemento sproporzionato

---

## ♿ Test Accessibilità

### Keyboard Navigation

- [ ] Tab raggiunge area upload
- [ ] Tab raggiunge pulsante "Seleziona File"
- [ ] Enter apre file picker
- [ ] Tab raggiunge pulsante elimina
- [ ] Enter elimina immagine
- [ ] Focus outline visibile (2px blu)
- [ ] Escape chiude dialog (se presente)

### Screen Reader

- [ ] Input file ha label corretto
- [ ] Area upload ha aria-label
- [ ] Pulsanti hanno testo descrittivo
- [ ] Errori annunciati (aria-live)
- [ ] Successo annunciato
- [ ] Alt text su preview

### Contrasto Colori

- [ ] Testo su sfondo passa WCAG AA (4.5:1)
- [ ] Pulsanti leggibili
- [ ] Focus outline visibile
- [ ] Dark theme passa WCAG AA

---

## 🚀 Test Performance

### Tempi di Caricamento

- [ ] CSS carica < 100ms
- [ ] JavaScript carica < 200ms
- [ ] Preview appare < 100ms
- [ ] Upload 1MB < 1s
- [ ] Upload 5MB < 3s

### Animazioni

- [ ] FPS ≥ 60 durante animazioni
- [ ] Nessun jank visibile
- [ ] Transizioni fluide
- [ ] Scroll smooth
- [ ] No memory leaks (DevTools)

### Network

- [ ] Upload funziona su 3G slow
- [ ] Retry su fallimento
- [ ] Timeout gestito (30s)
- [ ] Error handling corretto

---

## 🔒 Test Sicurezza

### Autenticazione

- [ ] Utente non loggato → Redirect login
- [ ] Utente standard → 403 Forbidden
- [ ] Admin → Accesso consentito
- [ ] Dirigente → Accesso consentito

### Autorizzazione

- [ ] Solo owner o admin può modificare
- [ ] Upload verifica permessi
- [ ] Delete verifica permessi
- [ ] CSRF token validato

### Validazione

- [ ] Tipo file validato server-side
- [ ] Dimensione validata server-side
- [ ] Evento esistenza verificata
- [ ] SQL injection prevista
- [ ] XSS previsto (sanitizzazione)

---

## 🌐 Test Cross-Browser

### Chrome/Edge

- [ ] Upload funziona
- [ ] Drag & drop funziona
- [ ] Animazioni smooth
- [ ] CSS corretto

### Firefox

- [ ] Upload funziona
- [ ] Drag & drop funziona
- [ ] Animazioni smooth
- [ ] CSS corretto

### Safari Desktop

- [ ] Upload funziona
- [ ] Drag & drop funziona
- [ ] Animazioni smooth
- [ ] CSS corretto

### Mobile Safari (iOS)

- [ ] Upload funziona
- [ ] Touch tap funziona
- [ ] Preview visualizzata
- [ ] CSS corretto

### Chrome Android

- [ ] Upload funziona
- [ ] Touch tap funziona
- [ ] Preview visualizzata
- [ ] CSS corretto

---

## 🐛 Test Edge Cases

### File Speciali

- [ ] File senza estensione → Errore
- [ ] File con nome lungo → Troncato
- [ ] File con caratteri speciali → Sanitizzato
- [ ] File con spazi → Funziona
- [ ] File uppercase extension → Funziona

### Connessione

- [ ] Upload con connessione lenta → Progress
- [ ] Upload con disconnessione → Errore
- [ ] Retry dopo errore → Funziona
- [ ] Timeout gestito

### Concorrenza

- [ ] Due upload simultanei → Gestito
- [ ] Upload + save form → Gestito
- [ ] Delete durante upload → Gestito

### Limiti

- [ ] Esattamente 5MB → Accettato
- [ ] 5MB + 1 byte → Rifiutato
- [ ] 0 bytes → Errore
- [ ] File corrotto → Errore gestito

---

## ✅ Riepilogo Test

**Test Passati**: **_ / _**

**Blockers**: ********\_\_\_********

**Issues Minori**: ********\_\_\_********

**Note**: ******************\_******************

**Testato da**: ********\_\_\_********

**Data**: ********\_\_\_********

**Ambiente**: ☐ Locale ☐ Staging ☐ Production

**Browser**: ********\_\_\_********

**OS**: ********\_\_\_********

---

## 📸 Screenshot Richiesti

- [ ] Area upload light theme
- [ ] Area upload dark theme
- [ ] Preview immagine desktop
- [ ] Preview immagine mobile
- [ ] Drag & drop in azione
- [ ] Errore validazione
- [ ] Success message
- [ ] Responsive layouts (3 screenshot)

---

**Istruzioni**: Spunta ogni item dopo averlo testato. Annota problemi nelle note.
