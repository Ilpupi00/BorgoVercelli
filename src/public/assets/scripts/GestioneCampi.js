class CampoManager {
    constructor() {
        this.editModalEl = document.getElementById('editCampoModal');
        this.editModal = new bootstrap.Modal(this.editModalEl);
    }

    init() {
        this.setupDeleteHandlers();
        this.setupEditHandlers();
        this.setupSaveHandler();
    }

    setupDeleteHandlers() {
        document.querySelectorAll('.btn-delete-campo').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDelete(e, btn));
        });
    }

    async handleDelete(e, btn) {
        const id = btn.getAttribute('data-id');
        if (!id) return;

        const proceedDelete = async () => {
            try {
                const resp = await fetch(`/admin/campi/elimina/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-Type': 'application/json'
                    }
                });

                const result = await resp.json();
                if (result && result.success) {
                    const row = document.querySelector(`tr[data-campo-id="${id}"]`);
                    if (row) row.remove();
                    const alert = document.createElement('div');
                    alert.className = 'alert alert-success mt-3';
                    alert.textContent = result.message || 'Campo eliminato con successo';
                    document.querySelector('.admin-content').prepend(alert);
                    setTimeout(() => alert.remove(), 3000);
                } else {
                    const msg = (result && result.error) ? result.error : 'Errore durante l\'eliminazione';
                    alert(msg);
                }
            } catch (err) {
                console.error('Errore eliminazione campo:', err);
                alert('Errore di connessione. Riprova.');
            }
        };

        // If ShowModal is available, use its delete modal
        if (window.ShowModal && typeof ShowModal.modalDelete === 'function') {
            const confirmed = await ShowModal.modalDelete('Sei sicuro di voler eliminare questo campo? Questa operazione è irreversibile.', 'Conferma eliminazione');
            if (confirmed) {
                await proceedDelete();
            }
        } else {
            // fallback to native confirm
            if (confirm('Sei sicuro di voler eliminare questo campo? Questa operazione è irreversibile.')) {
                await proceedDelete();
            }
        }
    }

    setupEditHandlers() {
        document.querySelectorAll('.btn-edit-campo').forEach(btn => {
            btn.addEventListener('click', () => this.handleEdit(btn));
        });
    }

    async handleEdit(btn) {
        const id = btn.getAttribute('data-id');
        if (!id) return;

        try {
            const resp = await fetch(`/admin/campi/${id}`, {
                method: 'GET',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const result = await resp.json();
            if (result && result.success && result.campo) {
                const campo = result.campo;
                this.populateEditForm(campo);
                this.editModal.show();
            } else {
                alert('Impossibile recuperare i dati del campo');
            }
        } catch (err) {
            console.error('Errore nel recupero campo:', err);
            alert('Errore di connessione. Riprova.');
        }
    }

    populateEditForm(campo) {
        document.getElementById('edit_campo_id').value = campo.id;
        document.getElementById('edit_nome').value = campo.nome || '';
        document.getElementById('edit_indirizzo').value = campo.indirizzo || '';
        document.getElementById('edit_tipo_superficie').value = campo.tipo_superficie || '';
        document.getElementById('edit_dimensioni').value = campo.dimensioni || '';
        document.getElementById('edit_capienza_pubblico').value = campo.capienza_pubblico || '';
        document.getElementById('edit_descrizione').value = campo.descrizione || '';
        document.getElementById('edit_illuminazione').checked = !!campo.illuminazione;
        document.getElementById('edit_coperto').checked = !!campo.coperto;
        document.getElementById('edit_spogliatoi').checked = !!campo.spogliatoi;
        document.getElementById('edit_Docce').checked = !!campo.Docce;
        document.getElementById('edit_attivo').checked = !!campo.attivo;
    }

    setupSaveHandler() {
        document.getElementById('saveEditCampoBtn').addEventListener('click', () => this.handleSave());
    }

    async handleSave() {
        const id = document.getElementById('edit_campo_id').value;
        if (!id) return alert('ID campo mancante');

        const formData = new FormData();
        formData.append('nome', document.getElementById('edit_nome').value);
        formData.append('indirizzo', document.getElementById('edit_indirizzo').value);
        formData.append('tipo_superficie', document.getElementById('edit_tipo_superficie').value);
        formData.append('dimensioni', document.getElementById('edit_dimensioni').value);
        formData.append('capienza_pubblico', document.getElementById('edit_capienza_pubblico').value);
        formData.append('descrizione', document.getElementById('edit_descrizione').value);
        formData.append('illuminazione', document.getElementById('edit_illuminazione').checked ? 1 : 0);
        formData.append('coperto', document.getElementById('edit_coperto').checked ? 1 : 0);
        formData.append('spogliatoi', document.getElementById('edit_spogliatoi').checked ? 1 : 0);
        formData.append('Docce', document.getElementById('edit_Docce').checked ? 1 : 0);
        formData.append('attivo', document.getElementById('edit_attivo').checked ? 1 : 0);
        const immagineInput = document.getElementById('edit_immagine');
        if (immagineInput.files[0]) {
            formData.append('immagine', immagineInput.files[0]);
        }

        try {
            const resp = await fetch(`/admin/campi/modifica/${id}`, {
                method: 'PUT',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData
            });

            const result = await resp.json();
            if (result && result.success) {
                if (result.updated) {
                    this.updateTableRow(id);
                }
                this.editModal.hide();
                const alert = document.createElement('div');
                alert.className = 'alert alert-success mt-3';
                alert.textContent = result.updated ? 'Campo aggiornato con successo' : 'Nessuna modifica apportata';
                const contentContainer = document.querySelector('.admin-content') || document.querySelector('main') || document.body;
                contentContainer.prepend(alert);
                setTimeout(() => alert.remove(), 3000);
            } else {
                alert('Errore durante l\'aggiornamento');
            }
        } catch (err) {
            console.error('Errore aggiornamento campo:', err);
            alert('Errore di connessione. Riprova.');
        }
    }

    updateTableRow(id) {
        const row = document.querySelector(`tr[data-campo-id="${id}"]`);
        if (row) {
            row.querySelector('td:nth-child(2)').textContent = document.getElementById('edit_nome').value;
            row.querySelector('td:nth-child(3)').textContent = document.getElementById('edit_indirizzo').value;
            row.querySelector('td:nth-child(4)').textContent = document.getElementById('edit_tipo_superficie').value;
            const badgeCell = row.querySelector('td:nth-child(5)');
            badgeCell.innerHTML = document.getElementById('edit_attivo').checked ? '<span class="badge bg-success">Attivo</span>' : '<span class="badge bg-danger">Inattivo</span>';
        }
    }
}

// Utility function (if needed elsewhere)
function formToObject(form) {
    const data = {};
    new FormData(form).forEach((value, key) => {
        data[key] = value;
    });
    return data;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    const campoManager = new CampoManager();
    campoManager.init();
});