/**
 * ModificaCampionato.js
 * Gestione modifica campionato con squadre
 */

document.addEventListener('DOMContentLoaded', function() {
    const campionatoId = document.getElementById('campionatoId').value;
    const form = document.getElementById('editChampionshipForm');
    const addTeamBtn = document.getElementById('addTeamBtn');
    const confirmAddTeamBtn = document.getElementById('confirmAddTeamBtn');

    // Carica squadre del campionato
    loadTeams();

    // Event listeners
    form.addEventListener('submit', handleSubmit);
    addTeamBtn.addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('addTeamModal'));
        modal.show();
    });
    confirmAddTeamBtn.addEventListener('click', addTeam);
});

async function loadTeams() {
    const campionatoId = document.getElementById('campionatoId').value;
    
    try {
        const response = await fetch(`/api/admin/campionati/${campionatoId}/squadre`);
        const data = await response.json();
        
        // L'API ritorna { squadre: [...] } non un array diretto
        const teams = data.squadre || [];
        
        // Validazione: assicurati che sia un array
        if (!Array.isArray(teams)) {
            console.error('La risposta non contiene un array di squadre:', data);
            renderTeams([]);
            return;
        }

        renderTeams(teams);
    } catch (error) {
        console.error('Errore caricamento squadre:', error);
        // Fallback se AdminGlobal non è disponibile
        if (window.AdminGlobal && window.AdminGlobal.ToastManager) {
            window.AdminGlobal.ToastManager.show('Errore caricamento squadre', 'error');
        } else {
            alert('Errore nel caricamento delle squadre');
        }
    }
}

function renderTeams(teams) {
    const tbody = document.getElementById('teamTableBody');

    // Validazione aggiuntiva per sicurezza
    if (!Array.isArray(teams)) {
        console.error('renderTeams: teams non è un array', teams);
        teams = [];
    }

    if (!teams || teams.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-4">
                    <i class="bi bi-info-circle display-6 mb-2"></i>
                    <p>Nessuna squadra nel campionato</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = teams.map(team => `
        <tr>
            <td><strong>${team.posizione || '-'}</strong></td>
            <td>${escapeHtml(team.nome)}</td>
            <td><strong>${team.punti || 0}</strong></td>
            <td>${team.vinte || 0}</td>
            <td>${team.perse || 0}</td>
            <td>${team.pareggiate || 0}</td>
            <td>${team.gol_fatti || 0}</td>
            <td>${team.gol_subiti || 0}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-danger" onclick="removeTeam('${escapeHtml(team.nome)}')" title="Rimuovi">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function addTeam() {
    const campionatoId = document.getElementById('campionatoId').value;
    const squadraNome = document.getElementById('squadraSelect').value;
    const posizione = parseInt(document.getElementById('posizioneInput').value);
    const punti = parseInt(document.getElementById('puntiInput').value);
    const vinte = parseInt(document.getElementById('vinteInput').value);
    const pareggiate = parseInt(document.getElementById('pareggiteInput').value);
    const perse = parseInt(document.getElementById('perseInput').value);
    const golFatti = parseInt(document.getElementById('golFattiInput').value);
    const golSubiti = parseInt(document.getElementById('golSubitiInput').value);

    if (!squadraNome) {
        window.AdminGlobal.ToastManager.show('Seleziona una squadra', 'warning');
        return;
    }

    const data = {
        nome: squadraNome,
        posizione,
        punti,
        vinte,
        pareggiate,
        perse,
        gol_fatti: golFatti,
        gol_subiti: golSubiti
    };

    try {
        window.AdminGlobal.LoadingOverlay.show();

        const response = await fetch(`/api/admin/campionati/${campionatoId}/squadre`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Errore aggiunta squadra');
        }

        window.AdminGlobal.ToastManager.show('Squadra aggiunta con successo', 'success');
        
        // Chiudi modal e ricarica squadre
        const modal = bootstrap.Modal.getInstance(document.getElementById('addTeamModal'));
        modal.hide();
        loadTeams();

        // Reset form
        document.getElementById('squadraSelect').value = '';
        document.getElementById('posizioneInput').value = '1';
        document.getElementById('puntiInput').value = '0';
        document.getElementById('vinteInput').value = '0';
        document.getElementById('pareggiteInput').value = '0';
        document.getElementById('perseInput').value = '0';
        document.getElementById('golFattiInput').value = '0';
        document.getElementById('golSubitiInput').value = '0';

    } catch (error) {
        console.error('Errore:', error);
        window.AdminGlobal.ToastManager.show(error.message || 'Errore aggiunta squadra', 'error');
    } finally {
        window.AdminGlobal.LoadingOverlay.hide();
    }
}

async function removeTeam(squadraNome) {
    if (!confirm(`Rimuovere ${squadraNome} dal campionato?`)) {
        return;
    }

    const campionatoId = document.getElementById('campionatoId').value;

    try {
        window.AdminGlobal.LoadingOverlay.show();

        const response = await fetch(`/api/admin/campionati/${campionatoId}/squadre/${encodeURIComponent(squadraNome)}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Errore rimozione squadra');
        }

        window.AdminGlobal.ToastManager.show('Squadra rimossa', 'success');
        loadTeams();

    } catch (error) {
        console.error('Errore:', error);
        window.AdminGlobal.ToastManager.show(error.message || 'Errore rimozione squadra', 'error');
    } finally {
        window.AdminGlobal.LoadingOverlay.hide();
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    const campionatoId = document.getElementById('campionatoId').value;
    const formData = new FormData(e.target);

    const data = {
        nome: formData.get('nome'),
        stagione: formData.get('stagione'),
        categoria: formData.get('categoria'),
        attivo: document.getElementById('attivo').checked,
        fonte_esterna_id: formData.get('fonte_esterna_id') || null,
        url_fonte: formData.get('url_fonte') || null,
        promozione_diretta: parseInt(formData.get('promozione_diretta')) || 2,
        playoff_start: parseInt(formData.get('playoff_start')) || 3,
        playoff_end: parseInt(formData.get('playoff_end')) || 6,
        playout_start: parseInt(formData.get('playout_start')) || 11,
        playout_end: parseInt(formData.get('playout_end')) || 14,
        retrocessione_diretta: parseInt(formData.get('retrocessione_diretta')) || 2
    };

    if (!data.nome || !data.stagione || !data.categoria) {
        window.AdminGlobal.ToastManager.show('Compila tutti i campi obbligatori', 'warning');
        return;
    }

    try {
        window.AdminGlobal.LoadingOverlay.show();

        const response = await fetch(`/api/admin/campionati/${campionatoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Errore aggiornamento campionato');
        }

        window.AdminGlobal.ToastManager.show('Campionato aggiornato con successo!', 'success');
        setTimeout(() => window.location.href = '/admin/campionati', 1500);

    } catch (error) {
        console.error('Errore:', error);
        window.AdminGlobal.ToastManager.show(error.message || 'Errore durante l\'aggiornamento', 'error');
    } finally {
        window.AdminGlobal.LoadingOverlay.hide();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Esponi funzioni globali per onclick
window.removeTeam = removeTeam;
