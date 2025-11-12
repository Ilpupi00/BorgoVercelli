class ContactForm {
    constructor() {
        // Do not query DOM here (script might be loaded before DOMContentLoaded in some pages)
        this.form = null;
        this.submitBtn = null;
        this.feedback = null;
        this.init();
    }

    init() {
        // Bind immediately if DOM is already ready, otherwise wait for DOMContentLoaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            // DOM already parsed
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // (re)locate form and controls at binding time so we find elements rendered by server
        // Prefer the page contact form (#contactForm) over the footer small form (#emailForm)
        this.form = document.getElementById('contactForm') || document.getElementById('emailForm');
        this.submitBtn = document.getElementById('submitBtn') || (this.form ? this.form.querySelector('button[type="submit"]') : null);

        // Ensure the form has a sensible fallback action/method in case JS fails to bind
        if (this.form) {
            try {
                // Only set defaults if not present to avoid overriding explicit templates
                if (!this.form.getAttribute('action')) this.form.setAttribute('action', '/send-email');
                if (!this.form.getAttribute('method')) this.form.setAttribute('method', 'POST');
            } catch (e) {
                // ignore errors
            }
        }
        this.feedback = document.getElementById('feedback');

        if (!this.form) return; // nothing to bind on this page

        // Attach submit handler
        this.form.addEventListener('submit', (event) => this.handleSubmit(event));

        // Validazione in tempo reale
        const inputs = this.form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';

        switch (field.name) {
            case 'name':
                if (!value) {
                    isValid = false;
                    message = 'Il nome è obbligatorio.';
                }
                break;
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!value) {
                    isValid = false;
                    message = 'L\'email è obbligatoria.';
                } else if (!emailRegex.test(value)) {
                    isValid = false;
                    message = 'Inserisci un indirizzo email valido.';
                }
                break;
            case 'subject':
                if (!value) {
                    isValid = false;
                    message = 'L\'oggetto è obbligatorio.';
                }
                break;
            case 'message':
                if (!value) {
                    isValid = false;
                    message = 'Il messaggio è obbligatorio.';
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(field, message);
        } else {
            this.clearFieldError(field);
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('is-invalid');
        const feedback = field.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.textContent = message;
        }
    }

    clearFieldError(field) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
    }

    validateForm() {
        let isValid = true;
        const inputs = this.form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        return isValid;
    }

    async handleSubmit(event) {
        event.preventDefault();

        if (!this.validateForm()) {
            this.showFeedback('Per favore, correggi gli errori nel form.', 'danger');
            return;
        }

        this.setLoading(true);

        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData);

        try {
            // Send to the legacy server route that handles email sending (POST /send-email)
            const response = await fetch('/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result && result.success) {
                // Prefer using the site's ShowModal helper when available
                if (window.ShowModal && typeof window.ShowModal.showModalSuccess === 'function') {
                    try { window.ShowModal.showModalSuccess('Messaggio inviato', 'Ti risponderemo presto.'); } catch (e) { /* ignore */ }
                } else {
                    this.showFeedback('Messaggio inviato con successo! Ti risponderemo presto.', 'success');
                }
                this.form.reset();
                this.clearValidation();
            } else {
                const errMsg = result && (result.error || (result.details && result.details.message)) ? (result.error || result.details.message) : 'Errore durante l\'invio del messaggio.';
                if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') {
                    try { window.ShowModal.showModalError(errMsg, 'Errore invio messaggio'); } catch (e) { /* ignore */ }
                } else {
                    this.showFeedback(errMsg, 'danger');
                }
            }
        } catch (error) {
            console.error('Errore:', error);
            const errMsg = 'Errore di connessione. Riprova più tardi.';
            if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') {
                try { window.ShowModal.showModalError(errMsg, 'Errore invio messaggio'); } catch (e) { /* ignore */ }
            } else {
                this.showFeedback(errMsg, 'danger');
            }
        } finally {
            this.setLoading(false);
        }
    }

    showFeedback(message, type) {
        this.feedback.className = `alert alert-${type}`;
        this.feedback.textContent = message;
        this.feedback.classList.remove('d-none');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.feedback.classList.add('d-none');
        }, 5000);
    }

    setLoading(loading) {
        this.submitBtn.disabled = loading;
        if (loading) {
            this.submitBtn.classList.add('btn-loading');
            this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Invio in corso...';
        } else {
            this.submitBtn.classList.remove('btn-loading');
            this.submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Invia Messaggio';
        }
    }

    clearValidation() {
        const inputs = this.form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });
    }
}

// Inizializza la classe quando il DOM è pronto
new ContactForm();