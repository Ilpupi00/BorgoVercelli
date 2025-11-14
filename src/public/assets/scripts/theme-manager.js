/**
 * Theme Manager - Modern Dark Mode System
 * Manages theme switching with localStorage persistence
 */

class ThemeManager {
    constructor() {
        this.THEME_KEY = 'site-theme-preference';
        this.themes = {
            LIGHT: 'light',
            DARK: 'dark',
            AUTO: 'auto'
        };
        
        this.init();
    }

    /**
     * Initialize theme manager
     */
    init() {
        // Load saved theme or default to auto
        const savedTheme = this.getSavedTheme();
        this.applyTheme(savedTheme);
        
        // Setup media query listener for system preference changes
        this.setupSystemThemeListener();
        
        // Setup theme toggle buttons if they exist
        this.setupThemeToggles();
        
        // Update UI to reflect current theme
        this.updateThemeUI();
            // Send a quick debug report (only on localhost) to help server-side diagnosis
            try {
                this.reportNavbarDebug();
            } catch (e) {
                // Silent fail in production
            }
    }

    /**
     * Get saved theme from localStorage
     */
    getSavedTheme() {
        const saved = localStorage.getItem(this.THEME_KEY);
        if (saved && Object.values(this.themes).includes(saved)) {
            return saved;
        }
        return this.themes.AUTO;
    }

    /**
     * Save theme preference to localStorage
     */
    saveTheme(theme) {
        localStorage.setItem(this.THEME_KEY, theme);
    }

    /**
     * Get the effective theme (resolves 'auto' to 'light' or 'dark')
     */
    getEffectiveTheme(theme = this.getSavedTheme()) {
        if (theme === this.themes.AUTO) {
            return this.getSystemPreference();
        }
        return theme;
    }

