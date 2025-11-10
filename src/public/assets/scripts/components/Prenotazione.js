import { setupEmailFormListener } from './send_email.js';
import ShowModal from '../utils/showModal.js';

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
            btn.addEventListener('click', async (e) => {
                const campoId = btn.getAttribute('data-campo-id');
                try {
                    const resUser = await fetch('/session/user');
                    if (resUser.ok) {
                        this.openPrenotaModal(campoId);
                    } else {
                        if (ShowModal && typeof ShowModal.showLoginRequiredModal === 'function') {
                            ShowModal.showLoginRequiredModal('Devi essere loggato per prenotare');
                        }
                    }
                } catch (e) {
                    if (ShowModal && typeof ShowModal.showLoginRequiredModal === 'function') {
                        ShowModal.showLoginRequiredModal('Errore nel controllo del login. Riprova.');
                    }
                }
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
            let filteredOrari = Array.isArray(orari) ? orari.filter(o => {
                if (typeof o.prenotato !== 'undefined' && o.prenotato) return false;
                const [h, m] = o.inizio.split(":");
                const orarioDate = new Date(data + 'T' + o.inizio);
                if (data === now.toISOString().slice(0,10)) {
                    return (orarioDate.getTime() - now.getTime()) >= 2 * 60 * 60 * 1000;
                }
                return true;
            }) : [];

            // If none available for the requested date, try tomorrow and show a note
            if (filteredOrari.length === 0) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tStr = tomorrow.toISOString().slice(0,10);
                try {
                    const res2 = await fetch(`/prenotazione/campi/${campoId}/disponibilita?data=${tStr}`);
                    const orari2 = await res2.json();
                    filteredOrari = Array.isArray(orari2) ? orari2.filter(o => {
                        if (typeof o.prenotato !== 'undefined' && o.prenotato) return false;
                        return true;
                    }) : [];
                    if (filteredOrari.length > 0) {
                        resultDiv.innerHTML = `<div class="text-muted small mb-2">Nessun orario disponibile per ${data}. Mostrati gli orari per ${tStr}:</div>` + filteredOrari.map(o => `<span class="badge bg-success text-light border p-2">${o.inizio}-${o.fine}</span>`).join('');
                        return;
                    }
                } catch (e) {
                    console.warn('Fallback tomorrow fetch failed', e);
                }
            }

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
                        if (ShowModal && typeof ShowModal.showLoginRequiredModal === 'function') {
                            ShowModal.showLoginRequiredModal('Devi essere loggato per prenotare');
                        }
                        return;
                    }
                    if (!res.ok) {
                        let msg = 'Errore nella prenotazione';
                        try {
                            const errJson = await res.json();
                            msg = errJson.error || msg;
                        } catch(e) {}
                        if (ShowModal && typeof ShowModal.showModalError === 'function') {
                            ShowModal.showModalError(msg, 'Errore nella prenotazione');
                        }
                        return;
                    }
                    const result = await res.json();
                    if (result && result.success) {
                        if (ShowModal && typeof ShowModal.showModalInfo === 'function') {
                            ShowModal.showModalInfo('La tua prenotazione è stata inviata e è in attesa di approvazione.', 'Prenotazione in attesa');
                        }
                        // Update orari after booking
                        const data = this.page.querySelector(`.input-orari-campo[data-campo-id='${campoId}']`)?.value || new Date().toISOString().slice(0,10);
                        await this.updateOrariDisponibili(campoId, data);
                    } else {
                        if (ShowModal && typeof ShowModal.showModalError === 'function') {
                            ShowModal.showModalError(result.error || 'Errore nella prenotazione');
                        }
                    }
                } catch (err) {
                    if (ShowModal && typeof ShowModal.showModalError === 'function') {
                        ShowModal.showModalError('Errore di rete nella prenotazione');
                    }
                }
            });
        } catch (e) {
            console.error('Errore nel recupero orari per modal:', e);
        }
    }
}

export default Prenotazione;