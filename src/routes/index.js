'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const { isLoggedIn } = require('../middlewares/auth');
const daoNotizie = require('../services/dao-notizie');
const daoEventi = require('../services/dao-eventi');
const daoRecensioni = require('../services/dao-recensioni');

router.get('/Homepage', async (req, res) => {
    try {
        const notizie = await daoNotizie.getNotizie() || [];
        const eventi = await daoEventi.getEventi() || [];
        const recensioni = await daoRecensioni.getRecensioni() || [];
        res.render('homepage', {
            notizie: notizie,
            eventi: eventi,
            recensioni: recensioni
        });
    } catch (error) {
        console.error('Errore nel caricamento della homepage:', error);
        res.status(500).send('Internal Server Error');
    }
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

router.get('/registrazione',(req,res)=>{
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

router.get('/notizie/all',(req,res)=>{
    res.sendFile(path.join(__dirname, '../public', 'index.html'),(err)=>{
        if(err){
            console.log('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        }
    });

});

router.get('/eventi/all',(req,res)=>{
    res.sendFile(path.join(__dirname, '../public', 'index.html'),(err)=>{
        if(err){
            console.log('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});


module.exports= router;
