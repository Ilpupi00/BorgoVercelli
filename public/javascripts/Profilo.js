// Profilo.js - JavaScript per la pagina profilo di Borgo Vercelli

// Funzione per modificare preferenze
function modificaPreferenze() {
    // Apri il modal di modifica profilo con focus sulle preferenze
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();

    // Inizializza i valori del form con i dati attuali dell'utente
    if (window.currentUser) {
        document.getElementById('editNome').value = window.currentUser.nome || '';
        document.getElementById('editCognome').value = window.currentUser.cognome || '';
        document.getElementById('editEmail').value = window.currentUser.email || '';
        document.getElementById('editTelefono').value = window.currentUser.telefono || '';
        document.getElementById('ruoloPreferito').value = window.currentUser.ruolo_preferito || '';
        document.getElementById('piedePreferito').value = window.currentUser.piede_preferito || '';
    }

    setTimeout(() => {
        document.getElementById('ruoloPreferito').focus();
    }, 500);
}

// Funzione per cambiare password
function cambiaPassword() {
    // Apri il modal di cambio password
    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    modal.show();
    // Resetta il form quando si apre
    document.getElementById('changePasswordForm').reset();
    document.getElementById('changePasswordMsg').innerHTML = '';
}

// Funzione per caricare le recensioni dell'utente
async function caricaRecensioniUtente() {
    try {
        const response = await fetch('/recensioni/mie');
        const data = await response.json();

        if (data.success) {
            mostraRecensioniUtente(data.recensioni);
        } else {
            document.getElementById('userReviewsContainer').innerHTML =
                '<div class="alert alert-danger">Errore nel caricamento delle recensioni</div>';
        }
    } catch (error) {
        console.error('Errore caricamento recensioni:', error);
        document.getElementById('userReviewsContainer').innerHTML =
            '<div class="alert alert-danger">Errore di connessione</div>';
    }
}

// Funzione per mostrare le recensioni dell'utente
function mostraRecensioniUtente(recensioni) {
    const container = document.getElementById('userReviewsContainer');

    if (!recensioni || recensioni.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-star text-muted display-4 mb-3"></i>
                <p class="text-muted">Non hai ancora scritto nessuna recensione.</p>
                <a href="/scrivi/Recensione" class="btn btn-outline-info">Scrivi la tua prima recensione</a>
            </div>
        `;
        return;
    }

    let html = '<div class="reviews-list">';
    recensioni.forEach(recensione => {
        const stelle = '★'.repeat(recensione.valutazione) + '☆'.repeat(5 - recensione.valutazione);
        const data = new Date(recensione.data_recensione).toLocaleDateString('it-IT');

        html += `
            <div class="review-item border rounded p-3 mb-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-2">
                            <span class="stars text-warning me-2">${stelle}</span>
                            <small class="text-muted">${data}</small>
                        </div>
                        <h6 class="mb-2">${recensione.titolo}</h6>
                        <p class="mb-2">${recensione.contenuto}</p>
                        <small class="text-muted">
                            <i class="bi bi-tag me-1"></i>${recensione.entita_tipo} #${recensione.entita_id}
                        </small>
                    </div>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-warning" onclick="modificaRecensione(${recensione.id})" title="Modifica">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="confermaEliminaRecensione(${recensione.id}, '${recensione.titolo}')" title="Elimina">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';

    container.innerHTML = html;
}

// Funzione per modificare una recensione
function modificaRecensione(recensioneId) {
    // Prima carica i dati della recensione
    fetch(`/recensioni/mie`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const recensione = data.recensioni.find(r => r.id == recensioneId);
                if (recensione) {
                    document.getElementById('editReviewId').value = recensione.id;
                    document.getElementById('editReviewRating').value = recensione.valutazione;
                    document.getElementById('editReviewTitle').value = recensione.titolo;
                    document.getElementById('editReviewContent').value = recensione.contenuto;

                    const modal = new bootstrap.Modal(document.getElementById('editReviewModal'));
                    modal.show();
                }
            }
        })
        .catch(error => console.error('Errore caricamento recensione:', error));
}

// Funzione per confermare l'eliminazione di una recensione
function confermaEliminaRecensione(recensioneId, titolo) {
    document.getElementById('deleteReviewId').value = recensioneId;
    document.getElementById('deleteReviewTitle').textContent = titolo;

    const modal = new bootstrap.Modal(document.getElementById('deleteReviewModal'));
    modal.show();
}

