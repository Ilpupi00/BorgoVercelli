/**
 * @fileoverview Configurazione strategie OAuth per Passport
 * @module core/config/passport-oauth
 * @description Configura le strategie Google e Facebook OAuth 2.0.
 * Richiede variabili d'ambiente per ciascun provider:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   FACEBOOK_APP_ID, FACEBOOK_APP_SECRET
 *   OAUTH_CALLBACK_BASE_URL (es. https://miosito.com)
 */

"use strict";

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const AppleStrategy = require("passport-apple");
const db = require("./database");

const CALLBACK_BASE =
  process.env.OAUTH_CALLBACK_BASE_URL || "http://localhost:3000";

// ==================== HELPER ====================

/**
 * Inserisce la foto OAuth nella tabella IMMAGINI (se non già presente una foto profilo)
 */
async function saveOAuthPhoto(userId, fotoUrl) {
  if (!fotoUrl) return;
  try {
    // 1. Salva sempre su utenti.foto_oauth (backup resiliente — sopravvive ai reset di IMMAGINI)
    await db.query(
      "UPDATE utenti SET foto_oauth = $1, updated_at = NOW() WHERE id = $2",
      [fotoUrl, userId]
    );
    // 2. Upsert in IMMAGINI: cancella la precedente e reinserisce (gestisce URL aggiornati)
    const now = new Date().toISOString();
    await db.query(
      "DELETE FROM IMMAGINI WHERE tipo = 'profilo' AND entita_riferimento = 'utente' AND entita_id = $1",
      [userId]
    );
    await db.query(
      `INSERT INTO IMMAGINI (descrizione, url, tipo, entita_riferimento, entita_id, ordine, created_at, updated_at)
       VALUES ('Foto profilo utente', $1, 'profilo', 'utente', $2, 1, $3, $4)`,
      [fotoUrl, userId, now, now]
    );
  } catch (e) {
    console.warn("[OAuth] Impossibile salvare foto profilo:", e.message);
  }
}

/**
 * Cerca o crea un utente in base a provider + oauthId.
 * Se l'utente esiste già (stessa email) ma senza OAuth, lo collega.
 */
async function findOrCreateOAuthUser(profile, provider) {
  const oauthId = profile.id;
  const email = (
    profile.emails && profile.emails[0] ? profile.emails[0].value : ""
  ).toLowerCase();
  const nome = profile.name?.givenName || profile.displayName || "";
  const cognome = profile.name?.familyName || "";
  const foto =
    profile.photos && profile.photos[0] ? profile.photos[0].value : null;

  // 1) Cerca per oauth_provider + oauth_id
  const existing = await db.query(
    "SELECT * FROM utenti WHERE oauth_provider = $1 AND oauth_id = $2",
    [provider, oauthId]
  );

  if (existing.rows.length > 0) {
    // Aggiorna foto se non ancora salvata in IMMAGINI
    await saveOAuthPhoto(existing.rows[0].id, foto);
    return existing.rows[0];
  }

  // 2) Cerca per email (utente registrato con password che ora usa OAuth)
  if (email) {
    const byEmail = await db.query(
      "SELECT * FROM utenti WHERE LOWER(email) = $1",
      [email]
    );

    if (byEmail.rows.length > 0) {
      // Collega l'account OAuth all'utente esistente
      await db.query(
        "UPDATE utenti SET oauth_provider = $1, oauth_id = $2 WHERE id = $3",
        [provider, oauthId, byEmail.rows[0].id]
      );
      // Salva foto nella tabella IMMAGINI se non presente
      await saveOAuthPhoto(byEmail.rows[0].id, foto);
      return byEmail.rows[0];
    }
  }

  // 3) Crea un nuovo utente (senza password)
  const now = new Date().toISOString();
  const result = await db.query(
    `INSERT INTO utenti 
      (email, password_hash, nome, cognome, telefono, tipo_utente_id, 
       data_registrazione, created_at, updated_at, oauth_provider, oauth_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      email,
      null, // Nessuna password per utenti OAuth
      nome,
      cognome,
      "",
      0, // tipo_utente_id di default (Utente base)
      now,
      now,
      now,
      provider,
      oauthId,
    ]
  );

  const newUser = result.rows[0];
  // Salva foto nella tabella IMMAGINI
  await saveOAuthPhoto(newUser.id, foto);

  return newUser;
}

// ==================== GOOGLE ====================

function configureGoogle() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn(
      "[OAuth] ⚠️  GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET non impostati – strategia Google disattivata"
    );
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${CALLBACK_BASE}/auth/google/callback`,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser(profile, "google");
          return done(null, user);
        } catch (err) {
          console.error("[OAuth] Errore Google:", err);
          return done(err, null);
        }
      }
    )
  );

  console.log("[OAuth] ✅ Strategia Google configurata");
}

// ==================== FACEBOOK ====================

function configureFacebook() {
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    console.warn(
      "[OAuth] ⚠️  FACEBOOK_APP_ID / FACEBOOK_APP_SECRET non impostati – strategia Facebook disattivata"
    );
    return;
  }

  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${CALLBACK_BASE}/auth/facebook/callback`,
        profileFields: ["id", "emails", "name", "displayName", "photos"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser(profile, "facebook");
          return done(null, user);
        } catch (err) {
          console.error("[OAuth] Errore Facebook:", err);
          return done(err, null);
        }
      }
    )
  );

  console.log("[OAuth] ✅ Strategia Facebook configurata");
}

// ==================== INIT ====================

function configureApple() {
  if (
    !process.env.APPLE_CLIENT_ID ||
    !process.env.APPLE_TEAM_ID ||
    !process.env.APPLE_KEY_ID ||
    !process.env.APPLE_PRIVATE_KEY_LOCATION
  ) {
    console.warn(
      "[OAuth] ⚠️  APPLE_CLIENT_ID / APPLE_TEAM_ID / APPLE_KEY_ID / APPLE_PRIVATE_KEY_LOCATION non impostati – strategia Apple disattivata"
    );
    return;
  }

  passport.use(
    new AppleStrategy(
      {
        clientID: process.env.APPLE_CLIENT_ID,          // es. com.tuo.app
        teamID: process.env.APPLE_TEAM_ID,              // es. ABCDE12345
        keyID: process.env.APPLE_KEY_ID,                // es. XYZ123ABCD
        privateKeyLocation: process.env.APPLE_PRIVATE_KEY_LOCATION, // percorso .p8
        callbackURL: `${CALLBACK_BASE}/auth/apple/callback`,
        scope: ["name", "email"],
        passReqToCallback: false,
      },
      async (accessToken, refreshToken, idToken, profile, done) => {
        try {
          // Apple manda nome/email solo al primo login
          const appleProfile = {
            id: idToken.sub,
            emails: idToken.email ? [{ value: idToken.email }] : [],
            name: {
              givenName: profile && profile.name ? profile.name.firstName : "",
              familyName: profile && profile.name ? profile.name.lastName : "",
            },
            displayName:
              profile && profile.name
                ? `${profile.name.firstName || ""} ${profile.name.lastName || ""}`.trim()
                : "",
            photos: [],
          };
          const user = await findOrCreateOAuthUser(appleProfile, "apple");
          return done(null, user);
        } catch (err) {
          console.error("[OAuth] Errore Apple:", err);
          return done(err, null);
        }
      }
    )
  );

  console.log("[OAuth] ✅ Strategia Apple configurata");
}

function initOAuth() {
  configureGoogle();
  configureFacebook();
  configureApple();
}

module.exports = { initOAuth };
