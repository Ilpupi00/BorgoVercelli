'use strict';

const sqlite=require('../db');
const bcrypt=require('bcrypt');


exports.createUser=function(user){
    return new Promise((resolve,reject)=>{
        const sql = 'INSERT INTO UTENTI (id,nome, cognome, email, password,telefono) VALUES (?,?,?,?,?)';
        bcrypt.hash(user.password,10).then((hash)=>{
            sqlite.run(sql, [user.id, user.nome, user.cognome, user.email, hash, user.telefono])
            .then(() => {
                resolve({ message: 'User created successfully' });
            })
            .catch((err) => {
                reject({ error: 'Error creating user: ' + err.message });
            });
        }
        ).catch((err) => {
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
