# 🎨 Design System - Guida Rapida per Sviluppatori

## 🚀 Quick Start

### Importa il Design System
```html
<!-- Nel tuo file EJS -->
<link href="/stylesheets/Common.css" rel="stylesheet">
```

---

## 🎨 Palette Colori

### Colori Primari
```css
var(--primary)          /* #0d6efd - Blu homepage */
var(--primary-dark)     /* #0a58ca - Blu scuro */
var(--primary-light)    /* #3d8bfd - Blu chiaro */
var(--secondary)        /* #22b14c - Verde homepage */
var(--secondary-dark)   /* #1a8e3a - Verde scuro */
var(--accent)           /* #ffc107 - Giallo/Oro */
```

### Colori Utility
```css
var(--success)          /* #28a745 - Verde successo */
var(--danger)           /* #dc3545 - Rosso errore */
var(--warning)          /* #fd7e14 - Arancione warning */
var(--info)             /* #17a2b8 - Azzurro info */
```

### Gradienti
```css
var(--gradient-primary)     /* Blu → Verde */
var(--gradient-secondary)   /* Verde → Blu */
var(--gradient-accent)      /* Giallo → Arancione */
```

---

## 🃏 Componenti Base

### Buttons

```html
<!-- Primary (Gradient blu → verde) -->
<button class="btn btn-primary">
    <i class="fas fa-check"></i> Conferma
</button>

<!-- Secondary (Gradient verde) -->
<button class="btn btn-secondary">Salva</button>

<!-- Outline -->
<button class="btn btn-outline-primary">Dettagli</button>

<!-- Success -->
<button class="btn btn-success">Approva</button>

<!-- Danger -->
<button class="btn btn-danger">Elimina</button>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">Piccolo</button>
<button class="btn btn-primary">Normal</button>
<button class="btn btn-primary btn-lg">Grande</button>

<!-- Block (100% width) -->
<button class="btn btn-primary btn-block">Full Width</button>
```

### Cards

```html
<!-- Card base con glassmorphism -->
<div class="card">
    <div class="card-header">
        <h3 class="card-title">Titolo Card</h3>
    </div>
    <div class="card-body">
        <p>Contenuto della card...</p>
    </div>
    <div class="card-footer">
        <button class="btn btn-primary">Azione</button>
    </div>
</div>

<!-- Card con animazione -->
<div class="card fade-in-up">
    <!-- ... -->
</div>
```

### Forms

```html
<div class="form-group">
    <label class="form-label" for="nome">Nome *</label>
    <input 
        type="text" 
        id="nome" 
        name="nome" 
        class="form-control"
        placeholder="Inserisci il nome"
        required
    >
    <span class="form-text">Inserisci il tuo nome completo</span>
    <div class="invalid-feedback">Campo obbligatorio</div>
</div>

<!-- Textarea -->
<div class="form-group">
    <label class="form-label" for="descrizione">Descrizione</label>
    <textarea 
        id="descrizione" 
        class="form-control" 
        rows="4"
    ></textarea>
</div>

<!-- Select -->
<div class="form-group">
    <label class="form-label" for="categoria">Categoria</label>
    <select id="categoria" class="form-control">
        <option value="">Seleziona...</option>
        <option value="1">Opzione 1</option>
        <option value="2">Opzione 2</option>
    </select>
</div>
```

### Alerts

```html
<!-- Success -->
<div class="alert alert-success">
    <i class="fas fa-check-circle"></i>
    Operazione completata con successo!
</div>

<!-- Danger -->
<div class="alert alert-danger">
    <i class="fas fa-exclamation-circle"></i>
    Si è verificato un errore.
</div>

<!-- Warning -->
<div class="alert alert-warning">
    <i class="fas fa-exclamation-triangle"></i>
    Attenzione: verifica i dati inseriti.
</div>

<!-- Info -->
<div class="alert alert-info">
    <i class="fas fa-info-circle"></i>
    Informazione utile per l'utente.
</div>
```

### Badges

```html
<span class="badge badge-primary">Nuovo</span>
<span class="badge badge-success">Attivo</span>
<span class="badge badge-danger">Scaduto</span>
<span class="badge badge-warning">In Attesa</span>
<span class="badge badge-info">Info</span>
```

