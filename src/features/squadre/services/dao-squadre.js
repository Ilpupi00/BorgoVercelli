'use strict';

const sqlite = require('../../../core/config/database');
const Giocatore = require('../../../core/models/giocatore.js');
const Squadra = require('../../../core/models/squadra.js');
const daoDirigenti = require('./dao-dirigenti-squadre.js');

const makeSquadra = (row) => {
    return new Squadra(
        row.id,
        row.nome,
        row.immagine_url,
        row.Anno,
        row.dirigenti || [],  // Aggiunto per dirigenti
        row.giocatori || [],   // Aggiunto per giocatori
        row.numero_giocatori || 0  // Numero di giocatori attivi
    );
}

const makeGiocatore = (row) => {
    return new Giocatore({
        id: row.id,
        id_immagine: row.id_immagine,
        squadra_id: row.squadra_id,
        numero_maglia: row.numero_maglia,
        ruolo: row.ruolo,
        data_nascita: row.data_nascita,
        piede_preferito: row.piede_preferito,
        data_inizio_tesseramento: row.data_inizio_tesseramento,
        data_fine_tesseramento: row.data_fine_tesseramento,
        attivo: row.attivo,
        created_at: row.created_at,
        updated_at: row.updated_at,
        Nazionalita: row.nazionalita,
        Nome: row.nome,
        Cognome: row.cognome
    });
}



exports.getSquadre = async () => {
    const sql = `
        SELECT 
            s.*, 
            i.url AS immagine_url,
            (SELECT COUNT(*) FROM GIOCATORI g WHERE g.squadra_id = s.id AND g.attivo = 1) AS numero_giocatori
        FROM SQUADRE s 
        LEFT JOIN IMMAGINI i ON s.id_immagine = i.id
    `;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, async (err, squadre) => {
            if (err) {
                return reject({ error: 'Error retrieving teams: ' + err.message });
            }
            // Per ogni squadra, recupera i dirigenti
            const squadreConDirigenti = await Promise.all(squadre.map(async (squadra) => {
                const dirigenti = await daoDirigenti.getDirigentiBySquadra(squadra.id);
                return { ...squadra, dirigenti };
            }));
            resolve(squadreConDirigenti.map(makeSquadra) || []);
        });
    });
}

exports.getGiocatori =async ()=>{
    const sql = `SELECT 
        g.id,
        i.url AS id_immagine,
        g.squadra_id,
        g.numero_maglia,
        g.ruolo,
        g.data_nascita,
        g.piede_preferito,
        g.data_inizio_tesseramento,
        g.data_fine_tesseramento,
        g.attivo,
        g.created_at,
        g.updated_at,
        g.Nazionalità AS nazionalita,
        g.Nome AS nome,
        g.Cognome AS cognome
    FROM GIOCATORI g
    LEFT JOIN IMMAGINI i ON g.immagini_id = i.id`;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, (err, rows) => {
            if (err) {
                return reject({ error: 'Error retrieving players: ' + err.message });
            }
            // Mappa ogni riga in un oggetto Giocatore
            const giocatori = (rows || []).map(makeGiocatore);
            resolve(giocatori);
        });
    });
}

exports.createSquadra = function(nome, annoFondazione) {
    const sql = 'INSERT INTO SQUADRE (nome, Anno) VALUES (?, ?)';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [nome, annoFondazione], function(err) {
            if (err) {
                console.error('Errore SQL insert squadra:', err);
                return reject({ error: 'Errore nella creazione della squadra: ' + err.message });
            }
            resolve({ id: this.lastID, message: 'Squadra creata con successo' });
        });
    });
}

exports.updateSquadra = function(id, nome, anno, id_immagine = null) {
    let sql = 'UPDATE SQUADRE SET nome = ?, Anno = ?';
    let params = [nome, anno,];
    if (id_immagine !== null) {
        sql += ', id_immagine = ?';
        params.push(id_immagine);
    }
    sql += ' WHERE id = ?';
    params.push(parseInt(id));
    return new Promise((resolve, reject) => {
        sqlite.run(sql, params, function(err) {
            if (err) {
                console.error('Errore SQL update squadra:', err);
                return reject({ error: 'Errore nell\'aggiornamento della squadra: ' + err.message });
            }
            if (this.changes === 0) {
                return reject({ error: 'Squadra non trovata' });
            }
            resolve({ message: 'Squadra aggiornata con successo' });
        });
    });
}

exports.deleteSquadra = function(id) {
    const sql = 'DELETE FROM SQUADRE WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [parseInt(id)], function(err) {
            if (err) {
                console.error('Errore SQL delete squadra:', err);
                return reject({ error: 'Errore nella cancellazione della squadra: ' + err.message });
            }
            if (this.changes === 0) {
                return reject({ error: 'Squadra non trovata' });
            }
            resolve({ message: 'Squadra cancellata con successo' });
        });
    });
}

