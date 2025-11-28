# Migrazione Web Push Notifications

## Panoramica

Le notifiche push web sono state migrate da un sistema basato su file JSON a un database PostgreSQL per migliorare affidabilità, scalabilità e compatibilità cross-browser/OS.

## Modifiche Principali

### 1. Database invece di JSON
- **Prima**: Le subscription erano salvate in `src/data/webpush.json`
- **Dopo**: Le subscription sono salvate nella tabella `push_subscriptions` in PostgreSQL

### 2. Miglioramenti Service Worker
- Aggiunta gestione errori robusta per tutti i browser
- Supporto fallback per piattaforme con funzionalità limitate
- Logging dettagliato per debugging
- Gestione eventi migliorata (click, close, errori)

### 3. API Aggiornate
- Tracking errori per ogni subscription
- Pulizia automatica subscription non valide
- Supporto user-agent per debugging
- Logging dettagliato lato server

## Procedura di Migrazione

### Passo 1: Applicare la Migration al Database

```bash
# Connettiti al database PostgreSQL
psql -h <host> -U <username> -d <database>

# Esegui lo script di migration
\i database/migrations/add_push_subscriptions.sql
```

Oppure usando Railway CLI (se usi Railway):

```bash
railway connect <service-name>
# Poi esegui il file SQL
```

### Passo 2: Migrare i Dati Esistenti

Esegui lo script di migrazione per trasferire le subscription dal JSON al database:

```bash
node scripts/migrate-push-subscriptions.js
```

Questo script:
- Legge le subscription da `webpush.json`
- Le inserisce nel database PostgreSQL
- Crea un backup del file JSON
- Fornisce un report dettagliato

### Passo 3: Riavviare l'Applicazione

```bash
# Locale
npm start

# Railway (auto-deploy al push)
git push origin main
```

### Passo 4: Verificare il Funzionamento

1. **Accedi all'applicazione** come utente normale
2. **Accetta le notifiche push** quando richiesto
3. **Verifica la subscription**:
   ```bash
   # API endpoint per verificare le tue subscription
   GET /push/my-subscriptions
   ```

4. **Testa l'invio** (come admin):
   ```bash
   POST /push/test
   {
     "to": "me",
     "title": "Test Notifica",
     "body": "Se vedi questa notifica, tutto funziona!",
     "url": "/"
   }
   ```

## Struttura Database

### Tabella: push_subscriptions

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | SERIAL | ID univoco |
| user_id | INTEGER | FK a users.id |
| endpoint | TEXT | URL endpoint subscription (univoco) |
| p256dh | TEXT | Chiave pubblica per crittografia |
| auth | TEXT | Secret di autenticazione |
| is_admin | BOOLEAN | Flag admin |
| user_agent | TEXT | Browser/OS info |
| created_at | TIMESTAMP | Data creazione |
| updated_at | TIMESTAMP | Data ultimo aggiornamento |
| last_success_at | TIMESTAMP | Ultimo invio riuscito |
| last_error_at | TIMESTAMP | Ultimo errore |
| error_count | INTEGER | Contatore errori consecutivi |

### Indici

- `idx_push_subscriptions_user_id` - Ricerche per utente
- `idx_push_subscriptions_is_admin` - Filtraggio admin
- `idx_push_subscriptions_endpoint` - Lookup per endpoint

## Compatibilità Browser/OS

### Browser Supportati ✅

| Browser | Desktop | Mobile | Note |
|---------|---------|--------|------|
| **Chrome** | ✅ | ✅ | Supporto completo |
| **Firefox** | ✅ | ✅ | Supporto completo |
| **Edge** | ✅ | ✅ | Supporto completo |
| **Safari** | ✅ (macOS 13+) | ✅ (iOS 16.4+) | Azioni limitate su iOS |
| **Opera** | ✅ | ✅ | Basato su Chrome |
| **Samsung Internet** | - | ✅ | Supporto completo |

### Funzionalità per Browser

| Funzionalità | Chrome | Firefox | Safari | Edge |
|--------------|--------|---------|--------|------|
| Notifiche Base | ✅ | ✅ | ✅ | ✅ |
| Icone/Badge | ✅ | ✅ | ✅ | ✅ |
| Immagini | ✅ | ✅ | ⚠️ | ✅ |
| Azioni (bottoni) | ✅ | ✅ | ⚠️ | ✅ |
| Vibrazione | ✅ | ✅ | ❌ | ✅ |

⚠️ = Supporto limitato o versione-dipendente
❌ = Non supportato

## API Endpoints

### Pubblici

- `GET /push/vapidPublicKey` - Ottiene la chiave pubblica VAPID
- `POST /push/subscribe` - Salva una subscription (autenticazione richiesta)
- `POST /push/unsubscribe` - Rimuove una subscription

### Admin

