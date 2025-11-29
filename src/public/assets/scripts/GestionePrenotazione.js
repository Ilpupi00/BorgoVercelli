/**
 * GestionePrenotazione.js
 * Gestione funzionalità pagina Gestione Prenotazioni
 */

document.addEventListener('DOMContentLoaded', function() {
    // Ricerca prenotazioni
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('.admin-table tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    // Filtri stato prenotazione
    const filterButtons = document.querySelectorAll('.section-header .btn:not(#deleteScaduteBtn)');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const buttonText = this.textContent.trim().toLowerCase();
            const rows = document.querySelectorAll('.admin-table tbody tr');
            
            // Toggle attivo sul bottone
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            rows.forEach(row => {
                const badge = row.querySelector('.badge');
                if (!badge) return;
                
                const badgeText = badge.textContent.trim().toLowerCase();
                
                if (buttonText.includes('confermate') && badgeText.includes('confermata')) {
                    row.style.display = '';
                } else if (buttonText.includes('attesa') && badgeText.includes('attesa')) {
                    row.style.display = '';
                } else if (buttonText.includes('annullate') && badgeText.includes('annullata')) {
                    row.style.display = '';
                } else if (buttonText.includes('scadute') && badgeText.includes('scaduta')) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });

    // Elimina prenotazioni scadute
    const deleteScaduteBtn = document.getElementById('deleteScaduteBtn');
    if (deleteScaduteBtn) {
        deleteScaduteBtn.addEventListener('click', async function() {
            const doDelete = async () => {
                try {
                    const response = await fetch('/admin/prenotazioni/elimina-scadute', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    const data = await response.json();

                    if (response.ok) {
                        // usa toast manager alias
                        if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
                            window.AdminGlobal.ToastManager.show('Prenotazioni scadute eliminate con successo', 'success');
                        }
                        setTimeout(() => location.reload(), 1500);
                    } else {
                        if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
                            window.AdminGlobal.ToastManager.show(data.error || 'Errore durante l\'eliminazione', 'error');
                        }
                    }
                } catch (error) {
                    console.error('Errore:', error);
                    if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
                        window.AdminGlobal.ToastManager.show('Errore di connessione', 'error');
                    }
                }
            };

            if (window.AdminGlobal && window.AdminGlobal.modalManager) {
                window.AdminGlobal.modalManager.confirm({
                    title: 'Conferma eliminazione',
                    message: 'Sei sicuro di voler eliminare tutte le prenotazioni scadute?',
                    confirmText: 'Elimina',
                    cancelText: 'Annulla',
                    type: 'danger',
                    onConfirm: doDelete
                });
            } else {
                if (!confirm('Sei sicuro di voler eliminare tutte le prenotazioni scadute?')) return;
                await doDelete();
            }
        });
    }

    // Azioni tabella (visualizza, conferma, annulla, modifica, elimina)
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.btn-outline-primary, .btn-outline-success, .btn-outline-danger, .btn-outline-warning');
        if (!btn) return;

        const prenotazioneId = btn.dataset.id;
        if (!prenotazioneId) return;

        if (btn.classList.contains('btn-outline-primary') && btn.title === 'Visualizza') {
                visualizzaPrenotazione(prenotazioneId);
        } else if (btn.classList.contains('btn-outline-success') && btn.title === 'Conferma') {
            confermaPrenotazione(prenotazioneId);
        } else if (btn.classList.contains('btn-outline-danger') && btn.title === 'Annulla') {
            annullaPrenotazione(prenotazioneId);
        } else if (btn.classList.contains('btn-outline-warning') && btn.title === 'Modifica') {
            modificaPrenotazione(prenotazioneId);
        } else if (btn.classList.contains('btn-outline-danger') && btn.title === 'Elimina') {
            eliminaPrenotazione(prenotazioneId);
        } else if (btn.classList.contains('btn-outline-success') && btn.title === 'Riattiva') {
            riattivaPrenotazione(prenotazioneId);
        }
    });
});

