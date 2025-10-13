/**
 * GestioneCampionati - Classe per gestire la pagina di amministrazione campionati
 * Utilizza un approccio OOP moderno con gestione asincrona e interfaccia utente reattiva
 */
class GestioneCampionati {
    constructor() {
        this.championships = [];
        this.filteredChampionships = [];
        this.currentChampionship = null;
        this.dataTable = null;

        this.init();
    }

    /**
     * Inizializza la classe e tutti i componenti
     */
    async init() {
        console.log('Inizializzazione GestioneCampionati...');
        this.bindEvents();
        await this.loadChampionships();
        this.initializeDataTable();
        this.updateStats();
    }

    /**
     * Associa gli event listener agli elementi DOM
     */
    bindEvents() {
        // Form creazione campionato
        const createForm = document.getElementById('createChampionshipForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => this.handleCreateChampionship(e));
        }

        // Form modifica campionato
        const editForm = document.getElementById('editChampionshipForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.handleEditChampionship(e));
        }

        // Pulsante conferma eliminazione
        const confirmDeleteBtn = document.getElementById('confirmDelete');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.handleDeleteChampionship());
        }

        // Ricerca e filtri
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.handleSearch());
        }

        const clearSearchBtn = document.getElementById('clearSearch');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => this.clearSearch());
        }

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.handleFilter());
        }

        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.handleFilter());
        }
    }

    /**
     * Carica i campionati dal server
     */
    async loadChampionships() {
        try {
            console.log('Caricamento campionati...');
            this.showLoading();

            const response = await fetch('/api/admin/campionati');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.championships = data.championships || [];
            this.filteredChampionships = [...this.championships];

            console.log(`Caricati ${this.championships.length} campionati`);
            this.renderChampionshipsTable();

        } catch (error) {
            console.error('Errore nel caricamento dei campionati:', error);
            this.showError('Errore nel caricamento dei campionati: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Inizializza la DataTable
     */
    initializeDataTable() {
        if (this.dataTable) {
            this.dataTable.destroy();
        }

        this.dataTable = $('#championshipsTable').DataTable({
            responsive: true,
            pageLength: 10,
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/it-IT.json'
            },
            columnDefs: [
                { orderable: false, targets: 5 } // Colonna azioni non ordinabile
            ],
            drawCallback: () => {
                // Riassocia gli event listener dopo ogni redraw
                this.bindActionButtons();
            }
        });
    }

    /**
     * Associa gli event listener ai pulsanti delle azioni
     */
    bindActionButtons() {
        // Pulsanti modifica
        document.querySelectorAll('.btn-modifica-campionato').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.openEditModal(id);
            });
        });

        // Pulsanti elimina
        document.querySelectorAll('.btn-elimina-campionato').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const name = e.currentTarget.dataset.name;
                this.openDeleteModal(id, name);
            });
        });

        // Pulsanti toggle stato
        document.querySelectorAll('.toggle-stato').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const currentStatus = e.currentTarget.dataset.status === 'true';
                this.toggleChampionshipStatus(id, !currentStatus);
            });
        });
    }

    /**
     * Renderizza la tabella dei campionati
     */
    renderChampionshipsTable() {
        const tbody = document.getElementById('championshipsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.filteredChampionships.forEach(championship => {
            const row = this.createChampionshipRow(championship);
            tbody.appendChild(row);
        });

        // Riavvia DataTable se esiste
        if (this.dataTable) {
            this.dataTable.clear().rows.add(tbody.children).draw();
        }
    }

    /**
     * Crea una riga della tabella per un campionato
     */
    createChampionshipRow(championship) {
        const row = document.createElement('tr');

        const statusBadge = this.getStatusBadge(championship.stato);
        const categoryLabel = championship.categoria || 'N/A';

        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <i class="bi bi-trophy text-warning me-2"></i>
                    <div>
                        <strong>${this.escapeHtml(championship.nome)}</strong>
                        <br><small class="text-muted">Stagione: ${this.escapeHtml(championship.stagione)}</small>
                    </div>
                </div>
            </td>
            <td>
                <span class="badge bg-info">${categoryLabel}</span>
            </td>
            <td>${statusBadge}</td>
            <td>
                <span class="badge bg-secondary">${championship.numero_squadre || 0}</span>
            </td>
            <td>${this.formatDate(championship.created_at)}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-warning btn-modifica-campionato"
                            data-id="${championship.id}"
                            title="Modifica">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm ${championship.is_active ? 'btn-outline-success' : 'btn-outline-secondary'} toggle-stato"
                            data-id="${championship.id}"
                            data-status="${championship.is_active}"
                            title="${championship.is_active ? 'Disattiva' : 'Attiva'}">
                        <i class="bi ${championship.is_active ? 'bi-pause' : 'bi-play'}"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-elimina-campionato"
                            data-id="${championship.id}"
                            data-name="${this.escapeHtml(championship.nome)}"
                            title="Elimina">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;

        return row;
    }

    /**
     * Gestisce la creazione di un nuovo campionato
     */
    async handleCreateChampionship(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const championshipData = {
            nome: formData.get('nome'),
            stagione: formData.get('stagione') || new Date().getFullYear().toString(),
            categoria: formData.get('categoria'),
            fonte_esterna_id: formData.get('fonte_esterna_id'),
            url_fonte: formData.get('url_fonte'),
            is_active: e.target.querySelector('#is_active').checked
        };

        try {
            this.showLoading();

            const response = await fetch('/api/admin/campionati', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(championshipData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Errore nella creazione del campionato');
            }

            const result = await response.json();

            // Chiudi modal e resetta form
            const modal = bootstrap.Modal.getInstance(document.getElementById('createChampionshipModal'));
            modal.hide();
            e.target.reset();

            // Ricarica i dati
            await this.loadChampionships();
            this.updateStats();

            this.showSuccess('Campionato creato con successo!');

        } catch (error) {
            console.error('Errore nella creazione del campionato:', error);
            this.showError('Errore nella creazione del campionato: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Gestisce la modifica di un campionato
     */
    async handleEditChampionship(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const championshipData = {
            nome: formData.get('nome'),
            stagione: formData.get('stagione'),
            categoria: formData.get('categoria'),
            fonte_esterna_id: formData.get('fonte_esterna_id'),
            url_fonte: formData.get('url_fonte'),
            is_active: e.target.querySelector('#editIsActive').checked
        };
        const id = formData.get('id');

        try {
            this.showLoading();

            const response = await fetch(`/api/admin/campionati/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(championshipData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Errore nella modifica del campionato');
            }

            // Chiudi modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editChampionshipModal'));
            modal.hide();

            // Ricarica i dati
            await this.loadChampionships();
            this.updateStats();

            this.showSuccess('Campionato modificato con successo!');

        } catch (error) {
            console.error('Errore nella modifica del campionato:', error);
            this.showError('Errore nella modifica del campionato: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Gestisce l'eliminazione di un campionato
     */
    async handleDeleteChampionship() {
        if (!this.currentChampionship) return;

        try {
            this.showLoading();

            const response = await fetch(`/api/admin/campionati/${this.currentChampionship.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Errore nell\'eliminazione del campionato');
            }

            // Chiudi modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteChampionshipModal'));
            modal.hide();

            // Ricarica i dati
            await this.loadChampionships();
            this.updateStats();

            this.showSuccess('Campionato eliminato con successo!');

        } catch (error) {
            console.error('Errore nell\'eliminazione del campionato:', error);
            this.showError('Errore nell\'eliminazione del campionato: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Toggle dello stato del campionato
     */
    async toggleChampionshipStatus(id, isActive) {
        try {
            const response = await fetch(`/api/admin/campionati/${id}/toggle`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ is_active: isActive })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Errore nel cambio di stato');
            }

            await this.loadChampionships();
            this.updateStats();

        } catch (error) {
            console.error('Errore nel toggle dello stato:', error);
            this.showError('Errore nel cambio di stato: ' + error.message);
        }
    }

    /**
     * Gestisce la ricerca
     */
    handleSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();

        this.filteredChampionships = this.championships.filter(championship =>
            championship.nome.toLowerCase().includes(searchTerm) ||
            championship.stagione.toLowerCase().includes(searchTerm) ||
            (championship.categoria && championship.categoria.toLowerCase().includes(searchTerm))
        );

        this.renderChampionshipsTable();
    }

    /**
     * Gestisce i filtri
     */
    handleFilter() {
        const statusFilter = document.getElementById('statusFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;

        this.filteredChampionships = this.championships.filter(championship => {
            const statusMatch = !statusFilter || championship.stato === statusFilter;
            const categoryMatch = !categoryFilter || championship.categoria === categoryFilter;
            return statusMatch && categoryMatch;
        });

        this.renderChampionshipsTable();
    }

    /**
     * Pulisce la ricerca
     */
    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.filteredChampionships = [...this.championships];
        this.renderChampionshipsTable();
    }

    /**
     * Apre il modal di modifica
     */
    openEditModal(id) {
        const championship = this.championships.find(c => c.id == id);
        if (!championship) return;

        // Popola il form
        document.getElementById('editId').value = championship.id;
        document.getElementById('editNome').value = championship.nome;
        document.getElementById('editStagione').value = championship.stagione;
        document.getElementById('editCategoria').value = championship.categoria || '';
        document.getElementById('editFonteEsternaId').value = championship.fonte_esterna_id || '';
        document.getElementById('editUrlFonte').value = championship.url_fonte || '';
        document.getElementById('editIsActive').checked = championship.is_active;

        // Mostra il modal
        const modal = new bootstrap.Modal(document.getElementById('editChampionshipModal'));
        modal.show();
    }

    /**
     * Apre il modal di conferma eliminazione
     */
    openDeleteModal(id, name) {
        this.currentChampionship = { id, name };
        document.getElementById('deleteChampionshipName').textContent = name;

        const modal = new bootstrap.Modal(document.getElementById('deleteChampionshipModal'));
        modal.show();
    }

    /**
     * Aggiorna le statistiche
     */
    updateStats() {
        const total = this.championships.length;
        const active = this.championships.filter(c => c.is_active).length;
        const totalTeams = this.championships.reduce((sum, c) => sum + (c.numero_squadre || 0), 0);
        const upcomingMatches = this.championships.reduce((sum, c) => sum + (c.partite_programmate || 0), 0);

        document.getElementById('totalChampionships').textContent = total;
        document.getElementById('activeChampionships').textContent = active;
        document.getElementById('totalTeams').textContent = totalTeams;
        document.getElementById('upcomingMatches').textContent = upcomingMatches;
    }

    /**
     * Utility: ottiene il badge di stato
     */
    getStatusBadge(status) {
        const badges = {
            'attivo': '<span class="badge bg-success">Attivo</span>',
            'inattivo': '<span class="badge bg-secondary">Inattivo</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">Sconosciuto</span>';
    }

    /**
     * Utility: formatta una data
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT');
    }

    /**
     * Utility: escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Mostra loading
     */
    showLoading() {
        // Implementazione loading se necessario
    }

    /**
     * Nasconde loading
     */
    hideLoading() {
        // Implementazione loading se necessario
    }

    /**
     * Mostra messaggio di successo
     */
    showSuccess(message) {
        // Implementazione toast o alert di successo
        alert(message);
    }

    /**
     * Mostra messaggio di errore
     */
    showError(message) {
        // Implementazione toast o alert di errore
        alert('Errore: ' + message);
    }
}

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    new GestioneCampionati();
});