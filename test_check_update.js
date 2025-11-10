const dao = require('./src/services/dao-prenotazione');
(async () => {
    try {
        const res = await dao.checkAndUpdateScadute();
        console.log('checkAndUpdateScadute result:', res);
    } catch (e) {
        console.error('Error:', e);
    }
})();
