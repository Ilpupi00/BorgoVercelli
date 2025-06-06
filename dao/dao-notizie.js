'use strict';

const sqlite = require('../db.js');

exports.geNotizie = function(){
    const sql = 'SELECT * FROM NOTIZIE';
    return new Promise((resolve, reject) => {
        sqlite.all(sql, (err, notizie) => {
            if (err) {
                return reject({ error: 'Error retrieving news: ' + err.message });
            }
            /*if (!notizie || notizie.length === 0) {
                return reject({ error: 'No news found' });
            }*/
            resolve(notizie);
        });
    });
}

exports.getNotiziaById = function(id) {
    const sql = 'SELECT * FROM NOTIZIE WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.get(sql, [id], (err, notizia) => {
            if (err) {
                return reject({ error: 'Error retrieving news: ' + err.message });
            }
            if (!notizia) {
                return reject({ error: 'News not found' });
            }
            resolve(notizia);
        });
    });
}