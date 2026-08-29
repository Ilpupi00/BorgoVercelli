const db = require('../../../core/config/database');

/**
 * Registra un'attività di accesso nel sistema
 * Usato per tracciare login riusciti, falliti o blocchi
 * @param {Object} logData - Dati del log
 * @param {number} logData.user_id - ID dell'utente
 * @param {string} logData.indirizzo_ip - Indirizzo IP del client
 * @param {string} [logData.dispositivo] - Descrizione del dispositivo
 * @param {string} [logData.browser] - Browser utilizzato
 * @param {string} [logData.sistema_operativo] - Sistema operativo
 * @param {string} logData.stato - Stato dell'evento (es. 'RIUSCITO', 'BLOCCATO', 'FALLITO')
 * @param {string} [logData.posizione] - Posizione approssimativa basata sull'IP
 */

exports.logAccessAttempt = async function(logData) {
    const query = `
        INSERT INTO ATTIVITA_ACCESSI (
            user_id, dispositivo, browser, sistema_operativo, indirizzo_ip, posizione, stato
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    try {
        await db.query(query, [
            logData.user_id,
            logData.dispositivo || null,
            logData.browser || null,
            logData.sistema_operativo || null,
            logData.indirizzo_ip,
            logData.posizione || null,
            logData.stato
        ]);
    } catch (error) {
        console.error('Errore nel log dell\'attività di accesso:', error);
        // Non lanciamo l'errore perché non vogliamo impedire il login se il logging fallisce
    }
};

/**
 * Recupera la cronologia degli accessi per un utente specifico
 * Ordina per data decrescente (i più recenti per primi)
 * @param {number} userId - ID dell'utente
 * @param {number} [limit=10] - Numero massimo di risultati da recuperare
 * @returns {Promise<Object[]>} Array di attività di accesso
 */
exports.getUserAccessHistory = async function(userId, limit = 10) {
    const query = `
        SELECT * FROM ATTIVITA_ACCESSI
        WHERE user_id = $1
        ORDER BY creato_il DESC
        LIMIT $2
    `;
    try {
        const result = await db.query(query, [userId, limit]);
        return result.rows;
    } catch (error) {
        console.error('Errore nel recupero della cronologia accessi:', error);
        throw error;
    }
};

/**
 * Abilita l'autenticazione a due fattori per un utente
 * Genera e salva il segreto e i codici di backup
 * @param {number} userId - ID dell'utente
 * @param {string} segreto - Segreto OTP generato (es. stringa BASE32)
 * @param {string[]} codiciBackup - Array di codici di backup
 * @returns {Promise<Object>} Conferma dell'operazione
 */
exports.enableTwoFactor = async function(userId, segreto, codiciBackup) {
    const query = `
        UPDATE UTENTI 
        SET due_fattori_attivo = TRUE, due_fattori_segreto = $1, codici_backup = $2
        WHERE id = $3
    `;
    try {
        await db.query(query, [segreto, JSON.stringify(codiciBackup), userId]);
        return { success: true, message: 'Autenticazione a due fattori abilitata con successo' };
    } catch (error) {
        console.error('Errore nell\'abilitazione del 2FA:', error);
        throw error;
    }
};

/**
 * Disabilita l'autenticazione a due fattori per un utente
 * @param {number} userId - ID dell'utente
 * @returns {Promise<Object>} Conferma dell'operazione
 */
exports.disableTwoFactor = async function(userId) {
    const query = `
        UPDATE UTENTI 
        SET due_fattori_attivo = FALSE, due_fattori_segreto = NULL, codici_backup = NULL
        WHERE id = $1
    `;
    try {
        await db.query(query, [userId]);
        return { success: true, message: 'Autenticazione a due fattori disabilitata con successo' };
    } catch (error) {
        console.error('Errore nel disabilitare il 2FA:', error);
        throw error;
    }
};

/**
 * Recupera le impostazioni di sicurezza di un utente
 * Include lo stato del 2FA e i codici di backup
 * @param {number} userId - ID dell'utente
 * @returns {Promise<Object>} Oggetto con le impostazioni di sicurezza
 */
exports.getSecuritySettings = async function(userId) {
    const query = `
        SELECT due_fattori_attivo, due_fattori_segreto, codici_backup
        FROM UTENTI
        WHERE id = $1
    `;
    try {
        const result = await db.query(query, [userId]);
        if (result.rows.length === 0) {
            throw new Error('Utente non trovato');
        }
        const user = result.rows[0];
        return {
            twoFactorEnabled: user.due_fattori_attivo,
            backupCodes: user.codici_backup || []
        };
    } catch (error) {
        console.error('Errore nel recupero delle impostazioni di sicurezza:', error);
        throw error;
    }
};

/**
 * Utilizza un codice di backup per invalidarlo (una tantum)
 * @param {number} userId - ID dell'utente
 * @param {string} codice - Codice di backup da utilizzare
 * @returns {Promise<Object>} Conferma dell'operazione
 */
exports.useBackupCode = async function(userId, codice) {
    const query = `
        UPDATE UTENTI 
        SET codici_backup = codici_backup - $1
        WHERE id = $2 AND codici_backup @> $3::jsonb
    `;
    try {
        const result = await db.query(query, [codice, userId, JSON.stringify([codice])]);
        if (result.rowCount === 0) {
            return { success: false, error: 'Codice di backup non valido o già utilizzato' };
        }
        return { success: true, message: 'Codice di backup utilizzato con successo' };
    } catch (error) {
        console.error('Errore nell\'utilizzo del codice di backup:', error);
        throw error;
    }
};

/**
 * Aggiorna il segreto OTP dopo una rotazione di dispositivi (es. nuovo telefono)
 * Mantiene validi i vecchi codici di backup per la transizione
 * @param {number} userId - ID dell'utente
 * @param {string} nuovoSegreto - Nuovo segreto OTP
 * @param {number} userId - ID dell'utente
 * @returns {Promise<Object>} Conferma dell'operazione
 */
exports.rotateTOTPSecret = async function(userId, nuovoSegreto) {
    // Nota: Non invalideremo i vecchi codici di backup qui per dare flessibilità all'utente
    // È responsabilità dell'utente usare i vecchi codici prima di generarne di nuovi se necessario
    const query = `
        UPDATE UTENTI 
        SET due_fattori_segreto = $1
        WHERE id = $2
    `;
    try {
        await db.query(query, [nuovoSegreto, userId]);
        return { success: true, message: 'Segreto OTP ruotato con successo. I vecchi codici di backup restano validi per la transizione.' };
    } catch (error) {
        console.error('Errore nella rotazione del segreto OTP:', error);
        throw error;
    }
};

/**
 * Aggiorna la data di modifica dell'ultima password
 * @param {number} userId
 * @returns {Promise<void>}
 */
exports.updatePasswordLastModified = async function(userId) {
    const query = `
        UPDATE UTENTI 
        SET ultima_modifica_password = CURRENT_TIMESTAMP
        WHERE id = $1
    `;
    try {
        await db.query(query, [userId]);
    } catch (error) {
        console.error('Errore nell\'aggiornamento della data di modifica password:', error);
        // Non lanciamo l'errore perché è un'operazione secondaria
    }
};

/**
 * Aggiorna 2FA
 * @param {Object} data - Dati dell'utente
 * @param {number} data.id - ID dell'utente
 * @param {boolean} data.due_fattori_attivo - Stato del 2FA
 * @param {string} data.due_fattori_segreto - Segreto OTP
 * @param {string[]} data.codici_backup - Codici di backup
 */
exports.updateTwoFactor = async function(data) {
    const query = `
        UPDATE UTENTI 
        SET due_fattori_attivo = $1, due_fattori_segreto = $2, codici_backup = $3
        WHERE id = $4
    `;
    try {
        await db.query(query, [
            data.due_fattori_attivo,
            data.due_fattori_segreto,
            data.codici_backup ? JSON.stringify(data.codici_backup) : null,
            data.id
        ]);
        return { success: true, message: 'Autenticazione a due fattori aggiornata con successo' };
    } catch (error) {
        console.error('Errore nell\'aggiornamento del 2FA:', error);
        throw error;
    }
};  
