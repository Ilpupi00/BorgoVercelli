/**
 * Middleware per controllare se l'utente è loggato
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        console.log("Loggato");
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
    res.status(403).send({ error: 'Forbidden' });
};

module.exports = { isLoggedIn, isAdmin };
