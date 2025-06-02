'use strict';

const express = require('express');
const Router= express.Router();


Router.get('/Notizie',(req,res)=>{
    const sql=`SELECT * FROM Notizie`;
    req.app.locals.db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

Router.get('/eventi',(req,res)=>{
    const sql=`SELECT * FROM Eventi`;
    req.app.locals.db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

