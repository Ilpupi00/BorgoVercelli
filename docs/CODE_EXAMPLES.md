# 💻 Code Examples - Dark Theme System

## Quick Examples

### 1. Basic Theme Integration

```html
<!-- In your EJS file head -->
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <title>My Page</title>
    
    <!-- Bootstrap and other styles -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.4/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Theme System (ADD THIS) -->
    <%- include('partials/theme-includes') %>
    
    <!-- Your custom styles -->
    <link rel="stylesheet" href="/assets/styles/my-page.css">
</head>
<body>
    <!-- Your content -->
</body>
</html>
```

### 2. Using CSS Variables

```css
/* my-component.css */

.my-card {
    /* Use theme variables */
    background-color: var(--card-bg);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-md);
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.3s ease;
}

.my-card:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
}

.my-card-title {
    color: var(--text-primary);
    font-weight: 600;
}

.my-card-text {
    color: var(--text-secondary);
    line-height: 1.6;
}

.my-button {
    background: var(--primary-color);
    color: var(--text-on-primary);
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.my-button:hover {
    background: var(--primary-hover);
    transform: scale(1.05);
}
```

### 3. Theme-Specific Overrides

```css
/* Special styling only for dark theme */

:root[data-theme="dark"] .special-component {
    background: rgba(30, 41, 59, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

:root[data-theme="dark"] .special-image {
    opacity: 0.85;
    filter: brightness(0.9);
}

:root[data-theme="dark"] .glass-card {
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(15px);
}
```

### 4. JavaScript Integration

```javascript
// Listen for theme changes
window.addEventListener('themechange', (event) => {
    const { theme, preference } = event.detail;
    console.log(`Theme changed to: ${theme}`);
    console.log(`User preference: ${preference}`);
    
    // Your custom logic here
    if (theme === 'dark') {
        loadDarkModeAssets();
    } else {
        loadLightModeAssets();
    }
});

// Get current theme info
const themeInfo = window.themeManager.getCurrentTheme();
console.log('Current theme:', themeInfo.effective); // 'light' or 'dark'
console.log('Is dark mode:', themeInfo.isDark);     // boolean
console.log('User preference:', themeInfo.preference); // 'light', 'dark', or 'auto'

// Programmatically change theme
function setDarkMode() {
    window.themeManager.applyTheme('dark');
}

function setLightMode() {
    window.themeManager.applyTheme('light');
}

function setAutoMode() {
    window.themeManager.applyTheme('auto');
}

// Toggle between light and dark
function toggleTheme() {
    window.themeManager.toggleTheme();
}
```

### 5. Custom Component with Theme Support

```html
<!-- custom-card.ejs -->
<div class="custom-card">
    <div class="custom-card-header">
        <h3 class="custom-card-title"><%= title %></h3>
    </div>
    <div class="custom-card-body">
        <p class="custom-card-text"><%= description %></p>
    </div>
    <div class="custom-card-footer">
        <button class="custom-btn custom-btn-primary">Read More</button>
    </div>
</div>

<style>
.custom-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
    transition: all 0.3s ease;
}

.custom-card:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-4px);
}

.custom-card-header {
    background: var(--bg-secondary);
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
}

.custom-card-title {
    color: var(--text-primary);
    margin: 0;
    font-size: 1.5rem;
}

.custom-card-body {
    padding: 1.5rem;
}

.custom-card-text {
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0;
}

.custom-card-footer {
    padding: 1rem 1.5rem;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
}

.custom-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.custom-btn-primary {
    background: var(--primary-color);
    color: var(--text-on-primary);
}

.custom-btn-primary:hover {
    background: var(--primary-hover);
    transform: scale(1.05);
}
</style>
```

### 6. Form with Theme Support

