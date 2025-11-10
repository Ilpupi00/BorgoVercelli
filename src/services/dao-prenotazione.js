"use strict";
const db = require('../config/database');
const Campo=require('../models/campo.js');
const Immagine = require('../models/immagine.js');
const Prenotazione=require('../models/prenotazione.js');

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
	       row.Docce
       );
}

const makePrenotazione=(row)=>{
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

const makeImmagini=(row)=>{
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
	       db.all('SELECT * FROM CAMPI WHERE attivo = 1', [], async (err, rows) => {
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
            WHERE campo_id = ? AND attivo = 1 
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
    // Filtro sempre orari entro 2 ore anche se la data non è oggi (per sicurezza)
    if (dataNorm !== now.toISOString().slice(0,10)) {
        // Se la data è futura, non serve filtro
        // Se la data è passata, non mostrare nulla
        const richiestaDate = new Date(dataNorm);
        if (richiestaDate < now) {
            orariDisponibili = [];
        }
    }
    return new Promise((resolve,reject)=>{
        db.all(`SELECT * FROM PRENOTAZIONI WHERE campo_id = ? AND data_prenotazione = ?`, [campoId, dataNorm], (err, rows) => {
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
            console.log('[PRENOTAZIONE] Query:', `SELECT * FROM PRENOTAZIONI WHERE campo_id = ${campoId} AND data_prenotazione = ${dataNorm}`);
            console.log('[PRENOTAZIONE] Prenotazioni trovate:', prenotazioni);
            console.log('[PRENOTAZIONE] Orari disponibili:', disponibili);
            resolve(disponibili);
        });
    });
}

// Prenota un campo
exports.prenotaCampo = async ({ campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note }) => {
    const dataNorm = normalizeDate(data_prenotazione);
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM PRENOTAZIONI WHERE campo_id = ? AND data_prenotazione = ? AND ora_inizio = ? AND ora_fine = ?`, [campo_id, dataNorm, ora_inizio, ora_fine], (err, row) => {
            if (err) return reject(err);
            if (row) return resolve({ error: 'Orario già prenotato' });
            // Nuove prenotazioni iniziano con stato 'in_attesa' e devono essere accettate dall'admin
            db.run(`INSERT INTO PRENOTAZIONI (campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note, stato, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_attesa', datetime('now'), datetime('now'))`,
                [campo_id, utente_id || null, squadra_id || null, dataNorm, ora_inizio, ora_fine, tipo_attivita || null, note || null], function (err) {
                    if (err) return reject(err);
                    resolve({ success: true, id: this.lastID });
                }
            );
        });
    });
}

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

exports.updateStatoPrenotazione = async (id, stato) => {
    return new Promise((resolve, reject) => {
        console.log(`[DAO] updateStatoPrenotazione: id=${id}, stato=${stato}`);
        db.run(`UPDATE PRENOTAZIONI SET stato = ?, updated_at = datetime('now') WHERE id = ?`, [stato, id], function (err) {
            if (err) {
                console.error('[DAO] updateStatoPrenotazione: error', err);
                return reject(err);
            }
            console.log(`[DAO] updateStatoPrenotazione: changes=${this.changes}`);
            resolve({ success: true, changes: this.changes });
        });
    });
}

exports.updatePrenotazione = async (id, { campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note }) => {
    const dataNorm = normalizeDate(data_prenotazione);
    return new Promise((resolve, reject) => {
        db.run(`UPDATE PRENOTAZIONI SET campo_id = ?, utente_id = ?, squadra_id = ?, data_prenotazione = ?, ora_inizio = ?, ora_fine = ?, tipo_attivita = ?, note = ?, updated_at = datetime('now') WHERE id = ?`,
            [campo_id, utente_id || null, squadra_id || null, dataNorm, ora_inizio, ora_fine, tipo_attivita || null, note || null, id], function (err) {
                if (err) return reject(err);
                resolve({ success: true, changes: this.changes });
            });
    });
}

exports.deletePrenotazione = async (id) => {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM PRENOTAZIONI WHERE id = ?`, [id], function (err) {
            if (err) return reject(err);
            resolve({ success: true, changes: this.changes });
        });
    });
}

exports.checkAndUpdateScadute = async () => {
    const now = new Date();
    const currentDate = now.toISOString().slice(0, 10);
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM PRENOTAZIONI WHERE stato = 'confermata' AND (data_prenotazione < ? OR (data_prenotazione = ? AND ora_fine <= ?))`, [currentDate, currentDate, currentTime], (err, rows) => {
            if (err) return reject(err);
            const ids = rows.map(row => row.id);
            if (ids.length > 0) {
                db.run(`UPDATE PRENOTAZIONI SET stato = 'scaduta', updated_at = datetime('now') WHERE id IN (${ids.map(() => '?').join(',')})`, ids, function (err) {
                    if (err) return reject(err);
                    resolve({ success: true, updated: this.changes });
                });
            } else {
                resolve({ success: true, updated: 0 });
            }
        });
    });
}

exports.deleteScadute = async () => {
    return new Promise((resolve, reject) => {
        process.stdout.write('[DAO] deleteScadute: starting...\n');
        db.run(`UPDATE PRENOTAZIONI SET stato = 'test2'`, function (err) {
            process.stdout.write(`[DAO] deleteScadute: callback called, err: ${err}, changes: ${this.changes}\n`);
            if (err) {
                console.error('[DAO] deleteScadute: update error', err);
                return reject(err);
            }
            process.stdout.write(`[DAO] deleteScadute: updated ${this.changes} rows\n`);
            resolve({ success: true, deleted: this.changes });
        });
    });
}

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
                SET stato = 'confermata', updated_at = datetime('now') 
                WHERE id IN (${ids.map(() => '?').join(',')})
            `;
            
            db.run(updateSql, ids, function (err) {
                if (err) return reject(err);
                console.log(`[AUTO-ACCEPT] ${this.changes} prenotazioni accettate automaticamente per tacito consenso`);
                resolve({ success: true, accepted: this.changes });
            });
        });
    });
}





