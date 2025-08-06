
class Login{
    constructor(element,loader) {
        if(typeof loader === 'function') loader();
        this.element = element;
        this.init();
    }

    init(){
        this.render();
    }
    
    render() {
        this.element.innerHTML = `
        <div class="container d-flex justify-content-center align-items-center vh-100">
            <div class="card p-4 shadow-lg login-card">
                <h1 class="text-center mb-4 title">Accedi</h1>
                <form id="authForm">
                    <div class="mb-3">
                        <label for="exampleInputEmail1" class="form-label">Indirizzo Email</label>
                        <input type="email" class="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Inserisci la tua email" required>
                    </div>
                    <div class="mb-3">
                        <label for="exampleInputPassword1" class="form-label">Password</label>
                        <input type="password" class="form-control" id="exampleInputPassword1" placeholder="Inserisci la tua password" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Accedi</button>
                </form>
                <div class="text-center mt-3">
                    <a href="#" class="text-decoration-none">Hai dimenticato la password?</a>
                </div>
                <div class="text-center mt-3">
                    <a href="/Registrazione">Registrati</a>
                    </div>
                </div>
            </div>
        `;

        const form = document.getElementById('authForm');
        const body = document.querySelector('body');

        if(body.classList.contains('login-page')){
            body.classList.remove('login-page');
        }
        else{
            body.classList.add('login-page');
        }
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleLogin();
        });
    }

    handleLogin() {
        const email = document.getElementById('exampleInputEmail1').value;
        const password = document.getElementById('exampleInputPassword1').value;
        fetch('/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(res => {
            if (res.ok) {
                window.location.href = '/Homepage';
            } else {
                alert('Credenziali non valide');
            }
        })
        .catch(() => alert('Errore di login'));
    }
}

export default Login;