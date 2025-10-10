import showModal from '../utils/showModal.js';
import { setupEmailFormListener } from './send_email.js';

class Prenotazione {
    constructor(page) {
        this.page = page;
        this.campi = [];
        this.orariDisponibili = {};
        this.init();
    }

    async init() {
        document.title = "Prenotazione";
        await this.fetchCampi();
        this.addEventListeners();
        setupEmailFormListener();
    }

    async fetchCampi() {
        try {
            const res = await fetch('/prenotazione/campi');
            this.campi = await res.json();
        } catch (e) {
            this.campi = [];
        }
    }

    addEventListeners() {
        this.page.querySelectorAll('.btn-prenota').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const campoId = btn.getAttribute('data-campo-id');
                this.openPrenotaModal(campoId);
            });
        });

        this.page.querySelectorAll('.input-orari-campo').forEach(input => {
            input.addEventListener('change', async (e) => {
                const campoId = input.getAttribute('data-campo-id');
                const data = input.value;
                await this.updateOrariDisponibili(campoId, data);
            });
        });
    }

    async updateOrariDisponibili(campoId, data) {
        try {
            const res = await fetch(`/prenotazione/campi/${campoId}/disponibilita?data=${data}`);
            const orari = await res.json();
            const now = new Date();
            const resultDiv = this.page.querySelector(`#orariDisponibili-${campoId}`);
            const filteredOrari = orari.filter(o => {
                if (typeof o.prenotato !== 'undefined' && o.prenotato) return false;
                const [h, m] = o.inizio.split(":");
                const orarioDate = new Date(data + 'T' + o.inizio);
                if (data === now.toISOString().slice(0,10)) {
                    return (orarioDate.getTime() - now.getTime()) >= 2 * 60 * 60 * 1000;
                }
                return true;
            });
            resultDiv.innerHTML = filteredOrari.map(o => `<span class="badge bg-success text-light border p-2">${o.inizio}-${o.fine}</span>`).join('');
        } catch (e) {
            console.error('Errore nel recupero orari:', e);
        }
    }

    async openPrenotaModal(campoId) {
        const campo = this.campi.find(c => c.id == campoId);
        const inputData = this.page.querySelector(`.input-orari-campo[data-campo-id='${campoId}']`)?.value || new Date().toISOString().slice(0,10);
        try {
            const res = await fetch(`/prenotazione/campi/${campoId}/disponibilita?data=${inputData}`);
            const orari = await res.json();
            const now = new Date();
            const filteredOrari = orari.filter(o => {
                if (typeof o.prenotato !== 'undefined' && o.prenotato) return false;
                const [h, m] = o.inizio.split(":");
                const orarioDate = new Date(inputData + 'T' + o.inizio);
                if (inputData === now.toISOString().slice(0,10)) {
                    return (orarioDate.getTime() - now.getTime()) >= 2 * 60 * 60 * 1000;
                }
                return true;
            });
            const { showModalPrenotazione } = await import('../utils/modalPrenotazione.js');
            showModalPrenotazione(campo, filteredOrari, async (datiPrenotazione) => {
                let utenteId = null;
                try {
                    const resUser = await fetch('/session/user');
                    if (resUser.ok) {
                        const user = await resUser.json();
                        utenteId = user.id;
                    }
                } catch (e) {
                    utenteId = null;
                }
                try {
                    const res = await fetch('/prenotazione/prenotazioni', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...datiPrenotazione, utente_id: utenteId })
                    });
                    if (res.status === 401) {
                        showModal.showLoginRequiredModal('Devi essere loggato per prenotare');
                        return;
                    }
                    if (!res.ok) {
                        let msg = 'Errore nella prenotazione';
                        try {
                            const errJson = await res.json();
                            msg = errJson.error || msg;
                        } catch(e) {}
                        showModal.showModalError(msg,'Errore nella prenotazione');
                        return;
                    }
                    const result = await res.json();
                    if (result && result.success) {
                        showModal.showModalSuccess('Prenotazione avvenuta con successo');
                        // Update orari after booking
                        const data = this.page.querySelector(`.input-orari-campo[data-campo-id='${campoId}']`)?.value || new Date().toISOString().slice(0,10);
                        await this.updateOrariDisponibili(campoId, data);
                    } else {
                        showModal.showModalError(result.error || 'Errore nella prenotazione');
                    }
                } catch (err) {
                    showModal.showModalError('Errore di rete nella prenotazione');
                }
            });
        } catch (e) {
            console.error('Errore nel recupero orari per modal:', e);
        }
    }
}

export default Prenotazione;