class GestioneNotizie {
    constructor() {
        this.notizieCards = [];
        this.originalNotizie = [];
        this.initialize();
    }

    initialize() {
        this.loadNotizieData();
        this.setupEventListeners();
        console.log('Gestione notizie caricata con', this.notizieCards.length, 'notizie');
    }

    loadNotizieData() {
        // Supporta sia le card che le righe della tabella
        const cards = document.querySelectorAll('.notizia-card[data-notizia-id]');
        const rows = document.querySelectorAll('#notizieTableBody tr[data-notizia-id]');
        
        if (cards.length > 0) {
            this.notizieCards = Array.from(cards);
            this.originalNotizie = this.notizieCards.map(card => ({
                id: parseInt(card.dataset.notiziaId),
                element: card
            }));
        } else if (rows.length > 0) {
            this.notizieCards = Array.from(rows);
            this.originalNotizie = this.notizieCards.map(row => ({
                id: parseInt(row.dataset.notiziaId),
                element: row
            }));
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const dateFilter = document.getElementById('dateFilter');
        const sortFilter = document.getElementById('sortFilter');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterNotizie());
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterNotizie());
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.filterNotizie());
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', () => this.sortNotizie());
        }

        // Event listener for delete buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-notizia-btn')) {
                e.preventDefault();
                const button = e.target.closest('.delete-notizia-btn');
                const id = button.dataset.notiziaId;
                this.eliminaNotizia(id);
            }
        });
    }

    filterNotizie() {
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const dateFilter = document.getElementById('dateFilter');

        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const statusValue = statusFilter ? statusFilter.value : 'all';
        const dateValue = dateFilter ? dateFilter.value : 'all';

        let visibleCount = 0;
        const now = new Date();

        this.notizieCards.forEach(card => {
            const titolo = (card.dataset.titolo || '').toLowerCase();
            const contenuto = (card.dataset.contenuto || '').toLowerCase();
            const autore = (card.dataset.autore || '').toLowerCase();
            const stato = card.dataset.stato || '';
            const dataStr = card.dataset.data || '';
            
            // Search filter
            const matchesSearch = !searchTerm || 
                                titolo.includes(searchTerm) || 
                                contenuto.includes(searchTerm) || 
                                autore.includes(searchTerm);
            
            // Status filter
            const matchesStatus = statusValue === 'all' || stato === statusValue;
            
            // Date filter
            let matchesDate = true;
            if (dateValue !== 'all' && dataStr) {
                const cardDate = new Date(dataStr);
                const diffTime = now - cardDate;
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                
                if (dateValue === 'today') matchesDate = diffDays < 1;
                else if (dateValue === 'week') matchesDate = diffDays < 7;
                else if (dateValue === 'month') matchesDate = diffDays < 30;
                else if (dateValue === 'year') matchesDate = diffDays < 365;
            }
            
            if (matchesSearch && matchesStatus && matchesDate) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        this.updateEmptyState(visibleCount);
        this.updateCounters(visibleCount);
    }

    updateEmptyState(visibleCount) {
        const notizieList = document.getElementById('notizieList');
        let emptyState = notizieList ? notizieList.querySelector('.empty-state.filter-empty') : null;
        
        if (visibleCount === 0 && this.notizieCards.length > 0) {
            if (!emptyState) {
                emptyState = document.createElement('div');
                emptyState.className = 'empty-state filter-empty';
                emptyState.innerHTML = `
                    <div class="empty-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h2 class="empty-title">Nessun risultato trovato</h2>
                    <p class="empty-text">
                        Prova a modificare i filtri di ricerca.
                    </p>
                    <button class="btn btn-outline-secondary" onclick="gestioneNotizie.clearAllFilters()">
                        <i class="bi bi-x-circle"></i> Rimuovi filtri
                    </button>
                `;
                if (notizieList) notizieList.appendChild(emptyState);
            }
            emptyState.style.display = 'block';
        } else if (emptyState) {
            emptyState.style.display = 'none';
        }
    }

    sortNotizie() {
        const sortFilter = document.getElementById('sortFilter');
        const sortValue = sortFilter ? sortFilter.value : 'data-desc';
        const notizieList = document.getElementById('notizieList');
        
        if (!notizieList) return;

        const cards = Array.from(this.notizieCards);

        cards.sort((a, b) => {
            if (sortValue === 'data-desc' || sortValue === 'data-asc') {
                const dateA = new Date(a.dataset.data || 0);
                const dateB = new Date(b.dataset.data || 0);
                return sortValue === 'data-desc' ? dateB - dateA : dateA - dateB;
            } else if (sortValue === 'titolo-asc' || sortValue === 'titolo-desc') {
                const titleA = (a.dataset.titolo || '').toLowerCase();
                const titleB = (b.dataset.titolo || '').toLowerCase();
                return sortValue === 'titolo-asc' ? 
                    titleA.localeCompare(titleB) : 
                    titleB.localeCompare(titleA);
            }
            return 0;
        });

        cards.forEach(card => notizieList.appendChild(card));
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
        
        if (totalCount) {
            totalCount.textContent = this.notizieCards.length;
        }
    }

    modificaNotizia(id) {
        // Reindirizza alla pagina di modifica notizia
        window.location.href = `/notizie/edit/${id}`;
    }

    async eliminaNotizia(id) {
        if (window.ShowModal) {
            window.ShowModal.modalDelete('Sei sicuro di voler eliminare questa notizia? Questa azione non può essere annullata.', 'Conferma eliminazione');

            const confirmBtn = document.getElementById('confirmDeleteBtn');
            if (confirmBtn) {
                const handleDelete = async () => {
                    confirmBtn.removeEventListener('click', handleDelete); // Evita click multipli

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

                            // Chiudi il modal
                            const modal = document.getElementById('modalDelete');
                            if (modal) {
                                const bsModal = bootstrap.Modal.getInstance(modal);
                                if (bsModal) bsModal.hide();
                            }
                        } else {
                            this.showAlert('Errore nell\'eliminazione: ' + (result.error || 'Errore sconosciuto'), 'danger');
                        }
                    } catch (error) {
                        console.error('Errore:', error);
                        this.showAlert('Errore di connessione', 'danger');
                    }
                };

                confirmBtn.addEventListener('click', handleDelete);
            }
        } else {
            // Fallback al confirm se ShowModal non è disponibile
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
        if (window.ShowModal) {
            switch (type) {
                case 'success':
                    window.ShowModal.showModalSuccess('Operazione completata', message);
                    break;
                case 'danger':
                    window.ShowModal.showModalError(message, 'Errore');
                    break;
                case 'warning':
                    window.ShowModal.showModalInfo(message, 'Attenzione');
                    break;
                default:
                    window.ShowModal.showModalInfo(message, 'Informazione');
            }
        } else {
            // Prefer global ToastManager when available
            try {
                if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
                    const tm = window.AdminGlobal.ToastManager;
                    switch (type) {
                        case 'success': tm.success(message); break;
                        case 'danger':
                        case 'error': tm.error(message); break;
                        case 'warning': tm.warning(message); break;
                        default: tm.info(message); break;
                    }
                    return;
                }
                if (typeof toastManager !== 'undefined') {
                    const tm = toastManager;
                    switch (type) {
                        case 'success': tm.success(message); break;
                        case 'danger':
                        case 'error': tm.error(message); break;
                        case 'warning': tm.warning(message); break;
                        default: tm.info(message); break;
                    }
                    return;
                }
            } catch (e) {
                console.warn('ToastManager non disponibile, uso fallback DOM alert', e);
            }

            // Fallback original DOM alert
            const existingAlerts = document.querySelectorAll('.alert');
            existingAlerts.forEach(alert => alert.remove());

            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
            alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
            alert.innerHTML = `
                <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;

            document.body.appendChild(alert);

            setTimeout(() => {
                if (alert.parentNode) alert.remove();
            }, 5000);
        }
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

// Wrapper globale per compatibilità con i button inline nella view
window.clearAllFilters = function() {
    if (typeof gestioneNotizie !== 'undefined' && gestioneNotizie && typeof gestioneNotizie.clearAllFilters === 'function') {
        gestioneNotizie.clearAllFilters();
    }
};