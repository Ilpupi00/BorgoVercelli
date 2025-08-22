import showModal from '../utils/showModal.js';

class Prenotazione {
    constructor(page, loadCSS) {
        if (typeof loadCSS === 'function') loadCSS();
        this.page = page;
        this.campi = [];
        this.orariDisponibili = {};
        this.init();
    }

    async init() {
        await this.fetchCampi();
        await this.fetchOrari();
        this.render();
        this.addEventListeners();
    }

    async fetchCampi() {
        try {
            const res = await fetch('/prenotazione/campi');
            this.campi = await res.json();
        } catch (e) {
            this.campi = [];
        }
    }

    async fetchOrari() {
        const oggi = new Date().toISOString().slice(0, 10);
        this.orariDisponibili = {};
        for (const campo of this.campi) {
            try {
                const res = await fetch(`/prenotazione/campi/${campo.id}/disponibilita?data=${oggi}`);
                this.orariDisponibili[campo.id] = await res.json();
            } catch (e) {
                this.orariDisponibili[campo.id] = [];
            }
        }
    }

    render() {
        let html = '';
        if (this.campi.length === 0) {
            html = '<div class="alert alert-warning">Nessun campo disponibile al momento.</div>';
        } else {
            // Sostituisco la form globale con una form accanto alla disponibilità di ogni card campo
            html = this.campi.map(campo => {
                // Usa la prima immagine associata, se presente, altrimenti fallback
                let imgSrc = '/Sito/Immagini/default-news.jpg';
                if (campo.immagini && campo.immagini.length > 0) {
                    // Se l'url non inizia con /Sito/Immagini, allora è un upload
                    if (campo.immagini[0].url.startsWith('/Sito/Immagini')) {
                        imgSrc = campo.immagini[0].url;
                    } else {
                        imgSrc = '/uploads/' + campo.immagini[0].url.replace(/^\/+/, '');
                    }
                } else if (campo.tipo === 'Calcio a 5') {
                    imgSrc = '/Sito/Immagini/Campo_a_5.jpg';
                } else if (campo.tipo === 'Calcio a 7') {
                    imgSrc = '/Sito/Immagini/Campo_a_7.jpg';
                }
                    // Mostra tutte le immagini disponibili e il numero
                    let immaginiHtml = '';
                    let numImmagini = (campo.immagini && Array.isArray(campo.immagini)) ? campo.immagini.length : 0;
                    if (numImmagini > 0) {
                        immaginiHtml = campo.immagini.map(img => {
                            let src = img.url;
                            if (src.startsWith('/Sito/Immagini')) {
                                // Immagine statica
                                // src rimane invariato
                            } else if (src.startsWith('/uploads')) {
                                // Immagine già corretta
                            } else {
                                src = '/uploads/' + src.replace(/^\/+/, '');
                            }
                            return `<img src="${src}" alt="Campo" class="img-fluid w-100 mb-2 rounded">`;
                        }).join('');
                    } else if (campo.tipo === 'Calcio a 5') {
                        immaginiHtml = `<img src="/Sito/Immagini/Campo_a_5.jpg" alt="Campo di Calcio a 5" class="img-fluid w-100 mb-2 rounded">`;
                    } else if (campo.tipo === 'Calcio a 7') {
                        immaginiHtml = `<img src="/Sito/Immagini/Campo_a_7.jpg" alt="Campo di Calcio a 7" class="img-fluid w-100 mb-2 rounded">`;
                    } else {
                        immaginiHtml = `<img src="/Sito/Immagini/default-news.jpg" alt="Campo" class="img-fluid w-100 mb-2 rounded">`;
                    }
                    return `
                <section class="campo-prenotazione">
                    <div class="container py-5">
                        <div class="row align-items-center">
                            <div class="col-lg-5 col-md-6 mb-4 mb-md-0">
                                    <div class="campo-img position-relative overflow-hidden rounded-lg shadow-lg">
                                        ${immaginiHtml}
                                        <div class="campo-overlay d-flex align-items-center justify-content-center">
                                            <span class="badge bg-primary px-3 py-2 fs-6">${campo.attivo ? 'Disponibile' : 'Non disponibile'}</span>
                                        </div>
                                    </div>
                            </div>
                            <div class="col-lg-7 col-md-6">
                                <div class="campo-dettagli bg-light p-4 rounded-lg shadow-sm">
                                    <h2 class="campo-tipo fw-bold text-primary mb-3 overflow-hidden">${campo.nome || campo.tipo}</h2>
                                    <div class="campo-features mb-4">
                                        <div class="row g-3">
                                            <div class="col-6 col-md-4"><div class="feature-item d-flex align-items-center">
                                                <i class="bi bi-patch-check me-2 text-success"></i>
                                                <span>${campo.tipo_superficie ? campo.tipo_superficie : 'Erba sintetica'}</span>
                                            </div></div>
                                            <div class="col-6 col-md-4"><div class="feature-item d-flex align-items-center"><i class="bi bi-lightbulb me-2 text-warning"></i><span>${campo.illuminazione ? 'Illuminazione' : 'No illuminazione'}</span></div></div>
                                                    <div class="col-6 col-md-4"><div class="feature-item d-flex align-items-center"><i class="bi bi-droplet me-2 text-info"></i><span>${campo.Docce === 1 ? 'Docce' : 'No docce'}</span></div></div>
                                            <div class="col-6 col-md-4"><div class="feature-item d-flex align-items-center"><i class="bi bi-door-open me-2 text-secondary"></i><span>${campo.spogliatoi ? 'Spogliatoi' : 'No spogliatoi'}</span></div></div>
                                            <div class="col-6 col-md-4"><div class="feature-item d-flex align-items-center"><i class="bi bi-p-circle me-2 text-primary"></i><span>Parcheggio</span></div></div>
                                            <div class="col-6 col-md-4"><div class="feature-item d-flex align-items-center"><i class="bi bi-calendar3 me-2 text-danger"></i><span>Disponibilità</span></div></div>
                                        </div>
                                    </div>
                                    <p class="campo-descrizione mb-4">${campo.descrizione || 'Nessuna descrizione'}</p>
                                    <div class="d-flex flex-column flex-md-row gap-3 mt-4">
                                        <button class="btn btn-primary btn-outline-light rounded-pill px-4 py-2 btn-prenota d-flex align-items-center justify-content-center" data-campo-id="${campo.id}">
                                            <i class="bi bi-calendar-check me-2"></i>
                                            Prenota ora
                                        </button>
                                    </div>
                                    <div class="mt-4 d-flex align-items-center gap-3">
                                        <p class="mb-1"><strong>Orari disponibili per</strong></p>
                                        <form class="d-flex align-items-center ms-3" onsubmit="return false;" data-campo-id="${campo.id}">
                                            <input type="date" class="form-control form-control-sm input-orari-campo" value="${new Date().toISOString().slice(0,10)}" style="width:140px;" data-campo-id="${campo.id}">
                                        </form>
                                    </div>
                                    <div class="d-flex flex-wrap gap-2 mt-2" id="orariDisponibili-${campo.id}">
                                        ${this.orariDisponibili[campo.id] && this.orariDisponibili[campo.id].length > 0 ?
                                            this.orariDisponibili[campo.id]
                                                .filter(orario => {
                                                    // Mostra solo se non prenotato
                                                    if (typeof orario.prenotato !== 'undefined' && orario.prenotato) return false;
                                                    // Usa la data selezionata dall'utente
                                                    const inputData = document.querySelector(`.input-orari-campo[data-campo-id='${campo.id}']`)?.value || new Date().toISOString().slice(0,10);
                                                    const now = new Date();
                                                    // Costruisci la data locale
                                                    const [h, m] = orario.inizio.split(":");
                                                    const orarioDate = new Date(inputData + 'T' + orario.inizio);
                                                    // Se la data è oggi, nascondi orari entro 2 ore
                                                    if (inputData === now.toISOString().slice(0,10)) {
                                                        return (orarioDate.getTime() - now.getTime()) >= 2 * 60 * 60 * 1000;
                                                    }
                                                    return true;
                                                })
                                                .map(orario => `<span class="badge bg-success text-light border p-2">${orario.inizio}-${orario.fine}</span>`).join('')
                                            : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                `;
            }).join('');
        }
        this.page.innerHTML = html;
        this.addDisponibilitaFormListener();
    }

