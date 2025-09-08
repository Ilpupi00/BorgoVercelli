console.log("send_email.js caricato!");

function createOrGetModal() {
  let modal = document.getElementById('customModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'customModal';
    modal.innerHTML = `
      <div class="modal fade" id="customModal" tabindex="-1" aria-labelledby="customModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="customModalLabel">Messaggio</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Chiudi"></button>
            </div>
          <div class="modal-body">
            <p id="modalMessage"></p>
          </div>
        </div>
      </div>
      </div>  
    `;
    document.body.appendChild(modal);
    // Close modal on click
    modal.querySelector('#closeModalBtn').onclick = () => { modal.style.display = 'none'; };
    // Close modal on outside click
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
  }
  return modal;
}


function showModalMessage(message) {
  console.log('showModalMessage chiamata con:', message);
  const modal = createOrGetModal();
  modal.querySelector('#modalMessage').textContent = message;
  modal.style.display = 'flex';
  console.log('Modal display:', modal.style.display);
}

export function setupEmailFormListener() {
  const emailForm = document.getElementById('emailForm');
  if (emailForm) {
    // Rimuovi eventuali listener precedenti per evitare doppio invio
    emailForm.onsubmit = null;
    emailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Submit event triggered');
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
        console.log('Fetch response:', response);
        let result = null;
        try {
          result = await response.json();
          console.log('Fetch JSON result:', result);
        } catch (jsonErr) {
          console.error('Errore parsing JSON:', jsonErr);
        }
        if (response.ok) {
          showModalMessage('Messaggio inviato con successo!');
          emailForm.reset();
        } else {
          showModalMessage((result && result.error) || 'Errore durante l\'invio del messaggio.');
        }
      } catch (err) {
        console.error('Errore di rete:', err);
        showModalMessage('Errore di rete durante l\'invio del messaggio.');
      }
    });
  }
}
