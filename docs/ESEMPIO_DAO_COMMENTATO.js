/**
 * @fileoverview Data Access Object per la gestione delle recensioni
 * @module features/recensioni/services/dao-recensioni
 * @description Fornisce metodi per operazioni CRUD sulle recensioni dei campi sportivi.
 * Gestisce creazione, lettura, aggiornamento e eliminazione recensioni,
 * inclusa la gestione degli autori e calcolo medie valutazioni.
 */

'use strict';

const db = require('../../../core/config/database');
const Recensione = require('../../../core/models/recensione');

// ==================== FACTORY FUNCTIONS ====================

/**
 * Crea un oggetto Recensione da una riga del database
 * 
 * @private
 * @param {Object} row - Riga dal risultato query database
 * @returns {Recensione} Oggetto Recensione instanziato
 */
const makeRecensione = (row) => {
    return new Recensione(
        row.id,
        row.utente_id,
        row.campo_id,
        row.valutazione,
        row.commento,
        row.data_recensione,
        row.created_at,
        row.updated_at
    );
};

// ==================== LETTURA ====================

/**
 * Recupera tutte le recensioni dal database
 * Include informazioni sull'autore (nome, cognome) tramite JOIN
 * 
 * @async
 * @function getAllRecensioni
 * @returns {Promise<Array<Object>>} Array di recensioni con dati autore
 * @throws {Error} Se errore nella query al database
 * 
 * @example
 * const recensioni = await getAllRecensioni();
 * // [{ id: 1, valutazione: 5, commento: "Ottimo campo", autore_nome: "Mario", ... }]
 */
exports.getAllRecensioni = async function() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT r.*, u.nome AS autore_nome, u.cognome AS autore_cognome, c.nome AS campo_nome
            FROM recensioni r
            LEFT JOIN UTENTI u ON r.utente_id = u.id
            LEFT JOIN campi c ON r.campo_id = c.id
            ORDER BY r.data_recensione DESC
        `;
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject({ error: 'Errore nel recupero recensioni: ' + err.message });
            } else {
                resolve(rows);
            }
        });
    });
};

/**
 * Recupera una singola recensione per ID
 * 
 * @async
 * @function getRecensioneById
 * @param {number} id - ID della recensione da recuperare
 * @returns {Promise<Object>} Oggetto recensione con dati autore e campo
 * @throws {Error} Se recensione non trovata o errore database
 * 
 * @example
 * const recensione = await getRecensioneById(5);
 * console.log(recensione.commento);
 */
exports.getRecensioneById = async function(id) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT r.*, u.nome AS autore_nome, u.cognome AS autore_cognome, c.nome AS campo_nome
            FROM recensioni r
            LEFT JOIN UTENTI u ON r.utente_id = u.id
            LEFT JOIN campi c ON r.campo_id = c.id
            WHERE r.id = ?
        `;
        
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject({ error: 'Errore nel recupero recensione: ' + err.message });
            } else if (!row) {
                reject({ error: 'Recensione non trovata' });
            } else {
                resolve(row);
            }
        });
    });
};

/**
 * Recupera tutte le recensioni per un campo specifico
 * Utile per mostrare le recensioni nella pagina dettaglio campo
 * 
 * @async
 * @function getRecensioniByC ampoId
 * @param {number} campoId - ID del campo
 * @returns {Promise<Array<Object>>} Array recensioni del campo con dati autori
 * @throws {Error} Se errore database
 */
exports.getRecensioniByC ampoId = async function(campoId) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT r.*, u.nome AS autore_nome, u.cognome AS autore_cognome
            FROM recensioni r
            LEFT JOIN UTENTI u ON r.utente_id = u.id
            WHERE r.campo_id = ?
            ORDER BY r.data_recensione DESC
        `;
        
        db.all(sql, [campoId], (err, rows) => {
            if (err) {
                reject({ error: 'Errore nel recupero recensioni campo: ' + err.message });
            } else {
                resolve(rows);
            }
        });
    });
};

/**
 * Calcola la valutazione media di un campo
 * Restituisce la media aritmetica di tutte le valutazioni e il conteggio
 * 
 * @async
 * @function getMediaValutazioneCampo
 * @param {number} campoId - ID del campo
 * @returns {Promise<Object>} Oggetto con media e count
 * @returns {number} returns.media - Media valutazioni (0 se nessuna recensione)
 * @returns {number} returns.count - Numero totale recensioni
 * @throws {Error} Se errore database
 * 
 * @example
 * const stats = await getMediaValutazioneCampo(3);
 * // { media: 4.5, count: 12 }
 */
exports.getMediaValutazioneCampo = async function(campoId) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                AVG(valutazione) as media,
                COUNT(*) as count
            FROM recensioni
            WHERE campo_id = ?
        `;
        
        db.get(sql, [campoId], (err, row) => {
            if (err) {
                reject({ error: 'Errore calcolo media: ' + err.message });
            } else {
                resolve({
                    media: row.media || 0,
                    count: row.count || 0
                });
            }
        });
    });
};

