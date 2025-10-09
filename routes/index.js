'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const { isLoggedIn } = require('../middleware/auth');
const daoNotizie = require('../dao/dao-notizie');
const daoEventi = require('../dao/dao-eventi');
const daoRecensioni = require('../dao/dao-recensioni');

router.get('/homepage', async (req, res) => {
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

router.get('/campionato',(req,res)=>{
        res.sendFile(path.join(__dirname, '../public', 'index.html'),(err)=>{
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});

router.get('/squadre',(req,res)=>{
        res.sendFile(path.join(__dirname, '../public', 'index.html'),(err)=>{
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});

router.get('/galleria',(req,res)=>{
        res.sendFile(path.join(__dirname, '../public', 'index.html'),(err)=>{
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});
router.get('/societa',(req,res)=>{
        res.sendFile(path.join(__dirname, '../public', 'index.html'),(err)=>{
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});
router.get('/prenotazione',(req,res)=>{
        res.sendFile(path.join(__dirname, '../public', 'index.html'),(err)=>{
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});

router.get('/login',(req,res)=>{
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
