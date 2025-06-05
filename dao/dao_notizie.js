'use strict';

const sqlite = require('../db.js');

exports.geNotizie = function(){
    const sql = 'SELECT * FROM NOTIZIE';
    return new Promise((resolve, reject) => {
        sqlite.all(sql)
        .then((notizie) => {
            if (!notizie || notizie.length === 0) {
                return reject({ error: 'No news found' });
            }
            resolve(notizie);
        })
        .catch((err) => {
            reject({ error: 'Error retrieving news: ' + err.message });
        });
    });
}

exports.getNotiziaById = function(id) {
    const sql = 'SELECT * FROM NOTIZIE WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.get(sql, [id])
        .then((notizia) => {
            if (!notizia) {
                return reject({ error: 'News not found' });
            }
            resolve(notizia);
        })
        .catch((err) => {
            reject({ error: 'Error retrieving news: ' + err.message });
        });
    });
}