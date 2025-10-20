class LoginPage {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
        });
    }

    setupEventListeners() {
        const form = document.getElementById('authForm');
        const closeBtn = document.getElementById('closeLogin');
        const togglePasswordBtn = document.getElementById('togglePassword');

        if (form) {
            form.addEventListener('submit', (event) => {
                this.handleLogin(event);
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.handleClose();
            });
        }

        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', () => {
                this.togglePasswordVisibility();
            });
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById('exampleInputEmail1').value;
        const password = document.getElementById('exampleInputPassword1').value;
        try {
            const res = await fetch('/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) {
                window.location.href = '/homepage';
            } else {
                this.showError('Email o password errate. Riprova.');
            }
        } catch (error) {
            this.showError('Errore di connessione. Riprova più tardi.');
        }
    }

    showError(message) {
        const errorAlert = document.getElementById('errorAlert');
        const errorMessage = document.getElementById('errorMessage');
        const passwordField = document.getElementById('exampleInputPassword1');
        errorMessage.textContent = message;
        errorAlert.classList.remove('d-none');
        // Resetta il campo password
        passwordField.value = '';
        // Nasconde l'alert dopo 5 secondi
        setTimeout(() => {
            errorAlert.classList.add('d-none');
        }, 5000);
    }

    togglePasswordVisibility() {
        const passwordField = document.getElementById('exampleInputPassword1');
        const toggleBtn = document.getElementById('togglePassword');
        const icon = toggleBtn.querySelector('i');
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            icon.classList.remove('bi-eye');
            icon.classList.add('bi-eye-slash');
        } else {
            passwordField.type = 'password';
            icon.classList.remove('bi-eye-slash');
            icon.classList.add('bi-eye');
        }
    }

    handleClose() {
        window.location.href = '/homepage';
    }
}

// Inizializza la pagina di login
new LoginPage();