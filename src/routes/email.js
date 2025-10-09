const nodemailer = require('nodemailer');
const express = require('express');
const router = express.Router();

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "d4b079c6045807",
    pass: "68fec520e5f828"
  }
});
router.post('/send-email', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
  }

  try {
    const info = await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: 'lucalupi03@gmail.com', // Cambia con la tua email di destinazione
      subject: subject,
      text: message,
      html: `<p><strong>Nome:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Messaggio:</strong><br>${message}</p>`
    });
    console.log('Email inviata: %s', info.messageId);
    res.json({ success: true, message: 'Email inviata con successo!' });
  } catch (err) {
    console.error('Errore dettagliato invio email:', err);
    res.status(500).json({ error: 'Errore durante l\'invio della mail.', details: err.message });
  }
});

module.exports = router;
