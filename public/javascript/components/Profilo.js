class Profilo{
    constructor(page,LoadCSS){
        if (typeof LoadCSS === 'function') LoadCSS();
        this.page=page;
        console.log('Profilo component initialized');
        this.render();
    }

    render(){
        document.addEventListener('DOMContentLoaded', () => {
            const profileCard = document.querySelector('.profile-card');
            if (!profileCard) return;

            // Bottone modifica inline
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-primary w-100 my-3';
            editBtn.innerHTML = '<i class="bi bi-pencil-square"></i> Modifica Profilo';
            profileCard.appendChild(editBtn);

            editBtn.addEventListener('click', () => {
                // Trasforma i dati in input
                const nomeCognome = profileCard.querySelector('h2').textContent.split(' ');
                const nome = nomeCognome[0] || '';
                const cognome = nomeCognome[1] || '';
                const email = profileCard.querySelector('.text-muted').textContent.match(/([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/);
                const telefono = profileCard.querySelector('.profile-details dd').textContent.trim() || '';

                profileCard.querySelector('h2').innerHTML = `<input type="text" id="editNome" value="${nome}" class="form-control mb-2" style="max-width:140px;display:inline-block;"> <input type="text" id="editCognome" value="${cognome}" class="form-control mb-2" style="max-width:140px;display:inline-block;">`;
                profileCard.querySelector('.text-muted').innerHTML = `<i class="bi bi-envelope"></i> <input type="email" id="editEmail" value="${email ? email[1] : ''}" class="form-control mb-2" style="max-width:220px;display:inline-block;">`;
                profileCard.querySelector('.profile-details dd').innerHTML = `<input type="text" id="editTelefono" value="${telefono}" class="form-control mb-2" style="max-width:180px;display:inline-block;">`;

                // Bottone salva
                editBtn.style.display = 'none';
                const saveBtn = document.createElement('button');
                saveBtn.className = 'btn btn-success w-100 my-3';
                saveBtn.innerHTML = '<i class="bi bi-check2"></i> Salva Modifiche';
                profileCard.appendChild(saveBtn);

                saveBtn.addEventListener('click', async () => {
                    
                    const data = {
                        nome: document.getElementById('editNome').value,
                        cognome: document.getElementById('editCognome').value,
                        email: document.getElementById('editEmail').value,
                        telefono: document.getElementById('editTelefono').value
                    };
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Salvataggio...';
                    const msgDiv = document.getElementById('editProfileMsg') || (() => {
                        const d = document.createElement('div');
                        d.id = 'editProfileMsg';
                        profileCard.appendChild(d);
                        return d;
                    })();
                    fetch('/update', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify(data)
                    })
                    .then(async res => {
                        let result;
                        try {
                            result = await res.json();
                        } catch (e) {
                            result = {};
                        }
                        if (res.status === 401) {
                            msgDiv.textContent = 'Sessione scaduta, effettua di nuovo il login.';
                            setTimeout(() => window.location.href = '/Login', 1500);
                        } else if (res.status === 500) {
                            msgDiv.textContent = 'Errore interno, riprova più tardi.';
                        } else if (result.success) {
                            msgDiv.textContent = 'Profilo aggiornato!';
                            setTimeout(() => window.location.reload(), 1200);
                        } else {
                            msgDiv.textContent = result.error || 'Errore aggiornamento';
                        }
                    })
                    .catch((err) => {
                        msgDiv.textContent = 'Errore imprevisto: ' + (err?.message || 'Errore di rete');
                    });
                });
            });

            // Gestione submit del form modal
            const editProfileForm = document.getElementById('editProfileForm');
            if (editProfileForm) {
                editProfileForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    const saveBtn = editProfileForm.querySelector('button[type="submit"]');
                    let msgDiv = document.getElementById('editProfileMsg');
                    if (!msgDiv) {
                        msgDiv = document.createElement('div');
                        msgDiv.id = 'editProfileMsg';
                        editProfileForm.appendChild(msgDiv);
                    }
                    const nome = document.getElementById('editNome')?.value?.trim();
                    const cognome = document.getElementById('editCognome')?.value?.trim();
                    const email = document.getElementById('editEmail')?.value?.trim();
                    const telefono = document.getElementById('editTelefono')?.value?.trim();
                    if (!nome || !cognome || !email) {
                        msgDiv.textContent = 'Compila tutti i campi obbligatori.';
                        return;
                    }
                    if (saveBtn) {
                        saveBtn.disabled = true;
                        saveBtn.textContent = 'Salvataggio...';
                    }
                    fetch('/update', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify({ nome, cognome, email, telefono })
                    })
                    .then(async res => {
                        let result;
                        try {
                            result = await res.json();
                        } catch (e) {
                            result = {};
                        }
                        if (res.status === 401) {
                            msgDiv.textContent = 'Sessione scaduta, effettua di nuovo il login.';
                            setTimeout(() => window.location.href = '/Login', 1500);
                        } else if (res.status === 500) {
                            msgDiv.textContent = 'Errore interno, riprova più tardi.';
                        } else if (result.success) {
                            msgDiv.textContent = 'Profilo aggiornato!';
                            setTimeout(() => window.location.reload(), 1200);
                        } else {
                            msgDiv.textContent = result.error || 'Errore aggiornamento';
                        }
                    })
                    .catch((err) => {
                        msgDiv.textContent = 'Errore imprevisto: ' + (err?.message || 'Errore di rete');
                    })
                    .finally(() => {
                        if (saveBtn) {
                            saveBtn.disabled = false;
                            saveBtn.textContent = 'Salva modifiche';
                        }
                    });
                });
            }

            // Avatar animation on click
            const avatar = document.querySelector('.profile-avatar');
            avatar.addEventListener('click', function() {
                this.classList.add('animate__animated', 'animate__rubberBand');
                this.addEventListener('animationend', () => {
                    this.classList.remove('animate__animated', 'animate__rubberBand');
                }, {once: true});
            });
        });
    }

}

export default Profilo;