/**
 * @fileoverview Data Access Object per la gestione delle prenotazioni campi
 * @module features/prenotazioni/services/dao-prenotazione
 * @description Fornisce metodi per creare, leggere, aggiornare ed eliminare prenotazioni.
 * Gestisce anche la disponibilità dei campi, orari, e stati delle prenotazioni
 * (in attesa, accettata, rifiutata, scaduta).
 */

'use strict';

const db = require('../../../core/config/database');
// Wrapper di compatibilità: alcune parti del codice chiamavano nomi vecchi
// Esponiamo comunque funzioni con quei nomi per evitare regressioni.
exports.confermaPrenotazione = async (id) => {
    return exports.updateStatoPrenotazione(id, 'confermata');
};

exports.deletePrenotazioneById = async (id) => {
    return exports.deletePrenotazione(id);
};

const Campo = require('../../../core/models/campo.js');
const Immagine = require('../../../core/models/immagine.js');
const Prenotazione = require('../../../core/models/prenotazione.js');

// ==================== FACTORY FUNCTIONS ====================

/**
 * Crea un oggetto Campo da una riga del database
 * @param {Object} row - Riga dal database
 * @returns {Campo} Oggetto Campo instanziato
 */
const makeCampo = (row) => {
       return new Campo(
	       row.id,
	       row.nome,
	       row.indirizzo,
	       row.tipo_superficie,
	       row.dimensioni,
	       row.illuminazione,
	       row.coperto,
	       row.spogliatoi,
	       row.capienza_pubblico,
	       row.attivo,
	       row.created_at,
	       row.updated_at,
	       row.descrizione,
	       row.docce
       );
}

/**
 * Factory: crea un'istanza di Prenotazione da una riga DB
 * @param {Object} row - Riga del DB contenente campi della prenotazione
 * @returns {Prenotazione}
 */
const makePrenotazione = (row) => {
    return new Prenotazione(
        row.id,
        row.campo_id,
        row.utente_id,
        row.squadra_id,
        row.data_prenotazione,
        row.ora_inizio,
        row.ora_fine,
        row.tipo_attivita,
        row.note,
        row.stato,
        row.created_at,
        row.updated_at
    );
}

/**
 * Factory: crea un'istanza di Immagine da una riga DB
 * @param {Object} row - Riga del DB contenente i campi immagine
 * @returns {Immagine}
 */
const makeImmagini = (row) => {
    return new Immagine(
        row.id,
        row.descrizione,
        row.url,
        row.tipo,
        row.entita_riferimento,
        row.entita_id,
        row.ordine,
        row.created_at,
        row.updated_at
    );
}

const normalizeDate = (dateStr) => {
    // Accetta sia Date che stringa, restituisce YYYY-MM-DD
    if (!dateStr) return '';
    if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0,10);
};

exports.getCampiAttivi = async () =>{
    return new Promise((resolve, reject) => {
    db.all('SELECT * FROM CAMPI WHERE attivo = true', [], async (err, rows) => {
		       if (err) return reject(err);
		       // Per ogni campo, recupera le immagini associate
		       const campi = await Promise.all(rows.map(async (row) => {
			       const campo = makeCampo(row);
			       // Query immagini associate al campo
			       return new Promise((resImg, rejImg) => {
				       db.all('SELECT * FROM IMMAGINI WHERE entita_id = ? AND tipo = ?', [row.id, 'Campo'], (errImg, imgRows) => {
					       	if (errImg) {
						       	campo.immagini = [];
						       	return resImg(campo); // Se errore, restituisci solo il campo
					       	}
					       	campo.immagini = Array.isArray(imgRows) ? imgRows.map(makeImmagini) : [];
					       	resImg(campo);
				       });
			       });
		       }));
		       resolve(campi);
	       });
       });
}



