# Sistema di Report Excel Prenotazioni

## Data implementazione
29 Novembre 2025

## Obiettivo
Implementare un sistema per esportare le prenotazioni in formato Excel con filtri personalizzabili per periodo, campo e stato.

## Funzionalità Implementate

### 1. Interfaccia Utente - Calendario

**File modificati**:
- `src/features/prenotazioni/views/calendario.ejs`
- `src/public/assets/styles/calendario.css`
- `src/public/assets/scripts/calendario.js`

#### Bottone Export
Aggiunto bottone "Report Excel" nell'header del calendario, posizionato accanto al bottone "Oggi":

```html
<button id="exportReportBtn" class="btn btn-export">
    <i class="bi bi-file-earmark-excel me-1"></i>
    <span class="d-none d-md-inline">Report Excel</span>
</button>
```

**Stile**:
- Colore verde (#10b981) per richiamare Excel
- Responsive: su mobile mostra solo l'icona
- Hover effect con elevazione e cambio colore
- Supporto completo light/dark theme

#### Modal di Esportazione

Modal con form per selezionare i parametri del report:

**Campi del form**:
1. **Data Inizio** (obbligatorio)
   - Input type="date"
   - Default: Lunedì della settimana corrente
   
2. **Data Fine** (obbligatorio)
   - Input type="date"
   - Default: Domenica della settimana corrente
   
3. **Campo** (opzionale)
   - Select con tutti i campi disponibili
   - Default: "Tutti i campi"
   
4. **Stato** (opzionale)
   - Select con gli stati: Confermate, In Attesa, Annullate
   - Default: "Tutti gli stati"

**Validazioni**:
- Data inizio e fine obbligatorie
- Data inizio deve essere precedente o uguale alla data fine
- Alert con messaggi descrittivi in caso di errore

**Stili Modal**:
- Background overlay semitrasparente
- Container centrato con max-width
- Form styling consistente con il tema del calendario
- Supporto completo dark theme:
  - Input con background scuro
  - Border e focus state adattati
  - Testo leggibile in entrambi i temi

### 2. Backend - Generazione Excel

**File**: `src/features/prenotazioni/routes/prenotazione.js`

**Endpoint**: `GET /prenotazione/export-report`

**Query Parameters**:
- `dataInizio` (required): Data inizio periodo (formato YYYY-MM-DD)
- `dataFine` (required): Data fine periodo (formato YYYY-MM-DD)
- `campo` (optional): ID del campo specifico
- `stato` (optional): Stato delle prenotazioni (confermata, in_attesa, annullata)

**Query SQL**:
```sql
SELECT 
    p.id,
    p.data_prenotazione as data,
    p.ora_inizio,
    p.ora_fine,
    p.stato,
    p.telefono,
    p.tipo_documento,
    p.codice_fiscale,
    p.numero_documento,
    p.note,
    p.created_at,
    c.nome as campo_nome,
    u.nome as utente_nome,
    u.cognome as utente_cognome,
    u.email as utente_email
FROM PRENOTAZIONI p
JOIN CAMPI c ON p.campo_id = c.id
LEFT JOIN UTENTI u ON p.utente_id = u.id
WHERE p.data_prenotazione >= $1 
AND p.data_prenotazione <= $2
[AND p.campo_id = $3]
[AND p.stato = $4]
ORDER BY p.data_prenotazione, p.ora_inizio
```

### 3. Formato File Excel

**Libreria utilizzata**: ExcelJS (^4.4.0)

**Struttura del file**:

#### Colonne:
1. ID
2. Data
3. Ora Inizio
4. Ora Fine
5. Campo
6. Stato
7. Utente Nome
8. Utente Cognome
9. Email
10. Telefono
11. Tipo Documento
12. Codice Fiscale
13. N. Documento
14. Note
15. Data Creazione

#### Formattazione:

**Header**:
- Font: Bold, 12pt, Bianco
- Background: Blu (#4472C4)
- Allineamento: Centro
- Altezza: 25pt
- Bordi su tutte le celle

**Righe dati**:
- Background colorato per stato:
  - ✅ **Confermata**: Verde chiaro (#C6EFCE)
  - ⏳ **In Attesa**: Giallo chiaro (#FFD966)
  - ❌ **Annullata**: Rosso chiaro (#FFC7CE)
- Bordi su tutte le celle
- Date formattate in italiano (gg/mm/aaaa)
- Timestamp con ora (gg/mm/aaaa HH:MM:SS)

**Summary (footer)**:
- Riga vuota separatore
- **TOTALE PRENOTAZIONI**: numero totale
- Suddivisione per stato:
  - Confermate: X
  - In Attesa: Y
  - Annullate: Z

**Larghezza colonne ottimizzate**:
- ID: 8
- Date e ore: 12
- Testo breve: 15-18
- Testo lungo (email, note): 25-30

### 4. Flusso Utente Completo

1. **Apertura Modal**:
   - Click su bottone "Report Excel"
   - Modal si apre con date pre-impostate (settimana corrente)
   - Focus automatico sul primo campo

2. **Selezione Parametri**:
   - Modifica date se necessario
   - Opzionalmente filtra per campo specifico
   - Opzionalmente filtra per stato

3. **Generazione Report**:
   - Click su "Scarica Report Excel"
   - Bottone mostra loading state: "Generazione in corso..."
   - Fetch asincrono all'endpoint backend
   - Download automatico del file Excel
   - Nome file: `Report_Prenotazioni_YYYY-MM-DD_YYYY-MM-DD.xlsx`

4. **Chiusura**:
   - Modal si chiude automaticamente dopo download
   - Possibilità di chiudere con X o click fuori
   - ESC key per chiudere (keyboard navigation)

### 5. Gestione Errori

**Frontend**:
- Validazione date prima dell'invio
- Alert user-friendly per errori di validazione
- Gestione errori di rete con try/catch
- Ripristino stato bottone in caso di errore

**Backend**:
- Validazione parametri obbligatori (400 Bad Request)
- Try/catch per errori database (500 Internal Server Error)
- Log dettagliati degli errori
- Response JSON con messaggio errore

### 6. Responsive Design

**Desktop** (>1024px):
- Bottone con testo completo "Report Excel"
- Modal centrato con padding generoso
- Form a larghezza ottimale

**Tablet** (768px-1024px):
- Bottone con testo "Report Excel"
- Modal responsive con padding medio

**Mobile** (<768px):
- Bottone solo icona per risparmiare spazio
- Modal fullscreen o quasi
- Form ottimizzato per touch
- Input più grandi per facile interazione

### 7. Accessibilità

- Icone con significato semantico
- Label associate a ogni input
- Placeholder descrittivi
- Focus state visibile
- Keyboard navigation supportata
- ARIA labels dove necessario
- Contrasto colori conforme WCAG

## Esempi di Utilizzo

### Report Settimanale Completo
- Data Inizio: 25/11/2025
- Data Fine: 01/12/2025
- Campo: Tutti i campi
- Stato: Tutti gli stati
- **Risultato**: Excel con tutte le prenotazioni della settimana

### Report Campo Specifico
- Data Inizio: 01/11/2025
- Data Fine: 30/11/2025
- Campo: "Calcio a 5"
- Stato: Solo Confermate
- **Risultato**: Excel con prenotazioni confermate del campo "Calcio a 5" nel mese

### Report Mensile In Attesa
- Data Inizio: 01/11/2025
- Data Fine: 30/11/2025
- Campo: Tutti i campi
- Stato: Solo In Attesa
- **Risultato**: Excel con tutte le prenotazioni da confermare del mese

## Dipendenze

**NPM Package**:
```json
{
  "exceljs": "^4.4.0"
}
```

**Installazione**:
```bash
npm install exceljs
```

## Sicurezza

- Validazione parametri lato server
- SQL con parametri preparati (prevent SQL injection)
- Nessun dato sensibile nel nome file
- Solo admin può accedere al calendario (check middleware isLoggedIn, isAdmin)

## Performance

- Query ottimizzata con JOIN specifici
- Indici esistenti su data_prenotazione utilizzati
- Streaming del file Excel direttamente in response
- No caching intermedio (report sempre aggiornato)

## Testing

### Test Manuale
1. Aprire calendario admin: `/admin/calendario`
2. Click su "Report Excel"
3. Selezionare periodo (es. settimana corrente)
4. Click "Scarica Report Excel"
5. Verificare download file .xlsx
6. Aprire file e verificare:
   - Tutte le colonne presenti
   - Dati corretti
   - Formattazione colori
   - Summary a fine foglio

### Test Edge Cases
- ✅ Periodo senza prenotazioni → File Excel con solo header e summary "0"
- ✅ Data inizio > data fine → Alert di validazione
- ✅ Campi vuoti → Alert di validazione
- ✅ Filtro campo + stato → Solo prenotazioni matching
- ✅ Caratteri speciali nelle note → Correttamente escapati in Excel

## Possibili Miglioramenti Futuri

- [ ] Aggiungere grafici nel file Excel (chart con ExcelJS)
- [ ] Export in formato PDF oltre a Excel
- [ ] Schedulazione report automatici via email
- [ ] Template personalizzabili per il report
- [ ] Export CSV per elaborazioni esterne
- [ ] Compressione ZIP per report molto grandi
- [ ] Anteprima dati prima del download
- [ ] Salvataggio preset filtri preferiti
- [ ] Report comparativi tra periodi
- [ ] Dashboard di statistiche prima dell'export

## Note Tecniche

- ExcelJS supporta formati .xlsx (Excel 2007+)
- Streaming mode per file molto grandi (>10k righe)
- Memoria ottimizzata con write-to-stream diretto
- Compatibile con LibreOffice, Google Sheets, Numbers
- Font system default garantisce compatibilità cross-platform
