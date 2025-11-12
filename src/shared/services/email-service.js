'use strict';

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Optional SendGrid fallback
/*let sgMail;
const sendgridApiKey = process.env.SENDGRID_API_KEY;
if (sendgridApiKey) {
    try {
        sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(sendgridApiKey);
        if (process.env.EMAIL_DEBUG) console.log('SendGrid enabled as email provider');
    } catch (e) {
        console.warn('SendGrid package not installed or failed to initialize:', e && e.message);
        sgMail = null;
    }
}*/

// Optional Resend provider (https://resend.com)
let resendClient;
const resendApiKey = process.env.RESEND_API_KEY;
if (resendApiKey) {
    try {
        // Support both package export shapes
        const resendPkg = require('resend');
        const ResendClass = (resendPkg && (resendPkg.Resend || resendPkg.default)) || resendPkg;
        resendClient = new ResendClass(resendApiKey);
        if (process.env.EMAIL_DEBUG) console.log('Resend enabled as email provider');
    } catch (e) {
        console.warn('Resend package not installed or failed to initialize:', e && e.message);
        resendClient = null;
    }
}

// Configurazione del trasportatore SMTP (preferisce variabili d'ambiente)
// NOTE: usare variabili d'ambiente in produzione: SMTP_HOST, SMTP_PORT, SMTP_SECURE,
// SMTP_USER, SMTP_PASS. Per Gmail usare app password o OAuth2.
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpSecure = (process.env.SMTP_SECURE === 'true') || (smtpPort === 465);
// Normalize credentials: trim and remove spaces from app passwords (Google shows them with spaces)
const smtpUser = (process.env.SMTP_USER || process.env.GMAIL_USER || '').toString().trim() || undefined;
const _smtpPassRaw = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '').toString();
// Google App Passwords are often displayed with spaces for readability. Remove whitespace for real use.
const smtpPass = _smtpPassRaw.replace(/\s+/g, '').trim() || undefined;
if (_smtpPassRaw && _smtpPassRaw !== smtpPass) {
    console.warn('SMTP password contained whitespace; it was stripped automatically for the connection.');
}

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    // Improve diagnostics and resilience
    logger: !!process.env.EMAIL_DEBUG,
    debug: !!process.env.EMAIL_DEBUG,
    // Timeouts (ms) - configurable via env if needed
    connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT || '30000', 10),
    greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT || '30000', 10),
    socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT || '30000', 10),
    tls: {
        // If you have self-signed certs in your environment you can set this to false.
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false'
    }
});

// Helper: verify transporter connectivity with clear logging
async function verifyTransporter() {
    try {
        await transporter.verify();
        if (process.env.EMAIL_DEBUG) console.log('SMTP transporter verified');
        return true;
    } catch (err) {
        console.error('SMTP verify failed:', err && err.message ? err.message : err);
        // rethrow to allow caller to decide (or sendWithRetry will catch)
        throw err;
    }
}

