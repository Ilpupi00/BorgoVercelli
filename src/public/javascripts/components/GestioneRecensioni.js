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
                    // show static success modal if present
                    // Preferisci ShowModal se disponibile, altrimenti usa il modal statico 'successModal'
                    const staticSuccessModalEl = document.getElementById('successModal');
                    if (typeof ShowModal !== 'undefined' && ShowModal.showModalSuccess) {
                        await ShowModal.showModalSuccess('Operazione completata', `Recensione ${newStatus ? 'mostrata' : 'nascosta'} con successo`);
                        if (staticSuccessModalEl && typeof bootstrap !== 'undefined') {
                            staticSuccessModalEl.addEventListener('hidden.bs.modal', () => { location.reload(); }, { once: true });
                        } else {
                            setTimeout(() => location.reload(), 900);
                        }
                    } else if (staticSuccessModalEl && typeof bootstrap !== 'undefined') {
                        document.getElementById('successMessage').textContent = `Recensione ${newStatus ? 'mostrata' : 'nascosta'} con successo`;
                        const bs = new bootstrap.Modal(staticSuccessModalEl);
                        bs.show();
                        staticSuccessModalEl.addEventListener('hidden.bs.modal', () => { location.reload(); }, { once: true });
                    } else {
                        this.mostraSuccesso(`Recensione ${newStatus ? 'mostrata' : 'nascosta'} con successo`);
                        setTimeout(() => location.reload(), 1000);
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

            this.mostraSuccesso(`Recensione ${newStatus ? 'mostrata' : 'nascosta'} con successo`);
            // Ricarica la pagina per aggiornare la tabella
            setTimeout(() => location.reload(), 1500);
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

                    const staticSuccessModalEl = document.getElementById('successModal');
                    if (typeof ShowModal !== 'undefined' && ShowModal.showModalSuccess) {
                        await ShowModal.showModalSuccess('Operazione completata', 'Recensione eliminata con successo');
                        if (staticSuccessModalEl && typeof bootstrap !== 'undefined') {
                            staticSuccessModalEl.addEventListener('hidden.bs.modal', () => { location.reload(); }, { once: true });
                        } else {
                            setTimeout(() => location.reload(), 900);
                        }
                    } else if (staticSuccessModalEl && typeof bootstrap !== 'undefined') {
                        document.getElementById('successMessage').textContent = 'Recensione eliminata con successo';
                        const bs = new bootstrap.Modal(staticSuccessModalEl);
                        bs.show();
                        staticSuccessModalEl.addEventListener('hidden.bs.modal', () => { location.reload(); }, { once: true });
                    } else {
                        this.mostraSuccesso('Recensione eliminata con successo');
                        setTimeout(() => location.reload(), 1200);
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

            this.mostraSuccesso('Recensione eliminata con successo');
            // Ricarica la pagina per aggiornare la tabella
            setTimeout(() => location.reload(), 1500);
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