import ShowModal from './utils/showModal.js';

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
        const passwordField = document.getElementById('registerPassword');
        const confirmPasswordField = document.getElementById('confirmPassword');
        const togglePasswordBtn = document.getElementById('togglePassword');
        const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');

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

        // Nasconde il messaggio di errore quando l'utente cambia i campi password
        if (passwordField) {
            passwordField.addEventListener('input', () => {
                document.getElementById('passwordError').style.display = 'none';
                this.updatePasswordStrength(passwordField.value);
            });
        }
        if (confirmPasswordField) {
            confirmPasswordField.addEventListener('input', () => {
                document.getElementById('passwordError').style.display = 'none';
            });
        }

        // Toggle visibilità password
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', () => {
                this.togglePasswordVisibility(passwordField, togglePasswordBtn);
            });
        }
        if (toggleConfirmPasswordBtn) {
            toggleConfirmPasswordBtn.addEventListener('click', () => {
                this.togglePasswordVisibility(confirmPasswordField, toggleConfirmPasswordBtn);
            });
        }
    }

    async handleRegistration(event) {
        event.preventDefault();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!this.isValidPassword(password)) {
            this.showPasswordError('La password non soddisfa i requisiti di sicurezza.');
            return;
        }

        if (password !== confirmPassword) {
            const errorDiv = document.getElementById('passwordError');
            errorDiv.style.display = 'block';
            document.getElementById('registerPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            document.getElementById('registerPassword').focus();
            return;
        }
        try {
            const response = await fetch('/registrazione', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: document.getElementById('registerEmail').value,
                    password: password,
                    nome: document.getElementById('registerName').value,
                    cognome: document.getElementById('registerSurname').value,
                    telefono: ""
                })
            });
            if (response.ok) {
                window.location.href = '/login';
            } else {
                const errorData = await response.json();
                if (errorData.error === 'Email già registrata') {
                    ShowModal.showModalError('L\'email inserita è già registrata. Prova con un\'altra email.', 'Email già registrata');
                } else {
                    alert('Registrazione fallita. Riprova.');
                }
            }
        } catch (error) {
            console.error('Errore durante la registrazione:', error);
            alert('Si è verificato un errore durante la registrazione. Riprova più tardi.');
        }
    }

    handleClose() {
        window.location.href = '/homepage';
    }

    isValidPassword(password) {
        const minLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        return minLength && hasUpperCase && hasNumber;
    }

    updatePasswordStrength(password) {
        const strengthBar = document.getElementById('strengthBar');
        const strengthText = document.getElementById('strengthText');

        // Aggiorna requisiti
        const hasLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);

        this.updateRequirement('reqLength', hasLength);
        this.updateRequirement('reqUpper', hasUpper);
        this.updateRequirement('reqNumber', hasNumber);

        if (password.length === 0) {
            strengthBar.style.width = '0%';
            strengthText.textContent = '';
            return;
        }

        let score = 0;
        if (hasLength) score++;
        if (hasUpper) score++;
        if (/[a-z]/.test(password)) score++;
        if (hasNumber) score++;
        if (/[^A-Za-z\d]/.test(password)) score++;

        let width, text, color;
        if (score <= 2) {
            width = '33%';
            text = 'Debole';
            color = 'bg-danger';
        } else if (score <= 4) {
            width = '66%';
            text = 'Media';
            color = 'bg-warning';
        } else {
            width = '100%';
            text = 'Forte';
            color = 'bg-success';
        }

        strengthBar.style.width = width;
        strengthBar.className = `progress-bar ${color}`;
        strengthText.textContent = text;
    }

    updateRequirement(reqId, satisfied) {
        const li = document.getElementById(reqId);
        const icon = li.querySelector('i');
        if (satisfied) {
            icon.className = 'bi bi-check-circle-fill text-success';
        } else {
            icon.className = 'bi bi-circle text-muted';
        }
    }

    showPasswordError(message) {
        const errorDiv = document.getElementById('passwordError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        document.getElementById('registerPassword').focus();
    }

    togglePasswordVisibility(field, button) {
        const type = field.getAttribute('type') === 'password' ? 'text' : 'password';
        field.setAttribute('type', type);
        const icon = button.querySelector('i');
        icon.className = type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
    }
}

// Inizializza la pagina di registrazione
new RegistrazionePage();