import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';
import loadCSS from '../utils/loadCSS.js';

document.addEventListener('DOMContentLoaded', async() => {
    const navbar=document.getElementById('navbar');
    const footer=document.getElementById('footer');
    const page=document.getElementById('page');
    const path = window.location.pathname.toLowerCase();

    if(path === '/' || path === '/homepage') {
        const {default:Homepage} = await import ('./components/Homepage.js');
        const loader =()=>loadCSS('/stylesheet/homepage.css'); 
        new Homepage(page,loader);
    }
    else if(path === '/campionato' || path === '/squadre' || path === '/galleria' || path === '/societa' || path === '/prenotazione') {
        page.innerHTML = `<h1>Page not implemented yet</h1>`;
    }
    else if(path === '/login') {
        if(navbar.classList.contains('hide')) {
            navbar.classList.remove('hide');
        }else {
            navbar.classList.add('hide');
        }
        if(footer.classList.contains('hide')) {
            footer.classList.remove('hide');
        }else {
            footer.classList.add('hide');
        }

        const {default:login} = await import (`./components/Login.js`);
        const loader = () => loadCSS('/stylesheet/login.css');
        new login(page,loader);
    }
    else if(path === '/registrazione') {
        if(navbar.classList.contains('hide')) {
            navbar.classList.remove('hide');
        }else {
            navbar.classList.add('hide');
        }
        if(footer.classList.contains('hide')) {
            footer.classList.remove('hide');
        }else {
            footer.classList.add('hide');
        }

        const {default:Registrazione} = await import (`./components/Registrazione.js`);
        const loader = () => loadCSS('/stylesheet/login.css');
        new Registrazione(page,loader);
    }
    else {
        page.innerHTML = `<h1>404 Not Found</h1>`;
    }
    if(navbar) new Navbar(navbar);
    if(footer) new Footer(footer);
    
});
