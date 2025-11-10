/**
 * CreaCampionato.js
 * Gestione creazione nuovo campionato
 */

class CreaCampionato {
    constructor() {
        this.squadre = [];
        this.init();
    }

    init() {
        const form = document.getElementById('createChampionshipForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        const addBtn = document.getElementById('addSquadraBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addSquadra());
        }

        // Permetti aggiunta squadra con Enter
        const selectSquadra = document.getElementById('nomeSquadra');
        if (selectSquadra) {
            selectSquadra.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addSquadra();
                }
            });
        }
    }

    addSquadra() {
        const input = document.getElementById('nomeSquadra');
        const nome = input.value.trim();

        if (!nome) {
            window.AdminGlobal.ToastManager.show('Seleziona una squadra', 'warning');
            return;
        }

        if (this.squadre.includes(nome)) {
            window.AdminGlobal.ToastManager.show('Squadra già aggiunta', 'warning');
            return;
        }

        this.squadre.push(nome);
        input.value = '';
        this.renderSquadre();
        window.AdminGlobal.ToastManager.show('Squadra aggiunta', 'success');
    }

    removeSquadra(nome) {
        this.squadre = this.squadre.filter(s => s !== nome);
        this.renderSquadre();
        window.AdminGlobal.ToastManager.show('Squadra rimossa', 'info');
    }

    renderSquadre() {
        const tbody = document.getElementById('squadreTableBody');
        const noRow = document.getElementById('noSquadreRow');

        if (this.squadre.length === 0) {
            tbody.innerHTML = `
                <tr id="noSquadreRow">
                    <td colspan="3" class="text-center text-muted">
                        Nessuna squadra aggiunta
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = this.squadre.map((squadra, index) => `
                <tr>
                    <td><strong>${index + 1}</strong></td>
                    <td>${this.escapeHtml(squadra)}</td>
                    <td class="text-center">
                        <button type="button" class="btn btn-sm btn-outline-danger" 
                                data-squadra="${this.escapeHtml(squadra)}" 
                                title="Rimuovi squadra">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');

            // Aggiungi event listener per i bottoni rimuovi
            tbody.querySelectorAll('.btn-outline-danger').forEach(btn => {
                btn.addEventListener('click', () => {
                    const squadraNome = btn.dataset.squadra;
                    this.removeSquadra(squadraNome);
                });
            });
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = {
            nome: formData.get('nome'),
            stagione: formData.get('stagione'),
            categoria: formData.get('categoria'),
            is_active: document.getElementById('attivo').checked
        };

        // Validazione
        if (!data.nome || !data.stagione || !data.categoria) {
            window.AdminGlobal.ToastManager.show('Compila tutti i campi obbligatori', 'warning');
            return;
        }

        if (this.squadre.length === 0) {
            window.AdminGlobal.ToastManager.show('Aggiungi almeno una squadra', 'warning');
            return;
        }

        // Mostra loading overlay
        window.AdminGlobal.LoadingOverlay.show();

        try {
            // Crea campionato
            const response = await fetch('/api/admin/campionati', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Errore creazione campionato');
            }

            const result = await response.json();
            const campionatoId = result.id;

            // Aggiungi squadre al campionato
            for (const squadra of this.squadre) {
                await fetch(`/api/admin/campionati/${campionatoId}/squadre`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ 
                        nome: squadra, 
                        posizione: 0, 
                        punti: 0 
                    })
                });
            }

            window.AdminGlobal.ToastManager.show('Campionato creato con successo!', 'success');
            setTimeout(() => window.location.href = '/admin/campionati', 1500);

        } catch (error) {
            console.error('Errore:', error);
            window.AdminGlobal.ToastManager.show(error.message || 'Errore durante la creazione', 'error');
        } finally {
            window.AdminGlobal.LoadingOverlay.hide();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
    window.creaCampionato = new CreaCampionato();
});