// ==================== CREAZIONE ====================

/**
 * Crea una nuova recensione
 * Valida che valutazione sia tra 1 e 5 e che utente non abbia già recensito il campo
 * 
 * @async
 * @function createRecensione
 * @param {Object} dati - Dati della recensione
 * @param {number} dati.utente_id - ID dell'utente che scrive la recensione
 * @param {number} dati.campo_id - ID del campo recensito
 * @param {number} dati.valutazione - Valutazione da 1 a 5
 * @param {string} dati.commento - Testo della recensione
 * @returns {Promise<Object>} Oggetto con id della recensione creata
 * @throws {Error} Se dati invalidi, recensione duplicata o errore database
 * 
 * @example
 * const result = await createRecensione({
 *   utente_id: 10,
 *   campo_id: 3,
 *   valutazione: 5,
 *   commento: "Campo eccellente, molto ben tenuto!"
 * });
 * console.log(result.id); // 45
 */
exports.createRecensione = async function(dati) {
    // Validazione input
    if (!dati.utente_id || !dati.campo_id || !dati.valutazione) {
        throw new Error('Dati incompleti: utente_id, campo_id e valutazione sono obbligatori');
    }
    
    // Valida range valutazione
    if (dati.valutazione < 1 || dati.valutazione > 5) {
        throw new Error('La valutazione deve essere tra 1 e 5');
    }
    
    return new Promise((resolve, reject) => {
        // Verifica che l'utente non abbia già recensito questo campo
        const checkSql = `
            SELECT id FROM recensioni 
            WHERE utente_id = ? AND campo_id = ?
        `;
        
        db.get(checkSql, [dati.utente_id, dati.campo_id], (err, existing) => {
            if (err) {
                return reject({ error: 'Errore verifica recensione: ' + err.message });
            }
            
            if (existing) {
                return reject({ error: 'Hai già recensito questo campo' });
            }
            
            // Crea la recensione
            const insertSql = `
                INSERT INTO recensioni (utente_id, campo_id, valutazione, commento, data_recensione)
                VALUES (?, ?, ?, ?, datetime('now'))
            `;
            
            db.run(insertSql, [
                dati.utente_id,
                dati.campo_id,
                dati.valutazione,
                dati.commento || ''
            ], function(err) {
                if (err) {
                    reject({ error: 'Errore creazione recensione: ' + err.message });
                } else {
                    resolve({ 
                        id: this.lastID, 
                        message: 'Recensione creata con successo' 
                    });
                }
            });
        });
    });
};

// ==================== AGGIORNAMENTO ====================

/**
 * Aggiorna una recensione esistente
 * L'utente può modificare valutazione e commento
 * 
 * @async
 * @function updateRecensione
 * @param {number} id - ID della recensione da aggiornare
 * @param {Object} dati - Nuovi dati
 * @param {number} [dati.valutazione] - Nuova valutazione (1-5)
 * @param {string} [dati.commento] - Nuovo commento
 * @returns {Promise<Object>} Messaggio di conferma
 * @throws {Error} Se recensione non trovata o errore database
 */
exports.updateRecensione = async function(id, dati) {
    // Valida valutazione se fornita
    if (dati.valutazione && (dati.valutazione < 1 || dati.valutazione > 5)) {
        throw new Error('La valutazione deve essere tra 1 e 5');
    }
    
    return new Promise((resolve, reject) => {
        // Costruisci query dinamica in base ai campi forniti
        let updates = [];
        let params = [];
        
        if (dati.valutazione !== undefined) {
            updates.push('valutazione = ?');
            params.push(dati.valutazione);
        }
        
        if (dati.commento !== undefined) {
            updates.push('commento = ?');
            params.push(dati.commento);
        }
        
        if (updates.length === 0) {
            return reject({ error: 'Nessun campo da aggiornare' });
        }
        
        updates.push('updated_at = datetime("now")');
        params.push(id);
        
        const sql = `UPDATE recensioni SET ${updates.join(', ')} WHERE id = ?`;
        
        db.run(sql, params, function(err) {
            if (err) {
                reject({ error: 'Errore aggiornamento recensione: ' + err.message });
            } else if (this.changes === 0) {
                reject({ error: 'Recensione non trovata' });
            } else {
                resolve({ message: 'Recensione aggiornata con successo' });
            }
        });
    });
};

