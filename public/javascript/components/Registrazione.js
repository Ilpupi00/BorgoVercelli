class Registrazione{
    constructor(element,loader) {
        if(typeof loader === 'function') loader();
        this.element = element;
        this.init();
    }

    async init() {
        document.title = "Registrazione";
        await this.render();
    }

    async render() {
        this.element.innerHTML = `
            <div class="container d-flex justify-content-center align-items-center vh-100">
        <div class="card p-4 shadow-lg login-card position-relative">
            <button type="button" class="btn-close position-absolute top-0 end-0 m-3" id="closeRegister" aria-label="Chiudi"></button>
            <h1 class="text-center mb-4 title">Registrati</h1>
            <form id="authForm">
                <div class="mb-3">
                    <label for="registerName" class="form-label">Nome</label>
                    <input type="text" class="form-control" id="registerName" placeholder="Inserisci il tuo nome" required>
                </div>
                <div class="mb-3">
                    <label for="registerSurname" class="form-label">Cognome</label>
                    <input type="text" class="form-control" id="registerSurname" placeholder="Inserisci il tuo cognome" required>

                </div>
                <div class="mb-3">
                    <label for="registerEmail" class="form-label">Indirizzo Email</label>
                    <input type="email" class="form-control" id="registerEmail" placeholder="Inserisci la tua email" required>
                </div>
                <div class="mb-3">
                    <label for="registerPassword" class="form-label">Password</label>
                    <input type="password" class="form-control" id="registerPassword" placeholder="Crea una password" required>
                </div>
                <div class="mb-3">
                    <label for="confirmPassword" class="form-label">Conferma Password</label>
                    <input type="password" class="form-control" id="confirmPassword" placeholder="Conferma la tua password" required>
                </div>
                <button type="submit" class="btn btn-primary w-100">Registrati</button>
            </form>
            <div class="text-center mt-3">
                <a href="/Login">Accedi</a>
            </div>
        </div>
        </div>
        `;

        const form = document.getElementById('authForm');
        const closeBtn = document.getElementById('closeRegister');
        const body = document.querySelector('body');

        if(body.classList.contains('login-page')){
            body.classList.remove('login-page');
        }
        else{
            body.classList.add('login-page');
        }
        
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleRegistration();
        });
        closeBtn.addEventListener('click', () => {
            window.location.href = '/Homepage';
        });
    }

    async handleRegistration() {
        if(document.getElementById('registerPassword').value !== document.getElementById('confirmPassword').value) {
            alert('Le password non corrispondono. Riprova.');
            return;
        }
        fetch('/registrazione', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({                
                email: document.getElementById('registerEmail').value,
                password: document.getElementById('registerPassword').value,
                nome: document.getElementById('registerName').value,
                cognome: document.getElementById('registerSurname').value,
                telefono:""

            })
        })
        .then(response => {
            if(response.ok) {
                return response.json();
            } else {
                throw new Error('Registrazione fallita. Riprova.');
            }
        })
        .then(data => {
            window.location.href = '/Login';
        })
        .catch(error => {
            console.error('Errore durante la registrazione:', error);
            alert('Si è verificato un errore durante la registrazione. Riprova più tardi.');
        }
        );
    }
}

export default Registrazione;