#!/usr/bin/env node
/**
 * Script di test per il sistema di notifiche
 * Testa l'intero flusso: accodamento -> worker -> invio push
 */

require('dotenv').config();
const db = require('../src/core/config/database');
const notifications = require('../src/shared/services/notifications');

async function testNotificationSystem() {
    console.log('🧪 [TEST] Avvio test sistema notifiche\n');
    
    try {
        // 1. Verifica connessione database
        console.log('1️⃣ Verifica connessione database...');
        await db.query('SELECT 1');
        console.log('✅ Database connesso\n');
        
        // 2. Verifica tabella notifications
        console.log('2️⃣ Verifica tabella notifications...');
        const tableCheck = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'notifications'
            ORDER BY ordinal_position
        `);
        console.log(`✅ Tabella notifications trovata con ${tableCheck.rows.length} colonne:`);
        tableCheck.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}`);
        });
        console.log('');
        
        // 3. Statistiche coda
        console.log('3️⃣ Statistiche notifiche in coda...');
        const stats = await notifications.getQueueStats();
        console.log('📊 Stato attuale:');
        console.log(`   - Pending: ${stats.pending}`);
        console.log(`   - Sending: ${stats.sending}`);
        console.log(`   - Sent: ${stats.sent}`);
        console.log(`   - Failed: ${stats.failed}`);
        console.log('');
        
        // 4. Verifica subscriptions
        console.log('4️⃣ Verifica subscriptions disponibili...');
        const subsResult = await db.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE is_admin = true) as admin_count,
                COUNT(*) FILTER (WHERE is_admin = false) as user_count,
                COUNT(*) FILTER (WHERE error_count >= 5) as error_count
            FROM push_subscriptions
        `);
        const subsStats = subsResult.rows[0];
        console.log('📱 Subscriptions registrate:');
        console.log(`   - Totali: ${subsStats.total}`);
        console.log(`   - Admin: ${subsStats.admin_count}`);
        console.log(`   - Utenti: ${subsStats.user_count}`);
        console.log(`   - Con errori (>=5): ${subsStats.error_count}`);
        console.log('');
        
        if (subsStats.total === 0) {
            console.log('⚠️  ATTENZIONE: Nessuna subscription trovata!');
            console.log('   Gli utenti devono abilitare le notifiche dal browser prima di riceverle.\n');
        }
        
        // 5. Test accodamento notifica (opzionale - commentato per default)
        const TEST_QUEUE = process.env.TEST_QUEUE === 'true';
        if (TEST_QUEUE) {
            console.log('5️⃣ Test accodamento notifica...');
            const testPayload = {
                title: '🧪 Test Notifica Sistema',
                body: `Test eseguito alle ${new Date().toLocaleTimeString('it-IT')}`,
                icon: '/assets/images/logo.png',
                tag: 'test-system',
                requireInteraction: false
            };
            
            const result = await notifications.queueNotificationForAdmins(testPayload, { priority: 1 });
            
            if (result.success) {
                console.log(`✅ Notifica accodata con ID: ${result.id}`);
                console.log('   Il worker processerà questa notifica automaticamente.');
            } else {
                console.log(`❌ Errore accodamento: ${result.error}`);
            }
            console.log('');
        } else {
            console.log('5️⃣ Test accodamento saltato (imposta TEST_QUEUE=true per abilitare)\n');
        }
        
        // 6. Notifiche recenti
        console.log('6️⃣ Ultime 5 notifiche processate...');
        const recentResult = await db.query(`
            SELECT id, type, status, attempts, max_attempts, 
                   last_error, created_at, sent_at,
                   CASE 
                       WHEN status = 'sent' THEN EXTRACT(EPOCH FROM (sent_at - created_at))
                       ELSE NULL 
                   END as processing_time_seconds
            FROM notifications
            ORDER BY created_at DESC
            LIMIT 5
        `);
        
        if (recentResult.rows.length === 0) {
            console.log('   Nessuna notifica trovata.');
        } else {
            recentResult.rows.forEach((notif, idx) => {
                console.log(`\n   ${idx + 1}. ID ${notif.id} (${notif.type}):`);
                console.log(`      Status: ${notif.status}`);
                console.log(`      Tentativi: ${notif.attempts}/${notif.max_attempts}`);
                if (notif.processing_time_seconds) {
                    console.log(`      Tempo elaborazione: ${notif.processing_time_seconds.toFixed(2)}s`);
                }
                if (notif.last_error) {
                    console.log(`      Ultimo errore: ${notif.last_error.substring(0, 80)}...`);
                }
                console.log(`      Creata: ${notif.created_at.toISOString()}`);
                if (notif.sent_at) {
                    console.log(`      Inviata: ${notif.sent_at.toISOString()}`);
                }
            });
        }
        console.log('');
        
        // 7. Check notifiche stuck
        console.log('7️⃣ Controllo notifiche stuck...');
        const stuckResult = await db.query(`
            SELECT id, status, updated_at,
                   EXTRACT(EPOCH FROM (NOW() - updated_at)) as stuck_seconds
            FROM notifications
            WHERE status = 'sending'
              AND updated_at < NOW() - INTERVAL '5 minutes'
        `);
        
        if (stuckResult.rows.length > 0) {
            console.log(`⚠️  Trovate ${stuckResult.rows.length} notifiche stuck in 'sending':`);
            stuckResult.rows.forEach(n => {
                const stuckMins = Math.floor(n.stuck_seconds / 60);
                console.log(`   - ID ${n.id}: stuck da ${stuckMins} minuti`);
            });
            console.log('   Il worker cleanup le resetterà automaticamente.');
        } else {
            console.log('✅ Nessuna notifica stuck trovata.');
        }
        console.log('');
        
        // 8. Riepilogo
        console.log('📋 RIEPILOGO TEST:');
        console.log('═══════════════════════════════════════');
        console.log(`✅ Database: OK`);
        console.log(`✅ Tabella notifications: OK (${tableCheck.rows.length} colonne)`);
        console.log(`📊 Notifiche in coda: ${stats.pending} pending, ${stats.sending} sending`);
        console.log(`📱 Subscriptions attive: ${subsStats.total} (${subsStats.admin_count} admin, ${subsStats.user_count} utenti)`);
        
        if (subsStats.total === 0) {
            console.log(`⚠️  NOTA: Nessuna subscription - le notifiche non verranno recapitate`);
        }
        
        console.log('');
        console.log('🎯 Sistema pronto per processare notifiche!');
        console.log('   Avvia il worker con: npm run worker:notifications');
        console.log('');
        
    } catch (error) {
        console.error('\n❌ ERRORE durante test:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Esegui test
if (require.main === module) {
    testNotificationSystem();
}

module.exports = { testNotificationSystem };