/**
 * Restituisce gli orari disponibili per un campo in una data specifica
 * Filtra orari basandosi su orari base del campo e prenotazioni esistenti.
 * Se la data richiesta è oggi, rimuove slot nelle prossime 2 ore.
 *
 * @async
 * @param {number} campoId - ID del campo
 * @param {string|Date} data - Data richiesta (YYYY-MM-DD o Date)
 * @returns {Promise<Array<Object>>} Array di oggetti { inizio, fine } rappresentanti gli slot disponibili
 * @throws {Error} In caso di errore DB
 */
// Restituisce orari disponibili per un campo in una data
exports.getDisponibilitaCampo=async (campoId, data) => {
    const dataNorm = normalizeDate(data);
    // Ottieni il giorno della settimana (0 = Domenica, 1 = Lunedì, ..., 6 = Sabato)
    const dateObj = new Date(dataNorm + 'T00:00:00');
    const giornoSettimana = dateObj.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab

    // Ottieni orari disponibili per questo campo e giorno
    const orariCampo = await new Promise((resolve, reject) => {
        const sql = `
            SELECT ora_inizio, ora_fine 
            FROM ORARI_CAMPI 
            WHERE campo_id = ? AND attivo = true 
            AND (giorno_settimana = ? OR giorno_settimana IS NULL)
            ORDER BY ora_inizio
        `;
        db.all(sql, [campoId, giornoSettimana], (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
        });
    });

    let orariDisponibili = orariCampo.map(o => ({ inizio: o.ora_inizio, fine: o.ora_fine }));

    // LOGICA: se la data è oggi, mostra solo orari almeno 2 ore dopo ora attuale
    const now = new Date();
    if (dataNorm === now.toISOString().slice(0,10)) {
        orariDisponibili = orariDisponibili.filter(o => {
            const [h, m] = o.inizio.split(":");
            // Costruisci la data locale con la data richiesta
            const orarioDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(h), parseInt(m));
            return (orarioDate.getTime() - now.getTime()) >= 2 * 60 * 60 * 1000;
        });
    }
    // Se la data richiesta non è oggi, confrontiamo solo la data (string) per evitare
    // problemi dovuti al fuso orario / orari locali. Se la data richiesta è nel passato
    // non mostriamo disponibilità.
    const todayStr = now.toISOString().slice(0,10);
    if (dataNorm !== todayStr) {
        if (dataNorm < todayStr) {
            orariDisponibili = [];
        }
    }

    return new Promise((resolve,reject)=>{
        // Esegui la query usando placeholder (il wrapper converte ? in $1 ecc.)
        const prenSql = `SELECT * FROM PRENOTAZIONI WHERE campo_id = ? AND data_prenotazione = ?`;
        db.all(prenSql, [campoId, dataNorm], (err, rows) => {
            if (err) return reject(err);
            const prenotazioni = rows.map(makePrenotazione);
            const orariOccupati = prenotazioni.map(p => ({ inizio: p.ora_inizio, fine: p.ora_fine }));
            function toMin(ora) {
                const [h, m] = ora.split(":").map(Number);
                return h * 60 + m;
            }
            const disponibili = orariDisponibili.filter(o => {
                const inizioP = toMin(o.inizio);
                const fineP = toMin(o.fine);
                return !orariOccupati.some(oo => {
                    const inizioO = toMin(oo.inizio);
                    const fineO = toMin(oo.fine);
                    return inizioP < fineO && fineP > inizioO;
                });
            });
            console.log('[PRENOTAZIONE] Query:', prenSql, [campoId, dataNorm]);
            console.log('[PRENOTAZIONE] Prenotazioni trovate:', prenotazioni);
            console.log('[PRENOTAZIONE] Orari disponibili:', disponibili);
            resolve(disponibili);
        });
    });
}

/**
 * Crea una nuova prenotazione per un campo se lo slot è libero
 * Inserisce la prenotazione con stato iniziale 'in_attesa'.
 *
 * @async
 * @param {Object} params - Oggetto con i dati della prenotazione
 * @param {number} params.campo_id
 * @param {number|null} [params.utente_id]
 * @param {number|null} [params.squadra_id]
 * @param {string|Date} params.data_prenotazione
 * @param {string} params.ora_inizio - formato HH:mm
 * @param {string} params.ora_fine - formato HH:mm
 * @param {string|null} [params.tipo_attivita]
 * @param {string|null} [params.note]
 * @returns {Promise<Object>} { success: true, id } oppure { error: '...' }
 * @throws {Error} In caso di errore DB
 */