// ==================== ELIMINAZIONE ====================

/**
 * Elimina una recensione
 * Verifica che l'utente sia autorizzato (autore o admin)
 * 
 * @async
 * @function deleteRecensione
 * @param {number} id - ID della recensione da eliminare
 * @param {number} [userId] - ID utente che richiede eliminazione (per verifica autorizzazione)
 * @returns {Promise<Object>} Messaggio di conferma
 * @throws {Error} Se recensione non trovata o non autorizzato
 */
exports.deleteRecensione = async function(id, userId) {
    return new Promise((resolve, reject) => {
        // Se fornito userId, verifica che sia l'autore
        if (userId) {
            const checkSql = 'SELECT utente_id FROM recensioni WHERE id = ?';
            
            db.get(checkSql, [id], (err, row) => {
                if (err) {
                    return reject({ error: 'Errore verifica recensione: ' + err.message });
                }
                
                if (!row) {
                    return reject({ error: 'Recensione non trovata' });
                }
                
                if (row.utente_id !== userId) {
                    return reject({ error: 'Non autorizzato a eliminare questa recensione' });
                }
                
                // Procedi con eliminazione
                performDelete();
            });
        } else {
            // Admin può eliminare senza verifica
            performDelete();
        }
        
        /**
         * Esegue l'eliminazione effettiva
         * @private
         */
        function performDelete() {
            const sql = 'DELETE FROM recensioni WHERE id = ?';
            
            db.run(sql, [id], function(err) {
                if (err) {
                    reject({ error: 'Errore eliminazione recensione: ' + err.message });
                } else if (this.changes === 0) {
                    reject({ error: 'Recensione non trovata' });
                } else {
                    resolve({ message: 'Recensione eliminata con successo' });
                }
            });
        }
    });
};

// ==================== UTILITY ====================

/**
 * Verifica se un utente ha già recensito un campo
 * 
 * @async
 * @function hasUserReviewedCampo
 * @param {number} utenteId - ID dell'utente
 * @param {number} campoId - ID del campo
 * @returns {Promise<boolean>} true se ha già recensito, false altrimenti
 * @throws {Error} Se errore database
 */
exports.hasUserReviewedCampo = async function(utenteId, campoId) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT id FROM recensioni WHERE utente_id = ? AND campo_id = ?';
        
        db.get(sql, [utenteId, campoId], (err, row) => {
            if (err) {
                reject({ error: 'Errore verifica recensione: ' + err.message });
            } else {
                resolve(!!row);
            }
        });
    });
};

/**
 * Recupera statistiche globali sulle recensioni
 * 
 * @async
 * @function getStatisticheRecensioni
 * @returns {Promise<Object>} Statistiche complete
 * @returns {number} returns.totale - Numero totale recensioni
 * @returns {number} returns.media_globale - Media valutazioni globale
 * @returns {Object} returns.per_valutazione - Conteggio per ogni valutazione (1-5)
 * @throws {Error} Se errore database
 */
exports.getStatisticheRecensioni = async function() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                COUNT(*) as totale,
                AVG(valutazione) as media_globale,
                SUM(CASE WHEN valutazione = 5 THEN 1 ELSE 0 END) as stelle_5,
                SUM(CASE WHEN valutazione = 4 THEN 1 ELSE 0 END) as stelle_4,
                SUM(CASE WHEN valutazione = 3 THEN 1 ELSE 0 END) as stelle_3,
                SUM(CASE WHEN valutazione = 2 THEN 1 ELSE 0 END) as stelle_2,
                SUM(CASE WHEN valutazione = 1 THEN 1 ELSE 0 END) as stelle_1
            FROM recensioni
        `;
        
        db.get(sql, [], (err, row) => {
            if (err) {
                reject({ error: 'Errore statistiche: ' + err.message });
            } else {
                resolve({
                    totale: row.totale || 0,
                    media_globale: row.media_globale || 0,
                    per_valutazione: {
                        5: row.stelle_5 || 0,
                        4: row.stelle_4 || 0,
                        3: row.stelle_3 || 0,
                        2: row.stelle_2 || 0,
                        1: row.stelle_1 || 0
                    }
                });
            }
        });
    });
};

// Export del modulo
module.exports = exports;
