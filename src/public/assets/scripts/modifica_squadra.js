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
        // usa il modal custom se disponibile, altrimenti fallback a confirm()
        const ok = window.ShowModal
            ? await ShowModal.modalDelete('Sei sicuro di voler rimuovere questo giocatore dalla squadra? Questa operazione è irreversibile.', 'Conferma eliminazione')
            : confirm('Sei sicuro di voler rimuovere questo giocatore dalla squadra?');

        if (!ok) return;

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
                const el = document.querySelector(`[data-player-id="${playerId}"]`);
                if (el) el.remove();
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

        // Usa il modal custom se disponibile, altrimenti fallback a confirm()
        const ok = window.ShowModal
            ? await ShowModal.modalDelete('Sei sicuro di voler eliminare questo giocatore?', 'Conferma eliminazione')
            : confirm('Sei sicuro di voler eliminare questo giocatore?');

        if (!ok) return;

        // Chiudi immediatamente il modal del giocatore per dare feedback all'utente
        if (this.playerModal) this.playerModal.hide();

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

        // temporary array to track elements we change pointer-events on (for debug fix)
        this._tempDisabledOverlays = [];

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
        const deleteDirigenteBtn = document.getElementById('eliminaDirigente');
        if (deleteDirigenteBtn) {
            deleteDirigenteBtn.addEventListener('click', () => this.deleteManagerFromModal());
        }
        const nuovoDirigenteBtn = document.getElementById('nuovoDirigenteBtn');
        if (nuovoDirigenteBtn) {
            nuovoDirigenteBtn.addEventListener('click', () => {
                this.resetManagerForm();
                if (this.addManagerModal) this.addManagerModal.show();
            });
        }
        if (this.addManagerModal) {
            this.addManagerModal._element.addEventListener('shown.bs.modal', () => {
                setTimeout(() => {
                    if (this.managerSearch) {
                        this.managerSearch.focus();
                        this.managerSearch.disabled = false;
                        this.managerSearch.removeAttribute('readonly');
                    }
                }, 500);
            });
        }

        // Debug helpers: log interactions and computed styles for the manager search input
        try {
            if (this.managerSearch) {
                ['focus', 'mousedown', 'click', 'keydown', 'input'].forEach(evt => {
                    this.managerSearch.addEventListener(evt, (e) => {
                        console.debug('[DEBUG] managerSearch event:', evt, 'disabled=', this.managerSearch.disabled, 'readonly=', this.managerSearch.readOnly, 'value=', this.managerSearch.value, e);
                    }, { passive: true });
                });
            }

            // When modal shown, report computed style to check pointer-events
            if (this.addManagerModal) {
                this.addManagerModal._element.addEventListener('shown.bs.modal', () => {
                    setTimeout(() => {
                        if (this.managerSearch) {
                            const cs = window.getComputedStyle(this.managerSearch);
                            console.debug('[DEBUG] managerSearch computed pointer-events:', cs.pointerEvents, 'visibility:', cs.visibility, 'opacity:', cs.opacity);
                        }
                        // report topmost element at the search input position
                        const modalEl = document.getElementById('modalDirigente');
                        const inputEl = this.managerSearch;
                        if (modalEl && inputEl && inputEl.getBoundingClientRect) {
                            const r = inputEl.getBoundingClientRect();
                            const topEl = document.elementFromPoint(r.left + 2, r.top + 2);
                            console.debug('[DEBUG] elementFromPoint at search coords:', topEl);
                            // If the top element is not the input (something overlays it), try to temporarily disable pointer-events on it
                            try {
                                if (topEl && topEl !== inputEl && !inputEl.contains(topEl) && topEl.style) {
                                    console.debug('[DEBUG] Temporarily disabling pointer-events on overlay element:', topEl);
                                    // store previous value
                                    this._tempDisabledOverlays.push({ el: topEl, prev: topEl.style.pointerEvents });
                                    topEl.style.pointerEvents = 'none';
                                }
                            } catch (err) {
                                console.warn('Could not modify overlay element pointer-events:', err);
                            }
                        }
                    }, 350);
                });
                // restore on hide
                this.addManagerModal._element.addEventListener('hidden.bs.modal', () => {
                    try {
                        this._tempDisabledOverlays.forEach(item => {
                            if (item && item.el && item.el.style) item.el.style.pointerEvents = item.prev || '';
                        });
                    } catch (err) {
                        console.warn('Error restoring overlay pointer-events:', err);
                    }
                    this._tempDisabledOverlays = [];
                });
            }
        } catch (err) {
            console.warn('Debug helpers failed to attach:', err);
        }
    }

    handleManagerAction(e) {
        const target = e.target.closest('button');
        if (!target) return;

        // Try to find manager id from several possible sources to be robust
        let managerId = null;
        const managerCard = target.closest('.manager-card, [data-manager-id]');
        if (managerCard && managerCard.dataset) managerId = managerCard.dataset.managerId || managerCard.dataset.managerId;

        // buttons in templates may carry data-id or data-manager-id attributes
        if (!managerId) managerId = target.dataset.id || target.getAttribute('data-id') || target.dataset.managerId || null;

        // If still not found, try to find a parent element with data-id attribute
        if (!managerId) {
            const parentWithId = target.closest('[data-id], [data-manager-id]');
            if (parentWithId) managerId = parentWithId.dataset.id || parentWithId.dataset.managerId || null;
        }

        // If the clicked button is a modify/edit button, call openEditModal
        if (target.classList.contains('modifica-dirigente') || target.classList.contains('edit-manager')) {
            if (!managerId) {
                console.warn('editManager: managerId not found for target', target);
                return;
            }
            this.openEditModal(managerId);
        }
        // If the clicked button is a remove/delete button (supporting different class names), call remove
        else if (target.classList.contains('remove-manager-btn') || target.classList.contains('elimina-dirigente') || target.classList.contains('remove-manager') ) {
            if (!managerId) {
                console.warn('removeManager: managerId not found for target', target);
                return;
            }
            this.removeManager(managerId);
        }
    }

    handleSearchInput(e) {
        const query = e.target.value.trim();

        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // If the query is very short, don't wipe the user's input by
        // resetting the whole form — this was causing the typed
        // character to be cleared immediately. Instead, clear
        // suggestions and ensure any previously-selected user id is
        // cleared and the save button disabled.
        if (query.length < 2) {
            this.managerSuggestions.innerHTML = '';
            this.selectedUserId = null;
            const sel = document.getElementById('selectedUtenteId');
            if (sel) sel.value = '';
            const salvaBtn = document.getElementById('salvaDirigente');
            if (salvaBtn) salvaBtn.disabled = true;
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
            suggestionItem.className = 'list-group-item suggestion-item';
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
        // Popola e disabilita i campi nome/cognome aggiunti nella UI
        const nomeInput = document.getElementById('dirigenteNome');
        const cognomeInput = document.getElementById('dirigenteCognome');
        if (nomeInput) {
            nomeInput.value = user.nome || '';
            nomeInput.disabled = true;
        }
        if (cognomeInput) {
            cognomeInput.value = user.cognome || '';
            cognomeInput.disabled = true;
        }
    }

    openEditModal(managerId) {
        // Get manager card data from data-attributes
        const managerCard = document.querySelector(`[data-manager-id="${managerId}"]`);
        if (!managerCard) {
            console.warn('Manager card not found for id:', managerId);
            return;
        }

        const nome = managerCard.dataset.nome || '';
        const cognome = managerCard.dataset.cognome || '';
        const ruolo = managerCard.dataset.ruolo || '';
        const dataNomina = managerCard.dataset.dataNomina || '';
        const dataScadenza = managerCard.dataset.dataScadenza || '';
        const utenteId = managerCard.dataset.utenteId || '';

        // Populate the form fields
        this.selectedUserId = utenteId;
        if (this.managerSearch) {
            this.managerSearch.value = `${nome} ${cognome}`;
            this.managerSearch.disabled = true;
        }

        // Populate nome/cognome fields and disable them
        const nomeInput = document.getElementById('dirigenteNome');
        const cognomeInput = document.getElementById('dirigenteCognome');
        if (nomeInput) {
            nomeInput.value = nome || '';
            nomeInput.disabled = true;
        }
        if (cognomeInput) {
            cognomeInput.value = cognome || '';
            cognomeInput.disabled = true;
        }
        
        const ruoloSelect = document.getElementById('dirigenteRuolo');
        if (ruoloSelect) ruoloSelect.value = ruolo;
        
        const nominaInput = document.getElementById('dataNomina');
        if (nominaInput) nominaInput.value = dataNomina;
        
        const scadenzaInput = document.getElementById('dataScadenza');
        if (scadenzaInput) scadenzaInput.value = dataScadenza;

        const sel = document.getElementById('selectedUtenteId');
        if (sel) sel.value = utenteId;

        // Store the managerId for update
        const dirigenteIdInput = document.getElementById('dirigenteId');
        if (dirigenteIdInput) dirigenteIdInput.value = managerId;

        // Enable save button and show delete button
        const salvaBtn = document.getElementById('salvaDirigente');
        if (salvaBtn) {
            salvaBtn.disabled = false;
            salvaBtn.textContent = 'Aggiorna Dirigente';
            salvaBtn.innerHTML = '<i class="fas fa-save"></i> Aggiorna Dirigente';
        }

        const deleteBtn = document.getElementById('eliminaDirigente');
        if (deleteBtn) deleteBtn.style.display = 'inline-block';

        // Change modal title
        const modalTitle = document.getElementById('modalDirigenteTitle');
        if (modalTitle) modalTitle.textContent = 'Modifica Dirigente';

        // Show the modal
        if (this.addManagerModal) this.addManagerModal.show();
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

        const dirigenteIdInput = document.getElementById('dirigenteId');
        const managerId = dirigenteIdInput ? dirigenteIdInput.value : null;
        const isUpdate = !!managerId;

        this.loadingManager.show();

        try {
            const url = isUpdate ? `/squadre/${this.teamId}/dirigenti/${managerId}` : `/squadre/${this.teamId}/dirigenti`;
            const method = isUpdate ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
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
                const msg = isUpdate ? 'Dirigente aggiornato con successo!' : 'Dirigente aggiunto con successo!';
                this.notificationManager.showSuccess(msg);
                if (this.addManagerModal) this.addManagerModal.hide();
                this.resetManagerForm();
                setTimeout(() => location.reload(), 1500);
            } else {
                throw new Error(result.error || `Errore durante ${isUpdate ? 'l\'aggiornamento' : 'l\'aggiunta'} del dirigente`);
            }
        } catch (error) {
            console.error('Errore:', error);
            this.notificationManager.showError(error.message || `Errore durante ${isUpdate ? 'l\'aggiornamento' : 'l\'aggiunta'} del dirigente`);
            if (this.addManagerModal) this.addManagerModal.hide();
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
        // reset name fields
        const nomeInput = document.getElementById('dirigenteNome');
        const cognomeInput = document.getElementById('dirigenteCognome');
        if (nomeInput) {
            nomeInput.value = '';
            nomeInput.disabled = false;
        }
        if (cognomeInput) {
            cognomeInput.value = '';
            cognomeInput.disabled = false;
        }
        
        const salvaBtn = document.getElementById('salvaDirigente');
        if (salvaBtn) {
            salvaBtn.disabled = true;
            salvaBtn.innerHTML = '<i class="fas fa-save"></i> Salva Dirigente';
        }
        
        const deleteBtn = document.getElementById('eliminaDirigente');
        if (deleteBtn) deleteBtn.style.display = 'none';
        
        const dirigenteIdInput = document.getElementById('dirigenteId');
        if (dirigenteIdInput) dirigenteIdInput.value = '';
        
        const modalTitle = document.getElementById('modalDirigenteTitle');
        if (modalTitle) modalTitle.textContent = 'Aggiungi / Modifica Dirigente';
        
        const sel = document.getElementById('selectedUtenteId');
        if (sel) sel.value = '';
    }

    async removeManager(managerId) {
        // Show confirmation modal and perform deletion only on confirm
        showEntityDeleteModal({
            message: 'Sei sicuro di voler rimuovere questo dirigente dalla squadra? Questa operazione è irreversibile.',
            entityType: 'dirigente',
            entityId: managerId,
            onConfirm: async (id) => {
                this.loadingManager.show();
                try {
                    const response = await fetch(`/squadre/${this.teamId}/dirigenti/${id}`, {
                        method: 'DELETE',
                        credentials: 'same-origin'
                    });

                    const contentType = response.headers.get('content-type') || '';
                    const result = contentType.includes('application/json') ? await response.json() : { success: false, error: await response.text() };

                    if (response.ok && result.success) {
                        this.notificationManager.showSuccess('Dirigente rimosso con successo!');
                        // try multiple selectors to find the DOM element representing the manager
                        let el = document.querySelector(`[data-manager-id="${id}"]`);
                        if (!el) el = document.querySelector(`[data-id="${id}"]`);
                        if (!el) {
                            // maybe the button carried the data-id; find the closest card column
                            const btn = document.querySelector(`button[data-id="${id}"]`) || document.querySelector(`.elimina-dirigente[data-id="${id}"]`);
                            if (btn) el = btn.closest('.col-xl-3, .col-lg-4, .col-md-6, .card, .player-card, .manager-card');
                        }
                        if (el) el.remove();
                        else console.warn('Could not find DOM element for manager id', id, '— consider reloading the page');

                        // Show a short-lived undo widget to allow restoring the dirigente
                        try {
                            const undoKey = `undo-restore-dirigente-${id}`;
                            // remove existing if present
                            const prev = document.getElementById(undoKey);
                            if (prev) prev.remove();

                            const undoDiv = document.createElement('div');
                            undoDiv.id = undoKey;
                            undoDiv.className = 'shadow-lg rounded p-2 bg-white border position-fixed';
                            undoDiv.style.zIndex = '12000';
                            undoDiv.style.right = '1rem';
                            undoDiv.style.top = '1rem';
                            undoDiv.style.minWidth = '220px';
                            undoDiv.innerHTML = `
                                <div class="d-flex align-items-center justify-content-between">
                                    <div class="me-2" style="font-size:0.95rem;">Dirigente rimosso</div>
                                    <div>
                                        <button class="btn btn-sm btn-link p-0 undo-restore-btn">Annulla</button>
                                        <button class="btn btn-sm btn-close ms-2 dismiss-undo" aria-label="Chiudi"></button>
                                    </div>
                                </div>
                            `;
                            document.body.appendChild(undoDiv);

                            const dismissBtn = undoDiv.querySelector('.dismiss-undo');
                            if (dismissBtn) dismissBtn.addEventListener('click', () => undoDiv.remove());

                            const undoBtn = undoDiv.querySelector('.undo-restore-btn');
                            if (undoBtn) {
                                undoBtn.addEventListener('click', async () => {
                                    try {
                                        // call restore endpoint
                                        const resp = await fetch(`/squadre/${this.teamId}/dirigenti/${id}/restore`, {
                                            method: 'POST',
                                            credentials: 'same-origin'
                                        });
                                        const cT = resp.headers.get('content-type') || '';
                                        const j = cT.includes('application/json') ? await resp.json() : {};
                                        if (resp.ok && j.success) {
                                            this.notificationManager.showSuccess('Dirigente ripristinato');
                                            // reload to reflect restored item
                                            setTimeout(() => location.reload(), 600);
                                        } else {
                                            throw new Error(j.error || 'Errore ripristino');
                                        }
                                    } catch (err) {
                                        console.error('Errore ripristino dirigente:', err);
                                        this.notificationManager.showError(err.message || 'Errore durante il ripristino');
                                    } finally {
                                        if (undoDiv) undoDiv.remove();
                                    }
                                });
                            }

                            // auto-dismiss after 8s
                            setTimeout(() => {
                                if (document.getElementById(undoKey)) document.getElementById(undoKey).remove();
                            }, 8000);
                        } catch (err) {
                            console.warn('Undo UI failed:', err);
                        }
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
        });
    }

    async deleteManagerFromModal() {
        const dirigenteIdInput = document.getElementById('dirigenteId');
        const managerId = dirigenteIdInput ? dirigenteIdInput.value : null;
        if (!managerId) {
            this.notificationManager.showError('Nessun dirigente selezionato');
            return;
        }

        // Usa il modal custom se disponibile, altrimenti fallback a confirm()
        const ok = window.ShowModal
            ? await ShowModal.modalDelete('Sei sicuro di voler eliminare questo dirigente?', 'Conferma eliminazione')
            : confirm('Sei sicuro di voler eliminare questo dirigente?');

        if (!ok) return;

        // Chiudi immediatamente il modal del dirigente per dare feedback all'utente
        if (this.addManagerModal) this.addManagerModal.hide();

        this.loadingManager.show();
        try {
            const response = await fetch(`/squadre/${this.teamId}/dirigenti/${managerId}`, { 
                method: 'DELETE', 
                credentials: 'same-origin' 
            });
            const contentType = response.headers.get('content-type') || '';
            const result = contentType.includes('application/json') ? await response.json() : { success: false, error: await response.text() };

            if (response.ok && result.success) {
                this.notificationManager.showSuccess('Dirigente eliminato con successo');
                const el = document.querySelector(`[data-manager-id="${managerId}"]`);
                if (el) el.remove();
                this.resetManagerForm();
            } else {
                throw new Error(result.error || 'Errore durante l\'eliminazione');
            }
        } catch (err) {
            console.error(err);
            this.notificationManager.showError(err.message || 'Errore durante l\'eliminazione del dirigente');
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

// Generic entity delete modal helper
function showEntityDeleteModal(options) {
    // options: { title, message, entityType, entityId, onConfirm }
    const modalEl = document.getElementById('entityDeleteModal');
    const body = document.getElementById('entityDeleteModalBody');
    const confirmBtn = document.getElementById('confirmDeleteEntityBtn');
    if (!modalEl || !body || !confirmBtn) {
        console.warn('Delete modal elements missing');
        return;
    }

    body.textContent = options.message || 'Sei sicuro di voler eliminare questo elemento?';
    confirmBtn.dataset.entityType = options.entityType || '';
    confirmBtn.dataset.entityId = options.entityId || '';

    // remove previous handlers
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    newBtn.addEventListener('click', async () => {
        try {
            if (options.onConfirm) await options.onConfirm(options.entityId);
        } catch (err) {
            console.error('Error in delete onConfirm:', err);
        }
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    });

    const bm = new bootstrap.Modal(modalEl);
    bm.show();
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
                    if(window.userType === 1){
                        window.location = '/admin/squadre';
                    }
                    else{
                        window.location='/profilo';
                    }
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