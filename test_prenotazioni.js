// Script di test per verificare le funzionalità delle prenotazioni
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testUpdateStato() {
    console.log('\n=== TEST: Update Stato Prenotazione ===');
    try {
        // Test con ID 12 (in_attesa -> confermata)
        const response = await fetch(`${BASE_URL}/prenotazione/prenotazioni/12/stato`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stato: 'confermata' })
        });
        const result = await response.json();
        console.log('Result:', result);
        console.log('Status:', response.status);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function testDeleteScadute() {
    console.log('\n=== TEST: Delete Scadute ===');
    try {
        const response = await fetch(`${BASE_URL}/prenotazione/prenotazioni/scadute`, {
            method: 'DELETE'
        });
        const result = await response.json();
        console.log('Result:', result);
        console.log('Status:', response.status);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function testDeleteSingle() {
    console.log('\n=== TEST: Delete Single Prenotazione ===');
    try {
        const response = await fetch(`${BASE_URL}/prenotazione/prenotazioni/14`, {
            method: 'DELETE'
        });
        const result = await response.json();
        console.log('Result:', result);
        console.log('Status:', response.status);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function runTests() {
    console.log('Starting tests...\n');
    
    await testUpdateStato();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testDeleteScadute();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testDeleteSingle();
    
    console.log('\n=== Tests completed ===');
    process.exit(0);
}

runTests();
