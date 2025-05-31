'use strict';

const sqlite3 = require('sqlite3').verbose();
const moment= require('moment');


const db =new sqlite3.Database('database.db', (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});