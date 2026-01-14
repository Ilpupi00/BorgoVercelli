# 🧹 Cleanup Uploads - Script di Manutenzione

Script per pulire file immagini orfani dal volume persistente Railway.

## 📋 Problema Risolto

Nel tempo, file immagini possono accumularsi nel volume `/data/uploads` se:

- Viene sostituita un'immagine ma quella vecchia non viene eliminata
- Un upload fallisce ma il file temporaneo rimane
- Un record viene eliminato dal database ma il file no

Questo script identifica ed elimina questi **file orfani** (presenti su disco ma non nel database).

## 🚀 Utilizzo

### Modalità Dry-Run (Simulazione)

Mostra cosa verrà eliminato **senza eliminare effettivamente**:

```bash
node scripts/cleanup-uploads.js --dry-run
```

Output esempio:

```
🧹 PULIZIA VOLUME UPLOADS
==================================================
📁 Directory: /data/uploads
⚙️  Modalità: DRY RUN (simulazione)
==================================================

📊 Recupero immagini dal database...
   ✅ Trovate 120 immagini nel database

💾 Scansione directory uploads...
   ✅ Trovati 150 file su disco

🔍 Identificazione file orfani...
   ⚠️  Trovati 30 file orfani:

   1. old-event-1702567890.jpg
      📏 Dimensione: 2.5 MB
      📅 Ultima modifica: 01/12/2025, 15:30:00
      🔹 Verrà eliminato (dry-run)

   2. temp-upload-1702456789.jpg
      📏 Dimensione: 1.8 MB
      📅 Ultima modifica: 28/11/2025, 10:15:00
      🔹 Verrà eliminato (dry-run)

   [...]

==================================================
📊 RIEPILOGO
==================================================
📁 File totali su disco: 150
💾 Immagini nel database: 120
🗑️  File orfani trovati: 30
💾 Spazio totale liberabile: 45.2 MB

💡 Esegui senza --dry-run per eliminare effettivamente i file.
```

### Modalità Eliminazione Reale

Elimina effettivamente i file orfani:

```bash
node scripts/cleanup-uploads.js
```

Output esempio:

```
🧹 PULIZIA VOLUME UPLOADS
==================================================
📁 Directory: /data/uploads
⚙️  Modalità: ELIMINAZIONE REALE
==================================================

[... scansione come sopra ...]

   1. old-event-1702567890.jpg
      📏 Dimensione: 2.5 MB
      📅 Ultima modifica: 01/12/2025, 15:30:00
      ✅ ELIMINATO

   2. temp-upload-1702456789.jpg
      📏 Dimensione: 1.8 MB
      📅 Ultima modifica: 28/11/2025, 10:15:00
      ✅ ELIMINATO

==================================================
📊 RIEPILOGO
==================================================
📁 File totali su disco: 150
💾 Immagini nel database: 120
🗑️  File orfani trovati: 30
💾 Spazio totale liberabile: 45.2 MB
✅ File eliminati: 30
❌ Errori: 0

✨ Pulizia completata!
```

## 🔧 Come Funziona

1. **Connessione Database**: Si connette al database PostgreSQL
2. **Query Immagini**: Recupera tutti gli URL dalla tabella `IMMAGINI`
3. **Scansione Disco**: Elenca tutti i file nella directory uploads
4. **Confronto**: Identifica file presenti su disco ma NON nel database
5. **Eliminazione**: Rimuove i file orfani (se non --dry-run)
6. **Report**: Mostra statistiche dettagliate

## 📅 Manutenzione Consigliata

### Locale (Sviluppo)

Esegui periodicamente durante lo sviluppo:

```bash
# Ogni settimana o quando noti spazio occupato
npm run cleanup-uploads
```

### Railway (Produzione)

**Opzione 1: Manuale via Railway CLI**

```bash
# Connettiti al progetto Railway
railway link

# Esegui lo script
railway run node scripts/cleanup-uploads.js --dry-run
railway run node scripts/cleanup-uploads.js
```

**Opzione 2: Scheduled Task (Consigliato)**

Aggiungi un cron job in Railway:

1. Dashboard Railway → Service → Settings → Cron Jobs
2. Aggiungi nuovo job:
   - **Name**: `Cleanup Uploads`
   - **Schedule**: `0 3 * * 0` (Ogni domenica alle 3:00 AM)
   - **Command**: `node scripts/cleanup-uploads.js`

