class AdminThemePicker {
    constructor() {
        this.keyLight = 'primaryColorLight';
        this.keyDark = 'primaryColorDark';
        this.colorLightEl = null;
        this.colorDarkEl = null;
        this.init();
    }

    hexToRgb(hex) {
        const h = (hex || '').replace('#', '').trim();
        if (!h) return [0, 0, 0];
        if (h.length === 3) {
            const r = parseInt(h[0] + h[0], 16);
            const g = parseInt(h[1] + h[1], 16);
            const b = parseInt(h[2] + h[2], 16);
            return [r, g, b];
        }
        const bigint = parseInt(h, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r, g, b];
    }

    darken(hex, pct) {
        const [r, g, b] = this.hexToRgb(hex);
        const nr = Math.max(0, Math.min(255, Math.round(r * (1 - pct))));
        const ng = Math.max(0, Math.min(255, Math.round(g * (1 - pct))));
        const nb = Math.max(0, Math.min(255, Math.round(b * (1 - pct))));
        const toHex = (v) => v.toString(16).padStart(2, '0');
        return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
    }

    applyPrimaryForTheme(theme) {
        const light = localStorage.getItem(this.keyLight);
        const dark = localStorage.getItem(this.keyDark);
        if (theme === 'dark') {
            if (dark) {
                const safe = this._safePrimary(dark);
                document.documentElement.style.setProperty('--primary-color', safe);
                document.documentElement.style.setProperty('--primary-hover', this.darken(safe, 0.12));
            }
        } else {
            if (light) {
                const safe = this._safePrimary(light);
                document.documentElement.style.setProperty('--primary-color', safe);
                document.documentElement.style.setProperty('--primary-hover', this.darken(safe, 0.12));
            }
        }
    }

    _safePrimary(hex) {
        // Basic guard: if color is empty or nearly white, fallback to default primary
        if (!hex) return '#2563eb';
        const h = (hex || '').replace('#', '').trim();
        if (!h) return '#2563eb';
        // convert to rgb and compute luminance-ish value
        const [r, g, b] = this.hexToRgb('#' + h);
        // relative luminance approximation (0..255). If very light, consider unsafe
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        if (lum > 0.95) {
            return '#2563eb';
        }
        return '#' + h;
    }

    init() {
        // Defer DOM queries until DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._setup());
        } else {
            this._setup();
        }
    }

    _setup() {
        this.colorLightEl = document.getElementById('color-light');
        this.colorDarkEl = document.getElementById('color-dark');

        // initialize pickers with saved values or computed style
        try {
            const cs = getComputedStyle(document.documentElement);
            const currentPrimary = (cs.getPropertyValue('--primary-color') || '').trim() || '#0d6efd';
            const savedLight = localStorage.getItem(this.keyLight) || currentPrimary;
            const savedDark = localStorage.getItem(this.keyDark) || currentPrimary;
            if (this.colorLightEl) this.colorLightEl.value = savedLight;
            if (this.colorDarkEl) this.colorDarkEl.value = savedDark;

            // apply effective theme's color now
            const effective = (window.themeManager && typeof window.themeManager.getCurrentTheme === 'function')
                ? window.themeManager.getCurrentTheme().effective
                : 'light';
            this.applyPrimaryForTheme(effective);
        } catch (e) {
            // swallow
            // console.warn(e);
        }

        this.attachListeners();
    }

    attachListeners() {
        if (this.colorLightEl) {
            this.colorLightEl.addEventListener('input', (e) => {
                localStorage.setItem(this.keyLight, e.target.value);
                const effective = (window.themeManager && typeof window.themeManager.getCurrentTheme === 'function')
                    ? window.themeManager.getCurrentTheme().effective
                    : 'light';
                if (effective === 'light') this.applyPrimaryForTheme('light');
            });
        }

        if (this.colorDarkEl) {
            this.colorDarkEl.addEventListener('input', (e) => {
                localStorage.setItem(this.keyDark, e.target.value);
                const effective = (window.themeManager && typeof window.themeManager.getCurrentTheme === 'function')
                    ? window.themeManager.getCurrentTheme().effective
                    : 'light';
                if (effective === 'dark') this.applyPrimaryForTheme('dark');
            });
        }

        // react to theme change events
        window.addEventListener('themechange', (ev) => {
            const theme = ev && ev.detail ? ev.detail.theme : null;
            if (theme) this.applyPrimaryForTheme(theme);
        });

        // wire the theme buttons if present (for admin header)
        const lightBtn = document.getElementById('theme-light');
        const darkBtn = document.getElementById('theme-dark');
        const autoBtn = document.getElementById('theme-auto');
        if (lightBtn && darkBtn && autoBtn && window.themeManager) {
            lightBtn.addEventListener('click', (e) => { e.preventDefault(); window.themeManager.applyTheme(window.themeManager.themes.LIGHT); });
            darkBtn.addEventListener('click', (e) => { e.preventDefault(); window.themeManager.applyTheme(window.themeManager.themes.DARK); });
            autoBtn.addEventListener('click', (e) => { e.preventDefault(); window.themeManager.applyTheme(window.themeManager.themes.AUTO); });
        }
    }
}

// Auto initialize instance
(function(){
    if (typeof window !== 'undefined') {
        window.AdminThemePicker = new AdminThemePicker();
    }
})();
