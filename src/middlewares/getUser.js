// Restituisce l'utente loggato (se esiste) come JSON

const User= require('../models/user');

const makeUser=(row)=>{
    return new User(
        row.id,
        row.nome,
        row.cognome,
        row.email,
        row.telefono,
        row.tipo_utente_id
    );
}
module.exports = function getLoggedUser(req, res) {
    const user=makeUser(req.user);
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        res.json(User.to(user));
    } else {
        res.status(401).json({ error: 'Non autenticato' });
    }
}
