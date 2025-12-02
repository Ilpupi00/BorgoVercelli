const express = require('express');
const router = express.Router();
const emailService = require('../services/email-service');

// Legacy endpoint ancora utilizzato da componenti che puntano a /send-email
router.post('/send-email', async (req, res) => {
  const { name, email, subject, message, phone } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
  }

  try {
    const info = await emailService.sendEmail({
      fromName: name,
      fromEmail: email,
      subject,
      message,
      phone
    });
    console.log('Email inviata (legacy): %s', info && info.messageId);
    res.json({ success: true, message: 'Email inviata con successo!' });
  } catch (err) {
    console.error('Errore dettagliato invio email (legacy):', err);
    res.status(500).json({ error: 'Errore durante l\'invio della mail.', details: err.message });
  }
});

module.exports = router;
