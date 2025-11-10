/**
 * GestioneCampionati - Gestione campionati con approccio OOP
 */
class GestioneCampionati {
    constructor() {
        this.championships = [];
        this.filteredChampionships = [];
        this.currentChampionship = null;
        this.dataTable = null;
        this.isLoading = false;
        this.init();
    }

    async init() {
        console.log('Inizializzazione GestioneCampionati...');
        try {
            this.bindEvents();
            await this.loadChampionships();
            this.initializeDataTable();
            this.updateStats();
            console.log('GestioneCampionati inizializzato');
        } catch (error) {
            console.error('Errore inizializzazione:', error);
            this.showError('Errore inizializzazione sistema');
        }
    }

    bindEvents() {
        const confirmDeleteBtn = document.getElementById('confirmDelete');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.handleDeleteChampionship());
        }

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

    async loadChampionships() {
        try {
            console.log('Caricamento campionati...');
            this.showLoading(true);

            const response = await fetch('/api/admin/campionati', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.championships = data.championships || [];
            this.filteredChampionships = [...this.championships];

            console.log(`Caricati ${this.championships.length} campionati`);
            this.renderChampionshipsTable();
            this.updateStats();

        } catch (error) {
            console.error('Errore caricamento campionati:', error);
            this.showError('Impossibile caricare i campionati');
        } finally {
            this.showLoading(false);
        }
    }

    initializeDataTable() {
        if (this.dataTable) {
            this.dataTable.destroy();
        }

        const tableElement = $('#championshipsTable');
        if (tableElement.length === 0) {
            console.warn('Tabella non trovata');
            return;
        }

        this.dataTable = tableElement.DataTable({
            responsive: true,
            pageLength: 10,
            lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "Tutti"]],
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/it-IT.json',
                search: "_INPUT_",
                searchPlaceholder: "Cerca...",
                lengthMenu: "Mostra _MENU_ campionati",
                info: "Visualizzati da _START_ a _END_ di _TOTAL_ campionati",
                infoEmpty: "Nessun campionato disponibile",
                infoFiltered: "(filtrati da _MAX_ totali)",
                zeroRecords: "Nessun campionato trovato",
                emptyTable: "Nessun dato disponibile",
                paginate: {
                    first: "Primo",
                    previous: "Precedente",
                    next: "Successivo",
                    last: "Ultimo"
                }
            },
            order: [[4, 'desc']],
            columnDefs: [
                { orderable: false, targets: 5 },
                { className: "text-center", targets: [2, 3, 5] }
            ],
            drawCallback: () => {
                this.bindActionButtons();
            }
        });

        $('.dataTables_filter').hide();
    }

    bindActionButtons() {
        document.querySelectorAll('.btn-elimina-campionato').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = e.currentTarget.dataset.id;
                const name = e.currentTarget.dataset.name;
                this.openDeleteModal(id, name);
            });
        });
    }

    renderChampionshipsTable() {
        const tbody = document.getElementById('championshipsTableBody');
        if (!tbody) {
            console.warn('Tbody non trovato');
            return;
        }

        tbody.innerHTML = '';

        if (this.filteredChampionships.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="6" class="text-center py-5">
                    <i class="bi bi-inbox display-1 text-muted"></i>
                    <p class="mt-3 text-muted">Nessun campionato trovato</p>
                </td>
            `;
            tbody.appendChild(emptyRow);
            if (this.dataTable) {
                this.dataTable.clear().draw();
            }
            return;
        }

        this.filteredChampionships.forEach(championship => {
            const row = this.createChampionshipRow(championship);
            tbody.appendChild(row);
        });

        if (this.dataTable) {
            this.dataTable.clear().rows.add(tbody.querySelectorAll('tr')).draw();
        }
    }

    createChampionshipRow(championship) {
        const row = document.createElement('tr');
        row.className = 'animate__animated animate__fadeIn';

        const statusBadge = this.getStatusBadge(championship.stato);
        const categoryLabel = championship.categoria || 'N/A';
        const dataCreazione = this.formatDate(championship.created_at);

        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="championship-icon me-3">
                        <i class="bi bi-trophy-fill text-warning fs-4"></i>
                    </div>
                    <div>
                        <strong class="d-block">${this.escapeHtml(championship.nome)}</strong>
                        <small class="text-muted">
                            <i class="bi bi-calendar3 me-1"></i>
                            Stagione ${this.escapeHtml(championship.stagione)}
                        </small>
                    </div>
                </div>
            </td>
            <td>
                <span class="badge bg-info bg-gradient">${this.escapeHtml(categoryLabel)}</span>
            </td>
            <td class="text-center">${statusBadge}</td>
            <td class="text-center">
                <span class="badge bg-secondary bg-gradient fs-6">
                    <i class="bi bi-people-fill me-1"></i>
                    ${championship.numero_squadre || 0}
                </span>
            </td>
            <td>
                <small class="text-muted">
                    <i class="bi bi-clock me-1"></i>
                    ${dataCreazione}
                </small>
            </td>
            <td class="text-center">
                <div class="btn-group" role="group">
                    <a href="/campionato?id=${championship.id}" 
                       class="btn btn-sm btn-info" 
                       title="Visualizza Campionato"
                       target="_blank">
                        <i class="bi bi-eye"></i>
                    </a>
                    <a href="/admin/campionati/${championship.id}/modifica" 
                       class="btn btn-sm btn-primary" 
                       title="Modifica Campionato">
                        <i class="bi bi-pencil"></i>
                    </a>
                    <button class="btn btn-sm btn-danger btn-elimina-campionato"
                            data-id="${championship.id}"
                            data-name="${this.escapeHtml(championship.nome)}"
                            title="Elimina Campionato">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;

        return row;
    }

    async handleDeleteChampionship() {
        if (!this.currentChampionship) {
            console.warn('Nessun campionato selezionato');
            return;
        }

        try {
            this.showLoading(true);

            const response = await fetch(`/api/admin/campionati/${this.currentChampionship.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore eliminazione');
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteChampionshipModal'));
            if (modal) modal.hide();

            await this.loadChampionships();
            this.showSuccess('Campionato eliminato con successo!');

        } catch (error) {
            console.error('Errore eliminazione:', error);
            this.showError('Errore eliminazione: ' + error.message);
        } finally {
            this.showLoading(false);
            this.currentChampionship = null;
        }
    }

    handleSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase().trim();

        if (searchTerm === '') {
            this.filteredChampionships = [...this.championships];
        } else {
            this.filteredChampionships = this.championships.filter(championship =>
                championship.nome.toLowerCase().includes(searchTerm) ||
                championship.stagione.toLowerCase().includes(searchTerm) ||
                (championship.categoria && championship.categoria.toLowerCase().includes(searchTerm))
            );
        }

        this.renderChampionshipsTable();
    }

    handleFilter() {
        const statusFilter = document.getElementById('statusFilter')?.value;
        const categoryFilter = document.getElementById('categoryFilter')?.value;

        this.filteredChampionships = this.championships.filter(championship => {
            const statusMatch = !statusFilter || championship.stato === statusFilter;
            const categoryMatch = !categoryFilter || championship.categoria === categoryFilter;
            return statusMatch && categoryMatch;
        });

        this.renderChampionshipsTable();
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) statusFilter.value = '';

        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) categoryFilter.value = '';

        this.filteredChampionships = [...this.championships];
        this.renderChampionshipsTable();
    }

    openDeleteModal(id, name) {
        this.currentChampionship = { id, name };
        
        const nameElement = document.getElementById('deleteChampionshipName');
        if (nameElement) nameElement.textContent = name;

        const modal = new bootstrap.Modal(document.getElementById('deleteChampionshipModal'));
        modal.show();
    }

    updateStats() {
        const total = this.championships.length;
        const active = this.championships.filter(c => c.is_active).length;
        const totalTeams = this.championships.reduce((sum, c) => sum + (c.numero_squadre || 0), 0);
        const upcomingMatches = this.championships.reduce((sum, c) => sum + (c.partite_programmate || 0), 0);

        this.updateStatElement('totalChampionships', total);
        this.updateStatElement('activeChampionships', active);
        this.updateStatElement('totalTeams', totalTeams);
        this.updateStatElement('upcomingMatches', upcomingMatches);
    }

    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const currentValue = parseInt(element.textContent) || 0;
        
        if (currentValue !== value) {
            element.classList.add('animate__animated', 'animate__pulse');
            element.textContent = value;
            
            setTimeout(() => {
                element.classList.remove('animate__animated', 'animate__pulse');
            }, 1000);
        }
    }

    getStatusBadge(status) {
        const badges = {
            'attivo': '<span class="badge bg-success bg-gradient"><i class="bi bi-check-circle me-1"></i>Attivo</span>',
            'inattivo': '<span class="badge bg-secondary bg-gradient"><i class="bi bi-pause-circle me-1"></i>Inattivo</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">Sconosciuto</span>';
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('it-IT', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.warn('Errore formattazione data:', error);
            return '-';
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading(show) {
        this.isLoading = show;
        
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }

        const buttons = document.querySelectorAll('.btn-primary, .btn-danger, .btn-warning');
        buttons.forEach(btn => {
            btn.disabled = show;
        });
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'danger');
    }

    showToast(message, type = 'info') {
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${this.escapeHtml(message)}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);

        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 5000 });
        toast.show();

        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Caricato - Inizializzazione GestioneCampionati...');
    if (document.getElementById('championshipsTable')) {
        window.gestioneCampionati = new GestioneCampionati();
    } else {
        console.warn('Tabella campionati non trovata');
    }
});
