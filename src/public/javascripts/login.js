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
                alert('Credenziali non valide');
            }
        } catch (error) {
            alert('Errore di login');
        }
    }

    handleClose() {
        window.location.href = '/homepage';
    }
}

// Inizializza la pagina di login
new LoginPage();