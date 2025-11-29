
class GestoreUtente {
    constructor() {
        this.originalUtenti = [];
        this.initialize();
    }

    initialize() {
        this.loadUtentiData();
        this.setupEventListeners();
    }

    loadUtentiData() {
        const rows = document.querySelectorAll('#utentiTableBody tr[data-utente-id]');
        this.originalUtenti = Array.from(rows).map(row => ({
            element: row,
            id: row.dataset.utenteId,
            nome: row.dataset.nome || '',
            cognome: row.dataset.cognome || '',
            email: row.dataset.email || '',
            telefono: row.dataset.telefono || '',
            tipo: row.dataset.tipo || ''
        }));
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filtraUtenti());
        }

        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    this.filtraUtenti();
                    searchInput.focus();
                }
            });
        }
    }

    filtraUtenti() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        let visibleCount = 0;

        this.originalUtenti.forEach(utente => {
            const matchesSearch = !searchTerm || 
                utente.id.includes(searchTerm) ||
                utente.nome.includes(searchTerm) ||
                utente.cognome.includes(searchTerm) ||
                utente.email.includes(searchTerm) ||
                utente.telefono.includes(searchTerm);

            if (matchesSearch) {
                utente.element.style.display = '';
                visibleCount++;
            } else {
                utente.element.style.display = 'none';
            }
        });

        this.updateFilteredCount(visibleCount);
    }

    updateFilteredCount(count) {
        const totalCount = this.originalUtenti.length;
        document.getElementById('totalCount').textContent = totalCount;
        document.getElementById('filteredCount').textContent = `(${count} filtrate)`;
    }
    static showNotification(message, type = 'info') {
        const modal = document.getElementById('notificaModal');
        const header = document.getElementById('notificaHeader');
        const body = document.getElementById('notificaBody');
        const title = document.getElementById('notificaModalLabel');

        header.className = 'modal-header';
        switch (type) {
            case 'success':
                header.classList.add('bg-success', 'text-white');
                title.textContent = 'Successo';
                break;
            case 'error':
                header.classList.add('bg-danger', 'text-white');
                title.textContent = 'Errore';
                break;
            case 'warning':
                header.classList.add('bg-warning');
                title.textContent = 'Attenzione';
                break;
            default:
                header.classList.add('bg-info', 'text-white');
                title.textContent = 'Informazione';
        }
        body.textContent = message;
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    static async visualizzaUtente(id) {
        try {
            // Carica dati utente - usa endpoint API per JSON
            const responseUtente = await fetch(`/api/admin/utenti/${id}`);
            if (!responseUtente.ok) {
                throw new Error('Errore nel caricamento dei dettagli utente');
            }
            const utente = await responseUtente.json();
            
            // Carica prenotazioni utente
            const responsePrenotazioni = await fetch(`/prenotazione/prenotazioni/user/${id}`);
            let prenotazioni = [];
            if (responsePrenotazioni.ok) {
                prenotazioni = await responsePrenotazioni.json();
            }
            
            // Genera HTML prenotazioni
            let prenotazioniHTML = '';
            if (prenotazioni && prenotazioni.length > 0) {
                prenotazioniHTML = `
                    <div class="mt-4">
                        <h5><i class="bi bi-calendar-check me-2"></i>Prenotazioni (${prenotazioni.length})</h5>
                        <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                            <table class="table table-sm table-hover">
                                <thead class="sticky-top bg-light">
                                    <tr>
                                        <th>Campo</th>
                                        <th>Data</th>
                                        <th>Orario</th>
                                        <th>Stato</th>
                                        <th>Telefono</th>
                                        <th>Documento</th>
                                        <th>Azioni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${prenotazioni.map(p => {
                                        const stato = p.stato || 'in_attesa';
                                        const statoBadge = {
                                            'in_attesa': '<span class="badge bg-warning">In Attesa</span>',
                                            'confermata': '<span class="badge bg-success">Confermata</span>',
                                            'annullata': '<span class="badge bg-danger">Annullata</span>',
                                            'completata': '<span class="badge bg-info">Completata</span>',
                                            'scaduta': '<span class="badge bg-secondary">Scaduta</span>'
                                        }[stato] || `<span class="badge bg-secondary">${stato}</span>`;
                                        
                                        const dataFormatted = new Date(p.data_prenotazione).toLocaleDateString('it-IT');
                                        const telefono = p.telefono || 'N/D';
                                        
                                        let documentoInfo = 'N/D';
                                        if (p.tipo_documento === 'CF' && p.codice_fiscale) {
                                            documentoInfo = `<small>CF: ${p.codice_fiscale}</small>`;
                                        } else if (p.tipo_documento === 'ID' && p.numero_documento) {
                                            documentoInfo = `<small>ID: ${p.numero_documento}</small>`;
                                        }
                                        
                                        return `
                                            <tr>
                                                <td>${p.campo_nome || 'Campo ' + p.campo_id}</td>
                                                <td>${dataFormatted}</td>
                                                <td>${p.ora_inizio} - ${p.ora_fine}</td>
                                                <td>${statoBadge}</td>
                                                <td><small>${telefono}</small></td>
                                                <td>${documentoInfo}</td>
                                                <td>
                                                    <button class="btn btn-sm btn-outline-primary" onclick="GestoreUtente.modificaPrenotazioneAdmin(${p.id})" title="Modifica">
                                                        <i class="bi bi-pencil"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            } else {
                prenotazioniHTML = `
                    <div class="mt-4 text-center text-muted">
                        <i class="bi bi-calendar-x fs-1"></i>
                        <p>Nessuna prenotazione trovata</p>
                    </div>
                `;
            }
            
            const content = `
                <div class="row">
                    <div class="col-md-8">
                        <h4>${utente.nome} ${utente.cognome}</h4>
                        <p><strong>Email:</strong> ${utente.email}</p>
                        <p><strong>Telefono:</strong> ${utente.telefono || 'Non specificato'}</p>
                        <p><strong>Tipo Utente:</strong> ${GestoreUtente.getTipoUtenteLabel(utente.tipo_utente_id)}</p>
                        <p><strong>Data Registrazione:</strong> ${new Date(utente.data_registrazione).toLocaleDateString('it-IT')}</p>
                    </div>
                    <div class="col-md-4 text-center">
                        <img src="${utente.immagine_profilo || '/assets/images/Logo.png'}" alt="Foto profilo" class="img-fluid rounded-circle" style="width: 100px; height: 100px; object-fit: cover;">
                    </div>
                </div>
                ${prenotazioniHTML}
            `;
            document.getElementById('visualizzaContent').innerHTML = content;
            const modal = new bootstrap.Modal(document.getElementById('visualizzaModal'));
            modal.show();
        } catch (error) {
            console.error('Errore:', error);
            GestoreUtente.showNotification('Errore nel caricamento dei dettagli utente', 'error');
        }
    }

    static creaUtente() {
        document.getElementById('creaForm').reset();
        const modal = new bootstrap.Modal(document.getElementById('creaModal'));
        modal.show();
    }

    static async salvaCrea() {
        const nome = document.getElementById('nome').value;
        const cognome = document.getElementById('cognome').value;
        const email = document.getElementById('email').value;
        const telefono = document.getElementById('telefono').value;
        const tipo_utente_id = document.getElementById('tipo_utente_id').value;
        const password = document.getElementById('password').value;
        if (!nome || !cognome || !email || !password) {
            GestoreUtente.showNotification('Compila tutti i campi obbligatori', 'warning');
            return;
        }
        try {
            const response = await fetch('/admin/utenti', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, cognome, email, telefono, tipo_utente_id, password })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore nella creazione dell\'utente');
            }
            GestoreUtente.showNotification('Utente creato con successo', 'success');
            bootstrap.Modal.getInstance(document.getElementById('creaModal')).hide();
            location.reload();
        } catch (error) {
            console.error('Errore:', error);
            GestoreUtente.showNotification(error.message, 'error');
        }
    }

    static async modificaUtente(id) {
        try {
            const response = await fetch(`/admin/utenti/${id}`);
            if (!response.ok) {
                throw new Error('Errore nel caricamento dei dati utente');
            }
            const utente = await response.json();
            document.getElementById('modificaId').value = utente.id;
            document.getElementById('modificaNome').value = utente.nome;
            document.getElementById('modificaCognome').value = utente.cognome;
            document.getElementById('modificaEmail').value = utente.email;
            document.getElementById('modificaTelefono').value = utente.telefono || '';
            document.getElementById('modificaTipo').value = utente.tipo_utente_id;
            const modal = new bootstrap.Modal(document.getElementById('modificaModal'));
            modal.show();
        } catch (error) {
            console.error('Errore:', error);
            GestoreUtente.showNotification('Errore nel caricamento dei dati utente', 'error');
        }
    }

    static async salvaModifica() {
        const id = document.getElementById('modificaId').value;
        const nome = document.getElementById('modificaNome').value;
        const cognome = document.getElementById('modificaCognome').value;
        const email = document.getElementById('modificaEmail').value;
        const telefono = document.getElementById('modificaTelefono').value;
        const tipo_utente_id = document.getElementById('modificaTipo').value;
        if (!nome || !cognome || !email) {
            GestoreUtente.showNotification('Compila tutti i campi obbligatori', 'warning');
            return;
        }
        try {
            const response = await fetch(`/admin/utenti/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, cognome, email, telefono, tipo_utente_id })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore nell\'aggiornamento dell\'utente');
            }
            GestoreUtente.showNotification('Utente aggiornato con successo', 'success');
            bootstrap.Modal.getInstance(document.getElementById('modificaModal')).hide();
            location.reload();
        } catch (error) {
            console.error('Errore:', error);
            GestoreUtente.showNotification(error.message, 'error');
        }
    }

    static async eliminaUtente(id) {
        try {
            // Show the existing modal (do NOT modify showModal.js as requested)
            ShowModal.modalDelete('Sei sicuro di voler eliminare questo utente? Questa azione non può essere annullata.', 'Conferma eliminazione');

            // Wait for confirmation by listening to the modal's buttons/events
            const modal = document.getElementById('modalDelete');
            let confirmed = false;

            if (!modal) {
                // Fallback if modal not found for some reason
                if (!confirm('Sei sicuro di voler eliminare questo utente? Questa azione non può essere annullata.')) return;
                confirmed = true;
            } else {
                confirmed = await new Promise(resolve => {
                    const confirmBtn = modal.querySelector('#confirmDeleteBtn');

                    const onConfirm = () => {
                        cleanup();
                        resolve(true);
                    };

                    const onHidden = () => {
                        cleanup();
                        resolve(false);
                    };

                    function cleanup() {
                        if (confirmBtn) confirmBtn.removeEventListener('click', onConfirm);
                        modal.removeEventListener('hidden.bs.modal', onHidden);
                    }

                    if (confirmBtn) confirmBtn.addEventListener('click', onConfirm, { once: true });
                    modal.addEventListener('hidden.bs.modal', onHidden, { once: true });
                });
            }

            if (!confirmed) return;

            const response = await fetch(`/admin/utenti/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore nell\'eliminazione dell\'utente');
            }
            // Show success using the shared ShowModal API and wait for user to close it before reloading
            if (typeof ShowModal !== 'undefined' && ShowModal.showModalSuccess) {
                await ShowModal.showModalSuccess('Operazione completata', 'Utente eliminato con successo.');
                const successModal = document.getElementById('modalSuccess');
                if (successModal && typeof bootstrap !== 'undefined') {
                    successModal.addEventListener('hidden.bs.modal', () => { location.reload(); }, { once: true });
                } else {
                    // fallback: small delay then reload
                    setTimeout(() => location.reload(), 800);
                }
            } else {
                // If ShowModal not available, fallback to static modal or immediate reload
                const staticSuccessModalEl = document.getElementById('successModal');
                if (staticSuccessModalEl && typeof bootstrap !== 'undefined') {
                    document.getElementById('successMessage').textContent = 'Utente eliminato con successo';
                    const bs = new bootstrap.Modal(staticSuccessModalEl);
                    bs.show();
                    staticSuccessModalEl.addEventListener('hidden.bs.modal', () => { location.reload(); }, { once: true });
                } else {
                    setTimeout(() => location.reload(), 800);
                }
            }
        } catch (error) {
            console.error('Errore:', error);
            await ShowModal.showModalError(error.message || 'Errore nell\'eliminazione dell\'utente', 'Errore');
        }
    }

    static getTipoUtenteLabel(tipoId) {
        switch (tipoId) {
            case 1: return 'Admin';
            case 2: return 'Dirigente';
            case 3: return 'Utente';
            default: return 'Sconosciuto';
        }
    }

    // ==================== GESTIONE SOSPENSIONE/BAN ====================
    
    static mostraSospendiBan(id, nome, cognome) {
        console.log('🔍 mostraSospendiBan chiamato con:', { id, nome, cognome });
        
        const nomeCompleto = `${nome} ${cognome}`;
        const nomeElement = document.getElementById('utenteNomeScelta');
        
        if (!nomeElement) {
            console.error('❌ Elemento utenteNomeScelta non trovato!');
            return;
        }
        
        nomeElement.textContent = nomeCompleto;
        
        // Store data for next modals
        window.tempUtenteData = { id, nome, cognome, nomeCompleto };
        console.log('💾 Dati salvati in window.tempUtenteData:', window.tempUtenteData);
        
        const modalElement = document.getElementById('sceltaSospendiBanModal');
        if (!modalElement) {
            console.error('❌ Modal sceltaSospendiBanModal non trovato!');
            return;
        }
        
        console.log('✅ Modal element trovato, apertura in corso...');
        
        try {
            const modal = new bootstrap.Modal(modalElement, {
                backdrop: 'static',
                keyboard: false
            });
            modal.show();
            console.log('✅ Modal mostrato con successo!');
        } catch (error) {
            console.error('❌ Errore apertura modal:', error);
        }
    }

    static mostraSospensione() {
        console.log('🔍 mostraSospensione chiamato');
        
        const data = window.tempUtenteData;
        if (!data) {
            console.error('❌ Nessun dato utente trovato in window.tempUtenteData');
            return;
        }
        
        console.log('💾 Dati utente recuperati:', data);
        
        // Hide choice modal
        const sceltaModal = document.getElementById('sceltaSospendiBanModal');
        const sceltaInstance = bootstrap.Modal.getInstance(sceltaModal);
        if (sceltaInstance) {
            console.log('🔒 Chiusura modal scelta...');
            sceltaInstance.hide();
        }
        
        // Show suspension modal
        setTimeout(() => {
            console.log('⏰ Apertura modal sospensione...');
            
            const sospensioneIdElement = document.getElementById('sospensioneUtenteId');
            const sospensioneNomeElement = document.getElementById('sospensioneUtenteNome');
            
            if (sospensioneIdElement) sospensioneIdElement.value = data.id;
            if (sospensioneNomeElement) sospensioneNomeElement.textContent = data.nomeCompleto;
            
            const motivoElement = document.getElementById('suspensionMotivo');
            const durataElement = document.getElementById('suspensionDurata');
            
            if (motivoElement) motivoElement.value = '';
            if (durataElement) durataElement.value = '';
            
            const modalElement = document.getElementById('sospensioneModal');
            if (!modalElement) {
                console.error('❌ Modal sospensioneModal non trovato!');
                return;
            }
            
            try {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
                console.log('✅ Modal sospensione mostrato!');
            } catch (error) {
                console.error('❌ Errore apertura modal sospensione:', error);
            }
        }, 300);
    }

    static mostraBan() {
        const data = window.tempUtenteData;
        if (!data) return;
        
        // Hide choice modal
        bootstrap.Modal.getInstance(document.getElementById('sceltaSospendiBanModal')).hide();
        
        // Show ban modal
        setTimeout(() => {
            document.getElementById('banUtenteId').value = data.id;
            document.getElementById('banUtenteNome').textContent = data.nomeCompleto;
            document.getElementById('banMotivo').value = '';
            
            const modal = new bootstrap.Modal(document.getElementById('banModal'));
            modal.show();
        }, 300);
    }

    static tornaScelta() {
        // Hide current modal
        const sospensioneModal = bootstrap.Modal.getInstance(document.getElementById('sospensioneModal'));
        const banModal = bootstrap.Modal.getInstance(document.getElementById('banModal'));
        
        if (sospensioneModal) sospensioneModal.hide();
        if (banModal) banModal.hide();
        
        // Show choice modal again
        setTimeout(() => {
            const modal = new bootstrap.Modal(document.getElementById('sceltaSospendiBanModal'));
            modal.show();
        }, 300);
    }

    static async confermaSospensione() {
        const id = document.getElementById('sospensioneUtenteId').value;
        const motivo = document.getElementById('suspensionMotivo').value.trim();
        const durataGiorni = document.getElementById('suspensionDurata').value;

        if (!motivo || !durataGiorni) {
            GestoreUtente.showNotification('Compila tutti i campi obbligatori', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/admin/utenti/${id}/sospendi`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motivo, durataGiorni })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Errore nella sospensione');
            }

            bootstrap.Modal.getInstance(document.getElementById('sospensioneModal')).hide();
            
            if (typeof ShowModal !== 'undefined' && ShowModal.showModalSuccess) {
                await ShowModal.showModalSuccess('Operazione completata', 'Utente sospeso con successo. Email di notifica inviata.');
                setTimeout(() => location.reload(), 1000);
            } else {
                GestoreUtente.showNotification('Utente sospeso con successo', 'success');
                setTimeout(() => location.reload(), 1500);
            }
        } catch (error) {
            console.error('Errore:', error);
            GestoreUtente.showNotification(error.message, 'error');
        }
    }

    static async confermaBan() {
        const id = document.getElementById('banUtenteId').value;
        const motivo = document.getElementById('banMotivo').value.trim();

        if (!motivo) {
            GestoreUtente.showNotification('Il motivo è obbligatorio', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/admin/utenti/${id}/banna`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motivo })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Errore nel ban');
            }

            bootstrap.Modal.getInstance(document.getElementById('banModal')).hide();
            
            if (typeof ShowModal !== 'undefined' && ShowModal.showModalSuccess) {
                await ShowModal.showModalSuccess('Operazione completata', 'Utente bannato con successo. Email di notifica inviata.');
                setTimeout(() => location.reload(), 1000);
            } else {
                GestoreUtente.showNotification('Utente bannato con successo', 'success');
                setTimeout(() => location.reload(), 1500);
            }
        } catch (error) {
            console.error('Errore:', error);
            GestoreUtente.showNotification(error.message, 'error');
        }
    }

    static revocaSospensioneBan(id, nome, cognome) {
        const nomeCompleto = `${nome} ${cognome}`;
        document.getElementById('revocaUtenteId').value = id;
        document.getElementById('revocaUtenteNome').textContent = nomeCompleto;
        
        const modal = new bootstrap.Modal(document.getElementById('revocaModal'));
        modal.show();
    }

    static async confermaRevoca() {
        const id = document.getElementById('revocaUtenteId').value;

        try {
            const response = await fetch(`/api/admin/utenti/${id}/revoca`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Errore nella revoca');
            }

            bootstrap.Modal.getInstance(document.getElementById('revocaModal')).hide();
            
            if (typeof ShowModal !== 'undefined' && ShowModal.showModalSuccess) {
                await ShowModal.showModalSuccess('Operazione completata', 'Sospensione/Ban revocato con successo. Email di notifica inviata.');
                setTimeout(() => location.reload(), 1000);
            } else {
                GestoreUtente.showNotification('Revoca completata con successo', 'success');
                setTimeout(() => location.reload(), 1500);
            }
        } catch (error) {
            console.error('Errore:', error);
            GestoreUtente.showNotification(error.message, 'error');
        }
    }

    // ==================== GESTIONE MODIFICA PRENOTAZIONE ADMIN ====================
    
    static async modificaPrenotazioneAdmin(prenotazioneId) {
        try {
            // Carica dati prenotazione
            const responsePrenotazione = await fetch(`/api/prenotazioni/${prenotazioneId}`);
            if (!responsePrenotazione.ok) {
                throw new Error('Errore nel caricamento della prenotazione');
            }
            const prenotazione = await responsePrenotazione.json();
            
            // Carica lista campi
            const responseCampi = await fetch('/api/prenotazioni/campi');
            if (!responseCampi.ok) {
                throw new Error('Errore nel caricamento dei campi');
            }
            const campi = await responseCampi.json();
            
            // Popola select campi
            const campoSelect = document.getElementById('modPrenCampo');
            campoSelect.innerHTML = campi.map(c => 
                `<option value="${c.id}" ${c.id === prenotazione.campo_id ? 'selected' : ''}>${c.nome}</option>`
            ).join('');
            
            // Popola form con dati prenotazione
            document.getElementById('modPrenId').value = prenotazione.id;
            document.getElementById('modPrenUtenteId').value = prenotazione.utente_id;
            document.getElementById('modPrenData').value = prenotazione.data_prenotazione.split('T')[0];
            document.getElementById('modPrenOraInizio').value = prenotazione.ora_inizio;
            document.getElementById('modPrenOraFine').value = prenotazione.ora_fine;
            document.getElementById('modPrenTelefono').value = prenotazione.telefono || '';
            document.getElementById('modPrenNote').value = prenotazione.note || '';
            
            // Gestione tipo documento
            const tipoDocSelect = document.getElementById('modPrenTipoDoc');
            tipoDocSelect.value = prenotazione.tipo_documento || '';
            
            // Trigger change per mostrare campi corretti
            tipoDocSelect.dispatchEvent(new Event('change'));
            
            if (prenotazione.tipo_documento === 'CF') {
                document.getElementById('modPrenCodiceFiscale').value = prenotazione.codice_fiscale || '';
            } else if (prenotazione.tipo_documento === 'ID') {
                document.getElementById('modPrenNumeroDoc').value = prenotazione.numero_documento || '';
            }
            
            // Mostra modal
            const modal = new bootstrap.Modal(document.getElementById('modificaPrenotazioneModal'));
            modal.show();
            
        } catch (error) {
            console.error('Errore:', error);
            GestoreUtente.showNotification(error.message, 'error');
        }
    }
    
    static async salvaModificaPrenotazioneAdmin() {
        const form = document.getElementById('modificaPrenotazioneForm');
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            GestoreUtente.showNotification('Compila tutti i campi obbligatori correttamente', 'warning');
            return;
        }
        
        const id = document.getElementById('modPrenId').value;
        const utenteId = document.getElementById('modPrenUtenteId').value;
        const campoId = document.getElementById('modPrenCampo').value;
        const data = document.getElementById('modPrenData').value;
        const oraInizio = document.getElementById('modPrenOraInizio').value;
        const oraFine = document.getElementById('modPrenOraFine').value;
        const telefono = document.getElementById('modPrenTelefono').value;
        const tipoDoc = document.getElementById('modPrenTipoDoc').value;
        const codiceFiscale = tipoDoc === 'CF' ? document.getElementById('modPrenCodiceFiscale').value : null;
        const numeroDoc = tipoDoc === 'ID' ? document.getElementById('modPrenNumeroDoc').value : null;
        const note = document.getElementById('modPrenNote').value;
        
        // Validazione telefono
        const phoneRegex = /^\+39\s?[0-9]{9,10}$/;
        if (!phoneRegex.test(telefono)) {
            GestoreUtente.showNotification('Formato telefono non valido. Richiesto: +39 seguito da 9-10 cifre', 'error');
            return;
        }
        
        try {
            const response = await fetch(`/api/prenotazioni/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campo_id: campoId,
                    utente_id: utenteId,
                    data_prenotazione: data,
                    ora_inizio: oraInizio,
                    ora_fine: oraFine,
                    telefono: telefono,
                    tipo_documento: tipoDoc || null,
                    codice_fiscale: codiceFiscale,
                    numero_documento: numeroDoc,
                    note: note,
                    modified_by_admin: true  // Flag per indicare modifica da admin
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore nella modifica della prenotazione');
            }
            
            const result = await response.json();
            
            bootstrap.Modal.getInstance(document.getElementById('modificaPrenotazioneModal')).hide();
            GestoreUtente.showNotification('Prenotazione modificata con successo. Utente notificato.', 'success');
            
            // Ricarica il modal visualizza utente per aggiornare la lista
            setTimeout(() => {
                GestoreUtente.visualizzaUtente(utenteId);
            }, 1000);
            
        } catch (error) {
            console.error('Errore:', error);
            GestoreUtente.showNotification(error.message, 'error');
        }
    }
}

window.visualizzaUtente = GestoreUtente.visualizzaUtente;
window.creaUtente = GestoreUtente.creaUtente;
window.salvaCrea = GestoreUtente.salvaCrea;
window.modificaUtente = GestoreUtente.modificaUtente;
window.salvaModifica = GestoreUtente.salvaModifica;
window.eliminaUtente = GestoreUtente.eliminaUtente;
window.showNotification = GestoreUtente.showNotification;

// Sospensione/Ban functions
window.mostraSospendiBan = GestoreUtente.mostraSospendiBan;
window.mostraSospensione = GestoreUtente.mostraSospensione;
window.mostraBan = GestoreUtente.mostraBan;
window.tornaScelta = GestoreUtente.tornaScelta;
window.confermaSubmit = GestoreUtente.confermaSospensione;
window.confermaBan = GestoreUtente.confermaBan;
window.revocaSospensioneBan = GestoreUtente.revocaSospensioneBan;
window.confermaRevoca = GestoreUtente.confermaRevoca;

// Istanza globale
const gestoreUtente = new GestoreUtente();
