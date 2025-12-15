/**
 * @fileoverview Middleware di autenticazione e autorizzazione
 * @module core/middlewares/auth
 * @description Fornisce middleware per verificare autenticazione e autorizzazioni utente.
 * Gestisce controlli per login, ruoli admin/dirigente, e stato account (sospeso/bannato).
 */

const dao = require('../../features/notizie/services/dao-notizie');
const moment = require('moment');

/**
 * Middleware per verificare se l'utente è autenticato
 * Controlla anche lo stato dell'account (attivo, sospeso, bannato)
 * 
 * @function isLoggedIn
 * @param {Object} req - Oggetto richiesta Express
 * @param {Object} res - Oggetto risposta Express
 * @param {Function} next - Callback next di Express
 * @returns {void}
 * 
 * @example
 * router.get('/profilo', isLoggedIn, (req, res) => {
 *   res.render('profilo');
 * });
 */
const isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        // Safety: ensure req.user is present. In some edge cases passport may report
        // isAuthenticated() true while req.user is null/undefined; handle gracefully.
        if (!req.user) {
            console.error('isLoggedIn: isAuthenticated() true but req.user is null');
            if (req.headers.accept && req.headers.accept.includes('application/json')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            return res.status(401).render('error', { message: 'Accesso negato: devi essere loggato', error: { status: 401 } });
        }
        // Verifica stato utente (sospeso/bannato)
        if (req.user.isBannato && req.user.isBannato()) {
            req.logout(function(err) {
                if (err) { console.error('Errore logout:', err); }
            });
            if (req.headers.accept && req.headers.accept.includes('application/json')) {
                return res.status(403).json({ 
                    error: 'Account bannato', 
                    message: 'Il tuo account è stato bannato. Contatta l\'amministrazione per maggiori informazioni.' 
                });
            } else {
                return res.status(403).render('error', { 
                    message: 'Account bannato: il tuo account è stato bannato dal sito. Contatta l\'amministrazione per maggiori informazioni.', 
                    error: { status: 403 } 
                });
            }
        }
        
        if (req.user.isSospeso && req.user.isSospeso()) {
            // Verifica se la sospensione è scaduta
            if (req.user.isSospensioneScaduta && req.user.isSospensioneScaduta()) {
                // Sospensione scaduta, riattiva automaticamente
                const userDao = require('../../features/users/services/dao-user');
                userDao.revocaSospensioneBan(req.user.id).catch(err => {
                    console.error('Errore riattivazione automatica:', err);
                });
                // Continua l'accesso
                return next();
            }
            
            req.logout(function(err) {
                if (err) { console.error('Errore logout:', err); }
            });
            
            const dataFine = req.user.data_fine_sospensione 
                ? moment(req.user.data_fine_sospensione).format('DD/MM/YYYY HH:mm')
                : 'Non specificato';
            
            if (req.headers.accept && req.headers.accept.includes('application/json')) {
                return res.status(403).json({ 
                    error: 'Account sospeso', 
                    message: `Il tuo account è sospeso fino al ${dataFine}. Motivo: ${req.user.motivo_sospensione || 'Non specificato'}` 
                });
            } else {
                return res.status(403).render('error', { 
                    message: `Account sospeso: il tuo account è temporaneamente sospeso fino al ${dataFine}. Motivo: ${req.user.motivo_sospensione || 'Non specificato'}`, 
                    error: { status: 403 } 
                });
            }
        }
        
        return next();
    }
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        res.status(401).json({ error: 'Unauthorized' });
    } else {
        res.status(401).render('error', { message: 'Accesso negato: devi essere loggato', error: { status: 401 } });
    }
};

/**
 * Middleware per verificare se l'utente è amministratore
 * Controlla che l'utente sia autenticato e abbia tipo_utente_id === 1
 * 
 * @function isAdmin
 * @param {Object} req - Oggetto richiesta Express
 * @param {Object} res - Oggetto risposta Express
 * @param {Function} next - Callback next di Express
 * @returns {void}
 */
const isAdmin = function(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated() && req.user.tipo_utente_id === 1) {
        return next();
    }
    // Risposta di errore 403 Forbidden
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        res.status(403).json({ error: 'Forbidden' });
    } else {
        res.status(403).render('error', { message: 'Accesso negato: devi essere amministratore', error: { status: 403 } });
    }
};

/**
 * Middleware per verificare se l'utente è dirigente
 * Controlla che l'utente sia autenticato e abbia tipo_utente_id === 2
 * 
 * @function isDirigente
 * @param {Object} req - Oggetto richiesta Express
 * @param {Object} res - Oggetto risposta Express
 * @param {Function} next - Callback next di Express
 * @returns {void}
 */
const isDirigente = function(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated() && (req.user.tipo_utente_id === 2)) {
        return next();
    }
    // Risposta di errore 403 Forbidden
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        res.status(403).json({ error: 'Forbidden' });
    } else {
        res.status(403).render('error', { message: 'Accesso negato: devi essere dirigente', error: { status: 403 } });
    }
}

