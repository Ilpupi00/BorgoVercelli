class Profilo{
    constructor(page,LoadCSS){
        if (typeof LoadCSS === 'function') LoadCSS();
        this.page=page;
        this.user = user;
        this.render();
    }

    render(){ 
        document.addEventListener('DOMContentLoaded', function() {
            const detailsItems = document.querySelectorAll('.profile-details dt, .profile-details dd');
                    
            detailsItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                    if (this.tagName === 'DT') {
                        this.nextElementSibling.classList.add('text-primary');
                    } else if (this.tagName === 'DD') {
                        this.previousElementSibling.classList.add('text-primary');
            }
        });

        // Modifica profilo: usa modal già presente in EJS
        // Precompila i campi quando la modal sta per essere mostrata
        const editProfileModal = document.getElementById('editProfileModal');
        if (editProfileModal) {
            editProfileModal.addEventListener('show.bs.modal', function () {
                document.getElementById('editNome').value = document.querySelector('.profile-card h2').textContent.split(' ')[0] || '';
                document.getElementById('editCognome').value = document.querySelector('.profile-card h2').textContent.split(' ')[1] || '';
                const emailMatch = document.querySelector('.profile-card .text-muted').textContent.match(/([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/);
                document.getElementById('editEmail').value = emailMatch ? emailMatch[1] : '';
                document.getElementById('editTelefono').value = document.querySelector('.profile-details dd').textContent.trim() || '';
                document.getElementById('editProfileMsg').textContent = '';
            });

            // Gestione invio form
            document.getElementById('editProfileForm').addEventListener('submit', function(e) {
                e.preventDefault();
                const form = e.target;
                const data = {
                    nome: form.editNome.value,
                    cognome: form.editCognome.value,
                    email: form.editEmail.value,
                    telefono: form.editTelefono.value
                };
                fetch('/Me/update', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                })
                .then(res => res.json())
                .then(result => {
                    if (result.success) {
                        document.getElementById('editProfileMsg').textContent = 'Profilo aggiornato!';
                        setTimeout(() => window.location.reload(), 1200);
                    } else {
                        document.getElementById('editProfileMsg').textContent = result.error || 'Errore aggiornamento';
                    }
                })
                .catch(() => {
                    document.getElementById('editProfileMsg').textContent = 'Errore di rete';
                });
            });
        }
                        
        item.addEventListener('mouseleave', function() {
                    if (this.tagName === 'DT') {
                        this.nextElementSibling.classList.remove('text-primary');
                    } else if (this.tagName === 'DD') {
                        this.previousElementSibling.classList.remove('text-primary');
                }
            });
        });
                    
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