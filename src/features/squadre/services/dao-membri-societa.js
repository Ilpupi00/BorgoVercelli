/**
 * @fileoverview DAO per i membri della società (ruoli interni/dirigenziali)
 * Fornisce metodi per recuperare membri e singoli dettagli
 * @module features/squadre/services/dao-membri-societa
 */

const sqlite = require('../../../core/config/database');

/**
 * Classe helper per operazioni sui membri della società
 */
class MembriSocietaDAO {
    /**
     * Recupera tutti i membri della società con ruolo e immagine profilo
     * @async
     * @returns {Promise<Array<Object>>}
     */
    static async getMembriSocieta() {
        try {
            // Estraiamo i membri di interesse basandoci sul nome del tipo utente
            // (es. 'Presidente', 'Segretario', 'Gestore campo', 'Allenatore', 'Dirigente').
            // Usiamo il campo `tu.nome` invece degli ID per essere robusti ai cambiamenti
            // degli identificativi nella tabella TIPI_UTENTE.
            const sql = `
                SELECT u.id, u.nome, u.cognome, u.email, u.telefono, tu.nome as ruolo,
                       i.url as immagine_profilo
                FROM UTENTI u
                JOIN TIPI_UTENTE tu ON u.tipo_utente_id = tu.id
                LEFT JOIN IMMAGINI i ON i.entita_riferimento = 'utente'
                    AND i.entita_id = u.id
                    AND (i.ordine = 1 OR i.ordine IS NULL)
                WHERE LOWER(tu.nome) IN (
                    'presidente', 'vice-presidente', 'vice presidente',
                    'segretario', 'gestore', 'gestore campo',
                    'allenatore', 'dirigente', 'dirigente accompagnatore'
                )
                OR LOWER(tu.nome) LIKE '%gestor%'
                ORDER BY tu.nome, u.nome
            `;

            return new Promise((resolve, reject) => {
                sqlite.all(sql, (err, membri) => {
                    if (err) {
                        console.error('Errore nel recupero dei membri della società:', err);
                        return reject(err);
                    }
                    resolve(membri || []);
                });
            });
        } catch (error) {
            console.error('Errore nel recupero dei membri della società:', error);
            return [];
        }
    }

    /**
     * Recupera il dettaglio di un membro della società dato ID
     * @async
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    static async getMembroById(id) {
        try {
            const sql = `
                SELECT u.id, u.nome, u.cognome, u.email, u.telefono, tu.nome as ruolo,
                       i.url as immagine_profilo
                FROM UTENTI u
                JOIN TIPI_UTENTE tu ON u.tipo_utente_id = tu.id
                LEFT JOIN IMMAGINI i ON i.entita_riferimento = 'utente'
                    AND i.entita_id = u.id
                    AND (i.ordine = 1 OR i.ordine IS NULL)
                WHERE u.id = ? AND u.tipo_utente_id IN (2, 3, 4)
            `;

            return new Promise((resolve, reject) => {
                sqlite.get(sql, [id], (err, membro) => {
                    if (err) {
                        console.error('Errore nel recupero del membro della società:', err);
                        return reject(err);
                    }
                    resolve(membro || null);
                });
            });
        } catch (error) {
            console.error('Errore nel recupero del membro della società:', error);
            return null;
        }
    }
}

module.exports = MembriSocietaDAO;