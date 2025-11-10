// Leggi il template EJS
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'src/views/Admin/Contenuti/Gestore_Utenti.ejs');
const template = fs.readFileSync(templatePath, 'utf8');

// Conta i modali direttamente nel template
const modalCount = (template.match(/sceltaSospendiBanModal/g) || []).length;
const sospensioneModalCount = (template.match(/sospensioneModal/g) || []).length;
const banModalCount = (template.match(/banModal/g) || []).length;
const revocaModalCount = (template.match(/revocaModal/g) || []).length;

console.log('=== VERIFICA MODALI NEL TEMPLATE ===');
console.log(`Modal Scelta: ${modalCount}`);
console.log(`Modal Sospensione: ${sospensioneModalCount}`);
console.log(`Modal Ban: ${banModalCount}`);
console.log(`Modal Revoca: ${revocaModalCount}`);

// Verifica le chiamate alle funzioni
const mostraSospendiBanCount = (template.match(/mostraSospendiBan/g) || []).length;
const revocaSospensioneBanCount = (template.match(/revocaSospensioneBan/g) || []).length;

console.log('\n=== VERIFICA CHIAMATE FUNZIONI ===');
console.log(`Chiamate mostraSospendiBan: ${mostraSospendiBanCount}`);
console.log(`Chiamate revocaSospensioneBan: ${revocaSospensioneBanCount}`);

// Verifica la logica condizionale
const condizionaleAttivo = template.includes("<% if (!utente.stato || utente.stato === 'attivo') { %>");
const condizionaleElse = template.includes("<% } else { %>");

console.log('\n=== VERIFICA LOGICA CONDIZIONALE ===');
console.log(`Condizione attivo: ${condizionaleAttivo}`);
console.log(`Condizione else: ${condizionaleElse}`);

console.log('\n=== RISULTATO ===');
if (modalCount > 0 && sospensioneModalCount > 0 && banModalCount > 0 && revocaModalCount > 0) {
    console.log('✅ Tutti i modali sono presenti nel template!');
} else {
    console.log('❌ Alcuni modali mancano nel template');
}

if (mostraSospendiBanCount > 0 && revocaSospensioneBanCount > 0) {
    console.log('✅ Entrambe le funzioni sono chiamate nel template!');
} else {
    console.log('❌ Problemi con le chiamate alle funzioni');
}

if (condizionaleAttivo && condizionaleElse) {
    console.log('✅ La logica condizionale è presente!');
} else {
    console.log('❌ Problemi con la logica condizionale');
}