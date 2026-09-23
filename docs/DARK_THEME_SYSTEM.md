# 🎨 Sistema di Tema Scuro - Borgo Vercelli

## Panoramica

Il sito di Borgo Vercelli ora include un sistema di tema scuro completo, moderno e sofisticato. Gli utenti possono scegliere tra tre modalità:

- **Tema Chiaro** ☀️ - Design luminoso e tradizionale
- **Tema Scuro** 🌙 - Design scuro e moderno per ridurre l'affaticamento degli occhi
- **Preferenza Sistema** 🔄 - Si adatta automaticamente alle preferenze del sistema operativo

## Caratteristiche

### 🎯 Funzionalità Principali

- **Switch Tema nella Navbar** - Facilmente accessibile da qualsiasi pagina
- **Persistenza della Preferenza** - Le scelte vengono salvate nel localStorage
- **Transizioni Smooth** - Passaggi fluidi tra i temi senza flash
- **Supporto Completo** - Tutti i componenti del sito sono supportati
- **Responsive** - Funziona perfettamente su desktop, tablet e mobile
- **Web 2.0 Design** - Stile moderno e sofisticato

### 🎨 Design

Il sistema utilizza:
- **CSS Variables** per una facile personalizzazione
- **Gradient moderni** per sfumature accattivanti
- **Box shadows** per profondità
- **Glass morphism** per effetti trasparenti eleganti
- **Animazioni fluide** per transizioni naturali

## Struttura File

```
src/
├── public/
│   └── assets/
│       ├── styles/
│       │   ├── theme-dark.css          # CSS principale con variabili tema
│       │   ├── theme-homepage.css      # Stili specifici homepage
│       │   └── theme-admin.css         # Stili specifici area admin
│       └── scripts/
│           └── theme-manager.js        # Logica gestione tema
└── shared/
    └── views/
        └── partials/
            ├── navbar.ejs              # Navbar con selettore tema
            └── theme-includes.ejs      # Include da aggiungere in ogni pagina
```

## Come Funziona

### 1. Inizializzazione

Il tema viene applicato immediatamente durante il caricamento della pagina per evitare il "flash" di contenuto non stilizzato:

```javascript
// In theme-includes.ejs
(function() {
    const savedTheme = localStorage.getItem('site-theme-preference') || 'auto';
    const effectiveTheme = savedTheme === 'auto' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : savedTheme;
    document.documentElement.setAttribute('data-theme', effectiveTheme);
})();
```

### 2. Gestione Tema

Il `ThemeManager` gestisce:
- Caricamento della preferenza salvata
- Applicazione del tema
- Ascolto dei cambiamenti delle preferenze di sistema
- Aggiornamento dell'UI

### 3. Stili CSS

I temi sono definiti utilizzando CSS Variables:

```css
:root[data-theme="light"] {
    --bg-primary: #ffffff;
    --text-primary: #1e293b;
    --primary-color: #0d6efd;
    /* ... */
}

:root[data-theme="dark"] {
    --bg-primary: #0f172a;
    --text-primary: #f1f5f9;
    --primary-color: #3b82f6;
    /* ... */
}
```

## Componenti Supportati

Il sistema di tema supporta tutti i componenti del sito:

### Layout Base
- ✅ Navbar
- ✅ Footer
- ✅ Sidebar (Admin)
- ✅ Hero Section

### Componenti UI
- ✅ Cards (News, Events, Reviews)
- ✅ Forms (Input, Select, Textarea)
- ✅ Buttons (Primary, Secondary, Outline)
- ✅ Modals
- ✅ Alerts
- ✅ Tables
- ✅ Badges
- ✅ Breadcrumbs
- ✅ Pagination
- ✅ Dropdowns
- ✅ Tooltips
- ✅ Popovers

### Pagine Specifiche
- ✅ Homepage
- ✅ Notizie
- ✅ Eventi
- ✅ Galleria
- ✅ Squadre
- ✅ Campionato
- ✅ Prenotazioni
- ✅ Recensioni
- ✅ Profilo
- ✅ Area Admin (tutte le pagine)
- ✅ Login/Registrazione

## Utilizzo per Sviluppatori

### Aggiungere una Nuova Pagina

1. Includi il partial `theme-includes.ejs` nell'head:

```html
<head>
    <!-- ... altri link ... -->
    <%- include('partials/theme-includes') %>
    <!-- ... -->
</head>
```

2. Usa le variabili CSS nei tuoi stili:

```css
.my-component {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-md);
}
```

### Personalizzare Stili per Tema Scuro

Se hai bisogno di stili specifici per il tema scuro:

