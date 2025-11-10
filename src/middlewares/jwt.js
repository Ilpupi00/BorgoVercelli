const jwt = require('jsonwebtoken');
const userDao = require('../services/dao-user');

// Secret per JWT (dovrebbe essere in .env in produzione)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRY = '7d'; // Token valido per 7 giorni

/**
 * Genera un JWT token per l'utente
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
 * Verifica e decodifica un JWT token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

/**
 * Middleware per verificare il JWT e ripristinare la sessione
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
