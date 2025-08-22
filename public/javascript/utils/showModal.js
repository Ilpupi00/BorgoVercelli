class ShowModal{

  static async showLoginRequiredModal(string) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'modalLoginRequired';
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-warning">
            <h5 class="modal-title">Accesso richiesto</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center">
            <p>${string}<br>Effettua il login per continuare.</p>
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

  // Fine classe Prenotazione
  static async showModalSuccess(string){
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = 'modalSuccess';
      modal.tabIndex = -1;
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-success">
              <h5 class="modal-title">${string}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center">
              <p>La tua prenotazione è stata confermata!</p>
            </div>
            <div class="modal-footer d-flex justify-content-center">
              <a href="/Homepage" class="btn btn-primary btn-sm me-2 ms-2">Vai alla homepage</a>
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
          <div class="modal-header bg-danger">
            <h5 class="modal-title">${string}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center">
            <p>${msg}</p>
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

export default ShowModal;