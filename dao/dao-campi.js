'use strict';

const sqlite = require('../db.js');
const Campo = require('../model/campo.js');

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

exports.getCampi = function(){
    const sql = 'SELECT * FROM CAMPI WHERE attivo = 1';
    return new Promise((resolve, reject) => {
        sqlite.all(sql, (err, campi) => {
            if (err) {
                console.error('Errore SQL get campi:', err);
                return reject({ error: 'Error retrieving fields: ' + err.message });
            }
            resolve(campi.map(makeCampo) || []);
        });
    });
}

exports.getCampoById = function(id) {
    const sql = 'SELECT * FROM CAMPI WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.get(sql, [id], (err, campo) => {
            if (err) {
                console.error('Errore SQL get campo by id:', err);
                return reject({ error: 'Error retrieving field: ' + err.message });
            }
            if (!campo) {
                return reject({ error: 'Field not found' });
            }
            resolve(makeCampo(campo));
        });
    });
}