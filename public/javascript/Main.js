import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';
document.addEventListener('DOMContentLoaded', () => {
    const navbar=document.getElementById('navbar');
    const footer=document.getElementById('footer');
    const path = window.location.pathname.toLowerCase();

    if(navbar) new Navbar(navbar,path);
    if(footer) new Footer(footer);
});