```html
<form class="theme-aware-form">
    <div class="form-group">
        <label for="name">Nome</label>
        <input type="text" id="name" class="form-control" placeholder="Il tuo nome">
    </div>
    
    <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" class="form-control" placeholder="email@esempio.it">
    </div>
    
    <div class="form-group">
        <label for="message">Messaggio</label>
        <textarea id="message" class="form-control" rows="4" placeholder="Scrivi qui..."></textarea>
    </div>
    
    <button type="submit" class="btn btn-primary">Invia</button>
</form>

<style>
.theme-aware-form {
    background: var(--card-bg);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: var(--shadow-md);
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
    font-weight: 500;
}

.form-control {
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--input-bg);
    color: var(--input-text);
    border: 1px solid var(--input-border);
    border-radius: 8px;
    transition: all 0.2s ease;
}

.form-control::placeholder {
    color: var(--input-placeholder);
}

.form-control:focus {
    outline: none;
    border-color: var(--input-focus-border);
    box-shadow: 0 0 0 3px var(--input-focus-ring);
}
</style>
```

### 7. Modal with Theme Support

```html
<!-- Modal -->
<div class="modal fade" id="themeModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Settings</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p>Your content here</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary">Save</button>
            </div>
        </div>
    </div>
</div>

<!-- Note: Bootstrap modals automatically use theme variables -->
```

### 8. Table with Theme Support

```html
<div class="table-responsive">
    <table class="table table-hover">
        <thead>
            <tr>
                <th>#</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Ruolo</th>
                <th>Azioni</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1</td>
                <td>Mario Rossi</td>
                <td>mario@esempio.it</td>
                <td><span class="badge bg-primary">Admin</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary">Modifica</button>
                </td>
            </tr>
            <!-- More rows -->
        </tbody>
    </table>
</div>

<!-- Tables automatically use theme colors -->
```

### 9. Alert with Theme Support

```html
<div class="alert alert-info" role="alert">
    <i class="bi bi-info-circle me-2"></i>
    This is an info alert that adapts to the theme!
</div>

<div class="alert alert-success" role="alert">
    <i class="bi bi-check-circle me-2"></i>
    Success message with theme support!
</div>

<!-- Alerts automatically adapt to theme -->
```

### 10. Custom Theme Toggle Button

```html
<!-- Simple toggle button -->
<button id="theme-toggle" class="theme-toggle-btn">
    <i class="bi bi-moon-stars-fill"></i>
</button>

<style>
.theme-toggle-btn {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--primary-color);
    color: var(--text-on-primary);
    border: none;
    box-shadow: var(--shadow-xl);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    transition: all 0.3s ease;
    z-index: 1000;
}

.theme-toggle-btn:hover {
    transform: scale(1.1) rotate(15deg);
    box-shadow: var(--shadow-2xl);
}
</style>

<script>
document.getElementById('theme-toggle').addEventListener('click', () => {
    window.themeManager.toggleTheme();
});
</script>
```

### 11. Advanced: Dynamic Content Loading

```javascript
// Load different content based on theme
async function loadThemeSpecificContent() {
    const theme = window.themeManager.getCurrentTheme();
    
    if (theme.isDark) {
        // Load dark-optimized images
        const images = document.querySelectorAll('img[data-dark-src]');
        images.forEach(img => {
            img.src = img.dataset.darkSrc;
        });
    } else {
        // Load light-optimized images
        const images = document.querySelectorAll('img[data-light-src]');
        images.forEach(img => {
            img.src = img.dataset.lightSrc;
        });
    }
}

// Listen for theme changes
window.addEventListener('themechange', loadThemeSpecificContent);

// Load on page load
window.addEventListener('DOMContentLoaded', loadThemeSpecificContent);
```

### 12. Creating Custom Color Schemes

```css
/* Add custom color scheme in your CSS */
:root[data-theme="light"] {
    /* Override or extend default variables */
    --my-custom-color: #ff6b6b;
    --my-accent: #4ecdc4;
}

:root[data-theme="dark"] {
    /* Different colors for dark theme */
    --my-custom-color: #ff8787;
    --my-accent: #6fe6dc;
}

/* Use in your components */
.my-special-element {
    background: var(--my-custom-color);
    color: var(--my-accent);
}
```

