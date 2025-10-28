// OOP JavaScript for Team Management MVP

class NotificationManager {
    constructor() {
        this.successToast = new bootstrap.Toast(document.getElementById('successToast'));
        this.errorToast = new bootstrap.Toast(document.getElementById('errorToast'));
    }

    showSuccess(message) {
        document.getElementById('successToastBody').textContent = message;
        this.successToast.show();
    }

    showError(message) {
        document.getElementById('errorToastBody').textContent = message;
        this.errorToast.show();
    }
}

class LoadingManager {
    constructor() {
        this.overlay = document.getElementById('loadingOverlay');
    }

    show() {
        this.overlay.classList.add('show');
    }

    hide() {
        this.overlay.classList.remove('show');
    }
}

class TeamManager {
    constructor(notificationManager, loadingManager) {
        this.notificationManager = notificationManager;
        this.loadingManager = loadingManager;
        this.teamId = document.getElementById('teamId')?.value || this.extractTeamIdFromUrl();
        this.teamForm = document.getElementById('squadraForm');
        this.saveBtn = document.getElementById('salvaSquadra');
        this.deleteBtn = document.getElementById('deleteTeamBtn');
        this.logoUpload = document.getElementById('fotoSquadra');

        this.init();
    }

    extractTeamIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1];
    }

    init() {
        if (this.teamForm) {
            this.teamForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        if (this.deleteBtn) {
            this.deleteBtn.addEventListener('click', () => this.showDeleteConfirmation());
        }
        if (this.logoUpload) {
            this.logoUpload.addEventListener('change', (e) => this.validateLogo(e));
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData();
        formData.append('nome', document.getElementById('nome').value);
        formData.append('anno', document.getElementById('annoFondazione').value);

        if (this.logoUpload.files[0]) {
            formData.append('logo', this.logoUpload.files[0]);
        }

        this.loadingManager.show();

        try {
            const response = await fetch(`/squadre/${this.teamId}`, {
                method: 'PUT',
                body: formData,
                credentials: 'same-origin'
            });

            const contentType = response.headers.get('content-type') || '';
            const result = contentType.includes('application/json') ? await response.json() : { success: false, error: await response.text() };

            if (response.ok && result.success) {
                this.notificationManager.showSuccess('Squadra aggiornata con successo!');
                setTimeout(() => location.reload(), 1500);
            } else {
                throw new Error(result.error || 'Errore durante l\'aggiornamento');
            }
        } catch (error) {
            console.error('Errore:', error);
            this.notificationManager.showError(error.message || 'Errore durante l\'aggiornamento della squadra');
        } finally {
            this.loadingManager.hide();
        }
    }

    showDeleteConfirmation() {
        const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        modal.show();
    }

    async confirmDelete() {
        this.loadingManager.show();

        try {
            const response = await fetch(`/squadre/${this.teamId}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });

            const contentType = response.headers.get('content-type') || '';
            const result = contentType.includes('application/json') ? await response.json() : { success: false, error: await response.text() };

            if (response.ok && result.success) {
                this.notificationManager.showSuccess('Squadra eliminata con successo!');
                setTimeout(() => window.location.href = '/admin/gestione-squadre', 1500);
            } else {
                throw new Error(result.error || 'Errore durante l\'eliminazione');
            }
        } catch (error) {
            console.error('Errore:', error);
            this.notificationManager.showError(error.message || 'Errore durante l\'eliminazione della squadra');
        } finally {
            this.loadingManager.hide();
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
            if (modal) modal.hide();
        }
    }

    validateLogo(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                this.notificationManager.showError('Il file è troppo grande. Dimensione massima: 5MB');
                e.target.value = '';
                return;
            }
            if (!file.type.startsWith('image/')) {
                this.notificationManager.showError('Seleziona un file immagine valido');
                e.target.value = '';
                return;
            }
            this.notificationManager.showSuccess('Logo selezionato con successo');
            // mostra anteprima
            try {
                const preview = document.getElementById('logoPreview');
                const container = document.getElementById('logoPreviewContainer');
                const current = document.getElementById('currentLogo');
                const placeholder = document.getElementById('noLogoPlaceholder');
                if (preview && container) {
                    preview.src = URL.createObjectURL(file);
                    container.style.display = 'block';
                    if (current) current.style.display = 'none';
                    if (placeholder) placeholder.style.display = 'none';
                }
            } catch (err) {
                console.warn('Impossibile creare anteprima logo:', err);
            }
        }
    }

    // opzionale: pulisce anteprima logo
    clearLogoPreview() {
        const preview = document.getElementById('logoPreview');
        const container = document.getElementById('logoPreviewContainer');
        const current = document.getElementById('currentLogo');
        const placeholder = document.getElementById('noLogoPlaceholder');
        if (preview) preview.src = '';
        if (container) container.style.display = 'none';
        if (current) current.style.display = '';
        if (placeholder) placeholder.style.display = '';
    }
}

class PlayerManager {
    constructor(notificationManager, loadingManager) {
        this.notificationManager = notificationManager;
        this.loadingManager = loadingManager;
        this.teamId = document.getElementById('teamId')?.value || this.extractTeamIdFromUrl();
        this.playersList = document.getElementById('playersList');
        const modalGiocatoreEl = document.getElementById('modalGiocatore');
        this.playerModal = modalGiocatoreEl ? new bootstrap.Modal(modalGiocatoreEl) : null;
        this.playerModalEl = modalGiocatoreEl;
        this.playerForm = document.getElementById('giocatoreForm');
        this.playerIdInput = document.getElementById('giocatoreId');
        this.saveButton = document.getElementById('salvaGiocatore');
        this.deleteButton = document.getElementById('eliminaGiocatore');

        this.init();
    }

    extractTeamIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1];
    }

    init() {
        if (this.playersList) {
            this.playersList.addEventListener('click', (e) => this.handlePlayerAction(e));
        }

        // Salvataggio (usiamo lo stesso modal per add/edit)
        if (this.saveButton && this.playerForm) {
            this.saveButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.savePlayer();
            });
        }

        // Eliminazione dal modal
        if (this.deleteButton) {
            this.deleteButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.deletePlayerFromModal();
            });
        }

        // Quando il modal si apre, se non abbiamo un id lo consideriamo ADD e puliamo il form
        if (this.playerModalEl) {
            this.playerModalEl.addEventListener('show.bs.modal', () => {
                if (!this.playerIdInput || !this.playerIdInput.value) {
                    this.playerForm.reset();
                    if (this.deleteButton) this.deleteButton.style.display = 'none';
                }
            });
        }

        // Se l'utente clicca il pulsante 'Nuovo Giocatore' (markup con data-bs-target), pulisci il form
        const newPlayerTrigger = document.querySelector('[data-bs-target="#modalGiocatore"]');
        if (newPlayerTrigger) {
            newPlayerTrigger.addEventListener('click', () => {
                if (this.playerIdInput) this.playerIdInput.value = '';
                if (this.playerForm) this.playerForm.reset();
                if (this.deleteButton) this.deleteButton.style.display = 'none';
            });
        }

        // Anteprima foto giocatore nel modal
        const fotoInput = document.getElementById('fotoGiocatore');
        const playerPreview = document.getElementById('playerPhotoPreview');
        const playerPreviewContainer = document.getElementById('playerPhotoPreviewContainer');
        if (fotoInput) {
            fotoInput.addEventListener('change', (ev) => {
                const f = ev.target.files[0];
                if (!f) {
                    if (playerPreview) playerPreview.src = '';
                    if (playerPreviewContainer) playerPreviewContainer.style.display = 'none';
                    return;
                }
                if (!f.type.startsWith('image/')) {
                    this.notificationManager.showError('Seleziona un file immagine valido');
                    ev.target.value = '';
                    return;
                }
                if (f.size > 5 * 1024 * 1024) {
                    this.notificationManager.showError('Il file è troppo grande. Massimo 5MB');
                    ev.target.value = '';
                    return;
                }
                try {
                    if (playerPreview) playerPreview.src = URL.createObjectURL(f);
                    if (playerPreviewContainer) playerPreviewContainer.style.display = 'block';
                } catch (err) {
                    console.warn('Impossibile creare anteprima foto giocatore', err);
                }
            });
        }

    }

    handlePlayerAction(e) {
        const target = e.target.closest('button');
        if (!target) return;

        const playerCard = target.closest('.player-card');
        const playerId = target.dataset.id || (playerCard ? playerCard.dataset.playerId : null);

        if (target.classList.contains('modifica-giocatore')) {
            this.openEditModal(playerId);
        } else if (target.classList.contains('elimina-giocatore')) {
            this.removePlayer(playerId);
        }
    }

    async addPlayer() {
        // Manteniamo per compatibilità ma preferiamo savePlayer()
        return this.savePlayer();
    }

    async handleAddPlayer(e) {
        // kept for backward compat with old markup; forwards to addPlayer
        e.preventDefault();
        await this.addPlayer();
    }

    openEditModal(playerId) {
        // Populate edit form with player data from data-attributes
        const playerCard = document.querySelector(`[data-player-id="${playerId}"]`);
        if (!playerCard) return;

        const nome = playerCard.dataset.nome || '';
        const cognome = playerCard.dataset.cognome || '';
        const ruolo = playerCard.dataset.ruolo || '';
        const numero = playerCard.dataset.numero || '';
        const dataNascita = playerCard.dataset.data_nascita || '';
        const nazionalita = playerCard.dataset.nazionalita || '';

        if (this.playerIdInput) this.playerIdInput.value = playerId;
        if (document.getElementById('giocatoreNome')) document.getElementById('giocatoreNome').value = nome;
        if (document.getElementById('giocatoreCognome')) document.getElementById('giocatoreCognome').value = cognome;
        if (document.getElementById('giocatoreRuolo')) document.getElementById('giocatoreRuolo').value = ruolo;
        if (document.getElementById('numeroMaglia')) document.getElementById('numeroMaglia').value = numero;
        if (document.getElementById('dataNascita')) document.getElementById('dataNascita').value = dataNascita;
        if (document.getElementById('nazionalita')) document.getElementById('nazionalita').value = nazionalita;

        if (this.deleteButton) this.deleteButton.style.display = 'inline-block';
        // mostra anteprima se disponibile
        try {
            const imgUrl = playerCard.dataset.img || '';
            const playerPreview = document.getElementById('playerPhotoPreview');
            const playerPreviewContainer = document.getElementById('playerPhotoPreviewContainer');
            if (imgUrl && playerPreview && playerPreviewContainer) {
                playerPreview.src = imgUrl;
                playerPreviewContainer.style.display = 'block';
            } else if (playerPreview && playerPreviewContainer) {
                playerPreview.src = '';
                playerPreviewContainer.style.display = 'none';
            }
        } catch (err) {
            console.warn('Errore nel mostrare anteprima giocatore:', err);
        }

        if (this.playerModal) this.playerModal.show();
    }

    async handleEditPlayer(e) {
        // legacy shim: edit flow is handled by savePlayer()
        e.preventDefault();
        await this.savePlayer();
    }

    async removePlayer(playerId) {
        if (!confirm('Sei sicuro di voler rimuovere questo giocatore dalla squadra?')) {
            return;
        }

        this.loadingManager.show();

        try {
            const response = await fetch(`/squadre/${this.teamId}/giocatori/${playerId}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });

            const contentType = response.headers.get('content-type') || '';
            const result = contentType.includes('application/json') ? await response.json() : { success: false, error: await response.text() };

            if (response.ok && result.success) {
                this.notificationManager.showSuccess('Giocatore rimosso con successo!');
                document.querySelector(`[data-player-id="${playerId}"]`).remove();
            } else {
                throw new Error(result.error || 'Errore durante la rimozione del giocatore');
            }
        } catch (error) {
            console.error('Errore:', error);
            this.notificationManager.showError(error.message || 'Errore durante la rimozione del giocatore');
        } finally {
            this.loadingManager.hide();
        }
    }

    async savePlayer() {
        if (!this.playerForm) return;

        const formData = new FormData(this.playerForm);
        const playerId = this.playerIdInput && this.playerIdInput.value ? this.playerIdInput.value : null;

        this.loadingManager.show();

        try {
            const url = playerId ? `/squadre/${this.teamId}/giocatori/${playerId}` : `/squadre/${this.teamId}/giocatori`;
            const method = playerId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                body: formData,
                credentials: 'same-origin'
            });

            const contentType = response.headers.get('content-type') || '';
            const result = contentType.includes('application/json') ? await response.json() : { success: false, error: await response.text() };

            if (response.ok && result.success) {
                const msg = playerId ? 'Giocatore aggiornato con successo!' : 'Giocatore aggiunto con successo!';
                this.notificationManager.showSuccess(msg);
                if (this.playerModal) this.playerModal.hide();
                this.playerForm.reset();
                setTimeout(() => location.reload(), 800);
            } else {
                throw new Error(result.error || 'Errore durante il salvataggio del giocatore');
            }
        } catch (error) {
            console.error('Errore:', error);
            this.notificationManager.showError(error.message || 'Errore durante il salvataggio del giocatore');
        } finally {
            this.loadingManager.hide();
        }
    }

    async deletePlayerFromModal() {
        const playerId = this.playerIdInput && this.playerIdInput.value ? this.playerIdInput.value : null;
        if (!playerId) return;

        if (!confirm('Sei sicuro di voler eliminare questo giocatore?')) return;

        this.loadingManager.show();
        try {
            const response = await fetch(`/squadre/${this.teamId}/giocatori/${playerId}`, { method: 'DELETE', credentials: 'same-origin' });
            const contentType = response.headers.get('content-type') || '';
            const result = contentType.includes('application/json') ? await response.json() : { success: false, error: await response.text() };

            if (response.ok && result.success) {
                this.notificationManager.showSuccess('Giocatore eliminato');
                const el = document.querySelector(`[data-player-id="${playerId}"]`);
                if (el) el.remove();
                if (this.playerModal) this.playerModal.hide();
            } else {
                throw new Error(result.error || 'Errore durante l\'eliminazione');
            }
        } catch (err) {
            console.error(err);
            this.notificationManager.showError(err.message || 'Errore durante l\'eliminazione');
        } finally {
            this.loadingManager.hide();
        }
    }
}