    /**
     * Get system color scheme preference
     */
    getSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return this.themes.DARK;
        }
        return this.themes.LIGHT;
    }

    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        const effectiveTheme = this.getEffectiveTheme(theme);
        
        // Set data-theme attribute on root element
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        
        // Update body class for backwards compatibility
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${effectiveTheme}`);
        // Also set data-theme on body so CSS selectors that target body[data-theme="dark"] work
        try {
            document.body.setAttribute('data-theme', effectiveTheme);
        } catch (e) {
            // ignore in environments where body may not be available yet
        }
        
        // Save preference
        this.saveTheme(theme);
        
        // Dispatch custom event for other components
        this.dispatchThemeChangeEvent(effectiveTheme, theme);
        
        // Update UI
        this.updateThemeUI();
    }

    /**
     * Dispatch theme change event
     */
    dispatchThemeChangeEvent(effectiveTheme, selectedTheme) {
        const event = new CustomEvent('themechange', {
            detail: {
                theme: effectiveTheme,
                preference: selectedTheme
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * Setup listener for system theme changes
     */
    setupSystemThemeListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // Modern browsers
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', (e) => {
                    const currentTheme = this.getSavedTheme();
                    if (currentTheme === this.themes.AUTO) {
                        this.applyTheme(this.themes.AUTO);
                    }
                });
            }
            // Older browsers
            else if (mediaQuery.addListener) {
                mediaQuery.addListener((e) => {
                    const currentTheme = this.getSavedTheme();
                    if (currentTheme === this.themes.AUTO) {
                        this.applyTheme(this.themes.AUTO);
                    }
                });
            }
        }
    }

    /**
     * Setup theme toggle buttons
     */
    setupThemeToggles() {
        // Theme toggle buttons
        const lightBtn = document.getElementById('theme-light');
        const darkBtn = document.getElementById('theme-dark');
        const autoBtn = document.getElementById('theme-auto');
        
        if (lightBtn) {
            lightBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.applyTheme(this.themes.LIGHT);
            });
        }
        
        if (darkBtn) {
            darkBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.applyTheme(this.themes.DARK);
            });
        }
        
        if (autoBtn) {
            autoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.applyTheme(this.themes.AUTO);
            });
        }

        // Single toggle button (if exists)
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
        }
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const currentTheme = this.getSavedTheme();
        const effectiveTheme = this.getEffectiveTheme(currentTheme);
        
        if (effectiveTheme === this.themes.LIGHT) {
            this.applyTheme(this.themes.DARK);
        } else {
            this.applyTheme(this.themes.LIGHT);
        }
    }

    /**
     * Update theme UI elements
     */
    updateThemeUI() {
        const savedTheme = this.getSavedTheme();
        const effectiveTheme = this.getEffectiveTheme(savedTheme);
        
        // Update button active states
        const lightBtn = document.getElementById('theme-light');
        const darkBtn = document.getElementById('theme-dark');
        const autoBtn = document.getElementById('theme-auto');
        
        if (lightBtn) lightBtn.classList.toggle('active', savedTheme === this.themes.LIGHT);
        if (darkBtn) darkBtn.classList.toggle('active', savedTheme === this.themes.DARK);
        if (autoBtn) autoBtn.classList.toggle('active', savedTheme === this.themes.AUTO);
        
        // Update toggle button icon
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = effectiveTheme === this.themes.DARK 
                    ? 'bi bi-sun-fill' 
                    : 'bi bi-moon-stars-fill';
            }
        }
        
        // Update dropdown button text/icon if exists
        const dropdownBtn = document.getElementById('theme-dropdown-btn');
        if (dropdownBtn) {
            const icon = dropdownBtn.querySelector('i');
            if (icon) {
                if (savedTheme === this.themes.AUTO) {
                    icon.className = 'bi bi-circle-half';
                } else if (savedTheme === this.themes.DARK) {
                    icon.className = 'bi bi-moon-stars-fill';
                } else {
                    icon.className = 'bi bi-sun-fill';
                }
            }
        }
    }

    /**
     * Get current theme info
     */
    getCurrentTheme() {
        const saved = this.getSavedTheme();
        const effective = this.getEffectiveTheme(saved);
        return {
            preference: saved,
            effective: effective,
            isAuto: saved === this.themes.AUTO,
            isDark: effective === this.themes.DARK,
            isLight: effective === this.themes.LIGHT
        };
    }
}

/**
 * Debug helper - collects computed styles of navbar and its ancestors
 * and POSTs them to the server for easier debugging in development.
 */
ThemeManager.prototype.reportNavbarDebug = function() {
    // Only run in dev/local environments
    if (!location || !(location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;

    try {
        const el = document.getElementById('navbar');
        const toCollect = [];
        if (!el) return;

        let node = el;
        while (node) {
            const cs = window.getComputedStyle(node);
            toCollect.push({
                tag: node.tagName,
                id: node.id || null,
                class: node.className || null,
                position: cs.position,
                top: cs.top,
                overflow: cs.overflow,
                overflowX: cs.overflowX,
                overflowY: cs.overflowY,
                transform: cs.transform,
                zIndex: cs.zIndex,
                willChange: cs.willChange
            });
            if (node.tagName === 'BODY') break;
            node = node.parentElement;
        }

        // Also collect root/html styles
        const root = document.documentElement;
        const rootCs = window.getComputedStyle(root);
        const rootInfo = {
            tag: 'HTML',
            position: rootCs.position,
            overflow: rootCs.overflow,
            overflowX: rootCs.overflowX,
            overflowY: rootCs.overflowY,
            transform: rootCs.transform
        };

        const payload = {
            hostname: location.hostname,
            href: location.href,
            items: toCollect,
            root: rootInfo,
            userAgent: navigator.userAgent
        };

        // Fire-and-forget POST
        fetch('/__debug-navbar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {});
    } catch (e) {
        // ignore
    }
};

// Initialize theme manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
}

// Debug helper: allow forcing a theme via query string (only in dev/local)
try {
    const params = new URLSearchParams(window.location.search);
    const force = params.get('forceTheme');
    if (force && (force === 'light' || force === 'dark')) {
        // Apply only on localhost for safety
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            // Small timeout to allow ThemeManager to initialize
            setTimeout(() => {
                if (window.themeManager) window.themeManager.applyTheme(force);
            }, 120);
        }
    }
} catch (e) {
    // ignore
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