// Helper: safe JSON parse that falls back to text on non-JSON responses
async function parseJsonSafe(response) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return response.json();
    }
    // try parse anyway for ok responses, but return text if fails
    try {
        const text = await response.text();
        console.warn('parseJsonSafe: expected JSON but got:', text && text.slice(0,200));
        return { __raw: text };
    } catch (e) {
        return { __raw: null };
    }
}

// Funzioni CRUD
async function visualizzaPrenotazione(id) {
    try {
        // Use public API route for JSON response
        const response = await fetch(`/prenotazione/prenotazioni/${id}`);
        const data = await parseJsonSafe(response);
        
        if (response.ok) {
            // Prepara documento identità
            let docIdentita = '<span class="text-muted">Non fornito</span>';
            if (data.tipo_documento === 'CF' && data.codice_fiscale) {
                docIdentita = `<span class="badge bg-info">CF</span> ${data.codice_fiscale}`;
            } else if (data.tipo_documento === 'ID' && data.numero_documento) {
                docIdentita = `<span class="badge bg-info">ID</span> ${data.numero_documento}`;
            }
            
            // Prepara badge stato
            let statoBadge = '';
            if (data.stato === 'confermata') statoBadge = '<span class="badge bg-success">Confermata</span>';
            else if (data.stato === 'in_attesa') statoBadge = '<span class="badge bg-warning">In Attesa</span>';
            else if (data.stato === 'annullata') statoBadge = '<span class="badge bg-danger">Annullata</span>';
            else if (data.stato === 'scaduta') statoBadge = '<span class="badge bg-secondary">Scaduta</span>';
            else if (data.stato === 'completata') statoBadge = '<span class="badge bg-info">Completata</span>';
            else statoBadge = `<span class="badge bg-secondary">${data.stato || '-'}</span>`;
            
            // Info annullamento
            let annullataInfo = '';
            if (data.stato === 'annullata' && data.annullata_da) {
                const annullataDa = data.annullata_da === 'admin' ? 'Amministratore' : 'Utente';
                annullataInfo = `<p><strong>Annullata da:</strong> <span class="text-danger">${annullataDa}</span></p>`;
            }
            
            // Mostra modal con dettagli completi
            const modalHtml = `
                <div class="row">
                    <div class="col-md-6">
                        <h6 class="text-primary mb-3"><i class="bi bi-info-circle me-2"></i>Informazioni Prenotazione</h6>
                        <p><strong>ID:</strong> #${data.id}</p>
                        <p><strong>Campo:</strong> <span class="badge bg-primary">${data.campo_nome || 'Campo ' + data.campo_id}</span></p>
                        <p><strong>Data:</strong> ${data.data_prenotazione ? new Date(data.data_prenotazione).toLocaleDateString('it-IT') : '-'}</p>
                        <p><strong>Orario:</strong> <i class="bi bi-clock me-1"></i>${data.ora_inizio || '-'} - ${data.ora_fine || '-'}</p>
                        <p><strong>Tipo Attività:</strong> ${data.tipo_attivita || '<span class="text-muted">Non specificato</span>'}</p>
                        <p><strong>Stato:</strong> ${statoBadge}</p>
                        ${annullataInfo}
                    </div>
                    <div class="col-md-6">
                        <h6 class="text-success mb-3"><i class="bi bi-person-circle me-2"></i>Dati Utente</h6>
                        <p><strong>Utente:</strong> ${data.utente_nome || ''} ${data.utente_cognome || '<span class="text-muted">N/A</span>'}</p>
                        <p><strong>Squadra:</strong> ${data.squadra_nome || '<span class="text-muted">Nessuna</span>'}</p>
                        <p><strong><i class="bi bi-telephone me-1"></i>Telefono:</strong> ${data.telefono || '<span class="text-muted">Non fornito</span>'}</p>
                        <p><strong><i class="bi bi-card-text me-1"></i>Documento:</strong> ${docIdentita}</p>
                    </div>
                </div>
                ${data.note ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <h6 class="text-secondary mb-2"><i class="bi bi-chat-left-text me-2"></i>Note</h6>
                        <div class="alert alert-light mb-0">${data.note}</div>
                    </div>
                </div>
                ` : ''}
                <div class="row mt-3">
                    <div class="col-12">
                        <hr>
                        <small class="text-muted">
                            <i class="bi bi-clock-history me-1"></i>
                            Creata il: ${data.created_at ? new Date(data.created_at).toLocaleString('it-IT') : 'N/A'}
                            ${data.updated_at ? ` | Aggiornata: ${new Date(data.updated_at).toLocaleString('it-IT')}` : ''}
                        </small>
                    </div>
                </div>
            `;

            const bodyEl = document.getElementById('modalPrenotazioneBody');
            if (bodyEl) bodyEl.innerHTML = modalHtml;

            // Mostra il modal statico creato nella view
            if (window.AdminGlobal && window.AdminGlobal.modalManager) {
                window.AdminGlobal.modalManager.show('visualizzaPrenotazioneModal');
            } else if (typeof bootstrap !== 'undefined') {
                const bs = new bootstrap.Modal(document.getElementById('visualizzaPrenotazioneModal'));
                bs.show();
            } else {
                alert(modalHtml.replace(/<[^>]+>/g, '\n'));
            }
        } else {
            window.AdminGlobal.ToastManager.show(data.error || 'Errore caricamento dati', 'error');
        }
    } catch (error) {
        console.error('Errore:', error);
        window.AdminGlobal.ToastManager.show('Errore di connessione', 'error');
    }
}

async function confermaPrenotazione(id) {
    const doConfirm = async () => {
        try {
            const response = await fetch(`/admin/prenotazioni/${id}/conferma`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (response.ok) {
                if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
                    window.AdminGlobal.ToastManager.show('Prenotazione confermata', 'success');
                }
                setTimeout(() => location.reload(), 1500);
            } else {
                if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
                    window.AdminGlobal.ToastManager.show(data.error || 'Errore durante la conferma', 'error');
                }
            }
        } catch (error) {
            console.error('Errore:', error);
            if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
                window.AdminGlobal.ToastManager.show('Errore di connessione', 'error');
            }
        }
    };

    if (window.AdminGlobal && window.AdminGlobal.modalManager) {
        window.AdminGlobal.modalManager.confirm({
            title: 'Conferma prenotazione',
            message: 'Confermare questa prenotazione?',
            confirmText: 'Conferma',
            cancelText: 'Annulla',
            type: 'success',
            onConfirm: doConfirm
        });
    } else {
        if (!confirm('Confermare questa prenotazione?')) return;
        await doConfirm();
    }
}

async function annullaPrenotazione(id) {
    const doAnnul = async () => {
        try {
            const response = await fetch(`/admin/prenotazioni/${id}/annulla`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (response.ok) {
                if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
                    window.AdminGlobal.ToastManager.show('Prenotazione annullata', 'success');
                }
                setTimeout(() => location.reload(), 1500);
            } else {
                if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
                    window.AdminGlobal.ToastManager.show(data.error || 'Errore durante l\'annullamento', 'error');
                }
            }
        } catch (error) {
            console.error('Errore:', error);
            if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
                window.AdminGlobal.ToastManager.show('Errore di connessione', 'error');
            }
        }
    };

    if (window.AdminGlobal && window.AdminGlobal.modalManager) {
        window.AdminGlobal.modalManager.confirm({
            title: 'Annulla prenotazione',
            message: 'Annullare questa prenotazione?',
            confirmText: 'Annulla',
            cancelText: 'Indietro',
            type: 'warning',
            onConfirm: doAnnul
        });
    } else {
        if (!confirm('Annullare questa prenotazione?')) return;
        await doAnnul();
    }
}

async function modificaPrenotazione(id) {
    try {
        const loadingToast = window.AdminGlobal.ToastManager.show('Caricamento dati...', 'info');
        
        // Fetch prenotazione data
        const response = await fetch(`/prenotazione/prenotazioni/${id}`);
        if (!response.ok) throw new Error('Errore nel recupero dei dati');
        const prenotazione = await response.json();
        
        // Fetch campi disponibili
        const campiResponse = await fetch('/prenotazione/campi');
        if (!campiResponse.ok) throw new Error('Errore nel recupero dei campi');
        const campi = await campiResponse.json();
        
        // Popola select campi
        const campoSelect = document.getElementById('modPrenCampo');
        campoSelect.innerHTML = campi.map(campo => 
            `<option value="${campo.id}" ${campo.id === prenotazione.campo_id ? 'selected' : ''}>
                ${campo.nome}
            </option>`
        ).join('');
        
        // Popola form
        document.getElementById('modPrenId').value = prenotazione.id;
        document.getElementById('modPrenUtenteId').value = prenotazione.utente_id;
        document.getElementById('modPrenData').value = prenotazione.data;
        document.getElementById('modPrenOraInizio').value = prenotazione.ora_inizio;
        document.getElementById('modPrenOraFine').value = prenotazione.ora_fine;
        document.getElementById('modPrenTelefono').value = prenotazione.telefono || '';
        document.getElementById('modPrenNote').value = prenotazione.note || '';
        
        // Gestisci tipo documento
        const tipoDocSelect = document.getElementById('modPrenTipoDoc');
        const cfContainer = document.getElementById('modPrenCFContainer');
        const idContainer = document.getElementById('modPrenIDContainer');
        const cfInput = document.getElementById('modPrenCodiceFiscale');
        const idInput = document.getElementById('modPrenNumeroDoc');
        
        if (prenotazione.tipo_documento === 'CF') {
            tipoDocSelect.value = 'CF';
            cfContainer.style.display = 'block';
            idContainer.style.display = 'none';
            cfInput.value = prenotazione.codice_fiscale || '';
            cfInput.required = true;
            idInput.required = false;
        } else if (prenotazione.tipo_documento === 'ID') {
            tipoDocSelect.value = 'ID';
            cfContainer.style.display = 'none';
            idContainer.style.display = 'block';
            idInput.value = prenotazione.numero_documento || '';
            cfInput.required = false;
            idInput.required = true;
        } else {
            tipoDocSelect.value = '';
            cfContainer.style.display = 'none';
            idContainer.style.display = 'none';
            cfInput.required = false;
            idInput.required = false;
        }
        
        // Mostra modal
        const modal = new bootstrap.Modal(document.getElementById('modificaPrenotazioneModal'));
        modal.show();
        
        loadingToast.hide();
        
    } catch (error) {
        console.error('Errore modifica prenotazione:', error);
        window.AdminGlobal.ToastManager.show('Errore nel caricamento dei dati: ' + error.message, 'error');
    }
}

async function salvaModificaPrenotazione() {
    try {
        const form = document.getElementById('modificaPrenotazioneForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const id = document.getElementById('modPrenId').value;
        const telefono = document.getElementById('modPrenTelefono').value;
        const tipoDoc = document.getElementById('modPrenTipoDoc').value;
        
        // Validazione telefono
        const phonePattern = /^\+39\s?[0-9]{9,10}$/;
        if (!phonePattern.test(telefono)) {
            window.AdminGlobal.ToastManager.show('Formato telefono non valido. Richiesto: +39 seguito da 9-10 cifre', 'error');
            return;
        }
        
        // Validazione documento se presente
        if (tipoDoc === 'CF') {
            const cf = document.getElementById('modPrenCodiceFiscale').value;
            const cfPattern = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
            if (!cf || !cfPattern.test(cf)) {
                window.AdminGlobal.ToastManager.show('Codice fiscale non valido', 'error');
                return;
            }
        } else if (tipoDoc === 'ID') {
            const numDoc = document.getElementById('modPrenNumeroDoc').value;
            if (!numDoc || numDoc.length < 5) {
                window.AdminGlobal.ToastManager.show('Numero documento deve essere di almeno 5 caratteri', 'error');
                return;
            }
        }
        
        // Normalizza telefono
        const telefonoNormalizzato = telefono.replace(/\s/g, '');
        
        // Prepara dati
        const dati = {
            campo_id: parseInt(document.getElementById('modPrenCampo').value),
            data: document.getElementById('modPrenData').value,
            ora_inizio: document.getElementById('modPrenOraInizio').value,
            ora_fine: document.getElementById('modPrenOraFine').value,
            telefono: telefonoNormalizzato,
            tipo_documento: tipoDoc || null,
            codice_fiscale: tipoDoc === 'CF' ? document.getElementById('modPrenCodiceFiscale').value.toUpperCase() : null,
            numero_documento: tipoDoc === 'ID' ? document.getElementById('modPrenNumeroDoc').value.toUpperCase() : null,
            note: document.getElementById('modPrenNote').value || null,
            modified_by_admin: true
        };
        
        const loadingToast = window.AdminGlobal.ToastManager.show('Salvataggio in corso...', 'info');
        
        const response = await fetch(`/prenotazione/prenotazioni/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dati)
        });
        
        const result = await response.json();
        
        loadingToast.hide();
        
        if (response.ok) {
            window.AdminGlobal.ToastManager.show('Prenotazione modificata con successo', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('modificaPrenotazioneModal'));
            modal.hide();
            setTimeout(() => location.reload(), 1500);
        } else {
            window.AdminGlobal.ToastManager.show(result.error || 'Errore durante il salvataggio', 'error');
        }
        
    } catch (error) {
        console.error('Errore salvataggio:', error);
        window.AdminGlobal.ToastManager.show('Errore di connessione: ' + error.message, 'error');
    }
}

