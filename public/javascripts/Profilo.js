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

// Hover effect per l'avatar
document.addEventListener('DOMContentLoaded', function() {
    const avatarContainer = document.querySelector('.profile-avatar');
    const editBtn = document.getElementById('editPicBtn');

    if (avatarContainer && editBtn) {
        avatarContainer.addEventListener('mouseenter', function() {
            editBtn.style.opacity = '1';
        });

        avatarContainer.addEventListener('mouseleave', function() {
            editBtn.style.opacity = '0.8';
        });
    }

    // Inizializza i valori delle preferenze se esistono
    // Per ora sono placeholder, da implementare con dati dal DB
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