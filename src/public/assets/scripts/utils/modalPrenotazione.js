/**
 * Mostra un modal per la prenotazione di un campo
 * @param {Object} campo - Dati del campo selezionato
 * @param {Array} orariDisponibili - Orari disponibili per la prenotazione
 * @param {Function} onSubmit - Funzione da chiamare al submit
 */
export function showModalPrenotazione(campo, orariDisponibili, onSubmit) {
    // Crea il contenitore del modal
    let modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'modalPrenotazioneCampo';
    modal.tabIndex = -1;
      modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Prenota il campo: ${campo.nome || campo.tipo}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form id="formPrenotazioneCampo">
          <div class="modal-body">
            <div class="mb-3">
              <label for="dataPrenotazione" class="form-label">Data</label>
              <input type="date" class="form-control" id="dataPrenotazione" name="dataPrenotazione" required value="${new Date().toISOString().slice(0,10)}">
            </div>
            <div class="mb-3">
              <label for="orarioPrenotazione" class="form-label">Orario</label>
              <select class="form-select" id="orarioPrenotazione" name="orarioPrenotazione" required>
                <!-- opzioni orari -->
              </select>
            </div>
            <div class="mb-3">
              <label for="notePrenotazione" class="form-label">Note</label>
              <textarea class="form-control" id="notePrenotazione" name="notePrenotazione" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
            <button type="submit" class="btn btn-primary">Conferma prenotazione</button>
          </div>
          </form>
        </div>
      </div>
      `;
    document.body.appendChild(modal);

    // Mostra il modal con Bootstrap
    let bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    // Gestione submit
    modal.querySelector('#formPrenotazioneCampo').addEventListener('submit', function(e) {
        e.preventDefault();
        const data = modal.querySelector('#dataPrenotazione').value;
        const [ora_inizio, ora_fine] = modal.querySelector('#orarioPrenotazione').value.split('|');
        const note = modal.querySelector('#notePrenotazione').value;
        onSubmit({
            campo_id: campo.id,
            data_prenotazione: data,
            ora_inizio,
            ora_fine,
            note
        });
        bsModal.hide();
        setTimeout(() => modal.remove(), 500);
    });

    // Rimuovi il modal dal DOM quando viene chiuso
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });

    // Miglioramento accessibilità: gestione focus
    modal.addEventListener('shown.bs.modal', () => {
        const dataInput = modal.querySelector('#dataPrenotazione');
        const closeBtn = modal.querySelector('.btn-close');
        if (closeBtn) closeBtn.focus(); // Porta il focus sul bottone chiudi
        aggiornaOrariDisponibili(dataInput.value);
        dataInput.addEventListener('change', function(e) {
            console.log('Evento change data:', e.target.value);
            aggiornaOrariDisponibili(e.target.value);
        });
        console.log('Listener change su dataPrenotazione AGGIUNTO');
    });

    // Miglioramento UX: mostra orari con info aggiuntive
    async function aggiornaOrariDisponibili(data) {
        console.log('Chiamata aggiornaOrariDisponibili con data:', data);
    let orari = [];
    try {
      const res = await fetch(`/prenotazione/campi/${campo.id}/disponibilita?data=${data}&_=${Date.now()}`); // aggiungo cache buster
      orari = await res.json();
      console.log('Orari disponibili per', data, orari);
    } catch (e) {
      console.error('Errore fetch orari:', e);
      orari = [];
    }
    // Se per la data selezionata (in genere oggi) non ci sono orari, prova a mostrare quelli di domani
    if ((!Array.isArray(orari) || orari.length === 0) && data === new Date().toISOString().slice(0,10)) {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tStr = tomorrow.toISOString().slice(0,10);
        const res2 = await fetch(`/prenotazione/campi/${campo.id}/disponibilita?data=${tStr}&_=${Date.now()}`);
        const orariDomani = await res2.json().catch(() => []);
        if (Array.isArray(orariDomani) && orariDomani.length > 0) {
          // presentiamo gli orari di domani ma segnaliamo la differenza
          const select = modal.querySelector('#orarioPrenotazione');
          select.innerHTML = orariDomani.map(o => `<option value='${o.inizio}|${o.fine}'>${o.inizio} - ${o.fine} (${campo.nome} - ${tStr})</option>`).join('');
          // Aggiungi una piccola nota informativa
          let noteEl = modal.querySelector('.note-fallback');
          if (!noteEl) {
            noteEl = document.createElement('div');
            noteEl.className = 'form-text text-muted note-fallback';
            modal.querySelector('#orarioPrenotazione').parentNode.appendChild(noteEl);
          }
          noteEl.textContent = 'Nessun orario disponibile per la data scelta. Mostrati gli orari disponibili per ' + tStr + '.';
          console.log('Fallback: mostro orari di domani', tStr, orariDomani);
          return;
        }
      } catch (e) {
        console.warn('Fallback fetch per domani fallito', e);
      }
    }
    // Filtro solo orari validi (inizio < fine, formato HH:MM, non prenotati, non entro 2 ore)
    const now = new Date();
    // Accept both HH:MM and HH:MM:SS formats for stored times
    orari = Array.isArray(orari) ? orari.filter(o => {
      if (typeof o.prenotato !== 'undefined' && o.prenotato) return false;
      if (!o.inizio || !o.fine) return false;
      // allow HH:MM or HH:MM:SS
      const timeRe = /^\d{2}:\d{2}(:\d{2})?$/;
      if (!timeRe.test(o.inizio) || !timeRe.test(o.fine) || o.inizio >= o.fine) return false;
      // Filtro orari entro 2 ore solo se la data è oggi
      if (data === now.toISOString().slice(0,10)) {
        const [h, m] = o.inizio.split(":");
        const orarioDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(h), parseInt(m));
        return (orarioDate.getTime() - now.getTime()) >= 2 * 60 * 60 * 1000;
      }
      return true;
    }) : [];
    const select = modal.querySelector('#orarioPrenotazione');
    select.innerHTML = orari.length > 0
      ? orari.map(o => `<option value='${o.inizio}|${o.fine}'>${o.inizio} - ${o.fine} (${campo.nome})</option>`).join('')
      : '<option value="">Nessun orario disponibile</option>';
    // Log per controllo opzioni select
    console.log('Select aggiornata, opzioni:', Array.from(select.options).map(opt => opt.value));
    }

    // Inizializza la select orari con la data di default
    modal.addEventListener('shown.bs.modal', () => {
        const dataInput = modal.querySelector('#dataPrenotazione');
        aggiornaOrariDisponibili(dataInput.value);
        // Listener change: aggiorna sempre la select orari
        dataInput.addEventListener('change', function(e) {
            console.log('Evento change data:', e.target.value);
            aggiornaOrariDisponibili(e.target.value);
        });
        // Log: controllo che il listener sia attivo
        console.log('Listener change su dataPrenotazione AGGIUNTO');
    }, 100);
}