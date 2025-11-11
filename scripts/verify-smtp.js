#!/usr/bin/env node
"use strict";

// Small helper to verify SMTP connectivity using the project's email service.
// Usage:
// 1) Set env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_DEBUG=true
// 2) Run: node scripts/verify-smtp.js

try {
  // optional: load .env if present (and dotenv is installed)
  require('dotenv').config();
} catch (e) {
  // ignore if dotenv not installed
}

const emailService = require('../src/shared/services/email-service');

(async function main() {
  console.log('SMTP verification script');
  console.log('Using env: ', {
    SMTP_HOST: process.env.SMTP_HOST || process.env.GMAIL_HOST || '(not set)',
    SMTP_PORT: process.env.SMTP_PORT || '(not set)',
    SMTP_USER: process.env.SMTP_USER || process.env.GMAIL_USER || '(not set)',
    EMAIL_DEBUG: !!process.env.EMAIL_DEBUG
  });

  try {
    await emailService.verifyTransporter();
    console.log('\n✅ SMTP verify succeeded. Transporter can connect and handshake.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ SMTP verify failed:');
    console.error('code:', err && err.code);
    console.error('message:', err && err.message);
    if (err && err.response) console.error('response:', err.response);
    if (err && err.responseCode) console.error('responseCode:', err.responseCode);
    // show stack for deeper debugging
    console.error(err && err.stack);
    process.exit(2);
  }
})();
