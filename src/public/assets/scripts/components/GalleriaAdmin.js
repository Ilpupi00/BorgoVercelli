class GalleriaAdmin {
  constructor() {
    this.currentImageId = null;
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Bind upload buttons (open file picker -> ask description -> upload)
    document.querySelectorAll('.carica-btn, #caricaBtn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleUploadClick(e.currentTarget);
      });
    });

    // Intercept any anchor that points to the server upload page to open file picker instead
    document.querySelectorAll('a[href="/upload-galleria"]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleUploadClick(a);
      });
    });

    document.querySelectorAll('.modifica-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const descrizione = e.currentTarget.dataset.descrizione;
        this.modificaImmagine(id, descrizione);
      });
    });

    document.querySelectorAll('.elimina-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.eliminaImmagine(id);
      });
    });

    const saveEditBtn = document.getElementById('saveEditBtn');
    if (saveEditBtn) {
      saveEditBtn.addEventListener('click', () => this.salvaModifica());
    }

    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', () => this.confermaEliminazione());
    }
  }

  visualizzaImmagine(url) {
    const img = document.getElementById('modalImage');
    if (img) img.src = url;
    const el = document.getElementById('imageModal');
    if (el && typeof bootstrap !== 'undefined') new bootstrap.Modal(el).show();
  }

  modificaImmagine(id, descrizione) {
    this.currentImageId = id;
    const input = document.getElementById('descrizioneInput');
    if (input) input.value = descrizione;
    const el = document.getElementById('editModal');
    if (el && typeof bootstrap !== 'undefined') new bootstrap.Modal(el).show();
  }

  salvaModifica() {
    const descrizioneEl = document.getElementById('descrizioneInput');
    const descrizione = descrizioneEl ? descrizioneEl.value.trim() : '';

    if (!this.currentImageId) {
      alert('Errore: ID immagine non trovato');
      return;
    }

    fetch(`/UpdateImmagine/${this.currentImageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ descrizione })
    })
      .then(r => r.json())
      .then(data => {
        if (data.message) {
          alert('Immagine aggiornata con successo!');
          const editEl = document.getElementById('editModal');
          if (editEl && typeof bootstrap !== 'undefined') bootstrap.Modal.getInstance(editEl)?.hide();
          location.reload();
        } else {
          alert('Errore durante l\'aggiornamento: ' + (data.error || 'Errore sconosciuto'));
        }
      })
      .catch(err => {
        console.error('Errore:', err);
        alert('Errore durante l\'aggiornamento dell\'immagine');
      });
  }

  handleUploadClick(target) {
    // Create a hidden file input to trigger OS file picker
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.addEventListener('change', async (ev) => {
      const file = ev.target.files && ev.target.files[0];
      document.body.removeChild(fileInput);
      if (!file) return;

      // Use the existing ShowModal to ask for an optional description
      if (typeof ShowModal !== 'undefined' && typeof ShowModal.showUploadModal === 'function') {
        try {
          ShowModal.showUploadModal(async (descrizione) => {
            await this.uploadFile(file, descrizione);
          });
        } catch (err) {
          // Fallback: prompt
          const descrizione = prompt('Inserisci descrizione (opzionale):') || '';
          await this.uploadFile(file, descrizione);
        }
      } else {
        const descrizione = prompt('Inserisci descrizione (opzionale):') || '';
        await this.uploadFile(file, descrizione);
      }
    }, { once: true });

    // Trigger click to open file picker
    fileInput.click();
  }

  async uploadFile(file, descrizione = '') {
    const form = new FormData();
    form.append('image', file);
    form.append('descrizione', descrizione);

    try {
      const res = await fetch('/UploadImmagine', {
        method: 'POST',
        body: form,
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // server should return the created image as `image` in the response
        const imageObj = data.image || (data.url ? { id: data.id || null, url: data.url, descrizione: descrizione, created_at: new Date().toISOString() } : null);
        if (typeof ShowModal !== 'undefined' && ShowModal.showModalSuccess) {
          await ShowModal.showModalSuccess('Caricamento completato', data.message || 'Immagine caricata con successo!');
          const successModal = document.getElementById('modalSuccess');
          if (successModal && typeof bootstrap !== 'undefined') {
            if (imageObj) {
              successModal.addEventListener('hidden.bs.modal', () => { this.addImageToGallery(imageObj); }, { once: true });
            }
          } else {
            if (imageObj) setTimeout(() => this.addImageToGallery(imageObj), 300);
          }
        } else {
          alert(data.message || 'Immagine caricata con successo!');
          if (imageObj) this.addImageToGallery(imageObj);
        }
      } else {
        const errMsg = data.error || data.message || 'Errore durante il caricamento';
        if (typeof ShowModal !== 'undefined' && ShowModal.showModalError) await ShowModal.showModalError(errMsg, 'Errore');
        else alert(errMsg);
      }
    } catch (err) {
      console.error('Upload error:', err);
      if (typeof ShowModal !== 'undefined' && ShowModal.showModalError) await ShowModal.showModalError('Errore di rete durante il caricamento', 'Errore');
      else alert('Errore di rete durante il caricamento');
    }
  }

  async performDelete() {
    if (!this.currentImageId) {
      if (typeof ShowModal !== 'undefined') await ShowModal.showModalError('ID immagine non trovato', 'Errore');
      else alert('Errore: ID immagine non trovato');
      return;
    }

    try {
      const res = await fetch(`/DeleteImmagine/${this.currentImageId}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (res.ok && (data.message || data.success)) {
        if (typeof ShowModal !== 'undefined') {
          await ShowModal.showModalSuccess('Eliminazione completata', 'Immagine eliminata con successo!');
          // dopo che il modal di successo viene nascosto, ricarica la pagina
          const successModal = document.getElementById('modalSuccess');
          if (successModal && typeof bootstrap !== 'undefined') {
            const onHidden = () => { location.reload(); };
            successModal.addEventListener('hidden.bs.modal', onHidden, { once: true });
          } else {
            // fallback: ricarica comunque
            setTimeout(() => location.reload(), 600);
          }
        } else {
          alert('Immagine eliminata con successo!');
          location.reload();
        }

        // Hide the dynamic delete modal created by ShowModal (id: 'modalDelete')
        const dynamicModalEl = document.getElementById('modalDelete');
        if (dynamicModalEl && typeof bootstrap !== 'undefined') {
          const bs = bootstrap.Modal.getInstance(dynamicModalEl);
          if (bs) bs.hide();
        }

      } else {
        if (typeof ShowModal !== 'undefined') await ShowModal.showModalError(data.error || 'Errore sconosciuto', 'Errore durante l\'eliminazione');
        else alert('Errore durante l\'eliminazione: ' + (data.error || 'Errore sconosciuto'));
      }
    } catch (err) {
      console.error('Errore:', err);
      if (typeof ShowModal !== 'undefined') await ShowModal.showModalError('Errore durante l\'eliminazione dell\'immagine', 'Errore');
      else alert('Errore durante l\'eliminazione dell\'immagine');
    }
  }

  eliminaImmagine(id) {
    this.currentImageId = id;
    if (typeof ShowModal !== 'undefined' && typeof bootstrap !== 'undefined') {
      ShowModal.modalDelete('Sei sicuro di voler eliminare questa immagine? Questa azione non può essere annullata.', 'Conferma eliminazione');
      const attach = () => {
        const dynamicModal = document.getElementById('modalDelete');
        if (!dynamicModal) return false;
        const confirmBtn = dynamicModal.querySelector('#confirmDeleteBtn');
        if (confirmBtn) {
          confirmBtn.addEventListener('click', async () => { await this.performDelete(); }, { once: true });
          return true;
        }
        return false;
      };
      if (!attach()) setTimeout(() => attach(), 50);
      return;
    }

    const el = document.getElementById('deleteModal');
    if (el && typeof bootstrap !== 'undefined') new bootstrap.Modal(el).show();
  }

  confermaEliminazione() { this.performDelete(); }

  addImageToGallery(image) {
    if (!image || !image.url) return;
    const adminContent = document.querySelector('.admin-content');
    if (!adminContent) return;
    let row = adminContent.querySelector(':scope > .row');
    if (!row) row = adminContent.querySelector('.row');
    if (!row) return;

    // remove placeholder when no images
    const placeholder = row.querySelector('.col-12.text-center');
    if (placeholder) placeholder.remove();

    const col = document.createElement('div');
    col.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';

    const descr = image.descrizione ? image.descrizione.replace(/"/g, '&quot;') : '';
    const created = image.created_at ? new Date(image.created_at).toLocaleDateString('it-IT') : 'N/A';

    col.innerHTML = `
      <div class="card h-100">
        <div class="card-img-container">
          <img src="${image.url}" class="card-img-top" alt="${descr || 'Immagine galleria'}" style="height: 200px; object-fit: cover;">
        </div>
        <div class="card-body d-flex flex-column">
          <h6 class="card-title">${descr || 'Senza descrizione'}</h6>
          <p class="card-text text-muted small">Caricato: ${created}</p>
          <div class="mt-auto">
            <div class="btn-group w-100" role="group">
              <button class="btn btn-sm btn-outline-primary" onclick="galleriaAdmin.visualizzaImmagine('${image.url}')"><i class="bi bi-eye"></i></button>
              <button class="btn btn-sm btn-outline-warning modifica-btn" data-id="${image.id || ''}" data-descrizione="${descr}"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger elimina-btn" data-id="${image.id || ''}"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        </div>
      </div>
    `;

    row.insertBefore(col, row.firstElementChild);

    // bind events on the new buttons
    const modificaBtn = col.querySelector('.modifica-btn');
    if (modificaBtn) modificaBtn.addEventListener('click', (e) => this.modificaImmagine(e.currentTarget.dataset.id, e.currentTarget.dataset.descrizione));
    const eliminaBtn = col.querySelector('.elimina-btn');
    if (eliminaBtn) eliminaBtn.addEventListener('click', (e) => this.eliminaImmagine(e.currentTarget.dataset.id));
  }
}

document.addEventListener('DOMContentLoaded', () => { window.galleriaAdmin = new GalleriaAdmin(); });
