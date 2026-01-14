#!/usr/bin/env node

/**
 * Script di pulizia del volume uploads
 * Elimina file immagini orfani (presenti su disco ma non nel DB)
 *
 * Uso:
 *   node scripts/cleanup-uploads.js [--dry-run]
 *
 * Opzioni:
 *   --dry-run    Mostra cosa verrà eliminato senza eliminare effettivamente
 */

const fs = require("fs");
const path = require("path");
const db = require("../src/core/config/database");

// Parsing argomenti
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");

// Determina il percorso uploads in base all'ambiente
const uploadsPath = process.env.RAILWAY_ENVIRONMENT
  ? "/data/uploads"
  : path.join(process.cwd(), "src", "public", "uploads");

console.log("\n🧹 PULIZIA VOLUME UPLOADS");
console.log("=".repeat(50));
console.log(`📁 Directory: ${uploadsPath}`);
console.log(
  `⚙️  Modalità: ${isDryRun ? "DRY RUN (simulazione)" : "ELIMINAZIONE REALE"}`
);
console.log("=".repeat(50));
console.log("");

/**
 * Ottiene tutti gli URL delle immagini dal database
 */
async function getImagesFromDatabase() {
  try {
    const result = await db.query("SELECT DISTINCT url FROM IMMAGINI");
    return result.rows.map((row) => row.url);
  } catch (error) {
    console.error("❌ Errore recupero immagini dal DB:", error);
    throw error;
  }
}

/**
 * Ottiene tutti i file dalla directory uploads
 */
function getFilesFromDisk(directory) {
  if (!fs.existsSync(directory)) {
    console.warn("⚠️  Directory uploads non trovata:", directory);
    return [];
  }

  const files = fs.readdirSync(directory);
  return files.filter((file) => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    return stat.isFile() && /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
  });
}

/**
 * Elimina un file dal disco
 */
function deleteFile(filePath) {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error(`   ❌ Errore eliminazione: ${error.message}`);
    return false;
  }
}

/**
 * Formatta dimensione file
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Funzione principale
 */
async function cleanup() {
  try {
    // 1. Recupera immagini dal DB
    console.log("📊 Recupero immagini dal database...");
    const dbImages = await getImagesFromDatabase();
    console.log(`   ✅ Trovate ${dbImages.length} immagini nel database\n`);

    // Normalizza gli URL (rimuove /uploads/ prefix)
    const dbFilenames = dbImages.map((url) => {
      return url.replace(/^\/uploads\//, "").replace(/^uploads\//, "");
    });

    // 2. Recupera file dal disco
    console.log("💾 Scansione directory uploads...");
    const diskFiles = getFilesFromDisk(uploadsPath);
    console.log(`   ✅ Trovati ${diskFiles.length} file su disco\n`);

    // 3. Identifica file orfani
    console.log("🔍 Identificazione file orfani...");
    const orphanFiles = diskFiles.filter((file) => !dbFilenames.includes(file));

    if (orphanFiles.length === 0) {
      console.log("   ✅ Nessun file orfano trovato!\n");
      console.log(
        "✨ Volume uploads pulito e sincronizzato con il database.\n"
      );
      return;
    }

    console.log(`   ⚠️  Trovati ${orphanFiles.length} file orfani:\n`);

    // 4. Calcola dimensione totale
    let totalSize = 0;
    let deletedCount = 0;
    let failedCount = 0;

    orphanFiles.forEach((file, index) => {
      const filePath = path.join(uploadsPath, file);
      const stat = fs.statSync(filePath);
      const size = stat.size;
      totalSize += size;

      console.log(`   ${index + 1}. ${file}`);
      console.log(`      📏 Dimensione: ${formatBytes(size)}`);
      console.log(
        `      📅 Ultima modifica: ${stat.mtime.toLocaleString("it-IT")}`
      );

      if (!isDryRun) {
        const deleted = deleteFile(filePath);
        if (deleted) {
          console.log(`      ✅ ELIMINATO`);
          deletedCount++;
        } else {
          console.log(`      ❌ ERRORE`);
          failedCount++;
        }
      } else {
        console.log(`      🔹 Verrà eliminato (dry-run)`);
      }
      console.log("");
    });

    // 5. Riepilogo
    console.log("=".repeat(50));
    console.log("📊 RIEPILOGO");
    console.log("=".repeat(50));
    console.log(`📁 File totali su disco: ${diskFiles.length}`);
    console.log(`💾 Immagini nel database: ${dbImages.length}`);
    console.log(`🗑️  File orfani trovati: ${orphanFiles.length}`);
    console.log(`💾 Spazio totale liberabile: ${formatBytes(totalSize)}`);

    if (!isDryRun) {
      console.log(`✅ File eliminati: ${deletedCount}`);
      console.log(`❌ Errori: ${failedCount}`);
      console.log(`\n✨ Pulizia completata!`);
    } else {
      console.log(
        `\n💡 Esegui senza --dry-run per eliminare effettivamente i file.`
      );
    }
    console.log("");
  } catch (error) {
    console.error("\n❌ ERRORE FATALE:", error);
    process.exit(1);
  } finally {
    // Chiudi connessione database
    await db.end();
  }
}

// Esegui
cleanup();
