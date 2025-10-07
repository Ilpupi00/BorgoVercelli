'use strict';

const sqlite=require('../db.js');
const bcrypt=require('bcrypt');
const moment=require('moment');



exports.createUser = function(user) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO UTENTI 
            (email, password_hash, nome, cognome, telefono, tipo_utente_id, data_registrazione, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        bcrypt.hash(user.password, 10).then((hash) => {
            const now = moment().format('YYYY-MM-DD HH:mm:ss');
            sqlite.run(sql, [  
                user.email,
                hash,
                user.nome,
                user.cognome,
                user.telefono || '',
                0, // tipo_utente_id di default
                now,
                now,
                now
            ], function(err) {
                if (err) {
                    reject({ error: 'Error creating user: ' + err.message });
                } else {
                    resolve({ message: 'User created successfully' });
                }
            });
        }).catch((err) => {
            reject({ error: 'Error hashing password: ' + err.message });
        });
    });
}

exports.getUserById = function (id) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT u.*, t.nome AS tipo_utente_nome
            FROM UTENTI u
            LEFT JOIN TIPI_UTENTE t ON u.tipo_utente_id = t.id
            WHERE u.id = ?
        `;
        sqlite.get(sql, [id], (err, user) => {
            if (err) {
                return reject({ error: 'Error retrieving user: ' + err.message });
            }
            if (!user) {
                return reject({ error: 'User not found' });
            }
            resolve(user);
        });
    });
};

exports.getUser = function(email, password) {
    return new Promise((resolve, reject) => {
        email = email.toLowerCase();
        const sql = `
            SELECT u.*, t.nome AS tipo_utente_nome
            FROM UTENTI u
            LEFT JOIN TIPI_UTENTE t ON u.tipo_utente_id = t.id
            WHERE u.email = ?
        `;
        sqlite.get(sql, [email], (err, user) => {
            console.log('Trovato utente:', user);
            if (err) {
                return reject({ error: 'Error retrieving user: ' + err.message });
            }
            if (!user) {
                return reject({ error: 'User not found' });
            }
            bcrypt.compare(password, user.password_hash)
                .then((isMatch) => {
                    console.log('Password inserita:', password);
                    console.log('Hash salvato:', user.password_hash);
                    console.log('Password match:', isMatch);
                    if (isMatch) {
                        resolve(user);
                    } else {
                        reject({ error: 'Invalid password' });
                    }
                })
                .catch((err) => {
                    reject({ error: 'Error comparing passwords: ' + err.message });
                });
        });
    });
}

exports.getImmagineProfiloByUserId = async (userId) => {
  const sql = `SELECT url FROM IMMAGINI WHERE entita_riferimento = 'utente' AND entita_id = ? ORDER BY ordine LIMIT 1`;
  return new Promise((resolve, reject) => {
    sqlite.get(sql, [userId], (err, row) => {
      if (err) return reject(err);
      resolve(row ? row.url : null);
    });
  });
};

exports.updateUser=async (userId, fields) =>{
    if (!userId || !fields || Object.keys(fields).length === 0) return false;
    const updates = [];
    const values = [];
    if (fields.nome) {
        updates.push('nome = ?');
        values.push(fields.nome);
    }
    if (fields.cognome) {
        updates.push('cognome = ?');
        values.push(fields.cognome);
    }
    if (fields.email) {
        updates.push('email = ?');
        values.push(fields.email);
    }
    if (fields.telefono) {
        updates.push('telefono = ?');
        values.push(fields.telefono);
    }
    if (fields.tipo_utente_id !== undefined) {
        updates.push('tipo_utente_id = ?');
        values.push(fields.tipo_utente_id);
    }
    if (fields.ruolo_preferito !== undefined) {
        updates.push('ruolo_preferito = ?');
        values.push(fields.ruolo_preferito);
    }
    if (fields.piede_preferito !== undefined) {
        updates.push('piede_preferito = ?');
        values.push(fields.piede_preferito);
    }
    if (updates.length === 0){
        console.log('Nessun campo da aggiornare');
        return false;
    }
    values.push(userId);
    const sql = `UPDATE UTENTI SET ${updates.join(', ')} WHERE id = ?`;
    return new Promise((resolve, reject) => {
        sqlite.run(sql, values, function(err) {
            if (err) {
                reject({ error: 'Errore aggiornamento: ' + err.message });
            } else {
                resolve(true);
            }
        });
    });
}

exports.updateProfilePicture = async (userId, imageUrl) => {
    console.log('updateProfilePicture chiamato con userId:', userId, 'imageUrl:', imageUrl);
    if (!userId || !imageUrl) return false;

    // Prima elimina eventuali record esistenti per questo utente
    const deleteSql = `DELETE FROM IMMAGINI WHERE entita_riferimento = 'utente' AND entita_id = ?`;
    console.log('Eseguo DELETE per eliminare record esistenti');
    await new Promise((resolve, reject) => {
        sqlite.run(deleteSql, [userId], function(err) {
            if (err) {
                console.log('Errore DELETE:', err);
                reject({ error: 'Errore eliminazione immagine profilo esistente: ' + err.message });
            } else {
                console.log('DELETE completato, righe eliminate:', this.changes);
                resolve();
            }
        });
    });

    // Poi inserisci il nuovo record
    const insertSql = `
        INSERT INTO IMMAGINI (titolo, url, tipo, entita_riferimento, entita_id, ordine, created_at, updated_at)
        VALUES ('Foto profilo utente', ?, 'profilo', 'utente', ?, 1, datetime('now'), datetime('now'))
    `;
    console.log('Eseguo INSERT per nuovo record');
    return new Promise((resolve, reject) => {
        sqlite.run(insertSql, [imageUrl, userId], function(err) {
            if (err) {
                console.log('Errore INSERT:', err);
                reject({ error: 'Errore inserimento immagine profilo: ' + err.message });
            } else {
                console.log('INSERT completato, nuovo ID:', this.lastID);
                resolve(true);
            }
        });
    });
}

exports.getGiocatoreByUserId = function (userId) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT g.*, s.nome AS squadra_nome
            FROM GIOCATORI g
            LEFT JOIN SQUADRE s ON g.squadra_id = s.id
            WHERE g.utente_id = ? AND g.attivo = 1
        `;
        sqlite.get(sql, [userId], (err, giocatore) => {
            if (err) {
                return reject({ error: 'Errore nel recupero del giocatore: ' + err.message });
            }
            resolve(giocatore || null);
        });
    });
}