// Gestione submit form modifica recensione
document.getElementById('editReviewForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData);
    const recensioneId = document.getElementById('editReviewId').value;

    try {
        const response = await fetch(`/recensioni/${recensioneId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            document.getElementById('editReviewMsg').innerHTML =
                '<div class="alert alert-success">Recensione aggiornata con successo!</div>';

            // Chiudi il modal dopo un breve delay
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('editReviewModal'));
                if (modal) modal.hide();
                caricaRecensioniUtente(); // Ricarica le recensioni
            }, 1500);
        } else {
            document.getElementById('editReviewMsg').innerHTML =
                '<div class="alert alert-danger">Errore: ' + (result.error || 'Errore sconosciuto') + '</div>';
        }
    } catch (error) {
        console.error('Errore modifica recensione:', error);
        document.getElementById('editReviewMsg').innerHTML =
            '<div class="alert alert-danger">Errore di connessione</div>';
    }
});

// Gestione conferma eliminazione recensione
document.getElementById('confirmDeleteReview').addEventListener('click', async function() {
    const recensioneId = document.getElementById('deleteReviewId').value;

    try {
        const response = await fetch(`/recensioni/${recensioneId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Chiudi il modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteReviewModal'));
            if (modal) modal.hide();

            // Ricarica le recensioni
            caricaRecensioniUtente();
        } else {
            alert('Errore nell\'eliminazione: ' + (result.error || 'Errore sconosciuto'));
        }
    } catch (error) {
        console.error('Errore eliminazione recensione:', error);
        alert('Errore di connessione');
    }
});

// Carica le recensioni quando la pagina è pronta
document.addEventListener('DOMContentLoaded', function() {
    // ... codice esistente ...

    // Carica le recensioni dell'utente
    caricaRecensioniUtente();
});

// Gestione form modifica profilo
document.getElementById('editProfileForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch('/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById('editProfileMsg').innerHTML =
                '<div class="alert alert-success">Profilo aggiornato con successo!</div>';
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            document.getElementById('editProfileMsg').innerHTML =
                '<div class="alert alert-danger">Errore: ' + result.error + '</div>';
        }
    } catch (error) {
        document.getElementById('editProfileMsg').innerHTML =
            '<div class="alert alert-danger">Errore di connessione</div>';
    }
});

// Gestione form cambio password
document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validazione lato client
    if (newPassword !== confirmPassword) {
        document.getElementById('changePasswordMsg').innerHTML =
            '<div class="alert alert-danger">Le password non coincidono.</div>';
        return;
    }

    if (newPassword.length < 6) {
        document.getElementById('changePasswordMsg').innerHTML =
            '<div class="alert alert-danger">La password deve essere di almeno 6 caratteri.</div>';
        return;
    }

    try {
        const response = await fetch('/api/user/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById('changePasswordMsg').innerHTML =
                '<div class="alert alert-success">Password cambiata con successo!</div>';
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
                // Opzionale: reindirizza al login per sicurezza
                // window.location.href = '/Login';
            }, 2000);
        } else {
            document.getElementById('changePasswordMsg').innerHTML =
                '<div class="alert alert-danger">Errore: ' + result.error + '</div>';
        }
    } catch (error) {
        document.getElementById('changePasswordMsg').innerHTML =
            '<div class="alert alert-danger">Errore di connessione</div>';
    }
});

// Gestione upload foto profilo
document.getElementById('profilePicForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const file = formData.get('profilePic');

    if (!file || file.size === 0) {
        document.getElementById('uploadPicMsg').innerHTML =
            '<div class="alert alert-warning">Seleziona un file valido</div>';
        return;
    }

    try {
        const response = await fetch('/update-profile-pic', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById('uploadPicMsg').innerHTML =
                '<div class="alert alert-success">Foto profilo aggiornata con successo!</div>';
            
            // Chiudi il modal dopo un breve delay
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('uploadPicModal'));
                if (modal) {
                    modal.hide();
                }
                location.reload();
            }, 1500);
        } else {
            document.getElementById('uploadPicMsg').innerHTML =
                '<div class="alert alert-danger">Errore: ' + result.error + '</div>';
        }
    } catch (error) {
        document.getElementById('uploadPicMsg').innerHTML =
            '<div class="alert alert-danger">Errore di connessione</div>';
    }
});