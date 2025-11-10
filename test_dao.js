const daoPrenotazione = require('./src/services/dao-prenotazione');

async function test() {
    try {
        console.log('Testing checkAndUpdateScadute');
        const result = await daoPrenotazione.checkAndUpdateScadute();
        console.log('checkAndUpdateScadute result:', result);

        console.log('Testing deleteScadute');
        const result2 = await daoPrenotazione.deleteScadute();
        console.log('deleteScadute result:', result2);
    } catch (err) {
        console.error('Error:', err);
    }
}

test();