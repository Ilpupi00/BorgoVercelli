# 🧪 Come Testare il Sistema di Tema Scuro

## Test Rapido

### Metodo 1: Utilizzare il File di Test
1. Avvia il server: `npm start`
2. Apri il browser e vai a: `http://localhost:3000/theme-test.html`
3. Usa i pulsanti nella barra laterale destra per cambiare tema
4. Osserva tutti i componenti che cambiano in tempo reale

### Metodo 2: Homepage
1. Avvia il server: `npm start`
2. Apri: `http://localhost:3000/homepage`
3. Nella navbar, clicca sull'icona del tema (icona circolare a destra)
4. Seleziona:
   - ☀️ **Tema Chiaro** per il tema light
   - 🌙 **Tema Scuro** per il tema dark
   - 🔄 **Preferenza Sistema** per seguire le impostazioni del sistema

## Test Completo

### 1. Test Persistenza
```
✅ Cambia tema → Ricarica la pagina → Il tema dovrebbe rimanere lo stesso
```

### 2. Test Navigazione
```
✅ Cambia tema → Naviga su un'altra pagina → Il tema dovrebbe rimanere consistente
```

### 3. Test Preferenza Sistema
```
✅ Seleziona "Preferenza Sistema"
✅ Cambia le impostazioni di sistema:
   - Windows: Impostazioni → Personalizzazione → Colori → Scegli modalità
   - macOS: Preferenze di Sistema → Generale → Aspetto
   - Linux: Dipende dal desktop environment
✅ Il sito dovrebbe cambiare automaticamente
```

### 4. Test Componenti

Naviga attraverso le seguenti pagine e verifica che tutto funzioni:

#### Pagine Pubbliche
- [ ] Homepage (`/homepage`)
- [ ] Notizie (`/notizie/all`)
- [ ] Dettaglio Notizia (`/notizia/[id]`)
- [ ] Eventi (`/eventi`)
- [ ] Dettaglio Evento (`/evento/[id]`)
- [ ] Galleria (`/galleria`)
- [ ] Squadre (`/squadre`)
- [ ] Società (`/societa`)
- [ ] Campionato (`/campionato`)
- [ ] Prenotazione (`/prenotazione`)
- [ ] Recensioni (`/recensioni/all`)
- [ ] Profilo (`/profilo`) - Richiede login
- [ ] Contatti (`/contatti`)
- [ ] Privacy (`/privacy`)
- [ ] Regolamento (`/regolamento`)

#### Area Admin (Richiede login come admin)
- [ ] Dashboard Admin (`/admin`)
- [ ] Gestione Notizie (`/admin/notizie`)
- [ ] Gestione Eventi (`/admin/eventi`)
- [ ] Gestione Galleria (`/admin/galleria`)
- [ ] Gestione Squadre (`/admin/squadre`)
- [ ] Gestione Campi (`/admin/campi`)
- [ ] Gestione Campionati (`/admin/campionati`)
- [ ] Gestore Utenti (`/admin/utenti`)
- [ ] Gestione Recensioni (`/admin/recensioni`)
- [ ] Gestione Prenotazioni (`/admin/prenotazioni`)
- [ ] Gestione Orari Campi (`/admin/orari-campi`)
- [ ] Statistiche (`/admin/statistiche`)

### 5. Test Responsive

Testa su diversi dispositivi:

#### Desktop
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

#### Mobile
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Tablet

### 6. Test Componenti UI

Verifica che questi elementi funzionino in entrambi i temi:

#### Navbar
- [ ] Logo visibile
- [ ] Links colorati correttamente
- [ ] Dropdown "Altro" funzionante
- [ ] **Dropdown Tema funzionante**
- [ ] Icona profilo/login visibile

#### Cards
- [ ] Background corretto
- [ ] Testo leggibile
- [ ] Ombre visibili
- [ ] Hover effect funzionante

#### Forms
- [ ] Input con sfondo corretto
- [ ] Placeholder leggibile
- [ ] Focus state visibile
- [ ] Bordi visibili

