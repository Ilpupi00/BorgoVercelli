import loadCSS from '../utils/loadCSS.js';

document.addEventListener('DOMContentLoaded', async() => {
    const page=document.getElementById('page');
    const navbar = document.getElementById('navbar');
    const footer = document.getElementById('footer');
    const path = window.location.pathname.toLowerCase();
    
    switch(path) {

        case '/':
        case'/homepage':
            const { default: Navbar } = await import('./components/Navbar.js');
            const { default: Footer } = await import('./components/Footer.js');
            const {default:Homepage} = await import ('./components/Homepage.js');
    
            new Navbar(navbar,()=> loadCSS('/stylesheet/navbar.css')); 
            new Homepage(page,()=> loadCSS('/stylesheet/homepage.css'));
            new Footer(footer,()=> loadCSS('/stylesheet/footer.css'));
            break;


        case '/campionato':
            page.innerHTML = `<h1>Page not implemented yet</h1>`;
            break;


        case '/squadre':
            page.innerHTML = `<h1>Page not implemented yet</h1>`
            break;


        case '/galleria':
            page.innerHTML = `<h1>Page not implemented yet</h1>`;
            break;


        case '/societa':
            page.innerHTML = `<h1>Page not implemented yet</h1>`;
            break;


        case '/prenotazione':
            page.innerHTML = `<h1>Page not implemented yet</h1>`;
            break;


        case '/login':
            const {default:login} = await import (`./components/Login.js`);
            new login(page,()=> loadCSS('/stylesheet/login.css'));
            break;


        case '/registrazione':
            const {default:Registrazione} = await import (`./components/Registrazione.js`);
            new Registrazione(page,()=> loadCSS('/stylesheet/login.css'));
            break;


        default:
            page.innerHTML = `<h1>404 Not Found</h1>`;
            break;

    }
    
});
