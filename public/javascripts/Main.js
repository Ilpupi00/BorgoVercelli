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

        case'/homepage':
            const {default:Homepage} = await import ('./components/Homepage.js');
            new Navbar(navbar,()=> loadCSS('/stylesheets/Navbar.css')); 
            new Homepage(page,()=> loadCSS('/stylesheets/Homepage.css'));
            new Footer(footer,()=> loadCSS('/stylesheets/Footer.css'));
            setupEmailFormListener();
            break;


        case '/campionato':
            const {default:Campionato}=await import('./components/Campionato.js')
            new Navbar(navbar,()=> loadCSS('/stylesheets/Navbar.css'));
            new Footer(footer,()=> loadCSS('/stylesheets/Footer.css'));
            new Campionato(page,()=>'/stylesheet/Campionato.css');
            
            setupEmailFormListener();
            break;


        case '/squadre':
            const {default:Squadra} = await import ('./components/Squadre.js');
            new Navbar(navbar,()=> loadCSS('/stylesheets/Navbar.css'));
            new Footer(footer,()=> loadCSS('/stylesheets/Footer.css'));
            new Squadra(page,()=> loadCSS('/stylesheets/Squadra.css'));
            setupEmailFormListener();
            break;


        case '/galleria':
            const {default:Galleria} = await import ('./components/Galleria.js');
            new Navbar(navbar,()=> loadCSS('/stylesheets/Navbar.css'));
            new Footer(footer,()=> loadCSS('/stylesheets/Footer.css'));
            new Galleria(page,()=> loadCSS('/stylesheets/Galleria.css'));
            
            setupEmailFormListener();
            break;


        case '/societa':
            const {default:Societa} = await import ('./components/Società.js');
            new Navbar(navbar,()=> loadCSS('/stylesheets/Navbar.css'));
            new Footer(footer,()=> loadCSS('/stylesheets/Footer.css'));
            new Societa(page,()=> loadCSS('/stylesheets/Società.css'));
            
            setupEmailFormListener();
            break;


        case '/prenotazione':
            const {default:Prenotazione} = await import ('./components/Prenotazione.js');
            new Navbar(navbar,()=> loadCSS('/stylesheets/Navbar.css'));
            new Footer(footer,()=> loadCSS('/stylesheets/Footer.css'));
            new Prenotazione(page,()=>loadCSS('/stylesheets/Prenotazione.css'));
            
            setupEmailFormListener();
            break;


        case '/login':
            const {default:login} = await import (`./components/Login.js`);
            new login(page,()=> loadCSS('/stylesheets/Login.css'));
            break;


        case '/registrazione':
            const {default:Registrazione} = await import (`./components/Registrazione.js`);
            new Registrazione(page,()=> loadCSS('/stylesheets/login.css'));
            break;
            
        case '/me':
            const {default:Profilo} = await import (`./components/Profilo.js`);
            new Navbar(navbar,()=> loadCSS('/stylesheets/Navbar.css'));
            new Footer(footer,()=> loadCSS('/stylesheets/Footer.css'));
            new Profilo(page,()=> loadCSS('/stylesheets/Profilo.css'));
            setupEmailFormListener();
            break;
        case '/scrivi/recensione':
            const {default:ScriviRecensione} = await import (`./components/ScriviRecensione.js`);
            new ScriviRecensione(page,()=> loadCSS('/stylesheets/ScriviRecensioni.css'));
            new Footer(footer,()=> loadCSS('/stylesheets/Footer.css'));
            new Navbar(navbar,()=> loadCSS('/stylesheets/Navbar.css'));
            setupEmailFormListener();
            break;

        case '/notizie/all':
            const { default: Notizie } = await import('./components/Notizie.js');
            new Navbar(navbar,()=> loadCSS('/stylesheets/Navbar.css'));
            new Footer(footer,()=> loadCSS('/stylesheets/Footer.css'));
            new Notizie(page,()=> loadCSS('/stylesheets/Notizie.css'));
            setupEmailFormListener();
            break;
        default:
            page.innerHTML=`<h1>404 - Pagina non trovata</h1>`;
            break;
    }
    
});
