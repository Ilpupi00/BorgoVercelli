// Restituisce l'utente loggato (se esiste) come JSON

module.exports = function getLoggedUser(req, res) {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        res.json(req.user);
    } else {
        res.status(401).json({ error: 'Non autenticato' });
    }
}
