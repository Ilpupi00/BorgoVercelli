"use strict";
const db = require('../db');
const Campo=require('../model/campo.js');
const Immagine = require('../model/immagine.js');
const Prenotazione=require('../model/prenotazione.js');

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
		row.entita_riferimento_entita_id,
		row.ordine,
		row.created_at,
		row.updated_at
	);
}

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
	const orariPossibili = [
		{ inizio: '16:00', fine: '17:00' },
		{ inizio: '18:00', fine: '19:00' },
		{ inizio: '20:00', fine: '21:00' },
		{ inizio: '21:00', fine: '22:00' }
	];
       return new Promise((resolve,reject)=>{
	       console.log('[PRENOTAZIONE] getDisponibilitaCampo:', { campoId, data });
	       db.all(`SELECT * FROM PRENOTAZIONI WHERE campo_id = ? AND data_prenotazione = ?`, [campoId, data], (err, rows) => {
		       if (err) return reject(err);
		       const prenotazioni = rows.map(makePrenotazione);
		       const orariOccupati = prenotazioni.map(p => ({ inizio: p.ora_inizio, fine: p.ora_fine }));
		       function toMin(ora) {
			       const [h, m] = ora.split(":").map(Number);
			       return h * 60 + m;
		       }
		       const orariDisponibili = orariPossibili.filter(o => {
			       const inizioP = toMin(o.inizio);
			       const fineP = toMin(o.fine);
			       return !orariOccupati.some(oo => {
				       const inizioO = toMin(oo.inizio);
				       const fineO = toMin(oo.fine);
				       return inizioP < fineO && fineP > inizioO;
			       });
		       });
		       console.log('[PRENOTAZIONE] Query:', `SELECT * FROM PRENOTAZIONI WHERE campo_id = ${campoId} AND data_prenotazione = ${data}`);
		       console.log('[PRENOTAZIONE] Prenotazioni trovate:', prenotazioni);
		       console.log('[PRENOTAZIONE] Orari disponibili:', orariDisponibili);
		       resolve(orariDisponibili);
	       });
       });

}

// Prenota un campo
exports.prenotaCampo = async ({ campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note }) => {
	return new Promise((resolve, reject) => {
		db.get(`SELECT * FROM PRENOTAZIONI WHERE campo_id = ? AND data_prenotazione = ? AND ora_inizio = ? AND ora_fine = ?`, [campo_id, data_prenotazione, ora_inizio, ora_fine], (err, row) => {
			if (err) return reject(err);
			if (row) return resolve({ error: 'Orario già prenotato' });
			db.run(`INSERT INTO PRENOTAZIONI (campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note, stato, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confermata', datetime('now'), datetime('now'))`,
				[campo_id, utente_id || null, squadra_id || null, data_prenotazione, ora_inizio, ora_fine, tipo_attivita || null, note || null], function (err) {
					if (err) return reject(err);
					resolve({ success: true, id: this.lastID });
				}
			);
		});
	});
}