class ManagerManager {
    constructor(notificationManager, loadingManager) {
        this.notificationManager = notificationManager;
        this.loadingManager = loadingManager;
        this.teamId = document.getElementById('teamId').value;
        this.managersList = document.getElementById('dirigentiList');
        const modalDirigenteEl = document.getElementById('modalDirigente');
        this.addManagerModal = modalDirigenteEl ? new bootstrap.Modal(modalDirigenteEl) : null;
        this.managerSearch = document.getElementById('searchUtente');
        this.managerSuggestions = document.getElementById('utentiResults');

        this.selectedUserId = null;
        this.searchTimeout = null;

        this.init();
    }

    init() {
        if (this.managersList) {
            this.managersList.addEventListener('click', (e) => this.handleManagerAction(e));
        }
        if (this.managerSearch) {
            this.managerSearch.addEventListener('input', (e) => this.handleSearchInput(e));
            this.managerSearch.addEventListener('keydown', (e) => this.handleSearchKeydown(e));
        }
        const salvaDirigenteBtn = document.getElementById('salvaDirigente');
        if (salvaDirigenteBtn) {
            salvaDirigenteBtn.addEventListener('click', () => this.addManager());
        }
    }

    handleManagerAction(e) {
        const target = e.target.closest('button');
        if (!target) return;

        const managerCard = target.closest('.manager-card');
        const managerId = managerCard.dataset.managerId;

        if (target.classList.contains('remove-manager-btn')) {
            this.removeManager(managerId);
        }
    }