exports.getSquadraById = function(id) {
    const sql = 'SELECT * FROM SQUADRE WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.get(sql, [parseInt(id)], async (err, squadra) => {
            if (err) {
                return reject({ error: 'Errore nel recupero della squadra: ' + err.message });
            }
            if (!squadra) {
                // Restituisci null invece di errore per gestire meglio il caso
                return resolve(null);
            }
            // Recupera i dirigenti
            const dirigenti = await daoDirigenti.getDirigentiBySquadra(squadra.id);
            // Recupera i giocatori
            const giocatori = await this.getGiocatoriBySquadra(squadra.id);
            resolve({ ...squadra, dirigenti, giocatori });
        });
    });
}

exports.searchSquadre = async function(searchTerm) {
    const sql = `
        SELECT id, nome, id_immagine, Anno
        FROM SQUADRE
        WHERE nome LIKE ?
        ORDER BY nome ASC
        LIMIT 10
    `;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, [searchTerm], async (err, squadre) => {
            if (err) {
                console.error('Errore SQL search squadre:', err);
                return reject({ error: 'Error searching teams: ' + err.message });
            }
            // Per ogni squadra, recupera i dirigenti
            const squadreConDirigenti = await Promise.all(squadre.map(async (squadra) => {
                const dirigenti = await daoDirigenti.getDirigentiBySquadra(squadra.id);
                return makeSquadra({ ...squadra, dirigenti });
            }));
            resolve(squadreConDirigenti || []);
        });
    });
}

exports.getGiocatoriBySquadra = function(squadraId) {
    const sql = `SELECT 
        id,
        immagini_id AS id_immagine,
        squadra_id,
        numero_maglia,
        ruolo,
        data_nascita,
        piede_preferito,
        data_inizio_tesseramento,
        data_fine_tesseramento,
        attivo,
        created_at,
        updated_at,
        Nazionalità AS nazionalita,
        Nome AS nome,
        Cognome AS cognome
    FROM GIOCATORI 
    WHERE squadra_id = ? AND attivo = 1
    ORDER BY numero_maglia ASC`;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, [parseInt(squadraId)], (err, rows) => {
            if (err) {
                return reject({ error: 'Errore nel recupero dei giocatori: ' + err.message });
            }
            const giocatori = (rows || []).map(makeGiocatore);
            resolve(giocatori);
        });
    });
}

exports.createGiocatore = function(giocatoreData) {
    const sql = `INSERT INTO GIOCATORI
        (Nome, Cognome, numero_maglia, ruolo, data_nascita, piede_preferito, Nazionalità, squadra_id, immagini_id, attivo, data_inizio_tesseramento)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`;
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [
            giocatoreData.nome,
            giocatoreData.cognome,
            giocatoreData.numero_maglia || null,
            giocatoreData.ruolo || null,
            giocatoreData.data_nascita || null,
            giocatoreData.piede_preferito || null,
            giocatoreData.nazionalita || null,
            giocatoreData.squadra_id,
            giocatoreData.immagini_id || null
        ], function(err) {
            if (err) {
                console.error('Errore SQL insert giocatore:', err);
                return reject({ error: 'Errore nella creazione del giocatore: ' + err.message });
            }
            resolve({ id: this.lastID, message: 'Giocatore creato con successo' });
        });
    });
}

// NOTE: updateGiocatore implemented later using COALESCE to preserve existing immagini_id when not provided

exports.deleteGiocatore = function(id) {
    const sql = 'UPDATE GIOCATORI SET attivo = 0, data_fine_tesseramento = datetime(\'now\') WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [parseInt(id)], function(err) {
            if (err) {
                console.error('Errore SQL delete giocatore:', err);
                return reject({ error: 'Errore nella rimozione del giocatore: ' + err.message });
            }
            if (this.changes === 0) {
                return reject({ error: 'Giocatore non trovato' });
            }
            resolve({ message: 'Giocatore rimosso con successo' });
        });
    });
}

exports.getGiocatoreById = function(id) {
    const sql = `SELECT
        id,
        immagini_id AS id_immagine,
        squadra_id,
        numero_maglia,
        ruolo,
        data_nascita,
        piede_preferito,
        data_inizio_tesseramento,
        data_fine_tesseramento,
        attivo,
        created_at,
        updated_at,
        Nazionalità AS nazionalita,
        Nome AS nome,
        Cognome AS cognome
    FROM GIOCATORI WHERE id = ? AND attivo = 1`;
    return new Promise((resolve, reject) => {
        sqlite.get(sql, [parseInt(id)], (err, row) => {
            if (err) {
                return reject({ error: 'Errore nel recupero del giocatore: ' + err.message });
            }
            if (!row) {
                return reject({ error: 'Giocatore non trovato' });
            }
            const giocatore = makeGiocatore(row);
            resolve(giocatore);
        });
    });
}