---

## 🎭 Animazioni

### Classi Disponibili

```html
<!-- Fade in (0.3s) -->
<div class="fade-in">Contenuto</div>

<!-- Fade in up (0.3s) -->
<div class="fade-in-up">Contenuto sale</div>

<!-- Fade in down (0.3s) -->
<div class="fade-in-down">Contenuto scende</div>

<!-- Slide in left (0.3s) -->
<div class="slide-in-left">Da sinistra</div>

<!-- Slide in right (0.3s) -->
<div class="slide-in-right">Da destra</div>

<!-- Scale in (0.3s) -->
<div class="scale-in">Zoom in</div>
```

### Con Delay

```html
<div class="fade-in-up delay-1">Appare per primo (0.05s)</div>
<div class="fade-in-up delay-2">Appare secondo (0.1s)</div>
<div class="fade-in-up delay-3">Appare terzo (0.15s)</div>
```

### Best Practices
- ✅ Max 0.3s durata
- ✅ Max 0.15s delay
- ✅ Solo transform/opacity
- ✅ Usa con parsimonia
- ❌ Non animare width/height
- ❌ Non usare delay > 0.15s

---

## 🎨 Utility Classes

### Backgrounds

```html
<!-- Colori solidi -->
<div class="bg-primary">Blu</div>
<div class="bg-secondary">Grigio chiaro</div>
<div class="bg-dark">Nero</div>
<div class="bg-light">Grigio</div>
<div class="bg-white">Bianco</div>

<!-- Gradienti -->
<div class="bg-gradient-primary">Blu → Verde</div>
<div class="bg-gradient-secondary">Verde → Blu</div>
<div class="bg-gradient-accent">Giallo → Arancione</div>
```

### Text Colors

```html
<p class="text-primary">Testo blu</p>
<p class="text-secondary">Testo grigio</p>
<p class="text-success">Testo verde</p>
<p class="text-danger">Testo rosso</p>
<p class="text-warning">Testo arancione</p>
<p class="text-muted">Testo grigio chiaro</p>
<p class="text-white">Testo bianco</p>

<!-- Gradient text -->
<h2 class="text-gradient">Testo con gradient</h2>
```

### Text Alignment

```html
<p class="text-left">Allineato a sinistra</p>
<p class="text-center">Centrato</p>
<p class="text-right">Allineato a destra</p>
```

### Display

```html
<div class="d-none">Nascosto</div>
<div class="d-block">Block</div>
<div class="d-flex">Flex</div>
<div class="d-inline-flex">Inline Flex</div>
```

### Flexbox

```html
<div class="d-flex flex-row">Row</div>
<div class="d-flex flex-column">Column</div>
<div class="d-flex justify-content-start">Start</div>
<div class="d-flex justify-content-center">Center</div>
<div class="d-flex justify-content-end">End</div>
<div class="d-flex justify-content-between">Between</div>
<div class="d-flex align-items-center">Center vertical</div>
```

### Spacing

```html
<!-- Margin -->
<div class="m-0">No margin</div>
<div class="mt-1">Margin top small (0.5rem)</div>
<div class="mt-2">Margin top medium (1rem)</div>
<div class="mt-3">Margin top large (1.5rem)</div>
<div class="mt-4">Margin top xl (2rem)</div>
<div class="mb-2">Margin bottom</div>

<!-- Padding -->
<div class="p-0">No padding</div>
<div class="p-1">Padding small</div>
<div class="p-2">Padding medium</div>
<div class="p-3">Padding large</div>
<div class="p-4">Padding xl</div>
```

### Sizing

```html
<div class="w-100">Width 100%</div>
<div class="h-100">Height 100%</div>
```

### Borders

```html
<div class="rounded">Border radius normale</div>
<div class="rounded-lg">Border radius large</div>
<div class="rounded-circle">Cerchio perfetto</div>
```

### Shadows

```html
<div class="shadow-sm">Shadow small</div>
<div class="shadow">Shadow medium</div>
<div class="shadow-lg">Shadow large</div>
```

---

## 📱 Grid System

