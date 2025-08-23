
module.exports = function isLoggedIn(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        console.log("Loggato");
        return next();
    }
    res.status(401).send({ error: 'Unauthorized' });
}
