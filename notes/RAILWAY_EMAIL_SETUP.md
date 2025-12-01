# 📧 Configurazione Email Service per Railway

## Problema
Il servizio di invio email non funziona su Railway perché le variabili d'ambiente per Gmail SMTP non sono configurate.

## ⚠️ IMPORTANTE: SICUREZZA

**NON committare mai file `.env` con credenziali!** 
Il file `.env` è stato aggiunto al `.gitignore` per proteggerlo.

---

## 🔧 Soluzione: Configurare Variabili d'Ambiente su Railway

### Passo 1: Accedi a Railway Dashboard

1. Vai su [railway.app](https://railway.app)
2. Seleziona il tuo progetto **BorgoVercelli**
3. Clicca sulla tab **Variables**

### Passo 2: Aggiungi le Variabili d'Ambiente

Aggiungi le seguenti variabili:

```bash
GMAIL_USER=info.asdborgovercelli2022@gmail.com
GMAIL_APP_PASSWORD=ukio kwap dmtr qmhx
BASE_URL=https://tuo-dominio.railway.app
NODE_ENV=production
```

**Note:**
- `GMAIL_USER`: L'indirizzo email Gmail da cui inviare le email
- `GMAIL_APP_PASSWORD`: La **App Password** generata da Google (NON la password Gmail normale)
- `BASE_URL`: L'URL pubblico del tuo sito su Railway
- `NODE_ENV`: Imposta su `production` per l'ambiente di produzione

### Passo 3: Come Ottenere una Gmail App Password

Se non hai già una App Password, seguire questi passi:

1. Vai su [myaccount.google.com](https://myaccount.google.com)
2. Vai su **Sicurezza** → **Verifica in due passaggi** (deve essere attivata)
3. Cerca **Password delle app**
4. Seleziona **App: Posta** e **Dispositivo: Altro (nome personalizzato)**
5. Inserisci nome: `Railway BorgoVercelli`
6. Copia la password generata (16 caratteri senza spazi)
7. Usa questa password in `GMAIL_APP_PASSWORD`

### Passo 4: Verifica Configurazione

Dopo aver aggiunto le variabili:

1. Railway farà automaticamente il **redeploy** dell'applicazione
2. Attendi il completamento del deploy
3. Testa la funzionalità di invio email dal sito

---

## 🧪 Test Locale vs Railway

### Test Locale
```bash
# Il file .env locale viene letto automaticamente
npm start
```

### Test su Railway
```bash
# Le variabili vengono lette dalle Environment Variables di Railway
# Visibili nella sezione Variables del progetto
```

---

## 📝 Configurazione Attuale

### File: `src/shared/services/email-service.js`

```javascript
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_USER,      // ← Legge da ENV
        pass: process.env.GMAIL_APP_PASSWORD // ← Legge da ENV
    }
});
```

### Funzioni Email Disponibili

1. **`sendEmail()`** - Invio contatti dal form
2. **`sendResetEmail()`** - Reset password
3. **`sendSospensioneEmail()`** - Notifica sospensione utente
4. **`sendBanEmail()`** - Notifica ban utente
5. **`sendRevocaEmail()`** - Notifica riattivazione account

---

## ❌ Errori Comuni

### Errore: "Invalid login"
- **Causa**: Credenziali errate o App Password non configurata
- **Soluzione**: Verifica `GMAIL_USER` e `GMAIL_APP_PASSWORD`

### Errore: "ECONNREFUSED"
- **Causa**: Porta SMTP bloccata
- **Soluzione**: Railway dovrebbe permettere connessioni SMTP, verifica firewall

### Errore: "Missing credentials"
- **Causa**: Variabili d'ambiente non configurate
- **Soluzione**: Aggiungi le variabili nella dashboard Railway

---

## 🔒 Best Practices Sicurezza

1. ✅ **NON** committare file `.env` nel repository
2. ✅ Usa **App Password** di Google, non password normale
3. ✅ Ruota periodicamente le App Password
4. ✅ Usa variabili d'ambiente diverse per dev/staging/production
5. ✅ Limita l'accesso alle variabili d'ambiente solo ai team necessari

---

## 🚀 Deploy su Railway

Dopo aver configurato le variabili:

```bash
# 1. Commit e push delle modifiche (senza .env)
git add .
git commit -m "Fix: Add email service configuration for Railway"
git push origin main

# 2. Railway fa auto-deploy
# 3. Verifica i logs su Railway per confermare che l'email service funziona
```

---

## 📊 Monitoraggio

Controlla i logs su Railway per verificare:

```bash
# Log di successo
✅ Email inviata: <messageId>

# Log di errore
❌ Errore invio email: [dettaglio errore]
```

---

## 🆘 Troubleshooting

Se dopo la configurazione l'email non funziona ancora:

1. **Verifica variabili su Railway**
   - Vai su Variables → Controlla che siano tutte presenti
   
2. **Controlla logs Railway**
   - Cerca errori relativi a nodemailer/SMTP
   
3. **Test SMTP manualmente**
   - Usa Railway CLI o aggiungi un endpoint di test

4. **Verifica Gmail Security**
   - Controlla che l'account non sia bloccato
   - Verifica che la 2FA sia attiva

---

## 📧 Alternative a Gmail (Opzionale)

Se Gmail SMTP non funziona, considera alternative:

- **SendGrid** (gratuito fino a 100 email/giorno)
- **Mailgun** (gratuito fino a 5000 email/mese)
- **AWS SES** (molto economico per volumi alti)

---

Ultimo aggiornamento: 2025-11-11
