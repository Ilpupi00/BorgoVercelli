class Profilo {
    constructor() {
        this.currentUser = window.currentUser || {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.caricaRecensioniUtente();
    }

    setupEventListeners() {
        // Modifica preferenze
        const editProfileBtn = document.querySelector('[onclick="modificaPreferenze()"]');
        if (editProfileBtn) {
            editProfileBtn.onclick = () => this.modificaPreferenze();
        }

        // Cambia password
        const changePasswordBtn = document.querySelector('[onclick="cambiaPassword()"]');
        if (changePasswordBtn) {
            changePasswordBtn.onclick = () => this.cambiaPassword();
        }

        // Form modifica profilo
        const editProfileForm = document.getElementById('editProfileForm');
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', (e) => this.handleEditProfile(e));
        }

        // Form cambio password
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', (e) => this.handleChangePassword(e));
        }

        // Form modifica recensione
        const editReviewForm = document.getElementById('editReviewForm');
        if (editReviewForm) {
            editReviewForm.addEventListener('submit', (e) => this.handleEditReview(e));
        }

        // Conferma eliminazione recensione
        const confirmDeleteReview = document.getElementById('confirmDeleteReview');
        if (confirmDeleteReview) {
            confirmDeleteReview.addEventListener('click', () => this.handleDeleteReview());
        }

        // Upload foto profilo
        const profilePicForm = document.getElementById('profilePicForm');
        if (profilePicForm) {
            profilePicForm.addEventListener('submit', (e) => this.handleUploadPic(e));
        }
    }

    modificaPreferenze() {
        const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
        modal.show();

        if (this.currentUser) {
            document.getElementById('editNome').value = this.currentUser.nome || '';
            document.getElementById('editCognome').value = this.currentUser.cognome || '';
            document.getElementById('editEmail').value = this.currentUser.email || '';
            document.getElementById('editTelefono').value = this.currentUser.telefono || '';
            document.getElementById('ruoloPreferito').value = this.currentUser.ruolo_preferito || '';
            document.getElementById('piedePreferito').value = this.currentUser.piede_preferito || '';
        }

        setTimeout(() => {
            document.getElementById('ruoloPreferito').focus();
        }, 500);
    }

    cambiaPassword() {
        const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
        modal.show();
        document.getElementById('changePasswordForm').reset();
        document.getElementById('changePasswordMsg').innerHTML = '';
    }

    async caricaRecensioniUtente() {
        try {
            const response = await fetch('/recensioni/mie');
            const data = await response.json();

            if (data.success) {
                this.mostraRecensioniUtente(data.recensioni);
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

    mostraRecensioniUtente(recensioni) {
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
                            <button class="btn btn-sm btn-outline-warning" onclick="profilo.modificaRecensione(${recensione.id})" title="Modifica">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="profilo.confermaEliminaRecensione(${recensione.id}, '${recensione.titolo}')" title="Elimina">
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

    modificaRecensione(recensioneId) {
        fetch('/recensioni/mie')
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

    confermaEliminaRecensione(recensioneId, titolo) {
        document.getElementById('deleteReviewId').value = recensioneId;
        document.getElementById('deleteReviewTitle').textContent = titolo;

        const modal = new bootstrap.Modal(document.getElementById('deleteReviewModal'));
        modal.show();
    }

    async handleEditReview(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
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

                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editReviewModal'));
                    if (modal) modal.hide();
                    this.caricaRecensioniUtente();
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
    }

    async handleDeleteReview() {
        const recensioneId = document.getElementById('deleteReviewId').value;

        try {
            const response = await fetch(`/recensioni/${recensioneId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok && result.success) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('deleteReviewModal'));
                if (modal) modal.hide();
                this.caricaRecensioniUtente();
            } else {
                alert('Errore nell\'eliminazione: ' + (result.error || 'Errore sconosciuto'));
            }
        } catch (error) {
            console.error('Errore eliminazione recensione:', error);
            alert('Errore di connessione');
        }
    }

    async handleEditProfile(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
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
    }

    async handleChangePassword(e) {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

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
                }, 2000);
            } else {
                document.getElementById('changePasswordMsg').innerHTML =
                    '<div class="alert alert-danger">Errore: ' + result.error + '</div>';
            }
        } catch (error) {
            document.getElementById('changePasswordMsg').innerHTML =
                '<div class="alert alert-danger">Errore di connessione</div>';
        }
    }

    async handleUploadPic(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const file = formData.get('profilePic');

        if (!file || file.size === 0) {
            document.getElementById('uploadPicMsg').innerHTML =
                '<div class="alert alert-warning">Seleziona un file valido</div>';
            return;
        }

        // Validazione lato client
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            document.getElementById('uploadPicMsg').innerHTML =
                '<div class="alert alert-danger">File troppo grande. Massimo 5MB.</div>';
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            document.getElementById('uploadPicMsg').innerHTML =
                '<div class="alert alert-danger">Tipo file non supportato. Usa JPEG, PNG, GIF o WebP.</div>';
            return;
        }

        // Mostra loading
        document.getElementById('uploadPicMsg').innerHTML =
            '<div class="alert alert-info">Caricamento in corso...</div>';

        try {
            const response = await fetch('/update-profile-pic', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            let result;
            try {
                result = await response.json();
            } catch (parseError) {
                throw new Error('Risposta non valida dal server');
            }

            if (response.ok && result.success) {
                document.getElementById('uploadPicMsg').innerHTML =
                    '<div class="alert alert-success">Foto profilo aggiornata con successo!</div>';
                
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('uploadPicModal'));
                    if (modal) {
                        modal.hide();
                    }
                    location.reload();
                }, 1500);
            } else {
                const errorMsg = result.error || 'Errore sconosciuto';
                document.getElementById('uploadPicMsg').innerHTML =
                    `<div class="alert alert-danger">Errore: ${errorMsg}</div>`;
            }
        } catch (error) {
            console.error('Errore upload:', error);
            document.getElementById('uploadPicMsg').innerHTML =
                '<div class="alert alert-danger">Errore di connessione. Riprova più tardi.</div>';
        }
    }
}

// Istanza globale per compatibilità con onclick
const profilo = new Profilo();
window.profilo = profilo;