exports.getAllUsers = function() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT u.*, t.nome AS tipo_utente_nome
            FROM UTENTI u
            LEFT JOIN TIPI_UTENTE t ON u.tipo_utente_id = t.id
            ORDER BY u.created_at DESC
        `;
        sqlite.all(sql, [], (err, users) => {
            if (err) {
                return reject({ error: 'Error retrieving users: ' + err.message });
            }
            resolve(users || []);
        });
    });
}

exports.getUserStats = function(userId) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                (SELECT COUNT(*) FROM PRENOTAZIONI WHERE utente_id = ?) as prenotazioni_totali,
                (SELECT COUNT(*) FROM RECENSIONI WHERE utente_id = ?) as recensioni_totali,
                (SELECT COUNT(*) FROM PRENOTAZIONI WHERE utente_id = ? AND data_prenotazione >= date('now', '-30 days')) as prenotazioni_mese,
                (SELECT COUNT(*) FROM RECENSIONI WHERE utente_id = ? AND created_at >= datetime('now', '-30 days')) as recensioni_mese
        `;
        sqlite.get(sql, [userId, userId, userId, userId], (err, stats) => {
            if (err) {
                return reject({ error: 'Error retrieving user stats: ' + err.message });
            }
            resolve(stats || { prenotazioni_totali: 0, recensioni_totali: 0, prenotazioni_mese: 0, recensioni_mese: 0 });
        });
    });
}

exports.getUserRecentActivity = function(userId) {
    return new Promise((resolve, reject) => {
        const activity = {};

        // Ultime prenotazioni
        const prenotazioniSql = `
            SELECT p.*, c.nome as campo_nome
            FROM PRENOTAZIONI p
            LEFT JOIN CAMPI c ON p.campo_id = c.id
            WHERE p.utente_id = ?
            ORDER BY p.created_at DESC
            LIMIT 3
        `;

        // Ultime recensioni
        const recensioniSql = `
            SELECT r.*, 'evento' as tipo_contenuto
            FROM RECENSIONI r
            WHERE r.utente_id = ?
            ORDER BY r.created_at DESC
            LIMIT 3
        `;

        Promise.all([
            new Promise((resolve, reject) => {
                sqlite.all(prenotazioniSql, [userId], (err, prenotazioni) => {
                    if (err) reject(err);
                    else resolve(prenotazioni || []);
                });
            }),
            new Promise((resolve, reject) => {
                sqlite.all(recensioniSql, [userId], (err, recensioni) => {
                    if (err) reject(err);
                    else resolve(recensioni || []);
                });
            })
        ]).then(([prenotazioni, recensioni]) => {
            resolve({
                prenotazioni: prenotazioni,
                recensioni: recensioni
            });
        }).catch(reject);
    });
}

exports.changePassword = function(userId, currentPassword, newPassword) {
    return new Promise((resolve, reject) => {
        // Prima ottieni l'utente per verificare la password attuale
        const getUserSql = 'SELECT password_hash FROM UTENTI WHERE id = ?';
        sqlite.get(getUserSql, [userId], (err, user) => {
            if (err) {
                return reject({ error: 'Error retrieving user: ' + err.message });
            }
            if (!user) {
                return reject({ error: 'User not found' });
            }

            // Verifica la password attuale
            bcrypt.compare(currentPassword, user.password_hash)
                .then((isMatch) => {
                    if (!isMatch) {
                        return reject({ error: 'Password attuale non corretta' });
                    }

                    // Hasha la nuova password
                    return bcrypt.hash(newPassword, 10);
                })
                .then((hash) => {
                    // Aggiorna la password nel database
                    const updateSql = 'UPDATE UTENTI SET password_hash = ?, updated_at = ? WHERE id = ?';
                    const now = moment().format('YYYY-MM-DD HH:mm:ss');
                    sqlite.run(updateSql, [hash, now, userId], function(err) {
                        if (err) {
                            reject({ error: 'Error updating password: ' + err.message });
                        } else {
                            resolve({ message: 'Password aggiornata con successo' });
                        }
                    });
                })
                .catch((err) => {
                    reject({ error: 'Error processing password change: ' + err.message });
                });
        });
    });
};

exports.deleteUser = function(userId) {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM UTENTI WHERE id = ?';
        sqlite.run(sql, [userId], function(err) {
            if (err) {
                reject({ error: 'Error deleting user: ' + err.message });
            } else {
                resolve({ message: 'User deleted successfully' });
            }
        });
    });
};

module.exports = exports;

