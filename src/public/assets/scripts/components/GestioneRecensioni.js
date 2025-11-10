class GestioneRecensioni {
    constructor() {
        this.init();
    }

    init() {
        // Inizializzazioni se necessarie
        this.statusFilter = 'all'; // 'all' | 'visibile' | 'nascosta'
        this.setupSearch();
        // Applica il filtro iniziale (considera ricerca vuota e stato 'all')
        this.filtraRecensioni();
    }

    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filtraRecensioni());
        }

        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                searchInput.value = '';
                this.filtraRecensioni();
            });
        }
    }

    async visualizzaRecensione(id) {
        try {
            const response = await fetch(`/admin/recensioni/${id}`);
            if (!response.ok) throw new Error('Errore nel caricamento della recensione');
            const recensione = await response.json();

            // Popola il modal
            document.getElementById('modalRecensioneId').textContent = recensione.id;
            document.getElementById('modalRecensioneUtente').textContent = `${recensione.utente_nome} ${recensione.utente_cognome}`;
            document.getElementById('modalRecensioneValutazione').innerHTML = this.renderStars(recensione.valutazione);
            document.getElementById('modalRecensioneTitolo').textContent = recensione.titolo;
            document.getElementById('modalRecensioneContenuto').textContent = recensione.contenuto;
            document.getElementById('modalRecensioneData').textContent = new Date(recensione.data_recensione).toLocaleDateString('it-IT');

            // Mostra il modal
            const modal = new bootstrap.Modal(document.getElementById('visualizzaModal'));
            modal.show();
        } catch (error) {
            this.mostraErrore('Errore nel caricamento della recensione: ' + error.message);
        }
    }

    renderStars(valutazione) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += i <= valutazione ? '<i class="bi bi-star-fill text-warning"></i>' : '<i class="bi bi-star text-muted"></i>';
        }
        return stars + ` <span>${valutazione}/5</span>`;
    }

    async toggleVisibile(id, currentStatus) {
        const newStatus = !currentStatus;
        const action = newStatus ? 'mostrare' : 'nascondere';
        // Use ShowModal modalConfirm when available to get confirmation
        if (typeof ShowModal !== 'undefined' && typeof bootstrap !== 'undefined') {
            // Determine label and style for confirm button depending on action
            const confirmLabel = newStatus ? 'Mostra' : 'Sospendi';
            const confirmClass = newStatus ? 'btn-success' : 'btn-warning';
            const iconClass = newStatus ? 'bi-eye' : 'bi-eye-slash';

            // open confirm modal
            ShowModal.modalConfirm(`Sei sicuro di voler ${action} questa recensione?`, 'Conferma', confirmLabel, confirmClass, iconClass, newStatus ? 'text-success' : 'text-warning');
            const modal = document.getElementById('modalConfirmAction');
            if (!modal) return;
            const bsModal = bootstrap.Modal.getInstance(modal);
            const confirmBtn = modal.querySelector('#confirmActionBtn');
            if (!confirmBtn) return;

            const onConfirm = async () => {
                if (bsModal) bsModal.hide();
                try {
                    const response = await fetch(`/admin/recensioni/${id}/toggle`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ visibile: newStatus })
                    });
                    if (!response.ok) throw new Error('Errore nell\'aggiornamento');
                    // Aggiorna immediatamente la riga nella tabella così l'utente vede il cambiamento
                    this.updateRowVisibility(id, newStatus);
                    // Mostra conferma (ShowModal preferito) senza forzare reload completo
                    if (typeof ShowModal !== 'undefined' && ShowModal.showModalSuccess) {
                        await ShowModal.showModalSuccess('Operazione completata', `Recensione ${newStatus ? 'mostrata' : 'nascosta'} con successo`);
                    } else {
                        this.mostraSuccesso(`Recensione ${newStatus ? 'mostrata' : 'nascosta'} con successo`);
                    }
                } catch (error) {
                    this.mostraErrore('Errore nell\'aggiornamento: ' + error.message);
                }
            };

            confirmBtn.addEventListener('click', onConfirm, { once: true });
            return;
        }

        // Fallback to native confirm
        if (!confirm(`Sei sicuro di voler ${action} questa recensione?`)) return;

        try {
            const response = await fetch(`/admin/recensioni/${id}/toggle`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visibile: newStatus })
            });

            if (!response.ok) throw new Error('Errore nell\'aggiornamento');

            // Aggiorna immediatamente la tabella invece di ricaricare
            this.updateRowVisibility(id, newStatus);
            this.mostraSuccesso(`Recensione ${newStatus ? 'mostrata' : 'nascosta'} con successo`);
        } catch (error) {
            this.mostraErrore('Errore nell\'aggiornamento: ' + error.message);
        }
    }

    async eliminaRecensione(id) {
        // Use ShowModal modalDelete when available
        if (typeof ShowModal !== 'undefined' && typeof bootstrap !== 'undefined') {
            ShowModal.modalDelete('Sei sicuro di voler eliminare definitivamente questa recensione? Questa azione non può essere annullata.', 'Conferma eliminazione');
            const modal = document.getElementById('modalDelete');
            if (!modal) return;
            const confirmBtn = modal.querySelector('#confirmDeleteBtn');
            if (!confirmBtn) return;

            const onConfirm = async () => {
                try {
                    // close the confirm modal first
                    const bsConfirm = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
                    if (bsConfirm) bsConfirm.hide();

                    const response = await fetch(`/admin/recensioni/${id}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Errore nell\'eliminazione');

                    // Rimuovi la riga dalla tabella subito
                    this.removeRow(id);
                    const staticSuccessModalEl = document.getElementById('successModal');
                    if (typeof ShowModal !== 'undefined' && ShowModal.showModalSuccess) {
                        await ShowModal.showModalSuccess('Operazione completata', 'Recensione eliminata con successo');
                    } else if (staticSuccessModalEl && typeof bootstrap !== 'undefined') {
                        document.getElementById('successMessage').textContent = 'Recensione eliminata con successo';
                        const bs = new bootstrap.Modal(staticSuccessModalEl);
                        bs.show();
                    } else {
                        this.mostraSuccesso('Recensione eliminata con successo');
                    }
                } catch (error) {
                    this.mostraErrore('Errore nell\'eliminazione: ' + error.message);
                }
            };

            confirmBtn.addEventListener('click', onConfirm, { once: true });
            return;
        }

        // Fallback
        if (!confirm('Sei sicuro di voler eliminare definitivamente questa recensione? Questa azione non può essere annullata.')) return;

        try {
            const response = await fetch(`/admin/recensioni/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Errore nell\'eliminazione');

            // Rimuovi la riga dalla tabella e mostra conferma
            this.removeRow(id);
            this.mostraSuccesso('Recensione eliminata con successo');
        } catch (error) {
            this.mostraErrore('Errore nell\'eliminazione: ' + error.message);
        }
    }

    mostraSuccesso(messaggio) {
        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        document.getElementById('successMessage').textContent = messaggio;
        modal.show();
    }

    mostraErrore(messaggio) {
        const modal = new bootstrap.Modal(document.getElementById('errorModal'));
        document.getElementById('errorMessage').textContent = messaggio;
        modal.show();
    }

    // Aggiorna la riga della recensione nella tabella (badge + bottone mostra/nascondi + data-stato)
    updateRowVisibility(id, visibile) {
        const row = document.querySelector(`#recensioniTableBody tr[data-recensione-id="${id}"]`);
        if (!row) return;
        // Aggiorna data attribute
        row.dataset.stato = visibile ? 'visibile' : 'nascosta';

        // Aggiorna badge
        const statoCell = row.querySelector('td:nth-child(7)');
        if (statoCell) {
            statoCell.innerHTML = visibile ? '<span class="badge bg-success">Visibile</span>' : '<span class="badge bg-secondary">Nascosta</span>';
        }

        // Aggiorna il bottone di toggle nello stesso gruppo di azioni
        const azioniCell = row.querySelector('td:nth-child(8)');
        if (azioniCell) {
            // Trova il bottone di toggle esistente (ha title "Nascondi" oppure "Mostra")
            const toggleBtn = azioniCell.querySelector('button[title="Nascondi"], button[title="Mostra"]');
            if (toggleBtn) {
                // Crea nuovo bottone con stato opposto
                const newBtn = document.createElement('button');
                newBtn.className = visibile ? 'btn btn-sm btn-outline-warning' : 'btn btn-sm btn-outline-success';
                newBtn.title = visibile ? 'Nascondi' : 'Mostra';
                newBtn.innerHTML = visibile ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
                // Imposta onclick corretto (nascondi => passiamo currentStatus = true; mostra => currentStatus = false)
                if (visibile) {
                    newBtn.addEventListener('click', () => this.toggleVisibile(id, true));
                } else {
                    newBtn.addEventListener('click', () => this.toggleVisibile(id, false));
                }
                toggleBtn.replaceWith(newBtn);
            }
        }
    }

    // Rimuove una riga dalla tabella e aggiorna i contatori / messaggi "nessun risultato"
    removeRow(id) {
        const row = document.querySelector(`#recensioniTableBody tr[data-recensione-id="${id}"]`);
        if (row) {
            row.remove();
        }
        // Ricalcola e aggiorna i contatori e la riga di nessun risultato
        // Chiamiamo filtraRecensioni per riallineare visibilità e contatori
        try {
            this.filtraRecensioni();
        } catch (e) {
            // In caso di errori non bloccanti, aggiorniamo semplicemente il conteggio totale
            const totalCount = document.querySelectorAll('#recensioniTableBody tr[data-recensione-id]').length;
            const visibleCount = document.querySelectorAll('#recensioniTableBody tr[data-recensione-id]:not([style*="display: none"])').length;
            const totalEl = document.getElementById('totalCount');
            const filteredEl = document.getElementById('filteredCount');
            if (totalEl) totalEl.textContent = totalCount;
            if (filteredEl) filteredEl.textContent = `(${visibleCount} filtrate)`;
            this.toggleNoResultsRow(visibleCount === 0);
        }
    }

    mostraRecensioniVisibili() {
        // Imposta lo stato del filtro su 'visibile' e riapplica il filtro
        this.statusFilter = 'visibile';
        this.filtraRecensioni();
    }

    mostraRecensioniNascoste() {
        // Imposta lo stato del filtro su 'nascosta' e riapplica il filtro
        this.statusFilter = 'nascosta';
        this.filtraRecensioni();
    }

    mostraTutte() {
        this.statusFilter = 'all';
        this.filtraRecensioni();
    }

    filtraRecensioni() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        const rows = document.querySelectorAll('#recensioniTableBody tr');
        let visibleCount = 0;

        rows.forEach(row => {
            if (row.id === 'noResultsRow') return; // Salta la riga "nessun risultato"

            const id = row.dataset.recensioneId || '';
            const titolo = row.dataset.titolo || '';
            const contenuto = row.dataset.contenuto || '';
            const utente = row.dataset.utente || '';
            const valutazione = row.dataset.valutazione || '';

            const matchesSearch = !searchTerm || 
                id.includes(searchTerm) ||
                titolo.includes(searchTerm) ||
                contenuto.includes(searchTerm) ||
                utente.includes(searchTerm) ||
                valutazione.includes(searchTerm);

            // Applica anche il filtro di stato
            const status = row.dataset.stato || 'visibile';
            const matchesStatus = this.statusFilter === 'all' || this.statusFilter === status;

            if (matchesSearch && matchesStatus) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // Se non ci sono risultati, mostra una riga informativa
        this.toggleNoResultsRow(visibleCount === 0);
        this.updateFilteredCount(visibleCount);
    }

    updateFilteredCount(count) {
        const totalCount = document.querySelectorAll('#recensioniTableBody tr[data-recensione-id]').length;
        document.getElementById('totalCount').textContent = totalCount;
        document.getElementById('filteredCount').textContent = `(${count} filtrate)`;
    }

    toggleNoResultsRow(show) {
        const tbody = document.getElementById('recensioniTableBody');
        let noRow = document.getElementById('noResultsRow');
        if (show) {
            if (!noRow) {
                noRow = document.createElement('tr');
                noRow.id = 'noResultsRow';
                noRow.innerHTML = `<td colspan="8" class="text-center text-muted py-4"><i class="bi bi-info-circle display-4 mb-3"></i><p>Nessuna recensione corrisponde ai criteri di ricerca.</p></td>`;
                tbody.appendChild(noRow);
            }
        } else {
            if (noRow) noRow.remove();
        }
    }
}

// Istanza globale
const gestioneRecensioni = new GestioneRecensioni();

// Esponi funzioni globali per onclick
window.visualizzaRecensione = (id) => gestioneRecensioni.visualizzaRecensione(id);
window.nascondiRecensione = (id) => gestioneRecensioni.toggleVisibile(id, true);
window.mostraRecensione = (id) => gestioneRecensioni.toggleVisibile(id, false);
window.eliminaRecensione = (id) => gestioneRecensioni.eliminaRecensione(id);
window.mostraRecensioniVisibili = () => gestioneRecensioni.mostraRecensioniVisibili();
window.mostraRecensioniNascoste = () => gestioneRecensioni.mostraRecensioniNascoste();
window.mostraTutteRecensioni = () => gestioneRecensioni.mostraTutte();