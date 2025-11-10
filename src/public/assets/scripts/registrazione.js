import ShowModal from './utils/showModal.js';

class RegistrazionePage {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.setupPrivacyOverlay();
        });
    }

    setupEventListeners() {
        const form = document.getElementById('authForm');
        const closeBtn = document.getElementById('closeRegister');
        const passwordField = document.getElementById('registerPassword');
        const confirmPasswordField = document.getElementById('confirmPassword');
        const togglePasswordBtn = document.getElementById('togglePassword');
        const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
        const privacyCheckbox = document.getElementById('privacy_accept');

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

        // Gestisci il checkbox privacy
        if (privacyCheckbox) {
            // Controlla se è già stato accettato
            const privacyAccepted = localStorage.getItem('privacyAccepted');
            if (privacyAccepted === 'true') {
                privacyCheckbox.checked = true;
                privacyCheckbox.disabled = true; // Impedisci di deselezionarlo
            }
            
            // Salva lo stato quando viene cambiato (solo se non è disabilitato)
            privacyCheckbox.addEventListener('change', () => {
                if (!privacyCheckbox.disabled) {
                    if (privacyCheckbox.checked) {
                        localStorage.setItem('privacyAccepted', 'true');
                        privacyCheckbox.disabled = true; // Una volta accettato, non può più essere deselezionato
                    } else {
                        localStorage.removeItem('privacyAccepted');
                    }
                } else if (!privacyCheckbox.checked) {
                    // Se prova a deselezionarlo quando è disabilitato, riselezionalo
                    privacyCheckbox.checked = true;
                    ShowModal.showModalInfo('Hai già accettato la Privacy Policy. Non puoi deselezionarla.', 'Attenzione');
                }
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

    setupPrivacyOverlay() {
        const overlay = document.getElementById('privacyOverlay');
        const acceptBtn = document.getElementById('acceptPrivacyBtn');
        
        if (!overlay || !acceptBtn) return;
        
        // Controlla se l'utente ha già accettato la privacy (localStorage)
        const privacyAccepted = localStorage.getItem('privacyAccepted');
        
        if (privacyAccepted === 'true') {
            overlay.style.display = 'none';
            return;
        }
        
        // Mostra l'overlay e impedisci lo scrolling
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Gestisci il click sul pulsante accetta
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('privacyAccepted', 'true');
            overlay.style.display = 'none';
            document.body.style.overflow = ''; // Ripristina lo scrolling
            
            // Seleziona e disabilita il checkbox nel form
            const privacyCheckbox = document.getElementById('privacy_accept');
            if (privacyCheckbox) {
                privacyCheckbox.checked = true;
                privacyCheckbox.disabled = true;
            }
            
            // Mostra un messaggio di conferma
            ShowModal.showModalInfo('Grazie per aver accettato la Privacy Policy. Ora puoi procedere con la registrazione.', 'Privacy Policy Accettata');
        });
        
        // Impedisci di chiudere l'overlay cliccando fuori
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        // Impedisci la chiusura con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.style.display !== 'none') {
                e.preventDefault();
            }
        });
        
        // Impedisci lo scrolling della pagina quando l'overlay è attivo
        const preventScroll = (e) => {
            if (overlay.style.display !== 'none') {
                e.preventDefault();
            }
        };
        
        document.addEventListener('wheel', preventScroll, { passive: false });
        document.addEventListener('touchmove', preventScroll, { passive: false });
        document.addEventListener('keydown', (e) => {
            if (overlay.style.display !== 'none' && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown' || e.key === 'Home' || e.key === 'End')) {
                e.preventDefault();
            }
        });
    }
}

// Inizializza la pagina di registrazione
new RegistrazionePage();