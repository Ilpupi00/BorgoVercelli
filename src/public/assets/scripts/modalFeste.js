/**
 * Sistema automatico di auguri per le feste italiane
 * Si aggiorna automaticamente ogni anno e mostra il modal appropriato in base alla data corrente
 * Mostra ogni festa una sola volta per anno usando localStorage
 */

(function() {
    'use strict';

    /**
     * Configurazione delle feste italiane
     * Ogni festa ha: nome, periodo, colori, icone e messaggi personalizzati
     */
    const FESTE_ITALIANE = {
        capodanno: {
            nome: 'Capodanno',
            check: (data) => data.getMonth() === 0 && data.getDate() === 1,
            periodo: '1 gennaio',
            colori: {
                primary: '#FFD700',
                secondary: '#FF6B6B',
                primaryDark: '#FFA500',
                secondaryDark: '#FF1744'
            },
            icone: {
                principale: '🎉🥂',
                decorazione1: '🎊',
                decorazione2: '🍾',
                decorazioni: ['🎉', '🎊', '✨', '🎆', '🥳']
            },
            titolo: '🎊 A.S.D. Borgo Vercelli 2022 🎊',
            saluto: 'Buon Anno!',
            messaggio: 'Ti auguriamo un fantastico {anno} pieno di gol, vittorie e soddisfazioni sportive!<br>Che questo nuovo anno porti successi a te e alla nostra società!',
            chiusura: 'Ci vediamo in campo! ⚽'
        },
        epifania: {
            nome: 'Epifania',
            check: (data) => data.getMonth() === 0 && data.getDate() === 6,
            periodo: '6 gennaio',
            colori: {
                primary: '#9C27B0',
                secondary: '#E91E63',
                primaryDark: '#BA68C8',
                secondaryDark: '#F48FB1'
            },
            icone: {
                principale: '🧙‍♀️🎁',
                decorazione1: '⭐',
                decorazione2: '🧦',
                decorazioni: ['⭐', '🌟', '🎁', '🧦', '✨']
            },
            titolo: '⭐ A.S.D. Borgo Vercelli 2022 ⭐',
            saluto: 'Buona Epifania!',
            messaggio: 'La Befana porta dolci a chi è stato bravo...<br>e voi siete stati fantastici! Grazie per far parte della nostra famiglia sportiva!',
            chiusura: 'Ci vediamo in campo! ⚽'
        },
        carnevale: {
            nome: 'Carnevale',
            check: (data) => {
                const pasqua = calcolaPasqua(data.getFullYear());
                const carnevale = new Date(pasqua);
                carnevale.setDate(carnevale.getDate() - 47);
                const inizioCarnevale = new Date(carnevale);
                inizioCarnevale.setDate(inizioCarnevale.getDate() - 7);
                return data >= inizioCarnevale && data <= carnevale;
            },
            periodo: 'Periodo del Carnevale',
            colori: {
                primary: '#FF6B6B',
                secondary: '#4ECDC4',
                primaryDark: '#FF8E53',
                secondaryDark: '#95E1D3'
            },
            icone: {
                principale: '🎭🎉',
                decorazione1: '🎪',
                decorazione2: '🎨',
                decorazioni: ['🎭', '🎪', '🎨', '🎉', '🎊']
            },
            titolo: '🎭 A.S.D. Borgo Vercelli 2022 🎭',
            saluto: 'Buon Carnevale!',
            messaggio: 'Ogni scherzo vale! Divertiti e festeggia con allegria!<br>La nostra società ti augura un Carnevale pieno di gioia e colori!',
            chiusura: 'Ci vediamo in campo! ⚽'
        },
        pasqua: {
            nome: 'Pasqua',
            check: (data) => {
                const pasqua = calcolaPasqua(data.getFullYear());
                const inizioPeriodo = new Date(pasqua);
                inizioPeriodo.setDate(inizioPeriodo.getDate() - 3);
                const finePeriodo = new Date(pasqua);
                finePeriodo.setDate(finePeriodo.getDate() + 1); // Pasquetta
                return data >= inizioPeriodo && data <= finePeriodo;
            },
            periodo: 'Periodo di Pasqua',
            colori: {
                primary: '#9CCC65',
                secondary: '#FFEB3B',
                primaryDark: '#AED581',
                secondaryDark: '#FFF176'
            },
            icone: {
                principale: '🐰🥚',
                decorazione1: '🌸',
                decorazione2: '🐣',
                decorazioni: ['🐰', '🥚', '🐣', '🌸', '🌼']
            },
            titolo: '🐰 A.S.D. Borgo Vercelli 2022 🐰',
            saluto: 'Buona Pasqua!',
            messaggio: 'Ti auguriamo una Pasqua serena e piena di gioia insieme ai tuoi cari!<br>Che questa festività porti rinnovata energia per tornare in campo!',
            chiusura: 'Ci vediamo in campo! ⚽'
        },
        liberazione: {
            nome: 'Festa della Liberazione',
            check: (data) => data.getMonth() === 3 && data.getDate() === 25,
            periodo: '25 aprile',
            colori: {
                primary: '#009246',
                secondary: '#CE2B37',
                primaryDark: '#4CAF50',
                secondaryDark: '#F44336'
            },
            icone: {
                principale: '🇮🇹🕊️',
                decorazione1: '⭐',
                decorazione2: '🏛️',
                decorazioni: ['🇮🇹', '🕊️', '⭐', '🏛️', '💚']
            },
            titolo: '🇮🇹 A.S.D. Borgo Vercelli 2022 🇮🇹',
            saluto: '25 Aprile - Festa della Liberazione',
            messaggio: 'Ricordiamo con gratitudine chi ha lottato per la nostra libertà.<br>Buon 25 Aprile a tutta la nostra comunità sportiva!',
            chiusura: 'Viva l\'Italia! ⚽'
        },
        lavoratori: {
            nome: 'Festa dei Lavoratori',
            check: (data) => data.getMonth() === 4 && data.getDate() === 1,
            periodo: '1 maggio',
            colori: {
                primary: '#E53935',
                secondary: '#FDD835',
                primaryDark: '#EF5350',
                secondaryDark: '#FFEE58'
            },
            icone: {
                principale: '🛠️💪',
                decorazione1: '⚙️',
                decorazione2: '🏭',
                decorazioni: ['🛠️', '💪', '⚙️', '🌹', '🏭']
            },
            titolo: '💪 A.S.D. Borgo Vercelli 2022 💪',
            saluto: 'Buon 1° Maggio!',
            messaggio: 'Auguri a tutti i lavoratori che ogni giorno si impegnano con dedizione!<br>La nostra società celebra il valore del lavoro e dell\'impegno!',
            chiusura: 'Ci vediamo in campo! ⚽'
        },
        repubblica: {
            nome: 'Festa della Repubblica',
            check: (data) => data.getMonth() === 5 && data.getDate() === 2,
            periodo: '2 giugno',
            colori: {
                primary: '#009246',
                secondary: '#CE2B37',
                primaryDark: '#4CAF50',
                secondaryDark: '#F44336'
            },
            icone: {
                principale: '🇮🇹🎊',
                decorazione1: '⭐',
                decorazione2: '🏛️',
                decorazioni: ['🇮🇹', '⭐', '🎊', '🏛️', '💚']
            },
            titolo: '🇮🇹 A.S.D. Borgo Vercelli 2022 🇮🇹',
            saluto: 'Buona Festa della Repubblica!',
            messaggio: 'Celebriamo insieme i valori della nostra Repubblica!<br>Auguri a tutta la comunità sportiva italiana!',
            chiusura: 'Viva l\'Italia! ⚽'
        },
        ferragosto: {
            nome: 'Ferragosto',
            check: (data) => data.getMonth() === 7 && data.getDate() >= 13 && data.getDate() <= 16,
            periodo: '15 agosto',
            colori: {
                primary: '#FF9800',
                secondary: '#03A9F4',
                primaryDark: '#FFB74D',
                secondaryDark: '#4FC3F7'
            },
            icone: {
                principale: '☀️🏖️',
                decorazione1: '🌊',
                decorazione2: '🍉',
                decorazioni: ['☀️', '🏖️', '🌊', '🍉', '😎']
            },
            titolo: '☀️ A.S.D. Borgo Vercelli 2022 ☀️',
            saluto: 'Buon Ferragosto!',
            messaggio: 'Ti auguriamo un Ferragosto ricco di sole, mare e relax!<br>Goditi le vacanze estive e ricarica le energie per la nuova stagione!',
            chiusura: 'Ci vediamo in campo! ⚽'
        },
        ognissanti: {
            nome: 'Ognissanti',
            check: (data) => data.getMonth() === 10 && data.getDate() === 1,
            periodo: '1 novembre',
            colori: {
                primary: '#7E57C2',
                secondary: '#FFB74D',
                primaryDark: '#9575CD',
                secondaryDark: '#FFCC80'
            },
            icone: {
                principale: '🕯️🌹',
                decorazione1: '⭐',
                decorazione2: '🙏',
                decorazioni: ['🕯️', '🌹', '⭐', '🙏', '💐']
            },
            titolo: '🕯️ A.S.D. Borgo Vercelli 2022 🕯️',
            saluto: 'Buona Festa di Ognissanti',
            messaggio: 'Un momento di riflessione e ricordo per chi non c\'è più.<br>La nostra società è vicina a tutti in questo giorno speciale.',
            chiusura: 'Ci vediamo in campo! ⚽'
        },
        immacolata: {
            nome: 'Immacolata Concezione',
            check: (data) => data.getMonth() === 11 && data.getDate() === 8,
            periodo: '8 dicembre',
            colori: {
                primary: '#2196F3',
                secondary: '#FFFFFF',
                primaryDark: '#64B5F6',
                secondaryDark: '#E3F2FD'
            },
            icone: {
                principale: '⭐🕊️',
                decorazione1: '🌟',
                decorazione2: '✨',
                decorazioni: ['⭐', '🕊️', '🌟', '✨', '💫']
            },
            titolo: '⭐ A.S.D. Borgo Vercelli 2022 ⭐',
            saluto: 'Buona Festa dell\'Immacolata!',
            messaggio: 'Auguri per questa festa speciale che segna l\'inizio del periodo natalizio!<br>La nostra società ti augura serenità e gioia!',
            chiusura: 'Ci vediamo in campo! ⚽'
        },
        natale: {
            nome: 'Natale',
            check: (data) => data.getMonth() === 11 && data.getDate() >= 1,
            periodo: 'Periodo Natalizio',
            colori: {
                primary: '#c41e3a',
                secondary: '#165b33',
                primaryDark: '#ff6b6b',
                secondaryDark: '#4ecdc4'
            },
            icone: {
                principale: '🎅🎁',
                decorazione1: '❄️',
                decorazione2: '🎄',
                decorazioni: ['❄️', '🎄', '⛄', '🎁', '⭐']
            },
            titolo: '🎄 A.S.D. Borgo Vercelli 2022 🎄',
            saluto: 'Buon Natale e Buone Feste!',
            messaggio: 'A nome di tutta la A.S.D. Borgo Vercelli 2022, vi auguriamo un Natale sereno e pieno di gioia.<br>Grazie per far parte della nostra comunità sportiva!',
            chiusura: 'Ci vediamo in campo nel {anno_prossimo}! ⚽'
        }
    };

    /**
     * Calcola la data della Pasqua per un dato anno usando l'algoritmo di Meeus/Jones/Butcher
     * @param {number} anno - Anno per cui calcolare la Pasqua
     * @returns {Date} Data della domenica di Pasqua
     */
    function calcolaPasqua(anno) {
        const a = anno % 19;
        const b = Math.floor(anno / 100);
        const c = anno % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const mese = Math.floor((h + l - 7 * m + 114) / 31);
        const giorno = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(anno, mese - 1, giorno);
    }

    /**
     * Trova la festa corrente in base alla data
     * @param {Date} data - Data da controllare
     * @returns {Object|null} Oggetto festa o null se nessuna festa corrente
     */
    function trovaFestaCorrente(data) {
        for (const [key, festa] of Object.entries(FESTE_ITALIANE)) {
            if (festa.check(data)) {
                return { key, ...festa };
            }
        }
        return null;
    }

    /**
     * Verifica se il modal per questa festa è già stato mostrato quest'anno
     * @param {string} festaKey - Chiave identificativa della festa
     * @param {number} anno - Anno corrente
     * @returns {boolean} true se già mostrato, false altrimenti
     */
    function isFestaGiaMostrata(festaKey, anno) {
        const storageKey = `festa_${festaKey}_${anno}`;
        try {
            return localStorage.getItem(storageKey) === 'true';
        } catch (e) {
            console.warn('LocalStorage non accessibile:', e);
            try {
                return sessionStorage.getItem(storageKey) === 'true';
            } catch (err) {
                console.warn('Anche sessionStorage non accessibile:', err);
                return false;
            }
        }
    }

    /**
     * Segna la festa come già mostrata per quest'anno
     * @param {string} festaKey - Chiave identificativa della festa
     * @param {number} anno - Anno corrente
     */
    function segnaFestaMostrata(festaKey, anno) {
        const storageKey = `festa_${festaKey}_${anno}`;
        try {
            localStorage.setItem(storageKey, 'true');
        } catch (e) {
            console.warn('Impossibile salvare in localStorage:', e);
            try {
                sessionStorage.setItem(storageKey, 'true');
            } catch (err) {
                console.warn('Impossibile salvare in sessionStorage:', err);
            }
        }
    }

    /**
     * Applica i colori della festa al modal usando variabili CSS
     * @param {HTMLElement} modalElement - Elemento del modal
     * @param {Object} colori - Oggetto colori della festa
     */
    function applicaColori(modalElement, colori) {
        const style = modalElement.style;
        style.setProperty('--festa-color-primary', colori.primary);
        style.setProperty('--festa-color-secondary', colori.secondary);
        style.setProperty('--festa-color-primary-dark', colori.primaryDark);
        style.setProperty('--festa-color-secondary-dark', colori.secondaryDark);
    }

    /**
     * Crea e mostra il modal per la festa corrente
     */
    function mostraModalFesta() {
        const oggi = new Date();
        const anno = oggi.getFullYear();
        const annoProssimo = anno + 1;
        
        // Trova la festa corrente
        const festaCorrente = trovaFestaCorrente(oggi);
        
        if (!festaCorrente) {
            console.log('Nessuna festa italiana in corso oggi');
            return;
        }

        // Verifica se già mostrato
        if (isFestaGiaMostrata(festaCorrente.key, anno)) {
            console.log(`Modal per ${festaCorrente.nome} ${anno} già mostrato`);
            return;
        }

        // Prepara i messaggi sostituendo i placeholder
        const messaggio = festaCorrente.messaggio
            .replace('{anno}', anno)
            .replace('{anno_prossimo}', annoProssimo);
        const chiusura = festaCorrente.chiusura
            .replace('{anno}', anno)
            .replace('{anno_prossimo}', annoProssimo);

        // Crea decorazioni dinamiche
        const decorazioniHTML = festaCorrente.icone.decorazioni
            .map((icona, index) => {
                const left = 10 + (index * 20);
                const duration = 3 + Math.random() * 2;
                const delay = index * 0.5;
                return `<div class="decoration-item" style="left: ${left}%; animation-duration: ${duration}s; animation-delay: ${delay}s;">${icona}</div>`;
            })
            .join('');

        // Crea l'HTML del modal
        const modalHTML = `
            <div class="modal fade" id="modalFeste" tabindex="-1" aria-labelledby="modalFesteLabel" aria-hidden="true" data-bs-backdrop="static">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="modalFesteLabel">
                                ${festaCorrente.titolo}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="decorations" aria-hidden="true">
                                ${decorazioniHTML}
                            </div>
                            <span class="festa-icon">${festaCorrente.icone.principale}</span>
                            <p class="festa-greeting">${festaCorrente.saluto}</p>
                            <p class="festa-message">${messaggio}</p>
                            <p class="festa-submessage">${chiusura}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-festa" data-bs-dismiss="modal">
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
        const modalElement = document.getElementById('modalFeste');

        // Applica i colori della festa
        applicaColori(modalElement, festaCorrente.colori);

        // Inizializza Bootstrap modal
        const bootstrapModal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: true
        });

        // Mostra il modal dopo un breve delay
        setTimeout(() => {
            bootstrapModal.show();
        }, 1000);

        // Segna come mostrato quando viene chiuso
        modalElement.addEventListener('hidden.bs.modal', function() {
            segnaFestaMostrata(festaCorrente.key, anno);
            setTimeout(() => {
                modalElement.remove();
            }, 300);
        });

        console.log(`Modal per ${festaCorrente.nome} ${anno} mostrato con successo`);
    }

    /**
     * Inizializza il sistema dei modal delle feste
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', mostraModalFesta);
        } else {
            mostraModalFesta();
        }
    }

    // Avvia l'inizializzazione
    init();

})();
