/**
 * @fileoverview Worker per inviare promemoria automatici delle prenotazioni
 * @description Controlla periodicamente le prenotazioni imminenti e invia notifiche push
 * gli utenti per ricordare loro dell'appuntamento tramite Redis queue.
 * Invia notifiche 2 ore prima dell'inizio della prenotazione confermata.
 */

"use strict";

const db = require("../../core/config/database");
const { redisQueueClient, redisClient } = require("../../core/config/redis");
const {
  queueNotificationForUsers,
} = require("../../shared/services/notifications");
const emailService = require("../../shared/services/email-service");

// Configurazione
const CONFIG = {
  CHECK_INTERVAL_MS: 60000 * 10, // Controlla ogni 10 minuti
  REMINDER_HOURS_BEFORE: 2, // Invia promemoria 2 ore prima
  REMINDER_WINDOW_MINUTES: 15, // Finestra di tolleranza ±15 minuti
};

let isRunning = false;
let checkInterval = null;

/**
 * Ottiene le prenotazioni che necessitano un promemoria
 * Trova prenotazioni confermate che iniziano tra 2 ore (±15 min)
 * Controlla i reminder inviati in Redis
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
            c.nome as campo_nome,
            u.nome as utente_nome,
            u.cognome as utente_cognome,
            u.email as utente_email
        FROM PRENOTAZIONI p
        JOIN CAMPI c ON p.campo_id = c.id
        JOIN UTENTI u ON p.utente_id = u.id
        WHERE p.stato = 'confermata'
        AND p.data_prenotazione = CURRENT_DATE
        AND (
            EXTRACT(EPOCH FROM (
                (p.data_prenotazione + p.ora_inizio::time) - NOW()
            )) / 3600 
        ) BETWEEN ${CONFIG.REMINDER_HOURS_BEFORE - 0.25} AND ${
    CONFIG.REMINDER_HOURS_BEFORE + 0.25
  }
        ORDER BY p.data_prenotazione, p.ora_inizio
    `;

  try {
    const result = await db.query(query);

    // Filtra: mantieni solo prenotazioni che non hanno già ricevuto reminder
    const filtered = [];
    for (const booking of result.rows) {
      const reminderKey = `booking:reminder:sent:${booking.id}`;
      const alreadySent = await redisClient.exists(reminderKey);

      if (!alreadySent) {
        filtered.push(booking);
      }
    }

    return filtered;
  } catch (error) {
    console.error(
      "[BOOKING-REMINDER] ❌ Errore nel recupero prenotazioni:",
      error
    );
    return [];
  }
}

/**
 * Marca una prenotazione come "promemoria inviato" in Redis
 */
async function markReminderSent(bookingId) {
  const reminderKey = `booking:reminder:sent:${bookingId}`;

  try {
    // Salva in Redis con TTL di 24 ore (per evitare duplicati nello stesso giorno)
    await redisClient.setEx(reminderKey, 86400, "true");
    return true;
  } catch (error) {
    console.error(
      `[BOOKING-REMINDER] ❌ Errore nel salvare reminder in Redis ${bookingId}:`,
      error
    );
    return false;
  }
}

/**
 * Invia un promemoria per una singola prenotazione
 */
