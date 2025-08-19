import loadCSS from './utils/loadCSS.js';
import Footer from './components/Footer.js';
import Navbar from './components/Navbar.js';
import { setupEmailFormListener } from './components/send_email.js';

document.addEventListener('DOMContentLoaded', async() => {
    const page=document.getElementById('page');
    const navbar = document.getElementById('navbar');
    const footer = document.getElementById('footer');
    const path = window.location.pathname.toLowerCase();
    
    switch(path) {

        case '/':
        case'/homepage':
            const {default:Homepage} = await import ('./components/Homepage.js');
            new Navbar(navbar,()=> loadCSS('/stylesheet/Navbar.css')); 
            new Homepage(page,()=> loadCSS('/stylesheet/homepage.css'));
            new Footer(footer,()=> loadCSS('/stylesheet/Footer.css'));
            setupEmailFormListener();
            break;


        case '/campionato':
            const {default:Campionato}=await import('./components/Campionato.js')
            new Navbar(navbar,()=> loadCSS('/stylesheet/Navbar.css'));
            new Footer(footer,()=> loadCSS('/stylesheet/Footer.css'));
            new Campionato(page,()=>'/stylesheet/Campionato.css');
            
            setupEmailFormListener();
            break;


        case '/squadre':
            const {default:Squadra} = await import ('./components/Squadre.js');
            new Navbar(navbar,()=> loadCSS('/stylesheet/Navbar.css'));
            new Footer(footer,()=> loadCSS('/stylesheet/Footer.css'));
            new Squadra(page,()=> loadCSS('/stylesheet/Squadra.css'));
            setupEmailFormListener();
            break;


        case '/galleria':
            const {default:Galleria} = await import ('./components/Galleria.js');
            new Navbar(navbar,()=> loadCSS('/stylesheet/Navbar.css'));
            new Footer(footer,()=> loadCSS('/stylesheet/Footer.css'));
            new Galleria(page,()=> loadCSS('/stylesheet/Galleria.css'));
            
            setupEmailFormListener();
            break;


        case '/societa':
            const {default:Societa} = await import ('./components/Società.js');
            new Navbar(navbar,()=> loadCSS('/stylesheet/Navbar.css'));
            new Footer(footer,()=> loadCSS('/stylesheet/Footer.css'));
            new Societa(page,()=> loadCSS('/stylesheet/Società.css'));
            
            setupEmailFormListener();
            break;


        case '/prenotazione':
            const {default:Prenotazione} = await import ('./components/Prenotazione.js');
            new Navbar(navbar,()=> loadCSS('/stylesheet/Navbar.css'));
            new Footer(footer,()=> loadCSS('/stylesheet/Footer.css'));
            new Prenotazione(page,()=> {
                console.log('Inizializzo Prenotazione, page:', page);
                loadCSS('/stylesheet/Prenotazione.css');
            });
            
            setupEmailFormListener();
            break;


        case '/login':
            const {default:login} = await import (`./components/Login.js`);
            new login(page,()=> loadCSS('/stylesheet/login.css'));
            break;


        case '/registrazione':
            const {default:Registrazione} = await import (`./components/Registrazione.js`);
            new Registrazione(page,()=> loadCSS('/stylesheet/login.css'));
            break;
            
        case '/me':
            const {default:Profilo} = await import (`./components/Profilo.js`);
            new Navbar(navbar,()=> loadCSS('/stylesheet/Navbar.css'));
            new Footer(footer,()=> loadCSS('/stylesheet/Footer.css'));
            new Profilo(page,()=> loadCSS('/stylesheet/profilo.css'));
            setupEmailFormListener();
            break;
        default:
            page.innerHTML = `<h1>404 Not Found</h1>`;
            break;

    }
    
});
