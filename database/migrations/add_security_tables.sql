-- Migration: Add Security Tables and Fields
-- Database: PostgreSQL

-- 1. Create LOGIN_ACTIVITY table
CREATE TABLE IF NOT EXISTS LOGIN_ACTIVITY (
    id SERIAL PRIMARY KEY,
    utente_id INTEGER REFERENCES UTENTI(id) ON DELETE CASCADE,
    device TEXT NOT NULL,
    detail TEXT,
    icon TEXT,
    ip_address TEXT,
    location TEXT,
    status TEXT NOT NULL, -- 'Riuscito', 'Bloccato', 'Fallito'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add security fields to UTENTI table
ALTER TABLE UTENTI 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE UTENTI 
ADD COLUMN IF NOT EXISTS password_last_changed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Index for faster queries on login_activity by user
CREATE INDEX IF NOT EXISTS idx_login_activity_utente_id ON LOGIN_ACTIVITY(utente_id);