async function eliminaPrenotazione(id) {
    const doDelete = async () => {
        try {
            const response = await fetch(`/admin/prenotazioni/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (response.ok) {
                if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
                    window.AdminGlobal.ToastManager.show('Prenotazione eliminata', 'success');
                }
                setTimeout(() => location.reload(), 1500);
            } else {
                if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
                    window.AdminGlobal.ToastManager.show(data.error || 'Errore durante l\'eliminazione', 'error');
                }
            }
        } catch (error) {
            console.error('Errore:', error);
            if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
                window.AdminGlobal.ToastManager.show('Errore di connessione', 'error');
            }
        }
    };

    if (window.AdminGlobal && window.AdminGlobal.modalManager) {
        window.AdminGlobal.modalManager.confirm({
            title: 'Elimina prenotazione',
            message: 'Eliminare definitivamente questa prenotazione?',
            confirmText: 'Elimina',
            cancelText: 'Annulla',
            type: 'danger',
            onConfirm: doDelete
        });
    } else {
        if (!confirm('Eliminare definitivamente questa prenotazione?')) return;
        await doDelete();
    }
}

async function riattivaPrenotazione(id) {
    const doReactivate = async () => {
        try {
            const response = await fetch(`/admin/prenotazioni/${id}/riattiva`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (response.ok) {
                if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
                    window.AdminGlobal.ToastManager.show('Prenotazione riattivata', 'success');
                }
                setTimeout(() => location.reload(), 1500);
            } else {
                if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
                    window.AdminGlobal.ToastManager.show(data.error || 'Errore durante la riattivazione', 'error');
                }
            }
        } catch (error) {
            console.error('Errore:', error);
            if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
                window.AdminGlobal.ToastManager.show('Errore di connessione', 'error');
            }
        }
    };

    if (window.AdminGlobal && window.AdminGlobal.modalManager) {
        window.AdminGlobal.modalManager.confirm({
            title: 'Riattiva prenotazione',
            message: 'Riattivare questa prenotazione?',
            confirmText: 'Riattiva',
            cancelText: 'Annulla',
            type: 'success',
            onConfirm: doReactivate
        });
    } else {
        if (!confirm('Riattivare questa prenotazione?')) return;
        await doReactivate();
    }
}
