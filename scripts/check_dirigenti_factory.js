const daoDirigenti = require('../src/features/squadre/services/dao-dirigenti-squadre');

(async () => {
  try {
    const res = await daoDirigenti.getDirigentiBySquadra(2);
    console.log('DAO getDirigentiBySquadra(2) =>');
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Errore:', err);
    process.exit(1);
  }
})();
