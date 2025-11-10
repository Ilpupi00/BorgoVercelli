const http = require('http');

// Facciamo una richiesta alla pagina admin utenti
const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/admin/utenti',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        // Verifica se i modali sono presenti
        const hasSceltaModal = data.includes('sceltaSospendiBanModal');
        const hasSospensioneModal = data.includes('sospensioneModal');
        const hasBanModal = data.includes('banModal');
        const hasRevocaModal = data.includes('revocaModal');

        console.log('\n=== VERIFICA MODALI NELLA RISPOSTA ===');
        console.log(`Modal Scelta: ${hasSceltaModal}`);
        console.log(`Modal Sospensione: ${hasSospensioneModal}`);
        console.log(`Modal Ban: ${hasBanModal}`);
        console.log(`Modal Revoca: ${hasRevocaModal}`);

        // Verifica i pulsanti
        const hasMostraSospendiBan = data.includes('mostraSospendiBan');
        const hasRevocaSospensioneBan = data.includes('revocaSospensioneBan');

        console.log('\n=== VERIFICA PULSANTI ===');
        console.log(`Pulsante mostraSospendiBan: ${hasMostraSospendiBan}`);
        console.log(`Pulsante revocaSospensioneBan: ${hasRevocaSospensioneBan}`);

        // Mostra un pezzo della risposta per debug
        console.log('\n=== ESEMPIO RISPOSTA (primi 500 caratteri) ===');
        console.log(data.substring(0, 500));

        if (hasSceltaModal && hasSospensioneModal && hasBanModal && hasRevocaModal) {
            console.log('\n✅ TUTTI I MODALI SONO PRESENTI!');
        } else {
            console.log('\n❌ ALCUNI MODALI MANCANO');
        }
    });
});

req.on('error', (e) => {
    console.error(`Errore richiesta: ${e.message}`);
});

req.end();