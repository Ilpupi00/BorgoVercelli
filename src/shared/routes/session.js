"use strict";

const express = require("express");
const router = express.Router();
const passport = require("passport");
const getLoggedUser = require("../../core/middlewares/getUser");
const { generateToken } = require("../../core/middlewares/jwt");
const { redisClient } = require("../../core/config/redis");

// Login
router.post("/session", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user)
      return res.status(401).json({ error: info?.message || "Login fallito" });

    // Verifica stato utente prima del login
    if (user.isBannato && user.isBannato()) {
      return res.status(403).json({
        error: "Account bannato",
        type: "banned",
        message:
          "Il tuo account è stato bannato permanentemente. Contatta l'amministrazione per maggiori informazioni.",
      });
    }

    if (user.isSospeso && user.isSospeso()) {
      // Recupera dettagli sospensione dalla tabella dedicata
      const daoSospensioni = require("../../features/users/services/dao-sospensioni");
      return daoSospensioni.getByUtenteId(user.id).then((sospensione) => {
        // Verifica se la sospensione è scaduta
        if (sospensione && sospensione.data_fine && new Date(sospensione.data_fine) < new Date()) {
          // Sospensione scaduta, riattiva automaticamente
          daoSospensioni.revocaSospensioneBan(user.id).catch((err) => {
            console.error("Errore riattivazione automatica:", err);
          });
          // Continua con il login
          return doLogin(req, res, next, user);
        } else {
          const moment = require("moment");
          const dataFine = sospensione && sospensione.data_fine
            ? moment(sospensione.data_fine).format("DD/MM/YYYY HH:mm")
            : "Non specificato";
          return res.status(403).json({
            error: "Account sospeso",
            type: "suspended",
            message: `Il tuo account è temporaneamente sospeso fino al ${dataFine}. Motivo: ${
              (sospensione && sospensione.motivo) || "Non specificato"
            }`,
            dataFine: dataFine,
            motivo: (sospensione && sospensione.motivo) || "Non specificato",
          });
        }
      }).catch((err) => {
        console.error("Errore recupero sospensione:", err);
        return doLogin(req, res, next, user);
      });
    }

    doLogin(req, res, next, user);
  })(req, res, next);
});

/**
 * Helper: esegue il login effettivo dell'utente (dopo i controlli stato)
 */
function doLogin(req, res, next, user) {
  req.logIn(user, async (err) => {
      if (err) return next(err);

      // Log sessione salvata in Redis
      console.log(
        `[SESSION] 📝 Sessione creata per utente ${user.id} (${user.email})`
      );
      console.log(`[SESSION] 🔑 Session ID: ${req.sessionID}`);
      console.log(`[SESSION] 💾 Salvata in Redis con TTL: 7 giorni`);

      // Se l'utente ha selezionato "Ricordami", genera un JWT token
      if (req.body.remember) {
        const token = generateToken(user);
        // Imposta il cookie con il token JWT (valido 7 giorni)
        res.cookie("rememberToken", token, {
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 giorni
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", // Solo HTTPS in produzione
          sameSite: "lax",
        });
      }

      // Controlla se l'utente ha già una subscription attiva
      let hasSubscription = false;
      try {
        const pushService = require("./webpush");
        const subscriptions = pushService.loadSubscriptions();
        hasSubscription = subscriptions.some(
          (s) => String(s.userId) === String(user.id)
        );
      } catch (subErr) {
        console.error("[LOGIN] Errore verifica subscription:", subErr);
      }

      return res.status(200).json({
        message: "Login effettuato",
        showNotificationPrompt: !hasSubscription,
        tipo_utente_id: user.tipo_utente_id,
        isAdmin: user.tipo_utente_id === 1,
      });
  });
}

// Logout
router.delete("/session", (req, res, next) => {
  const sessionID = req.sessionID;
  const userId = req.user?.id || "unknown";

  req.logout(function (err) {
    if (err) return next(err);

    // Log sessione cancellata da Redis
    console.log(`[SESSION] 📝 Sessione cancellata per utente ${userId}`);
    console.log(`[SESSION] 🔑 Session ID: ${sessionID}`);
    console.log(`[SESSION] 🗑️  Rimossa da Redis`);

    // Rimuovi il token JWT se presente
    res.clearCookie("rememberToken");
    res.status(200).json({ message: "Logout effettuato" });
  });
});

// Rotta GET per evitare "Cannot GET /session"
router.get("/session", (req, res) => {
  res.status(405).json({ error: "Metodo non consentito" });
});

router.get("/session/user", getLoggedUser);

/**
 * Endpoint per ottenere statistiche sessioni Redis
 * Usato per debugging e monitoraggio
 * Requires: admin role
 */
router.get("/session/stats/redis", async (req, res) => {
  try {
    // Solo admin può accedere
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: "Non autorizzato" });
    }

    // Ottieni tutte le sessioni da Redis
    const sessionKeys = await redisClient.keys("sess:*");

    console.log(`[SESSION] 📊 Richiesta statistiche sessioni Redis`);
    console.log(`[SESSION] 📊 Sessioni attive: ${sessionKeys.length}`);

    // Leggi le sessioni
    const sessions = [];
    for (const key of sessionKeys) {
      try {
        const sessionData = await redisClient.get(key);
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          sessions.push({
            id: key.replace("sess:", ""),
            userId: parsed.passport?.user || null,
            createdAt:
              new Date(parsed.cookie?.originalMaxAge).toISOString() || null,
          });
        }
      } catch (e) {
        console.error(
          `[SESSION] ❌ Errore parsing sessione ${key}:`,
          e.message
        );
      }
    }

    return res.status(200).json({
      success: true,
      totalSessions: sessionKeys.length,
      sessions: sessions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "[SESSION] ❌ Errore recupero statistiche Redis:",
      error.message
    );
    return res.status(500).json({
      error: "Errore recupero statistiche sessioni",
      message: error.message,
    });
  }
});

/**
 * Endpoint per cancellare tutte le sessioni Redis
 * Usato per logout forzato di tutti gli utenti
 * Requires: admin role
 */
router.delete("/session/admin/clear-all", async (req, res) => {
  try {
    // Solo admin può accedere
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: "Non autorizzato" });
    }

    // Ottieni tutte le sessioni
    const sessionKeys = await redisClient.keys("sess:*");

    if (sessionKeys.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Nessuna sessione da cancellare",
        clearedSessions: 0,
      });
    }

    // Cancella tutte le sessioni
    for (const key of sessionKeys) {
      await redisClient.del(key);
    }

    console.log(
      `[SESSION] 🗑️  Tutte le sessioni Redis cancellate (${sessionKeys.length} sessioni)`
    );

    return res.status(200).json({
      success: true,
      message: "Tutte le sessioni sono state cancellate",
      clearedSessions: sessionKeys.length,
    });
  } catch (error) {
    console.error(
      "[SESSION] ❌ Errore cancellazione sessioni Redis:",
      error.message
    );
    return res.status(500).json({
      error: "Errore cancellazione sessioni",
      message: error.message,
    });
  }
});

module.exports = router;