    handleSearchInput(e) {
        const query = e.target.value.trim();

        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        if (query.length < 2) {
            this.managerSuggestions.innerHTML = '';
            this.resetManagerForm();
            return;
        }

        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.searchUsers(query);
        }, 300);
    }

    handleSearchKeydown(e) {
        if (e.key === 'Escape') {
            this.managerSuggestions.innerHTML = '';
            this.resetManagerForm();
        }
    }

    async searchUsers(query) {
        try {
            const response = await fetch(`/api/search-users?q=${encodeURIComponent(query)}&role=dirigente`, { credentials: 'same-origin' });
            const contentType = response.headers.get('content-type') || '';
            const data = contentType.includes('application/json') ? await response.json() : { users: [] };

            if (response.ok && data.users) {
                this.displaySuggestions(data.users);
            } else {
                this.managerSuggestions.innerHTML = '<div class="p-3 text-muted">Nessun utente trovato</div>';
            }
        } catch (error) {
            console.error('Errore ricerca utenti:', error);
            this.managerSuggestions.innerHTML = '<div class="p-3 text-danger">Errore durante la ricerca</div>';
        }
    }

    displaySuggestions(users) {
        this.managerSuggestions.innerHTML = '';

        users.forEach((user, index) => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.dataset.userId = user.id;
            suggestionItem.onclick = () => this.selectUser(user);

            suggestionItem.innerHTML = `
                <div class="suggestion-avatar">
                    ${user.nome.charAt(0)}${user.cognome.charAt(0)}
                </div>
                <div class="suggestion-info">
                    <div class="suggestion-name">${user.nome} ${user.cognome}</div>
                    <div class="suggestion-email">${user.email}</div>
                    <span class="suggestion-role">${user.tipo_utente_nome || 'Utente'}</span>
                </div>
            `;

            this.managerSuggestions.appendChild(suggestionItem);
        });
    }

    selectUser(user) {
        this.selectedUserId = user.id;
        // Popola i campi del form con i dati dell'utente selezionato
        document.getElementById('dirigenteRuolo').focus();
        this.managerSuggestions.innerHTML = '';
        this.managerSearch.value = `${user.nome} ${user.cognome}`;
        this.managerSearch.disabled = true;
        
        // Salva anche in un campo nascosto (se presente)
        const sel = document.getElementById('selectedUtenteId');
        if (sel) sel.value = user.id;

        // Abilita il pulsante salva
        document.getElementById('salvaDirigente').disabled = false;
    }

    async addManager() {
        if (!this.selectedUserId) {
            this.notificationManager.showError('Seleziona un utente prima di aggiungere');
            return;
        }

        const ruolo = document.getElementById('dirigenteRuolo').value;
        if (!ruolo) {
            this.notificationManager.showError('Seleziona un ruolo dirigenziale');
            return;
        }

        this.loadingManager.show();

        try {
            const response = await fetch(`/squadre/${this.teamId}/dirigenti`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({ 
                    userId: this.selectedUserId,
                    ruolo: ruolo,
                    data_nomina: document.getElementById('dataNomina').value,
                    data_scadenza: document.getElementById('dataScadenza').value
                })
            });

            const contentType = response.headers.get('content-type') || '';
            const result = contentType.includes('application/json') ? await response.json() : { success: false, error: await response.text() };

            if (response.ok && result.success) {
                this.notificationManager.showSuccess('Dirigente aggiunto con successo!');
                if (this.addManagerModal) this.addManagerModal.hide();
                this.resetManagerForm();
                setTimeout(() => location.reload(), 1500);
            } else {
                throw new Error(result.error || 'Errore durante l\'aggiunta del dirigente');
            }
        } catch (error) {
            console.error('Errore:', error);
            this.notificationManager.showError(error.message || 'Errore durante l\'aggiunta del dirigente');
        } finally {
            this.loadingManager.hide();
        }
    }

    resetManagerForm() {
        this.selectedUserId = null;
        this.managerSearch.value = '';
        this.managerSearch.disabled = false;
        document.getElementById('dirigenteRuolo').value = '';
        document.getElementById('dataNomina').value = '';
        document.getElementById('dataScadenza').value = '';
        document.getElementById('salvaDirigente').disabled = true;
        const sel = document.getElementById('selectedUtenteId');
        if (sel) sel.value = '';
    }

    async removeManager(managerId) {
        if (!confirm('Sei sicuro di voler rimuovere questo dirigente dalla squadra?')) {
            return;
        }

        this.loadingManager.show();

        try {
            const response = await fetch(`/squadre/${this.teamId}/dirigenti/${managerId}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });

            const contentType = response.headers.get('content-type') || '';
            const result = contentType.includes('application/json') ? await response.json() : { success: false, error: await response.text() };

            if (response.ok && result.success) {
                this.notificationManager.showSuccess('Dirigente rimosso con successo!');
                document.querySelector(`[data-manager-id="${managerId}"]`).remove();
            } else {
                throw new Error(result.error || 'Errore durante la rimozione del dirigente');
            }
        } catch (error) {
            console.error('Errore:', error);
            this.notificationManager.showError(error.message || 'Errore durante la rimozione del dirigente');
        } finally {
            this.loadingManager.hide();
        }
    }
}

// Global functions for modal buttons
function addPlayer() {
    if (window.teamApp && window.teamApp.playerManager) {
        window.teamApp.playerManager.addPlayer();
    }
}

function updatePlayer() {
    if (window.teamApp && window.teamApp.playerManager) {
        window.teamApp.playerManager.handleEditPlayer(new Event('submit'));
    }
}

function addManager() {
    if (window.teamApp && window.teamApp.managerManager) {
        window.teamApp.managerManager.addManager();
    }
}

function confirmDelete() {
    if (window.teamApp && window.teamApp.teamManager) {
        window.teamApp.teamManager.confirmDelete();
    }
}

// Main Application Class
class TeamManagementApp {
    constructor() {
        this.notificationManager = new NotificationManager();
        this.loadingManager = new LoadingManager();
        this.teamManager = new TeamManager(this.notificationManager, this.loadingManager);
        this.playerManager = new PlayerManager(this.notificationManager, this.loadingManager);
        this.managerManager = new ManagerManager(this.notificationManager, this.loadingManager);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // create a back button (X) that returns to previous page with fallbacks
    createBackButton();

    window.teamApp = new TeamManagementApp();
});


/**
 * Create a small 'X' back button in the top-left corner.
 * Uses history.back() when possible, falls back to document.referrer or /homepage.
 */
/**
 * Create a small 'X' back button in the top-left corner.
 * Uses history.back() when possible, falls back to document.referrer or /homepage.
 */
function createBackButton() {
    try {
        // don't duplicate
        if (document.getElementById('backButton')) return;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'backButton';
        btn.className = 'btn position-fixed top-0 start-0 m-3 d-flex align-items-center justify-content-center';
        btn.setAttribute('aria-label', 'Torna indietro');
        btn.style.zIndex = '1060';
    // make the icon black so it's visible on light backgrounds
    btn.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true" style="color: black; font-size: 1.25rem;"></i>';

        // Click handler with fallbacks
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            try {
                if (window.history && window.history.length > 1) {
                    window.history.back();
                } else if (document.referrer) {
                    window.location = document.referrer;
                } else {
                    window.location = '/homepage';
                }
            } catch (err) {
                window.location = document.referrer || '/homepage';
            }
        });

        // Keyboard accessibility: Enter/Space
        btn.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                btn.click();
            }
        });

        document.body.appendChild(btn);
    } catch (err) {
        console.warn('Impossibile creare il pulsante back:', err);
    }
}