async function sendBookingReminder(booking) {
  const {
    id,
    utente_id,
    campo_nome,
    data,
    ora_inizio,
    ora_fine,
    utente_nome,
    utente_cognome,
  } = booking;

  // Formatta la data e l'ora
  const dataFormatted = new Date(data).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const payload = {
    title: "⚽ Promemoria Prenotazione",
    body: `Ciao ${utente_nome}! Tra 2 ore hai la prenotazione al ${campo_nome} (${ora_inizio} - ${ora_fine})`,
    icon: "/assets/images/Logo.png",
    badge: "/assets/images/Logo.png",
    data: {
      url: "/profilo",
      type: "booking_reminder",
      booking_id: id,
    },
    actions: [
      {
        action: "view",
        title: "Vedi Prenotazione",
      },
    ],
  };

  try {
    console.log(
      `[BOOKING-REMINDER] 📬 Invio promemoria per prenotazione ${id} a utente ${utente_id}`
    );
    console.log(
      `[BOOKING-REMINDER] 📋 Dettagli: ${campo_nome} - ${dataFormatted} ${ora_inizio}-${ora_fine}`
    );

    // Accoda la notifica push
    await queueNotificationForUsers([utente_id], payload);

    // Invia email promemoria all'utente
    const prenotazioneDetails = {
      dataOra: `${dataFormatted} dalle ${ora_inizio} alle ${ora_fine}`,
      attivita: campo_nome,
      luogo: campo_nome,
    };
    const nomeCompleto = `${utente_nome || ""} ${utente_cognome || ""}`.trim() || "Utente";

    if (booking.utente_email) {
      emailService
        .sendReminderEmail(
          booking.utente_email,
          nomeCompleto,
          prenotazioneDetails,
          { isAdmin: false }
        )
        .then(() =>
          console.log(
            `[BOOKING-REMINDER] \u2709\uFE0F Email promemoria inviata all'utente ${booking.utente_email}`
          )
        )
        .catch((err) =>
          console.error(
            `[BOOKING-REMINDER] \u274C Errore invio email promemoria all'utente:`,
            err
          )
        );
    }

    // Invia email promemoria all'admin
    const adminEmail =
      process.env.ADMIN_EMAIL || "info.asdborgovercelli2022@gmail.com";
    emailService
      .sendReminderEmail(adminEmail, nomeCompleto, prenotazioneDetails, {
        isAdmin: true,
      })
      .then(() =>
        console.log(
          `[BOOKING-REMINDER] \u2709\uFE0F Email promemoria inviata all'admin`
        )
      )
      .catch((err) =>
        console.error(
          `[BOOKING-REMINDER] \u274C Errore invio email promemoria all'admin:`,
          err
        )
      );

    // Marca come inviato
    await markReminderSent(id);

    console.log(
      `[BOOKING-REMINDER] ✅ Promemoria inviato con successo per prenotazione ${id}`
    );
    return true;
  } catch (error) {
    console.error(
      `[BOOKING-REMINDER] ❌ Errore nell'invio promemoria per prenotazione ${id}:`,
      error
    );
    return false;
  }
}

/**
 * Esegue il controllo e l'invio dei promemoria
 */
async function processReminders() {
  if (isRunning) {
    console.log("[BOOKING-REMINDER] ⏭️  Check già in esecuzione, skip...");
    return;
  }

  isRunning = true;
  console.log("[BOOKING-REMINDER] 🔍 Controllo prenotazioni per promemoria...");

  try {
    const bookings = await getBookingsNeedingReminder();

    if (bookings.length === 0) {
      console.log(
        "[BOOKING-REMINDER] ✅ Nessuna prenotazione necessita promemoria al momento"
      );
      return;
    }

    console.log(
      `[BOOKING-REMINDER] 📋 Trovate ${bookings.length} prenotazione/i da notificare`
    );

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
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(
      `[BOOKING-REMINDER] 📊 Riepilogo: ${successCount} successo, ${failureCount} falliti`
    );
  } catch (error) {
    console.error(
      "[BOOKING-REMINDER] ❌ Errore nel processamento promemoria:",
      error
    );
  } finally {
    isRunning = false;
  }
}

/**
 * Avvia il worker di promemoria
 */
function start() {
  if (checkInterval) {
    console.log("[BOOKING-REMINDER] ⚠️  Worker già avviato");
    return;
  }

  console.log(`[BOOKING-REMINDER] 🚀 Avvio worker promemoria prenotazioni`);
  console.log(
    `[BOOKING-REMINDER] ⏰ Controllo ogni ${
      CONFIG.CHECK_INTERVAL_MS / 60000
    } minuti`
  );
  console.log(
    `[BOOKING-REMINDER] 📢 Promemoria inviato ${CONFIG.REMINDER_HOURS_BEFORE} ore prima`
  );

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
    console.log("[BOOKING-REMINDER] 🛑 Worker promemoria fermato");
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
  processReminders, // Esporta per testing manuale
};
