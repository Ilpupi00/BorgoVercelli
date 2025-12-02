class ContactForm {
    constructor() {
        // Do not query DOM here (script might be loaded before DOMContentLoaded in some pages)
        this.form = null;
        this.submitBtn = null;
        this.feedback = null;
        this.init();
    }

    init() {
        // Wait for both DOM and ShowModal to be ready
        const setup = () => {
            // Wait for ShowModal to be available (it's loaded from footer)
            if (typeof window.ShowModal === 'undefined') {
                setTimeout(setup, 50);
                return;
            }
            this.setupEventListeners();
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setup);
        } else {
            setup();
        }
    }

    setupEventListeners() {
        // Bind both forms if present
        const contactForm = document.getElementById('contactForm');
        // Setup main contact form only. Footer `emailForm` is handled by
        // `components/send_email.js` (setupEmailFormListener) to avoid
        // duplicate submit handlers that caused double emails and stuck UI.
        if (contactForm) {
            this.setupForm(contactForm, 'contactForm');
        }
    }

    setupForm(form, formId) {
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Ensure the form has a sensible fallback action/method in case JS fails to bind
        try {
            if (!form.getAttribute('action')) form.setAttribute('action', '/send-email');
            if (!form.getAttribute('method')) form.setAttribute('method', 'POST');
        } catch (e) {
            // ignore errors
        }

        // Attach submit handler
        form.addEventListener('submit', (event) => this.handleSubmit(event, form, submitBtn, formId));

        // Validazione in tempo reale
        const inputs = form.querySelectorAll('input, textarea');
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

    validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        return isValid;
    }

    async handleSubmit(event, form, submitBtn, formId) {
        event.preventDefault();

        if (!this.validateForm(form)) {
            this.showFeedback('Per favore, correggi gli errori nel form.', 'danger', formId);
            return;
        }

        this.setLoading(true, submitBtn);

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        console.log('[ContactForm] Sending data from ' + formId + ':', data);

        try {
            // Send to the contact endpoint that handles email sending
            const response = await fetch('/contatti', {
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
                    this.showFeedback('Messaggio inviato con successo! Ti risponderemo presto.', 'success', formId);
                }
                form.reset();
                this.clearValidation(form);
            } else {
                const errMsg = result && (result.error || (result.details && result.details.message)) ? (result.error || result.details.message) : 'Errore durante l\'invio del messaggio.';
                if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') {
                    try { window.ShowModal.showModalError(errMsg, 'Errore invio messaggio'); } catch (e) { /* ignore */ }
                } else {
                    this.showFeedback(errMsg, 'danger', formId);
                }
            }
        } catch (error) {
            console.error('Errore:', error);
            const errMsg = 'Errore di connessione. Riprova più tardi.';
            if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') {
                try { window.ShowModal.showModalError(errMsg, 'Errore invio messaggio'); } catch (e) { /* ignore */ }
            } else {
                this.showFeedback(errMsg, 'danger', formId);
            }
        } finally {
            this.setLoading(false, submitBtn);
        }
    }

    showFeedback(message, type, formId) {
        // Try to find feedback element near the form
        const feedback = document.getElementById('feedback');
        if (!feedback) return;
        
        feedback.className = `alert alert-${type}`;
        feedback.textContent = message;
        feedback.classList.remove('d-none');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            feedback.classList.add('d-none');
        }, 5000);
    }

    setLoading(loading, submitBtn) {
        if (!submitBtn) return;
        
        submitBtn.disabled = loading;
        if (loading) {
            submitBtn.classList.add('btn-loading');
            // Save original HTML if not saved yet
            if (!submitBtn.dataset.originalHtml) {
                submitBtn.dataset.originalHtml = submitBtn.innerHTML;
            }
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Invio in corso...';
        } else {
            submitBtn.classList.remove('btn-loading');
            // Restore original HTML if available
            if (submitBtn.dataset.originalHtml) {
                submitBtn.innerHTML = submitBtn.dataset.originalHtml;
            } else {
                submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Invia Messaggio';
            }
        }
    }

    clearValidation(form) {
        if (!form) return;
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });
    }
}

// Inizializza la classe quando il DOM è pronto
new ContactForm();