- `GET /push/subscriptions` - Lista tutte le subscription (solo admin)
- `POST /push/force-admin-notify` - Invia notifica di test agli admin

### Debug

- `GET /push/my-subscriptions` - Le tue subscription
- `GET /push/admin-subs` - Subscription admin
- `GET /push/debug` - Info autenticazione
- `POST /push/test` - Invia notifica di test

## Funzioni Disponibili

### Server-side (webpush.js)

```javascript
const pushService = require('./shared/services/webpush');

// Invia a utenti specifici
await pushService.sendNotificationToUsers([userId1, userId2], {
  title: 'Titolo',
  body: 'Messaggio',
  url: '/path',
  icon: '/icon.png',
  tag: 'notifica-tipo'
});

// Invia a tutti gli admin
await pushService.sendNotificationToAdmins({
  title: 'Alert Admin',
  body: 'Qualcosa richiede attenzione',
  url: '/admin/dashboard'
});

// Invia a tutti
await pushService.sendNotificationToAll({
  title: 'Annuncio',
  body: 'Messaggio per tutti gli utenti'
});

// Pulizia subscription non valide
await pushService.cleanupFailedSubscriptions(5); // Rimuove quelle con >= 5 errori
```

### Client-side (push-notifications.js)

```javascript
// Inizializza automaticamente
const manager = await initPushNotifications();

// Oppure manualmente
const manager = new PushNotificationManager();
await manager.subscribe();

// Verifica stato
const isSubscribed = await manager.isSubscribed();

// Cancella subscription
await manager.unsubscribe();
```

## Troubleshooting

### Le notifiche non arrivano

1. **Verifica le chiavi VAPID nel .env**:
   ```bash
   VAPID_PUBLIC_KEY=your_public_key
   VAPID_PRIVATE_KEY=your_private_key
   VAPID_EMAIL=your@email.com
   ```

2. **Controlla i log del server**:
   ```bash
   # Cerca errori con prefisso [WEBPUSH]
   railway logs
   ```

3. **Verifica la subscription nel database**:
   ```sql
   SELECT * FROM push_subscriptions WHERE user_id = <your_user_id>;
   ```

4. **Testa manualmente**:
   ```bash
   curl -X POST https://your-app.railway.app/push/test \
     -H "Content-Type: application/json" \
     -H "Cookie: your_session_cookie" \
     -d '{"to":"me","title":"Test","body":"Test message"}'
   ```

### Errore 401 (Non Autenticato)

- Verifica che l'utente sia loggato
- Controlla che i cookie di sessione siano inviati (`credentials: 'include'`)
- Verifica che Passport.js sia configurato correttamente

### Errore durante la subscription

- **Chrome/Firefox**: Verifica la chiave VAPID
- **Safari iOS**: Richiede iOS 16.4+ e notifiche abilitate nelle impostazioni
- **Permesso negato**: L'utente deve abilitare manualmente dalle impostazioni browser

### Subscription non salvata nel database

1. Verifica che la migration sia stata applicata
2. Controlla che l'utente abbia un ID valido
3. Verifica i log del server per errori SQL

## Manutenzione

### Pulizia Periodica

Esegui periodicamente per rimuovere subscription non valide:

```javascript
// Ogni giorno/settimana via cron job
const pushService = require('./shared/services/webpush');
await pushService.cleanupFailedSubscriptions(5);
```

### Monitoring

Monitora questi parametri:
- Numero totale di subscription attive
- Subscription con errori (error_count > 0)
- Rapporto successo/fallimento invii
- Subscription per browser/OS (via user_agent)

Query utili:

```sql
-- Subscription attive
SELECT COUNT(*) FROM push_subscriptions WHERE error_count < 5;

-- Subscription problematiche
SELECT user_id, endpoint, error_count, last_error_at 
FROM push_subscriptions 
WHERE error_count >= 3 
ORDER BY last_error_at DESC;

-- Admin subscription
SELECT COUNT(*) FROM push_subscriptions WHERE is_admin = true;
```

## Rollback

Se necessario tornare al sistema JSON (non consigliato):

1. Ripristina il backup: `cp webpush.json.backup-* webpush.json`
2. Ripristina il codice precedente da git
3. Le subscription nel database rimarranno per riferimento futuro

## Note Importanti

- ✅ **HTTPS Obbligatorio**: Le push notifications funzionano solo su HTTPS (eccetto localhost)
- ✅ **Permessi Utente**: L'utente deve accettare esplicitamente le notifiche
- ✅ **Service Worker Scope**: Il service worker deve essere alla root (`/service-worker.js`)
- ✅ **Cross-Origin**: Le subscription sono specifiche per dominio
- ⚠️ **Safari Limitations**: iOS Safari ha supporto limitato (no vibrazione, azioni limitate)

## Risorse

- [Web Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web-push Node.js Library](https://github.com/web-push-libs/web-push)
- [VAPID Key Generator](https://vapidkeys.com/)
