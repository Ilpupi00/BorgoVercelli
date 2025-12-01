# 🔔 Guida Test Notifiche Push

## Setup Completato

Il sistema di notifiche push è stato migliorato con:

1. ✅ **Logging dettagliato** - Ogni passaggio viene tracciato nei log del server
2. ✅ **Validazione VAPID** - Le chiavi vengono verificate all'avvio
3. ✅ **Pagina di test** - Interfaccia web per testare facilmente le notifiche
4. ✅ **Gestione errori migliorata** - Errori più chiari e informativi

## Come Testare le Notifiche

### Metodo 1: Pagina di Test (Consigliato)

1. **Accedi al sito** come utente autenticato
   - URL: `http://localhost:8080/login`

2. **Vai alla pagina di test**
   - URL: `http://localhost:8080/push/test`
   - Questa pagina mostra:
     - ✅ Stato supporto browser
     - ✅ Stato permessi notifiche
     - ✅ Stato subscription
     - ✅ Console log in tempo reale

3. **Accetta i permessi** quando il browser li richiede

4. **Invia una notifica di test**
   - Scegli il destinatario (me/admin/tutti)
   - Personalizza titolo e messaggio
   - Clicca "Invia Notifica Test"

5. **Controlla i log del server**
   - Vedrai log dettagliati come:
     ```
     [WEBPUSH] 📤 sendNotificationToUsers chiamato
     [WEBPUSH] Target userIds: [ 2 ]
     [WEBPUSH] Subscriptions totali caricate: 2
     [WEBPUSH] 🚀 Invio notifiche in corso...
     [WEBPUSH] Invio 1/1 a userId 2...
     [WEBPUSH] ✅ Notifica 1 inviata con successo
     [WEBPUSH] 📊 Risultato invio:
     [WEBPUSH]   ✅ Inviate: 1
     [WEBPUSH]   ❌ Fallite: 0
     ```

### Metodo 2: Tramite API diretta

Usa un tool come curl o Postman:

```bash
curl -X POST http://localhost:8080/push/test \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "to": "me",
    "title": "Test",
    "body": "Messaggio di test",
    "url": "/"
  }'
```

### Metodo 3: Console Browser

Apri la console del browser e digita:

```javascript
// Invia notifica test a te stesso
fetch('/push/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    to: 'me',
    title: '🔔 Test',
    body: 'Notifica di test',
    url: '/'
  })
}).then(r => r.json()).then(console.log);
```

## Verifiche da Fare

### 1. Controlla le Chiavi VAPID

All'avvio del server dovresti vedere:

```
========================================
🔔 SISTEMA NOTIFICHE PUSH
========================================
✅ Chiavi VAPID configurate
📧 Email: info.asdborgovercelli2022@gmail.com
🔗 Test page: http://localhost:8080/push/test
========================================
```

### 2. Verifica Permessi Browser

- Chrome/Edge: `chrome://settings/content/notifications`
- Firefox: `about:preferences#privacy` → Notifiche
- Safari: Preferenze → Siti web → Notifiche

### 3. Controlla la Subscription

Nel file `src/data/webpush.json` dovresti vedere le subscription salvate:

```json
[
  {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": { ... },
    "userId": 2,
    "isAdmin": true,
    "createdAt": "2025-11-27T..."
  }
]
```

## Problemi Comuni e Soluzioni

### ❌ "Nessuna subscription trovata"

**Causa**: L'utente non ha accettato i permessi o non si è iscritto

**Soluzione**:
1. Vai su `/push/test`
2. Accetta i permessi quando richiesti
3. La pagina si iscriverà automaticamente

### ❌ "Chiavi VAPID non configurate"

**Causa**: Variabili d'ambiente mancanti

**Soluzione**:
1. Verifica il file `.env`
2. Assicurati che `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_EMAIL` siano presenti
3. Riavvia il server

### ❌ "Permission denied"

**Causa**: L'utente ha negato i permessi

**Soluzione**:
1. Vai nelle impostazioni del browser
2. Cerca il sito nelle impostazioni notifiche
3. Rimuovi il blocco e ricarica la pagina

### ❌ "Service Worker non registrato"

**Causa**: Il file `service-worker.js` non è raggiungibile

**Soluzione**:
1. Verifica che `/service-worker.js` sia accessibile
2. Controlla la console del browser per errori
3. Prova a ricaricare con Ctrl+Shift+R (hard reload)

## Log Dettagliati

I log del server ora mostrano emoji per facilitare la lettura:

- 🔔 = Sistema notifiche
- 📤 = Invio notifica
- ✅ = Successo
- ❌ = Errore
- ⚠️ = Warning
- 🚀 = Operazione in corso
- 📊 = Risultati
- 🗑️ = Rimozione subscription

## Test Automatico

Per testare rapidamente:

1. Accedi come admin
2. Vai su `/push/test`
3. Seleziona "A tutti gli admin"
4. Clicca "Invia"
5. Dovresti ricevere la notifica immediatamente

## Monitoring

Controlla periodicamente:
- `src/data/webpush.json` per vedere le subscription attive
- Log del server per errori di invio
- Console del browser per errori del service worker

## Prossimi Passi

Una volta verificato che le notifiche funzionano:

1. Le notifiche vengono inviate automaticamente per:
   - ✅ Nuove prenotazioni (agli admin)
   - ✅ Prenotazioni accettate/rifiutate (all'utente)
   - ✅ Nuovi eventi pubblicati
   - ✅ Nuove notizie

2. Puoi personalizzare i messaggi nei file:
   - `src/features/prenotazioni/routes/prenotazione.js`
   - Altri file che chiamano `pushService.sendNotification...`

## Supporto

Se le notifiche ancora non funzionano:

1. Controlla i log del server (cerca `[WEBPUSH]`)
2. Apri la console del browser (F12)
3. Vai su `/push/test` e verifica gli stati
4. Controlla che il file `.env` contenga le chiavi VAPID corrette
5. Verifica che il browser supporti le notifiche push

---

**Nota**: Le notifiche push richiedono HTTPS in produzione (non necessario su localhost)
