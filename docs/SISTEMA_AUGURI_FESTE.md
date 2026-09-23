# 🎉 Sistema Automatico Auguri Feste Italiane

## Descrizione

Sistema completo e automatico che mostra auguri personalizzati agli utenti per tutte le principali feste italiane. Il sistema:

- ✅ **Si aggiorna automaticamente anno dopo anno** - Non richiede modifiche al codice
- ✅ **Appare appena si entra nel sito** - Mostra il modal nella homepage
- ✅ **Una volta per festa per anno** - Usa localStorage per tracciare le visualizzazioni
- ✅ **Supporta tutte le feste italiane** - Include feste fisse e mobili (Pasqua, Carnevale)
- ✅ **Design personalizzato per ogni festa** - Colori, icone e messaggi specifici
- ✅ **Responsive e accessibile** - Funziona su tutti i dispositivi
- ✅ **Supporto tema scuro/chiaro** - Si integra con il sistema di temi esistente

## Feste Supportate

### Feste a Data Fissa

1. **Capodanno** (1 gennaio)
   - Colori: Oro e Rosso
   - Icone: 🎉🥂🎊🍾

2. **Epifania** (6 gennaio)
   - Colori: Viola e Rosa
   - Icone: 🧙‍♀️🎁⭐🧦

3. **Festa della Liberazione** (25 aprile)
   - Colori: Verde e Rosso (bandiera italiana)
   - Icone: 🇮🇹🕊️⭐🏛️

4. **Festa dei Lavoratori** (1 maggio)
   - Colori: Rosso e Giallo
   - Icone: 🛠️💪⚙️🌹

5. **Festa della Repubblica** (2 giugno)
   - Colori: Verde e Rosso (bandiera italiana)
   - Icone: 🇮🇹🎊⭐🏛️

6. **Ferragosto** (13-16 agosto)
   - Colori: Arancione e Azzurro
   - Icone: ☀️🏖️🌊🍉

7. **Ognissanti** (1 novembre)
   - Colori: Viola e Arancione
   - Icone: 🕯️🌹⭐🙏

8. **Immacolata Concezione** (8 dicembre)
   - Colori: Blu e Bianco
   - Icone: ⭐🕊️🌟✨

9. **Natale** (20-26 dicembre - periodo esteso)
   - Colori: Rosso e Verde
   - Icone: 🎅🎁❄️🎄⛄

### Feste a Data Mobile

1. **Carnevale** (periodo prima della Pasqua)
   - Calcolo automatico: 47 giorni prima della Pasqua
   - Periodo: 7 giorni prima fino al Martedì Grasso
   - Colori: Multicolori vivaci
   - Icone: 🎭🎪🎨🎉

2. **Pasqua** (domenica variabile)
   - Calcolo automatico: Algoritmo di Meeus/Jones/Butcher
   - Periodo: 3 giorni prima fino a Pasquetta
   - Colori: Verde e Giallo
   - Icone: 🐰🥚🐣🌸

## Struttura File

```
src/
├── public/
│   └── assets/
│       ├── styles/
│       │   └── modalFeste.css          # Stili per tutte le feste
│       └── scripts/
│           └── modalFeste.js           # Logica del sistema
└── shared/
    └── views/
        └── homepage.ejs                # Integrazione nella homepage
```

## Come Funziona

### 1. Rilevamento Automatico

Il sistema controlla automaticamente la data corrente e determina se c'è una festa in corso:

```javascript
const oggi = new Date();
const festaCorrente = trovaFestaCorrente(oggi);
```

### 2. Calcolo Date Mobili

Per feste come Pasqua e Carnevale, il sistema calcola automaticamente le date usando algoritmi standard:

- **Pasqua**: Algoritmo di Meeus/Jones/Butcher (accurato per tutti gli anni)
- **Carnevale**: 47 giorni prima della Pasqua

### 3. Tracking Visualizzazioni

Ogni festa viene mostrata **una sola volta per anno** usando localStorage:

```javascript
const storageKey = `festa_${festaKey}_${anno}`; // es: "festa_natale_2024"
```

### 4. Design Dinamico

Ogni festa ha il proprio schema di colori applicato tramite variabili CSS:

```javascript
style.setProperty('--festa-color-primary', colori.primary);
style.setProperty('--festa-color-secondary', colori.secondary);
```

## Personalizzazione

### Aggiungere una Nuova Festa

Per aggiungere una nuova festa, modifica `modalFeste.js` aggiungendo un nuovo oggetto in `FESTE_ITALIANE`:

