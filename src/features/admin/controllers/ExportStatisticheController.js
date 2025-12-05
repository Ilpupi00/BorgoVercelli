const ExcelJS = require('exceljs');

/**
 * Controller per l'esportazione delle statistiche in formato Excel
 */
class ExportStatisticheController {
    
    /**
     * Esporta tutte le statistiche in un file Excel moderno e sofisticato
     */
    static async esportaExcel(req, res) {
        try {
            // Recupera le statistiche (stesso codice del controller statistiche)
            const statistiche = await ExportStatisticheController._getStatistiche(req);
            
            // Crea il workbook
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Borgo Vercelli Admin';
            workbook.created = new Date();
            workbook.modified = new Date();
            workbook.lastPrinted = new Date();
            
            // Crea i vari fogli
            await ExportStatisticheController._createDashboardSheet(workbook, statistiche);
            await ExportStatisticheController._createDettagliSheet(workbook, statistiche);
            await ExportStatisticheController._createPrenotazioniSheet(workbook, statistiche);
            await ExportStatisticheController._createUtentiSheet(workbook, statistiche);
            // Aggiunge un foglio con l'elenco dettagliato di tutti gli utenti
            await ExportStatisticheController._createUtentiDettagliatiSheet(workbook, statistiche);
            await ExportStatisticheController._createContenutoSheet(workbook, statistiche);
            await ExportStatisticheController._createSicurezzaSheet(workbook, statistiche);
            await ExportStatisticheController._createGraficiSheet(workbook, statistiche);
            await ExportStatisticheController._createTendenzeSheet(workbook, statistiche);
            await ExportStatisticheController._createCampiSheet(workbook, statistiche);
            await ExportStatisticheController._createRawDataSheet(workbook, statistiche);
            
            // Genera il nome del file
            const dataOggi = new Date().toISOString().split('T')[0];
            const filename = `Statistiche_BorgoVercelli_${dataOggi}.xlsx`;
            
            // Imposta gli headers per il download
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            // Scrivi il file nella response
            await workbook.xlsx.write(res);
            res.end();
            
        } catch (error) {
            console.error('Errore durante l\'esportazione Excel:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Errore durante l\'esportazione delle statistiche' 
            });
        }
    }
    
    /**
     * Crea il foglio Dashboard con KPI principali e grafici
     */
    static async _createDashboardSheet(workbook, stats) {
        const sheet = workbook.addWorksheet('Dashboard', {
            views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }]
        });
        
        // Header del report
        sheet.mergeCells('A1:F1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = '📊 DASHBOARD STATISTICHE BORGO VERCELLI';
        titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 35;
        
        // Data generazione
        sheet.mergeCells('A2:F2');
        const dateCell = sheet.getCell('A2');
        dateCell.value = `Generato il: ${new Date().toLocaleDateString('it-IT', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        })}`;
        dateCell.font = { italic: true, size: 11 };
        dateCell.alignment = { horizontal: 'center' };
        sheet.getRow(2).height = 20;
        
        // KPI Principali
        let currentRow = 4;
        sheet.getCell(`A${currentRow}`).value = '🎯 METRICHE PRINCIPALI';
        sheet.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: 'FF2563EB' } };
        sheet.mergeCells(`A${currentRow}:F${currentRow}`);
        currentRow += 2;
        
        // Tabella KPI
        const kpiData = [
            { metrica: '👥 Utenti Totali', valore: stats.utentiTotali || 0, icona: '👥', colore: 'FF3B82F6' },
            { metrica: '📰 Notizie Pubblicate', valore: stats.notiziePubblicate || 0, icona: '📰', colore: 'FF10B981' },
            { metrica: '📅 Eventi Attivi', valore: stats.eventiAttivi || 0, icona: '📅', colore: 'FFF59E0B' },
            { metrica: '✅ Prenotazioni Attive', valore: stats.prenotazioniAttive || 0, icona: '✅', colore: 'FF06B6D4' },
            { metrica: '⚡ Utenti Attivi (30gg)', valore: stats.utentiAttivi30gg || 0, icona: '⚡', colore: 'FF8B5CF6' },
            { metrica: '📊 Media Giornaliera', valore: stats.mediaPrenotazioniGiornaliere || 0, icona: '📊', colore: 'FFEC4899' }
        ];
        
        // Headers
        const headerRow = sheet.getRow(currentRow);
        ['Metrica', 'Valore', 'Grafico', 'Status'].forEach((header, idx) => {
            const cell = headerRow.getCell(idx + 1);
            cell.value = header;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' }, bottom: { style: 'thin' },
                left: { style: 'thin' }, right: { style: 'thin' }
            };
        });
        currentRow++;
        
        // Dati KPI
        kpiData.forEach((kpi, idx) => {
            const row = sheet.getRow(currentRow);
            row.height = 25;
            
            // Metrica
            const metricaCell = row.getCell(1);
            metricaCell.value = kpi.metrica;
            metricaCell.font = { bold: true };
            metricaCell.alignment = { horizontal: 'left', vertical: 'middle' };
            
            // Valore
            const valoreCell = row.getCell(2);
            valoreCell.value = kpi.valore;
            valoreCell.font = { size: 14, bold: true, color: { argb: kpi.colore } };
            valoreCell.alignment = { horizontal: 'center', vertical: 'middle' };
            
            // Barra grafica (usando caratteri)
            const maxValue = Math.max(...kpiData.map(k => k.valore));
            const barLength = Math.round((kpi.valore / maxValue) * 10);
            const graficaCell = row.getCell(3);
            graficaCell.value = '█'.repeat(barLength);
            graficaCell.font = { color: { argb: kpi.colore } };
            
            // Status
            const statusCell = row.getCell(4);
            statusCell.value = kpi.valore > 0 ? '✓ Attivo' : '⚠ Nessun dato';
            statusCell.font = { color: { argb: kpi.valore > 0 ? 'FF10B981' : 'FFF59E0B' } };
            statusCell.alignment = { horizontal: 'center' };
            
            // Bordi
            [1, 2, 3, 4].forEach(col => {
                row.getCell(col).border = {
                    top: { style: 'thin' }, bottom: { style: 'thin' },
                    left: { style: 'thin' }, right: { style: 'thin' }
                };
            });
            
            currentRow++;
        });
        
        // Sezione Sicurezza
        currentRow += 2;
        sheet.getCell(`A${currentRow}`).value = '🔒 SICUREZZA E MODERAZIONE';
        sheet.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: 'FFDC2626' } };
        sheet.mergeCells(`A${currentRow}:F${currentRow}`);
        currentRow += 2;
        
        const sicurezzaData = [
            { metrica: '🚫 Utenti Bannati', valore: stats.utentiBannati || 0, colore: 'FFDC2626' },
            { metrica: '⏸️ Utenti Sospesi', valore: stats.utentiSospesi || 0, colore: 'FFF59E0B' },
            { metrica: '❌ Prenotazioni Annullate', valore: stats.prenotazioniAnnullate || 0, colore: 'FF64748B' },
            { metrica: '📝 Prenotazioni con Note', valore: stats.prenotazioniConNote || 0, colore: 'FF10B981' }
        ];
        
        // Headers sicurezza
        const secHeaderRow = sheet.getRow(currentRow);
        ['Metrica', 'Valore', 'Percentuale', 'Trend'].forEach((header, idx) => {
            const cell = secHeaderRow.getCell(idx + 1);
            cell.value = header;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        currentRow++;
        
        // Dati sicurezza
        sicurezzaData.forEach(item => {
            const row = sheet.getRow(currentRow);
            row.getCell(1).value = item.metrica;
            row.getCell(2).value = item.valore;
            row.getCell(2).font = { bold: true, color: { argb: item.colore } };
            row.getCell(2).alignment = { horizontal: 'center' };
            
            // Calcola percentuale
            const totale = stats.utentiTotali || 1;
            const percentuale = ((item.valore / totale) * 100).toFixed(1);
            row.getCell(3).value = `${percentuale}%`;
            row.getCell(3).alignment = { horizontal: 'center' };
            
            // Trend indicator
            row.getCell(4).value = item.valore === 0 ? '✅ Ottimo' : item.valore < 5 ? '⚠️ Attenzione' : '🔴 Critico';
            
            currentRow++;
        });
        
        // Imposta larghezza colonne
        sheet.getColumn(1).width = 30;
        sheet.getColumn(2).width = 15;
        sheet.getColumn(3).width = 20;
        sheet.getColumn(4).width = 20;
        sheet.getColumn(5).width = 15;
        sheet.getColumn(6).width = 15;
    }
    
    /**
     * Crea il foglio Dettagli con tutte le statistiche
     */
    static async _createDettagliSheet(workbook, stats) {
        const sheet = workbook.addWorksheet('Dettagli Completi');
        
        // Header
        sheet.mergeCells('A1:D1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = '📋 RIEPILOGO DETTAGLIATO STATISTICHE';
        titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 30;
        
        // Tabella dettagli
        const dettagli = [
            { categoria: 'UTENTI', dati: [
                { nome: 'Utenti Totali', valore: stats.utentiTotali || 0 },
                { nome: 'Utenti Attivi (30gg)', valore: stats.utentiAttivi30gg || 0 },
                { nome: 'Nuovi Utenti (30gg)', valore: stats.nuoviUtenti30gg || 0 },
                { nome: 'Utenti Bannati', valore: stats.utentiBannati || 0 },
                { nome: 'Utenti Sospesi', valore: stats.utentiSospesi || 0 }
            ]},
            { categoria: 'PRENOTAZIONI', dati: [
                { nome: 'Prenotazioni Totali', valore: stats.prenotazioniTotali || 0 },
                { nome: 'Prenotazioni Attive', valore: stats.prenotazioniAttive || 0 },
                { nome: 'Prenotazioni Confermate', valore: stats.prenotazioniConfermate || 0 },
                { nome: 'Prenotazioni Annullate', valore: stats.prenotazioniAnnullate || 0 },
                { nome: 'Prenotazioni Oggi', valore: stats.prenotazioniOggi || 0 },
                { nome: 'Media Giornaliera', valore: stats.mediaPrenotazioniGiornaliere || 0 },
                { nome: 'Tasso Conferma (%)', valore: stats.tassoConferma || 0 },
                { nome: 'Tasso Annullamento (%)', valore: stats.tassoAnnullamento || 0 }
            ]},
            { categoria: 'CONTENUTI', dati: [
                { nome: 'Notizie Pubblicate', valore: stats.notiziePubblicate || 0 },
                { nome: 'Notizie Recenti (7gg)', valore: stats.notizie7gg || 0 },
                { nome: 'Eventi Attivi', valore: stats.eventiAttivi || 0 },
                { nome: 'Eventi Totali (Storico)', valore: stats.eventiTotaliStorico || 0 },
                { nome: 'Eventi in Arrivo (7gg)', valore: stats.eventiProssimi7gg || 0 },
                { nome: 'Foto in Galleria', valore: stats.fotoGalleria || 0 }
            ]},
            { categoria: 'RISORSE', dati: [
                { nome: 'Campi Totali', valore: stats.campiTotali || 0 },
                { nome: 'Campi Attivi', valore: stats.campiAttivi || 0 },
                { nome: 'Squadre Registrate', valore: stats.squadreTotali || 0 },
                { nome: 'Campo Più Popolare', valore: stats.campoPopolare?.nome || 'N/D' },
                { nome: 'Prenotazioni Campo Top', valore: stats.campoPopolare?.count || 0 }
            ]},
            { categoria: 'QUALITÀ', dati: [
                { nome: 'Recensioni Totali', valore: stats.recensioniTotali || 0 },
                { nome: 'Media Recensioni', valore: stats.mediaRecensioni || 0 },
                { nome: 'Prenotazioni con Note', valore: stats.prenotazioniConNote || 0 }
            ]}
        ];
        
        let currentRow = 3;
        
        dettagli.forEach(categoria => {
            // Intestazione categoria
            sheet.mergeCells(`A${currentRow}:D${currentRow}`);
            const catCell = sheet.getCell(`A${currentRow}`);
            catCell.value = `📂 ${categoria.categoria}`;
            catCell.font = { size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
            catCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
            catCell.alignment = { horizontal: 'left', vertical: 'middle' };
            sheet.getRow(currentRow).height = 25;
            currentRow++;
            
            // Headers colonne
            const headerRow = sheet.getRow(currentRow);
            ['Metrica', 'Valore', 'Grafico', 'Note'].forEach((h, idx) => {
                const cell = headerRow.getCell(idx + 1);
                cell.value = h;
                cell.font = { bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
                cell.alignment = { horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin' }, bottom: { style: 'thin' },
                    left: { style: 'thin' }, right: { style: 'thin' }
                };
            });
            currentRow++;
            
            // Dati
            categoria.dati.forEach(dato => {
                const row = sheet.getRow(currentRow);
                row.getCell(1).value = dato.nome;
                row.getCell(2).value = dato.valore;
                row.getCell(2).alignment = { horizontal: 'center' };
                row.getCell(2).font = { bold: true };
                
                // Barra visuale
                if (typeof dato.valore === 'number') {
                    const maxInCategory = Math.max(...categoria.dati.filter(d => typeof d.valore === 'number').map(d => d.valore));
                    const barLength = maxInCategory > 0 ? Math.round((dato.valore / maxInCategory) * 15) : 0;
                    row.getCell(3).value = '▓'.repeat(barLength);
                    row.getCell(3).font = { color: { argb: 'FF0EA5E9' } };
                }
                
                // Note
                row.getCell(4).value = dato.valore > 0 ? '✓' : '-';
                row.getCell(4).alignment = { horizontal: 'center' };
                
                // Bordi
                [1, 2, 3, 4].forEach(col => {
                    row.getCell(col).border = {
                        top: { style: 'thin' }, bottom: { style: 'thin' },
                        left: { style: 'thin' }, right: { style: 'thin' }
                    };
                });
                
                currentRow++;
            });
            
            currentRow += 1; // Spazio tra categorie
        });
        
        // Imposta larghezza colonne
        sheet.getColumn(1).width = 35;
        sheet.getColumn(2).width = 15;
        sheet.getColumn(3).width = 20;
        sheet.getColumn(4).width = 15;
    }
    
    /**
     * Crea il foglio Prenotazioni
     */
    static async _createPrenotazioniSheet(workbook, stats) {
        const sheet = workbook.addWorksheet('Prenotazioni');
        
        // Header
        sheet.mergeCells('A1:E1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = '📅 ANALISI PRENOTAZIONI';
        titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 30;
        
        // Riepilogo prenotazioni
        const riepilogo = [
            ['📊 Totale Prenotazioni', stats.prenotazioniTotali || 0, 'Storico completo'],
            ['✅ Confermate', stats.prenotazioniConfermate || 0, 'Prenotazioni confermate'],
            ['⏳ Attive', stats.prenotazioniAttive || 0, 'In corso o future'],
            ['✔️ Completate', stats.prenotazioniCompletate || 0, 'Terminate con successo'],
            ['❌ Annullate', stats.prenotazioniAnnullate || 0, 'Cancellate'],
            ['📅 Oggi', stats.prenotazioniOggi || 0, 'Prenotazioni odierne'],
            ['📈 Media Giornaliera', stats.mediaPrenotazioniGiornaliere || 0, 'Ultimi 30 giorni'],
            ['📝 Con Note', stats.prenotazioniConNote || 0, 'Con informazioni aggiuntive'],
            ['✓ Tasso Conferma', `${stats.tassoConferma || 0}%`, 'Percentuale conferme'],
            ['⚠️ Tasso Annullamento', `${stats.tassoAnnullamento || 0}%`, 'Percentuale annullamenti']
        ];
        
        let currentRow = 3;
        
        // Headers
        const headerRow = sheet.getRow(currentRow);
        ['Metrica', 'Valore', 'Descrizione', 'Performance', 'Trend'].forEach((h, idx) => {
            const cell = headerRow.getCell(idx + 1);
            cell.value = h;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' }, bottom: { style: 'thin' },
                left: { style: 'thin' }, right: { style: 'thin' }
            };
        });
        sheet.getRow(currentRow).height = 25;
        currentRow++;
        
        // Dati
        riepilogo.forEach((item, idx) => {
            const row = sheet.getRow(currentRow);
            row.height = 22;
            
            row.getCell(1).value = item[0];
            row.getCell(1).font = { bold: true };
            
            row.getCell(2).value = item[1];
            row.getCell(2).alignment = { horizontal: 'center' };
            row.getCell(2).font = { size: 12, bold: true, color: { argb: 'FF059669' } };
            
            row.getCell(3).value = item[2];
            row.getCell(3).font = { italic: true };
            
            // Performance indicator
            const valore = typeof item[1] === 'number' ? item[1] : parseFloat(item[1]);
            let performance = '🟢 Ottimo';
            if (item[0].includes('Annullate') || item[0].includes('Annullamento')) {
                performance = valore > 20 ? '🔴 Alto' : valore > 10 ? '🟡 Medio' : '🟢 Basso';
            } else {
                performance = valore > 50 ? '🟢 Ottimo' : valore > 20 ? '🟡 Buono' : '🔴 Da migliorare';
            }
            row.getCell(4).value = performance;
            row.getCell(4).alignment = { horizontal: 'center' };
            
            // Trend
            row.getCell(5).value = valore > 0 ? '📈' : '📊';
            row.getCell(5).alignment = { horizontal: 'center' };
            
            // Bordi
            [1, 2, 3, 4, 5].forEach(col => {
                row.getCell(col).border = {
                    top: { style: 'thin' }, bottom: { style: 'thin' },
                    left: { style: 'thin' }, right: { style: 'thin' }
                };
            });
            
            // Colore alternato
            if (idx % 2 === 0) {
                [1, 2, 3, 4, 5].forEach(col => {
                    row.getCell(col).fill = { 
                        type: 'pattern', 
                        pattern: 'solid', 
                        fgColor: { argb: 'FFF0FDF4' } 
                    };
                });
            }
            
            currentRow++;
        });
        
        // Sezione campo più popolare
        currentRow += 2;
        sheet.mergeCells(`A${currentRow}:E${currentRow}`);
        const campoPop = sheet.getCell(`A${currentRow}`);
        campoPop.value = '🏆 CAMPO PIÙ POPOLARE';
        campoPop.font = { size: 14, bold: true, color: { argb: 'FF059669' } };
        campoPop.alignment = { horizontal: 'left' };
        currentRow += 2;
        
        const campoData = [
            ['Campo', stats.campoPopolare?.nome || 'N/D'],
            ['Prenotazioni', stats.campoPopolare?.count || 0],
            ['Percentuale sul totale', `${stats.campoPopolare?.count && stats.prenotazioniTotali ? 
                ((stats.campoPopolare.count / stats.prenotazioniTotali) * 100).toFixed(1) : 0}%`]
        ];
        
        campoData.forEach(item => {
            const row = sheet.getRow(currentRow);
            row.getCell(1).value = item[0];
            row.getCell(1).font = { bold: true };
            row.getCell(2).value = item[1];
            row.getCell(2).font = { size: 12, bold: true, color: { argb: 'FFF59E0B' } };
            currentRow++;
        });
        
        // Imposta larghezza colonne
        sheet.getColumn(1).width = 25;
        sheet.getColumn(2).width = 15;
        sheet.getColumn(3).width = 30;
        sheet.getColumn(4).width = 18;
        sheet.getColumn(5).width = 12;
    }
    
    /**
     * Crea il foglio Utenti
     */
    static async _createUtentiSheet(workbook, stats) {
        const sheet = workbook.addWorksheet('Utenti');
        
        // Header
        sheet.mergeCells('A1:D1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = '👥 ANALISI UTENTI';
        titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 30;
        
        // Statistiche utenti
        const utentiData = [
            { categoria: 'Registrazioni', items: [
                ['Totale Utenti', stats.utentiTotali || 0],
                ['Nuovi (30 giorni)', stats.nuoviUtenti30gg || 0],
                ['Tasso Crescita', `${stats.variazioni?.utenti?.pct || 0}%`]
            ]},
            { categoria: 'Attività', items: [
                ['Utenti Attivi (30gg)', stats.utentiAttivi30gg || 0],
                ['Tasso Engagement', `${stats.utentiTotali > 0 ? 
                    ((stats.utentiAttivi30gg / stats.utentiTotali) * 100).toFixed(1) : 0}%`],
                ['Ultimo Accesso Medio', 'N/D']
            ]},
            { categoria: 'Moderazione', items: [
                ['Utenti Bannati', stats.utentiBannati || 0],
                ['Utenti Sospesi', stats.utentiSospesi || 0],
                ['Tasso Moderazione', `${stats.utentiTotali > 0 ? 
                    (((stats.utentiBannati + stats.utentiSospesi) / stats.utentiTotali) * 100).toFixed(1) : 0}%`]
            ]}
        ];
        
        let currentRow = 3;
        
        utentiData.forEach((sezione, idx) => {
            // Header sezione
            sheet.mergeCells(`A${currentRow}:D${currentRow}`);
            const secCell = sheet.getCell(`A${currentRow}`);
            secCell.value = `📊 ${sezione.categoria.toUpperCase()}`;
            secCell.font = { size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
            secCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
            secCell.alignment = { horizontal: 'left', vertical: 'middle' };
            sheet.getRow(currentRow).height = 23;
            currentRow++;
            
            // Items
            sezione.items.forEach((item, itemIdx) => {
                const row = sheet.getRow(currentRow);
                row.height = 20;
                
                row.getCell(1).value = item[0];
                row.getCell(1).font = { bold: true };
                row.getCell(1).alignment = { horizontal: 'left', indent: 1 };
                
                row.getCell(2).value = item[1];
                row.getCell(2).alignment = { horizontal: 'center' };
                row.getCell(2).font = { size: 12, bold: true, color: { argb: 'FF2563EB' } };
                
                // Status
                const valore = typeof item[1] === 'number' ? item[1] : parseFloat(item[1]);
                let status = '✓';
                if (item[0].includes('Bannati') || item[0].includes('Sospesi')) {
                    status = valore === 0 ? '✅ OK' : valore < 5 ? '⚠️ Attenzione' : '🔴 Alto';
                } else {
                    status = valore > 0 ? '✅ Attivo' : '⚠️ Inattivo';
                }
                row.getCell(3).value = status;
                row.getCell(3).alignment = { horizontal: 'center' };
                
                // Trend
                row.getCell(4).value = valore > 0 ? '📈' : '📊';
                row.getCell(4).alignment = { horizontal: 'center' };
                
                // Bordi
                [1, 2, 3, 4].forEach(col => {
                    row.getCell(col).border = {
                        top: { style: 'thin' }, bottom: { style: 'thin' },
                        left: { style: 'thin' }, right: { style: 'thin' }
                    };
                });
                
                // Alternating color
                if (itemIdx % 2 === 0) {
                    [1, 2, 3, 4].forEach(col => {
                        row.getCell(col).fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFDBEAFE' }
                        };
                    });
                }
                
                currentRow++;
            });
            
            currentRow += 1;
        });
        
        // Imposta larghezza colonne
        sheet.getColumn(1).width = 30;
        sheet.getColumn(2).width = 18;
        sheet.getColumn(3).width = 18;
        sheet.getColumn(4).width = 12;
    }
    
    /**
     * Crea il foglio Contenuto
     */
    static async _createContenutoSheet(workbook, stats) {
        const sheet = workbook.addWorksheet('Contenuti');
        
        // Header
        sheet.mergeCells('A1:D1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = '📰 ANALISI CONTENUTI';
        titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5CF6' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 30;
        
        const contenutoData = [
            { tipo: '📰 Notizie', stats: [
                ['Totale Pubblicate', stats.notiziePubblicate || 0],
                ['Ultime 7 giorni', stats.notizie7gg || 0],
                ['Media Settimanale', stats.notizie7gg ? Math.round(stats.notizie7gg / 7 * 10) / 10 : 0]
            ]},
            { tipo: '📅 Eventi', stats: [
                ['Attivi', stats.eventiAttivi || 0],
                ['Totale Storico', stats.eventiTotaliStorico || 0],
                ['Prossimi 7 giorni', stats.eventiProssimi7gg || 0]
            ]},
            { tipo: '📸 Multimedia', stats: [
                ['Foto Galleria', stats.fotoGalleria || 0],
                ['Recensioni', stats.recensioniTotali || 0],
                ['Media Valutazioni', stats.mediaRecensioni || 0]
            ]}
        ];
        
        let currentRow = 3;
        
        contenutoData.forEach(sezione => {
            // Header sezione
            sheet.mergeCells(`A${currentRow}:D${currentRow}`);
            const secCell = sheet.getCell(`A${currentRow}`);
            secCell.value = sezione.tipo;
            secCell.font = { size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
            secCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
            secCell.alignment = { horizontal: 'left', vertical: 'middle' };
            sheet.getRow(currentRow).height = 25;
            currentRow++;
            
            // Headers colonne
            const headerRow = sheet.getRow(currentRow);
            ['Metrica', 'Valore', 'Grafico', 'Status'].forEach((h, idx) => {
                const cell = headerRow.getCell(idx + 1);
                cell.value = h;
                cell.font = { bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9D5FF' } };
                cell.alignment = { horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin' }, bottom: { style: 'thin' },
                    left: { style: 'thin' }, right: { style: 'thin' }
                };
            });
            currentRow++;
            
            // Stats
            sezione.stats.forEach((stat, idx) => {
                const row = sheet.getRow(currentRow);
                row.height = 20;
                
                row.getCell(1).value = stat[0];
                row.getCell(1).font = { bold: true };
                row.getCell(1).alignment = { indent: 1 };
                
                row.getCell(2).value = stat[1];
                row.getCell(2).alignment = { horizontal: 'center' };
                row.getCell(2).font = { size: 12, bold: true, color: { argb: 'FF7C3AED' } };
                
                // Barra grafica
                const maxInSection = Math.max(...sezione.stats.map(s => typeof s[1] === 'number' ? s[1] : 0));
                const barLength = maxInSection > 0 ? Math.round((stat[1] / maxInSection) * 12) : 0;
                row.getCell(3).value = '▓'.repeat(barLength);
                row.getCell(3).font = { color: { argb: 'FF8B5CF6' } };
                
                // Status
                row.getCell(4).value = stat[1] > 0 ? '✓ Presente' : '○ Vuoto';
                row.getCell(4).alignment = { horizontal: 'center' };
                
                // Bordi
                [1, 2, 3, 4].forEach(col => {
                    row.getCell(col).border = {
                        top: { style: 'thin' }, bottom: { style: 'thin' },
                        left: { style: 'thin' }, right: { style: 'thin' }
                    };
                });
                
                // Alternating color
                if (idx % 2 === 0) {
                    [1, 2, 3, 4].forEach(col => {
                        row.getCell(col).fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFAF5FF' }
                        };
                    });
                }
                
                currentRow++;
            });
            
            currentRow += 1;
        });
        
        // Imposta larghezza colonne
        sheet.getColumn(1).width = 30;
        sheet.getColumn(2).width = 15;
        sheet.getColumn(3).width = 25;
        sheet.getColumn(4).width = 18;
    }
    
    /**
     * Crea il foglio Sicurezza
     */
    static async _createSicurezzaSheet(workbook, stats) {
        const sheet = workbook.addWorksheet('Sicurezza');
        
        // Header
        sheet.mergeCells('A1:E1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = '🔒 REPORT SICUREZZA E MODERAZIONE';
        titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 30;
        
        // Riepilogo sicurezza
        const totaleUtenti = stats.utentiTotali || 1;
        const totalePrenotazioni = stats.prenotazioniTotali || 1;
        
        const sicurezzaData = [
            {
                categoria: '👤 MODERAZIONE UTENTI',
                colore: 'FFDC2626',
                items: [
                    ['Utenti Bannati', stats.utentiBannati || 0, 
                     `${((stats.utentiBannati / totaleUtenti) * 100).toFixed(2)}%`],
                    ['Utenti Sospesi', stats.utentiSospesi || 0, 
                     `${((stats.utentiSospesi / totaleUtenti) * 100).toFixed(2)}%`],
                    ['Utenti Attivi', totaleUtenti - (stats.utentiBannati || 0) - (stats.utentiSospesi || 0), 
                     `${(((totaleUtenti - (stats.utentiBannati || 0) - (stats.utentiSospesi || 0)) / totaleUtenti) * 100).toFixed(2)}%`]
                ]
            },
            {
                categoria: '📋 GESTIONE PRENOTAZIONI',
                colore: 'FFF59E0B',
                items: [
                    ['Prenotazioni Annullate', stats.prenotazioniAnnullate || 0, 
                     `${((stats.prenotazioniAnnullate / totalePrenotazioni) * 100).toFixed(2)}%`],
                    ['Tasso Annullamento', `${stats.tassoAnnullamento || 0}%`, '-'],
                    ['Prenotazioni con Note', stats.prenotazioniConNote || 0, 
                     `${((stats.prenotazioniConNote / totalePrenotazioni) * 100).toFixed(2)}%`]
                ]
            },
            {
                categoria: '✅ INDICATORI POSITIVI',
                colore: 'FF10B981',
                items: [
                    ['Tasso Conferma', `${stats.tassoConferma || 0}%`, 'Ottimo > 80%'],
                    ['Prenotazioni Completate', stats.prenotazioniCompletate || 0, '-'],
                    ['Engagement Utenti', `${totaleUtenti > 0 ? 
                        ((stats.utentiAttivi30gg / totaleUtenti) * 100).toFixed(1) : 0}%`, 'Buono > 50%']
                ]
            }
        ];
        
        let currentRow = 3;
        
        sicurezzaData.forEach(sezione => {
            // Header sezione
            sheet.mergeCells(`A${currentRow}:E${currentRow}`);
            const secCell = sheet.getCell(`A${currentRow}`);
            secCell.value = sezione.categoria;
            secCell.font = { size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
            secCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sezione.colore } };
            secCell.alignment = { horizontal: 'left', vertical: 'middle' };
            sheet.getRow(currentRow).height = 25;
            currentRow++;
            
            // Headers colonne
            const headerRow = sheet.getRow(currentRow);
            ['Indicatore', 'Valore', 'Percentuale', 'Valutazione', 'Action'].forEach((h, idx) => {
                const cell = headerRow.getCell(idx + 1);
                cell.value = h;
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF64748B' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' }, bottom: { style: 'thin' },
                    left: { style: 'thin' }, right: { style: 'thin' }
                };
            });
            sheet.getRow(currentRow).height = 22;
            currentRow++;
            
            // Dati
            sezione.items.forEach((item, idx) => {
                const row = sheet.getRow(currentRow);
                row.height = 20;
                
                row.getCell(1).value = item[0];
                row.getCell(1).font = { bold: true };
                row.getCell(1).alignment = { indent: 1 };
                
                row.getCell(2).value = item[1];
                row.getCell(2).alignment = { horizontal: 'center' };
                row.getCell(2).font = { size: 12, bold: true };
                
                row.getCell(3).value = item[2];
                row.getCell(3).alignment = { horizontal: 'center' };
                
                // Valutazione
                let valutazione = '';
                const valore = typeof item[1] === 'number' ? item[1] : parseFloat(item[1]);
                
                if (item[0].includes('Bannati') || item[0].includes('Sospesi') || item[0].includes('Annullate')) {
                    valutazione = valore === 0 ? '✅ Ottimo' : valore < 5 ? '⚠️ Accettabile' : '🔴 Critico';
                    row.getCell(2).font = { 
                        ...row.getCell(2).font, 
                        color: { argb: valore === 0 ? 'FF10B981' : valore < 5 ? 'FFF59E0B' : 'FFDC2626' } 
                    };
                } else {
                    valutazione = valore > 70 ? '✅ Ottimo' : valore > 40 ? '⚠️ Buono' : '🔴 Da migliorare';
                    row.getCell(2).font = { 
                        ...row.getCell(2).font, 
                        color: { argb: valore > 70 ? 'FF10B981' : valore > 40 ? 'FFF59E0B' : 'FFDC2626' } 
                    };
                }
                
                row.getCell(4).value = valutazione;
                row.getCell(4).alignment = { horizontal: 'center' };
                
                // Action
                row.getCell(5).value = valore > 0 ? '📊 Monitorare' : '✓ OK';
                row.getCell(5).alignment = { horizontal: 'center' };
                
                // Bordi
                [1, 2, 3, 4, 5].forEach(col => {
                    row.getCell(col).border = {
                        top: { style: 'thin' }, bottom: { style: 'thin' },
                        left: { style: 'thin' }, right: { style: 'thin' }
                    };
                });
                
                // Alternating color
                if (idx % 2 === 0) {
                    [1, 2, 3, 4, 5].forEach(col => {
                        row.getCell(col).fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFEF2F2' }
                        };
                    });
                }
                
                currentRow++;
            });
            
            currentRow += 2;
        });
        
        // Raccomandazioni
        currentRow++;
        sheet.mergeCells(`A${currentRow}:E${currentRow}`);
        const recCell = sheet.getCell(`A${currentRow}`);
        recCell.value = '💡 RACCOMANDAZIONI';
        recCell.font = { size: 13, bold: true, color: { argb: 'FF0EA5E9' } };
        currentRow += 2;
        
        const raccomandazioni = [
            `✓ Monitorare costantemente il tasso di annullamento (target: < 10%)`,
            `✓ Mantenere il numero di utenti bannati/sospesi sotto il 2% del totale`,
            `✓ Incrementare l'engagement degli utenti (target: > 60%)`,
            `✓ Verificare le motivazioni delle prenotazioni annullate`,
            `✓ Incentivare le recensioni positive per aumentare la qualità del servizio`
        ];
        
        raccomandazioni.forEach(rec => {
            const row = sheet.getRow(currentRow);
            sheet.mergeCells(`A${currentRow}:E${currentRow}`);
            row.getCell(1).value = rec;
            row.getCell(1).font = { italic: true };
            row.getCell(1).alignment = { indent: 1, wrapText: true };
            row.height = 20;
            currentRow++;
        });
        
        // Imposta larghezza colonne
        sheet.getColumn(1).width = 35;
        sheet.getColumn(2).width = 15;
        sheet.getColumn(3).width = 15;
        sheet.getColumn(4).width = 20;
        sheet.getColumn(5).width = 18;
    }
    
    /**
     * Crea il foglio Grafici con visualizzazioni dati
     */
    static async _createGraficiSheet(workbook, stats) {
        const sheet = workbook.addWorksheet('Grafici Analitici');
        
        // Header
        sheet.mergeCells('A1:H1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = '📊 GRAFICI E VISUALIZZAZIONI DATI';
        titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 35;
        
        // Sezione 1: Distribuzione Utenti
        let currentRow = 3;
        sheet.mergeCells(`A${currentRow}:H${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = '📈 DISTRIBUZIONE STATI UTENTI';
        sheet.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: 'FF6366F1' } };
        currentRow += 2;
        
        const utentiAttivi = (stats.utentiTotali || 0) - (stats.utentiBannati || 0) - (stats.utentiSospesi || 0);
        const utentiData = [
            ['Categoria', 'Numero', 'Percentuale', 'Grafico'],
            ['👥 Utenti Attivi', utentiAttivi, 
             `${((utentiAttivi / (stats.utentiTotali || 1)) * 100).toFixed(1)}%`, ''],
            ['🚫 Utenti Bannati', stats.utentiBannati || 0, 
             `${((stats.utentiBannati || 0) / (stats.utentiTotali || 1) * 100).toFixed(1)}%`, ''],
            ['⏸️ Utenti Sospesi', stats.utentiSospesi || 0, 
             `${((stats.utentiSospesi || 0) / (stats.utentiTotali || 1) * 100).toFixed(1)}%`, '']
        ];
        
        utentiData.forEach((row, idx) => {
            const excelRow = sheet.getRow(currentRow);
            row.forEach((cell, colIdx) => {
                const excelCell = excelRow.getCell(colIdx + 1);
                excelCell.value = cell;
                if (idx === 0) {
                    excelCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
                    excelCell.alignment = { horizontal: 'center' };
                } else {
                    if (colIdx === 1) {
                        excelCell.font = { bold: true, size: 13 };
                        excelCell.alignment = { horizontal: 'center' };
                    }
                    if (colIdx === 2) {
                        excelCell.alignment = { horizontal: 'center' };
                    }
                    // Crea barra grafica nella colonna 4
                    if (colIdx === 3 && idx > 0) {
                        const valore = parseFloat(row[2]);
                        const barLength = Math.round((valore / 100) * 20);
                        excelCell.value = '█'.repeat(barLength);
                        excelCell.font = { color: { argb: idx === 1 ? 'FF10B981' : idx === 2 ? 'FFDC2626' : 'FFF59E0B' } };
                    }
                }
                excelCell.border = {
                    top: { style: 'thin' }, bottom: { style: 'thin' },
                    left: { style: 'thin' }, right: { style: 'thin' }
                };
            });
            currentRow++;
        });
        
        // Sezione 2: Distribuzione Prenotazioni
        currentRow += 2;
        sheet.mergeCells(`A${currentRow}:H${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = '📅 DISTRIBUZIONE STATI PRENOTAZIONI';
        sheet.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: 'FF10B981' } };
        currentRow += 2;
        
        const prenotazioniData = [
            ['Stato', 'Numero', 'Percentuale', 'Grafico'],
            ['✅ Confermate', stats.prenotazioniConfermate || 0, 
             `${stats.tassoConferma || 0}%`, ''],
            ['⏳ Attive', stats.prenotazioniAttive || 0, 
             `${((stats.prenotazioniAttive || 0) / (stats.prenotazioniTotali || 1) * 100).toFixed(1)}%`, ''],
            ['✔️ Completate', stats.prenotazioniCompletate || 0, 
             `${((stats.prenotazioniCompletate || 0) / (stats.prenotazioniTotali || 1) * 100).toFixed(1)}%`, ''],
            ['❌ Annullate', stats.prenotazioniAnnullate || 0, 
             `${stats.tassoAnnullamento || 0}%`, '']
        ];
        
        prenotazioniData.forEach((row, idx) => {
            const excelRow = sheet.getRow(currentRow);
            row.forEach((cell, colIdx) => {
                const excelCell = excelRow.getCell(colIdx + 1);
                excelCell.value = cell;
                if (idx === 0) {
                    excelCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
                    excelCell.alignment = { horizontal: 'center' };
                } else {
                    if (colIdx === 1) {
                        excelCell.font = { bold: true, size: 13 };
                        excelCell.alignment = { horizontal: 'center' };
                    }
                    if (colIdx === 2) {
                        excelCell.alignment = { horizontal: 'center' };
                    }
                    if (colIdx === 3 && idx > 0) {
                        const valore = parseFloat(row[2]);
                        const barLength = Math.round((valore / 100) * 20);
                        excelCell.value = '█'.repeat(barLength);
                        const colors = ['FF10B981', 'FF06B6D4', 'FF3B82F6', 'FFDC2626'];
                        excelCell.font = { color: { argb: colors[idx - 1] } };
                    }
                }
                excelCell.border = {
                    top: { style: 'thin' }, bottom: { style: 'thin' },
                    left: { style: 'thin' }, right: { style: 'thin' }
                };
            });
            currentRow++;
        });
        
        // Sezione 3: Confronto Metriche Temporali
        currentRow += 2;
        sheet.mergeCells(`A${currentRow}:H${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = '⏰ ATTIVITÀ TEMPORALE';
        sheet.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: 'FFF59E0B' } };
        currentRow += 2;
        
        const temporaleData = [
            ['Periodo', 'Prenotazioni', 'Nuovi Utenti', 'Notizie', 'Eventi'],
            ['📅 Oggi', stats.prenotazioniOggi || 0, '-', '-', '-'],
            ['📆 Ultimi 7gg', '-', '-', stats.notizie7gg || 0, stats.eventiProssimi7gg || 0],
            ['📊 Ultimi 30gg', stats.mediaPrenotazioniGiornaliere ? 
             Math.round((stats.mediaPrenotazioniGiornaliere || 0) * 30) : 0, 
             stats.nuoviUtenti30gg || 0, '-', '-']
        ];
        
        temporaleData.forEach((row, idx) => {
            const excelRow = sheet.getRow(currentRow);
            row.forEach((cell, colIdx) => {
                const excelCell = excelRow.getCell(colIdx + 1);
                excelCell.value = cell;
                if (idx === 0) {
                    excelCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } };
                    excelCell.alignment = { horizontal: 'center' };
                } else {
                    excelCell.alignment = { horizontal: 'center' };
                    if (colIdx > 0 && cell !== '-') {
                        excelCell.font = { bold: true, color: { argb: 'FFD97706' } };
                    }
                }
                excelCell.border = {
                    top: { style: 'thin' }, bottom: { style: 'thin' },
                    left: { style: 'thin' }, right: { style: 'thin' }
                };
            });
            currentRow++;
        });
        
        // Sezione 4: Top Performance
        currentRow += 2;
        sheet.mergeCells(`A${currentRow}:H${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = '🏆 TOP PERFORMANCE';
        sheet.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: 'FFEC4899' } };
        currentRow += 2;
        
        const performanceData = [
            ['Metrica', 'Valore', 'Rating'],
            ['🏟️ Campo Più Popolare', stats.campoPopolare?.nome || 'N/D', 
             `⭐ ${stats.campoPopolare?.count || 0} prenotazioni`],
            ['⭐ Media Recensioni', `${stats.mediaRecensioni || 0}/5`, 
             stats.mediaRecensioni >= 4 ? '🌟 Eccellente' : stats.mediaRecensioni >= 3 ? '👍 Buono' : '⚠️ Da migliorare'],
            ['💯 Tasso Conferma', `${stats.tassoConferma || 0}%`, 
             stats.tassoConferma >= 80 ? '✅ Ottimo' : stats.tassoConferma >= 60 ? '👍 Buono' : '⚠️ Da migliorare'],
            ['📈 Engagement Utenti', 
             `${stats.utentiTotali > 0 ? ((stats.utentiAttivi30gg / stats.utentiTotali) * 100).toFixed(1) : 0}%`,
             ((stats.utentiAttivi30gg / (stats.utentiTotali || 1)) * 100) >= 50 ? '✅ Alto' : '⚠️ Medio']
        ];
        
        performanceData.forEach((row, idx) => {
            const excelRow = sheet.getRow(currentRow);
            row.forEach((cell, colIdx) => {
                const excelCell = excelRow.getCell(colIdx + 1);
                excelCell.value = cell;
                if (idx === 0) {
                    excelCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDB2777' } };
                    excelCell.alignment = { horizontal: 'center' };
                } else {
                    if (colIdx === 0) excelCell.font = { bold: true };
                    if (colIdx === 1) {
                        excelCell.font = { bold: true, size: 13, color: { argb: 'FFDB2777' } };
                        excelCell.alignment = { horizontal: 'center' };
                    }
                    if (colIdx === 2) excelCell.alignment = { horizontal: 'center' };
                }
                excelCell.border = {
                    top: { style: 'thin' }, bottom: { style: 'thin' },
                    left: { style: 'thin' }, right: { style: 'thin' }
                };
            });
            currentRow++;
        });
        
        // Imposta larghezza colonne
        sheet.getColumn(1).width = 30;
        sheet.getColumn(2).width = 18;
        sheet.getColumn(3).width = 20;
        sheet.getColumn(4).width = 25;
        sheet.getColumn(5).width = 15;
        sheet.getColumn(6).width = 15;
        sheet.getColumn(7).width = 15;
        sheet.getColumn(8).width = 15;
    }
    
    /**
     * Crea il foglio Tendenze con dati mensili
     */
    static async _createTendenzeSheet(workbook, stats) {
        const sheet = workbook.addWorksheet('Tendenze Mensili');
        
        // Header
        sheet.mergeCells('A1:F1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = '📈 ANALISI TENDENZE E CRESCITA';
        titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5CF6' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 30;
        
        let currentRow = 3;
        
        // Sezione Tendenze Mensili
        if (stats.tendenzeMensili && stats.tendenzeMensili.length > 0) {
            sheet.mergeCells(`A${currentRow}:F${currentRow}`);
            sheet.getCell(`A${currentRow}`).value = '📊 DATI STORICI MENSILI';
            sheet.getCell(`A${currentRow}`).font = { size: 13, bold: true, color: { argb: 'FF8B5CF6' } };
            currentRow += 2;
            
            // Headers
            const headers = ['Mese', 'Prenotazioni', 'Nuovi Utenti', 'Trend Prenot.', 'Trend Utenti', 'Note'];
            const headerRow = sheet.getRow(currentRow);
            headers.forEach((h, idx) => {
                const cell = headerRow.getCell(idx + 1);
                cell.value = h;
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' }, bottom: { style: 'thin' },
                    left: { style: 'thin' }, right: { style: 'thin' }
                };
            });
            sheet.getRow(currentRow).height = 25;
            currentRow++;
            
            // Dati mensili
            stats.tendenzeMensili.slice(-12).forEach((mese, idx) => {
                const row = sheet.getRow(currentRow);
                const meseData = new Date(mese.mese);
                const meseName = meseData.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
                
                // Calcola trend
                let trendPren = '━';
                let trendUser = '━';
                if (idx > 0) {
                    const prevMese = stats.tendenzeMensili.slice(-12)[idx - 1];
                    const diffPren = (mese.prenotazioni || 0) - (prevMese.prenotazioni || 0);
                    const diffUser = (mese.nuovi_utenti || 0) - (prevMese.nuovi_utenti || 0);
                    trendPren = diffPren > 0 ? `📈 +${diffPren}` : diffPren < 0 ? `📉 ${diffPren}` : '━ 0';
                    trendUser = diffUser > 0 ? `📈 +${diffUser}` : diffUser < 0 ? `📉 ${diffUser}` : '━ 0';
                }
                
                const note = (mese.prenotazioni || 0) > 50 ? '⭐ Ottimo mese' : 
                            (mese.prenotazioni || 0) > 30 ? '✓ Buono' : '○ Normale';
                
                [meseName, mese.prenotazioni || 0, mese.nuovi_utenti || 0, trendPren, trendUser, note]
                    .forEach((val, colIdx) => {
                        const cell = row.getCell(colIdx + 1);
                        cell.value = val;
                        if (colIdx === 0) cell.font = { bold: true };
                        if (colIdx === 1 || colIdx === 2) {
                            cell.font = { bold: true, color: { argb: 'FF8B5CF6' } };
                            cell.alignment = { horizontal: 'center' };
                        }
                        if (colIdx === 3 || colIdx === 4) {
                            cell.alignment = { horizontal: 'center' };
                        }
                        cell.border = {
                            top: { style: 'thin' }, bottom: { style: 'thin' },
                            left: { style: 'thin' }, right: { style: 'thin' }
                        };
                        // Alternating colors
                        if (idx % 2 === 0) {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFFAF5FF' }
                            };
                        }
                    });
                currentRow++;
            });
        }
        
        // Sezione Variazioni
        currentRow += 2;
        sheet.mergeCells(`A${currentRow}:F${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = '📊 VARIAZIONI MENSILI';
        sheet.getCell(`A${currentRow}`).font = { size: 13, bold: true, color: { argb: 'FF10B981' } };
        currentRow += 2;
        
        const variazioniData = [
            ['Metrica', 'Variazione %', 'Direzione', 'Valutazione'],
            ['Utenti', `${stats.variazioni?.utenti?.pct || 0}%`, 
             stats.variazioni?.utenti?.direction || 'neutral',
             (stats.variazioni?.utenti?.pct || 0) > 0 ? '✅ Crescita' : '⚠️ Stabile'],
            ['Notizie', `${stats.variazioni?.notizie?.pct || 0}%`, 
             stats.variazioni?.notizie?.direction || 'neutral',
             (stats.variazioni?.notizie?.pct || 0) > 0 ? '✅ Crescita' : '⚠️ Stabile'],
            ['Eventi', `${stats.variazioni?.eventi?.pct || 0}%`, 
             stats.variazioni?.eventi?.direction || 'neutral',
             (stats.variazioni?.eventi?.pct || 0) > 0 ? '✅ Crescita' : '⚠️ Stabile'],
            ['Prenotazioni', `${stats.variazioni?.prenotazioni?.pct || 0}%`, 
             stats.variazioni?.prenotazioni?.direction || 'neutral',
             (stats.variazioni?.prenotazioni?.pct || 0) > 0 ? '✅ Crescita' : '⚠️ Stabile']
        ];
        
        variazioniData.forEach((row, idx) => {
            const excelRow = sheet.getRow(currentRow);
            row.forEach((cell, colIdx) => {
                const excelCell = excelRow.getCell(colIdx + 1);
                excelCell.value = cell;
                if (idx === 0) {
                    excelCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
                    excelCell.alignment = { horizontal: 'center' };
                } else {
                    if (colIdx === 0) excelCell.font = { bold: true };
                    if (colIdx === 1) {
                        excelCell.font = { bold: true, size: 12 };
                        excelCell.alignment = { horizontal: 'center' };
                        const pct = parseFloat(cell);
                        excelCell.font.color = { 
                            argb: pct > 0 ? 'FF10B981' : pct < 0 ? 'FFDC2626' : 'FF64748B' 
                        };
                    }
                    if (colIdx === 2) {
                        excelCell.alignment = { horizontal: 'center' };
                        excelCell.value = cell === 'up' ? '📈 Crescita' : 
                                        cell === 'down' ? '📉 Calo' : '━ Stabile';
                    }
                    if (colIdx === 3) excelCell.alignment = { horizontal: 'center' };
                }
                excelCell.border = {
                    top: { style: 'thin' }, bottom: { style: 'thin' },
                    left: { style: 'thin' }, right: { style: 'thin' }
                };
            });
            currentRow++;
        });
        
        // Imposta larghezza colonne
        sheet.getColumn(1).width = 25;
        sheet.getColumn(2).width = 18;
        sheet.getColumn(3).width = 18;
        sheet.getColumn(4).width = 20;
        sheet.getColumn(5).width = 20;
        sheet.getColumn(6).width = 20;
    }
    
    /**
     * Crea il foglio Campi con analisi dettagliata
     */
    static async _createCampiSheet(workbook, stats) {
        const sheet = workbook.addWorksheet('Analisi Campi');
        
        // Header
        sheet.mergeCells('A1:F1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = '⚽ ANALISI CAMPI SPORTIVI';
        titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 30;
        
        let currentRow = 3;
        
        // Riepilogo Campi
        sheet.mergeCells(`A${currentRow}:F${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = '📊 RIEPILOGO STRUTTURE';
        sheet.getCell(`A${currentRow}`).font = { size: 13, bold: true, color: { argb: 'FF0EA5E9' } };
        currentRow += 2;
        
        const campiRiepilogo = [
            ['Metrica', 'Valore', 'Dettaglio', 'Status'],
            ['🏟️ Campi Totali', stats.campiTotali || 0, 'Strutture disponibili', 
             stats.campiTotali > 0 ? '✅ Disponibili' : '⚠️ Nessuno'],
            ['✅ Campi Attivi', stats.campiAttivi || 0, 'Prenotabili', 
             stats.campiAttivi === stats.campiTotali ? '✅ Tutti attivi' : '⚠️ Alcuni inattivi'],
            ['🏆 Campo Top', stats.campoPopolare?.nome || 'N/D', 
             `${stats.campoPopolare?.count || 0} prenotazioni`, 
             stats.campoPopolare?.count > 0 ? '⭐ Popolare' : '○ Normale'],
            ['📊 Media per Campo', 
             stats.campiTotali > 0 ? Math.round((stats.prenotazioniTotali || 0) / stats.campiTotali) : 0,
             'Prenotazioni medie', '']
        ];
        
        campiRiepilogo.forEach((row, idx) => {
            const excelRow = sheet.getRow(currentRow);
            row.forEach((cell, colIdx) => {
                const excelCell = excelRow.getCell(colIdx + 1);
                excelCell.value = cell;
                if (idx === 0) {
                    excelCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
                    excelCell.alignment = { horizontal: 'center' };
                } else {
                    if (colIdx === 0) excelCell.font = { bold: true };
                    if (colIdx === 1) {
                        excelCell.font = { bold: true, size: 13, color: { argb: 'FF0EA5E9' } };
                        excelCell.alignment = { horizontal: 'center' };
                    }
                    if (colIdx === 3) excelCell.alignment = { horizontal: 'center' };
                }
                excelCell.border = {
                    top: { style: 'thin' }, bottom: { style: 'thin' },
                    left: { style: 'thin' }, right: { style: 'thin' }
                };
                if (idx % 2 === 0 && idx > 0) {
                    excelCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE0F2FE' }
                    };
                }
            });
            currentRow++;
        });
        
        // Utilizzo Campi
        currentRow += 2;
        sheet.mergeCells(`A${currentRow}:F${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = '📈 ANALISI UTILIZZO';
        sheet.getCell(`A${currentRow}`).font = { size: 13, bold: true, color: { argb: 'FF10B981' } };
        currentRow += 2;
        
        const utilizzoData = [
            ['Indicatore', 'Valore', 'Target', 'Performance'],
            ['Tasso Occupazione', 
             `${stats.prenotazioniTotali && stats.campiTotali ? 
                ((stats.prenotazioniTotali / (stats.campiTotali * 365)) * 100).toFixed(1) : 0}%`,
             '> 60%', ''],
            ['Prenotazioni Giornaliere', stats.mediaPrenotazioniGiornaliere || 0, '> 5', ''],
            ['Tasso Conferma', `${stats.tassoConferma || 0}%`, '> 80%', ''],
            ['Tasso Annullamento', `${stats.tassoAnnullamento || 0}%`, '< 10%', '']
        ];
        
        utilizzoData.forEach((row, idx) => {
            const excelRow = sheet.getRow(currentRow);
            row.forEach((cell, colIdx) => {
                const excelCell = excelRow.getCell(colIdx + 1);
                excelCell.value = cell;
                if (idx === 0) {
                    excelCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
                    excelCell.alignment = { horizontal: 'center' };
                } else {
                    if (colIdx === 0) excelCell.font = { bold: true };
                    if (colIdx === 1 || colIdx === 2) {
                        excelCell.alignment = { horizontal: 'center' };
                        if (colIdx === 1) excelCell.font = { bold: true };
                    }
                    // Performance indicator
                    if (colIdx === 3) {
                        const valore = parseFloat(row[1]);
                        let perf = '';
                        if (row[0].includes('Annullamento')) {
                            perf = valore < 10 ? '✅ Ottimo' : valore < 20 ? '⚠️ Accettabile' : '🔴 Alto';
                        } else if (row[0].includes('Conferma')) {
                            perf = valore >= 80 ? '✅ Ottimo' : valore >= 60 ? '⚠️ Buono' : '🔴 Basso';
                        } else {
                            perf = valore > 0 ? '✓ Attivo' : '○ Inattivo';
                        }
                        excelCell.value = perf;
                        excelCell.alignment = { horizontal: 'center' };
                    }
                }
                excelCell.border = {
                    top: { style: 'thin' }, bottom: { style: 'thin' },
                    left: { style: 'thin' }, right: { style: 'thin' }
                };
            });
            currentRow++;
        });
        
        // Raccomandazioni
        currentRow += 2;
        sheet.mergeCells(`A${currentRow}:F${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = '💡 RACCOMANDAZIONI';
        sheet.getCell(`A${currentRow}`).font = { size: 13, bold: true, color: { argb: 'FFF59E0B' } };
        currentRow += 2;
        
        const raccomandazioni = [
            '✓ Monitorare il campo più popolare per eventuali manutenzioni prioritarie',
            '✓ Incentivare l\'utilizzo dei campi meno prenotati',
            '✓ Ottimizzare gli orari di disponibilità basandosi sui picchi di prenotazione',
            '✓ Implementare promozioni per aumentare il tasso di occupazione',
            '✓ Analizzare feedback utenti per migliorare i servizi'
        ];
        
        raccomandazioni.forEach(rec => {
            const row = sheet.getRow(currentRow);
            sheet.mergeCells(`A${currentRow}:F${currentRow}`);
            row.getCell(1).value = rec;
            row.getCell(1).font = { italic: true };
            row.getCell(1).alignment = { indent: 1, wrapText: true };
            row.height = 20;
            currentRow++;
        });
        
        // Imposta larghezza colonne
        sheet.getColumn(1).width = 30;
        sheet.getColumn(2).width = 18;
        sheet.getColumn(3).width = 18;
        sheet.getColumn(4).width = 20;
        sheet.getColumn(5).width = 20;
        sheet.getColumn(6).width = 20;
    }
    
    /**
     * Crea il foglio Raw Data con tutti i dati grezzi
     */
    static async _createRawDataSheet(workbook, stats) {
        const sheet = workbook.addWorksheet('Dati Grezzi');
        
        // Header
        sheet.mergeCells('A1:B1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = '📄 DATI GREZZI - ESPORTAZIONE COMPLETA';
        titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF64748B' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 25;
        
        // Nota
        sheet.mergeCells('A2:B2');
        sheet.getCell('A2').value = 'Questi sono tutti i dati grezzi in formato chiave-valore per ulteriori elaborazioni';
        sheet.getCell('A2').font = { italic: true, size: 10 };
        sheet.getCell('A2').alignment = { horizontal: 'center' };
        
        let currentRow = 4;
        
        // Converti tutte le statistiche in array chiave-valore
        const flattenObject = (obj, prefix = '') => {
            let result = [];
            for (const [key, value] of Object.entries(obj)) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                    result = result.concat(flattenObject(value, newKey));
                } else if (Array.isArray(value)) {
                    result.push([newKey, `Array(${value.length} elementi)`]);
                    value.forEach((item, idx) => {
                        if (typeof item === 'object') {
                            result = result.concat(flattenObject(item, `${newKey}[${idx}]`));
                        } else {
                            result.push([`${newKey}[${idx}]`, item]);
                        }
                    });
                } else {
                    result.push([newKey, value]);
                }
            }
            return result;
        };
        
        const allData = flattenObject(stats);
        
        // Headers
        const headerRow = sheet.getRow(currentRow);
        ['Chiave', 'Valore'].forEach((h, idx) => {
            const cell = headerRow.getCell(idx + 1);
            cell.value = h;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
            cell.alignment = { horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' }, bottom: { style: 'thin' },
                left: { style: 'thin' }, right: { style: 'thin' }
            };
        });
        currentRow++;
        
        // Dati
        allData.forEach((item, idx) => {
            const row = sheet.getRow(currentRow);
            row.getCell(1).value = item[0];
            row.getCell(1).font = { bold: true, size: 9 };
            row.getCell(2).value = item[1];
            row.getCell(2).alignment = { horizontal: 'left' };
            
            [1, 2].forEach(col => {
                row.getCell(col).border = {
                    top: { style: 'thin' }, bottom: { style: 'thin' },
                    left: { style: 'thin' }, right: { style: 'thin' }
                };
            });
            
            if (idx % 2 === 0) {
                [1, 2].forEach(col => {
                    row.getCell(col).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF1F5F9' }
                    };
                });
            }
            
            currentRow++;
        });
        
        // Imposta larghezza colonne
        sheet.getColumn(1).width = 50;
        sheet.getColumn(2).width = 40;
    }

    /**
     * Crea il foglio Utenti Dettagliati con campi completi e conteggi prenotazioni per utente
     */
    static async _createUtentiDettagliatiSheet(workbook, stats) {
        const sheet = workbook.addWorksheet('Utenti Dettagliati');
        const userDao = require('../../users/services/dao-user');
        const prenotazioneDao = require('../../prenotazioni/services/dao-prenotazione');

        // Header
        sheet.mergeCells('A1:O1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = '👥 UTENTI DETTAGLIATI E STATO PRENOTAZIONI';
        titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 26;

        // Intestazioni colonne
        const headers = [
            'ID', 'Nome', 'Cognome', 'Email', 'Telefono', 'Tipo', 'Data Registrazione', 'Ultimo Accesso',
            'Data Nascita', 'Codice Fiscale', 'Ruolo Preferito', 'Piede Preferito', 'Livello Abilità', 'Città', 'Totale Prenotazioni'
        ];

        const headerRow = sheet.getRow(3);
        headers.forEach((h, idx) => {
            const cell = headerRow.getCell(idx + 1);
            cell.value = h;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
            cell.alignment = { horizontal: 'center' };
            cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
        });

        // Recupera tutti gli utenti (lista base) e poi i dettagli per riga
        let users = [];
        try {
            users = await userDao.getAllUsers();
        } catch (err) {
            console.error('[Export] Impossibile recuperare lista utenti:', err);
            users = [];
        }

        let currentRow = 4;

        for (const u of users) {
            try {
                // Recupera record completo utente
                const full = await userDao.getUserById(u.id);
                // Recupera prenotazioni utente
                const prenotazioni = await prenotazioneDao.getPrenotazioniByUserId(u.id);
                const totalePren = Array.isArray(prenotazioni) ? prenotazioni.length : 0;

                const row = sheet.getRow(currentRow);
                row.getCell(1).value = full.id;
                row.getCell(2).value = full.nome || '';
                row.getCell(3).value = full.cognome || '';
                row.getCell(4).value = full.email || '';
                row.getCell(5).value = full.telefono || '';
                row.getCell(6).value = full.tipo_utente_nome || full.tipo_utente_id || '';
                row.getCell(7).value = full.data_registrazione || full.created_at || '';
                row.getCell(8).value = full.updated_at || full.ultimo_accesso || '';
                row.getCell(9).value = full.data_nascita || '';
                row.getCell(10).value = full.codice_fiscale || '';
                row.getCell(11).value = full.ruolo_preferito || '';
                row.getCell(12).value = full.piede_preferito || '';
                row.getCell(13).value = full.livello_abilita || '';
                row.getCell(14).value = full.citta || '';
                row.getCell(15).value = totalePren;

                // Formattazione e bordi
                for (let c = 1; c <= headers.length; c++) {
                    const cell = row.getCell(c);
                    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
                    if (c === 15) cell.font = { bold: true, color: { argb: 'FF0EA5E9' } };
                }

                currentRow++;
            } catch (err) {
                console.error('[Export] Errore recupero dettagli utente id=', u.id, err);
            }
        }

        // Larghezze colonne
        const widths = [8, 18, 18, 28, 16, 14, 20, 20, 14, 18, 14, 12, 12, 16, 18];
        widths.forEach((w, i) => sheet.getColumn(i + 1).width = w);
    }
    
    /**
     * Recupera le statistiche dal database
     */
    static async _getStatistiche(req) {
        // Usa lo stesso metodo della route admin/statistiche
        const userDao = require('../../users/services/dao-user');
        const adminDao = require('../services/dao-admin');
        
        const statistiche = await userDao.getStatistiche();
        
        // Calcola variazioni
        const now = new Date();
        const startCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
        const startNext = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const toIso = (d) => d.toISOString();
        const toSafeNumber = (v) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
        };

        // Notizie
        const notizieCurrentRaw = await adminDao.countNotiziePubblicate(toIso(startCurrent), toIso(startNext));
        const notiziePrevRaw = await adminDao.countNotiziePubblicate(toIso(startPrev), toIso(startCurrent));
        const notizieCurrent = toSafeNumber(notizieCurrentRaw);
        const notiziePrev = toSafeNumber(notiziePrevRaw);

        // Eventi
        const eventiCurrentRaw = await adminDao.countEventiPubblicati(toIso(startCurrent), toIso(startNext));
        const eventiPrevRaw = await adminDao.countEventiPubblicati(toIso(startPrev), toIso(startCurrent));
        const eventiCurrent = toSafeNumber(eventiCurrentRaw);
        const eventiPrev = toSafeNumber(eventiPrevRaw);

        const calcSimpleVar = (cur, prev) => {
            const a = toSafeNumber(cur || 0);
            const b = toSafeNumber(prev || 0);
            const delta = a - b;
            const pct = (b !== 0) ? Math.round((delta / b) * 100) : 0;
            const direction = delta > 0 ? 'up' : (delta < 0 ? 'down' : 'neutral');
            return { delta, pct, direction };
        };

        statistiche.variazioni = {
            utenti: { pct: 0 },
            notizie: calcSimpleVar(notizieCurrent, notiziePrev),
            eventi: calcSimpleVar(eventiCurrent, eventiPrev),
            prenotazioni: { pct: 0 }
        };
        
        return statistiche;
    }
}

module.exports = ExportStatisticheController;
