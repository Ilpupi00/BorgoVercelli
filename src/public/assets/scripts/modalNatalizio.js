/**
 * Gestione del modal degli auguri natalizi
 * Mostra un messaggio di auguri una sola volta per ogni utente
 * Utilizza localStorage per tracciare se il modal è già stato mostrato
 */

(function() {
    'use strict';

    // Chiave per localStorage
    const STORAGE_KEY = 'christmas_modal_shown_2024';
    
    /**
     * Verifica se il modal è già stato mostrato
     * @returns {boolean} true se già mostrato, false altrimenti
     */
    function isModalAlreadyShown() {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'true';
        } catch (e) {
            console.warn('LocalStorage non accessibile:', e);
            // Se localStorage non è disponibile, usa sessionStorage come fallback
            try {
                return sessionStorage.getItem(STORAGE_KEY) === 'true';
            } catch (err) {
                console.warn('Anche sessionStorage non accessibile:', err);
                return false;
            }
        }
    }

    /**
     * Segna il modal come già mostrato
     */
    function markModalAsShown() {
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
        } catch (e) {
            console.warn('Impossibile salvare in localStorage:', e);
            // Fallback a sessionStorage
            try {
                sessionStorage.setItem(STORAGE_KEY, 'true');
            } catch (err) {
                console.warn('Impossibile salvare in sessionStorage:', err);
            }
        }
    }

    /**
     * Crea e mostra il modal natalizio
     */
    function showChristmasModal() {
        // Verifica se già mostrato
        if (isModalAlreadyShown()) {
            console.log('Modal natalizio già mostrato in precedenza');
            return;
        }

        // Crea l'HTML del modal
        const modalHTML = `
            <div class="modal fade" id="modalNatalizio" tabindex="-1" aria-labelledby="modalNatalizioLabel" aria-hidden="true" data-bs-backdrop="static">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="modalNatalizioLabel">
                                🎄 A.S.D. Borgo Vercelli 2022 🎄
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="snowflakes" aria-hidden="true">
                                <div class="snowflake" style="left: 10%; animation-duration: 3s; animation-delay: 0s;">❄️</div>
                                <div class="snowflake" style="left: 30%; animation-duration: 4s; animation-delay: 0.5s;">❄️</div>
                                <div class="snowflake" style="left: 50%; animation-duration: 3.5s; animation-delay: 1s;">❄️</div>
                                <div class="snowflake" style="left: 70%; animation-duration: 4.5s; animation-delay: 1.5s;">❄️</div>
                                <div class="snowflake" style="left: 90%; animation-duration: 3s; animation-delay: 2s;">❄️</div>
                            </div>
                            <span class="natale-icon">🎅🎁</span>
                            <p class="natale-greeting">Buon Natale e Buone Feste!</p>
                            <p class="natale-message">
                                A nome di tutta la A.S.D. Borgo Vercelli 2022, vi auguriamo un Natale sereno e pieno di gioia.<br>
                                Grazie per far parte della nostra comunità sportiva!
                            </p>
                            <p class="natale-submessage">
                                Ci vediamo in campo nel 2025! ⚽
                            </p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-natale" data-bs-dismiss="modal">
                                <i class="fas fa-heart me-2"></i>Grazie!
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Aggiungi il modal al DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);

        // Ottieni riferimento al modal
        const modalElement = document.getElementById('modalNatalizio');

        // Inizializza Bootstrap modal
        const bootstrapModal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: true
        });

        // Mostra il modal dopo un breve delay per effetto migliore
        setTimeout(() => {
            bootstrapModal.show();
        }, 800);

        // Segna come mostrato quando viene chiuso
        modalElement.addEventListener('hidden.bs.modal', function() {
            markModalAsShown();
            // Rimuovi il modal dal DOM dopo la chiusura
            setTimeout(() => {
                modalElement.remove();
            }, 300);
        });

        console.log('Modal natalizio mostrato con successo');
    }

    /**
     * Inizializza il sistema del modal natalizio
     */
    function init() {
        // Attendi che il DOM sia completamente caricato
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', showChristmasModal);
        } else {
            // DOM già caricato
            showChristmasModal();
        }
    }

    // Avvia l'inizializzazione
    init();

})();