// Prenota un campo
exports.prenotaCampo = async ({ campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note }) => {
    const dataNorm = normalizeDate(data_prenotazione);
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM PRENOTAZIONI WHERE campo_id = ? AND data_prenotazione = ? AND ora_inizio = ? AND ora_fine = ?`, [campo_id, dataNorm, ora_inizio, ora_fine], (err, row) => {
            if (err) return reject(err);
            if (row) return resolve({ error: 'Orario già prenotato' });
            // Nuove prenotazioni iniziano con stato 'in_attesa' e devono essere accettate dall'admin
            db.run(`INSERT INTO PRENOTAZIONI (campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note, stato, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_attesa', NOW(), NOW()) RETURNING id`,
                [campo_id, utente_id || null, squadra_id || null, dataNorm, ora_inizio, ora_fine, tipo_attivita || null, note || null], function (err, result) {
                    if (err) return reject(err);
                    resolve({ success: true, id: result.rows[0].id });
                }
            );
        });
    });
}

/**
 * Recupera tutte le prenotazioni con dati correlati (campo, utente, squadra)
 * Ordinamento: data_prenotazione desc, ora_inizio desc
 *
 * @async
 * @returns {Promise<Array<Object>>} Array di prenotazioni
 * @throws {Object} { error: '...' } in caso di errore
 */
exports.getAllPrenotazioni = async () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT p.*, 
                   c.nome as campo_nome,
                   u.nome as utente_nome, u.cognome as utente_cognome,
                   s.nome as squadra_nome
            FROM PRENOTAZIONI p
            LEFT JOIN CAMPI c ON p.campo_id = c.id
            LEFT JOIN UTENTI u ON p.utente_id = u.id
            LEFT JOIN SQUADRE s ON p.squadra_id = s.id
            ORDER BY p.data_prenotazione DESC, p.ora_inizio DESC
        `;
        db.all(sql, [], (err, prenotazioni) => {
            if (err) {
                return reject({ error: 'Error retrieving prenotazioni: ' + err.message });
            }
            resolve(prenotazioni || []);
        });
    });
}

/**
 * Recupera una prenotazione per ID (inclusi campo, utente, squadra)
 * @async
 * @param {number} id - ID della prenotazione
 * @returns {Promise<Object|null>} Prenotazione o null se non trovata
 * @throws {Object} { error: '...' } in caso di errore
 */
exports.getPrenotazioneById = async (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT p.*, 
                   c.nome as campo_nome,
                   u.nome as utente_nome, u.cognome as utente_cognome,
                   s.nome as squadra_nome
            FROM PRENOTAZIONI p
            LEFT JOIN CAMPI c ON p.campo_id = c.id
            LEFT JOIN UTENTI u ON p.utente_id = u.id
            LEFT JOIN SQUADRE s ON p.squadra_id = s.id
            WHERE p.id = ?
        `;
        db.get(sql, [id], (err, row) => {
            if (err) {
                return reject({ error: 'Error retrieving prenotazione: ' + err.message });
            }
            resolve(row);
        });
    });
}

/**
 * Aggiorna lo stato di una prenotazione (es: in_attesa, confermata, rifiutata, scaduta)
 * @async
 * @param {number} id - ID della prenotazione
 * @param {string} stato - Nuovo stato
 * @returns {Promise<Object>} { success: true, changes }
 * @throws {Error} In caso di errore DB
 */
exports.updateStatoPrenotazione = async (id, stato) => {
    return new Promise((resolve, reject) => {
        console.log(`[DAO] updateStatoPrenotazione: id=${id}, stato=${stato}`);
        db.run(`UPDATE PRENOTAZIONI SET stato = ?, updated_at = NOW() WHERE id = ?`, [stato, id], function (err, result) {
            if (err) {
                console.error('[DAO] updateStatoPrenotazione: error', err);
                return reject(err);
            }
            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            console.log(`[DAO] updateStatoPrenotazione: changes=${changes}`);
            resolve({ success: true, changes });
        });
    });
}

