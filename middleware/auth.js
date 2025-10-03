
const isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        console.log("Loggato");
        return next();
    }
    res.status(401).send({ error: 'Unauthorized' });
};

const isAdmin = function(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated() && req.user.tipo_utente_id === 1) {
        return next();
    }
    res.status(403).send({ error: 'Forbidden' });
};

module.exports = { isLoggedIn, isAdmin };