#### Buttons
- [ ] Colori corretti
- [ ] Hover effect
- [ ] Active state
- [ ] Disabled state

#### Modals
- [ ] Background corretto
- [ ] Testo leggibile
- [ ] Bordi visibili
- [ ] Overlay scuro visibile

#### Tables
- [ ] Header visibile
- [ ] Righe alternate colorate
- [ ] Hover effect su righe
- [ ] Bordi visibili

#### Alerts
- [ ] Colori distintivi
- [ ] Icone visibili
- [ ] Testo leggibile

### 7. Test Accessibilità

- [ ] Contrasto testo/background sufficiente
- [ ] Focus visible su elementi interattivi
- [ ] Navigazione da tastiera funzionante
- [ ] Screen reader friendly

### 8. Test Performance

- [ ] Nessun "flash" durante il caricamento della pagina
- [ ] Cambio tema istantaneo (<50ms)
- [ ] Nessun lag durante la navigazione
- [ ] Animazioni fluide

## Checklist Visiva Rapida

### Tema Chiaro ☀️
```
✅ Background bianco/grigio chiaro
✅ Testo scuro
✅ Cards con ombre leggere
✅ Navbar blu gradiente
✅ Buttons colorati vivaci
```

### Tema Scuro 🌙
```
✅ Background grigio scuro/nero
✅ Testo chiaro
✅ Cards con bordi sottili
✅ Navbar grigio scuro
✅ Buttons colorati ma smorzati
```

## Risoluzione Problemi

### Il tema non cambia
1. Apri la Console del browser (F12)
2. Verifica errori JavaScript
3. Controlla che `theme-manager.js` sia caricato
4. Verifica che `localStorage` sia abilitato

### Flash di contenuto bianco
1. Verifica che lo script inline sia presente in `theme-includes.ejs`
2. Assicurati che sia prima di altri CSS

### Componenti non stilizzati
1. Verifica che `theme-dark.css` sia caricato
2. Controlla l'ordine dei file CSS
3. Verifica la console per errori CSS

### Tema non persiste
1. Controlla che localStorage sia abilitato
2. Verifica la console per errori
3. Prova a cancellare la cache del browser

## Test Automatizzati (Opzionale)

Se vuoi testare programmaticamente:

```javascript
// Apri Console del browser (F12) e esegui:

// Test cambio tema
window.themeManager.applyTheme('dark');
console.log('Tema applicato:', window.themeManager.getCurrentTheme());

window.themeManager.applyTheme('light');
console.log('Tema applicato:', window.themeManager.getCurrentTheme());

// Test persistenza
console.log('Tema salvato:', localStorage.getItem('site-theme-preference'));

// Test eventi
window.addEventListener('themechange', (e) => {
    console.log('Tema cambiato:', e.detail);
});
```

## Metriche di Successo

Il sistema funziona correttamente se:

✅ **Tutti i componenti sono visibili** in entrambi i temi  
✅ **Il contrasto è sufficiente** per leggere il testo  
✅ **Le transizioni sono fluide** senza lag  
✅ **Il tema persiste** dopo il ricaricamento  
✅ **Nessun errore** nella console  
✅ **Funziona su tutti i browser** testati  
✅ **Responsive** su tutti i dispositivi  

## Feedback e Miglioramenti

Se trovi problemi:
1. Apri la Console del browser (F12)
2. Copia eventuali errori
3. Nota la pagina specifica dove appare il problema
4. Nota il tema attivo (chiaro/scuro)
5. Nota il browser e la versione

## Test di Produzione

Prima del deploy:
- [ ] Test su tutti i browser principali
- [ ] Test su dispositivi mobile reali
- [ ] Test con utenti beta
- [ ] Verifica metriche performance
- [ ] Test accessibilità WCAG

---

## 🎉 Enjoy Your New Dark Theme!

Il sistema è pronto per l'uso. Buon testing! 🚀