/**
 * Aggiorna i dettagli di una prenotazione esistente
 * @async
 * @param {number} id - ID della prenotazione
 * @param {Object} data - Campi aggiornati
 * @returns {Promise<Object>} { success: true, changes }
 * @throws {Error} In caso di errore DB
 */
exports.updatePrenotazione = async (id, { campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note }) => {
    const dataNorm = normalizeDate(data_prenotazione);
    return new Promise((resolve, reject) => {
        db.run(`UPDATE PRENOTAZIONI SET campo_id = ?, utente_id = ?, squadra_id = ?, data_prenotazione = ?, ora_inizio = ?, ora_fine = ?, tipo_attivita = ?, note = ?, updated_at = NOW() WHERE id = ?`,
            [campo_id, utente_id || null, squadra_id || null, dataNorm, ora_inizio, ora_fine, tipo_attivita || null, note || null, id], function (err, result) {
                if (err) return reject(err);
                const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
                resolve({ success: true, changes });
            });
    });
}

/**
 * Elimina una prenotazione per ID
 * @async
 * @param {number} id - ID della prenotazione
 * @returns {Promise<Object>} { success: true, changes }
 * @throws {Error} In caso di errore DB
 */
exports.deletePrenotazione = async (id) => {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM PRENOTAZIONI WHERE id = ?`, [id], function (err, result) {
            if (err) return reject(err);
            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            resolve({ success: true, changes });
        });
    });
}

/**
 * Marca come 'scaduta' le prenotazioni confermate la cui data+ora fine è passata
 * Utilizza confronti datetime lato SQLite per evitare problemi di timezone
 * @async
 * @returns {Promise<Object>} { success: true, updated }
 * @throws {Error} In caso di errore DB
 */
exports.checkAndUpdateScadute = async () => {
    // Use SQLite datetime comparison to avoid timezone/format issues and be
    // tolerant to small variations in the stored `stato` (trim + lowercase).
    // Build a datetime string from data_prenotazione and ora_fine (add seconds
    // if missing) and compare with the current DB datetime.
    return new Promise((resolve, reject) => {
        // In Postgres build a timestamp by adding the date and the time and compare to NOW()
        const updateSql = `
            UPDATE PRENOTAZIONI
            SET stato = 'scaduta', updated_at = NOW()
            WHERE lower(trim(coalesce(stato, ''))) = 'confermata'
              AND (data_prenotazione::timestamp + (COALESCE(ora_fine, '00:00')::time)) <= NOW()
        `;

        // Log current state before update
        db.get(`SELECT COUNT(*) as cnt FROM PRENOTAZIONI WHERE lower(trim(coalesce(stato, ''))) = 'confermata' AND (data_prenotazione::timestamp + (COALESCE(ora_fine, '00:00')::time)) <= NOW()`, [], (errBefore, rowBefore) => {
            const beforeCount = (rowBefore && rowBefore.cnt) || 0;
            console.error(`[DAO:${process.pid}] checkAndUpdateScadute - will update approx ${beforeCount} rows`);

            db.run(updateSql, [], function (err, result) {
                if (err) {
                    console.error(`[DAO:${process.pid}] checkAndUpdateScadute - ERROR:`, err);
                    return reject(err);
                }
                const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
                console.error(`[DAO:${process.pid}] checkAndUpdateScadute - updated ${changes} rows`);
                resolve({ success: true, updated: changes });
            });
        });
    });
}

/**
 * Elimina dal DB le prenotazioni con stato 'scaduta'
 * Effettua log dei conteggi prima e dopo l'operazione
 * @async
 * @returns {Promise<Object>} { success: true, deleted, changes }
 * @throws {Error} In caso di errore DB
 */
exports.deleteScadute = async () => {
    return new Promise((resolve, reject) => {
        // Log count before delete
        db.get(`SELECT COUNT(*) as cnt FROM PRENOTAZIONI WHERE stato = 'scaduta'`, [], (errBefore, rowBefore) => {
            const before = (rowBefore && rowBefore.cnt) || 0;
            console.error(`[DAO:${process.pid}] deleteScadute - count before delete: ${before}`);

            db.run(`DELETE FROM PRENOTAZIONI WHERE stato = 'scaduta'`, function (err, result) {
                if (err) {
                    console.error(`[DAO:${process.pid}] deleteScadute: delete error`, err);
                    return reject(err);
                }
                const deleted = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
                console.error(`[DAO:${process.pid}] deleteScadute - deleted ${deleted} rows`);

                // Log count after delete
                db.get(`SELECT COUNT(*) as cnt FROM PRENOTAZIONI WHERE stato = 'scaduta'`, [], (errAfter, rowAfter) => {
                    const after = (rowAfter && rowAfter.cnt) || 0;
                    console.error(`[DAO:${process.pid}] deleteScadute - count after delete: ${after}`);
                    resolve({ success: true, deleted: deleted, changes: deleted });
                });
            });
        });
    });
}

/**
 * Recupera tutte le prenotazioni di un utente
 * @async
 * @param {number} userId - ID utente
 * @returns {Promise<Array<Object>>} Array di prenotazioni
 * @throws {Object} { error: '...' } in caso di errore
 */
exports.getPrenotazioniByUserId = async (userId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT p.*, 
                   c.nome as campo_nome,
                   u.nome as utente_nome, u.cognome as utente_cognome,
                   s.nome as squadra_nome
            FROM PRENOTAZIONI p
            LEFT JOIN CAMPI c ON p.campo_id = c.id
            LEFT JOIN UTENTI u ON p.utente_id = u.id
            LEFT JOIN SQUADRE s ON p.squadra_id = s.id
            WHERE p.utente_id = ?
            ORDER BY p.data_prenotazione DESC, p.ora_inizio DESC
        `;
        db.all(sql, [userId], (err, prenotazioni) => {
            if (err) {
                return reject({ error: 'Error retrieving user prenotazioni: ' + err.message });
            }
            resolve(prenotazioni || []);
        });
    });
}

