class RegistrazionePage {
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
        const closeBtn = document.getElementById('closeRegister');

        if (form) {
            form.addEventListener('submit', (event) => {
                this.handleRegistration(event);
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.handleClose();
            });
        }
    }

    async handleRegistration(event) {
        event.preventDefault();
        if (document.getElementById('registerPassword').value !== document.getElementById('confirmPassword').value) {
            alert('Le password non corrispondono. Riprova.');
            return;
        }
        try {
            const response = await fetch('/registrazione', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: document.getElementById('registerEmail').value,
                    password: document.getElementById('registerPassword').value,
                    nome: document.getElementById('registerName').value,
                    cognome: document.getElementById('registerSurname').value,
                    telefono: ""
                })
            });
            if (response.ok) {
                window.location.href = '/login';
            } else {
                alert('Registrazione fallita. Riprova.');
            }
        } catch (error) {
            console.error('Errore durante la registrazione:', error);
            alert('Si è verificato un errore durante la registrazione. Riprova più tardi.');
        }
    }

    handleClose() {
        window.location.href = '/homepage';
    }
}

// Inizializza la pagina di registrazione
new RegistrazionePage();