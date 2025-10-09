class GestioneRecensioni {
    constructor() {
        this.init();
    }

    init() {
        // Inizializzazioni se necessarie
        this.setupSearch();
        this.updateFilteredCount(document.querySelectorAll('#recensioniTableBody tr:not(#noResultsRow)').length);
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
        // Filtra righe visibili
        const rows = document.querySelectorAll('#recensioniTableBody tr');
        rows.forEach(row => {
            if (row.id === 'noResultsRow') return;
            const status = row.dataset.stato;
            row.style.display = status === 'visibile' ? '' : 'none';
        });
        this.filtraRecensioni(); // Applica anche il filtro di ricerca
    }

    mostraRecensioniNascoste() {
        // Filtra righe nascoste
        const rows = document.querySelectorAll('#recensioniTableBody tr');
        rows.forEach(row => {
            if (row.id === 'noResultsRow') return;
            const status = row.dataset.stato;
            row.style.display = status === 'nascosta' ? '' : 'none';
        });
        this.filtraRecensioni(); // Applica anche il filtro di ricerca
    }

    mostraTutte() {
        const rows = document.querySelectorAll('#recensioniTableBody tr');
        rows.forEach(row => {
            if (row.id === 'noResultsRow') return;
            row.style.display = '';
        });
        this.filtraRecensioni(); // Applica anche il filtro di ricerca
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

            if (matchesSearch) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        this.updateFilteredCount(visibleCount);
    }

    updateFilteredCount(count) {
        const totalCount = document.querySelectorAll('#recensioniTableBody tr:not(#noResultsRow)').length;
        document.getElementById('totalCount').textContent = totalCount;
        document.getElementById('filteredCount').textContent = `(${count} filtrate)`;
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