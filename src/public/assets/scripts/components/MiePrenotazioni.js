class MiePrenotazioni {
    constructor() {
        this.prenotazioni = [];
        this.filteredPrenotazioni = [];
        this.currentFilter = 'all';
        this.searchInput = document.getElementById('searchInput');
        this.prenotazioniCards = document.getElementById('prenotazioniCards');
        this.loadingState = document.getElementById('loadingState');
        this.emptyState = document.getElementById('emptyState');
        this.filterButtons = document.querySelectorAll('[data-filter]');
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadPrenotazioni();
    }

    setupEventListeners() {
        // Search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.filterPrenotazioni());
        }

        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                this.filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Apply filter
                this.currentFilter = btn.dataset.filter;
                this.filterPrenotazioni();
            });
        });
    }

    async loadPrenotazioni() {
        try {
            this.showLoading();
            
            // Get user ID from the page context (could be passed via data attribute)
            const userId = document.body.dataset.userId;
            
            if (!userId) {
                throw new Error('User ID not found');
            }

            const response = await fetch(`/prenotazione/user/${userId}`);
            
            if (!response.ok) {
                throw new Error('Failed to load prenotazioni');
            }

            this.prenotazioni = await response.json();
            this.filteredPrenotazioni = [...this.prenotazioni];
            
            this.updateStats();
            this.renderPrenotazioni();
            
        } catch (error) {
            console.error('Error loading prenotazioni:', error);
            this.showError('Errore nel caricamento delle prenotazioni');
        }
    }

    showLoading() {
        this.loadingState.style.display = 'block';
        this.emptyState.style.display = 'none';
        this.prenotazioniCards.innerHTML = '';
    }

    showError(message) {
        this.loadingState.style.display = 'none';
        this.prenotazioniCards.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger" role="alert">
                    <i class="bi bi-exclamation-triangle me-2"></i>${message}
                </div>
            </div>
        `;
    }

    updateStats() {
        const stats = {
            confermata: 0,
            in_attesa: 0,
            annullata: 0,
            scaduta: 0
        };

        this.prenotazioni.forEach(p => {
            if (stats.hasOwnProperty(p.stato)) {
                stats[p.stato]++;
            }
        });

        document.getElementById('countConfermata').textContent = stats.confermata;
        document.getElementById('countInAttesa').textContent = stats.in_attesa;
        document.getElementById('countAnnullata').textContent = stats.annullata;
        document.getElementById('countScaduta').textContent = stats.scaduta;
    }

    filterPrenotazioni() {
        const searchTerm = this.searchInput.value.toLowerCase();
        
        this.filteredPrenotazioni = this.prenotazioni.filter(prenotazione => {
            // Filter by status
            const statusMatch = this.currentFilter === 'all' || prenotazione.stato === this.currentFilter;
            
            // Filter by search term
            const searchMatch = !searchTerm || 
                (prenotazione.campo_nome && prenotazione.campo_nome.toLowerCase().includes(searchTerm)) ||
                (prenotazione.data_prenotazione && prenotazione.data_prenotazione.includes(searchTerm)) ||
                (prenotazione.ora_inizio && prenotazione.ora_inizio.includes(searchTerm)) ||
                (prenotazione.ora_fine && prenotazione.ora_fine.includes(searchTerm)) ||
                (prenotazione.tipo_attivita && prenotazione.tipo_attivita.toLowerCase().includes(searchTerm));
            
            return statusMatch && searchMatch;
        });

        this.renderPrenotazioni();
    }

    renderPrenotazioni() {
        this.loadingState.style.display = 'none';
        
        if (this.filteredPrenotazioni.length === 0) {
            this.emptyState.style.display = 'block';
            this.prenotazioniCards.innerHTML = '';
            return;
        }

        this.emptyState.style.display = 'none';
        this.prenotazioniCards.innerHTML = this.filteredPrenotazioni.map(prenotazione => 
            this.createPrenotazioneCard(prenotazione)
        ).join('');

        // Attach event listeners to action buttons
        this.attachCardEventListeners();
    }

    createPrenotazioneCard(prenotazione) {
        const dataFormatted = prenotazione.data_prenotazione ? 
            new Date(prenotazione.data_prenotazione).toLocaleDateString('it-IT', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : '-';

        const statusBadge = this.getStatusBadge(prenotazione.stato);
        const statusClass = this.getStatusClass(prenotazione.stato);
        const actionButtons = this.getActionButtons(prenotazione);

        return `
            <div class="col-lg-6 mb-4">
                <div class="prenotazione-card ${statusClass} animate__animated animate__fadeIn">
                    <div class="card-header-custom">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">
                                <i class="bi bi-geo-alt-fill me-2"></i>
                                ${prenotazione.campo_nome || 'Campo ' + prenotazione.campo_id}
                            </h5>
                            ${statusBadge}
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="prenotazione-info">
                            <div class="info-item">
                                <i class="bi bi-calendar3 text-primary"></i>
                                <div class="info-content">
                                    <span class="info-label">Data</span>
                                    <span class="info-value">${dataFormatted}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <i class="bi bi-clock text-primary"></i>
                                <div class="info-content">
                                    <span class="info-label">Orario</span>
                                    <span class="info-value">${prenotazione.ora_inizio} - ${prenotazione.ora_fine}</span>
                                </div>
                            </div>
                            ${prenotazione.tipo_attivita ? `
                            <div class="info-item">
                                <i class="bi bi-activity text-primary"></i>
                                <div class="info-content">
                                    <span class="info-label">Attività</span>
                                    <span class="info-value">${prenotazione.tipo_attivita}</span>
                                </div>
                            </div>
                            ` : ''}
                            ${prenotazione.squadra_nome ? `
                            <div class="info-item">
                                <i class="bi bi-people-fill text-primary"></i>
                                <div class="info-content">
                                    <span class="info-label">Squadra</span>
                                    <span class="info-value">${prenotazione.squadra_nome}</span>
                                </div>
                            </div>
                            ` : ''}
                            ${prenotazione.note ? `
                            <div class="info-item">
                                <i class="bi bi-sticky text-primary"></i>
                                <div class="info-content">
                                    <span class="info-label">Note</span>
                                    <span class="info-value">${prenotazione.note}</span>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                        <div class="card-actions mt-3">
                            ${actionButtons}
                        </div>
                    </div>
                    <div class="card-footer-custom">
                        <small class="text-muted">
                            <i class="bi bi-clock-history me-1"></i>
                            Prenotata il ${new Date(prenotazione.created_at).toLocaleDateString('it-IT')}
                        </small>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusBadge(stato) {
        const badges = {
            'confermata': '<span class="status-badge status-confermata"><i class="bi bi-check-circle-fill me-1"></i>Confermata</span>',
            'in_attesa': '<span class="status-badge status-attesa"><i class="bi bi-clock-fill me-1"></i>In Attesa</span>',
            'annullata': '<span class="status-badge status-annullata"><i class="bi bi-x-circle-fill me-1"></i>Annullata</span>',
            'scaduta': '<span class="status-badge status-scaduta"><i class="bi bi-calendar-x-fill me-1"></i>Scaduta</span>'
        };
        return badges[stato] || `<span class="status-badge">${stato}</span>`;
    }

    getStatusClass(stato) {
        return `status-${stato}`;
    }

    getActionButtons(prenotazione) {
        const buttons = [];
        
        // View details button (always available)
        buttons.push(`
            <button class="btn btn-outline-primary btn-sm" data-action="view" data-id="${prenotazione.id}">
                <i class="bi bi-eye me-1"></i>Dettagli
            </button>
        `);

        // State change buttons based on current state
        if (prenotazione.stato === 'confermata' || prenotazione.stato === 'in_attesa') {
            buttons.push(`
                <button class="btn btn-outline-danger btn-sm" data-action="cancel" data-id="${prenotazione.id}">
                    <i class="bi bi-x-circle me-1"></i>Annulla
                </button>
            `);
        }

        if (prenotazione.stato === 'annullata') {
            buttons.push(`
                <button class="btn btn-outline-success btn-sm" data-action="reactivate" data-id="${prenotazione.id}">
                    <i class="bi bi-arrow-counterclockwise me-1"></i>Riattiva
                </button>
            `);
        }

        // Delete button for expired bookings
        if (prenotazione.stato === 'scaduta') {
            buttons.push(`
                <button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${prenotazione.id}">
                    <i class="bi bi-trash me-1"></i>Elimina
                </button>
            `);
        }

        return buttons.join('');
    }

    attachCardEventListeners() {
        // View details
        document.querySelectorAll('[data-action="view"]').forEach(btn => {
            btn.addEventListener('click', () => this.viewDetails(btn.dataset.id));
        });

        // Cancel prenotazione
        document.querySelectorAll('[data-action="cancel"]').forEach(btn => {
            btn.addEventListener('click', () => this.cancelPrenotazione(btn.dataset.id));
        });

        // Reactivate prenotazione
        document.querySelectorAll('[data-action="reactivate"]').forEach(btn => {
            btn.addEventListener('click', () => this.reactivatePrenotazione(btn.dataset.id));
        });

        // Delete prenotazione
        document.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => this.deletePrenotazione(btn.dataset.id));
        });
    }

    async viewDetails(id) {
        const prenotazione = this.prenotazioni.find(p => p.id == id);
        if (!prenotazione) return;

        const dataFormatted = new Date(prenotazione.data_prenotazione).toLocaleDateString('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const detailsHTML = `
            <div class="prenotazione-details">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <strong><i class="bi bi-hash text-primary me-2"></i>ID Prenotazione:</strong>
                        <p class="mb-0">${prenotazione.id}</p>
                    </div>
                    <div class="col-md-6 mb-3">
                        <strong><i class="bi bi-geo-alt-fill text-primary me-2"></i>Campo:</strong>
                        <p class="mb-0">${prenotazione.campo_nome || 'Campo ' + prenotazione.campo_id}</p>
                    </div>
                    <div class="col-md-6 mb-3">
                        <strong><i class="bi bi-calendar3 text-primary me-2"></i>Data:</strong>
                        <p class="mb-0">${dataFormatted}</p>
                    </div>
                    <div class="col-md-6 mb-3">
                        <strong><i class="bi bi-clock text-primary me-2"></i>Orario:</strong>
                        <p class="mb-0">${prenotazione.ora_inizio} - ${prenotazione.ora_fine}</p>
                    </div>
                    ${prenotazione.tipo_attivita ? `
                    <div class="col-md-6 mb-3">
                        <strong><i class="bi bi-activity text-primary me-2"></i>Tipo Attività:</strong>
                        <p class="mb-0">${prenotazione.tipo_attivita}</p>
                    </div>
                    ` : ''}
                    ${prenotazione.squadra_nome ? `
                    <div class="col-md-6 mb-3">
                        <strong><i class="bi bi-people-fill text-primary me-2"></i>Squadra:</strong>
                        <p class="mb-0">${prenotazione.squadra_nome}</p>
                    </div>
                    ` : ''}
                    <div class="col-md-6 mb-3">
                        <strong><i class="bi bi-flag text-primary me-2"></i>Stato:</strong>
                        <p class="mb-0">${this.getStatusBadge(prenotazione.stato)}</p>
                    </div>
                    <div class="col-md-6 mb-3">
                        <strong><i class="bi bi-clock-history text-primary me-2"></i>Creata il:</strong>
                        <p class="mb-0">${new Date(prenotazione.created_at).toLocaleDateString('it-IT')}</p>
                    </div>
                    ${prenotazione.note ? `
                    <div class="col-12 mb-3">
                        <strong><i class="bi bi-sticky text-primary me-2"></i>Note:</strong>
                        <p class="mb-0">${prenotazione.note}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        if (window.ShowModal && typeof window.ShowModal.showModalInfo === 'function') {
            window.ShowModal.showModalInfo(detailsHTML, 'Dettagli Prenotazione');
        }
    }

    async cancelPrenotazione(id) {
        if (window.ShowModal && typeof window.ShowModal.modalConfirm === 'function') {
            const confirmed = await window.ShowModal.modalConfirm(
                'Sei sicuro di voler annullare questa prenotazione?',
                'Annulla Prenotazione',
                'Annulla Prenotazione',
                'btn-danger',
                'bi-x-circle-fill',
                'text-danger'
            );

            if (!confirmed) return;

            try {
                const response = await fetch(`/prenotazione/prenotazioni/${id}/stato`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stato: 'annullata' })
                });

                const result = await response.json();
                
                if (result.success) {
                    if (window.ShowModal && typeof window.ShowModal.showModalSuccess === 'function') {
                        window.ShowModal.showModalSuccess('Prenotazione annullata', 'La prenotazione è stata annullata con successo');
                    }
                    await this.loadPrenotazioni();
                } else {
                    if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') {
                        window.ShowModal.showModalError('Impossibile annullare la prenotazione', 'Errore');
                    }
                }
            } catch (error) {
                console.error('Error canceling prenotazione:', error);
                if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') {
                    window.ShowModal.showModalError('Errore durante l\'annullamento della prenotazione', 'Errore');
                }
            }
        }
    }

    async reactivatePrenotazione(id) {
        if (window.ShowModal && typeof window.ShowModal.modalConfirm === 'function') {
            const confirmed = await window.ShowModal.modalConfirm(
                'Vuoi riattivare questa prenotazione? Verrà impostata come "In Attesa".',
                'Riattiva Prenotazione',
                'Riattiva',
                'btn-success',
                'bi-arrow-counterclockwise',
                'text-success'
            );

            if (!confirmed) return;

            try {
                const response = await fetch(`/prenotazione/prenotazioni/${id}/stato`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stato: 'in_attesa' })
                });

                const result = await response.json();
                
                if (result.success) {
                    if (window.ShowModal && typeof window.ShowModal.showModalSuccess === 'function') {
                        window.ShowModal.showModalSuccess('Prenotazione riattivata', 'La prenotazione è stata riattivata con successo');
                    }
                    await this.loadPrenotazioni();
                } else {
                    if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') {
                        window.ShowModal.showModalError('Impossibile riattivare la prenotazione', 'Errore');
                    }
                }
            } catch (error) {
                console.error('Error reactivating prenotazione:', error);
                if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') {
                    window.ShowModal.showModalError('Errore durante la riattivazione della prenotazione', 'Errore');
                }
            }
        }
    }

    async deletePrenotazione(id) {
        if (window.ShowModal && typeof window.ShowModal.modalDelete === 'function') {
            const confirmed = await window.ShowModal.modalDelete(
                'Sei sicuro di voler eliminare definitivamente questa prenotazione?',
                'Questa azione non può essere annullata.'
            );

            if (!confirmed) return;

            try {
                const response = await fetch(`/prenotazione/prenotazioni/${id}`, {
                    method: 'DELETE'
                });

                const result = await response.json();
                
                if (result.success) {
                    if (window.ShowModal && typeof window.ShowModal.showModalSuccess === 'function') {
                        window.ShowModal.showModalSuccess('Prenotazione eliminata', 'La prenotazione è stata eliminata definitivamente');
                    }
                    await this.loadPrenotazioni();
                } else {
                    if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') {
                        window.ShowModal.showModalError('Impossibile eliminare la prenotazione', 'Errore');
                    }
                }
            } catch (error) {
                console.error('Error deleting prenotazione:', error);
                if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') {
                    window.ShowModal.showModalError('Errore durante l\'eliminazione della prenotazione', 'Errore');
                }
            }
        }
    }
}

// Expose to window for non-module usage
window.MiePrenotazioni = MiePrenotazioni;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MiePrenotazioni();
});
