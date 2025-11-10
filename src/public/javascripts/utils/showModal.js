class ShowModal{

  static async showLoginRequiredModal(string) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'modalLoginRequired';
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-warning text-dark">
            <h5 class="modal-title"><i class="bi bi-exclamation-triangle-fill me-2"></i>Accesso richiesto</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center">
            <i class="bi bi-shield-lock-fill text-warning" style="font-size: 3rem;"></i>
            <p class="mt-3">${string}<br>Effettua il login per continuare.</p>
            <a href="/login" class="btn btn-primary">Vai al login</a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
      modal.addEventListener('hidden.bs.modal', () => {
      modal.remove();
    });
  }

  static async showModalSuccess(string, msg = 'La tua prenotazione è stata confermata!'){
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = 'modalSuccess';
      modal.tabIndex = -1;
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title"><i class="bi bi-check-circle-fill me-2"></i>${string}</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center">
              <i class="bi bi-check-circle text-success" style="font-size: 3rem;"></i>
              <p class="mt-3">${msg}</p>
            </div>
            <div class="modal-footer d-flex justify-content-center">
              <button type="button" class="btn btn-outline-success btn-sm" data-bs-dismiss="modal">Chiudi</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
      modal.addEventListener('hidden.bs.modal', () => {
          modal.remove();
      });
  }
  static async showModalError(msg,string) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'modalError';
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title"><i class="bi bi-exclamation-triangle-fill me-2"></i>${string}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center">
            <i class="bi bi-x-circle text-danger" style="font-size: 3rem;"></i>
            <p class="mt-3">${msg}</p>
          </div>
          <div class="modal-footer d-flex justify-content-center">
            <button type="button" class="btn btn-outline-danger" data-bs-dismiss="modal">Chiudi</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
  }
  static async showModalInfo(msg,string) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'modalInfo';
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-info text-white">
            <h5 class="modal-title"><i class="bi bi-info-circle-fill me-2"></i>${string}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center">
            <i class="bi bi-info-circle text-info" style="font-size: 3rem;"></i>
            <p class="mt-3">${msg}</p>
          </div>
          <div class="modal-footer d-flex justify-content-center">
            <button type="button" class="btn btn-outline-info" data-bs-dismiss="modal">Chiudi</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });           
  }
  
  static async modalDelete(msg,string) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = 'modalDelete';
      modal.tabIndex = -1;
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title"><i class="bi bi-trash-fill me-2"></i>${string}</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center">
              <i class="bi bi-trash text-danger" style="font-size: 3rem;"></i>
              <p class="mt-3">${msg}</p>
            </div>
            <div class="modal-footer d-flex justify-content-center">
              <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Elimina</button>
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Annulla</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();

      const confirmBtn = modal.querySelector('#confirmDeleteBtn');
      const onConfirm = () => {
        try { bsModal.hide(); } catch (e) { /* ignore */ }
        resolve(true);
      };
      if (confirmBtn) confirmBtn.addEventListener('click', onConfirm, { once: true });

      // cancel / close resolves false
      modal.addEventListener('hidden.bs.modal', () => {
        resolve(false);
        modal.remove();
      }, { once: true });

      const cancelBtn = modal.querySelector('[data-bs-dismiss="modal"]');
      if (cancelBtn) cancelBtn.addEventListener('click', () => { try { bsModal.hide(); } catch (e) {} }, { once: true });
    });
  }

  // Generic confirmation modal for non-delete actions (publish/suspend, etc.)
  static async modalConfirm(msg, string, confirmLabel = 'Conferma', confirmClass = 'btn-primary', iconClass = 'bi-question-circle', iconColor = 'text-primary') {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = 'modalConfirmAction';
      modal.tabIndex = -1;
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-secondary text-white">
              <h5 class="modal-title"><i class="bi ${iconClass} me-2"></i>${string}</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center">
              <i class="bi ${iconClass} ${iconColor}" style="font-size: 3rem;"></i>
              <p class="mt-3">${msg}</p>
            </div>
            <div class="modal-footer d-flex justify-content-center">
              <button type="button" class="btn ${confirmClass}" id="confirmActionBtn">${confirmLabel}</button>
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Annulla</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();

      const confirmBtn = modal.querySelector('#confirmActionBtn');
      const onConfirm = () => {
        try { bsModal.hide(); } catch (e) { /* ignore */ }
        resolve(true);
      };
      if (confirmBtn) confirmBtn.addEventListener('click', onConfirm, { once: true });

      // cancel / close resolves false
      modal.addEventListener('hidden.bs.modal', () => { 
        resolve(false);
        modal.remove();
      }, { once: true });

      const cancelBtn = modal.querySelector('[data-bs-dismiss="modal"]');
      if (cancelBtn) cancelBtn.addEventListener('click', () => { try { bsModal.hide(); } catch (e) {} }, { once: true });
    });
  }

  static async showUploadModal(callback) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'uploadModal';
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-cloud-upload me-2"></i>Carica Foto</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="descriptionTextarea" class="form-label">Descrizione (opzionale)</label>
              <textarea class="form-control" id="descriptionTextarea" rows="3" placeholder="Inserisci una descrizione per la foto"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
            <button type="button" class="btn btn-success" id="uploadConfirmBtn">Conferma</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    const uploadBtn = modal.querySelector('#uploadConfirmBtn');
    uploadBtn.addEventListener('click', () => {
      const descrizione = modal.querySelector('#descriptionTextarea').value;
      bsModal.hide();
      callback(descrizione);
    });
    modal.addEventListener('hidden.bs.modal', () => {
      modal.remove();
    });
  }
}

// Expose ShowModal on window for non-module usage
window.ShowModal = ShowModal;
