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

// Funzioni CRUD
async function visualizzaPrenotazione(id) {
    try {
        const response = await fetch(`/admin/prenotazioni/${id}`);
        const data = await response.json();
        
        if (response.ok) {
            // Mostra modal con dettagli
            const modalHtml = `
                <p><strong>Campo:</strong> ${data.campo_nome || 'N/A'}</p>
                <p><strong>Utente:</strong> ${data.utente_nome || ''} ${data.utente_cognome || ''}</p>
                <p><strong>Squadra:</strong> ${data.squadra_nome || 'N/A'}</p>
                <p><strong>Data:</strong> ${data.data_prenotazione ? new Date(data.data_prenotazione).toLocaleDateString('it-IT') : '-'}</p>
                <p><strong>Orario:</strong> ${data.ora_inizio || '-'} - ${data.ora_fine || '-'}</p>
                <p><strong>Tipo Attività:</strong> ${data.tipo_attivita || 'N/A'}</p>
                <p><strong>Stato:</strong> ${data.stato || '-'}</p>
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
    window.AdminGlobal.ToastManager.show('Funzionalità in sviluppo', 'info');
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
