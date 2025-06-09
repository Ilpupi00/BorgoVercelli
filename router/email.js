const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Configura il trasportatore (modifica con i tuoi dati SMTP reali)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tuoindirizzo@gmail.com',
    pass: 'la-tua-password-per-le-app'
  }
});

router.post('/send-email', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
  }

  try {
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: 'lucalupi03@gmail.com', // Cambia con la tua email di destinazione
      subject: subject,
      text: message,
      html: `<p><strong>Nome:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Messaggio:</strong><br>${message}</p>`
    });
    res.json({ success: true, message: 'Email inviata con successo!' });
  } catch (err) {
    console.error('Errore invio email:', err);
    res.status(500).json({ error: 'Errore durante l\'invio della mail.' });
  }
});

module.exports = router;

router.post('/send-email', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
  }

  try {
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: 'lucalupi03@gmail.com', // Cambia con la tua email di destinazione
      subject: subject,
      text: message,
      html: `<p><strong>Nome:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Messaggio:</strong><br>${message}</p>`
    });
    res.json({ success: true, message: 'Email inviata con successo!' });
  } catch (err) {
    console.error('Errore invio email:', err);
    res.status(500).json({ error: 'Errore durante l\'invio della mail.' });
  }
});

module.exports = router;