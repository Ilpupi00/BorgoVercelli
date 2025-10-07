class GestioneNotizie {
    constructor() {
        this.originalNotizie = [];
        this.initialize();
    }

    initialize() {
        this.loadNotizieData();
        this.setupEventListeners();
        console.log('Gestione notizie caricata con', this.originalNotizie.length, 'notizie');
    }

    loadNotizieData() {
        const rows = document.querySelectorAll('#notizieTableBody tr[data-notizia-id]');
        this.originalNotizie = Array.from(rows).map(row => ({
            element: row,
            id: row.dataset.notiziaId,
            titolo: row.dataset.titolo || '',
            contenuto: row.dataset.contenuto || '',
            stato: row.dataset.stato || '',
            data: row.dataset.data || ''
        }));
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');
        const statusFilter = document.getElementById('statusFilter');
        const dateFilter = document.getElementById('dateFilter');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterNotizie());
        }

        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    this.filterNotizie();
                    searchInput.focus();
                }
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterNotizie());
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.filterNotizie());
        }
    }

    filterNotizie() {
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const dateFilter = document.getElementById('dateFilter');

        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const statusValue = statusFilter ? statusFilter.value : 'all';
        const dateValue = dateFilter ? dateFilter.value : 'all';

        const tableBody = document.getElementById('notizieTableBody');
        const noResultsRow = document.getElementById('noResultsRow');
        let visibleCount = 0;

        // Filtra le notizie
        this.originalNotizie.forEach(notizia => {
            let isVisible = true;

            // Filtro ricerca
            if (searchTerm && !(notizia.titolo.includes(searchTerm) || 
                               notizia.contenuto.includes(searchTerm) || 
                               notizia.id.includes(searchTerm))) {
                isVisible = false;
            }

            // Filtro stato
            if (statusValue !== 'all' && notizia.stato !== statusValue) {
                isVisible = false;
            }

            // Filtro data
            if (dateValue !== 'all' && notizia.data) {
                const notiziaDate = new Date(notizia.data);
                const now = new Date();
                let isInRange = false;

                switch(dateValue) {
                    case 'today':
                        isInRange = notiziaDate.toDateString() === now.toDateString();
                        break;
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        isInRange = notiziaDate >= weekAgo;
                        break;
                    case 'month':
                        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        isInRange = notiziaDate >= monthAgo;
                        break;
                    case 'year':
                        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                        isInRange = notiziaDate >= yearAgo;
                        break;
                }

                if (!isInRange) {
                    isVisible = false;
                }
            }

            // Mostra/nascondi la riga
            if (isVisible) {
                notizia.element.style.display = '';
                visibleCount++;
            } else {
                notizia.element.style.display = 'none';
            }
        });

        // Gestisci la riga "nessun risultato"
        if (noResultsRow) {
            if (visibleCount === 0 && this.originalNotizie.length > 0) {
                noResultsRow.style.display = '';
                noResultsRow.innerHTML = `
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="bi bi-search display-4 mb-3"></i>
                        <p>Nessuna notizia corrisponde ai filtri selezionati.</p>
                        <button class="btn btn-outline-secondary" onclick="gestioneNotizie.clearAllFilters()">Rimuovi filtri</button>
                    </td>
                `;
            } else {
                noResultsRow.style.display = 'none';
            }
        }

        // Aggiorna i contatori
        this.updateCounters(visibleCount);
    }

    clearAllFilters() {
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const dateFilter = document.getElementById('dateFilter');

        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = 'all';
        if (dateFilter) dateFilter.value = 'all';

        this.filterNotizie();
    }

    updateCounters(visibleCount) {
        const totalCount = document.getElementById('totalCount');
        const filteredCount = document.getElementById('filteredCount');

        if (totalCount) {
            totalCount.textContent = this.originalNotizie.length;
        }

        if (filteredCount) {
            filteredCount.textContent = `(${visibleCount} filtrate)`;
        }
    }

    modificaNotizia(id) {
        // Reindirizza alla pagina di modifica notizia
        window.location.href = '/crea-notizie/' + id;
    }

    async eliminaNotizia(id) {
        if (!confirm('Sei sicuro di voler eliminare questa notizia? Questa azione non può essere annullata.')) {
            return;
        }

        try {
            const response = await fetch('/notizia/' + id, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Rimuovi la notizia dall'array originale
                this.originalNotizie = this.originalNotizie.filter(n => n.id !== id);

                // Rimuovi la riga dalla tabella
                const row = document.querySelector(`tr[data-notizia-id="${id}"]`);
                if (row) {
                    row.remove();
                }

                // Aggiorna i contatori
                this.updateCounters(this.originalNotizie.filter(n => n.element.style.display !== 'none').length);

                // Mostra messaggio di successo
                this.showAlert('Notizia eliminata con successo!', 'success');
            } else {
                this.showAlert('Errore nell\'eliminazione: ' + (result.error || 'Errore sconosciuto'), 'danger');
            }
        } catch (error) {
            console.error('Errore:', error);
            this.showAlert('Errore di connessione', 'danger');
        }
    }

    async togglePubblicazione(id, currentStatus) {
        const action = currentStatus ? 'sospendere' : 'pubblicare';
        if (!confirm(`Sei sicuro di voler ${action} questa notizia?`)) {
            return;
        }

        try {
            const response = await fetch('/notizia/' + id + '/publish', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pubblicata: !currentStatus })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showAlert(result.message, 'success');

                // Aggiorna il badge nella tabella
                const badge = document.querySelector(`tr[data-notizia-id="${id}"] .badge`);
                if (badge) {
                    badge.className = currentStatus ? 'badge bg-warning' : 'badge bg-success';
                    badge.textContent = currentStatus ? 'Bozza' : 'Pubblicata';

                    // Aggiorna anche i dati per il filtraggio
                    const notizia = this.originalNotizie.find(n => n.id === id);
                    if (notizia) {
                        notizia.stato = currentStatus ? 'draft' : 'published';
                    }
                }
            } else {
                this.showAlert('Errore nell\'operazione: ' + (result.error || 'Errore sconosciuto'), 'danger');
            }
        } catch (error) {
            console.error('Errore:', error);
            this.showAlert('Errore di connessione', 'danger');
        }
    }

    showAlert(message, type = 'info') {
        // Rimuovi alert esistenti
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Crea nuovo alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alert.innerHTML = `
            <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alert);

        // Auto-rimuovi dopo 5 secondi
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
}

// Inizializza la classe quando il DOM è pronto
let gestioneNotizie;
document.addEventListener('DOMContentLoaded', function() {
    gestioneNotizie = new GestioneNotizie();
});

// Esporta le funzioni globali per essere usate negli onclick degli elementi HTML
window.modificaNotizia = function(id) {
    gestioneNotizie.modificaNotizia(id);
};

window.eliminaNotizia = function(id) {
    gestioneNotizie.eliminaNotizia(id);
};

window.togglePubblicazione = function(id, currentStatus) {
    gestioneNotizie.togglePubblicazione(id, currentStatus);
};