console.log("send_email.js caricato!");

function createOrGetModal() {
  let modal = document.getElementById('emailModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'emailModal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', 'emailModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="emailModalLabel">Notifica</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Chiudi"></button>
          </div>
          <div class="modal-body">
            <p id="emailModalMessage"></p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  return modal;
}

function showModalMessage(message, isSuccess = false) {
  console.log('showModalMessage chiamata con:', message);
  const modal = createOrGetModal();
  const modalMessage = modal.querySelector('#emailModalMessage');
  const modalTitle = modal.querySelector('#emailModalLabel');

  modalMessage.textContent = message;
  modalTitle.textContent = isSuccess ? 'Successo' : 'Errore';

  if (isSuccess) {
    modal.querySelector('.modal-header').classList.remove('bg-danger');
    modal.querySelector('.modal-header').classList.add('bg-success');
  } else {
    modal.querySelector('.modal-header').classList.remove('bg-success');
    modal.querySelector('.modal-header').classList.add('bg-danger');
  }

  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
}

export function setupEmailFormListener() {
  const emailForm = document.getElementById('emailForm');
  if (!emailForm) return;

  // Rimuovi eventuali listener precedenti
  const newForm = emailForm.cloneNode(true);
  emailForm.parentNode.replaceChild(newForm, emailForm);

  newForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Submit event triggered');

    const submitBtn = newForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Invio in corso...';

    const formData = new FormData(newForm);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message')
    };

    try {
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
        showModalMessage('Messaggio inviato con successo!', true);
        newForm.reset();
      } else {
        const errorMsg = (result && result.error) || `Errore ${response.status}: ${response.statusText}`;
        showModalMessage(errorMsg, false);
      }
    } catch (err) {
      console.error('Errore di rete:', err);
      showModalMessage('Errore di rete durante l\'invio del messaggio.', false);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}