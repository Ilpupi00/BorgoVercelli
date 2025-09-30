#!/usr/bin/env node

const readline = require('readline');
const moment = require('moment');
const daoUser = require('../dao/dao-user');

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(question, ans => {
    rl.close();
    resolve(ans);
  }));
}

(async () => {
  try {
    console.log('--- Creazione account admin ---');
    const nome = await ask('Nome: ');
    const cognome = await ask('Cognome: ');
    const email = await ask('Email: ');
    const telefono = await ask('Telefono: ');
    const password = await ask('Password: ');

    const user = {
      nome,
      cognome,
      email,
      telefono,
      password,
      tipo_utente_id: 1, // 1 = admin
      data_registrazione: moment().format('YYYY-MM-DD HH:mm:ss'),
      created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
      updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
    };

    // Modifica la funzione createUser per accettare tipo_utente_id
    const sql = `INSERT INTO UTENTI (email, password_hash, nome, cognome, telefono, tipo_utente_id, data_registrazione, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const bcrypt = require('bcrypt');
    const sqlite = require('../db');
    const hash = await bcrypt.hash(user.password, 10);
    await new Promise((resolve, reject) => {
      sqlite.run(sql, [
        user.email,
        hash,
        user.nome,
        user.cognome,
        user.telefono || '',
        user.tipo_utente_id,
        user.data_registrazione,
        user.created_at,
        user.updated_at
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    console.log('Account admin creato con successo!');
  } catch (err) {
    console.error('Errore nella creazione account admin:', err);
  }
})();
