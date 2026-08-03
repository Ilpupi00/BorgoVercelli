/**
 * TemaSwitcher - Sistema Avanzato di Gestione Temi Lato Client
 * Gestisce il cambio di tema senza reload, persistenza tramite API
 * e sincronizzazione in background con il server.
 */

class TemaSwitcher {
    constructor() {
        this.temaAttuale = null;
        this.temiPredefiniti = {};
        this.pollingInterval = 30000; // 30 secondi
        this.isLoggedIn = document.body.dataset.logged === 'true' || false;
        
        // Elementi UI
        this.dropdownMenu = document.querySelector('.theme-dropdown');
        this.toggleBtn = document.getElementById('theme-dropdown-btn');
        
        this.init();
    }

    /**
     * Inizializza il sistema
     */
    async init() {
        try {
            // 1. Carica prima la lista dei temi predefiniti
            await this.caricaTemiPredefiniti();
            
            // 2. Scopre il tema attuale dal cookie o dal server
            await this.sincronizzaTemaCorrente();
            
            // 3. Imposta gli Event Listeners
            this.setupEventListeners();
            
            // 4. Avvia il polling in background (solo se necessario)
            this.observeServerChanges();
            
            // 5. Aggiorna la UI iniziale
            this.updateUIElements();
            
            console.log(`[TemaSwitcher] Inizializzato con tema: ${this.temaAttuale}`);
        } catch (err) {
            console.error('[TemaSwitcher] Errore in inizializzazione:', err);
        }
    }