```javascript
nuovaFesta: {
    nome: 'Nome Festa',
    check: (data) => data.getMonth() === X && data.getDate() === Y,
    periodo: 'GG mese',
    colori: {
        primary: '#COLORE1',
        secondary: '#COLORE2',
        primaryDark: '#COLORE1_DARK',
        secondaryDark: '#COLORE2_DARK'
    },
    icone: {
        principale: '🎉🎊',
        decorazione1: '⭐',
        decorazione2: '🌟',
        decorazioni: ['🎉', '🎊', '⭐', '🌟', '✨']
    },
    titolo: '🎉 A.S.D. Borgo Vercelli 2022 🎉',
    saluto: 'Buona Festa!',
    messaggio: 'Messaggio personalizzato...',
    chiusura: 'Ci vediamo in campo! ⚽'
}
```

### Modificare il Periodo di Visualizzazione

Per estendere o ridurre il periodo di una festa, modifica la funzione `check`:

```javascript
// Esempio: Natale per tutto dicembre
check: (data) => data.getMonth() === 11, // Tutto dicembre

// Esempio: Ferragosto solo il 15
check: (data) => data.getMonth() === 7 && data.getDate() === 15,
```

### Cambiare i Colori

I colori di ogni festa sono definiti nell'oggetto `colori`. Modifica direttamente i valori hex:

```javascript
colori: {
    primary: '#FF0000',      // Colore primario tema chiaro
    secondary: '#00FF00',    // Colore secondario tema chiaro
    primaryDark: '#FF6666',  // Colore primario tema scuro
    secondaryDark: '#66FF66' // Colore secondario tema scuro
}
```

## Variabili CSS Utilizzate

Il sistema usa variabili CSS dinamiche per i colori:

- `--festa-color-primary`: Colore primario della festa
- `--festa-color-secondary`: Colore secondario della festa
- `--festa-color-primary-dark`: Colore primario per tema scuro
- `--festa-color-secondary-dark`: Colore secondario per tema scuro
- `--festa-icon-1`: Prima icona decorativa
- `--festa-icon-2`: Seconda icona decorativa

## Compatibilità

- ✅ Tutti i browser moderni (Chrome, Firefox, Safari, Edge)
- ✅ Dispositivi mobile e tablet
- ✅ Supporto fallback per browser che non supportano localStorage
- ✅ Graceful degradation se JavaScript è disabilitato

## Manutenzione

### Il sistema NON richiede:
- ❌ Aggiornamenti annuali
- ❌ Modifiche per cambio anno
- ❌ Calcolo manuale delle date mobili
- ❌ Aggiornamento dei messaggi (usa placeholder {anno})

### Il sistema gestisce automaticamente:
- ✅ Cambio di anno
- ✅ Calcolo date mobili (Pasqua, Carnevale)
- ✅ Reset delle visualizzazioni ogni anno
- ✅ Messaggi con anno corrente/prossimo

## Note Tecniche

### Storage
Il sistema usa `localStorage` con fallback a `sessionStorage` se non disponibile:
- Chiave formato: `festa_{nome}_{anno}`
- Valore: `'true'` se mostrato
- Auto-reset ogni anno (nuova chiave con nuovo anno)

### Performance
- Modal creato solo quando necessario
- Rimosso dal DOM dopo la chiusura
- Nessun impatto su performance della pagina
- Delay di 1 secondo prima della visualizzazione per UX migliore

### Accessibilità
- Attributo `aria-hidden="true"` per decorazioni
- Supporto chiusura con tasto ESC
- Label appropriati per screen reader
- Focus management corretto

## Troubleshooting

### Il modal non appare

1. Verifica che sia il periodo giusto per una festa
2. Controlla la console per errori
3. Verifica che localStorage non sia pieno o bloccato
4. Pulisci localStorage: `localStorage.clear()` nella console

### Il modal appare ogni volta

1. Verifica che localStorage sia abilitato nel browser
2. Controlla che la chiave sia salvata correttamente
3. Verifica che l'anno nella chiave sia corretto

### Reset manuale per test

Apri la console del browser e esegui:

```javascript
// Reset di una festa specifica per l'anno corrente
localStorage.removeItem(`festa_natale_${new Date().getFullYear()}`);

// Reset di tutte le feste
Object.keys(localStorage).forEach(key => {
    if (key.startsWith('festa_')) localStorage.removeItem(key);
});

// Poi ricarica la pagina
location.reload();
```

## Changelog

### Versione 1.0 (Dicembre 2024)
- 🎉 Sistema iniziale con supporto per tutte le feste italiane
- ✅ Calcolo automatico date mobili
- ✅ Design responsivo e accessibile
- ✅ Supporto tema scuro/chiaro
- ✅ Tracking visualizzazioni con localStorage
- ✅ Auto-aggiornamento annuale

---

**Sviluppato per A.S.D. Borgo Vercelli 2022** ⚽
