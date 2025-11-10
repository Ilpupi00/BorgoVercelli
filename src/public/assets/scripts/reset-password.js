class ResetPasswordPage {
    constructor() {
        this.token = window.location.pathname.split('/').pop(); // Estrae token dall'URL
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
        });
    }

    setupEventListeners() {
        const form = document.getElementById('resetForm');
        const toggleBtn = document.getElementById('togglePassword');
        const toggleConfirmBtn = document.getElementById('toggleConfirmPassword');
        const passwordField = document.getElementById('passwordInput');

        if (!form) return; // Se token scaduto, non ci sono elementi JS

        if (form) {
            form.addEventListener('submit', (event) => {
                this.handleResetPassword(event);
            });
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.togglePasswordVisibility('passwordInput');
            });
        }

        if (toggleConfirmBtn) {
            toggleConfirmBtn.addEventListener('click', () => {
                this.togglePasswordVisibility('confirmPasswordInput');
            });
        }

        if (passwordField) {
            passwordField.addEventListener('input', () => {
                this.updatePasswordStrength(passwordField.value);
            });
        }
    }

    async handleResetPassword(event) {
        event.preventDefault();
        const password = document.getElementById('passwordInput').value;
        const confirmPassword = document.getElementById('confirmPasswordInput').value;

        if (!this.isValidPassword(password)) {
            this.showError('La password non soddisfa i requisiti di sicurezza.');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Le password non coincidono.');
            return;
        }

        // Invece di fetch, aggiungi il token al form e submit
        const form = document.getElementById('resetForm');
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token';
        tokenInput.value = this.token;
        form.appendChild(tokenInput);
        form.method = 'POST';
        form.action = '/reset-password';
        form.submit();
    }

    showSuccess() {
        ShowModal.showModalSuccess('Password aggiornata', 'Password cambiata con successo!');
        // Redirect immediato al login
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000); // 2 secondi per vedere il modal
    }

    showError(message) {
        const errorAlert = document.getElementById('errorAlert');
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorAlert.classList.remove('d-none');
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

    togglePasswordVisibility(fieldId) {
        const passwordField = document.getElementById(fieldId);
        const toggleBtn = passwordField.nextElementSibling; // Il bottone è il next sibling
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
}

// Inizializza la pagina
new ResetPasswordPage();