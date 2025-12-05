const fs = require('fs');
const path = require('path');
const ExportStatisticheController = require('../src/features/admin/controllers/ExportStatisticheController');
const ExcelJS = require('exceljs');

(async () => {
    try {
        console.log('Recupero statistiche...');
        const stats = await ExportStatisticheController._getStatistiche({});
        console.log('Statistiche ottenute, creazione workbook...');
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Borgo Vercelli Admin Test';
        workbook.created = new Date();

        // Chiama le stesse funzioni usate per l'export
        await ExportStatisticheController._createDashboardSheet(workbook, stats);
        await ExportStatisticheController._createDettagliSheet(workbook, stats);
        await ExportStatisticheController._createPrenotazioniSheet(workbook, stats);
        await ExportStatisticheController._createUtentiSheet(workbook, stats);
        await ExportStatisticheController._createUtentiDettagliatiSheet(workbook, stats);
        await ExportStatisticheController._createContenutoSheet(workbook, stats);
        await ExportStatisticheController._createSicurezzaSheet(workbook, stats);
        await ExportStatisticheController._createGraficiSheet(workbook, stats);
        await ExportStatisticheController._createTendenzeSheet(workbook, stats);
        await ExportStatisticheController._createCampiSheet(workbook, stats);
        await ExportStatisticheController._createRawDataSheet(workbook, stats);

        const outPath = path.resolve(__dirname, '../tmp_statistiche_test.xlsx');
        await workbook.xlsx.writeFile(outPath);
        console.log('File scritto in:', outPath);
    } catch (err) {
        console.error('Errore test export:', err);
        process.exit(1);
    }
})();
