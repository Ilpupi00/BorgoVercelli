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
                body: formData
            });

            const result = await response.json();

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
                method: 'DELETE'
            });

            const result = await response.json();

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
        }
    }
}

class PlayerManager {
    constructor(notificationManager, loadingManager) {
        this.notificationManager = notificationManager;
        this.loadingManager = loadingManager;
        this.teamId = document.getElementById('teamId')?.value || this.extractTeamIdFromUrl();
        this.playersList = document.getElementById('playersList');
        const modalGiocatoreEl = document.getElementById('modalGiocatore');
        this.addPlayerModal = modalGiocatoreEl ? new bootstrap.Modal(modalGiocatoreEl) : null;
        this.editPlayerModal = modalGiocatoreEl ? new bootstrap.Modal(modalGiocatoreEl) : null;
        this.addPlayerForm = document.getElementById('giocatoreForm');
        this.editPlayerForm = document.getElementById('giocatoreForm');

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
        // Rimosso event listener sul form, usiamo solo quello sul pulsante
        const salvaGiocatoreBtn = document.getElementById('salvaGiocatore');
        if (salvaGiocatoreBtn) {
            salvaGiocatoreBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAddPlayer(new Event('submit'));
            });
        }
        if (this.editPlayerForm) {
            this.editPlayerForm.addEventListener('submit', (e) => this.handleEditPlayer(e));
        }

    }

    handlePlayerAction(e) {
        const target = e.target.closest('button');
        if (!target) return;

        const playerCard = target.closest('.player-card');
        const playerId = target.dataset.id;

        if (target.classList.contains('modifica-giocatore')) {
            this.openEditModal(playerId);
        } else if (target.classList.contains('elimina-giocatore')) {
            this.removePlayer(playerId);
        }
    }

    async addPlayer() {
        const formData = new FormData(this.addPlayerForm);

        this.loadingManager.show();

        try {
            const response = await fetch(`/squadre/${this.teamId}/giocatori`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.notificationManager.showSuccess('Giocatore aggiunto con successo!');
                if (this.addPlayerModal) this.addPlayerModal.hide();
                this.addPlayerForm.reset();
                setTimeout(() => location.reload(), 1500);
            } else {
                throw new Error(result.error || 'Errore durante l\'aggiunta del giocatore');
            }
        } catch (error) {
            console.error('Errore:', error);
            this.notificationManager.showError(error.message || 'Errore durante l\'aggiunta del giocatore');
        } finally {
            this.loadingManager.hide();
        }
    }

    async handleAddPlayer(e) {
        e.preventDefault();
        await this.addPlayer();
    }

    openEditModal(playerId) {
        // Populate edit form with player data
        const playerCard = document.querySelector(`[data-player-id="${playerId}"]`);
        const playerInfo = playerCard.querySelector('.player-info');

        document.getElementById('editPlayerId').value = playerId;
        document.getElementById('editPlayerNome').value = playerInfo.querySelector('h5').textContent.split(' ')[0];
        document.getElementById('editPlayerCognome').value = playerInfo.querySelector('h5').textContent.split(' ')[1];
        document.getElementById('editPlayerRuolo').value = playerInfo.querySelector('.role').textContent;

        if (this.editPlayerModal) this.editPlayerModal.show();
    }

    async handleEditPlayer(e) {
        e.preventDefault();

        const formData = new FormData(this.editPlayerForm);
        const playerId = document.getElementById('editPlayerId').value;

        this.loadingManager.show();

        try {
            const response = await fetch(`/squadre/${this.teamId}/giocatori/${playerId}`, {
                method: 'PUT',
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.notificationManager.showSuccess('Giocatore aggiornato con successo!');
                if (this.editPlayerModal) this.editPlayerModal.hide();
                setTimeout(() => location.reload(), 1500);
            } else {
                throw new Error(result.error || 'Errore durante l\'aggiornamento del giocatore');
            }
        } catch (error) {
            console.error('Errore:', error);
            this.notificationManager.showError(error.message || 'Errore durante l\'aggiornamento del giocatore');
        } finally {
            this.loadingManager.hide();
        }
    }

    async removePlayer(playerId) {
        if (!confirm('Sei sicuro di voler rimuovere questo giocatore dalla squadra?')) {
            return;
        }

        this.loadingManager.show();

        try {
            const response = await fetch(`/squadre/${this.teamId}/giocatori/${playerId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

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
            const response = await fetch(`/api/search-users?q=${encodeURIComponent(query)}`);
            const data = await response.json();

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
                body: JSON.stringify({ 
                    userId: this.selectedUserId,
                    ruolo: ruolo,
                    data_nomina: document.getElementById('dataNomina').value,
                    data_scadenza: document.getElementById('dataScadenza').value
                })
            });

            const result = await response.json();

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
    }

    async removeManager(managerId) {
        if (!confirm('Sei sicuro di voler rimuovere questo dirigente dalla squadra?')) {
            return;
        }

        this.loadingManager.show();

        try {
            const response = await fetch(`/squadre/${this.teamId}/dirigenti/${managerId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

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
    window.teamApp = new TeamManagementApp();
});