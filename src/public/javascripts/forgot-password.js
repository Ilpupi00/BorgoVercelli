class ForgotPasswordPage {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
        });
    }

    setupEventListeners() {
        const form = document.getElementById('forgotForm');
        const closeBtn = document.getElementById('closeForgot');

        if (form) {
            form.addEventListener('submit', (event) => {
                this.handleForgotPassword(event);
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.handleClose();
            });
        }
    }

    async handleForgotPassword(event) {
        event.preventDefault();
        const email = document.getElementById('emailInput').value;

        try {
            const res = await fetch('/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (res.ok) {
                this.showSuccess();
            } else {
                const errorData = await res.json();
                this.showError(errorData.error || 'Errore durante la richiesta.');
            }
        } catch (error) {
            this.showError('Errore di connessione. Riprova più tardi.');
        }
    }

    showSuccess() {
        const successAlert = document.getElementById('successAlert');
        const errorAlert = document.getElementById('errorAlert');
        successAlert.classList.remove('d-none');
        errorAlert.classList.add('d-none');
    }

    showError(message) {
        const errorAlert = document.getElementById('errorAlert');
        const errorMessage = document.getElementById('errorMessage');
        const successAlert = document.getElementById('successAlert');
        errorMessage.textContent = message;
        errorAlert.classList.remove('d-none');
        successAlert.classList.add('d-none');
    }

    handleClose() {
        window.location.href = '/homepage';
    }
}

// Inizializza la pagina
new ForgotPasswordPage();