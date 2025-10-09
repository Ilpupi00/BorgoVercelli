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
                const action = e.target.textContent.trim().toLowerCase();
                if (action.includes('confermate')) this.filterByStatus('confermata');
                else if (action.includes('attesa')) this.filterByStatus('in_attesa');
                else if (action.includes('annullate')) this.filterByStatus('annullata');
                else if (action.includes('scadute')) this.filterByStatus('scaduta');
                else this.showAll();
            });
        });

        // Action buttons (delegated)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-outline-primary')) {
                const id = e.target.closest('tr').querySelector('td').textContent;
                this.visualizzaPrenotazione(id);
            } else if (e.target.closest('.btn-outline-success')) {
                const id = e.target.closest('tr').querySelector('td').textContent;
                this.confermaPrenotazione(id);
            } else if (e.target.closest('.btn-outline-danger') && e.target.title === 'Annulla') {
                const id = e.target.closest('tr').querySelector('td').textContent;
                this.annullaPrenotazione(id);
            } else if (e.target.closest('.btn-outline-warning')) {
                const id = e.target.closest('tr').querySelector('td').textContent;
                this.modificaPrenotazione(id);
            } else if (e.target.closest('.btn-outline-danger') && e.target.title === 'Elimina') {
                const id = e.target.closest('tr').querySelector('td').textContent;
                this.eliminaPrenotazione(id);
            } else if (e.target.id === 'deleteScaduteBtn') {
                this.deleteScadute();
            }
        });
    }

    async checkScadute() {
        try {
            const response = await fetch('/prenotazioni/check-scadute', {
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
            const response = await fetch(`/prenotazioni/${id}`);
            const prenotazione = await response.json();
            this.showModal('Dettagli Prenotazione', this.createDetailsHTML(prenotazione));
        } catch (error) {
            alert('Errore nel caricamento dei dettagli');
        }
    }

    async confermaPrenotazione(id) {
        if (confirm('Confermare questa prenotazione?')) {
            try {
                const response = await fetch(`/prenotazioni/${id}/stato`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stato: 'confermata' })
                });
                const result = await response.json();
                if (result.success) {
                    this.refreshTable();
                } else {
                    alert('Errore nella conferma');
                }
            } catch (error) {
                alert('Errore nella conferma');
            }
        }
    }

    async annullaPrenotazione(id) {
        if (confirm('Annullare questa prenotazione?')) {
            try {
                const response = await fetch(`/prenotazioni/${id}/stato`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stato: 'annullata' })
                });
                const result = await response.json();
                if (result.success) {
                    this.refreshTable();
                } else {
                    alert('Errore nell\'annullamento');
                }
            } catch (error) {
                alert('Errore nell\'annullamento');
            }
        }
    }

    async modificaPrenotazione(id) {
        try {
            const response = await fetch(`/prenotazioni/${id}`);
            const prenotazione = await response.json();
            this.showModal('Modifica Prenotazione', this.createEditHTML(prenotazione), true, async () => {
                const formData = new FormData(document.getElementById('editForm'));
                const data = Object.fromEntries(formData);
                try {
                    const updateResponse = await fetch(`/prenotazioni/${id}`, {
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
        if (confirm('Eliminare definitivamente questa prenotazione?')) {
            try {
                const response = await fetch(`/prenotazioni/${id}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                if (result.success) {
                    this.refreshTable();
                } else {
                    alert('Errore nell\'eliminazione');
                }
            } catch (error) {
                alert('Errore nell\'eliminazione');
            }
        }
    }

    async deleteScadute() {
        if (confirm('Eliminare tutte le prenotazioni scadute?')) {
            try {
                const response = await fetch('/prenotazioni/scadute', {
                    method: 'DELETE'
                });
                const result = await response.json();
                if (result.success) {
                    alert(`Eliminate ${result.deleted} prenotazioni scadute`);
                    this.refreshTable();
                } else {
                    alert('Errore nell\'eliminazione');
                }
            } catch (error) {
                alert('Errore nell\'eliminazione');
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