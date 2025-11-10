/**
 * @fileoverview Gestione autenticazione JWT per "Ricordami"
 * @module core/middlewares/jwt
 * @description Fornisce funzionalità per generare, verificare e gestire token JWT.
 * Permette agli utenti di rimanere autenticati tra sessioni diverse tramite cookie.
 */

const jwt = require('jsonwebtoken');
const userDao = require('../../features/users/services/dao-user');

/**
 * Chiave segreta per firmare i JWT
 * In produzione dovrebbe essere caricata da variabile d'ambiente
 * @constant {string}
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * Durata di validità del token JWT
 * @constant {string}
 */
const JWT_EXPIRY = '7d'; // Token valido per 7 giorni

/**
 * Genera un token JWT per l'utente
 * Codifica informazioni base dell'utente nel payload
 * 
 * @function generateToken
 * @param {Object} user - Oggetto utente con id, email e tipo_utente_id
 * @returns {string} Token JWT firmato
 * 
 * @example
 * const token = generateToken({ id: 1, email: 'user@example.com', tipo_utente_id: 3 });
 */
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email,
            tipo_utente_id: user.tipo_utente_id 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
}

/**
 * Verifica e decodifica un token JWT
 * 
 * @function verifyToken
 * @param {string} token - Token JWT da verificare
 * @returns {Object|null} Payload decodificato o null se token invalido
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

/**
 * Middleware Express per autenticazione automatica tramite JWT
 * Se l'utente non è autenticato ma ha un token JWT valido, ripristina la sessione
 * 
 * @async
 * @function jwtAuth
 * @param {Object} req - Oggetto richiesta Express
 * @param {Object} res - Oggetto risposta Express
 * @param {Function} next - Callback next di Express
 * @returns {Promise<void>}
 */
async function jwtAuth(req, res, next) {
    // Se l'utente è già autenticato tramite sessione, continua
    if (req.isAuthenticated()) {
        return next();
    }

    // Non applicare JWT auth durante logout
    if (req.path === '/Logout' || req.path === '/logout') {
        return next();
    }

    // Cerca il token JWT nei cookie
    const token = req.cookies.rememberToken;
    
    if (!token) {
        return next();
    }

    // Verifica il token
    const decoded = verifyToken(token);
    
    if (!decoded) {
        // Token non valido, rimuovi il cookie
        res.clearCookie('rememberToken');
        return next();
    }

    try {
        // Recupera l'utente dal database
        const user = await userDao.getUserById(decoded.id);
        
        if (!user) {
            res.clearCookie('rememberToken');
            return next();
        }

        // Effettua il login automatico
        req.logIn(user, (err) => {
            if (err) {
                console.error('Errore login automatico:', err);
                res.clearCookie('rememberToken');
                return next();
            }
            next();
        });
    } catch (err) {
        console.error('Errore JWT auth:', err);
        res.clearCookie('rememberToken');
        next();
    }
}

module.exports = {
    generateToken,
    verifyToken,
    jwtAuth
};
