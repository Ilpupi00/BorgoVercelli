import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';
document.addEventListener('DOMContentLoaded', () => {
    const navbar=document.getElementById('navbar');
    const footer=document.getElementById('footer');

    if(navbar) new Navbar(navbar);
    if(footer) new Footer(footer);
});