```css
/* Stile normale */
.my-element {
    background: white;
}

/* Stile tema scuro */
:root[data-theme="dark"] .my-element {
    background: var(--bg-primary);
}
```

### Ascoltare Cambiamenti di Tema

```javascript
window.addEventListener('themechange', (e) => {
    console.log('Nuovo tema:', e.detail.theme);
    console.log('Preferenza:', e.detail.preference);
    // Il tuo codice qui
});
```

### API ThemeManager

```javascript
// Ottieni informazioni sul tema corrente
const themeInfo = window.themeManager.getCurrentTheme();
console.log(themeInfo.effective); // 'light' o 'dark'
console.log(themeInfo.preference); // 'light', 'dark', o 'auto'
console.log(themeInfo.isDark); // boolean

// Cambia tema programmaticamente
window.themeManager.applyTheme('dark');
window.themeManager.applyTheme('light');
window.themeManager.applyTheme('auto');

// Toggle tra light e dark
window.themeManager.toggleTheme();
```

## Variabili CSS Disponibili

### Colori Base
- `--primary-color`, `--primary-hover`, `--primary-active`
- `--secondary-color`, `--secondary-dark`
- `--accent-color`

### Backgrounds
- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- `--bg-elevated`, `--bg-hover`, `--bg-active`

### Testo
- `--text-primary`, `--text-secondary`, `--text-tertiary`
- `--text-on-primary`, `--text-muted`

### Bordi
- `--border-color`, `--border-hover`, `--border-focus`

### Shadows
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`
- `--shadow-colored`

### Cards
- `--card-bg`, `--card-border`, `--card-shadow`, `--card-hover-shadow`

### Forms
- `--input-bg`, `--input-border`, `--input-text`, `--input-placeholder`
- `--input-focus-border`, `--input-focus-ring`

### Status
- `--success`, `--danger`, `--warning`, `--info`

## Browser Support

- ✅ Chrome/Edge 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Opera 74+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

Il sistema è ottimizzato per le prestazioni:

- **No Flash of Unstyled Content (FOUC)** - Il tema viene applicato prima del render
- **CSS Variables** - Cambio tema istantaneo senza re-rendering
- **LocalStorage** - Caricamento istantaneo della preferenza salvata
- **Lazy Loading** - File CSS specifici caricati solo dove necessari

## Testing

Per testare il sistema:

1. **Tema Chiaro**: Clicca sul menu tema nella navbar e seleziona "Tema Chiaro"
2. **Tema Scuro**: Clicca sul menu tema nella navbar e seleziona "Tema Scuro"
3. **Preferenza Sistema**: 
   - Windows 10/11: Impostazioni → Personalizzazione → Colori
   - macOS: Preferenze di Sistema → Generale → Aspetto
   - Linux: Varia a seconda del desktop environment
4. **Persistenza**: Ricarica la pagina e verifica che il tema sia mantenuto
5. **Navigazione**: Naviga tra le pagine e verifica la consistenza

## Troubleshooting

### Il tema non viene applicato

1. Verifica che `theme-includes.ejs` sia incluso nell'head
2. Controlla la console per errori JavaScript
3. Assicurati che `theme-dark.css` sia caricato correttamente

### Flash di contenuto non stilizzato

1. Assicurati che lo script inline in `theme-includes.ejs` sia prima di tutti gli altri file CSS
2. Non rimuovere l'attributo `data-theme` dal tag `<html>`

### Il tema non persiste dopo il ricaricamento

1. Verifica che localStorage sia abilitato nel browser
2. Controlla che non ci siano errori nella console
3. Verifica che `theme-manager.js` venga caricato correttamente

### Componenti non stilizzati correttamente

1. Verifica che il componente usi le variabili CSS (`var(--nome-variabile)`)
2. Aggiungi stili specifici in `theme-dark.css` se necessario
3. Controlla che non ci siano stili inline che sovrascrivono le variabili

## Future Enhancements

Possibili miglioramenti futuri:

- 🎨 Temi personalizzati (blu, verde, rosso, etc.)
- 🌈 Editor di tema in tempo reale
- 📱 Widget mobile dedicato per il cambio tema
- 🎭 Modalità high contrast per accessibilità
- 🔧 Pannello admin per personalizzare i colori del tema
- 💾 Sincronizzazione tema tra dispositivi (per utenti loggati)

## Credits

Sistema di tema implementato con:
- CSS Custom Properties (Variables)
- JavaScript ES6+
- LocalStorage API
- Media Queries
- Bootstrap 5 Icons

---

**Versione:** 1.0.0  
**Data:** Novembre 2025  
**Autore:** Borgo Vercelli Development Team
