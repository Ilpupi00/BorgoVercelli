class GestioneEventi {
    constructor() {
        this.originalEventi = [];
        this.initialize();
    }

    initialize() {
        this.loadEventiData();
        this.setupEventListeners();
        console.log('Gestione eventi caricata con', this.originalEventi.length, 'eventi');
    }

    loadEventiData() {
        const rows = document.querySelectorAll('#eventiTableBody tr[data-evento-id]');
        this.originalEventi = Array.from(rows).map(row => ({
            element: row,
            id: row.dataset.eventoId,
            titolo: row.dataset.titolo || '',
            descrizione: row.dataset.descrizione || '',
            stato: row.dataset.stato || '',
            dataInizio: row.dataset.dataInizio || '',
            dataFine: row.dataset.dataFine || '',
            luogo: row.dataset.luogo || '',
            tipo: row.dataset.tipo || ''
        }));
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');
        const statusFilter = document.getElementById('statusFilter');
        const typeFilter = document.getElementById('typeFilter');
        const dateFilter = document.getElementById('dateFilter');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterEventi());
        }

        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    this.filterEventi();
                    searchInput.focus();
                }
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterEventi());
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.filterEventi());
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.filterEventi());
        }

        // Event listener per i pulsanti di modifica
        document.querySelectorAll('.btn-modifica-evento').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventoId = e.currentTarget.dataset.eventoId;
                this.modificaEvento(eventoId);
            });
        });

        // Event listener per i pulsanti di eliminazione
        document.querySelectorAll('.btn-elimina-evento').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventoId = e.currentTarget.dataset.eventoId;
                this.eliminaEvento(eventoId);
            });
        });

        // Event listener per i pulsanti di toggle pubblicazione
        document.querySelectorAll('.toggle-pubblicazione').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventoId = e.currentTarget.dataset.eventoId;
                const currentStatus = parseInt(e.currentTarget.dataset.currentStatus) === 1;
                this.togglePubblicazione(eventoId, currentStatus);
            });
        });
    }

    filterEventi() {
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const typeFilter = document.getElementById('typeFilter');
        const dateFilter = document.getElementById('dateFilter');

        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const statusValue = statusFilter ? statusFilter.value : 'all';
        const typeValue = typeFilter ? typeFilter.value : 'all';
        const dateValue = dateFilter ? dateFilter.value : 'all';

        const tableBody = document.getElementById('eventiTableBody');
        const noResultsRow = document.getElementById('noResultsRow');
        let visibleCount = 0;

        // Filtra gli eventi
        this.originalEventi.forEach(evento => {
            let isVisible = true;

            // Filtro ricerca
            if (searchTerm && !(evento.titolo.includes(searchTerm) || 
                               evento.descrizione.includes(searchTerm) || 
                               evento.luogo.includes(searchTerm) || 
                               evento.id.includes(searchTerm))) {
                isVisible = false;
            }

            // Filtro stato
            if (statusValue !== 'all' && evento.stato !== statusValue) {
                isVisible = false;
            }

            // Filtro tipo
            if (typeValue !== 'all' && evento.tipo !== typeValue) {
                isVisible = false;
            }

            // Filtro data
            if (dateValue !== 'all' && evento.dataInizio) {
                const eventoDate = new Date(evento.dataInizio);
                const now = new Date();
                let isInRange = false;

                switch(dateValue) {
                    case 'today':
                        isInRange = eventoDate.toDateString() === now.toDateString();
                        break;
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        isInRange = eventoDate >= weekAgo;
                        break;
                    case 'month':
                        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        isInRange = eventoDate >= monthAgo;
                        break;
                    case 'year':
                        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                        isInRange = eventoDate >= yearAgo;
                        break;
                    case 'upcoming':
                        isInRange = eventoDate >= now;
                        break;
                    case 'past':
                        isInRange = eventoDate < now;
                        break;
                }

                if (!isInRange) {
                    isVisible = false;
                }
            }

            // Mostra/nascondi la riga
            if (isVisible) {
                evento.element.style.display = '';
                visibleCount++;
            } else {
                evento.element.style.display = 'none';
            }
        });

        // Gestisci la riga "nessun risultato"
        if (noResultsRow) {
            if (visibleCount === 0 && this.originalEventi.length > 0) {
                noResultsRow.style.display = '';
                noResultsRow.innerHTML = `
                    <td colspan="9" class="text-center text-muted py-4">
                        <i class="bi bi-search display-4 mb-3"></i>
                        <p>Nessun evento corrisponde ai filtri selezionati.</p>
                        <button class="btn btn-outline-secondary" onclick="gestioneEventi.clearAllFilters()">Rimuovi filtri</button>
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
        const typeFilter = document.getElementById('typeFilter');
        const dateFilter = document.getElementById('dateFilter');

        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = 'all';
        if (typeFilter) typeFilter.value = 'all';
        if (dateFilter) dateFilter.value = 'all';

        this.filterEventi();
    }

    updateCounters(visibleCount) {
        const totalCount = document.getElementById('totalCount');
        const filteredCount = document.getElementById('filteredCount');

        if (totalCount) {
            totalCount.textContent = this.originalEventi.length;
        }

        if (filteredCount) {
            filteredCount.textContent = `(${visibleCount} filtrate)`;
        }
    }

    modificaEvento(id) {
        // Reindirizza alla pagina di modifica evento
        window.location.href = '/evento/crea-evento/' + id;
    }

    async eliminaEvento(id) {
        // Se è disponibile ShowModal, apri il modal di conferma personalizzato
        if (typeof ShowModal !== 'undefined' && typeof bootstrap !== 'undefined') {
            // ShowModal.modalDelete returns a Promise<boolean> that resolves when user confirms/cancels.
            // Instead of awaiting and then trying to attach handlers to a modal that ShowModal removes,
            // use the resolved value to perform the delete action.
            ShowModal.modalDelete('Sei sicuro di voler eliminare questo evento? Questa azione non può essere annullata.', 'Conferma eliminazione')
                .then(async (confirmed) => {
                    if (!confirmed) return;
                    try {
                        const response = await fetch('/evento/' + id, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include'
                        });

                        const result = await response.json().catch(() => ({}));

                        if (response.ok && result.success) {
                            // Rimuovi l'evento dall'array originale
                            this.originalEventi = this.originalEventi.filter(e => e.id !== id);

                            // Rimuovi la riga dalla tabella
                            const row = document.querySelector(`tr[data-evento-id="${id}"]`);
                            if (row) row.remove();

                            // Aggiorna i contatori
                            this.updateCounters(this.originalEventi.filter(e => e.element.style.display !== 'none').length);

                            if (typeof ShowModal !== 'undefined') {
                                await ShowModal.showModalSuccess('Eliminazione completata', 'Evento eliminato con successo!');
                            } else {
                                this.showAlert('Evento eliminato con successo!', 'success');
                            }
                        } else {
                            if (typeof ShowModal !== 'undefined') {
                                await ShowModal.showModalError(result.error || 'Errore sconosciuto', 'Errore durante l\'eliminazione');
                            } else {
                                this.showAlert('Errore nell\'eliminazione: ' + (result.error || 'Errore sconosciuto'), 'danger');
                            }
                        }
                    } catch (error) {
                        console.error('Errore:', error);
                        if (typeof ShowModal !== 'undefined') {
                            await ShowModal.showModalError('Impossibile contattare il server', 'Errore di connessione');
                        } else {
                            this.showAlert('Errore di connessione', 'danger');
                        }
                    }
                }).catch(err => {
                    console.error('Errore modalDelete promise:', err);
                });
            return;
        }

        // Fallback: comportamento precedente con confirm e alert
        if (!confirm('Sei sicuro di voler eliminare questo evento? Questa azione non può essere annullata.')) {
            return;
        }

        try {
            const response = await fetch('/evento/' + id, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Rimuovi l'evento dall'array originale
                this.originalEventi = this.originalEventi.filter(e => e.id !== id);

                // Rimuovi la riga dalla tabella
                const row = document.querySelector(`tr[data-evento-id="${id}"]`);
                if (row) {
                    row.remove();
                }

                // Aggiorna i contatori
                this.updateCounters(this.originalEventi.filter(e => e.element.style.display !== 'none').length);

                // Mostra messaggio di successo
                this.showAlert('Evento eliminato con successo!', 'success');
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

        if (typeof ShowModal !== 'undefined' && typeof bootstrap !== 'undefined') {
            ShowModal.modalConfirm(`Sei sicuro di voler ${action} questo evento?`, 'Conferma', currentStatus ? 'Sospendi' : 'Pubblica', currentStatus ? 'btn-warning' : 'btn-success', currentStatus ? 'bi-eye-slash' : 'bi-eye')
                .then(async (confirmed) => {
                    if (!confirmed) return;
                    try {
                        const response = await fetch('/evento/' + id + '/publish', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include',
                            body: JSON.stringify({ pubblicato: !currentStatus })
                        });

                        const result = await response.json().catch(() => ({}));

                        if (response.ok && result.success) {
                            if (typeof ShowModal !== 'undefined') {
                                await ShowModal.showModalSuccess(result.message || 'Operazione completata', 'Successo');
                            } else {
                                this.showAlert(result.message || 'Operazione completata', 'success');
                            }

                            // Aggiorna il badge nella tabella
                            const badge = document.querySelector(`tr[data-evento-id="${id}"] .badge`);
                            if (badge) {
                                badge.className = !currentStatus ? 'badge bg-success' : 'badge bg-warning';
                                badge.textContent = !currentStatus ? 'Pubblicato' : 'Bozza';

                                // Aggiorna anche i dati per il filtraggio
                                const evento = this.originalEventi.find(e => e.id === id);
                                if (evento) {
                                    evento.stato = !currentStatus ? 'published' : 'draft';
                                }
                            }

                            // Aggiorna l'icona e l'attributo data-current-status del bottone
                            const toggleBtn = document.querySelector(`tr[data-evento-id="${id}"] .toggle-pubblicazione`);
                            if (toggleBtn) {
                                // Aggiorna l'icona: eye <-> eye-slash
                                const icon = toggleBtn.querySelector('i');
                                if (icon) {
                                    icon.className = `bi bi-${!currentStatus ? 'eye-slash' : 'eye'}`;
                                }
                                // Aggiorna il titolo e il data-current-status
                                toggleBtn.setAttribute('data-current-status', !currentStatus ? '1' : '0');
                                toggleBtn.title = !currentStatus ? 'Sospendi' : 'Pubblica';
                            }

                        } else {
                            if (typeof ShowModal !== 'undefined') {
                                await ShowModal.showModalError(result.error || 'Errore sconosciuto', 'Errore');
                            } else {
                                this.showAlert('Errore nell\'operazione: ' + (result.error || 'Errore sconosciuto'), 'danger');
                            }
                        }
                    } catch (error) {
                        console.error('Errore:', error);
                        if (typeof ShowModal !== 'undefined') {
                            await ShowModal.showModalError('Impossibile contattare il server', 'Errore di connessione');
                        } else {
                            this.showAlert('Errore di connessione', 'danger');
                        }
                    }
                }).catch(err => {
                    console.error('Errore modalConfirm promise:', err);
                });
            return;
        }

        // Fallback sincronizzato con confirm
        if (!confirm(`Sei sicuro di voler ${action} questo evento?`)) {
            return;
        }

        try {
            const response = await fetch('/evento/' + id + '/publish', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ pubblicato: !currentStatus })
                });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showAlert(result.message, 'success');

                // Aggiorna il badge nella tabella
                const badge = document.querySelector(`tr[data-evento-id="${id}"] .badge`);
                if (badge) {
                    badge.className = currentStatus ? 'badge bg-warning' : 'badge bg-success';
                    badge.textContent = currentStatus ? 'Bozza' : 'Pubblicato';

                    // Aggiorna anche i dati per il filtraggio
                    const evento = this.originalEventi.find(e => e.id === id);
                    if (evento) {
                        evento.stato = currentStatus ? 'draft' : 'published';
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
        // Preferisci usare il ToastManager globale per coerenza e compatibilità col tema
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

        // Fallback originale se ToastManager non è disponibile
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

// Inizializza la classe quando il DOM è pronto
let gestioneEventi;
document.addEventListener('DOMContentLoaded', function() {
    gestioneEventi = new GestioneEventi();
});

// Esporta le funzioni globali per essere usate negli onclick degli elementi HTML
window.modificaEvento = function(id) {
    gestioneEventi.modificaEvento(id);
};

window.eliminaEvento = function(id) {
    gestioneEventi.eliminaEvento(id);
};

window.togglePubblicazioneEvento = function(id, currentStatus) {
    gestioneEventi.togglePubblicazione(id, currentStatus);
};