exports.addGiocatore = function(squadraId, giocatoreData) {
    const sql = `INSERT INTO GIOCATORI (
        squadra_id, numero_maglia, ruolo, piede_preferito, Nazionalita, Nome, Cognome, id_immagine,
        data_inizio_tesseramento, attivo, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 1, datetime('now'), datetime('now'))`;

    return new Promise((resolve, reject) => {
        sqlite.run(sql, [
            parseInt(squadraId),
            giocatoreData.numero_maglia,
            giocatoreData.ruolo,
            giocatoreData.piede_preferito,
            giocatoreData.nazionalita,
            giocatoreData.nome,
            giocatoreData.cognome,
            giocatoreData.foto
        ], function(err) {
            if (err) {
                return reject({ error: 'Errore nell\'aggiunta del giocatore: ' + err.message });
            }
            // Recupera il giocatore appena creato
            exports.getGiocatoreById(this.lastID)
                .then(giocatore => resolve(giocatore))
                .catch(err => reject(err));
        });
    });
}

exports.removeGiocatore = function(id) {
    const sql = 'UPDATE GIOCATORI SET attivo = 0, updated_at = datetime(\'now\') WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [parseInt(id)], function(err) {
            if (err) {
                return reject({ error: 'Errore nella rimozione del giocatore: ' + err.message });
            }
            if (this.changes === 0) {
                return reject({ error: 'Giocatore non trovato' });
            }
            resolve({ message: 'Giocatore rimosso con successo' });
        });
    });
}

exports.addDirigente = function(squadraId, email) {
    // Prima recupera l'utente dall'email
    const sqlGetUser = 'SELECT id FROM UTENTI WHERE email = ?';
    const sqlInsertDirigente = 'INSERT INTO DIRIGENTI_SQUADRE (squadra_id, utente_id) VALUES (?, ?)';

    return new Promise((resolve, reject) => {
        sqlite.get(sqlGetUser, [email], (err, user) => {
            if (err) {
                return reject({ error: 'Errore nel recupero dell\'utente: ' + err.message });
            }
            if (!user) {
                return reject({ error: 'Utente con questa email non trovato' });
            }

            // Verifica se l'utente è già dirigente di questa squadra
            const sqlCheck = 'SELECT id FROM DIRIGENTI_SQUADRE WHERE squadra_id = ? AND utente_id = ?';
            sqlite.get(sqlCheck, [parseInt(squadraId), user.id], (err, existing) => {
                if (err) {
                    return reject({ error: 'Errore nella verifica: ' + err.message });
                }
                if (existing) {
                    return reject({ error: 'Questo utente è già dirigente di questa squadra' });
                }

                // Aggiungi il dirigente
                sqlite.run(sqlInsertDirigente, [parseInt(squadraId), user.id], function(err) {
                    if (err) {
                        return reject({ error: 'Errore nell\'aggiunta del dirigente: ' + err.message });
                    }
                    // Recupera i dati completi del dirigente appena aggiunto
                    const sqlGetDirigente = `
                        SELECT ds.id, u.email, u.nome, u.cognome, u.immagine_profilo as immagine
                        FROM DIRIGENTI_SQUADRE ds
                        JOIN UTENTI u ON ds.utente_id = u.id
                        WHERE ds.id = ?
                    `;
                    sqlite.get(sqlGetDirigente, [this.lastID], (err, dirigente) => {
                        if (err) {
                            return reject({ error: 'Errore nel recupero del dirigente: ' + err.message });
                        }
                        resolve(dirigente);
                    });
                });
            });
        });
    });
}

exports.removeDirigente = function(squadraId, dirigenteId) {
    const sql = 'DELETE FROM DIRIGENTI_SQUADRE WHERE squadra_id = ? AND id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [parseInt(squadraId), parseInt(dirigenteId)], function(err) {
            if (err) {
                return reject({ error: 'Errore nella rimozione del dirigente: ' + err.message });
            }
            if (this.changes === 0) {
                return reject({ error: 'Dirigente non trovato in questa squadra' });
            }
            resolve({ message: 'Dirigente rimosso con successo' });
        });
    });
}

// Nota: la funzione `exports.getSquadraById` è definita più sopra e restituisce squadra con dirigenti e giocatori.
// Qui non sovrascriviamo quella implementazione.

exports.updateGiocatore = async (id, giocatoreData) => {
    const sql = `UPDATE GIOCATORI SET Nome = ?, Cognome = ?, ruolo = ?, numero_maglia = ?, data_nascita = ?, piede_preferito = ?, Nazionalità = ?, immagini_id = COALESCE(?, immagini_id), updated_at = datetime('now')
                 WHERE id = ?`;
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [
            giocatoreData.nome,
            giocatoreData.cognome,
            giocatoreData.ruolo,
            giocatoreData.numero_maglia,
            giocatoreData.data_nascita,
            giocatoreData.piede_preferito,
            giocatoreData.nazionalita,
            giocatoreData.immagini_id,
            id
        ], function(err) {
            if (err) {
                return reject({ error: 'Errore aggiornamento giocatore: ' + err.message });
            }
            if (this.changes === 0) {
                return reject({ error: 'Giocatore non trovato' });
            }
            resolve({ message: 'Giocatore aggiornato' });
        });
    });
}

// NOTE: removal of giocatore handled above via soft-delete (set attivo = 0) to preserve history