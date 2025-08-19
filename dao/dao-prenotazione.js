"use strict";
const db = require('../db');
const Campo=require('../model/campo.js');

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
		row.descrizione
	);
}


// Restituisce tutti i campi attivi
function getCampiAttivi(callback) {
	db.all('SELECT * FROM CAMPI WHERE attivo = 1', [], callback);
}

// Restituisce orari disponibili per un campo in una data
function getDisponibilitaCampo(campoId, data, callback) {
	const orariPossibili = [
		{ inizio: '16:00', fine: '17:00' },
		{ inizio: '18:00', fine: '19:00' },
		{ inizio: '20:00', fine: '21:00' },
		{ inizio: '21:00', fine: '22:00' }
	];
	db.all(`SELECT ora_inizio, ora_fine FROM PRENOTAZIONI WHERE campo_id = ? AND data_prenotazione = ?`, [campoId, data], (err, prenotazioni) => {
		if (err) return callback(err);
		const disponibili = orariPossibili.filter(orario => {
			return !prenotazioni.some(p => p.ora_inizio === orario.inizio && p.ora_fine === orario.fine);
		});
		callback(null, disponibili);
	});
}

// Prenota un campo
function prenotaCampo({ campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note }, callback) {
	db.get(`SELECT * FROM PRENOTAZIONI WHERE campo_id = ? AND data_prenotazione = ? AND ora_inizio = ? AND ora_fine = ?`, [campo_id, data_prenotazione, ora_inizio, ora_fine], (err, row) => {
		if (err) return callback(err);
		if (row) return callback(null, { error: 'Orario già prenotato' });
		db.run(`INSERT INTO PRENOTAZIONI (campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note, stato, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confermata', datetime('now'), datetime('now'))`,
			[campo_id, utente_id || null, squadra_id || null, data_prenotazione, ora_inizio, ora_fine, tipo_attivita || null, note || null],
			function (err) {
				if (err) return callback(err);
				callback(null, { success: true, id: this.lastID });
			}
		);
	});
}

module.exports = {
	getCampiAttivi,
	getDisponibilitaCampo,
	prenotaCampo
};

