/**
 * Test Modal Prenotazione - Da eseguire nella console del browser
 * Apri la pagina /prenotazione e incolla questo codice nella console
 */

console.log('🧪 Test Modal Prenotazione\n');

// Test 1: Verifica che showModalPrenotazione sia disponibile
console.log('1. Verifica funzione showModalPrenotazione');
if (typeof window.showModalPrenotazione !== 'undefined') {
    console.log('✅ Funzione disponibile globalmente');
} else {
    console.log('⚠️  Funzione non disponibile - potrebbe essere un modulo ES6');
}

// Test 2: Verifica presenza modal nel DOM
console.log('\n2. Verifica modal nel DOM');
const modal = document.getElementById('modalPrenotazioneCampo');
if (modal) {
    console.log('✅ Modal trovato nel DOM');
    
    // Test 3: Verifica struttura
    console.log('\n3. Verifica struttura modal');
    const header = modal.querySelector('.modal-header');
    const body = modal.querySelector('.modal-body');
    const footer = modal.querySelector('.modal-footer');
    const form = modal.querySelector('#formPrenotazioneCampo');
    
    console.log('Header:', !!header);
    console.log('Body:', !!body);
    console.log('Footer:', !!footer);
    console.log('Form:', !!form);
    
    // Test 4: Verifica campi
    console.log('\n4. Verifica campi form');
    const campi = {
        dataPrenotazione: modal.querySelector('#dataPrenotazione'),
        orarioPrenotazione: modal.querySelector('#orarioPrenotazione'),
        telefonoPrenotazione: modal.querySelector('#telefonoPrenotazione'),
        tipoDocumentoPrenotazione: modal.querySelector('#tipoDocumentoPrenotazione'),
        codiceFiscalePrenotazione: modal.querySelector('#codiceFiscalePrenotazione'),
        numeroDocumentoPrenotazione: modal.querySelector('#numeroDocumentoPrenotazione'),
        notePrenotazione: modal.querySelector('#notePrenotazione')
    };
    
    Object.entries(campi).forEach(([nome, elemento]) => {
        console.log(`  ${nome}:`, !!elemento);
    });
    
    // Test 5: Verifica bottoni
    console.log('\n5. Verifica bottoni');
    const bottoni = modal.querySelectorAll('.modal-footer button');
    console.log('Numero bottoni nel footer:', bottoni.length);
    bottoni.forEach((btn, i) => {
        console.log(`  Bottone ${i + 1}:`, btn.textContent.trim(), '| Type:', btn.type);
    });
    
    // Test 6: Verifica visibility
    console.log('\n6. Verifica visibilità elementi');
    if (footer) {
        const footerStyle = window.getComputedStyle(footer);
        console.log('Footer display:', footerStyle.display);
        console.log('Footer visibility:', footerStyle.visibility);
        console.log('Footer opacity:', footerStyle.opacity);
    }
    
    // Test 7: Verifica campi documento nascosti
    console.log('\n7. Verifica campi documento (devono essere nascosti inizialmente)');
    const cfGroup = modal.querySelector('#codiceFiscaleGroup');
    const numDocGroup = modal.querySelector('#numeroDocumentoGroup');
    if (cfGroup) {
        const cfStyle = window.getComputedStyle(cfGroup);
        console.log('  CF Group display:', cfStyle.display, '(dovrebbe essere "none")');
    }
    if (numDocGroup) {
        const numDocStyle = window.getComputedStyle(numDocGroup);
        console.log('  NumDoc Group display:', numDocStyle.display, '(dovrebbe essere "none")');
    }
    
    console.log('\n✅ Test completati! Controlla i risultati sopra.');
    
} else {
    console.log('❌ Modal NON trovato nel DOM');
    console.log('   Possibili cause:');
    console.log('   - Il modal non è stato ancora aperto');
    console.log('   - Errore JavaScript che impedisce la creazione');
    console.log('   Soluzione: Clicca su "Prenota" per un campo e riesegui questo test');
}

// Test 8: Verifica CSS caricato
console.log('\n8. Verifica CSS modalPrenotazione.css');
const cssLoaded = Array.from(document.styleSheets).some(sheet => {
    try {
        return sheet.href && sheet.href.includes('modalPrenotazione.css');
    } catch (e) {
        return false;
    }
});
console.log('CSS modalPrenotazione.css caricato:', cssLoaded ? '✅' : '❌');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Per testare manualmente:');
console.log('1. Clicca su "Prenota" per aprire il modal');
console.log('2. Seleziona "Codice Fiscale" nel menu tipo documento');
console.log('3. Verifica che appaia il campo per inserire il CF');
console.log('4. Seleziona "Documento di Identità"');
console.log('5. Verifica che appaia il campo per il numero documento');
console.log('6. Verifica che i bottoni Annulla e Conferma siano visibili');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