    /**
     * Carica dal server la configurazione dei temi predefiniti
     */
    async caricaTemiPredefiniti() {
        try {
            const res = await fetch('/api/temi/lista');
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.temi) {
                    // Mappa l'array in un oggetto { "light": { ... }, "dark": { ... } }
                    data.temi.predefiniti.forEach(t => {
                        this.temiPredefiniti[t.id] = t;
                    });
                }
            }
        } catch (err) {
            console.warn('[TemaSwitcher] Impossibile caricare temi predefiniti dal server:', err);
        }
    }

    /**
     * Sincronizza il tema attuale con quello impostato lato server
     */
    async sincronizzaTemaCorrente() {
        // Legge dal cookie (il middleware dovrebbe averlo impostato)
        const cookie = document.cookie.split('; ').find(row => row.startsWith('tema='));
        let temaId = cookie ? cookie.split('=')[1] : null;

        if (this.isLoggedIn) {
            // Se loggato, verifica se c'è una preferenza dal server (API)
            try {
                const res = await fetch('/api/user/tema-preferenza');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.preferenza) {
                        temaId = data.preferenza;
                    }
                }
            } catch (err) {
                // ignore
            }
        } else if (!temaId) {
            // Se non loggato e no cookie, prendi il globale
            try {
                const res = await fetch('/api/temi/corrente');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        temaId = data.tema_attivo;
                    }
                }
            } catch (err) {
                // ignore
            }
        }

        this.temaAttuale = temaId || 'light';
        document.documentElement.setAttribute('data-theme', this.temaAttuale);
    }

    /**
     * Carica e applica un tema dinamicamente
     */
    async loadTema(temaId) {
        if (!temaId || temaId === this.temaAttuale) return;

        try {
            // È un tema predefinito?
            if (this.temiPredefiniti[temaId]) {
                this.applicaTemaPredefinito(temaId);
            } else {
                // Altrimenti, tenta di caricarlo dal server (tema personalizzato)
                const res = await fetch(`/api/temi/personalizzato/${temaId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.tema) {
                        this.applicaTemaPersonalizzato(data.tema.colori, temaId);
                    } else {
                        throw new Error('Tema non trovato');
                    }
                } else {
                    throw new Error('Errore API tema personalizzato');
                }
            }

            // Aggiorna lo stato interno
            this.temaAttuale = temaId;
            document.documentElement.setAttribute('data-theme', temaId);
            document.cookie = `tema=${temaId}; path=/; max-age=2592000; SameSite=Lax`; // 30 giorni
            
            // Salva preferenza utente se loggato
            if (this.isLoggedIn) {
                await this.salvaPreferenzaTema(temaId);
            }

            this.updateUIElements();
            
        } catch (err) {
            console.error('[TemaSwitcher] Errore caricamento tema:', err);
            this.mostraNotifica('Errore durante il caricamento del tema', 'danger');
            
            // Fallback
            this.applicaTemaPredefinito('light');
        }
    }

    /**
     * Applica un tema predefinito (light, dark, sport, nature)
     */
    applicaTemaPredefinito(temaId) {
        const tema = this.temiPredefiniti[temaId];
        if (!tema) return;
        
        this.applicaVariabiliCSS(tema.colori);
    }

    /**
     * Applica un tema personalizzato a partire dai suoi colori
     */
    applicaTemaPersonalizzato(colori, temaId = 'custom') {
        // Applica le variabili e imposta un fallback light per i valori mancanti
        const light = this.temiPredefiniti['light']?.colori || {};
        const merged = { ...light, ...colori };
        this.applicaVariabiliCSS(merged);
    }

    /**
     * Applica le variabili CSS al :root
     */
    applicaVariabiliCSS(c) {
        const root = document.documentElement;
        
        // Mappatura colori -> Variabili CSS
        const vars = {
            '--primary-color': c.primary,
            '--primary-variant': c.primary_hover,
            '--primary-hover': c.primary_hover,
            '--primary-active': c.primary_hover,
            '--btn-primary-bg': c.btn_primary_bg || c.primary,
            '--btn-primary-text': c.btn_primary_text || '#ffffff',
            '--btn-primary-hover': c.btn_primary_hover || c.primary_hover,
            '--secondary-color': c.secondary,
            '--success': c.success,
            '--danger': c.danger,
            '--warning': c.warning,
            '--info': c.info,
            '--bg-primary': c.background,
            '--bg-secondary': c.surface,
            '--bg-tertiary': c.surface,
            '--bg-elevated': c.card_background || c.surface,
            '--bg-hover': c.surface,
            '--text-primary': c.text_primary,
            '--text-secondary': c.text_secondary,
            '--text-tertiary': c.text_secondary,
            '--text-on-primary': c.btn_primary_text || '#ffffff',
            '--text-muted': c.text_secondary,
            '--border-color': c.border,
            '--border-hover': c.border,
            '--border-focus': c.primary,
            '--card-bg': c.card_background || c.background,
            '--card-border': c.card_border || c.border,
            '--card-shadow': c.card_shadow || '0 1px 3px rgba(0,0,0,0.1)',
            '--input-bg': c.input_bg || c.background,
            '--input-border': c.input_border || c.border,
            '--input-text': c.input_text || c.text_primary,
            '--input-placeholder': c.text_secondary,
            '--input-focus-border': c.primary,
            '--navbar-bg': c.navbar_bg,
            '--navbar-text': c.navbar_text || '#ffffff',
            '--footer-bg': c.footer_bg,
            '--footer-text': c.footer_text
        };

        // Rimuove vecchi inline styles iniettati (se presenti nel DOM)
        const oldStyle = document.getElementById('dynamic-theme-style');
        if (oldStyle) oldStyle.remove();

        // Applica le nuove variabili direttamente al root
        for (const [key, value] of Object.entries(vars)) {
            if (value) {
                root.style.setProperty(key, value);
            }
        }
    }

    /**
     * Imposta i listener per il cambio tema (es. Navbar)
     */
    setupEventListeners() {
        // Intercetta i bottoni del tema nella Navbar [data-tema="..."]
        document.querySelectorAll('[data-tema]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const nuovoTema = el.getAttribute('data-tema');
                this.loadTema(nuovoTema);
            });
        });

        // Event listener storici per 'theme-light' e 'theme-dark' (Navbar vecchia)
        const lightBtn = document.getElementById('theme-light');
        const darkBtn = document.getElementById('theme-dark');
        
        if (lightBtn) lightBtn.addEventListener('click', () => this.loadTema('light'));
        if (darkBtn) darkBtn.addEventListener('click', () => this.loadTema('dark'));
    }

    /**
     * Salva la preferenza tema tramite API
     */
    async salvaPreferenzaTema(temaId) {
        if (!this.isLoggedIn) return;
        
        try {
            await fetch('/api/user/tema-preferenza', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ temaId })
            });
        } catch (err) {
            console.error('[TemaSwitcher] Errore salvataggio preferenza:', err);
        }
    }

    /**
     * (Solo Admin) Imposta il tema globale del sito
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
                this.mostraNotifica(`Tema globale impostato su: ${temaId}`, 'success');
                // Ricarica il tema localmente
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
     * Aggiorna gli elementi UI per riflettere il tema attivo
     */
    updateUIElements() {
        // Rimuove 'active' da tutti i bottoni tema
        document.querySelectorAll('[data-tema]').forEach(el => {
            el.classList.remove('active');
            if (el.getAttribute('data-tema') === this.temaAttuale) {
                el.classList.add('active');
            }
        });
        
        // Disabilita lo switch nativo di eventuali altri script ThemeManager vecchi
        if (typeof window.aggiornaIconaTema === 'function') {
            try {
                window.aggiornaIconaTema(this.temaAttuale);
            } catch (e) {}
        }
    }

    /**
     * Polling: sincronizzazione in background per eventuali cambi globali
     */
    observeServerChanges() {
        // Esegui polling solo se l'utente non ha una preferenza specifica salvata nel cookie
        // (Altrimenti il server ignorerebbe il globale per questo utente)
        setInterval(async () => {
            if (this.isLoggedIn) return; // Se è loggato il suo tema è prioritario
            
            try {
                const res = await fetch('/api/temi/corrente');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.tema_attivo && data.tema_attivo !== this.temaAttuale) {
                        // Il tema globale è cambiato!
                        console.log(`[TemaSwitcher] Sincronizzazione background: nuovo tema globale ${data.tema_attivo}`);
                        this.loadTema(data.tema_attivo);
                    }
                }
            } catch (err) {
                // Polling error silently ignored
            }
        }, this.pollingInterval);
    }

    /**
     * Mostra una toast notification Bootstrap
     */
    mostraNotifica(messaggio, tipo = 'info') {
        const alertHtml = `
            <div class="alert alert-${tipo} alert-dismissible fade show position-fixed bottom-0 end-0 m-3 shadow-lg" style="z-index: 1055; min-width: 250px;" role="alert">
                ${messaggio}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', alertHtml);
        const alertEl = document.body.lastElementChild;
        setTimeout(() => {
            alertEl.classList.remove('show');
            setTimeout(() => alertEl.remove(), 150);
        }, 3000);
    }

    /**
     * Estrae le variabili CSS attuali e le formatta in JSON (utile per Export admin)
     */
    getVariabiliCSS() {
        const root = document.documentElement;
        const styles = getComputedStyle(root);
        const colorVars = [
            'primary-color', 'primary-variant', 'secondary-color', 
            'success', 'danger', 'warning', 'info',
            'bg-primary', 'bg-secondary', 'text-primary', 'text-secondary',
            'border-color', 'card-bg', 'card-border', 'navbar-bg'
        ];
        
        let json = {};
        colorVars.forEach(v => {
            const val = styles.getPropertyValue(`--${v}`).trim();
            if (val) json[v] = val;
        });
        
        return json;
    }

    /**
     * Triggera il download del tema corrente come JSON
     */
    exportaTema() {
        const data = this.getVariabiliCSS();
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tema-${this.temaAttuale}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Inizializza al caricamento del DOM
document.addEventListener('DOMContentLoaded', () => {
    window.temaSwitcher = new TemaSwitcher();
});
