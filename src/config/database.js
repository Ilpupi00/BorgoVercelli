'use strict';

const sqlite3 = require('sqlite3').verbose();
const path = require('path');


const dbPath = path.join(__dirname, '../../database/database.db');
console.log('[database] opening sqlite db at', dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the SQLite database at', dbPath);
    }
});

// Test query
// db.get("SELECT 1 as test", [], (err, row) => {
//     if (err) console.error('Test query error:', err);
//     else console.log('Test query success:', row);
// });

// process.on('exit', () => {
//     console.log('Closing database');
//     db.close();
// });

module.exports=db;