```html
<div class="container">
    <div class="row">
        <!-- Mobile: 100%, Tablet: 50%, Desktop: 33.33% -->
        <div class="col-12 col-md-6 col-lg-4">
            Colonna 1
        </div>
        <div class="col-12 col-md-6 col-lg-4">
            Colonna 2
        </div>
        <div class="col-12 col-md-6 col-lg-4">
            Colonna 3
        </div>
    </div>
</div>
```

### Breakpoints

```
< 576px   : Mobile (col-12)
576-768px : Tablet (col-sm-*)
768-992px : Desktop (col-md-*)
992-1200px: Large Desktop (col-lg-*)
> 1200px  : Extra Large (col-xl-*)
```

---

## 🎨 Pattern Comuni

### Hero Section

```html
<section class="hero-section bg-gradient-primary text-white py-5">
    <div class="container">
        <div class="row justify-content-center text-center">
            <div class="col-12 col-md-8">
                <h1 class="display-4 fw-bold mb-3 fade-in-down">
                    Titolo Hero
                </h1>
                <p class="lead mb-4 fade-in-up delay-1">
                    Sottotitolo descrittivo
                </p>
                <button class="btn btn-primary btn-lg fade-in-up delay-2">
                    <i class="fas fa-arrow-right"></i> Call to Action
                </button>
            </div>
        </div>
    </div>
</section>
```

### Card Grid

```html
<div class="container my-5">
    <div class="row">
        <div class="col-12 col-md-6 col-lg-4 mb-4">
            <div class="card fade-in-up">
                <div class="card-body">
                    <h5 class="card-title">Card 1</h5>
                    <p>Contenuto...</p>
                    <button class="btn btn-primary">Azione</button>
                </div>
            </div>
        </div>
        <!-- Ripeti per altre card -->
    </div>
</div>
```

### Form Container

```html
<div class="container my-5">
    <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6">
            <div class="card fade-in-up">
                <div class="card-header bg-gradient-primary text-white">
                    <h3 class="mb-0">Titolo Form</h3>
                </div>
                <div class="card-body">
                    <form>
                        <!-- Form fields -->
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
```

---

## ⚡ Performance Tips

### DO ✅
- Usa animazioni solo su transform/opacity
- Mantieni durata max 0.3s
- Usa CSS Variables per temi
- Applica backdrop-filter con moderazione
- Testa su dispositivi reali

### DON'T ❌
- Non animare width/height/padding/margin
- Non usare delay > 0.15s
- Non abusare di backdrop-filter
- Non usare animazioni su scroll (pesanti)
- Non dimenticare prefers-reduced-motion

---

## 🎯 Esempi Completi

### Card Notizia

```html
<div class="card fade-in-up">
    <img src="immagine.jpg" alt="Titolo" class="card-img-top">
    <div class="card-body">
        <span class="badge badge-primary">Categoria</span>
        <h5 class="card-title text-gradient">
            Titolo della notizia
        </h5>
        <p class="card-text text-muted">
            Anteprima del contenuto della notizia...
        </p>
        <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">
                <i class="fas fa-calendar"></i> 10 Nov 2025
            </small>
            <a href="/notizie/1" class="btn btn-primary btn-sm">
                Leggi tutto <i class="fas fa-arrow-right"></i>
            </a>
        </div>
    </div>
</div>
```

### Modal/Dialog

```html
<div class="card shadow-lg" style="max-width: 500px; margin: 2rem auto;">
    <div class="card-header bg-gradient-primary text-white">
        <h4 class="mb-0">Conferma Azione</h4>
    </div>
    <div class="card-body">
        <p>Sei sicuro di voler procedere con questa azione?</p>
    </div>
    <div class="card-footer d-flex justify-content-end gap-2">
        <button class="btn btn-secondary">Annulla</button>
        <button class="btn btn-danger">Conferma</button>
    </div>
</div>
```

---

## 📞 Support

Hai domande? Consulta:
- 📖 [README.md completo](/README.md)
- 📝 [Design System Notes](/DESIGN_SYSTEM_NOTES.md)
- 💬 [GitHub Issues](https://github.com/Ilpupi00/Sito_BorgoVercelli/issues)

---

<div align="center">

**🎨 Happy Coding! 🎨**

*Design System v1.0 - Borgo Vercelli Team*

</div>
