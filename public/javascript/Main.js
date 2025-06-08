import loadCSS from '../utils/loadCSS.js';
import Navbar from '../javascript/components/Navbar.js'
import Footer from '../javascript/components/Footer.js'

document.addEventListener('DOMContentLoaded', async() => {
    const page=document.getElementById('page');
    const navbar = document.getElementById('navbar');
    const footer = document.getElementById('footer');
    const path = window.location.pathname.toLowerCase();
    
    switch(path) {

        case '/':
        case'/homepage':
            const {default:Homepage} = await import ('./components/Homepage.js');
            new Navbar(navbar,()=> loadCSS('/stylesheet/navbar.css')); 
            new Homepage(page,()=> loadCSS('/stylesheet/homepage.css'));
            new Footer(footer,()=> loadCSS('/stylesheet/footer.css'));
            break;


        case '/campionato':
            new Navbar(navbar,()=> loadCSS('/stylesheet/navbar.css'));
            new Footer(footer,()=> loadCSS('/stylesheet/footer.css')); 
            break;


        case '/squadre':
            new Navbar(navbar,()=> loadCSS('/stylesheet/navbar.css'));
            new Footer(footer,()=> loadCSS('/stylesheet/footer.css')); 
            break;


        case '/galleria':
            new Navbar(navbar,()=> loadCSS('/stylesheet/navbar.css'));
            new Footer(footer,()=> loadCSS('/stylesheet/footer.css')); 
            break;


        case '/societa':
            new Navbar(navbar,()=> loadCSS('/stylesheet/navbar.css'));
            new Footer(footer,()=> loadCSS('/stylesheet/footer.css')); 
            break;


        case '/prenotazione':
            new Navbar(navbar,()=> loadCSS('/stylesheet/navbar.css'));
            new Footer(footer,()=> loadCSS('/stylesheet/footer.css')); 
            break;


        case '/login':
            const {default:login} = await import (`./components/Login.js`);
            new login(page,()=> loadCSS('/stylesheet/login.css'));
            break;


        case '/registrazione':
            const {default:Registrazione} = await import (`./components/Registrazione.js`);
            new Registrazione(page,()=> loadCSS('/stylesheet/login.css'));
            break;

        case '/profilo':
            new Navbar(navbar,()=> loadCSS('/stylesheet/navbar.css')); 
            new Footer(footer,()=> loadCSS('/stylesheet/footer.css'));
            break;
        
        default:
            page.innerHTML = `<h1>404 Not Found</h1>`;
            break;

    }
    
});
