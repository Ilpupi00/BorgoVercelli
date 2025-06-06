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
            ])
            .then(() => {
                resolve({ message: 'User created successfully' });
            })
            .catch((err) => {
                reject({ error: 'Error creating user: ' + err.message });
            });
        }).catch((err) => {
            reject({ error: 'Error hashing password: ' + err.message });
        });
    });
}

exports.getUserById= function (id){
    return new Promise((resolve,reject)=>{
        const sql = 'SELECT * FROM UTENTI WHERE id = ?';
        sqlite.get(sql, [id])
        .then((user) => {
            if (!user) {
                return reject({ error: 'User not found' });
            }
            resolve(user);
        })
        .catch((err) => {
            reject({ error: 'Error retrieving user: ' + err.message });
        });
    });
}

exports.getUser= function(email,password) {
        return new Promise((resolve,reject)=>{
        const sql = 'SELECT * FROM UTENTI WHERE email = ?';
        sqlite.get(sql, [email])
        .then((user) => {
            if (!user) {
                return reject({ error: 'User not found' });
            }
            bcrypt.compare(password, user.password)
            .then((isMatch) => {
                if (isMatch) {
                    resolve(user);
                } else {
                    reject({ error: 'Invalid password' });
                }
            })
            .catch((err) => {
                reject({ error: 'Error comparing passwords: ' + err.message });
            });
        })
        .catch((err) => {
            reject({ error: 'Error retrieving user: ' + err.message });
        });
    });

}
