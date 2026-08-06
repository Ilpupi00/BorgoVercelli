/**
 * TemaSwitcher - Sistema Avanzato di Gestione Temi Lato Client
 *
 * FLUSSO CORRETTO:
 *   1. Il server injetta già le variabili CSS e data-theme sull'<html> via middleware.
 *   2. Il client legge window.__BORGO_TEMA impostato inline nel <head> — zero FOUC.
 *   3. Al cambio tema l'utente chiama loadTema() → applica variabili CSS + salva cookie + API.
 *   4. Al cambio pagina il server ri-legge il cookie e ri-inietta il CSS corretto → consistente.
 */

class TemaSwitcher {
    constructor() {
        // Tema iniziale risolto dal bootstrap inline, con fallback al server
        this.temaServer = window.__BORGO_TEMA || 'light';
        this.temaAttuale = this.temaServer;
        this.isLoggedIn  = window.__BORGO_LOGGED === true || window.__BORGO_LOGGED === 'true';
        this.temiPredefiniti = {};
        this.pollingInterval = 30000; // 30 secondi (solo per cambio globale admin)

        this.init();
    }

    async init() {
        try {
            await this.bootstrapPreferredTheme();

            // Carica la lista temi dal server senza bloccare il primo paint.
            await this.caricaTemiPredefiniti();

            // Se era un tema custom, riprova ora che la lista è disponibile.
            await this.bootstrapPreferredTheme();

            // Assicurati che data-theme sia già impostato (è già fatto inline, ma per sicurezza)
            document.documentElement.setAttribute('data-theme', this.temaAttuale);
            document.documentElement.style.colorScheme = this.temaAttuale === 'dark' ? 'dark' : 'light';

            // Event listeners per il dropdown navbar
            this.setupEventListeners();

            // Aggiorna l'UI (badge attivo nel dropdown)
            this.updateUIElements();

            // Polling in background solo per utenti non loggati (cambio tema globale admin)
            if (!this.isLoggedIn) {
                this.observeServerChanges();
            }

            console.log(`[TemaSwitcher] ✅ Inizializzato con tema: ${this.temaAttuale}`);
        } catch (err) {
            console.error('[TemaSwitcher] Errore inizializzazione:', err);
        }
    }

    /**
     * Legge la preferenza del browser e la applica se differisce dal tema server.
     */
    async bootstrapPreferredTheme() {
        const VALID_THEMES = ['light', 'dark', 'sport', 'nature'];
        const preferredTheme = this.getPreferredTheme();

        // Temi predefiniti semplici: applicabili subito senza fetch
        if (VALID_THEMES.includes(preferredTheme)) {
            this.temaAttuale = preferredTheme;
            document.documentElement.setAttribute('data-theme', preferredTheme);
            document.documentElement.style.colorScheme = preferredTheme === 'dark' ? 'dark' : 'light';
            window.__BORGO_TEMA = preferredTheme;
            this.syncThemeStorage(preferredTheme);
            return;
        }

        if (preferredTheme && preferredTheme !== this.temaAttuale && this.temiPredefiniti[preferredTheme]) {
            await this.loadTema(preferredTheme);
            return;
        }

        if (preferredTheme) {
            this.temaAttuale = preferredTheme;
            document.documentElement.setAttribute('data-theme', preferredTheme);
            document.documentElement.style.colorScheme = preferredTheme === 'dark' ? 'dark' : 'light';
            window.__BORGO_TEMA = preferredTheme;
            this.syncThemeStorage(preferredTheme);
        }
    }

    /**
     * Calcola il tema preferito dal browser, compatibile con la vecchia chiave localStorage.
     */
    getPreferredTheme() {
        const VALID_THEMES = ['light', 'dark', 'sport', 'nature'];
        try {
            const saved = localStorage.getItem('site-theme-preference');
            if (saved && VALID_THEMES.includes(saved)) {
                return saved;
            }
            if (saved === 'auto') {
                return this.getSystemTheme();
            }
        } catch (err) {
            // ignore storage errors and use server theme
        }

        return this.temaServer;
    }

    /**
     * Restituisce il tema di sistema effettivo.
     */
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * Sincronizza localStorage con il tema attivo.
     */
    syncThemeStorage(temaId) {
        try {
            localStorage.setItem('site-theme-preference', temaId);
        } catch (err) {
            // ignore storage errors
        }
    }

