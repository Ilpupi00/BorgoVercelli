import ShowModal from '../utils/showModal.js';
console.log("send_email.js caricato!");

export function setupEmailFormListener() {
  const emailForm = document.getElementById('emailForm');
  if (!emailForm) return;

  // Rimuovi eventuali listener precedenti
  const newForm = emailForm.cloneNode(true);
  emailForm.parentNode.replaceChild(newForm, emailForm);

  newForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Submit event triggered');

    // Controllo checkbox privacy
    const privacyCheckbox = newForm.querySelector('#footer_privacy_accept');
    const privacyError = document.getElementById('privacy_error');
    
    if (!privacyCheckbox.checked) {
      if (privacyError) {
        privacyError.style.display = 'block';
      }
      // Usa ShowModal per uniformare lo stile dei modal
      ShowModal.showModalError('Devi accettare la Privacy Policy per inviare il messaggio.', 'Errore invio');
      return;
    }
    
    if (privacyError) {
      privacyError.style.display = 'none';
    }

    const submitBtn = newForm.querySelector('button[type="submit"]');
    // conserva l'HTML originale (icone + testo) così viene ripristinato correttamente
    const originalHTML = submitBtn ? submitBtn.innerHTML : '';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Invio in corso...';

    const formData = new FormData(newForm);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
      phone: formData.get('phone')
    };
    
    console.log('[send_email.js] Sending data:', data);

    try {
      // Usa la stessa route del footer (/contatti)
      const response = await fetch('/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      console.log('Fetch response:', response);

      let result = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
        console.log('Fetch JSON result:', result);
      }

      if (response.ok) {
        // Mostra il modal di successo condiviso
        ShowModal.showModalSuccess('Messaggio inviato', 'Ti risponderemo presto.');
        newForm.reset();
      } else {
        const errorMsg = (result && (result.error || (result.details && result.details.message))) || `Errore ${response.status}: ${response.statusText}`;
        ShowModal.showModalError(errorMsg, 'Errore invio');
      }
    } catch (err) {
      console.error('Errore di rete:', err);
      ShowModal.showModalError('Errore di rete durante l\'invio del messaggio.', 'Errore rete');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
      }
    }
  });
}