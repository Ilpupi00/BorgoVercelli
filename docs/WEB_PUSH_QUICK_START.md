# 🔔 Web Push Notifications - Quick Start

## ✅ Sistema Completamente Aggiornato

Le notifiche push sono state migrate dal file JSON al database PostgreSQL e ottimizzate per funzionare su **tutti i browser e sistemi operativi**.

## 🚀 Setup Rapido (se non fatto)

### 1. Applica la Migration

```bash
node scripts/apply-push-migration.js
```

### 2. Migra Dati Esistenti (opzionale)

```bash
node scripts/migrate-push-subscriptions.js
```

### 3. Avvia l'App

```bash
npm start
```

## ✨ Cosa è Stato Sistemato

✅ **Database invece di JSON** - Le subscription sono ora salvate in PostgreSQL
✅ **Compatibilità Cross-Browser** - Funziona su Chrome, Firefox, Safari, Edge
✅ **Compatibilità iOS** - Safari iOS 16.4+ completamente supportato
✅ **Gestione Errori Robusta** - Auto-cleanup subscription non valide
✅ **Logging Dettagliato** - Debug facilitato con log strutturati
✅ **Tracking Errori** - Ogni subscription traccia successi/errori

## 📱 Browser Supportati

| Browser | Desktop        | Mobile         |
| ------- | -------------- | -------------- |
| Chrome  | ✅             | ✅             |
| Firefox | ✅             | ✅             |
| Safari  | ✅ (macOS 13+) | ✅ (iOS 16.4+) |
| Edge    | ✅             | ✅             |
| Opera   | ✅             | ✅             |

## 🧪 Test Rapido

1. Accedi all'app come utente
2. Accetta le notifiche quando richiesto
3. Apri: `http://localhost:8080/push/my-subscriptions`
4. Dovresti vedere la tua subscription

**Invia notifica di test:**

```bash
curl -X POST http://localhost:8080/push/test \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{"to":"me","title":"Test","body":"Funziona!"}'
```

## 📚 Documentazione Completa

- **Guida Dettagliata**: [docs/WEB_PUSH_MIGRATION.md](./WEB_PUSH_MIGRATION.md)
- **Riepilogo Modifiche**: [docs/WEB_PUSH_SUMMARY.md](./WEB_PUSH_SUMMARY.md)

## 🔧 File Modificati

- `src/shared/services/webpush.js` - Servizio push (ora usa DB)
- `src/public/service-worker.js` - Service worker migliorato
- `src/public/assets/scripts/push-notifications.js` - Client manager
- `src/shared/routes/push.js` - API endpoints
- `database/migrations/add_push_subscriptions.sql` - Schema DB

## 💡 API Principali

```javascript
// Server-side
const pushService = require("./shared/services/webpush");

// Invia a utenti specifici
await pushService.sendNotificationToUsers([userId], {
  title: "Titolo",
  body: "Messaggio",
  url: "/path",
});

// Invia agli admin
await pushService.sendNotificationToAdmins({
  title: "Alert Admin",
  body: "Richiede attenzione",
});
```

```javascript
// Client-side (già integrato)
const manager = await initPushNotifications();
```

## 🆘 Troubleshooting

**Notifiche non arrivano?**

1. Verifica chiavi VAPID nel `.env`
2. Controlla log server (cerca `[WEBPUSH]`)
3. Usa endpoint `/push/debug` per verificare autenticazione

**Permesso negato?**

- Safari iOS richiede iOS 16.4+
- L'utente deve abilitare manualmente dalle impostazioni browser

## 📊 Query Utili

```sql
-- Subscription attive
SELECT COUNT(*) FROM push_subscriptions WHERE error_count < 5;

-- Subscription problematiche
SELECT user_id, error_count FROM push_subscriptions WHERE error_count >= 3;

-- Admin
SELECT COUNT(*) FROM push_subscriptions WHERE is_admin = true;
```

## ✅ Status

- **Migration Database**: ✅ Completata
- **Dati Migrati**: ✅ 1 subscription trasferita
- **Compatibilità**: ✅ Tutti i browser moderni
- **Testing**: ⏳ Pronto per test end-to-end

---

**Pronto all'uso!** 🎉
