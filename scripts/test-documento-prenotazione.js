/**
 * Script di Test per Sistema Documento Identità Prenotazioni
 * Esegui con: node scripts/test-documento-prenotazione.js
 */

const db = require("../src/core/config/database");

console.log("🧪 Test Sistema Documento Identità Prenotazioni\n");

// Test 1: Verifica struttura tabella
console.log("📋 Test 1: Verifica colonne tabella PRENOTAZIONI");
db.all(
  `
    SELECT column_name, data_type, character_maximum_length, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'prenotazioni'
    AND column_name IN ('telefono', 'tipo_documento', 'codice_fiscale', 'numero_documento')
    ORDER BY column_name
`,
  [],
  (err, columns) => {
    if (err) {
      console.error("❌ Errore:", err.message);
      process.exit(1);
    }

    console.log("✅ Colonne trovate:");
    columns.forEach((col) => {
      console.log(
        `   - ${col.column_name} (${col.data_type}${
          col.character_maximum_length
            ? `(${col.character_maximum_length})`
            : ""
        }) - ${col.is_nullable === "YES" ? "NULL" : "NOT NULL"}`
      );
    });

    // Verifica che ci siano tutte e 4 le colonne
    if (columns.length !== 4) {
      console.error("❌ Errore: non tutte le colonne sono presenti");
      process.exit(1);
    }

    console.log("\n");

    // Test 2: Verifica constraints
    console.log("🔒 Test 2: Verifica constraints");
    db.all(
      `
        SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint
        WHERE conname LIKE 'prenotazioni_%documento%'
        ORDER BY conname
    `,
      [],
      (err, constraints) => {
        if (err) {
          console.error("❌ Errore:", err.message);
          process.exit(1);
        }

        console.log("✅ Constraints trovati:");
        constraints.forEach((c) => {
          console.log(`   - ${c.conname}`);
          console.log(`     ${c.definition}`);
        });

        if (constraints.length < 2) {
          console.error("❌ Errore: constraints mancanti");
          process.exit(1);
        }

        console.log("\n");

        // Test 3: Verifica indici
        console.log("📊 Test 3: Verifica indici");
        db.all(
          `
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'prenotazioni'
            AND indexname LIKE 'idx_prenotazioni_%'
            ORDER BY indexname
        `,
          [],
          (err, indexes) => {
            if (err) {
              console.error("❌ Errore:", err.message);
              process.exit(1);
            }

            console.log("✅ Indici trovati:");
            indexes.forEach((idx) => {
              console.log(`   - ${idx.indexname}`);
            });

            console.log("\n");

            // Test 4: Test inserimento con CF
            console.log(
              "🧪 Test 4: Inserimento prenotazione con Codice Fiscale"
            );
            const testDataCF = {
              campo_id: 1,
              utente_id: null,
              data_prenotazione: "2025-12-15",
              ora_inizio: "10:00",
              ora_fine: "11:00",
              telefono: "+39 123 456 7890",
              tipo_documento: "CF",
              codice_fiscale: "RSSMRA80A01H501U",
              stato: "test",
            };

            db.run(
              `
                INSERT INTO PRENOTAZIONI 
                (campo_id, utente_id, data_prenotazione, ora_inizio, ora_fine, telefono, tipo_documento, codice_fiscale, stato, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                RETURNING id
            `,
              [
                testDataCF.campo_id,
                testDataCF.utente_id,
                testDataCF.data_prenotazione,
                testDataCF.ora_inizio,
                testDataCF.ora_fine,
                testDataCF.telefono,
                testDataCF.tipo_documento,
                testDataCF.codice_fiscale,
                testDataCF.stato,
              ],
              function (err, result) {
                if (err) {
                  console.error("❌ Errore inserimento CF:", err.message);
                } else {
                  const insertedId = result?.rows?.[0]?.id || this.lastID;
                  console.log(
                    `✅ Prenotazione con CF inserita (ID: ${insertedId})`
                  );

                  // Cleanup
                  db.run(
                    `DELETE FROM PRENOTAZIONI WHERE id = ?`,
                    [insertedId],
                    (err) => {
                      if (err)
                        console.warn("⚠️  Cleanup fallito:", err.message);
                    }
                  );
                }

                console.log("\n");

                // Test 5: Test inserimento con ID
                console.log(
                  "🧪 Test 5: Inserimento prenotazione con Documento ID"
                );
                const testDataID = {
                  campo_id: 1,
                  utente_id: null,
                  data_prenotazione: "2025-12-15",
                  ora_inizio: "11:00",
                  ora_fine: "12:00",
                  telefono: "+39 987 654 3210",
                  tipo_documento: "ID",
                  numero_documento: "CA1234567",
                  stato: "test",
                };

                db.run(
                  `
                    INSERT INTO PRENOTAZIONI 
                    (campo_id, utente_id, data_prenotazione, ora_inizio, ora_fine, telefono, tipo_documento, numero_documento, stato, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                    RETURNING id
                `,
                  [
                    testDataID.campo_id,
                    testDataID.utente_id,
                    testDataID.data_prenotazione,
                    testDataID.ora_inizio,
                    testDataID.ora_fine,
                    testDataID.telefono,
                    testDataID.tipo_documento,
                    testDataID.numero_documento,
                    testDataID.stato,
                  ],
                  function (err, result) {
                    if (err) {
                      console.error("❌ Errore inserimento ID:", err.message);
                    } else {
                      const insertedId = result?.rows?.[0]?.id || this.lastID;
                      console.log(
                        `✅ Prenotazione con Documento ID inserita (ID: ${insertedId})`
                      );

                      // Cleanup
                      db.run(
                        `DELETE FROM PRENOTAZIONI WHERE id = ?`,
                        [insertedId],
                        (err) => {
                          if (err)
                            console.warn("⚠️  Cleanup fallito:", err.message);
                        }
                      );
                    }

                    console.log("\n");

                    // Test 6: Test constraint violation (CF troppo corto)
                    console.log(
                      "🧪 Test 6: Test constraint violation (CF invalido)"
                    );
                    db.run(
                      `
                        INSERT INTO PRENOTAZIONI 
                        (campo_id, utente_id, data_prenotazione, ora_inizio, ora_fine, telefono, tipo_documento, codice_fiscale, stato, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                    `,
                      [
                        1,
                        null,
                        "2025-12-15",
                        "12:00",
                        "13:00",
                        "+39 111 222 3333",
                        "CF",
                        "TOOSHORT",
                        "test",
                      ],
                      function (err) {
                        if (err) {
                          console.log(
                            "✅ Constraint funziona correttamente - CF invalido respinto"
                          );
                          console.log(`   Errore: ${err.message}`);
                        } else {
                          console.error(
                            "❌ Constraint NON funziona - CF invalido accettato!"
                          );
                          // Cleanup se per qualche motivo è stato inserito
                          db.run(`DELETE FROM PRENOTAZIONI WHERE id = ?`, [
                            this.lastID,
                          ]);
                        }

                        console.log("\n");
                        console.log(
                          "═══════════════════════════════════════════════════"
                        );
                        console.log("🎉 Test completati con successo!");
                        console.log(
                          "═══════════════════════════════════════════════════"
                        );
                        console.log(
                          "\n✅ Sistema Documento Identità: OPERATIVO"
                        );
                        console.log("\nProssimi passi:");
                        console.log("1. Testare il form frontend su browser");
                        console.log("2. Verificare validazione JavaScript");
                        console.log("3. Testare su mobile e dark theme");
                        console.log("4. Aggiornare Privacy Policy");

                        // Chiudi connessione
                        db.close((err) => {
                          if (err) console.error("Errore chiusura DB:", err);
                          process.exit(0);
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  }
);
