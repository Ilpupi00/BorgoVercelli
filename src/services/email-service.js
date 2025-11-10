'use strict';

const nodemailer = require('nodemailer');
const path = require('path');

// Configurazione del trasportatore per Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD // App Password, non la password normale
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

exports.sendSospensioneEmail = async function(toEmail, userName, motivo, dataFine) {
    try {
        const dataFineFormatted = new Date(dataFine).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const mailOptions = {
            from: `"Borgo Vercelli" <noreply@borgovercelli.it>`,
            to: toEmail,
            subject: 'Account Sospeso - Borgo Vercelli',
            html: `
            <!DOCTYPE html>
            <html lang="it">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    :root { --primary: #0d6efd; --warning: #ffc107; --danger: #dc3545; }
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
                        background: linear-gradient(135deg, var(--warning) 0%, #ff9800 100%);
                        color: white;
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        font-weight: 600;
                    }
                    .content {
                        padding: 30px 20px;
                    }
                    .alert-box {
                        background-color: #fff3cd;
                        border-left: 4px solid var(--warning);
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 8px;
                    }
                    .info-box {
                        background-color: #fbfdff;
                        border-left: 4px solid var(--primary);
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 8px;
                    }
                    .info-box strong {
                        color: var(--primary);
                        display: block;
                        margin-bottom: 5px;
                    }
                    .footer {
                        background-color: #f7fafc;
                        padding: 20px;
                        text-align: center;
                        font-size: 14px;
                        color: #666;
                    }
                    .contact-info {
                        margin-top: 20px;
                        padding: 15px;
                        background-color: #e7f3ff;
                        border-radius: 8px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚠️ Account Sospeso</h1>
                    </div>
                    <div class="content">
                        <p>Gentile <strong>${userName}</strong>,</p>
                        
                        <div class="alert-box">
                            <strong>Il tuo account è stato temporaneamente sospeso.</strong>
                        </div>

                        <div class="info-box">
                            <strong>Motivo della sospensione:</strong>
                            <p>${motivo}</p>
                        </div>

                        <div class="info-box">
                            <strong>Durata della sospensione:</strong>
                            <p>Il tuo account sarà riattivato automaticamente il <strong>${dataFineFormatted}</strong></p>
                        </div>

                        <p>Durante il periodo di sospensione non potrai accedere ai servizi del sito.</p>

                        <div class="contact-info">
                            <strong>Hai bisogno di assistenza?</strong>
                            <p>Se ritieni che questa sospensione sia un errore o desideri ulteriori chiarimenti, 
                            contatta l'amministrazione del sito tramite email: <a href="mailto:info@borgovercelli.it">info@borgovercelli.it</a></p>
                        </div>
                    </div>
                    <div class="footer">
                        <p><strong>Borgo Vercelli</strong></p>
                        <p>Società Sportiva Dilettantistica</p>
                    </div>
                </div>
            </body>
            </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email di sospensione inviata:', info.messageId);
        return { messageId: info.messageId };
    } catch (err) {
        console.error('Errore invio email sospensione:', err);
        throw err;
    }
};

exports.sendBanEmail = async function(toEmail, userName, motivo) {
    try {
        const mailOptions = {
            from: `"Borgo Vercelli" <noreply@borgovercelli.it>`,
            to: toEmail,
            subject: 'Account Bannato - Borgo Vercelli',
            html: `
            <!DOCTYPE html>
            <html lang="it">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    :root { --primary: #0d6efd; --danger: #dc3545; }
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
                        background: linear-gradient(135deg, var(--danger) 0%, #c82333 100%);
                        color: white;
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        font-weight: 600;
                    }
                    .content {
                        padding: 30px 20px;
                    }
                    .alert-box {
                        background-color: #f8d7da;
                        border-left: 4px solid var(--danger);
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 8px;
                        color: #721c24;
                    }
                    .info-box {
                        background-color: #fbfdff;
                        border-left: 4px solid var(--primary);
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 8px;
                    }
                    .info-box strong {
                        color: var(--primary);
                        display: block;
                        margin-bottom: 5px;
                    }
                    .footer {
                        background-color: #f7fafc;
                        padding: 20px;
                        text-align: center;
                        font-size: 14px;
                        color: #666;
                    }
                    .contact-info {
                        margin-top: 20px;
                        padding: 15px;
                        background-color: #fff3cd;
                        border-radius: 8px;
                        border-left: 4px solid #ffc107;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚫 Account Bannato</h1>
                    </div>
                    <div class="content">
                        <p>Gentile <strong>${userName}</strong>,</p>
                        
                        <div class="alert-box">
                            <strong>Il tuo account è stato permanentemente bannato dal sito Borgo Vercelli.</strong>
                        </div>

                        <div class="info-box">
                            <strong>Motivo del ban:</strong>
                            <p>${motivo}</p>
                        </div>

                        <p>Non potrai più accedere ai servizi del sito con questo account.</p>

                        <div class="contact-info">
                            <strong>Richiesta di Sblocco</strong>
                            <p>Se ritieni che questo ban sia un errore o desideri richiedere lo sblocco del tuo account, 
                            puoi contattare l'amministrazione del sito tramite email: 
                            <a href="mailto:info@borgovercelli.it">info@borgovercelli.it</a></p>
                            <p style="margin-top: 10px;">
                                <small>⚠️ Ogni richiesta verrà valutata individualmente dall'amministrazione.</small>
                            </p>
                        </div>
                    </div>
                    <div class="footer">
                        <p><strong>Borgo Vercelli</strong></p>
                        <p>Società Sportiva Dilettantistica</p>
                    </div>
                </div>
            </body>
            </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email di ban inviata:', info.messageId);
        return { messageId: info.messageId };
    } catch (err) {
        console.error('Errore invio email ban:', err);
        throw err;
    }
};

exports.sendRevocaEmail = async function(toEmail, userName) {
    try {
        const mailOptions = {
            from: `"Borgo Vercelli" <noreply@borgovercelli.it>`,
            to: toEmail,
            subject: 'Account Riattivato - Borgo Vercelli',
            html: `
            <!DOCTYPE html>
            <html lang="it">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    :root { --primary: #0d6efd; --success: #28a745; }
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
                        background: linear-gradient(135deg, var(--success) 0%, #22b14c 100%);
                        color: white;
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        font-weight: 600;
                    }
                    .content {
                        padding: 30px 20px;
                    }
                    .success-box {
                        background-color: #d4edda;
                        border-left: 4px solid var(--success);
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 8px;
                        color: #155724;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 30px;
                        background: linear-gradient(135deg, var(--primary) 0%, #0056b3 100%);
                        color: white;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                        margin: 20px 0;
                    }
                    .footer {
                        background-color: #f7fafc;
                        padding: 20px;
                        text-align: center;
                        font-size: 14px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Account Riattivato</h1>
                    </div>
                    <div class="content">
                        <p>Gentile <strong>${userName}</strong>,</p>
                        
                        <div class="success-box">
                            <strong>Buone notizie! Il tuo account è stato riattivato.</strong>
                        </div>

                        <p>Puoi nuovamente accedere a tutti i servizi del sito Borgo Vercelli.</p>

                        <p style="text-align: center;">
                            <a href="${process.env.BASE_URL || 'http://localhost:3000'}/login" class="button">Accedi al Sito</a>
                        </p>

                        <p>Ti invitiamo a rispettare sempre le regole della nostra comunità per mantenere un ambiente 
                        piacevole per tutti gli utenti.</p>
                    </div>
                    <div class="footer">
                        <p><strong>Borgo Vercelli</strong></p>
                        <p>Società Sportiva Dilettantistica</p>
                    </div>
                </div>
            </body>
            </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email di riattivazione inviata:', info.messageId);
        return { messageId: info.messageId };
    } catch (err) {
        console.error('Errore invio email riattivazione:', err);
        throw err;
    }
};