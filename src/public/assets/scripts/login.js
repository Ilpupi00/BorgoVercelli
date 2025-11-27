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
        const remember = document.getElementById('rememberMe').checked;
        try {
            const res = await fetch('/session', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, remember })
            });
            if (res.ok) {
                const data = await res.json();
                
                // Mostra richiesta notifiche push dopo login
                    if (data.showNotificationPrompt) {
                        // Imposta una flag temporanea per mostrare il prompt dopo il redirect
                        // in modo da garantire che il cookie di sessione sia stato applicato.
                        try {
                            sessionStorage.setItem('showPushPrompt', '1');
                        } catch (e) {
                            console.warn('Impossibile accedere a sessionStorage:', e);
                        }
                        window.location.href = '/homepage';
                    } else {
                        window.location.href = '/homepage';
                    }
            } else {
                const data = await res.json();
                
                // Gestione account bannato
                if (data.type === 'banned') {
                    this.showError(data.message || 'Il tuo account è stato bannato permanentemente.');
                } 
                // Gestione account sospeso
                else if (data.type === 'suspended') {
                    const msg = data.message || `Il tuo account è sospeso fino al ${data.dataFine || 'data non specificata'}. Motivo: ${data.motivo || 'Non specificato'}`;
                    this.showError(msg);
                } 
                // Errore generico
                else {
                    this.showError(data.error || 'Email o password errate. Riprova.');
                }
            }
        } catch (error) {
            this.showError('Errore di connessione. Riprova più tardi.');
        }
    }

    async showNotificationPrompt() {
        // Verifica supporto notifiche
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            // Browser non supporta notifiche, vai alla homepage
            window.location.href = '/homepage';
            return;
        }

        // Se già concesso o negato, vai alla homepage
        if (Notification.permission === 'granted') {
            // Sottoscrivi in background
            if (window.initPushNotifications) {
                window.initPushNotifications().catch(() => {});
            }
            window.location.href = '/homepage';
            return;
        }

        if (Notification.permission === 'denied') {
            window.location.href = '/homepage';
            return;
        }

        // Mostra modal di richiesta personalizzata
        const modalHtml = `
            <div class="modal fade" id="notificationModal" tabindex="-1" aria-labelledby="notificationModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header border-0">
                            <h5 class="modal-title fw-bold" id="notificationModalLabel">
                                <i class="bi bi-bell-fill text-primary me-2"></i>Abilita le Notifiche
                            </h5>
                        </div>
                        <div class="modal-body text-center py-4">
                            <div class="mb-3">
                                <i class="bi bi-calendar-check display-1 text-primary"></i>
                            </div>
                            <h6 class="mb-3">Resta aggiornato sulle tue prenotazioni!</h6>
                            <p class="text-muted mb-0">
                                Riceverai notifiche quando:
                            </p>
                            <ul class="list-unstyled mt-3">
                                <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>Una prenotazione viene confermata</li>
                                <li class="mb-2"><i class="bi bi-x-circle-fill text-danger me-2"></i>Una prenotazione viene annullata</li>
                                <li class="mb-2"><i class="bi bi-bell-fill text-info me-2"></i>Nuove comunicazioni importanti</li>
                            </ul>
                        </div>
                        <div class="modal-footer border-0 d-flex gap-2">
                            <button type="button" class="btn btn-outline-secondary flex-fill" id="skipNotifications">
                                Più tardi
                            </button>
                            <button type="button" class="btn btn-primary flex-fill" id="enableNotifications">
                                Abilita
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Aggiungi modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = new bootstrap.Modal(document.getElementById('notificationModal'));
        const enableBtn = document.getElementById('enableNotifications');
        const skipBtn = document.getElementById('skipNotifications');

        enableBtn.addEventListener('click', async () => {
            modal.hide();
            try {
                // Inizializza notifiche push
                if (window.initPushNotifications) {
                    await window.initPushNotifications();
                }
            } catch (err) {
                console.error('Errore attivazione notifiche:', err);
            } finally {
                window.location.href = '/homepage';
            }
        });

        skipBtn.addEventListener('click', () => {
            modal.hide();
            window.location.href = '/homepage';
        });

        // Rimuovi modal dal DOM quando viene chiuso
        document.getElementById('notificationModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

        modal.show();
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