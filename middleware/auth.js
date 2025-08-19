// middleware/auth.js
module.exports = function isLoggedIn(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    res.status(401).send({ error: 'Unauthorized' });
}
