'use strict';

const sqlite=require('./db');
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


