'use strict';

class ScriviRecensione{
    constructor(page,loader){
        if(typeof(loader) ==='function') loader();
        this.page = page;
        this.init();
    }

    init(){
        this.render();
    }

    render(){
        // Container principale
        const container = document.createElement('div');
        container.className = 'recensione-form-container p-4';
        container.innerHTML = `
            <h2 class="mb-4 text-center">Scrivi una recensione</h2>
            <form id="recensioneForm" class="bg-light rounded shadow p-4">
                <div class="mb-3 text-center">
                    <label class="form-label fw-bold">Valutazione</label>
                    <div id="stelleValutazione" class="d-flex justify-content-center align-items-center gap-2 mb-2">
                        ${[1,2,3,4,5].map(i => `<i class="bi bi-star star-recensione" data-value="${i}" style="font-size:2rem; color:#ccc; cursor:pointer;"></i>`).join('')}
                    </div>
                </div>
                <div class="mb-3">
                    <label for="titoloRecensione" class="form-label">Titolo</label>
                    <input type="text" class="form-control" id="titoloRecensione" name="titolo" maxlength="60" required>
                </div>
                <div class="mb-3">
                    <label for="contenutoRecensione" class="form-label">Contenuto</label>
                    <textarea class="form-control" id="contenutoRecensione" name="contenuto" rows="4" maxlength="500" required></textarea>
                </div>
                <button type="submit" class="btn btn-primary w-100">Invia Recensione</button>
                <div id="recensioneMsg" class="mt-3"></div>
            </form>
        `;
        document.getElementById('page').innerHTML = '';
        document.getElementById('page').appendChild(container);

        // Gestione stelle
        const stelle = container.querySelectorAll('.star-recensione');
        let valutazione = 0;
        stelle.forEach(star => {
            star.addEventListener('mouseenter', () => {
                const val = parseInt(star.getAttribute('data-value'));
                stelle.forEach((s, i) => {
                    s.style.color = i < val ? '#ffc107' : '#ccc';
                });
            });
            star.addEventListener('mouseleave', () => {
                stelle.forEach((s, i) => {
                    s.style.color = i < valutazione ? '#ffc107' : '#ccc';
                });
            });
            star.addEventListener('click', () => {
                valutazione = parseInt(star.getAttribute('data-value'));
                stelle.forEach((s, i) => {
                    s.style.color = i < valutazione ? '#ffc107' : '#ccc';
                });
            });
        });

        // Gestione submit
        container.querySelector('#recensioneForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (valutazione === 0) {
                document.getElementById('recensioneMsg').innerHTML = '<div class="alert alert-warning">Seleziona una valutazione con le stelle!</div>';
                return;
            }
            const titolo = container.querySelector('#titoloRecensione').value.trim();
            const contenuto = container.querySelector('#contenutoRecensione').value.trim();
            // TODO: aggiungi entita_tipo ed entita_id in base al contesto
            const body = {
                valutazione,
                titolo,
                contenuto,
                entita_tipo: 'Campo', // esempio
                entita_id: 1 // esempio
            };
            const res = await fetch('/recensioni', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const result = await res.json();
            if (result.success) {
                document.getElementById('recensioneMsg').innerHTML = '<div class="alert alert-success">Recensione inviata con successo!</div>';
                container.querySelector('#recensioneForm').reset();
                valutazione = 0;
                stelle.forEach(s => s.style.color = '#ccc');
            } else {
                document.getElementById('recensioneMsg').innerHTML = `<div class="alert alert-danger">${result.error || 'Errore invio recensione.'}</div>`;
            }
        });
    }
}

export default ScriviRecensione;