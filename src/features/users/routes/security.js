const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../../../core/middlewares/auth');
const DaoSecurity = require('../services/dao-security');

router.get('/me/security', isLoggedIn, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Dati Utente Base
        const userData = {
            name: `${req.user.nome || ''} ${req.user.cognome || ''}`.trim() || 'Utente Sconosciuto',
            level: 'High', // Potremmo calcolarlo in base al 2FA o password
            avatar: req.user.foto_oauth || '/assets/images/Campo.png'
        };

        // 2. Impostazioni Sicurezza dal DB
        let securitySettings = { twoFactorEnabled: false, backupCodes: [] };
        try {
            securitySettings = await DaoSecurity.getSecuritySettings(userId);
        } catch(e) {
            console.error("Errore recupero settings sicurezza:", e);
        }

        // 3. Attività Accessi dal DB (con fallback su mock se vuoto)
        let loginActivity = [];
        try {
            const history = await DaoSecurity.getUserAccessHistory(userId, 5);
            if (history && history.length > 0) {
                loginActivity = history.map(h => {
                    // Formattazione data
                    const d = new Date(h.creato_il);
                    const formattedDate = `${d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('it-IT', { hour: '2-digit', minute:'2-digit' })}`;
                    
                    return {
                        device: h.dispositivo || 'Unknown Device',
                        detail: h.browser ? `${h.browser} • ${h.sistema_operativo || 'OS'}` : (h.sistema_operativo || 'Unknown Browser'),
                        location: h.posizione || 'Posizione Sconosciuta',
                        date: formattedDate,
                        status: h.stato === 'RIUSCITO' ? 'Riuscito' : 'Bloccato'
                    };
                });
            }
        } catch(e) {
            console.error("Errore recupero cronologia accessi:", e);
        }

        // Se non ci sono dati veri nel db, forniamo il mock per mostrare il design
        if (loginActivity.length === 0) {
            loginActivity = [
                { device: 'MacBook Pro M2', detail: 'Safari 16.0', location: 'Milano, IT', date: 'Oggi, 10:45 AM', status: 'Riuscito' },
                { device: 'iPhone 14 Pro', detail: 'App iOS', location: 'Roma, IT', date: 'Ieri, 18:20 PM', status: 'Riuscito' },
                { device: 'Unknown Browser', detail: 'Windows 10', location: 'Mosca, RU', date: '2 Ott, 03:15 AM', status: 'Bloccato' }
            ];
        }

        // 4. Sessioni attive (Mock per ora, finché non c'è un tracciamento reale in Redis/DB)
        const activeSessions = [
            { device: 'MacBook Pro M2', isCurrent: true, location: 'Milano, IT', browser: 'Safari', lastActive: 'Ora' },
            { device: 'iPhone 14 Pro', isCurrent: false, location: 'Roma, IT', browser: 'App iOS', lastActive: '2 ore fa' }
        ];

        res.render('security', {
            user: userData,
            securityScore: securitySettings.twoFactorEnabled ? 98 : 65, // Esempio: Score basato sul 2FA
            passwordLastModified: '3 mesi fa', // Questo dovrebbe idealmente venire da DB
            twoFactorEnabled: securitySettings.twoFactorEnabled,
            loginActivity,
            activeSessions
        });

    } catch (error) {
        console.error("Errore durante il caricamento della dashboard di sicurezza:", error);
        res.status(500).send("Errore del server");
    }
});

module.exports = router;