class GalleriaAdmin {
    constructor() {
        this.currentImageId = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Event listeners per i bottoni di modifica
        document.querySelectorAll('.modifica-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const descrizione = e.currentTarget.dataset.descrizione;
                this.modificaImmagine(id, descrizione);
            });
        });

        // Event listeners per i bottoni di eliminazione
        document.querySelectorAll('.elimina-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.eliminaImmagine(id);
            });
        });

        // Event listener per il salvataggio della modifica
        const saveEditBtn = document.getElementById('saveEditBtn');
        if (saveEditBtn) {
            saveEditBtn.addEventListener('click', () => {
                this.salvaModifica();
            });
        }

        // Event listener per la conferma dell'eliminazione
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                this.confermaEliminazione();
            });
        }
    }

    visualizzaImmagine(url) {
        document.getElementById('modalImage').src = url;
        new bootstrap.Modal(document.getElementById('imageModal')).show();
    }

    modificaImmagine(id, descrizione) {
        this.currentImageId = id;
        document.getElementById('descrizioneInput').value = descrizione;
        new bootstrap.Modal(document.getElementById('editModal')).show();
    }

    salvaModifica() {
        const descrizione = document.getElementById('descrizioneInput').value.trim();

        if (!this.currentImageId) {
            alert('Errore: ID immagine non trovato');
            return;
        }

        fetch(`/UpdateImmagine/${this.currentImageId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ descrizione: descrizione })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('Immagine aggiornata con successo!');
                bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
                location.reload();
            } else {
                alert('Errore durante l\'aggiornamento: ' + (data.error || 'Errore sconosciuto'));
            }
        })
        .catch(error => {
            console.error('Errore:', error);
            alert('Errore durante l\'aggiornamento dell\'immagine');
        });
    }

    eliminaImmagine(id) {
        this.currentImageId = id;
        new bootstrap.Modal(document.getElementById('deleteModal')).show();
    }

    confermaEliminazione() {
        if (!this.currentImageId) {
            alert('Errore: ID immagine non trovato');
            return;
        }

        fetch(`/DeleteImmagine/${this.currentImageId}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('Immagine eliminata con successo!');
                bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
                location.reload();
            } else {
                alert('Errore durante l\'eliminazione: ' + (data.error || 'Errore sconosciuto'));
            }
        })
        .catch(error => {
            console.error('Errore:', error);
            alert('Errore durante l\'eliminazione dell\'immagine');
        });
    }
}

// Inizializza la classe quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    window.galleriaAdmin = new GalleriaAdmin();
});