/**
 * Middleware che autorizza sia amministratori che dirigenti
 * Permette l'accesso agli utenti con tipo_utente_id === 1 O tipo_utente_id === 2
 * 
 * @function isAdminOrDirigente
 * @param {Object} req - Oggetto richiesta Express
 * @param {Object} res - Oggetto risposta Express
 * @param {Function} next - Callback next di Express
 * @returns {void}
 */
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

    // Admin (1), Presidente (2), Vicepresidente (3) e Segretario (5) possono gestire tutte le squadre
    if (req.user.tipo_utente_id === 1 || req.user.tipo_utente_id === 2 || 
        req.user.tipo_utente_id === 3 || req.user.tipo_utente_id === 5) {
        return next();
    }

    // Verifica se è un Dirigente (4) e se gestisce la squadra specifica
    if (req.user.tipo_utente_id !== 4) {
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            res.status(403).json({ error: 'Forbidden' });
        } else {
            res.status(403).render('error', { message: 'Accesso negato: permessi insufficienti', error: { status: 403 } });
        }
        return;
    }

    try {
        const daoDirigenti = require('../../features/squadre/services/dao-dirigenti-squadre');
        const dirigenti = await daoDirigenti.getDirigenteByUserId(req.user.id);
        // dirigenti è ora un array di squadre
        const gestisceSquadra = dirigenti && dirigenti.some(d => d.squadra_id == req.params.id);
        
        if (gestisceSquadra) {
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
    // Admin (1), Presidente (2), Vicepresidente (3) e Segretario (5) possono modificare tutte le notizie
    if (user.tipo_utente_id === 1 || user.tipo_utente_id === 2 || 
        user.tipo_utente_id === 3 || user.tipo_utente_id === 5) {
        return next();
    }

    // Dirigente (4) può modificare solo le proprie notizie
    if (user.tipo_utente_id === 4) {
        try {
            const id = parseInt(req.params.id, 10);
            if (!Number.isInteger(id)) {
                console.log('canEditNotizia: id non valido', req.params.id);
            } else {
                const notizia = await dao.getNotiziaById(id);
                if (notizia && notizia.autore_id == user.id) {
                    return next();
                }
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

/**
 * Middleware per verificare se l'utente è Gestore Campo
 * Controlla che l'utente sia autenticato e abbia tipo_utente_id === 6
 * 
 * @function isGestoreCampo
 * @param {Object} req - Oggetto richiesta Express
 * @param {Object} res - Oggetto risposta Express
 * @param {Function} next - Callback next di Express
 * @returns {void}
 */
const isGestoreCampo = function(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated() && req.user.tipo_utente_id === 6) {
        return next();
    }
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        res.status(403).json({ error: 'Forbidden' });
    } else {
        res.status(403).render('error', { message: 'Accesso negato: devi essere gestore campo', error: { status: 403 } });
    }
};

/**
 * Middleware che autorizza Admin, Presidente, Vicepresidente, Segretario e Gestore Campo
 * Permette l'accesso agli utenti con gestione privilegi
 * 
 * @function isStaffOrAdmin
 * @param {Object} req - Oggetto richiesta Express
 * @param {Object} res - Oggetto risposta Express
 * @param {Function} next - Callback next di Express
 * @returns {void}
 */
const isStaffOrAdmin = function(req, res, next) {
    // Staff (Admin, Presidente, Vice Presidente, Segretario) — NOT Gestore Campo
    if (req.isAuthenticated && req.isAuthenticated() && 
        (req.user.tipo_utente_id === 1 || req.user.tipo_utente_id === 2 || 
         req.user.tipo_utente_id === 3 || req.user.tipo_utente_id === 5)) {
        return next();
    }
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        res.status(403).json({ error: 'Forbidden' });
    } else {
        res.status(403).render('error', { message: 'Accesso negato: permessi insufficienti', error: { status: 403 } });
    }
};

/**
 * Middleware per verificare gestione campi e prenotazioni
 * Admin (1), Presidente (2), Vicepresidente (3), Segretario (5) e Gestore Campo (6)
 * 
 * @function canManageCampi
 * @param {Object} req - Oggetto richiesta Express
 * @param {Object} res - Oggetto risposta Express
 * @param {Function} next - Callback next di Express
 * @returns {void}
 */
const canManageCampi = function(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated() && 
        (req.user.tipo_utente_id === 1 || req.user.tipo_utente_id === 2 || 
         req.user.tipo_utente_id === 3 || req.user.tipo_utente_id === 5 || 
         req.user.tipo_utente_id === 6)) {
        return next();
    }
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        res.status(403).json({ error: 'Forbidden' });
    } else {
        res.status(403).render('error', { message: 'Accesso negato: non hai permessi per gestire i campi', error: { status: 403 } });
    }
};

module.exports = { 
    isLoggedIn, 
    isAdmin, 
    isDirigente, 
    isSquadraDirigente, 
    isAdminOrDirigente, 
    canEditNotizia,
    isGestoreCampo,
    isStaffOrAdmin,
    canManageCampi
};
