
class GestoreUtente {
    constructor() {
        this.originalUtenti = [];
        this.initialize();
    }

    initialize() {
        this.loadUtentiData();
        this.setupEventListeners();
    }

    loadUtentiData() {
        const rows = document.querySelectorAll('#utentiTableBody tr[data-utente-id]');
        this.originalUtenti = Array.from(rows).map(row => ({
            element: row,
            id: row.dataset.utenteId,
            nome: row.dataset.nome || '',
            cognome: row.dataset.cognome || '',
            email: row.dataset.email || '',
            telefono: row.dataset.telefono || '',
            tipo: row.dataset.tipo || ''
        }));
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filtraUtenti());
        }

        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    this.filtraUtenti();
                    searchInput.focus();
                }
            });
        }
    }

    filtraUtenti() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        let visibleCount = 0;

        this.originalUtenti.forEach(utente => {
            const matchesSearch = !searchTerm || 
                utente.id.includes(searchTerm) ||
                utente.nome.includes(searchTerm) ||
                utente.cognome.includes(searchTerm) ||
                utente.email.includes(searchTerm) ||
                utente.telefono.includes(searchTerm);

            if (matchesSearch) {
                utente.element.style.display = '';
                visibleCount++;
            } else {
                utente.element.style.display = 'none';
            }
        });

        this.updateFilteredCount(visibleCount);
    }

    updateFilteredCount(count) {
        const totalCount = this.originalUtenti.length;
        document.getElementById('totalCount').textContent = totalCount;
        document.getElementById('filteredCount').textContent = `(${count} filtrate)`;
    }
    static showNotification(message, type = 'info') {
        const modal = document.getElementById('notificaModal');
        const header = document.getElementById('notificaHeader');
        const body = document.getElementById('notificaBody');
        const title = document.getElementById('notificaModalLabel');

        header.className = 'modal-header';
        switch (type) {
            case 'success':
                header.classList.add('bg-success', 'text-white');
                title.textContent = 'Successo';
                break;
            case 'error':
                header.classList.add('bg-danger', 'text-white');
                title.textContent = 'Errore';
                break;
            case 'warning':
                header.classList.add('bg-warning');
                title.textContent = 'Attenzione';
                break;
            default:
                header.classList.add('bg-info', 'text-white');
                title.textContent = 'Informazione';
        }
        body.textContent = message;
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    static async visualizzaUtente(id) {
        try {
            const response = await fetch(`/admin/utenti/${id}`);
            if (!response.ok) {
                throw new Error('Errore nel caricamento dei dettagli utente');
            }
            const utente = await response.json();
            const content = `
                <div class="row">
                    <div class="col-md-8">
                        <h4>${utente.nome} ${utente.cognome}</h4>
                        <p><strong>Email:</strong> ${utente.email}</p>
                        <p><strong>Telefono:</strong> ${utente.telefono || 'Non specificato'}</p>
                        <p><strong>Tipo Utente:</strong> ${GestoreUtente.getTipoUtenteLabel(utente.tipo_utente_id)}</p>
                        <p><strong>Data Registrazione:</strong> ${new Date(utente.data_registrazione).toLocaleDateString('it-IT')}</p>
                    </div>
                    <div class="col-md-4 text-center">
                        <img src="${utente.immagine_profilo || '/images/default-news.jpg'}" alt="Foto profilo" class="img-fluid rounded-circle" style="width: 100px; height: 100px; object-fit: cover;">
                    </div>
                </div>
            `;
            document.getElementById('visualizzaContent').innerHTML = content;
            const modal = new bootstrap.Modal(document.getElementById('visualizzaModal'));
            modal.show();
        } catch (error) {
            console.error('Errore:', error);
            GestoreUtente.showNotification('Errore nel caricamento dei dettagli utente', 'error');
        }
    }

    static creaUtente() {
        document.getElementById('creaForm').reset();
        const modal = new bootstrap.Modal(document.getElementById('creaModal'));
        modal.show();
    }

    static async salvaCrea() {
        const nome = document.getElementById('nome').value;
        const cognome = document.getElementById('cognome').value;
        const email = document.getElementById('email').value;
        const telefono = document.getElementById('telefono').value;
        const tipo_utente_id = document.getElementById('tipo_utente_id').value;
        const password = document.getElementById('password').value;
        if (!nome || !cognome || !email || !password) {
            GestoreUtente.showNotification('Compila tutti i campi obbligatori', 'warning');
            return;
        }
        try {
            const response = await fetch('/admin/utenti', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, cognome, email, telefono, tipo_utente_id, password })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore nella creazione dell\'utente');
            }
            GestoreUtente.showNotification('Utente creato con successo', 'success');
            bootstrap.Modal.getInstance(document.getElementById('creaModal')).hide();
            location.reload();
        } catch (error) {
            console.error('Errore:', error);
            GestoreUtente.showNotification(error.message, 'error');
        }
    }

    static async modificaUtente(id) {
        try {
            const response = await fetch(`/admin/utenti/${id}`);
            if (!response.ok) {
                throw new Error('Errore nel caricamento dei dati utente');
            }
            const utente = await response.json();
            document.getElementById('modificaId').value = utente.id;
            document.getElementById('modificaNome').value = utente.nome;
            document.getElementById('modificaCognome').value = utente.cognome;
            document.getElementById('modificaEmail').value = utente.email;
            document.getElementById('modificaTelefono').value = utente.telefono || '';
            document.getElementById('modificaTipo').value = utente.tipo_utente_id;
            const modal = new bootstrap.Modal(document.getElementById('modificaModal'));
            modal.show();
        } catch (error) {
            console.error('Errore:', error);
            GestoreUtente.showNotification('Errore nel caricamento dei dati utente', 'error');
        }
    }

    static async salvaModifica() {
        const id = document.getElementById('modificaId').value;
        const nome = document.getElementById('modificaNome').value;
        const cognome = document.getElementById('modificaCognome').value;
        const email = document.getElementById('modificaEmail').value;
        const telefono = document.getElementById('modificaTelefono').value;
        const tipo_utente_id = document.getElementById('modificaTipo').value;
        if (!nome || !cognome || !email) {
            GestoreUtente.showNotification('Compila tutti i campi obbligatori', 'warning');
            return;
        }
        try {
            const response = await fetch(`/admin/utenti/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, cognome, email, telefono, tipo_utente_id })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore nell\'aggiornamento dell\'utente');
            }
            GestoreUtente.showNotification('Utente aggiornato con successo', 'success');
            bootstrap.Modal.getInstance(document.getElementById('modificaModal')).hide();
            location.reload();
        } catch (error) {
            console.error('Errore:', error);
            GestoreUtente.showNotification(error.message, 'error');
        }
    }

    static async eliminaUtente(id) {
        try {
            // Show the existing modal (do NOT modify showModal.js as requested)
            ShowModal.modalDelete('Sei sicuro di voler eliminare questo utente? Questa azione non può essere annullata.', 'Conferma eliminazione');

            // Wait for confirmation by listening to the modal's buttons/events
            const modal = document.getElementById('modalDelete');
            let confirmed = false;

            if (!modal) {
                // Fallback if modal not found for some reason
                if (!confirm('Sei sicuro di voler eliminare questo utente? Questa azione non può essere annullata.')) return;
                confirmed = true;
            } else {
                confirmed = await new Promise(resolve => {
                    const confirmBtn = modal.querySelector('#confirmDeleteBtn');

                    const onConfirm = () => {
                        cleanup();
                        resolve(true);
                    };

                    const onHidden = () => {
                        cleanup();
                        resolve(false);
                    };

                    function cleanup() {
                        if (confirmBtn) confirmBtn.removeEventListener('click', onConfirm);
                        modal.removeEventListener('hidden.bs.modal', onHidden);
                    }

                    if (confirmBtn) confirmBtn.addEventListener('click', onConfirm, { once: true });
                    modal.addEventListener('hidden.bs.modal', onHidden, { once: true });
                });
            }

            if (!confirmed) return;

            const response = await fetch(`/admin/utenti/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore nell\'eliminazione dell\'utente');
            }
            // Show success using the shared ShowModal API and wait for user to close it before reloading
            if (typeof ShowModal !== 'undefined' && ShowModal.showModalSuccess) {
                await ShowModal.showModalSuccess('Operazione completata', 'Utente eliminato con successo.');
                const successModal = document.getElementById('modalSuccess');
                if (successModal && typeof bootstrap !== 'undefined') {
                    successModal.addEventListener('hidden.bs.modal', () => { location.reload(); }, { once: true });
                } else {
                    // fallback: small delay then reload
                    setTimeout(() => location.reload(), 800);
                }
            } else {
                // If ShowModal not available, fallback to static modal or immediate reload
                const staticSuccessModalEl = document.getElementById('successModal');
                if (staticSuccessModalEl && typeof bootstrap !== 'undefined') {
                    document.getElementById('successMessage').textContent = 'Utente eliminato con successo';
                    const bs = new bootstrap.Modal(staticSuccessModalEl);
                    bs.show();
                    staticSuccessModalEl.addEventListener('hidden.bs.modal', () => { location.reload(); }, { once: true });
                } else {
                    setTimeout(() => location.reload(), 800);
                }
            }
        } catch (error) {
            console.error('Errore:', error);
            await ShowModal.showModalError(error.message || 'Errore nell\'eliminazione dell\'utente', 'Errore');
        }
    }

    static getTipoUtenteLabel(tipoId) {
        switch (tipoId) {
            case 1: return 'Admin';
            case 2: return 'Dirigente';
            case 3: return 'Utente';
            default: return 'Sconosciuto';
        }
    }
}

window.visualizzaUtente = GestoreUtente.visualizzaUtente;
window.creaUtente = GestoreUtente.creaUtente;
window.salvaCrea = GestoreUtente.salvaCrea;
window.modificaUtente = GestoreUtente.modificaUtente;
window.salvaModifica = GestoreUtente.salvaModifica;
window.eliminaUtente = GestoreUtente.eliminaUtente;
window.showNotification = GestoreUtente.showNotification;

// Istanza globale
const gestoreUtente = new GestoreUtente();
