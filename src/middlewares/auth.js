/**
 * Middleware per controllare se l'utente è loggato
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const dao = require('../services/dao-notizie');

const isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        res.status(401).json({ error: 'Unauthorized' });
    } else {
        res.status(401).render('error', { message: 'Accesso negato: devi essere loggato', error: { status: 401 } });
    }
};
/**
 * Middleware per controllare se l'utente è un admin
 * @param {Context} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const isAdmin = function(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated() && req.user.tipo_utente_id === 1) {
        return next();
    }
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        res.status(403).json({ error: 'Forbidden' });
    } else {
        res.status(403).render('error', { message: 'Accesso negato: devi essere amministratore', error: { status: 403 } });
    }
};

const isDirigente = function(req,res,next){
    if (req.isAuthenticated && req.isAuthenticated() && (req.user.tipo_utente_id === 2)) {
        return next();
    }
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        res.status(403).json({ error: 'Forbidden' });
    } else {
        res.status(403).render('error', { message: 'Accesso negato: devi essere dirigente', error: { status: 403 } });
    }
}

// Middleware che autorizza sia Admin che Dirigente
const isAdminOrDirigente = function(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated() && (req.user.tipo_utente_id === 1 || req.user.tipo_utente_id === 2)) {
        return next();
    }
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        res.status(403).json({ error: 'Forbidden' });
    } else {
        res.status(403).render('error', { message: 'Accesso negato: devi essere amministratore o dirigente', error: { status: 403 } });
    }
}

const isSquadraDirigente = async function(req,res,next){
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            res.status(401).json({ error: 'Unauthorized' });
        } else {
            res.status(401).render('error', { message: 'Accesso negato: devi essere loggato', error: { status: 401 } });
        }
        return;
    }

    if (req.user.tipo_utente_id !== 2) {
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            res.status(403).json({ error: 'Forbidden' });
        } else {
            res.status(403).render('error', { message: 'Accesso negato: devi essere dirigente', error: { status: 403 } });
        }
        return;
    }

    try {
        const daoDirigenti = require('../services/dao-dirigenti-squadre');
        const dirigente = await daoDirigenti.getDirigenteByUserId(req.user.id);
        if (dirigente && dirigente.squadra_id == req.params.id) {
            return next();
        } else {
            if (req.headers.accept && req.headers.accept.includes('application/json')) {
                res.status(403).json({ error: 'Forbidden' });
            } else {
                res.status(403).render('error', { message: 'Accesso negato: devi essere dirigente della squadra', error: { status: 403 } });
            }
        }
    } catch (error) {
        console.error('Errore verifica dirigente:', error);
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.status(500).render('error', { message: 'Errore interno del server', error: {} });
        }
    }
}

const canEditNotizia = async function(req, res, next) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(401).json({ error: 'Unauthorized' });
        } else {
            return res.status(401).render('error', { message: 'Accesso negato: devi essere loggato', error: { status: 401 } });
        }
    }

    const user = req.user;
    if (user.tipo_utente_id === 1) { // admin
        return next();
    }

    if (user.tipo_utente_id === 2) { // dirigente
        try {
            const notizia = await dao.getNotiziaById(req.params.id);
            if (notizia && notizia.autore_id == user.id) {
                return next();
            }
            else{
                console.log('Utente dirigente non è autore della notizia');
            }
        } catch (error) {
            console.error('Errore nel recupero notizia per permessi:', error);
        }
    }

    // forbidden
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        res.status(403).json({ error: 'Forbidden' });
    } else {
        res.status(403).render('error', { message: 'Accesso negato: non hai permessi per modificare questa notizia', error: { status: 403 } });
    }
};

module.exports = { isLoggedIn, isAdmin, isDirigente, isSquadraDirigente, isAdminOrDirigente, canEditNotizia };
