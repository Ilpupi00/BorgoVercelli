/**
 * @fileoverview Middleware per recuperare informazioni utente autenticato
 * @module core/middlewares/getUser
 * @description Fornisce un endpoint per ottenere i dati dell'utente corrente in formato JSON.
 * Utilizzato dal frontend per verificare lo stato di autenticazione.
 */

/**
 * Restituisce i dati dell'utente attualmente autenticato
 * Utilizzato principalmente da chiamate AJAX per verificare lo stato di login
 * 
 * @function getLoggedUser
 * @param {Object} req - Oggetto richiesta Express (contiene req.user se autenticato)
 * @param {Object} res - Oggetto risposta Express
 * @returns {void} Risponde con JSON contenente dati utente o errore 401
 * 
 * @example
 * // Nel frontend
 * fetch('/api/current-user')
 *   .then(res => res.json())
 *   .then(user => console.log(user.email));
 */
module.exports = function getLoggedUser(req, res) {
    // Verifica che l'utente sia autenticato tramite Passport
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        // Restituisce l'oggetto utente completo
        res.json(req.user);
    } else {
        // Risponde con errore 401 Unauthorized
        res.status(401).json({ error: 'Non autenticato' });
    }
}
