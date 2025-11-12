/**
 * @fileoverview Data Access Object per la gestione degli utenti
 * @module features/users/services/dao-user
 * @description Fornisce metodi per operazioni CRUD sugli utenti, autenticazione,
 * gestione profili, reset password, sospensioni e ban.
 */

'use strict';

const sqlite = require('../../../core/config/database');
const bcrypt = require('bcrypt');
const moment = require('moment');
const User = require('../../../core/models/user');

// ==================== CREAZIONE E AUTENTICAZIONE ====================

/**
 * Crea un nuovo utente nel database
 * 
 * @function createUser
 * @param {Object} user - Dati dell'utente da creare
 * @param {string} user.email - Email dell'utente
 * @param {string} user.password - Password in chiaro (verrà hashata)
 * @param {string} user.nome - Nome dell'utente
 * @param {string} user.cognome - Cognome dell'utente
 * @param {string} [user.telefono] - Numero di telefono (opzionale)
 * @returns {Promise<Object>} Messaggio di successo
 * @throws {Error} Se email già esistente o errore nel database
 * 
 * @example
 * createUser({
 *   email: 'mario.rossi@example.com',
 *   password: 'Password123!',
 *   nome: 'Mario',
 *   cognome: 'Rossi',
 *   telefono: '3331234567'
 * });
 */
exports.createUser = function(user) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO UTENTI 
            (email, password_hash, nome, cognome, telefono, tipo_utente_id, data_registrazione, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        // Hash della password con bcrypt
        bcrypt.hash(user.password, 10).then((hash) => {
            const now = moment().format('YYYY-MM-DD HH:mm:ss');
            sqlite.run(sql, [  
                user.email,
                hash,
                user.nome,
                user.cognome,
                user.telefono || '',
                0, // tipo_utente_id di default (5 = Utente normale)
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

/**
 * Recupera un utente dal database tramite ID
 * Include anche il nome del tipo utente dalla tabella TIPI_UTENTE
 * 
 * @function getUserById
 * @param {number} id - ID univoco dell'utente
 * @returns {Promise<Object>} Dati completi dell'utente con tipo_utente_nome
 * @throws {Error} Se utente non trovato o errore database
 * 
 * @example
 * getUserById(123).then(user => console.log(user.nome));
 */
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
            resolve(User.from(user));
        });
    });
};

/**
 * Autentica un utente tramite email e password
 * Confronta la password fornita con l'hash salvato nel database
 * 
 * @function getUser
 * @param {string} email - Email dell'utente (case insensitive)
 * @param {string} password - Password in chiaro da verificare
 * @returns {Promise<Object>} Dati completi dell'utente se autenticazione riuscita
 * @throws {Error} Se utente non trovato, password errata o errore database
 * 
 * @example
 * getUser('mario@example.com', 'password123')
 *   .then(user => console.log('Login riuscito:', user.nome));
 */
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
                        resolve(User.from(user));
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

/**
 * Recupera un utente per email (case-insensitive)
 * @function getUserByEmail
 * @param {string} email - Email da cercare
 * @returns {Promise<Object|null>} Oggetto utente o null se non esiste
 * @throws {Object} Oggetto errore con proprietà error
 */
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
            resolve(user ? User.from(user) : null);
        });
    });
}

/**
 * Recupera l'URL dell'immagine profilo per un dato utente
 * @function getImmagineProfiloByUserId
 * @param {number} userId - ID dell'utente
 * @returns {Promise<string|null>} URL dell'immagine o null se non presente
 */
exports.getImmagineProfiloByUserId = async (userId) => {
    const sql = `SELECT url FROM IMMAGINI WHERE entita_riferimento = 'utente' AND entita_id = ? ORDER BY ordine LIMIT 1`;
    return new Promise((resolve, reject) => {
        sqlite.get(sql, [userId], (err, row) => {
            if (err) return reject(err);
            resolve(row ? row.url : null);
        });
    });
};