// Helper: send with simple retries on transient connection errors (ETIMEDOUT, ECONNRESET)
async function sendWithRetry(mailOptions, maxRetries = 3) {
    let attempt = 0;
    let lastErr;
    // If FORCE_RESEND is set, use Resend exclusively and fail fast if it's not configured.
    if (process.env.FORCE_RESEND === 'true') {
        if (!resendClient) {
            throw new Error('Resend is not configured (RESEND_API_KEY missing) but FORCE_RESEND=true');
        }
        if (process.env.EMAIL_DEBUG) console.log('FORCE_RESEND=true: sending only via Resend API');
        return await sendViaResend(mailOptions);
    }

    // Prefer Resend (if configured), then SendGrid as API fallbacks — both are more reliable on PaaS
    if (resendClient) {
        try {
            if (process.env.EMAIL_DEBUG) console.log('Attempting send via Resend API');
            const r = await sendViaResend(mailOptions);
            return r;
        } catch (errResend) {
            console.warn('Resend send failed, falling back to other providers:', errResend && errResend.message);
        }
    }

    if (sgMail) {
        try {
            if (process.env.EMAIL_DEBUG) console.log('Attempting send via SendGrid API');
            const sgResult = await sendViaSendGrid(mailOptions);
            return sgResult;
        } catch (sgErr) {
            console.warn('SendGrid send failed, falling back to SMTP:', sgErr && sgErr.message);
            // continue to SMTP attempts
        }
    }

    // try to verify first (best-effort)
    try {
        await verifyTransporter();
    } catch (verifyErr) {
        // continue to attempts; verify failure often indicates network/auth issue
        if (process.env.EMAIL_DEBUG) console.warn('verifyTransporter warning, will attempt send:', verifyErr && verifyErr.code);
    }

    while (attempt < maxRetries) {
        try {
            attempt += 1;
            if (process.env.EMAIL_DEBUG) console.log(`Attempt ${attempt} to send email to ${mailOptions.to}`);
            const info = await transporter.sendMail(mailOptions);
            if (process.env.EMAIL_DEBUG) console.log('Email sent (info):', info && info.messageId);
            return info;
        } catch (err) {
            lastErr = err;
            const code = err && err.code;
            // Retry only on transient network errors
            if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'EPIPE' || code === 'ENOTFOUND') {
                const backoff = Math.min(30000, 1000 * Math.pow(2, attempt)); // ms
                console.warn(`Transient SMTP error (${code}). Retry ${attempt}/${maxRetries} after ${backoff}ms`);
                await new Promise(resolve => setTimeout(resolve, backoff));
                continue;
            }
            // Non-transient error - rethrow
            throw err;
        }
    }
    // exhausted retries
    const e = lastErr || new Error('Unknown error sending email');
    throw e;
}

// Send using SendGrid API (returns object similar to nodemailer result)
async function sendViaSendGrid(mailOptions) {
    if (!sgMail) throw new Error('SendGrid not configured');

    const msg = {
        to: mailOptions.to,
        from: mailOptions.from || (process.env.DEFAULT_FROM || 'noreply@borgovercelli.it'),
        subject: mailOptions.subject,
        html: mailOptions.html,
    };

    // Attachments: convert nodemailer-style attachments (path) to SendGrid format
    if (Array.isArray(mailOptions.attachments) && mailOptions.attachments.length > 0) {
        msg.attachments = [];
        for (const att of mailOptions.attachments) {
            if (att.path && fs.existsSync(att.path)) {
                const data = fs.readFileSync(att.path);
                msg.attachments.push({
                    content: data.toString('base64'),
                    filename: att.filename || path.basename(att.path),
                    type: att.contentType || 'application/octet-stream',
                    disposition: 'attachment',
                    content_id: att.cid || undefined
                });
            } else if (att.content) {
                // already in-memory
                msg.attachments.push({
                    content: Buffer.from(att.content).toString('base64'),
                    filename: att.filename || 'attachment',
                    type: att.contentType || 'application/octet-stream',
                    disposition: 'attachment',
                    content_id: att.cid || undefined
                });
            }
        }
    }

    const result = await sgMail.send(msg);
    // SendGrid returns an array with responses
    if (Array.isArray(result) && result[0] && result[0].headers) {
        return { messageId: result[0].headers['x-message-id'] || null, raw: result };
    }
    return { messageId: null, raw: result };
}

// Send using Resend API
async function sendViaResend(mailOptions) {
    if (!resendClient) throw new Error('Resend not configured');

    const from = mailOptions.from || process.env.DEFAULT_FROM || 'noreply@borgovercelli.it';
    const to = Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to];

    const payload = {
        from,
        to,
        subject: mailOptions.subject,
        html: mailOptions.html
    };

    if (Array.isArray(mailOptions.attachments) && mailOptions.attachments.length > 0) {
        payload.attachments = [];
        for (const att of mailOptions.attachments) {
            if (att.path && fs.existsSync(att.path)) {
                const data = fs.readFileSync(att.path);
                payload.attachments.push({
                    name: att.filename || path.basename(att.path),
                    type: att.contentType || 'application/octet-stream',
                    // Resend expects either `content` (base64) or `path`
                    content: data.toString('base64')
                });
            } else if (att.content) {
                payload.attachments.push({
                    name: att.filename || 'attachment',
                    type: att.contentType || 'application/octet-stream',
                    content: Buffer.from(att.content).toString('base64')
                });
            }
        }
    }

    const res = await resendClient.emails.send(payload);
    // Resend returns an object with id
    return { messageId: res.id || null, raw: res };
}

