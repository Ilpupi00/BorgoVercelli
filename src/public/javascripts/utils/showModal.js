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
              <a href="/homepage" class="btn btn-success btn-sm me-2 ms-2">Vai alla homepage</a>
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
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
  }
}



window.ShowModal = ShowModal;