    /**
     * Carica la palette dei temi predefiniti dal server (una sola volta)
     */
    async caricaTemiPredefiniti() {
        try {
            const res = await fetch('/api/temi/lista');
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.temi && data.temi.predefiniti) {
                    data.temi.predefiniti.forEach(t => {
                        this.temiPredefiniti[t.id] = t;
                    });
                }
            }
        } catch (err) {
            console.warn('[TemaSwitcher] Impossibile caricare temi dal server:', err.message);
        }
    }

    /**
     * Cambia tema dinamicamente senza reload della pagina.
     * Al cambio pagina successivo, il server leggerà il cookie e userà lo stesso tema.
     */
    async loadTema(temaId) {
        if (!temaId || temaId === this.temaAttuale) return;

        const THEME_BG = {
            'light':  '#ffffff',
            'dark':   '#0f1117',
            'sport':  '#F8F9FC',
            'nature': '#F7FEF9'
        };

        try {
            let applicato = false;

            // Prova prima temi predefiniti (in memoria, niente fetch)
            if (this.temiPredefiniti[temaId]) {
                this.applicaVariabiliCSS(this.temiPredefiniti[temaId].colori);
                applicato = true;
            } else {
                // Tema personalizzato: caricalo dal server
                const res = await fetch(`/api/temi/personalizzato/${temaId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.tema) {
                        const colori = typeof data.tema.colori === 'string'
                            ? JSON.parse(data.tema.colori)
                            : data.tema.colori;
                        this.applicaVariabiliCSS(colori);
                        applicato = true;
                    }
                }
            }

            if (!applicato) throw new Error(`Tema "${temaId}" non trovato`);

            // Aggiorna stato interno
            this.temaAttuale = temaId;
            document.documentElement.setAttribute('data-theme', temaId);
            document.documentElement.style.colorScheme = temaId === 'dark' ? 'dark' : 'light';
            // Aggiorna il background immediatamente per evitare flash
            const bg = THEME_BG[temaId];
            if (bg) {
                document.documentElement.style.backgroundColor = bg;
                document.body && (document.body.style.backgroundColor = bg);
            }
            window.__BORGO_TEMA = temaId;
            this.syncThemeStorage(temaId);

            // Persisti nel cookie (il server lo leggerà alla prossima pagina)
            const maxAge = 30 * 24 * 60 * 60; // 30 giorni in secondi
            document.cookie = `tema=${temaId}; path=/; max-age=${maxAge}; SameSite=Lax`;

            // Salva su DB se l'utente è loggato (async, non blocca la UI)
            if (this.isLoggedIn) {
                this.salvaPreferenzaTema(temaId).catch(() => {});
            }

            this.updateUIElements();
            this.mostraNotifica(`Tema cambiato: ${temaId}`, 'success');

        } catch (err) {
            console.error('[TemaSwitcher] Errore caricamento tema:', err);
            this.mostraNotifica('Errore durante il caricamento del tema', 'danger');
        }
    }

    /**
     * Applica le variabili CSS al :root sovrascrivendo quelle iniettate dal server.
     * Rimuove anche il <style id="dynamic-theme-style"> iniettato lato server
     * per evitare duplicati (le variabili inline su :root hanno priorità comunque).
     */
    applicaVariabiliCSS(c) {
        if (!c) return;
        const root = document.documentElement;

        const vars = {
            '--primary-color':      c.primary,
            '--primary-variant':    c.primary_hover,
            '--primary-hover':      c.primary_hover,
            '--primary-active':     c.primary_hover,
            '--btn-primary-bg':     c.btn_primary_bg    || c.primary,
            '--btn-primary-text':   c.btn_primary_text  || '#ffffff',
            '--btn-primary-hover':  c.btn_primary_hover || c.primary_hover,
            '--secondary-color':    c.secondary,
            '--success':            c.success,
            '--danger':             c.danger,
            '--warning':            c.warning,
            '--info':               c.info,
            '--bg-primary':         c.background,
            '--bg-secondary':       c.surface,
            '--bg-tertiary':        c.surface,
            '--bg-elevated':        c.card_background   || c.surface,
            '--bg-hover':           c.surface,
            '--text-primary':       c.text_primary,
            '--text-secondary':     c.text_secondary,
            '--text-tertiary':      c.text_secondary,
            '--text-on-primary':    c.btn_primary_text  || '#ffffff',
            '--text-muted':         c.text_secondary,
            '--border-color':       c.border,
            '--border-hover':       c.border,
            '--border-focus':       c.primary,
            '--card-bg':            c.card_background   || c.background,
            '--card-border':        c.card_border       || c.border,
            '--card-shadow':        c.card_shadow       || '0 1px 3px rgba(0,0,0,0.1)',
            '--shadow-sm':          '0 1px 2px rgba(0,0,0,0.08)',
            '--shadow-md':          '0 4px 6px rgba(0,0,0,0.1)',
            '--shadow-lg':          '0 10px 15px rgba(0,0,0,0.1)',
            '--input-bg':           c.input_bg          || c.background,
            '--input-border':       c.input_border      || c.border,
            '--input-text':         c.input_text        || c.text_primary,
            '--input-placeholder':  c.text_secondary,
            '--input-focus-border': c.primary,
            '--navbar-bg':          c.navbar_bg,
            '--navbar-text':        c.navbar_text       || '#ffffff',
            '--navbar-hover':       'rgba(255,255,255,0.1)',
            '--footer-bg':          c.footer_bg,
            '--footer-text':        c.footer_text,
            '--gradient-primary':   c.gradient_primary,
            '--gradient-success':   c.gradient_success,
        };

        for (const [key, value] of Object.entries(vars)) {
            if (value !== undefined && value !== null && value !== '') {
                root.style.setProperty(key, value);
            }
        }
    }

    /**
     * Registra i click sui bottoni [data-tema] nel navbar dropdown
     */
    setupEventListeners() {
        document.querySelectorAll('[data-tema]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const nuovoTema = el.getAttribute('data-tema');
                this.loadTema(nuovoTema);
            });
        });

        // Compatibilità bottoni vecchi (se presenti)
        const lightBtn = document.getElementById('theme-light');
        const darkBtn  = document.getElementById('theme-dark');
        if (lightBtn) lightBtn.addEventListener('click', () => this.loadTema('light'));
        if (darkBtn)  darkBtn.addEventListener('click',  () => this.loadTema('dark'));
    }

    /**
     * Aggiorna lo stato visivo del dropdown (classe "active" sul tema corrente)
     */
    updateUIElements() {
        document.querySelectorAll('[data-tema]').forEach(el => {
            const isCurrent = el.getAttribute('data-tema') === this.temaAttuale;
            el.classList.toggle('active', isCurrent);
        });
    }

    /**
     * Salva la preferenza tema sul database via API (solo per utenti loggati)
     */
    async salvaPreferenzaTema(temaId) {
        try {
            const res = await fetch('/api/user/tema-preferenza', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ temaId })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
        } catch (err) {
            console.warn('[TemaSwitcher] Errore salvataggio preferenza:', err.message);
        }
    }

    /**
     * (Solo Admin) Imposta il tema globale del sito per tutti gli utenti non loggati
     */
    async cambiaTemaSuServer(temaId) {
        try {
            const res = await fetch('/admin/temi/attiva', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ temaId })
            });
            const data = await res.json();
            if (data.success) {
                this.mostraNotifica(`Tema globale impostato: ${temaId}`, 'success');
                await this.loadTema(temaId);
            } else {
                throw new Error(data.message || 'Errore');
            }
        } catch (err) {
            console.error('[TemaSwitcher] Errore attivazione tema globale:', err);
            this.mostraNotifica('Impossibile cambiare tema globale', 'danger');
        }
    }

    /**
     * Polling in background per rilevare cambi di tema globale impostati dall'admin
     * (attivo solo per utenti non loggati)
     */
    observeServerChanges() {
        setInterval(async () => {
            try {
                const res = await fetch('/api/temi/corrente');
                if (!res.ok) return;
                const data = await res.json();
                if (data.success && data.tema_attivo && data.tema_attivo !== this.temaAttuale) {
                    console.log(`[TemaSwitcher] 🔄 Nuovo tema globale rilevato: ${data.tema_attivo}`);
                    await this.loadTema(data.tema_attivo);
                }
            } catch { /* silenzioso */ }
        }, this.pollingInterval);
    }

    /**
     * Mostra una toast notification Bootstrap
     */
    mostraNotifica(messaggio, tipo = 'info') {
        const el = document.createElement('div');
        el.className = `alert alert-${tipo} alert-dismissible fade show position-fixed bottom-0 end-0 m-3 shadow-lg`;
        el.style.cssText = 'z-index:1055;min-width:220px;';
        el.setAttribute('role', 'alert');
        el.innerHTML = `${messaggio}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        document.body.appendChild(el);
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => el.remove(), 150);
        }, 2500);
    }
}

// Inizializza appena il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    window.temaSwitcher = new TemaSwitcher();
});
