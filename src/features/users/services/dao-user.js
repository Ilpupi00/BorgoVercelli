'use strict';

const sqlite=require('../../../core/config/database');
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
                    if (err.message.includes('UNIQUE constraint failed: UTENTI.email')) {
                        reject({ error: 'Email già registrata' });
                    } else {
                        reject({ error: 'Error creating user: ' + err.message });
                    }
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

exports.getUserByEmail = function(email) {
    return new Promise((resolve, reject) => {
        email = email.toLowerCase();
        const sql = `
            SELECT u.*, t.nome AS tipo_utente_nome
            FROM UTENTI u
            LEFT JOIN TIPI_UTENTE t ON u.tipo_utente_id = t.id
            WHERE u.email = ?
        `;
        sqlite.get(sql, [email], (err, user) => {
            if (err) {
                return reject({ error: 'Error retrieving user: ' + err.message });
            }
            resolve(user || null);
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
        INSERT INTO IMMAGINI (descrizione, url, tipo, entita_riferimento, entita_id, ordine, created_at, updated_at)
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
            SELECT u.id, u.nome, u.cognome, u.email, u.telefono, u.tipo_utente_id, u.data_registrazione,
                   u.stato, u.motivo_sospensione, u.data_inizio_sospensione, u.data_fine_sospensione,
                   i.url AS immagine_profilo
            FROM UTENTI u
            LEFT JOIN IMMAGINI i ON i.entita_riferimento = 'utente' AND i.entita_id = u.id AND (i.ordine = 1 OR i.ordine IS NULL)
            ORDER BY u.data_registrazione DESC
        `;
        sqlite.all(sql, [], (err, users) => {
            if (err) {
                return reject({ error: 'Error retrieving users: ' + err.message });
            }
            resolve(users);
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

exports.getStatistiche = async () => {
    try {
        const statistiche = {};

        // Utenti totali
        const utentiTotali = await new Promise((resolve, reject) => {
            sqlite.get('SELECT COUNT(*) as count FROM UTENTI', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        statistiche.utentiTotali = utentiTotali;

        // Notizie pubblicate
        const notiziePubblicate = await new Promise((resolve, reject) => {
            sqlite.get('SELECT COUNT(*) as count FROM NOTIZIE WHERE pubblicata = 1', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        statistiche.notiziePubblicate = notiziePubblicate;

        // Eventi attivi (pubblicati e data_fine futura o null)
        const eventiAttivi = await new Promise((resolve, reject) => {
            sqlite.get(`
                SELECT COUNT(*) as count FROM EVENTI 
                WHERE pubblicato = 1 AND (data_fine IS NULL OR data_fine >= date('now'))
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        statistiche.eventiAttivi = eventiAttivi;

        // Prenotazioni attive (future)
        const prenotazioniAttive = await new Promise((resolve, reject) => {
            sqlite.get(`
                SELECT COUNT(*) as count FROM PRENOTAZIONI 
                WHERE data_prenotazione >= date('now')
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        statistiche.prenotazioniAttive = prenotazioniAttive;

        // Distribuzione utenti per tipo
        const distribuzioneUtenti = await new Promise((resolve, reject) => {
            sqlite.all(`
                SELECT t.nome as tipo, COUNT(u.id) as count
                FROM UTENTI u
                LEFT JOIN TIPI_UTENTE t ON u.tipo_utente_id = t.id
                GROUP BY u.tipo_utente_id, t.nome
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        statistiche.distribuzioneUtenti = distribuzioneUtenti;

        // Attività recenti (ultimi 30 giorni)
        const attivitaRecenti = await new Promise((resolve, reject) => {
            sqlite.all(`
                SELECT 
                    'registrazione' as tipo,
                    COUNT(*) as count,
                    strftime('%Y-%m', data_registrazione) as periodo
                FROM UTENTI 
                WHERE data_registrazione >= date('now', '-30 days')
                GROUP BY strftime('%Y-%m', data_registrazione)
                UNION ALL
                SELECT 
                    'notizia' as tipo,
                    COUNT(*) as count,
                    strftime('%Y-%m', data_pubblicazione) as periodo
                FROM NOTIZIE 
                WHERE data_pubblicazione >= date('now', '-30 days') AND pubblicata = 1
                GROUP BY strftime('%Y-%m', data_pubblicazione)
                UNION ALL
                SELECT 
                    'evento' as tipo,
                    COUNT(*) as count,
                    strftime('%Y-%m', data_inizio) as periodo
                FROM EVENTI 
                WHERE data_inizio >= date('now', '-30 days') AND pubblicato = 1
                GROUP BY strftime('%Y-%m', data_inizio)
                ORDER BY periodo DESC
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        statistiche.attivitaRecenti = attivitaRecenti;

        // Tendenze mensili (ultimi 6 mesi)
        const tendenzeMensili = await new Promise((resolve, reject) => {
            sqlite.all(`
                SELECT 
                    strftime('%Y-%m', data_registrazione) as mese,
                    COUNT(*) as nuovi_utenti
                FROM UTENTI 
                WHERE data_registrazione >= date('now', '-6 months')
                GROUP BY strftime('%Y-%m', data_registrazione)
                ORDER BY mese ASC
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // Prenotazioni mensili
        const prenotazioniMensili = await new Promise((resolve, reject) => {
            sqlite.all(`
                SELECT 
                    strftime('%Y-%m', data_prenotazione) as mese,
                    COUNT(*) as prenotazioni
                FROM PRENOTAZIONI 
                WHERE data_prenotazione >= date('now', '-6 months')
                GROUP BY strftime('%Y-%m', data_prenotazione)
                ORDER BY mese ASC
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // Combina i dati delle tendenze
        const mesi = {};
        const mesiNomi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

        // Inizializza ultimi 6 mesi
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const meseKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const meseNome = `${mesiNomi[date.getMonth()]} ${date.getFullYear()}`;
            mesi[meseKey] = { mese: meseNome, nuovi_utenti: 0, prenotazioni: 0 };
        }

        // Popola con dati reali
        tendenzeMensili.forEach(item => {
            if (mesi[item.mese]) {
                mesi[item.mese].nuovi_utenti = item.nuovi_utenti;
            }
        });

        prenotazioniMensili.forEach(item => {
            if (mesi[item.mese]) {
                mesi[item.mese].prenotazioni = item.prenotazioni;
            }
        });

        statistiche.tendenzeMensili = Object.values(mesi);

        return statistiche;
    } catch (error) {
        console.error('Errore nel calcolo delle statistiche:', error);
        return {};
    }
}

exports.searchUsers = function(query, onlyDirigenti = false) {
    return new Promise((resolve, reject) => {
        const searchTerm = `%${query}%`;

        if (onlyDirigenti) {
            const sql = `
                SELECT u.id, u.nome, u.cognome, u.email, COALESCE(t.nome, 'Utente') AS tipo_utente_nome
                FROM UTENTI u
                LEFT JOIN TIPI_UTENTE t ON u.tipo_utente_id = t.id
                WHERE (u.nome LIKE ? OR u.cognome LIKE ? OR u.email LIKE ?)
                AND t.nome = 'Dirigente'
                ORDER BY u.nome, u.cognome
                LIMIT 10
            `;
            sqlite.all(sql, [searchTerm, searchTerm, searchTerm], (err, users) => {
                if (err) return reject({ error: 'Error searching users: ' + err.message });
                resolve(users || []);
            });
        } else {
            const sql = `
                SELECT u.id, u.nome, u.cognome, u.email, COALESCE(t.nome, 'Utente') AS tipo_utente_nome
                FROM UTENTI u
                LEFT JOIN TIPI_UTENTE t ON u.tipo_utente_id = t.id
                WHERE (u.nome LIKE ? OR u.cognome LIKE ? OR u.email LIKE ?)
                AND u.id NOT IN (
                    SELECT DISTINCT utente_id 
                    FROM DIRIGENTI_SQUADRE 
                    WHERE utente_id IS NOT NULL AND attivo = 1
                )
                ORDER BY u.nome, u.cognome
                LIMIT 10
            `;
            sqlite.all(sql, [searchTerm, searchTerm, searchTerm], (err, users) => {
                if (err) return reject({ error: 'Error searching users: ' + err.message });
                resolve(users || []);
            });
        }
    });
}

exports.saveResetToken = function(userId, token, expiresAt) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE UTENTI SET reset_token = ?, reset_expires = ? WHERE id = ?`;
        sqlite.run(sql, [token, expiresAt.toISOString(), userId], function(err) {
            if (err) {
                reject({ error: 'Error saving reset token: ' + err.message });
            } else {
                resolve({ message: 'Reset token saved successfully' });
            }
        });
    });
}

exports.getUserByResetToken = function(token) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT u.*, t.nome AS tipo_utente_nome
            FROM UTENTI u
            LEFT JOIN TIPI_UTENTE t ON u.tipo_utente_id = t.id
            WHERE u.reset_token = ? AND u.reset_expires > ?
        `;
        sqlite.get(sql, [token, new Date().toISOString()], (err, user) => {
            if (err) {
                return reject({ error: 'Error retrieving user by reset token: ' + err.message });
            }
            resolve(user);
        });
    });
}

exports.invalidateResetToken = function(userId) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE UTENTI SET reset_token = NULL, reset_expires = NULL WHERE id = ?`;
        sqlite.run(sql, [userId], function(err) {
            if (err) {
                reject({ error: 'Error invalidating reset token: ' + err.message });
            } else {
                resolve({ message: 'Reset token invalidated successfully' });
            }
        });
    });
}

exports.updatePassword = function(userId, newPasswordHash) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE UTENTI SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?`;
        sqlite.run(sql, [newPasswordHash, userId], function(err) {
            if (err) {
                reject({ error: 'Error updating password: ' + err.message });
            } else {
                resolve({ message: 'Password updated successfully' });
            }
        });
    });
}

// Funzioni per gestione stato utente (sospensione/ban)

exports.sospendiUtente = function(userId, adminId, motivo, dataFine) {
    return new Promise((resolve, reject) => {
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        const sql = `UPDATE UTENTI 
                     SET stato = 'sospeso',
                         motivo_sospensione = ?,
                         data_inizio_sospensione = ?,
                         data_fine_sospensione = ?,
                         admin_sospensione_id = ?,
                         updated_at = ?
                     WHERE id = ?`;
        
        sqlite.run(sql, [motivo, now, dataFine, adminId, now, userId], function(err) {
            if (err) {
                reject({ error: 'Errore nella sospensione dell\'utente: ' + err.message });
            } else if (this.changes === 0) {
                reject({ error: 'Utente non trovato' });
            } else {
                resolve({ 
                    message: 'Utente sospeso con successo',
                    userId: userId,
                    dataFine: dataFine
                });
            }
        });
    });
}

exports.bannaUtente = function(userId, adminId, motivo) {
    return new Promise((resolve, reject) => {
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        const sql = `UPDATE UTENTI 
                     SET stato = 'bannato',
                         motivo_sospensione = ?,
                         data_inizio_sospensione = ?,
                         data_fine_sospensione = NULL,
                         admin_sospensione_id = ?,
                         updated_at = ?
                     WHERE id = ?`;
        
        sqlite.run(sql, [motivo, now, adminId, now, userId], function(err) {
            if (err) {
                reject({ error: 'Errore nel ban dell\'utente: ' + err.message });
            } else if (this.changes === 0) {
                reject({ error: 'Utente non trovato' });
            } else {
                resolve({ 
                    message: 'Utente bannato con successo',
                    userId: userId
                });
            }
        });
    });
}

exports.revocaSospensioneBan = function(userId) {
    return new Promise((resolve, reject) => {
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        const sql = `UPDATE UTENTI 
                     SET stato = 'attivo',
                         motivo_sospensione = NULL,
                         data_inizio_sospensione = NULL,
                         data_fine_sospensione = NULL,
                         admin_sospensione_id = NULL,
                         updated_at = ?
                     WHERE id = ?`;
        
        sqlite.run(sql, [now, userId], function(err) {
            if (err) {
                reject({ error: 'Errore nella revoca: ' + err.message });
            } else if (this.changes === 0) {
                reject({ error: 'Utente non trovato' });
            } else {
                resolve({ 
                    message: 'Sospensione/Ban revocato con successo',
                    userId: userId
                });
            }
        });
    });
}

exports.verificaSospensioniScadute = function() {
    return new Promise((resolve, reject) => {
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        const sql = `UPDATE UTENTI 
                     SET stato = 'attivo',
                         motivo_sospensione = NULL,
                         data_inizio_sospensione = NULL,
                         data_fine_sospensione = NULL,
                         admin_sospensione_id = NULL
                     WHERE stato = 'sospeso' 
                     AND data_fine_sospensione IS NOT NULL 
                     AND data_fine_sospensione < ?`;
        
        sqlite.run(sql, [now], function(err) {
            if (err) {
                reject({ error: 'Errore nella verifica sospensioni: ' + err.message });
            } else {
                resolve({ 
                    message: 'Verifica completata',
                    aggiornati: this.changes
                });
            }
        });
    });
}

exports.getStatoUtente = function(userId) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT stato, motivo_sospensione, data_inizio_sospensione, 
                            data_fine_sospensione, admin_sospensione_id
                     FROM UTENTI
                     WHERE id = ?`;
        
        sqlite.get(sql, [userId], (err, row) => {
            if (err) {
                reject({ error: 'Errore nel recupero stato utente: ' + err.message });
            } else if (!row) {
                reject({ error: 'Utente non trovato' });
            } else {
                resolve(row);
            }
        });
    });
}

module.exports = exports;