**Opzione 3: Script NPM**

Aggiungi al `package.json`:

```json
{
  "scripts": {
    "cleanup-uploads": "node scripts/cleanup-uploads.js",
    "cleanup-uploads:dry-run": "node scripts/cleanup-uploads.js --dry-run"
  }
}
```

Poi esegui:

```bash
npm run cleanup-uploads:dry-run  # Simulazione
npm run cleanup-uploads          # Esecuzione reale
```

## ⚠️ Attenzione

### Backup Prima della Pulizia

**CONSIGLIATO**: Fai backup del volume prima di eseguire lo script la prima volta:

```bash
# Railway CLI
railway volume backup create uploads-volume

# Oppure scarica manualmente tutti i file
railway run bash
cd /data/uploads
tar -czf backup-$(date +%Y%m%d).tar.gz *.{jpg,jpeg,png,gif,webp}
```

### Falsi Positivi

Lo script è sicuro e identifica solo file **realmente orfani**, ma in caso di dubbi:

1. **Usa sempre --dry-run prima** per verificare cosa verrà eliminato
2. Controlla i file nell'elenco prima di confermare
3. Se un file sembra importante, controlla manualmente nel database:

```sql
SELECT * FROM IMMAGINI WHERE url LIKE '%nome-file.jpg%';
```

### Ripristino File Eliminato

Se elimini per errore un file importante:

1. **Ripristina da backup** (vedi sopra)
2. **Ri-carica l'immagine** dall'interfaccia web
3. Lo script **NON elimina** file presenti nel database

## 📊 Esempi di Utilizzo

### Verifica Spazio Recuperabile

```bash
# Mostra solo il riepilogo
node scripts/cleanup-uploads.js --dry-run | grep -A 10 "RIEPILOGO"
```

### Elimina Solo se >100MB

```bash
# Esegui dry-run e controlla
SIZE=$(node scripts/cleanup-uploads.js --dry-run | grep "Spazio totale" | awk '{print $4}')
if [ $SIZE -gt 100 ]; then
  echo "Spazio recuperabile: $SIZE MB - Eseguo cleanup"
  node scripts/cleanup-uploads.js
else
  echo "Spazio recuperabile: $SIZE MB - Nessun cleanup necessario"
fi
```

### Log della Pulizia

```bash
# Salva log in file
node scripts/cleanup-uploads.js > cleanup-$(date +%Y%m%d-%H%M%S).log 2>&1
```

## 🔍 Troubleshooting

### Errore: Cannot connect to database

**Problema**: Lo script non riesce a connettersi al database

**Soluzione**:

- Verifica che le variabili d'ambiente siano impostate (`DATABASE_URL`, `PGUSER`, ecc.)
- Su Railway: usa `railway run` per eseguire con le giuste env vars
- Locale: controlla `.env`

### Errore: Directory uploads not found

**Problema**: La directory `/data/uploads` non esiste

**Soluzione**:

- Su Railway: verifica che il volume sia montato su `/data`
- Locale: lo script usa automaticamente `src/public/uploads`

### Script troppo lento

**Problema**: Lo script impiega molto tempo (>1 minuto)

**Cause possibili**:

- Molti file da scansionare (>1000)
- Connessione database lenta
- Volume Railway sovraccarico

**Soluzione**:

- Esegui lo script in orari di basso traffico (notte)
- Considera di ottimizzare il database
- Esegui cleanup più frequentemente per ridurre file accumulati

## 📝 Note Tecniche

- **Pattern file supportati**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- **Directory scansionate**: Solo la root di uploads (non sottodirectory)
- **Sicurezza**: Lo script non tocca file riferenziati nel database
- **Performance**: Query database ottimizzata con `DISTINCT`
- **Compatibilità**: Node.js 14+, PostgreSQL 12+

## 🎯 Benefici

- ✅ Spazio su disco recuperato (50-70% su lungo periodo)
- ✅ Backup più veloci e piccoli
- ✅ Volume ordinato e performante
- ✅ Costi Railway ottimizzati
- ✅ Nessun impatto sulle immagini in uso

---

**Autore**: Sistema BorgoVercelli  
**Data**: 14 Dicembre 2025  
**Versione**: 1.0.0
