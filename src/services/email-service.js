'use strict';

const nodemailer = require('nodemailer');
const path = require('path');

// Configurazione del trasportatore per Mailtrap
const transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "d50c87c8f2dfbf",
    pass: "2b64d7030d9da6"
  }
});

// Percorso al logo (verifica che il file esista in questo path)
const logoPath = path.resolve(__dirname, '../public/images/Logo.png');

exports.sendEmail = async function({ fromName, fromEmail, subject, message, to = 'lucalupi03@gmail.com' }) {
    try {
    const formattedMessage = `
    <!DOCTYPE html>
        <html lang="it">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nuovo Messaggio di Contatto</title>
            <style>
                :root { --primary: #0d6efd; --secondary: #22b14c; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f4f7fa;
                    margin: 0;
                    padding: 0;
                    color: #333;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                .header {
                    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 300;
                }
                .content {
                    padding: 30px 20px;
                }
                .field {
                    margin-bottom: 20px;
                    border-left: 4px solid var(--primary);
                    padding-left: 15px;
                    background-color: #fbfdff;
                    padding: 15px;
                    border-radius: 8px;
                }
                .field strong {
                    color: var(--primary);
                    font-weight: 600;
                    display: block;
                    margin-bottom: 5px;
                }
                .message-content {
                    background-color: #fbfdff;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid var(--secondary);
                    white-space: pre-wrap;
                    line-height: 1.6;
                }
                .footer {
                    background-color: #f7fafc;
                    padding: 20px;
                    text-align: center;
                    font-size: 14px;
                    color: #666;
                }
                .footer p {
                    margin: 5px 0;
                }
                @media (max-width: 600px) {
                    .container {
                        margin: 10px;
                    }
                    .header, .content, .footer {
                        padding: 20px 15px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                    <div class="header">
                    <img src="cid:borgo-logo" alt="Borgo Vercelli" style="height:48px;margin-bottom:10px;" />
                    <h1>📬 Nuovo Messaggio di Contatto</h1>
                    <p>Ricevuto dal sito Borgo Vercelli</p>
                </div>
                <div class="content">
                    <div class="field">
                        <strong>👤 Nome:</strong> ${fromName}
                    </div>
                    <div class="field">
                        <strong>📧 Email:</strong> ${fromEmail}
                    </div>
                    <div class="field">
                        <strong>💬 Messaggio:</strong>
                        <div class="message-content">${message.replace(/\n/g, '<br>')}</div>
                    </div>
                </div>
                <div class="footer">
                    <p><strong>Borgo Vercelli</strong> - Società Sportiva Dilettantistica</p>
                    <p>Questo messaggio è stato inviato automaticamente dal nostro sito web.</p>
                </div>
            </div>
        </body>
        </html>
        `;
        // Costruisci oggetto mail (fallback se mancante)
        const mailSubject = (subject && subject.toString().trim())
            ? subject.toString().trim()
            : `Nuovo messaggio da ${fromName || 'Anonimo'} - Borgo Vercelli`;

        // Aggiungiamo attachments per includere il logo come CID
        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to: to,
            subject: mailSubject,
            html: formattedMessage,
            attachments: [
                {
                    filename: 'Logo.png',
                    path: logoPath,
                    cid: 'borgo-logo'
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email inviata:', info.messageId);
        return { messageId: info.messageId };
    } catch (err) {
        console.error('Errore invio email:', err);
        throw err;
    }
};

exports.sendResetEmail = async function(toEmail, resetLink) {
    try {
        const mailOptions = {
            from: `"Borgo Vercelli" <noreply@borgovercelli.it>`,
            to: toEmail,
            subject: 'Reset della tua password - Borgo Vercelli',
            html: `
            <!DOCTYPE html>
            <html lang="it">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f7fa; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                    .header { text-align: center; padding: 20px 0; }
                    .button { display: inline-block; padding: 10px 20px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px; }
                    .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Reset della Password</h2>
                        <p>Hai richiesto il reset della tua password per il sito Borgo Vercelli.</p>
                    </div>
                    <p>Clicca sul pulsante qui sotto per reimpostare la tua password. Questo link è valido per 1 ora e può essere utilizzato una sola volta.</p>
                    <p style="text-align: center;">
                        <a href="${resetLink}" class="button">Reset Password</a>
                    </p>
                    <p>Se non hai richiesto questo reset, ignora questa email.</p>
                    <div class="footer">
                        <p>Borgo Vercelli - Società Sportiva Dilettantistica</p>
                    </div>
                </div>
            </body>
            </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email di reset inviata:', info.messageId);
        return { messageId: info.messageId };
    } catch (err) {
        console.error('Errore invio email reset:', err);
        throw err;
    }
};