    addDisponibilitaFormListener() {
        const form = document.getElementById('formDisponibilita');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const campoId = document.getElementById('campoSelect').value;
            const data = document.getElementById('dataSelect').value;
            const res = await fetch(`/prenotazione/campi/${campoId}/disponibilita?data=${data}`);
            const orari = await res.json();
            const resultDiv = document.getElementById('disponibilitaResult');
            resultDiv.innerHTML = `<div class="card shadow-sm mt-3">
                <div class="card-body">
                    <h5 class="card-title mb-3">Disponibilità per il ${data}</h5>
                    ${orari.length > 0 ?
                        `<ul class="list-group list-group-flush">${orari.map(o => `<li class="list-group-item"><span class="badge bg-success me-2">${o.inizio} - ${o.fine}</span></li>`).join('')}</ul>`
                        : '<div class="alert alert-danger">Nessun orario disponibile per questa data.</div>'}
                </div>
            </div>`;
        });
    }

    addEventListeners() {
        this.page.querySelectorAll('.btn-prenota').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const campoId = btn.getAttribute('data-campo-id');
                this.openPrenotaModal(campoId);
            });
        });
        // Listener per le form orari accanto a ogni card
        setTimeout(() => {
            document.querySelectorAll('.btn-vedi-orari').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const campoId = btn.getAttribute('data-campo-id');
                    const form = btn.closest('form');
                    const data = form.querySelector('input[type="date"]').value;
                    const res = await fetch(`/prenotazione/campi/${campoId}/disponibilita?data=${data}`);
                    const orari = await res.json();
                    const now = new Date();
                    const resultDiv = document.getElementById(`orariDisponibili-${campoId}`);
                    resultDiv.innerHTML = orari.length > 0 ?
                        orari.filter(o => {
                            if (typeof o.prenotato !== 'undefined' && o.prenotato) return false;
                            // Usa la data selezionata
                            const [h, m] = o.inizio.split(":");
                            const orarioDate = new Date(data + 'T' + o.inizio);
                            if (data === now.toISOString().slice(0,10)) {
                                return (orarioDate.getTime() - now.getTime()) >= 2 * 60 * 60 * 1000;
                            }
                            return true;
                        }).map(o => `<span class="badge bg-success text-light border p-2">${o.inizio}-${o.fine}</span>`).join('')
                        : '';
                });
            });
        }, 0);

        // Listener per input data accanto a ogni card
        setTimeout(() => {
            document.querySelectorAll('.input-orari-campo').forEach(input => {
                input.addEventListener('change', async (e) => {
                    const campoId = input.getAttribute('data-campo-id');
                    const data = input.value;
                    const res = await fetch(`/prenotazione/campi/${campoId}/disponibilita?data=${data}`);
                    const orari = await res.json();
                    const now = new Date();
                    const resultDiv = document.getElementById(`orariDisponibili-${campoId}`);
                    resultDiv.innerHTML = orari.length > 0 ?
                        orari.filter(o => {
                            if (typeof o.prenotato !== 'undefined' && o.prenotato) return false;
                            // Usa la data selezionata
                            const [h, m] = o.inizio.split(":");
                            const orarioDate = new Date(data + 'T' + o.inizio);
                            if (data === now.toISOString().slice(0,10)) {
                                return (orarioDate.getTime() - now.getTime()) >= 2 * 60 * 60 * 1000;
                            }
                            return true;
                        }).map(o => `<span class="badge bg-success text-light border p-2">${o.inizio}-${o.fine}</span>`).join('')
                        : '';
                });
            });
        }, 0);
    }

    async openPrenotaModal(campoId) {
        const campo = this.campi.find(c => c.id == campoId);
        // Applica filtro anche agli orari passati al modal
        const now = new Date();
        // Recupera la data selezionata dall'input
        const inputData = document.querySelector(`.input-orari-campo[data-campo-id='${campoId}']`)?.value || new Date().toISOString().slice(0,10);
        const orari = (this.orariDisponibili[campoId] || []).filter(o => {
            if (typeof o.prenotato !== 'undefined' && o.prenotato) return false;
            const [h, m] = o.inizio.split(":");
            const orarioDate = new Date(inputData + 'T' + o.inizio);
            if (inputData === now.toISOString().slice(0,10)) {
                return (orarioDate.getTime() - now.getTime()) >= 2 * 60 * 60 * 1000;
            }
            return true;
        });
        // Import dinamico per evitare errori di bundle
        const { showModalPrenotazione } = await import('../utils/modalPrenotazione.js');
        showModalPrenotazione(campo, orari, async (datiPrenotazione) => {
            // Recupera utente loggato
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
            // Log per debug
            console.log('Utente loggato:', utenteId);
            // Esegui la chiamata POST per prenotare
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
                // Gestione robusta risposta
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
                    showModalshowModalSuccess('Prenotazione avvenuta con sucesso');
                    await this.fetchOrari();
                    this.render();
                    this.addEventListeners();
                } else {
                    showModal.showModalError(result.error || 'Errore nella prenotazione');
                }
            } catch (err) {
                showModalshowModalError('Errore di rete nella prenotazione');
            }
        });
    }
}

export default Prenotazione;