// Percorso al logo (verifica che il file esista in questo path)
const logoPath = path.resolve(__dirname, '../../public/assets/images/Logo.png');

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
                :root {
                    --primary-blue: #0d6efd;
                    --primary-blue-dark: #2563eb;
                    --primary-blue-light: #4dabf7;
                    --secondary-green: #22b14c;
                    --text-primary: #212529;
                    --text-secondary: #6c757d;
                    --bg-light: #f8f9fa;
                    --bg-white: #ffffff;
                    --border-color: rgba(0,0,0,0.1);
                    --shadow-color: rgba(0,0,0,0.15);
                }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, rgba(13, 110, 253, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%);
                    margin: 0;
                    padding: 20px;
                    color: var(--text-primary);
                    line-height: 1.6;
                    min-height: 100vh;
                }
                .container {
                    max-width: 650px;
                    margin: 0 auto;
                    background-color: var(--bg-white);
                    border-radius: 20px;
                    box-shadow: 0 20px 60px var(--shadow-color);
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.8);
                }
                .header {
                    background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-dark) 100%);
                    color: var(--text-primary);
                    padding: 40px 30px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                .header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                    opacity: 0.3;
                }
                .header-content {
                    position: relative;
                    z-index: 1;
                }
                .logo-container {
                    margin-bottom: 20px;
                }
                .logo {
                    height: 60px;
                    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 300;
                    letter-spacing: -0.5px;
                    margin-bottom: 8px;
                }
                .header p {
                    margin: 0;
                    font-size: 16px;
                    opacity: 0.9;
                    font-weight: 400;
                }
                .content {
                    padding: 40px 30px;
                }
                .field {
                    margin-bottom: 30px;
                    background: linear-gradient(135deg, rgba(13, 110, 253, 0.02) 0%, rgba(13, 110, 253, 0.01) 100%);
                    border: 1px solid rgba(13, 110, 253, 0.1);
                    border-left: 4px solid var(--primary-blue);
                    padding: 25px;
                    border-radius: 15px;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                .field::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, var(--primary-blue) 0%, var(--primary-blue-light) 100%);
                }
                .field:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(13, 110, 253, 0.1);
                }
                .field strong {
                    color: var(--primary-blue);
                    font-weight: 600;
                    display: block;
                    margin-bottom: 10px;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .field-value {
                    font-size: 16px;
                    color: var(--text-primary);
                    font-weight: 500;
                }
                .message-content {
                    background: linear-gradient(135deg, rgba(34, 177, 76, 0.02) 0%, rgba(34, 177, 76, 0.01) 100%);
                    border: 1px solid rgba(34, 177, 76, 0.1);
                    border-left: 4px solid var(--secondary-green);
                    padding: 25px;
                    border-radius: 15px;
                    white-space: pre-wrap;
                    line-height: 1.7;
                    font-size: 15px;
                    color: var(--text-primary);
                    position: relative;
                    overflow: hidden;
                }
                .message-content::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, var(--secondary-green) 0%, #4ade80 100%);
                }
                .footer {
                    background: linear-gradient(135deg, var(--bg-light) 0%, #e9ecef 100%);
                    padding: 30px;
                    text-align: center;
                    border-top: 1px solid var(--border-color);
                }
                .footer p {
                    margin: 8px 0;
                    font-size: 14px;
                    color: var(--text-secondary);
                }
                .footer strong {
                    color: var(--primary-blue);
                    font-weight: 600;
                }
                .divider {
                    height: 1px;
                    background: linear-gradient(90deg, transparent 0%, var(--border-color) 50%, transparent 100%);
                    margin: 20px 0;
                }
                @media (max-width: 600px) {
                    body {
                        padding: 10px;
                    }
                    .container {
                        margin: 0;
                        border-radius: 15px;
                    }
                    .header, .content, .footer {
                        padding: 25px 20px;
                    }
                    .header h1 {
                        font-size: 24px;
                    }
                    .field, .message-content {
                        padding: 20px;
                        margin-bottom: 20px;
                    }
                }
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .field, .message-content {
                    animation: fadeInUp 0.6s ease-out forwards;
                }
            </style>
        </head>
        <body style="margin:0;padding:0;background-color:#f4f7fa;">
            <!-- Outer full-width table (neutral background) -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f4f7fa; min-width:100%;">
                <tr>
                    <td align="center" style="padding:20px;">
                        <!-- Centered container table (email-safe) -->
                        <table class="container" width="650" cellpadding="0" cellspacing="0" role="presentation" bgcolor="#ffffff" style="max-width:650px; width:100%; margin:0 auto; border-radius:18px; overflow:hidden; box-shadow:0 8px 30px rgba(16,24,40,0.06); border:1px solid rgba(13,110,253,0.06); background: linear-gradient(180deg, #ffffff 0%, #f8fbff 60%, #eef7ff 100%);">
                            <tr>
                                <td>
                                    <div class="header">
                                        <div class="header-content">
                                            <div class="logo-container">
                                                <img src="cid:borgo-logo" alt="Borgo Vercelli" class="logo" />
                                            </div>
                                            <h1>📬 Nuovo Messaggio</h1>
                                            <p>Ricevuto dal sito web</p>
                                        </div>
                                    </div>
                                    <div class="content">
                                        <div class="field">
                                            <strong>👤 Mittente</strong>
                                            <div class="field-value">${fromName}</div>
                                        </div>
                                        <div class="field">
                                            <strong>📧 Email</strong>
                                            <div class="field-value">${fromEmail}</div>
                                        </div>
                                        <div class="field">
                                            <strong>💬 Messaggio</strong>
                                            <div class="message-content">${message.replace(/\n/g, '<br>')}</div>
                                        </div>
                                    </div>
                                    <div class="footer">
                                        <div class="divider"></div>
                                        <p><strong>ASD Borgo Vercelli</strong></p>
                                        <p>Società Sportiva Dilettantistica</p>
                                        <p style="font-size: 12px; margin-top: 15px;">Questo messaggio è stato inviato automaticamente dal nostro sito web</p>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
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

    const info = await sendWithRetry(mailOptions);
    console.log('Email inviata:', info && info.messageId);
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
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; }
                    .header { text-align: center; padding: 20px 0; }
                    .button { display: inline-block; padding: 10px 20px; background-color: #0d6efd; color: black; text-decoration: none; border-radius: 5px; }
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

    const info = await sendWithRetry(mailOptions);
    console.log('Email di reset inviata:', info && info.messageId);
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

    const info = await sendWithRetry(mailOptions);
    console.log('Email di sospensione inviata:', info && info.messageId);
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

    const info = await sendWithRetry(mailOptions);
    console.log('Email di ban inviata:', info && info.messageId);
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

    const info = await sendWithRetry(mailOptions);
    console.log('Email di riattivazione inviata:', info && info.messageId);
    return { messageId: info.messageId };
    } catch (err) {
        console.error('Errore invio email riattivazione:', err);
        throw err;
    }
};

// Export helpers for diagnostics/tests
exports.verifyTransporter = verifyTransporter;
exports.sendWithRetry = sendWithRetry;

// Convenience helper: send a simple test email via Resend to any address.
exports.sendTestViaResend = async function(toEmail) {
    if (!resendClient) throw new Error('Resend not configured (set RESEND_API_KEY)');
    const mailOptions = {
        from: process.env.DEFAULT_FROM || 'noreply@borgovercelli.it',
        to: toEmail,
        subject: 'Test email da Borgo Vercelli (via Resend)',
        html: `<p>Questa è una email di test inviata tramite Resend da Borgo Vercelli.</p><p>Se la ricevi su Gmail, la configurazione è corretta.</p>`
    };
    return await sendViaResend(mailOptions);
};