class ModificaCampionato {
    constructor() {
        this.campionatoId = document.getElementById('campionatoId').value;
        this.teams = [];
        this.init();
    }

    init() {
        this.loadTeams();
        this.bindEvents();
    }

    bindEvents() {
        const form = document.getElementById('editChampionshipForm');
        const addTeamBtn = document.getElementById('addTeamBtn');
        const confirmAddTeamBtn = document.getElementById('confirmAddTeamBtn');
        const addTeamModal = new bootstrap.Modal(document.getElementById('addTeamModal'));

        form.addEventListener('submit', (e) => this.handleSubmit(e));
        addTeamBtn.addEventListener('click', () => {
            // Aggiorna la posizione suggerita
            document.getElementById('posizioneInput').value = this.teams.length + 1;
            // Reset campi
            document.getElementById('squadraSelect').value = '';
            document.getElementById('puntiInput').value = '0';
            document.getElementById('vinteInput').value = '0';
            document.getElementById('pareggiteInput').value = '0';
            document.getElementById('perseInput').value = '0';
            document.getElementById('golFattiInput').value = '0';
            document.getElementById('golSubitiInput').value = '0';
            // Mostra modal
            addTeamModal.show();
        });

        confirmAddTeamBtn.addEventListener('click', () => {
            this.addNewTeam();
            addTeamModal.hide();
        });

        // Delegazione eventi per pulsanti dinamici
        document.getElementById('teamTableBody').addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete-team')) {
                const squadraNome = e.target.closest('.btn-delete-team').dataset.nome;
                this.deleteTeam(squadraNome);
            } else if (e.target.closest('.btn-edit-team')) {
                const index = e.target.closest('.btn-edit-team').dataset.index;
                this.editTeam(index);
            }
        });
    }

    async loadTeams() {
        try {
            const response = await fetch(`/api/admin/campionati/${this.campionatoId}/squadre`, {
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Errore nel caricamento delle squadre');

            const data = await response.json();
            this.teams = data.squadre || [];
            this.renderTeams();
        } catch (error) {
            console.error('Errore:', error);
            this.showToast('Errore nel caricamento delle squadre', 'danger');
        }
    }

    renderTeams() {
        const tbody = document.getElementById('teamTableBody');
        
        if (this.teams.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted py-4">
                        <i class="bi bi-inbox fs-3 d-block mb-2"></i>
                        Nessuna squadra aggiunta
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.teams.map((team, index) => `
            <tr>
                <td>
                    <input type="number" class="form-control form-control-sm" 
                           value="${team.posizione || index + 1}" 
                           data-index="${index}" data-field="posizione" 
                           style="width: 70px;">
                </td>
                <td><strong>${team.nome || team.squadra_nome || 'N/A'}</strong></td>
                <td>
                    <input type="number" class="form-control form-control-sm" 
                           value="${team.punti || 0}" 
                           data-index="${index}" data-field="punti" 
                           style="width: 70px;">
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm" 
                           value="${team.vittorie || 0}" 
                           data-index="${index}" data-field="vittorie" 
                           style="width: 60px;">
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm" 
                           value="${team.sconfitte || 0}" 
                           data-index="${index}" data-field="sconfitte" 
                           style="width: 60px;">
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm" 
                           value="${team.pareggi || 0}" 
                           data-index="${index}" data-field="pareggi" 
                           style="width: 60px;">
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm" 
                           value="${team.gol_fatti || 0}" 
                           data-index="${index}" data-field="gol_fatti" 
                           style="width: 60px;">
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm" 
                           value="${team.gol_subiti || 0}" 
                           data-index="${index}" data-field="gol_subiti" 
                           style="width: 60px;">
                </td>
                <td class="text-end">
                    <button type="button" class="btn btn-sm btn-success btn-edit-team" 
                            data-index="${index}" title="Salva modifiche">
                        <i class="bi bi-check-lg"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-danger btn-delete-team" 
                            data-nome="${team.nome || team.squadra_nome}" title="Elimina">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Event listener per aggiornamento in tempo reale
        tbody.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const field = e.target.dataset.field;
                this.teams[index][field] = parseInt(e.target.value) || 0;
            });
        });
    }

    async addNewTeam() {
        const squadraSelect = document.getElementById('squadraSelect');
        const squadraNome = squadraSelect.value;

        if (!squadraNome || !squadraNome.trim()) {
            this.showToast('Seleziona una squadra', 'warning');
            return;
        }

        // Verifica se la squadra è già presente
        if (this.teams.some(t => (t.nome || t.squadra_nome) === squadraNome.trim())) {
            this.showToast('Squadra già presente nel campionato', 'warning');
            return;
        }

        const teamData = {
            squadra_nome: squadraNome.trim(),
            posizione: parseInt(document.getElementById('posizioneInput').value) || this.teams.length + 1,
            punti: parseInt(document.getElementById('puntiInput').value) || 0,
            vinte: parseInt(document.getElementById('vinteInput').value) || 0,
            perse: parseInt(document.getElementById('perseInput').value) || 0,
            pareggiate: parseInt(document.getElementById('pareggiteInput').value) || 0,
            gol_fatti: parseInt(document.getElementById('golFattiInput').value) || 0,
            gol_subiti: parseInt(document.getElementById('golSubitiInput').value) || 0
        };

        try {
            const response = await fetch(`/api/admin/campionati/${this.campionatoId}/squadre`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(teamData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore durante l\'aggiunta');
            }

            this.showToast('Squadra aggiunta con successo!', 'success');
            await this.loadTeams();
        } catch (error) {
            console.error('Errore:', error);
            this.showToast('Errore: ' + error.message, 'danger');
        }
    }

    async editTeam(index) {
        const team = this.teams[index];
        const nomeSquadra = team.nome || team.squadra_nome;

        try {
            const response = await fetch(`/api/admin/campionati/${this.campionatoId}/squadre/${encodeURIComponent(nomeSquadra)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(team)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore durante l\'aggiornamento');
            }

            this.showToast('Squadra aggiornata con successo!', 'success');
        } catch (error) {
            console.error('Errore:', error);
            this.showToast('Errore: ' + error.message, 'danger');
        }
    }

    async deleteTeam(squadraNome) {
        if (!confirm(`Sei sicuro di voler rimuovere "${squadraNome}" dal campionato?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/campionati/${this.campionatoId}/squadre/${encodeURIComponent(squadraNome)}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore durante l\'eliminazione');
            }

            this.showToast('Squadra rimossa con successo!', 'success');
            await this.loadTeams();
        } catch (error) {
            console.error('Errore:', error);
            this.showToast('Errore: ' + error.message, 'danger');
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const loadingOverlay = document.getElementById('loadingOverlay');
        const formData = new FormData(e.target);

        const championshipData = {
            nome: formData.get('nome'),
            stagione: formData.get('stagione'),
            categoria: formData.get('categoria'),
            fonte_esterna_id: formData.get('fonte_esterna_id') || null,
            url_fonte: formData.get('url_fonte') || null,
            attivo: document.getElementById('attivo').checked,
            promozione_diretta: parseInt(formData.get('promozione_diretta')) || 2,
            playoff_start: parseInt(formData.get('playoff_start')) || 3,
            playoff_end: parseInt(formData.get('playoff_end')) || 6,
            playout_start: parseInt(formData.get('playout_start')) || 11,
            playout_end: parseInt(formData.get('playout_end')) || 14,
            retrocessione_diretta: parseInt(formData.get('retrocessione_diretta')) || 2
        };

        try {
            loadingOverlay.style.display = 'flex';

            const response = await fetch(`/api/admin/campionati/${this.campionatoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(championshipData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore durante il salvataggio');
            }

            this.showToast('Campionato aggiornato con successo!', 'success');

            setTimeout(() => {
                window.location.href = '/admin/campionati';
            }, 1500);

        } catch (error) {
            console.error('Errore:', error);
            this.showToast('Errore: ' + error.message, 'danger');
        } finally {
            loadingOverlay.style.display = 'none';
        }
    }

    showToast(message, type) {
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${this.escapeHtml(message)}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);

        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
        toast.show();

        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.modificaCampionato = new ModificaCampionato();
});
