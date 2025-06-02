import Router from './router/Router.js';
import HomePage from './views/HomePage.js';
import SquadrePage from './views/SquadrePage.js';
import CampionatoPage from './views/CampionatoPage.js';
import GalleriaPage from './views/GalleriaPage.js';
import SocietaPage from './views/SocietaPage.js';
import PrenotazionePage from './views/PrenotazionePage.js';
import LoginPage from './views/LoginPage.js';

// Initialize the router with routes
const router = new Router();

// Define routes
router.addRoute('/', HomePage);
router.addRoute('/squadre', SquadrePage);
router.addRoute('/campionato', CampionatoPage);
router.addRoute('/galleria', GalleriaPage);
router.addRoute('/societa', SocietaPage);
router.addRoute('/prenotazione', PrenotazionePage);
router.addRoute('/login', LoginPage);

// Initialize the SPA
document.addEventListener('DOMContentLoaded', () => {
  // Add click handlers for navigation
  document.body.addEventListener('click', e => {
    if (e.target.matches('[data-link]')) {
      e.preventDefault();
      history.pushState(null, null, e.target.href);
      router.navigate(window.location.hash);
    }
  });

  // Set up the contact form submission
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(contactForm);
      const formDataObj = Object.fromEntries(formData.entries());
      
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formDataObj)
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert('Messaggio inviato con successo!');
          contactForm.reset();
        } else {
          alert('Errore: ' + result.message);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Si è verificato un errore durante l\'invio del messaggio.');
      }
    });
  }

  // Handle navigation events
  window.addEventListener('popstate', () => {
    router.navigate(window.location.hash);
  });

  // Initial navigation
  router.navigate(window.location.hash);
});