/**
 * Aggiorna campi del profilo utente forniti in `fields`
 * @function updateUser
 * @param {number} userId - ID dell'utente da aggiornare
 * @param {Object} fields - Campi da aggiornare (nome, cognome, email, telefono, tipo_utente_id, ruolo_preferito, piede_preferito)
 * @returns {Promise<boolean>} true se aggiornato correttamente, false altrimenti
 */
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

/**
 * Aggiorna l'immagine profilo di un utente: elimina i record esistenti e inserisce il nuovo
 * @function updateProfilePicture
 * @param {number} userId - ID dell'utente
 * @param {string} imageUrl - URL dell'immagine da salvare
 * @returns {Promise<boolean>} true se operazione riuscita
 */
exports.updateProfilePicture = async (userId, imageUrl) => {
    console.log('updateProfilePicture chiamato con userId:', userId, 'imageUrl:', imageUrl);
    if (!userId || !imageUrl) return false;

    // Prima elimina eventuali record esistenti per questo utente
    const deleteSql = `DELETE FROM IMMAGINI WHERE entita_riferimento = 'utente' AND entita_id = ?`;
    console.log('Eseguo DELETE per eliminare record esistenti');
    await new Promise((resolve, reject) => {
        // The DB wrapper for Postgres returns (err, result) where result.rowCount exists
        sqlite.run(deleteSql, [userId], function(err, result) {
            if (err) {
                console.log('Errore DELETE:', err);
                reject({ error: 'Errore eliminazione immagine profilo esistente: ' + err.message });
            } else {
                const deleted = (result && (result.rowCount !== undefined ? result.rowCount : (result.changes || 0))) || 0;
                console.log('DELETE completato, righe eliminate:', deleted);
                resolve(deleted);
            }
        });
    });

    // Poi inserisci il nuovo record
    const insertSql = `
        INSERT INTO IMMAGINI (descrizione, url, tipo, entita_riferimento, entita_id, ordine, created_at, updated_at)
        VALUES ('Foto profilo utente', ?, 'profilo', 'utente', ?, 1, ?, ?)
        RETURNING id
    `;
    console.log('Eseguo INSERT per nuovo record');
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    return new Promise((resolve, reject) => {
        // Our Postgres wrapper returns result.rows/rowCount in the callback
        sqlite.run(insertSql, [imageUrl, userId, now, now], function(err, result) {
            if (err) {
                console.log('Errore INSERT:', err);
                reject({ error: 'Errore inserimento immagine profilo: ' + err.message });
            } else {
                const newId = result && result.rows && result.rows[0] ? result.rows[0].id : null;
                const changed = result && (result.rowCount !== undefined ? result.rowCount : (result.changes || 0));
                console.log('INSERT completato, newId:', newId, 'rowCount:', changed);
                resolve(true);
            }
        });
    });
}

/**
 * Recupera il record giocatore associato a un utente
 * @function getGiocatoreByUserId
 * @param {number} userId - ID utente
 * @returns {Promise<Object|null>} Oggetto giocatore o null
 */
exports.getGiocatoreByUserId = function (userId) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT g.*, s.nome AS squadra_nome
            FROM GIOCATORI g
            LEFT JOIN SQUADRE s ON g.squadra_id = s.id
            WHERE g.utente_id = ? AND g.attivo = true
        `;
        sqlite.get(sql, [userId], (err, giocatore) => {
            if (err) {
                return reject({ error: 'Errore nel recupero del giocatore: ' + err.message });
            }
            resolve(giocatore || null);
        });
    });
}

/**
 * Recupera tutti gli utenti con info di base e immagine profilo
 * @function getAllUsers
 * @returns {Promise<Array<Object>>} Array di utenti
 */
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
            resolve(users.map(user => User.from(user)));
        });
    });
}

/**
 * Recupera tutti i tipi utente definiti nella tabella TIPI_UTENTE
 * @function getTipiUtente
 * @returns {Promise<Array<Object>>} Array di tipi utente { id, nome }
 */
exports.getTipiUtente = function() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT id, nome FROM TIPI_UTENTE ORDER BY id`;
        sqlite.all(sql, [], (err, rows) => {
            if (err) return reject({ error: 'Errore recupero tipi utente: ' + err.message });
            resolve(rows || []);
        });
    });
}