### 13. Accessibility Features

```html
<!-- High contrast mode button (future feature) -->
<button id="high-contrast-toggle" aria-label="Toggle High Contrast">
    <i class="bi bi-eye"></i> High Contrast
</button>

<style>
/* Ensure good contrast ratios */
:root[data-theme="light"] {
    --text-primary: #1e293b; /* WCAG AA: 4.5:1 */
}

:root[data-theme="dark"] {
    --text-primary: #f1f5f9; /* WCAG AA: 7:1 */
}

/* Focus states for keyboard navigation */
:focus-visible {
    outline: 3px solid var(--primary-color);
    outline-offset: 2px;
}
</style>
```

### 14. Theme Persistence Check

```javascript
// Check if theme is persisted correctly
function checkThemePersistence() {
    const saved = localStorage.getItem('site-theme-preference');
    const current = document.documentElement.getAttribute('data-theme');
    
    console.log('Saved preference:', saved);
    console.log('Current theme:', current);
    console.log('Match:', saved === current || (saved === 'auto' && current));
    
    return saved !== null;
}

// Run on page load
window.addEventListener('DOMContentLoaded', () => {
    if (checkThemePersistence()) {
        console.log('✅ Theme persistence working correctly');
    } else {
        console.warn('⚠️ Theme persistence issue detected');
    }
});
```

### 15. Complete Example: News Card Component

```html
<!-- news-card.ejs -->
<div class="news-card">
    <div class="news-card-image">
        <img src="<%= imageUrl %>" alt="<%= title %>">
        <div class="news-card-overlay">
            <span class="news-card-category"><%= category %></span>
        </div>
    </div>
    <div class="news-card-content">
        <div class="news-card-meta">
            <span class="news-card-date">
                <i class="bi bi-calendar"></i>
                <%= date %>
            </span>
            <span class="news-card-author">
                <i class="bi bi-person"></i>
                <%= author %>
            </span>
        </div>
        <h3 class="news-card-title"><%= title %></h3>
        <p class="news-card-excerpt"><%= excerpt %></p>
        <a href="/news/<%= id %>" class="news-card-link">
            Leggi di più <i class="bi bi-arrow-right"></i>
        </a>
    </div>
</div>

<style>
.news-card {
    background: var(--card-bg);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid var(--border-color);
}

.news-card:hover {
    box-shadow: var(--shadow-xl);
    transform: translateY(-8px);
}

.news-card-image {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
}

.news-card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.news-card:hover .news-card-image img {
    transform: scale(1.1);
}

.news-card-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.7));
    display: flex;
    align-items: flex-end;
    padding: 1rem;
}

.news-card-category {
    background: var(--primary-color);
    color: var(--text-on-primary);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
}

.news-card-content {
    padding: 1.5rem;
}

.news-card-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.news-card-meta span {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.news-card-title {
    color: var(--text-primary);
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    line-height: 1.3;
}

.news-card-excerpt {
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 1.5rem;
}

.news-card-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--primary-color);
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
}

.news-card-link:hover {
    gap: 1rem;
    color: var(--primary-hover);
}

/* Dark theme specific adjustments */
:root[data-theme="dark"] .news-card-image img {
    opacity: 0.9;
}
</style>
```

---

## Tips & Best Practices

1. **Always use CSS variables** instead of hardcoded colors
2. **Test in both themes** before considering a component done
3. **Use semantic variable names** (e.g., `--text-primary` not `--color-black`)
4. **Provide fallbacks** for older browsers if needed
5. **Keep transitions subtle** (200-300ms is usually enough)
6. **Check contrast ratios** for accessibility
7. **Use theme-specific overrides** sparingly
8. **Document custom variables** in your component files

---

**More examples coming soon!**  
Check the documentation for the latest updates.
