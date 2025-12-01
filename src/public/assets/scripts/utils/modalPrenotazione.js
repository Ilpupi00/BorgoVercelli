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
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title"><i class="bi bi-calendar-check me-2"></i>Prenota il campo: ${campo.nome || campo.tipo}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form id="formPrenotazioneCampo" novalidate>
          <div class="modal-body">
            <!-- Step 1: Data e Orario -->
            <div class="booking-section mb-4">
              <h6 class="text-primary mb-3"><i class="bi bi-clock-history me-2"></i>Data e Orario</h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <label for="dataPrenotazione" class="form-label fw-semibold">
                    <i class="bi bi-calendar3 me-1"></i>Data <span class="text-danger">*</span>
                  </label>
                  <input type="date" class="form-control form-control-lg" id="dataPrenotazione" name="dataPrenotazione" required value="${new Date().toISOString().slice(0,10)}">
                  <div class="invalid-feedback">Seleziona una data valida</div>
                </div>
                <div class="col-md-6">
                  <label for="orarioPrenotazione" class="form-label fw-semibold">
                    <i class="bi bi-clock me-1"></i>Orario <span class="text-danger">*</span>
                  </label>
                  <select class="form-select form-select-lg" id="orarioPrenotazione" name="orarioPrenotazione" required>
                    <option value="">-- Caricamento orari --</option>
                  </select>
                  <div class="invalid-feedback">Seleziona un orario disponibile</div>
                  <div class="mt-2">
                    <button type="button" class="btn btn-outline-primary btn-sm w-100" id="linkOrarioCustom">
                      <i class="bi bi-clock-history me-2"></i>Inserisci un orario personalizzato
                    </button>
                  </div>
                </div>
                
                <!-- Custom time inputs (hidden by default) -->
                <div class="col-12 d-none" id="customTimeSection">
                  <div class="alert alert-info d-flex align-items-center">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    <div>
                      Inserisci un orario personalizzato. L'orario verrà verificato per evitare sovrapposizioni.
                    </div>
                  </div>
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label for="oraInizioCustom" class="form-label fw-semibold">
                        <i class="bi bi-clock me-1"></i>Ora Inizio <span class="text-danger">*</span>
                      </label>
                      <input type="time" class="form-control form-control-lg" id="oraInizioCustom" name="oraInizioCustom">
                      <div class="invalid-feedback">Inserisci un orario valido</div>
                    </div>
                    <div class="col-md-6">
                      <label for="oraFineCustom" class="form-label fw-semibold">
                        <i class="bi bi-clock me-1"></i>Ora Fine <span class="text-danger">*</span>
                      </label>
                      <input type="time" class="form-control form-control-lg" id="oraFineCustom" name="oraFineCustom">
                      <div class="invalid-feedback">Inserisci un orario valido</div>
                    </div>
                    <div class="col-12">
                      <button type="button" class="btn btn-sm btn-outline-secondary" id="btnTornaSelectOrario">
                        <i class="bi bi-arrow-left me-1"></i>Torna alla selezione orari predefiniti
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <hr class="my-4">
            
            <!-- Step 2: Contatto -->
            <div class="booking-section mb-4">
              <h6 class="text-primary mb-3"><i class="bi bi-phone me-2"></i>Dati di Contatto</h6>
              <div class="mb-3">
                <label for="telefonoPrenotazione" class="form-label fw-semibold">
                  <i class="bi bi-telephone-fill me-1"></i>Numero di telefono <span class="text-danger">*</span>
                </label>
                <input type="tel" class="form-control form-control-lg" id="telefonoPrenotazione" name="telefonoPrenotazione" required 
                       placeholder="+39 3xx xxxxxxx (10 cifre dopo +39)" 
                       pattern="^\\+39\\s?[0-9]{9,10}$"
                       title="Formato: +39 seguito da 9-10 cifre (es: +39 3331234567)">
                <div class="form-text"><i class="bi bi-info-circle me-1"></i>Formato italiano: +39 seguito da 9-10 cifre</div>
                <div class="invalid-feedback">Inserisci un numero valido: +39 seguito da 9-10 cifre (es: +39 3331234567)</div>
              </div>
            </div>
            
            <hr class="my-4">
            
            <!-- Step 3: Identificazione -->
            <div class="booking-section mb-4">
              <h6 class="text-primary mb-3"><i class="bi bi-person-badge me-2"></i>Documento di Identità</h6>
              <p class="text-muted small mb-3">
                <i class="bi bi-shield-check me-1"></i>
                Fornire i dati del documento è <strong>opzionale</strong> ma consigliato per facilitare l'identificazione.
              </p>
              
              <div class="mb-3">
                <label for="tipoDocumentoPrenotazione" class="form-label fw-semibold">
                  <i class="bi bi-card-list me-1"></i>Tipo di Documento
                </label>
                <select class="form-select form-select-lg" id="tipoDocumentoPrenotazione" name="tipoDocumentoPrenotazione">
                  <option value="">-- Seleziona tipo documento --</option>
                  <option value="CF">Codice Fiscale</option>
                  <option value="ID">Documento di Identità (CI, Patente, Passaporto)</option>
                </select>
                <div class="form-text"><i class="bi bi-lightbulb me-1"></i>Scegli se fornire il codice fiscale o un documento</div>
              </div>
              
              <!-- Campo Codice Fiscale (visibile solo se tipo='CF') -->
              <div class="mb-3 documento-field" id="codiceFiscaleGroup" style="display: none;">
                <label for="codiceFiscalePrenotazione" class="form-label fw-semibold">
                  <i class="bi bi-file-earmark-text me-1"></i>Codice Fiscale <span class="text-danger">*</span>
                </label>
                <input type="text" class="form-control form-control-lg text-uppercase" id="codiceFiscalePrenotazione" name="codiceFiscalePrenotazione" 
                       placeholder="RSSMRA80A01H501U" maxlength="16" 
                       pattern="[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]"
                       title="Inserisci un codice fiscale valido (16 caratteri)">
                <div class="form-text"><i class="bi bi-info-circle me-1"></i>Deve essere esattamente 16 caratteri alfanumerici</div>
                <div class="invalid-feedback">Inserisci un codice fiscale valido (16 caratteri)</div>
              </div>
              
              <!-- Campo Numero Documento (visibile solo se tipo='ID') -->
              <div class="mb-3 documento-field" id="numeroDocumentoGroup" style="display: none;">
                <label for="numeroDocumentoPrenotazione" class="form-label fw-semibold">
                  <i class="bi bi-credit-card-2-front me-1"></i>Numero Documento <span class="text-danger">*</span>
                </label>
                <input type="text" class="form-control form-control-lg text-uppercase" id="numeroDocumentoPrenotazione" name="numeroDocumentoPrenotazione" 
                       placeholder="CA12345678 / AB1234567 / AA1234567" maxlength="50" 
                       title="Inserisci il numero del documento">
                <div class="form-text"><i class="bi bi-info-circle me-1"></i>Numero della Carta d'Identità, Patente o Passaporto</div>
                <div class="invalid-feedback">Inserisci il numero del documento (minimo 5 caratteri)</div>
              </div>
            </div>
            
            <hr class="my-4">
            
            <!-- Step 4: Note -->
            <div class="booking-section">
              <h6 class="text-primary mb-3"><i class="bi bi-chat-left-text me-2"></i>Note Aggiuntive</h6>
              <div class="mb-3">
                <label for="notePrenotazione" class="form-label fw-semibold">Note (opzionale)</label>
                <textarea class="form-control" id="notePrenotazione" name="notePrenotazione" rows="3" 
                          placeholder="Aggiungi eventuali note o richieste particolari..."></textarea>
                <div class="form-text"><i class="bi bi-info-circle me-1"></i>Massimo 500 caratteri</div>
              </div>
            </div>
          </div>
          <div class="modal-footer bg-light">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
              <i class="bi bi-x-circle me-2"></i>Annulla
            </button>
            <button type="submit" class="btn btn-primary btn-lg px-4">
              <i class="bi bi-check-circle me-2"></i>Conferma Prenotazione
            </button>
          </div>
          </form>
        </div>
      </div>
      `;
    document.body.appendChild(modal);

    // Debug: verifica che il modal sia completo
    console.log('Modal HTML creato e aggiunto al DOM');
    const footer = modal.querySelector('.modal-footer');
    const bottoni = modal.querySelectorAll('.modal-footer button');
    const campiDocumento = modal.querySelectorAll('.documento-field');
    console.log('Footer presente:', !!footer);
    console.log('Numero bottoni:', bottoni.length);
    console.log('Campi documento:', campiDocumento.length);
    
    // Forza la visibilità del footer (fix per problemi CSS)
    if (footer) {
        footer.style.display = 'flex';
        footer.style.justifyContent = 'flex-end';
        footer.style.gap = '0.5rem';
    }

    // Mostra il modal con Bootstrap
    let bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    // Pre-popola il telefono dall'utente se disponibile
    (async () => {
      try {
        const resUser = await fetch('/session/user');
        if (resUser.ok) {
          const user = await resUser.json();
          const telefonoInput = modal.querySelector('#telefonoPrenotazione');
          if (user.telefono && telefonoInput) {
            // Normalizza il telefono aggiungendo +39 se manca
            let tel = user.telefono.trim();
            if (!tel.startsWith('+39')) {
              tel = '+39' + tel.replace(/^0/, ''); // rimuove lo 0 iniziale se presente
            }
            telefonoInput.value = tel;
          }
        }
      } catch (e) {
        console.warn('Impossibile recuperare dati utente per pre-popolamento', e);
      }
    })();
    
    // Validazione telefono real-time
    const telefonoInput = modal.querySelector('#telefonoPrenotazione');
    if (telefonoInput) {
        telefonoInput.addEventListener('input', function() {
            let val = this.value.trim();
            // Auto-aggiungi +39 se l'utente inizia a digitare numeri
            if (val.length > 0 && !val.startsWith('+')) {
                this.value = '+39' + val.replace(/^0/, '');
            }
            // Rimuovi caratteri non validi (permetti solo +, numeri e spazi)
            this.value = this.value.replace(/[^+0-9\s]/g, '');
        });
        
        telefonoInput.addEventListener('blur', function() {
            let val = this.value.trim();
            if (val && !val.startsWith('+39')) {
                this.value = '+39' + val.replace(/^0/, '');
            }
            // Valida il formato
            const phoneRegex = /^\+39\s?[0-9]{9,10}$/;
            if (val && !phoneRegex.test(this.value)) {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
            }
        });
    }

    // Gestione toggle orario custom vs predefinito
    const linkOrarioCustom = modal.querySelector('#linkOrarioCustom');
    const btnTornaSelect = modal.querySelector('#btnTornaSelectOrario');
    const customTimeSection = modal.querySelector('#customTimeSection');
    const orarioSelect = modal.querySelector('#orarioPrenotazione');
    const oraInizioCustom = modal.querySelector('#oraInizioCustom');
    const oraFineCustom = modal.querySelector('#oraFineCustom');
    
    let isCustomMode = false;
    
    linkOrarioCustom?.addEventListener('click', (e) => {
        e.preventDefault();
        isCustomMode = true;
        console.log('Modalità custom attivata');
        orarioSelect.removeAttribute('required');
        orarioSelect.value = '';
        orarioSelect.classList.remove('is-invalid');
        orarioSelect.closest('.col-md-6').classList.add('d-none');
        customTimeSection.classList.remove('d-none');
        oraInizioCustom.setAttribute('required', 'required');
        oraFineCustom.setAttribute('required', 'required');
    });
    
    btnTornaSelect?.addEventListener('click', () => {
        isCustomMode = false;
        console.log('Modalità predefiniti attivata');
        oraInizioCustom.removeAttribute('required');
        oraFineCustom.removeAttribute('required');
        oraInizioCustom.value = '';
        oraFineCustom.value = '';
        oraInizioCustom.classList.remove('is-invalid');
        oraFineCustom.classList.remove('is-invalid');
        customTimeSection.classList.add('d-none');
        orarioSelect.closest('.col-md-6').classList.remove('d-none');
        orarioSelect.setAttribute('required', 'required');
    });
    
    // Gestione toggle dei campi documento
    const tipoDocSelect = modal.querySelector('#tipoDocumentoPrenotazione');
    const cfGroup = modal.querySelector('#codiceFiscaleGroup');
    const cfInput = modal.querySelector('#codiceFiscalePrenotazione');
    const numDocGroup = modal.querySelector('#numeroDocumentoGroup');
    const numDocInput = modal.querySelector('#numeroDocumentoPrenotazione');
    
    // Debug: verifica che tutti gli elementi esistano
    console.log('Modal elementi:', {
        tipoDocSelect: !!tipoDocSelect,
        cfGroup: !!cfGroup,
        cfInput: !!cfInput,
        numDocGroup: !!numDocGroup,
        numDocInput: !!numDocInput,
        customTimeElements: !!linkOrarioCustom && !!btnTornaSelect
    });
    
    if (!tipoDocSelect || !cfGroup || !cfInput || !numDocGroup || !numDocInput) {
        console.error('ERRORE: Alcuni elementi del modal non sono stati trovati!');
        return;
    }
    
    tipoDocSelect.addEventListener('change', function() {
        const tipo = this.value;
        console.log('Tipo documento selezionato:', tipo);
        
        // Nascondi tutti i campi documento e rimuovi required
        cfGroup.style.display = 'none';
        numDocGroup.style.display = 'none';
        cfInput.removeAttribute('required');
        numDocInput.removeAttribute('required');
        cfInput.value = '';
        numDocInput.value = '';
        
        // Mostra il campo appropriato e aggiungi required
        if (tipo === 'CF') {
            cfGroup.style.display = 'block';
            cfInput.setAttribute('required', 'required');
            console.log('Campo CF mostrato');
        } else if (tipo === 'ID') {
            numDocGroup.style.display = 'block';
            numDocInput.setAttribute('required', 'required');
            console.log('Campo numero documento mostrato');
        }
    });
    
    // Auto-uppercase per CF e numero documento
    cfInput.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
    numDocInput.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
    
    // Validazione real-time per orari custom
    oraInizioCustom?.addEventListener('input', function() {
        this.classList.remove('is-invalid');
    });
    
    oraFineCustom?.addEventListener('input', function() {
        this.classList.remove('is-invalid');
    });

    // Gestione submit con validazione Bootstrap
    const form = modal.querySelector('#formPrenotazioneCampo');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const data = modal.querySelector('#dataPrenotazione').value;
        let ora_inizio, ora_fine;
        
        // Determina se usare orario custom o predefinito
        if (isCustomMode) {
            ora_inizio = oraInizioCustom.value;
            ora_fine = oraFineCustom.value;
            
            if (!ora_inizio || !ora_fine) {
                if (!ora_inizio) oraInizioCustom.classList.add('is-invalid');
                if (!ora_fine) oraFineCustom.classList.add('is-invalid');
                return;
            }
            
            // Validazione client-side: inizio < fine
            if (ora_inizio >= ora_fine) {
                oraFineCustom.classList.add('is-invalid');
                oraFineCustom.nextElementSibling.textContent = 'L\'orario di fine deve essere successivo all\'inizio';
                return;
            }
            
            // Validazione anticipo minimo 2 ore
            const [h, m] = ora_inizio.split(':').map(Number);
            const bookingDateTime = new Date(data);
            bookingDateTime.setHours(h, m, 0, 0);
            const now = new Date();
            const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
            
            if (bookingDateTime < minTime) {
                oraInizioCustom.classList.add('is-invalid');
                oraInizioCustom.nextElementSibling.textContent = 'Devi prenotare con almeno 2 ore di anticipo';
                return;
            }
            
            // Controllo duplicato esatto contro orari visualizzati nella pagina
            const existingBadges = Array.from(document.querySelectorAll(`#orariDisponibili-${campo.id} .badge`));
            const customSlot = `${ora_inizio}-${ora_fine}`;
            const isDuplicate = existingBadges.some(badge => {
                const text = badge.textContent.trim();
                return text === customSlot;
            });
            
            if (isDuplicate) {
                oraInizioCustom.classList.add('is-invalid');
                oraInizioCustom.nextElementSibling.textContent = 'Orario già presente tra quelli disponibili';
                return;
            }
            
            // Chiamata al server per verifica definitiva
            try {
                console.log('[MODAL] Controllo disponibilità orario custom:', { campo_id: campo.id, data, ora_inizio, ora_fine });
                const checkRes = await fetch('/prenotazione/prenotazioni/check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        campo_id: campo.id,
                        data: data,
                        inizio: ora_inizio,
                        fine: ora_fine
                    })
                });
                
                const checkResult = await checkRes.json();
                console.log('[MODAL] Risposta check:', checkResult);
                
                if (!checkResult.ok) {
                    // Mostra errore specifico
                    console.warn('[MODAL] Orario rifiutato:', checkResult.message);
                    oraInizioCustom.classList.add('is-invalid');
                    oraInizioCustom.nextElementSibling.textContent = checkResult.message || 'Orario non disponibile';
                    return;
                }
                console.log('[MODAL] Orario custom validato con successo');
            } catch (checkErr) {
                console.error('Errore controllo orario:', checkErr);
                oraInizioCustom.classList.add('is-invalid');
                oraInizioCustom.nextElementSibling.textContent = 'Errore di rete durante la verifica';
                return;
            }
            
        } else {
            // Modalità select predefinito
            const orarioVal = modal.querySelector('#orarioPrenotazione').value;
            if (!orarioVal || orarioVal === '' || orarioVal === '-- Caricamento orari --') {
                modal.querySelector('#orarioPrenotazione').classList.add('is-invalid');
                return;
            }
            const parts = orarioVal.split('|');
            if (parts.length !== 2) {
                console.error('Formato orario invalido:', orarioVal);
                modal.querySelector('#orarioPrenotazione').classList.add('is-invalid');
                return;
            }
            [ora_inizio, ora_fine] = parts;
            console.log('Orario predefinito selezionato:', ora_inizio, '-', ora_fine);
        }
        
        // Validazione data
        if (!data) {
            const dataInput = modal.querySelector('#dataPrenotazione');
            dataInput.classList.add('is-invalid');
            return;
        }
        
        console.log('Dati prenotazione pronti:', { campo_id: campo.id, data, ora_inizio, ora_fine });
        
        const note = modal.querySelector('#notePrenotazione').value;
        const telefono = modal.querySelector('#telefonoPrenotazione').value.trim();
        const tipo_documento = tipoDocSelect.value || null;
        
        // Prepara i campi documento in base al tipo
        let codice_fiscale = null;
        let numero_documento = null;
        
        if (tipo_documento === 'CF') {
            codice_fiscale = cfInput.value.trim().toUpperCase();
            // Validazione CF (16 caratteri)
            if (codice_fiscale.length !== 16) {
                cfInput.classList.add('is-invalid');
                cfInput.focus();
                return;
            }
        } else if (tipo_documento === 'ID') {
            numero_documento = numDocInput.value.trim().toUpperCase();
            // Validazione numero doc (minimo 5 caratteri)
            if (numero_documento.length < 5) {
                numDocInput.classList.add('is-invalid');
                numDocInput.focus();
                return;
            }
        }
        
        // Validazione telefono aggiuntiva
        const phoneRegex = /^\+39\s?[0-9]{9,10}$/;
        if (!telefono || !phoneRegex.test(telefono)) {
            const telInput = modal.querySelector('#telefonoPrenotazione');
            telInput.classList.add('is-invalid');
            telInput.focus();
            // Mostra messaggio di errore più specifico
            const feedback = telInput.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
                feedback.textContent = 'Formato non valido. Usa +39 seguito da 9-10 cifre (es: +39 3331234567)';
            }
            return;
        }
        
        onSubmit({
            campo_id: campo.id,
            data_prenotazione: data,
            ora_inizio,
            ora_fine,
            note: note.trim() || null,
            telefono,
            tipo_documento,
            codice_fiscale,
            numero_documento
        });
        bsModal.hide();
        setTimeout(() => modal.remove(), 500);
    });

    // Rimuovi il modal dal DOM quando viene chiuso
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
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

    // Miglioramento accessibilità e inizializzazione orari
    modal.addEventListener('shown.bs.modal', () => {
        const dataInput = modal.querySelector('#dataPrenotazione');
        const closeBtn = modal.querySelector('.btn-close');
        if (closeBtn) closeBtn.focus(); // Porta il focus sul bottone chiudi
        
        // Inizializza la select orari con la data di default
        aggiornaOrariDisponibili(dataInput.value);
        
        // Listener change: aggiorna sempre la select orari
        dataInput.addEventListener('change', function(e) {
            console.log('Evento change data:', e.target.value);
            aggiornaOrariDisponibili(e.target.value);
        });
        
        console.log('Listener change su dataPrenotazione AGGIUNTO');
    });
}