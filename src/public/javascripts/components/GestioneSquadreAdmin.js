class GestioneSquadreAdmin {
    constructor() {
        this.currentSquadraId = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Event listener per creare nuova squadra
        const creaBtn = document.querySelector('.crea-squadra-btn');
        if (creaBtn) {
            creaBtn.addEventListener('click', () => {
                this.creaSquadra();
            });
        }

        // Event listeners per i bottoni di visualizzazione
        document.querySelectorAll('.visualizza-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.visualizzaSquadra(id);
            });
        });

        // Event listeners per i bottoni di eliminazione
        document.querySelectorAll('.elimina-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const nome = e.currentTarget.dataset.nome;
                this.eliminaSquadra(id, nome);
            });
        });

        // Event listener per salvare la creazione
        const saveCreateBtn = document.getElementById('saveCreateBtn');
        if (saveCreateBtn) {
            saveCreateBtn.addEventListener('click', () => {
                this.salvaCreazione();
            });
        }

        // Event listener per salvare la modifica
        const saveEditBtn = document.getElementById('saveEditBtn');
        if (saveEditBtn) {
            saveEditBtn.addEventListener('click', () => {
                this.salvaModifica();
            });
        }

        // Event listener per conferma eliminazione
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                this.confermaEliminazione();
            });
        }
    }

    creaSquadra() {
        // Resetta il form
        document.getElementById('createForm').reset();
        // Imposta l'anno corrente come default
        document.getElementById('annoInput').value = new Date().getFullYear();
        new bootstrap.Modal(document.getElementById('createModal')).show();
    }

    salvaCreazione() {
        const nome = document.getElementById('nomeInput').value.trim();
        const annoFondazione = document.getElementById('annoInput').value;

        if (!nome) {
            alert('Il nome della squadra è obbligatorio');
            return;
        }

        if (!annoFondazione || annoFondazione < 1900 || annoFondazione > new Date().getFullYear()) {
            alert('Inserisci un anno di fondazione valido');
            return;
        }

        fetch('/createsquadra', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                nome: nome,
                annoFondazione: parseInt(annoFondazione)
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('Squadra creata con successo!');
                bootstrap.Modal.getInstance(document.getElementById('createModal')).hide();
                location.reload();
            } else {
                alert('Errore durante la creazione: ' + (data.error || 'Errore sconosciuto'));
            }
        })
        .catch(error => {
            console.error('Errore:', error);
            alert('Errore durante la creazione della squadra');
        });
    }

    modificaSquadra(id, nome, anno) {
        if (!id || id === '0') {
            alert('Errore: ID squadra non valido');
            return;
        }
        this.currentSquadraId = id;
        document.getElementById('editNomeInput').value = nome;
        document.getElementById('editAnnoInput').value = anno;
        new bootstrap.Modal(document.getElementById('editModal')).show();
    }

    salvaModifica() {
        const nome = document.getElementById('editNomeInput').value.trim();
        const annoFondazione = document.getElementById('editAnnoInput').value;

        if (!nome) {
            alert('Il nome della squadra è obbligatorio');
            return;
        }

        if (!annoFondazione || annoFondazione < 1900 || annoFondazione > new Date().getFullYear()) {
            alert('Inserisci un anno di fondazione valido');
            return;
        }

        if (!this.currentSquadraId) {
            alert('Errore: ID squadra non trovato');
            return;
        }

        fetch(`/updatesquadra/${this.currentSquadraId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                nome: nome,
                annoFondazione: parseInt(annoFondazione)
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('Squadra aggiornata con successo!');
                bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
                location.reload();
            } else {
                alert('Errore durante l\'aggiornamento: ' + (data.error || 'Errore sconosciuto'));
            }
        })
        .catch(error => {
            console.error('Errore:', error);
            alert('Errore durante l\'aggiornamento della squadra');
        });
    }

    visualizzaSquadra(id) {
        // Carica i dettagli della squadra via API
        fetch(`/getsquadra/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('Errore nel caricamento dei dettagli: ' + data.error);
                return;
            }

            // Costruisci il contenuto del modal
            const content = `
                <div class="row">
                    <div class="col-md-6">
                        <h6>Informazioni Generali</h6>
                        <p><strong>Nome:</strong> ${data.nome}</p>
                        <p><strong>Anno Fondazione:</strong> ${data.Anno}</p>
                    </div>
                    <div class="col-md-6">
                        <h6>Dirigenti</h6>
                        ${data.dirigenti && data.dirigenti.length > 0 ?
                            `<ul class="list-unstyled">
                                ${data.dirigenti.map(dir => `<li>${dir.nome} ${dir.cognome}</li>`).join('')}
                            </ul>` :
                            '<p class="text-muted">Nessun dirigente assegnato</p>'
                        }
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-12">
                        <h6>Giocatori</h6>
                        <p class="text-muted">Funzionalità da implementare - numero giocatori da API</p>
                    </div>
                </div>
            `;

            document.getElementById('viewModalTitle').textContent = `Dettagli Squadra: ${data.nome}`;
            document.getElementById('viewModalBody').innerHTML = content;
            new bootstrap.Modal(document.getElementById('viewModal')).show();
        })
        .catch(error => {
            console.error('Errore:', error);
            alert('Errore nel caricamento dei dettagli della squadra');
        });
    }

    eliminaSquadra(id, nome) {
        this.currentSquadraId = id;
        document.getElementById('deleteSquadraNome').textContent = nome;
        new bootstrap.Modal(document.getElementById('deleteModal')).show();
    }

    confermaEliminazione() {
        if (!this.currentSquadraId) {
            alert('Errore: ID squadra non trovato');
            return;
        }

        fetch(`/deletesquadra/${this.currentSquadraId}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('Squadra eliminata con successo!');
                bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
                location.reload();
            } else {
                alert('Errore durante l\'eliminazione: ' + (data.error || 'Errore sconosciuto'));
            }
        })
        .catch(error => {
            console.error('Errore:', error);
            alert('Errore durante l\'eliminazione della squadra');
        });
    }
}

// Inizializza la classe quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    window.gestioneSquadreAdmin = new GestioneSquadreAdmin();
});