/**
 * Ottiene statistiche aggregate per un utente (prenotazioni, recensioni, ultimi 30 giorni)
 * @function getUserStats
 * @param {number} userId - ID utente
 * @returns {Promise<Object>} Oggetto con statistiche
 */
exports.getUserStats = function(userId) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                (SELECT COUNT(*) FROM PRENOTAZIONI WHERE utente_id = ?) as prenotazioni_totali,
                (SELECT COUNT(*) FROM RECENSIONI WHERE utente_id = ?) as recensioni_totali,
                (SELECT COUNT(*) FROM PRENOTAZIONI WHERE utente_id = ? AND data_prenotazione >= (CURRENT_DATE - INTERVAL '30 days')) as prenotazioni_mese,
                (SELECT COUNT(*) FROM RECENSIONI WHERE utente_id = ? AND created_at >= (NOW() - INTERVAL '30 days')) as recensioni_mese
        `;
        sqlite.get(sql, [userId, userId, userId, userId], (err, stats) => {
            if (err) {
                return reject({ error: 'Error retrieving user stats: ' + err.message });
            }
            resolve(stats || { prenotazioni_totali: 0, recensioni_totali: 0, prenotazioni_mese: 0, recensioni_mese: 0 });
        });
    });
}

/**
 * Recupera attività recenti dell'utente: ultime prenotazioni e recensioni
 * @function getUserRecentActivity
 * @param {number} userId - ID utente
 * @returns {Promise<Object>} Oggetto con array 'prenotazioni' e 'recensioni'
 */
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

/**
 * Cambia la password di un utente verificando la password corrente
 * @function changePassword
 * @param {number} userId - ID utente
 * @param {string} currentPassword - Password corrente in chiaro
 * @param {string} newPassword - Nuova password in chiaro
 * @returns {Promise<Object>} Messaggio di successo
 * @throws {Object} Oggetto errore con proprietà error
 */
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

/**
 * Elimina un utente dal database
 * @function deleteUser
 * @param {number} userId - ID utente
 * @returns {Promise<Object>} Messaggio di successo
 */
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

/**
 * Recupera statistiche di sistema (utenti totali, notizie pubblicate, eventi attivi, ecc.)
 * Utilizzato per dashboard/admin
 * @function getStatistiche
 * @returns {Promise<Object>} Oggetto con molteplici metriche
 */
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
            sqlite.get('SELECT COUNT(*) as count FROM NOTIZIE WHERE pubblicata = true', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        statistiche.notiziePubblicate = notiziePubblicate;

        // Eventi attivi (pubblicati e data_fine futura o null)
        const eventiAttivi = await new Promise((resolve, reject) => {
            sqlite.get(`
                SELECT COUNT(*) as count FROM EVENTI 
                WHERE pubblicato = true AND (data_fine IS NULL OR data_fine >= CURRENT_DATE)
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
                WHERE data_prenotazione >= CURRENT_DATE
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
                    TO_CHAR(data_registrazione, 'YYYY-MM') as periodo
                FROM UTENTI 
                WHERE data_registrazione >= (CURRENT_DATE - INTERVAL '30 days')
                GROUP BY TO_CHAR(data_registrazione, 'YYYY-MM')
                UNION ALL
                SELECT 
                    'notizia' as tipo,
                    COUNT(*) as count,
                    TO_CHAR(data_pubblicazione, 'YYYY-MM') as periodo
                FROM NOTIZIE 
                WHERE data_pubblicazione >= (CURRENT_DATE - INTERVAL '30 days') AND pubblicata = true
                GROUP BY TO_CHAR(data_pubblicazione, 'YYYY-MM')
                UNION ALL
                SELECT 
                    'evento' as tipo,
                    COUNT(*) as count,
                    TO_CHAR(data_inizio, 'YYYY-MM') as periodo
                FROM EVENTI 
                WHERE data_inizio >= (CURRENT_DATE - INTERVAL '30 days') AND pubblicato = true
                GROUP BY TO_CHAR(data_inizio, 'YYYY-MM')
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
                    TO_CHAR(data_registrazione, 'YYYY-MM') as mese,
                    COUNT(*) as nuovi_utenti
                FROM UTENTI 
                WHERE data_registrazione >= (CURRENT_DATE - INTERVAL '6 months')
                GROUP BY TO_CHAR(data_registrazione, 'YYYY-MM')
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
                    TO_CHAR(data_prenotazione, 'YYYY-MM') as mese,
                    COUNT(*) as prenotazioni
                FROM PRENOTAZIONI 
                WHERE data_prenotazione >= (CURRENT_DATE - INTERVAL '6 months')
                GROUP BY TO_CHAR(data_prenotazione, 'YYYY-MM')
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

