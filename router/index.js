'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const isLoggedIn=require('../middleware/isLogged');

router.get('/Homepage', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'), (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});

router.get('/Campionato',(req,res)=>{
        res.sendFile(path.join(__dirname, '../public', 'index.html'),(err)=>{
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});

router.get('/Squadre',(req,res)=>{
        res.sendFile(path.join(__dirname, '../public', 'index.html'),(err)=>{
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});

router.get('/Galleria',(req,res)=>{
        res.sendFile(path.join(__dirname, '../public', 'index.html'),(err)=>{
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});
router.get('/Societa',(req,res)=>{
        res.sendFile(path.join(__dirname, '../public', 'index.html'),(err)=>{
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});
router.get('/Prenotazione',(req,res)=>{
        res.sendFile(path.join(__dirname, '../public', 'index.html'),(err)=>{
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});

router.get('/Login',(req,res)=>{
    res.sendFile(path.join(__dirname, '../public', 'index.html'),(err)=>{
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});

router.get('/Registrazione',(req,res)=>{
    res.sendFile(path.join(__dirname, '../public', 'index.html'),(err)=>{
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});

router.get('/scrivi/Recensione',isLoggedIn,(req,res)=>{
    res.sendFile(path.join(__dirname, '../public', 'index.html'),(err)=>{
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        };
    });
});

module.exports= router;