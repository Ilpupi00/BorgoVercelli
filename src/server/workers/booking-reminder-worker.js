/**
 * @fileoverview Worker per inviare promemoria automatici delle prenotazioni
 * @description Controlla periodicamente le prenotazioni imminenti e invia notifiche push
 * agli utenti per ricordare loro dell'appuntamento.
 * Invia notifiche 2 ore prima dell'inizio della prenotazione confermata.
 */

'use strict';

const db = require('../../core/config/database');
const { queueNotificationForUsers } = require('../../shared/services/notifications');

// Configurazione
const CONFIG = {
    CHECK_INTERVAL_MS: 60000 * 10,  // Controlla ogni 10 minuti
    REMINDER_HOURS_BEFORE: 2,        // Invia promemoria 2 ore prima
    REMINDER_WINDOW_MINUTES: 15      // Finestra di tolleranza ±15 minuti
};

let isRunning = false;
let checkInterval = null;

/**
 * Ottiene le prenotazioni che necessitano un promemoria
 * Trova prenotazioni confermate che iniziano tra 2 ore (±15 min) e che non hanno già ricevuto promemoria
 */
async function getBookingsNeedingReminder() {
    const query = `
        SELECT 
            p.id,
            p.utente_id,
            p.campo_id,
            p.data_prenotazione as data,
            p.ora_inizio,
            p.ora_fine,
            p.reminder_sent,
            c.nome as campo_nome,
            u.nome as utente_nome,
            u.cognome as utente_cognome
        FROM PRENOTAZIONI p
        JOIN CAMPI c ON p.campo_id = c.id
        JOIN UTENTI u ON p.utente_id = u.id
        WHERE p.stato = 'confermata'
        AND p.reminder_sent = false
        AND p.data_prenotazione = CURRENT_DATE
        AND (
            EXTRACT(EPOCH FROM (
                (p.data_prenotazione + p.ora_inizio::time) - NOW()
            )) / 3600 
        ) BETWEEN ${CONFIG.REMINDER_HOURS_BEFORE - 0.25} AND ${CONFIG.REMINDER_HOURS_BEFORE + 0.25}
        ORDER BY p.data_prenotazione, p.ora_inizio
    `;

    try {
        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error('[BOOKING-REMINDER] ❌ Errore nel recupero prenotazioni:', error);
        return [];
    }
}

/**
 * Marca una prenotazione come "promemoria inviato"
 */
async function markReminderSent(bookingId) {
    const query = `
        UPDATE PRENOTAZIONI 
        SET reminder_sent = true, 
            updated_at = NOW()
        WHERE id = $1
    `;
    
    try {
        await db.query(query, [bookingId]);
        return true;
    } catch (error) {
        console.error(`[BOOKING-REMINDER] ❌ Errore nell'aggiornamento prenotazione ${bookingId}:`, error);
        return false;
    }
}

/**
 * Invia un promemoria per una singola prenotazione
 */
async function sendBookingReminder(booking) {
    const { id, utente_id, campo_nome, data, ora_inizio, ora_fine, utente_nome, utente_cognome } = booking;
    
    // Formatta la data e l'ora
    const dataFormatted = new Date(data).toLocaleDateString('it-IT', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
    });
    
    const payload = {
        title: '⚽ Promemoria Prenotazione',
        body: `Ciao ${utente_nome}! Tra 2 ore hai la prenotazione al ${campo_nome} (${ora_inizio} - ${ora_fine})`,
        icon: '/assets/images/Logo.png',
        badge: '/assets/images/Logo.png',
        data: {
            url: '/profilo',
            type: 'booking_reminder',
            booking_id: id
        },
        actions: [
            {
                action: 'view',
                title: 'Vedi Prenotazione'
            }
        ]
    };

    try {
        console.log(`[BOOKING-REMINDER] 📬 Invio promemoria per prenotazione ${id} a utente ${utente_id}`);
        console.log(`[BOOKING-REMINDER] 📋 Dettagli: ${campo_nome} - ${dataFormatted} ${ora_inizio}-${ora_fine}`);
        
        // Accoda la notifica
        await queueNotificationForUsers([utente_id], payload);
        
        // Marca come inviato
        await markReminderSent(id);
        
        console.log(`[BOOKING-REMINDER] ✅ Promemoria inviato con successo per prenotazione ${id}`);
        return true;
    } catch (error) {
        console.error(`[BOOKING-REMINDER] ❌ Errore nell'invio promemoria per prenotazione ${id}:`, error);
        return false;
    }
}

/**
 * Esegue il controllo e l'invio dei promemoria
 */
async function processReminders() {
    if (isRunning) {
        console.log('[BOOKING-REMINDER] ⏭️  Check già in esecuzione, skip...');
        return;
    }

    isRunning = true;
    console.log('[BOOKING-REMINDER] 🔍 Controllo prenotazioni per promemoria...');

    try {
        const bookings = await getBookingsNeedingReminder();
        
        if (bookings.length === 0) {
            console.log('[BOOKING-REMINDER] ✅ Nessuna prenotazione necessita promemoria al momento');
            return;
        }

        console.log(`[BOOKING-REMINDER] 📋 Trovate ${bookings.length} prenotazione/i da notificare`);

        let successCount = 0;
        let failureCount = 0;

        // Processa ogni prenotazione
        for (const booking of bookings) {
            const success = await sendBookingReminder(booking);
            if (success) {
                successCount++;
            } else {
                failureCount++;
            }
            
            // Piccolo delay tra i promemoria per non sovraccaricare
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`[BOOKING-REMINDER] 📊 Riepilogo: ${successCount} successo, ${failureCount} falliti`);

    } catch (error) {
        console.error('[BOOKING-REMINDER] ❌ Errore nel processamento promemoria:', error);
    } finally {
        isRunning = false;
    }
}

/**
 * Avvia il worker di promemoria
 */
function start() {
    if (checkInterval) {
        console.log('[BOOKING-REMINDER] ⚠️  Worker già avviato');
        return;
    }

    console.log(`[BOOKING-REMINDER] 🚀 Avvio worker promemoria prenotazioni`);
    console.log(`[BOOKING-REMINDER] ⏰ Controllo ogni ${CONFIG.CHECK_INTERVAL_MS / 60000} minuti`);
    console.log(`[BOOKING-REMINDER] 📢 Promemoria inviato ${CONFIG.REMINDER_HOURS_BEFORE} ore prima`);

    // Esegui subito il primo controllo
    processReminders();

    // Poi controlla periodicamente
    checkInterval = setInterval(processReminders, CONFIG.CHECK_INTERVAL_MS);
}

/**
 * Ferma il worker di promemoria
 */
function stop() {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
        console.log('[BOOKING-REMINDER] 🛑 Worker promemoria fermato');
    }
}

/**
 * Controlla se il worker è attivo
 */
function isActive() {
    return checkInterval !== null;
}

module.exports = {
    start,
    stop,
    isActive,
    processReminders // Esporta per testing manuale
};