/**
 * Ricerca utenti per nome/cognome/email. Può limitare la ricerca solo ai dirigenti.
 * @function searchUsers
 * @param {string} query - Termine di ricerca
 * @param {boolean} [onlyDirigenti=false] - true per cercare solo dirigenti
 * @returns {Promise<Array<Object>>} Array di utenti trovati (max 10)
 */
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
                resolve((users || []).map(user => User.from(user)));
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
                    WHERE utente_id IS NOT NULL AND attivo = true
                )
                ORDER BY u.nome, u.cognome
                LIMIT 10
            `;
            sqlite.all(sql, [searchTerm, searchTerm, searchTerm], (err, users) => {
                if (err) return reject({ error: 'Error searching users: ' + err.message });
                resolve((users || []).map(user => User.from(user)));
            });
        }
    });
}

/**
 * Salva il token di reset password con scadenza per un utente
 * @function saveResetToken
 * @param {number} userId - ID utente
 * @param {string} token - Token generato
 * @param {Date} expiresAt - Data di scadenza del token
 * @returns {Promise<Object>} Messaggio di successo
 */
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

/**
 * Recupera l'utente dato un token di reset valido
 * @function getUserByResetToken
 * @param {string} token - Token di reset
 * @returns {Promise<Object|null>} Utente o null
 */
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
            resolve(user ? User.from(user) : null);
        });
    });
}

/**
 * Invalida il token di reset per un utente (imposta a NULL)
 * @function invalidateResetToken
 * @param {number} userId - ID utente
 * @returns {Promise<Object>} Messaggio di successo
 */
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

/**
 * Aggiorna l'hash della password e invalida i token di reset
 * @function updatePassword
 * @param {number} userId - ID utente
 * @param {string} newPasswordHash - Nuovo hash della password
 * @returns {Promise<Object>} Messaggio di successo
 */
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

/**
 * Sospende temporaneamente un utente
 * @function sospendiUtente
 * @param {number} userId - ID dell'utente da sospendere
 * @param {number} adminId - ID dell'admin che effettua la sospensione
 * @param {string} motivo - Motivo della sospensione
 * @param {string|null} dataFine - Data fine sospensione (ISO string) o null per sospensione senza termine
 * @returns {Promise<Object>} Oggetto con messaggio e dettagli della sospensione
 * @throws {Object} Oggetto errore con proprietà error
 */
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
        
        console.log('[DAO] sospendiUtente - Parametri:', { userId, adminId, motivo, dataFine, now });
        
        sqlite.run(sql, [motivo, now, dataFine, adminId, now, userId], function(err, result) {
            if (err) {
                console.error('[DAO] sospendiUtente - Errore SQL:', err);
                reject({ error: 'Errore nella sospensione dell\'utente: ' + err.message });
            } else {
                const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
                if (changes === 0) {
                    console.warn('[DAO] sospendiUtente - Nessuna riga aggiornata per userId:', userId);
                    reject({ error: 'Utente non trovato' });
                } else {
                    console.log('[DAO] sospendiUtente - Successo, righe aggiornate:', changes);
                    resolve({ 
                        message: 'Utente sospeso con successo',
                        userId: userId,
                        dataFine: dataFine
                    });
                }
            }
        });
    });
}

/**
 * Banna permanentemente un utente
 * @function bannaUtente
 * @param {number} userId - ID dell'utente da bannare
 * @param {number} adminId - ID dell'admin che effettua il ban
 * @param {string} motivo - Motivo del ban
 * @returns {Promise<Object>} Oggetto con messaggio e dettagli
 * @throws {Object} Oggetto errore con proprietà error
 */
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
        
        console.log('[DAO] bannaUtente - Parametri:', { userId, adminId, motivo, now });
        
        sqlite.run(sql, [motivo, now, adminId, now, userId], function(err, result) {
            if (err) {
                console.error('[DAO] bannaUtente - Errore SQL:', err);
                reject({ error: 'Errore nel ban dell\'utente: ' + err.message });
            } else {
                const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
                if (changes === 0) {
                    console.warn('[DAO] bannaUtente - Nessuna riga aggiornata per userId:', userId);
                    reject({ error: 'Utente non trovato' });
                } else {
                    console.log('[DAO] bannaUtente - Successo, righe aggiornate:', changes);
                    resolve({ 
                        message: 'Utente bannato con successo',
                        userId: userId
                    });
                }
            }
        });
    });
}

/**
 * Revoca sospensione o ban per un utente riportandolo ad 'attivo'
 * @function revocaSospensioneBan
 * @param {number} userId - ID dell'utente
 * @returns {Promise<Object>} Oggetto con messaggio di successo
 * @throws {Object} Oggetto errore con proprietà error
 */
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
        
        console.log('[DAO] revocaSospensioneBan - Parametri:', { userId, now });
        
        sqlite.run(sql, [now, userId], function(err, result) {
            if (err) {
                console.error('[DAO] revocaSospensioneBan - Errore SQL:', err);
                reject({ error: 'Errore nella revoca: ' + err.message });
            } else {
                const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
                if (changes === 0) {
                    console.warn('[DAO] revocaSospensioneBan - Nessuna riga aggiornata per userId:', userId);
                    reject({ error: 'Utente non trovato' });
                } else {
                    resolve({ 
                        message: 'Sospensione/Ban revocato con successo',
                        userId: userId
                    });
                }
            }
        });
    });
}

/**
 * Verifica e riattiva automaticamente le sospensioni scadute
 * Cerca utenti con stato 'sospeso' e data_fine_sospensione passata e li imposta ad 'attivo'
 * @function verificaSospensioniScadute
 * @returns {Promise<Object>} Oggetto con messaggio e numero di record aggiornati
 * @throws {Object} Oggetto errore con proprietà error
 */
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
        
        sqlite.run(sql, [now], function(err, result) {
            if (err) {
                reject({ error: 'Errore nella verifica sospensioni: ' + err.message });
            } else {
                const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
                resolve({ 
                    message: 'Verifica completata',
                    aggiornati: changes
                });
            }
        });
    });
}

/**
 * Recupera lo stato corrente di un utente (attivo/sospeso/bannato) e i dettagli della sospensione
 * @function getStatoUtente
 * @param {number} userId - ID dell'utente
 * @returns {Promise<Object>} Oggetto con campi: stato, motivo_sospensione, data_inizio_sospensione, data_fine_sospensione, admin_sospensione_id
 * @throws {Object} Oggetto errore con proprietà error
 */
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

