/**
 * Middleware per controllare se l'utente è loggato
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    res.status(401).send({ error: 'Unauthorized' });
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
    res.status(403).json({ error: 'Forbidden' });
};

const isDirigente = function(req,res,next){
    if (req.isAuthenticated && req.isAuthenticated() && (req.user.tipo_utente_id === 2)) {
        return next();
    }
    res.status(403).send({ error: 'Forbidden' });
}

// Middleware che autorizza sia Admin che Dirigente
const isAdminOrDirigente = function(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated() && (req.user.tipo_utente_id === 1 || req.user.tipo_utente_id === 2)) {
        return next();
    }
    res.status(403).json({ error: 'Forbidden' });
}

const isSquadraDirigente =function(req,res,next){
    if (req.isAuthenticated && req.isAuthenticated() && (req.user.tipo_utente_id === 2 && (req.user.squadra_id === req.params.id))) {
        return next();
    }
    res.status(403).send({ error: 'Forbidden' });
}

module.exports = { isLoggedIn, isAdmin, isDirigente, isSquadraDirigente, isAdminOrDirigente };
