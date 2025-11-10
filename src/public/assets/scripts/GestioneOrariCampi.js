/**
 * GestioneOrariCampi.js
 * Gestione orari disponibili per campo sportivo
 */

document.addEventListener('DOMContentLoaded', function() {
    const campoId = document.getElementById('modalCampoId').value;
    let currentGiornoSettimana = null;

    // Bottoni per aggiungere orario (default e per giorno)
    document.addEventListener('click', function(e) {
        const addBtn = e.target.closest('[data-action="add-default"], [data-action="add-day"]');
        if (!addBtn) return;

        if (addBtn.dataset.action === 'add-default') {
            currentGiornoSettimana = null;
        } else if (addBtn.dataset.action === 'add-day') {
            currentGiornoSettimana = addBtn.dataset.giorno;
        }

        document.getElementById('modalGiornoSettimana').value = currentGiornoSettimana || '';
        document.getElementById('ora_inizio').value = '';
        document.getElementById('ora_fine').value = '';
        
        const modal = new bootstrap.Modal(document.getElementById('addOrarioModal'));
        modal.show();
    });

    // Conferma aggiunta orario
    document.getElementById('confirmAddBtn').addEventListener('click', addOrario);

    // Update orario in tempo reale (ora inizio, ora fine)
    document.addEventListener('change', function(e) {
        if (e.target.type === 'time' && e.target.dataset.orarioId) {
            const orarioId = e.target.dataset.orarioId;
            const field = e.target.dataset.field;
            const value = e.target.value;

            updateOrario(orarioId, field, value);
        }
    });

    // Update checkbox attivo
    document.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox' && e.target.dataset.orarioId) {
            const orarioId = e.target.dataset.orarioId;
            const checked = e.target.checked;

            updateOrario(orarioId, 'attivo', checked);
        }
    });

    // Elimina orario
    document.addEventListener('click', function(e) {
        const deleteBtn = e.target.closest('[data-action="delete"]');
        if (!deleteBtn) return;

        const orarioId = deleteBtn.dataset.orarioId;
        deleteOrario(orarioId);
    });
});

// Funzioni CRUD
async function addOrario() {
    const campoId = document.getElementById('modalCampoId').value;
    const giornoSettimana = document.getElementById('modalGiornoSettimana').value;
    const oraInizio = document.getElementById('ora_inizio').value;
    const oraFine = document.getElementById('ora_fine').value;

    if (!oraInizio || !oraFine) {
        window.AdminGlobal.ToastManager.show('Compila tutti i campi', 'warning');
        return;
    }

    if (oraInizio >= oraFine) {
        window.AdminGlobal.ToastManager.show('L\'ora di inizio deve essere precedente all\'ora di fine', 'warning');
        return;
    }

    try {
        const response = await fetch(`/admin/campi/${campoId}/orari`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                giorno_settimana: giornoSettimana || '',
                ora_inizio: oraInizio,
                ora_fine: oraFine
            })
        });

        const data = await response.json();

        if (response.ok) {
            window.AdminGlobal.ToastManager.show('Orario aggiunto con successo', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            window.AdminGlobal.ToastManager.show(data.error || 'Errore nell\'aggiunta dell\'orario', 'error');
        }
    } catch (error) {
        console.error('Errore:', error);
        window.AdminGlobal.ToastManager.show('Errore di connessione', 'error');
    }
}

async function updateOrario(id, field, value) {
    const data = {};
    
    if (field === 'ora_inizio') {
        data.ora_inizio = value;
    } else if (field === 'ora_fine') {
        data.ora_fine = value;
    } else if (field === 'attivo') {
        data.attivo = value;
    }

    try {
        const response = await fetch(`/admin/campi/orari/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            window.AdminGlobal.ToastManager.show('Orario aggiornato', 'success');
        } else {
            window.AdminGlobal.ToastManager.show(result.error || 'Errore nell\'aggiornamento', 'error');
            // Ricarica per ripristinare il valore originale
            setTimeout(() => location.reload(), 1500);
        }
    } catch (error) {
        console.error('Errore:', error);
        window.AdminGlobal.ToastManager.show('Errore di connessione', 'error');
        setTimeout(() => location.reload(), 1500);
    }
}

async function deleteOrario(id) {
    if (!confirm('Sei sicuro di voler eliminare questo orario?')) {
        return;
    }

    try {
        const response = await fetch(`/admin/campi/orari/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            window.AdminGlobal.ToastManager.show('Orario eliminato con successo', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            window.AdminGlobal.ToastManager.show(data.error || 'Errore nella cancellazione', 'error');
        }
    } catch (error) {
        console.error('Errore:', error);
        window.AdminGlobal.ToastManager.show('Errore di connessione', 'error');
    }
}
