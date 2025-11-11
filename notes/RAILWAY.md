Guida rapida: Deploy su Railway con Postgres

1) Aggiungi il progetto su Railway e collega il repository.
2) In Railway aggiungi un plugin Postgres: verrà automaticamente impostata una variabile `DATABASE_URL`.
3) Assicurati che la variabile `PORT` sia esposta (Railway la imposta automaticamente).
4) Il file `src/core/config/database.js` rileva `process.env.DATABASE_URL` e userà Postgres in produzione; se non presente userà SQLite locale.
5) File utili creati:
   - `.env.example` — esempio variabili d'ambiente
   - `Procfile` — comando di avvio per Railway (usa `node ./src/server/www`)
   - `RAILWAY.md` — questa guida

Note:
- Railway fornisce `DATABASE_URL`; non è necessario impostarla manualmente in produzione.
- Se incontri errori SSL, imposta `PGSSLMODE=require` o controlla `NODE_ENV=production` per abilitare SSL con `rejectUnauthorized: false`.
- Dopo il deploy, controlla i logs su Railway per eventuali errori di connessione o query SQL incompatibili con Postgres.

Suggerimento di migrazione:
- Il progetto usava SQLite: dovrai migrare lo schema/ i dati verso Postgres (dump/convert). Nel repo ci sono script SQL nella cartella `database/` che possono aiutare; controlla `database/dump.sql` e gli script in `database/migrations/`.