// Accetta automaticamente le prenotazioni in attesa da più di 3 giorni (tacito consenso)
/**
 * Accetta automaticamente prenotazioni in attesa da più di 3 giorni
 * Implementa il cosiddetto "tacito consenso" per prenotazioni non gestite
 * @async
 * @returns {Promise<Object>} { success: true, accepted }
 * @throws {Error} In caso di errore DB
 */
exports.autoAcceptPendingBookings = async () => {
    return new Promise((resolve, reject) => {
        // Calcola la data di 3 giorni fa
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const threeDaysAgoStr = threeDaysAgo.toISOString().slice(0, 19).replace('T', ' ');

        // Query per trovare prenotazioni in attesa da più di 3 giorni
        const sql = `
            SELECT id FROM PRENOTAZIONI 
            WHERE stato = 'in_attesa' 
            AND created_at <= ?
        `;
        
        db.all(sql, [threeDaysAgoStr], (err, rows) => {
            if (err) return reject(err);
            
            const ids = rows.map(row => row.id);
            if (ids.length === 0) {
                return resolve({ success: true, accepted: 0 });
            }

            // Aggiorna lo stato a 'confermata' per tacito consenso
            const updateSql = `
                UPDATE PRENOTAZIONI 
                SET stato = 'confermata', updated_at = NOW() 
                WHERE id IN (${ids.map(() => '?').join(',')})
            `;
            
            db.run(updateSql, ids, function (err, result) {
                if (err) return reject(err);
                const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
                console.log(`[AUTO-ACCEPT] ${changes} prenotazioni accettate automaticamente per tacito consenso`);
                resolve({ success: true, accepted: changes });
            });
        });
    });
}




// Esporta l'oggetto exports per compatibilità e chiarezza
module.exports = exports;





