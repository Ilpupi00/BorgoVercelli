console.log("send_email.js caricato!");

function createOrGetModal() {
  let modal = document.getElementById('customModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'customModal';
    modal.className = 'modal fade';
    modal.tabIndex = -1;
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Notifica</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" id="closeModalBtn"></button>
          </div>
          <div class="modal-body">
            <p id="modalMessage" class="mb-0"></p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    // Gestione chiusura con Bootstrap
    const closeBtn = modal.querySelector('#closeModalBtn');
    closeBtn.onclick = () => {
      const modalInstance = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
      modalInstance.hide();
    };
  }
  return modal;
}

function showModalMessage(message) {
  const modal = createOrGetModal();
  modal.querySelector('#modalMessage').textContent = message;
  // Usa Bootstrap Modal per mostrare
  const modalInstance = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
  modalInstance.show();
}

export function setupEmailFormListener() {
  const emailForm = document.getElementById('emailForm');
  if (emailForm) {
    emailForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(emailForm);
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

        const result = await response.json();
        if (response.ok) {
          showModalMessage('Messaggio inviato con successo!');
          emailForm.reset();
        } else {
          showModalMessage(result.error || 'Errore durante l\'invio del messaggio.');
        }
      } catch (err) {
        showModalMessage('Errore di rete durante l\'invio del messaggio.');
      }
    });
  }
}
