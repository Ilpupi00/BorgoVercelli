class GestionePrenotazione {
    constructor() {
        this.tableBody = document.querySelector('tbody');
        this.searchInput = document.getElementById('searchInput');
        this.filterButtons = document.querySelectorAll('.btn-modern');
        this.modal = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkScadute();
    }

    setupEventListeners() {
        // Search
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.filterTable());
        }

        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.textContent.trim().toLowerCase();
                if (action.includes('confermate')) this.filterByStatus('confermata');
                else if (action.includes('attesa')) this.filterByStatus('in_attesa');
                else if (action.includes('annullate')) this.filterByStatus('annullata');
                else if (action.includes('scadute')) this.filterByStatus('scaduta');
                else this.showAll();
            });
        });

        // Action buttons (delegated) - use dataset.id for prenotazione ID
        console.log('[GestionePrenotazione] setupEventListeners: registering document click handler');
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) {
                if (e.target.id === 'deleteScaduteBtn') {
                    console.log('[GestionePrenotazione] click on non-button element with id deleteScaduteBtn');
                    this.deleteScadute();
                }
                return;
            }
            // Debug info
            console.log('[GestionePrenotazione] button clicked:', { id: btn.id, classes: btn.className, title: btn.title, dataId: btn.dataset.id });
            
            const id = btn.dataset.id;
            const title = btn.title;
            
            if (btn.classList.contains('btn-outline-primary') && title === 'Visualizza') {
                if (id) this.visualizzaPrenotazione(id);
            } else if (btn.classList.contains('btn-outline-success') && (title === 'Conferma' || title === 'Riattiva')) {
                if (id) {
                    if (title === 'Riattiva') {
                        this.riattivaPrenotazione(id);
                    } else {
                        this.confermaPrenotazione(id);
                    }
                }
            } else if (btn.classList.contains('btn-outline-danger') && title === 'Annulla') {
                if (id) this.annullaPrenotazione(id);
            } else if (btn.classList.contains('btn-outline-warning') && title === 'Modifica') {
                if (id) this.modificaPrenotazione(id);
            } else if (btn.classList.contains('btn-outline-danger') && title === 'Elimina') {
                if (id) this.eliminaPrenotazione(id);
            } else if (btn.id === 'deleteScaduteBtn') {
                console.log('[GestionePrenotazione] detected deleteScaduteBtn click');
                this.deleteScadute();
            }
        });
    }

    async checkScadute() {
        try {
            const response = await fetch('/prenotazione/prenotazioni/check-scadute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            if (result.success) {
                console.log(`Aggiornate ${result.updated} prenotazioni scadute`);
                this.refreshTable();
            }
        } catch (error) {
            console.error('Errore nel controllo scadute:', error);
        }
    }

    async refreshTable() {
        try {
            const response = await fetch('/admin/prenotazioni');
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newTableBody = doc.querySelector('tbody');
            if (newTableBody) {
                this.tableBody.innerHTML = newTableBody.innerHTML;
            }
            // Gli event listener sono già registrati sul document tramite event delegation,
            // quindi non serve ri-aggiungerli
        } catch (error) {
            console.error('Errore nel refresh della tabella:', error);
        }
    }

    filterTable() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const rows = this.tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    filterByStatus(status) {
        const rows = this.tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const statusCell = row.querySelector('td:nth-child(8)');
            if (statusCell) {
                const badge = statusCell.querySelector('.badge');
                const rowStatus = badge ? badge.textContent.toLowerCase().replace(' ', '_') : '';
                row.style.display = rowStatus === status ? '' : 'none';
            }
        });
    }

    showAll() {
        const rows = this.tableBody.querySelectorAll('tr');
        rows.forEach(row => row.style.display = '');
    }

    async visualizzaPrenotazione(id) {
        try {
            const response = await fetch(`/prenotazione/prenotazioni/${id}`);
            const prenotazione = await response.json();
            if (window.ShowModal && typeof window.ShowModal.showModalInfo === 'function') {
                // showModalInfo expects (msg, string) where string is title
                await window.ShowModal.showModalInfo(this.createDetailsHTML(prenotazione), 'Dettagli Prenotazione');
            } else {
                this.showModal('Dettagli Prenotazione', this.createDetailsHTML(prenotazione));
            }
        } catch (error) {
            if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') {
                window.ShowModal.showModalError('Errore nel caricamento dei dettagli', 'Errore');
            } else {
                alert('Errore nel caricamento dei dettagli');
            }
        }
    }

    async confermaPrenotazione(id) {
        if (window.ShowModal && typeof window.ShowModal.modalConfirm === 'function') {
            const confirmed = await window.ShowModal.modalConfirm('Vuoi confermare questa prenotazione?', 'Conferma prenotazione', 'Conferma', 'btn-success', 'bi-check-circle-fill', 'text-success');
            
            if (!confirmed) return;

            try {
                const response = await fetch(`/prenotazione/prenotazioni/${id}/stato`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stato: 'confermata' })
                });
                const result = await response.json();
                if (result.success) {
                    if (window.ShowModal && typeof window.ShowModal.showModalSuccess === 'function') {
                        window.ShowModal.showModalSuccess('Prenotazione confermata', 'La prenotazione è stata confermata con successo');
                    }
                    this.refreshTable();
                } else if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') {
                    window.ShowModal.showModalError('Errore nella conferma', 'Errore');
                }
            } catch (error) {
                if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') window.ShowModal.showModalError('Errore nella conferma', 'Errore');
            }
        } else {
            if (confirm('Confermare questa prenotazione?')) {
                try {
                    const response = await fetch(`/prenotazione/prenotazioni/${id}/stato`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ stato: 'confermata' })
                    });
                    const result = await response.json();
                    if (result.success) this.refreshTable();
                } catch (error) {
                    alert('Errore nella conferma');
                }
            }
        }
    }

    async annullaPrenotazione(id) {
        if (window.ShowModal && typeof window.ShowModal.modalConfirm === 'function') {
            const confirmed = await window.ShowModal.modalConfirm('Vuoi annullare questa prenotazione?', 'Annulla prenotazione', 'Annulla', 'btn-danger', 'bi-x-circle-fill', 'text-danger');
            
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
                    this.refreshTable();
                } else if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') {
                    window.ShowModal.showModalError('Errore nell\'annullamento', 'Errore');
                }
            } catch (error) {
                if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') window.ShowModal.showModalError('Errore nell\'annullamento', 'Errore');
            }
        } else {
            if (confirm('Annullare questa prenotazione?')) {
                try {
                    const response = await fetch(`/prenotazione/prenotazioni/${id}/stato`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ stato: 'annullata' })
                    });
                    const result = await response.json();
                    if (result.success) this.refreshTable();
                } catch (error) {
                    alert('Errore nell\'annullamento');
                }
            }
        }
    }

    async riattivaPrenotazione(id) {
        if (window.ShowModal && typeof window.ShowModal.modalConfirm === 'function') {
            const confirmed = await window.ShowModal.modalConfirm('Vuoi riattivare questa prenotazione? Verrà impostata come "In Attesa".', 'Riattiva prenotazione', 'Riattiva', 'btn-success', 'bi-arrow-counterclockwise', 'text-success');
            
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
                    this.refreshTable();
                } else if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') {
                    window.ShowModal.showModalError('Errore nella riattivazione', 'Errore');
                }
            } catch (error) {
                if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') window.ShowModal.showModalError('Errore nella riattivazione', 'Errore');
            }
        } else {
            if (confirm('Riattivare questa prenotazione?')) {
                try {
                    const response = await fetch(`/prenotazione/prenotazioni/${id}/stato`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ stato: 'in_attesa' })
                    });
                    const result = await response.json();
                    if (result.success) this.refreshTable();
                } catch (error) {
                    alert('Errore nella riattivazione');
                }
            }
        }
    }

    async modificaPrenotazione(id) {
        try {
            const response = await fetch(`/prenotazione/prenotazioni/${id}`);
            const prenotazione = await response.json();
            this.showModal('Modifica Prenotazione', this.createEditHTML(prenotazione), true, async () => {
                const formData = new FormData(document.getElementById('editForm'));
                const data = Object.fromEntries(formData);
                try {
                    const updateResponse = await fetch(`/prenotazione/prenotazioni/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    const result = await updateResponse.json();
                    if (result.success) {
                        this.refreshTable();
                        this.closeModal();
                    } else {
                        alert('Errore nella modifica');
                    }
                } catch (error) {
                    alert('Errore nella modifica');
                }
            });
        } catch (error) {
            alert('Errore nel caricamento dei dati');
        }
    }

    async eliminaPrenotazione(id) {
        if (window.ShowModal && typeof window.ShowModal.modalDelete === 'function') {
            const confirmed = await window.ShowModal.modalDelete('Sei sicuro di voler eliminare questa prenotazione? Questa operazione è irreversibile.','Elimina prenotazione');
            if (!confirmed) return;
            
            try {
                const response = await fetch(`/prenotazione/prenotazioni/${id}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                if (result.success) {
                    if (window.ShowModal && typeof window.ShowModal.showModalSuccess === 'function') {
                        window.ShowModal.showModalSuccess('Prenotazione eliminata', 'La prenotazione è stata eliminata con successo');
                    }
                    this.refreshTable();
                } else if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') {
                    window.ShowModal.showModalError('Errore nell\'eliminazione', 'Errore');
                }
            } catch (error) {
                if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') {
                    window.ShowModal.showModalError('Errore nell\'eliminazione della prenotazione', 'Errore');
                }
            }
        } else {
            if (confirm('Eliminare definitivamente questa prenotazione?')) {
                try {
                    const response = await fetch(`/prenotazione/prenotazioni/${id}`, {
                        method: 'DELETE'
                    });
                    const result = await response.json();
                    if (result.success) this.refreshTable();
                } catch (error) {
                    alert('Errore nell\'eliminazione');
                }
            }
        }
    }

    async deleteScadute() {
        if (window.ShowModal && typeof window.ShowModal.modalDelete === 'function') {
            const confirmed = await window.ShowModal.modalDelete('Eliminare tutte le prenotazioni scadute? Questa operazione è irreversibile.','Elimina prenotazioni scadute');
            if (!confirmed) return;
            
            try {
                console.log('[GestionePrenotazione] deleteScadute: calling check-scadute');
                try {
                    const checkResp = await fetch('/prenotazione/prenotazioni/check-scadute', { method: 'POST' });
                    console.log('[GestionePrenotazione] check-scadute status:', checkResp.status);
                    const checkJson = await checkResp.json().catch(e => { console.warn('check-scadute json parse failed', e); return null; });
                    console.log('[GestionePrenotazione] check-scadute response json:', checkJson);
                } catch (e) {
                    console.warn('[GestionePrenotazione] check-scadute fetch failed', e);
                }
                
                console.log('[GestionePrenotazione] deleteScadute: calling DELETE /prenotazione/prenotazioni/scadute');
                const response = await fetch('/prenotazione/prenotazioni/scadute', { method: 'DELETE' });
                console.log('[GestionePrenotazione] DELETE scadute status:', response.status);
                const result = await response.json().catch(e => { console.warn('delete scadute json parse failed', e); return null; });
                console.log('[GestionePrenotazione] DELETE scadute result:', result);
                
                if (result && result.success) {
                    // Gestisce sia 'deleted' che 'actualChanges' per compatibilità
                    const deletedCount = result.deleted || result.actualChanges || result.changes || result.countBefore || 0;
                    if (window.ShowModal && typeof window.ShowModal.showModalSuccess === 'function') {
                        window.ShowModal.showModalSuccess('Eliminazione completata', `Eliminate ${deletedCount} prenotazioni scadute`);
                    } else {
                        alert(`Eliminate ${deletedCount} prenotazioni scadute`);
                    }
                    await this.refreshTable();
                } else {
                    console.warn('[GestionePrenotazione] deleteScadute did not return success:', result);
                    if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') {
                        window.ShowModal.showModalError('Errore nell\'eliminazione', 'Errore');
                    } else {
                        alert('Errore nell\'eliminazione');
                    }
                }
            } catch (error) {
                console.error('[GestionePrenotazione] deleteScadute handler error', error);
                if (window.ShowModal && typeof window.ShowModal.showModalError === 'function') {
                    window.ShowModal.showModalError('Errore nell\'eliminazione delle prenotazioni', 'Errore');
                } else {
                    alert('Errore nell\'eliminazione');
                }
            }
        } else {
            if (confirm('Eliminare tutte le prenotazioni scadute?')) {
                try {
                    try { await fetch('/prenotazione/prenotazioni/check-scadute', { method: 'POST' }); } catch(e) { console.warn('check-scadute fallito', e); }
                    const response = await fetch('/prenotazione/prenotazioni/scadute', { method: 'DELETE' });
                    const result = await response.json();
                    if (result.success) {
                        const deletedCount = result.deleted || result.actualChanges || result.changes || result.countBefore || 0;
                        alert(`Eliminate ${deletedCount} prenotazioni scadute`);
                        this.refreshTable();
                    }
                } catch (error) {
                    alert('Errore nell\'eliminazione');
                }
            }
        }
    }

    createDetailsHTML(prenotazione) {
        return `
            <p><strong>ID:</strong> ${prenotazione.id}</p>
            <p><strong>Campo:</strong> ${prenotazione.campo_nome}</p>
            <p><strong>Utente:</strong> ${prenotazione.utente_nome} ${prenotazione.utente_cognome}</p>
            <p><strong>Squadra:</strong> ${prenotazione.squadra_nome || '-'}</p>
            <p><strong>Data:</strong> ${new Date(prenotazione.data_prenotazione).toLocaleDateString('it-IT')}</p>
            <p><strong>Orario:</strong> ${prenotazione.ora_inizio} - ${prenotazione.ora_fine}</p>
            <p><strong>Tipo Attività:</strong> ${prenotazione.tipo_attivita || '-'}</p>
            <p><strong>Note:</strong> ${prenotazione.note || '-'}</p>
            <p><strong>Stato:</strong> ${prenotazione.stato}</p>
        `;
    }

    createEditHTML(prenotazione) {
        return `
            <form id="editForm">
                <div class="mb-3">
                    <label for="campo_id" class="form-label">Campo ID</label>
                    <input type="number" class="form-control" id="campo_id" name="campo_id" value="${prenotazione.campo_id}" required>
                </div>
                <div class="mb-3">
                    <label for="data_prenotazione" class="form-label">Data</label>
                    <input type="date" class="form-control" id="data_prenotazione" name="data_prenotazione" value="${prenotazione.data_prenotazione}" required>
                </div>
                <div class="mb-3">
                    <label for="ora_inizio" class="form-label">Ora Inizio</label>
                    <input type="time" class="form-control" id="ora_inizio" name="ora_inizio" value="${prenotazione.ora_inizio}" required>
                </div>
                <div class="mb-3">
                    <label for="ora_fine" class="form-label">Ora Fine</label>
                    <input type="time" class="form-control" id="ora_fine" name="ora_fine" value="${prenotazione.ora_fine}" required>
                </div>
                <div class="mb-3">
                    <label for="tipo_attivita" class="form-label">Tipo Attività</label>
                    <input type="text" class="form-control" id="tipo_attivita" name="tipo_attivita" value="${prenotazione.tipo_attivita || ''}">
                </div>
                <div class="mb-3">
                    <label for="note" class="form-label">Note</label>
                    <textarea class="form-control" id="note" name="note">${prenotazione.note || ''}</textarea>
                </div>
            </form>
        `;
    }

    showModal(title, content, hasSave = false, saveCallback = null) {
        const modalHTML = `
            <div class="modal fade" id="dynamicModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                            ${hasSave ? '<button type="button" class="btn btn-primary" id="saveBtn">Salva</button>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = new bootstrap.Modal(document.getElementById('dynamicModal'));
        this.modal.show();

        if (hasSave && saveCallback) {
            document.getElementById('saveBtn').addEventListener('click', saveCallback);
        }

        document.getElementById('dynamicModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('dynamicModal').remove();
        });
    }

    closeModal() {
        if (this.modal) {
            this.modal.hide();
        }
    }
}

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    new GestionePrenotazione();
});