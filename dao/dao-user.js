
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

