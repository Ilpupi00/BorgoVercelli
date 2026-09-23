# Sitemap Dinamica - Documentazione

## Descrizione
La sitemap dinamica è implementata come route Express che genera XML al volo interrogando il database in tempo reale.

## Endpoint
- **URL**: `/sitemap.xml`
- **Metodo**: GET
- **Content-Type**: `application/xml`

## Caratteristiche

### 1. Pagine Statiche
Include tutte le pagine principali del sito con priorità e frequenza di aggiornamento ottimizzate per SEO:
- Homepage
- Notizie
- Eventi
- Squadre
- Campionati
- Galleria
- Società
- Prenotazioni
- Recensioni
- Pagine informative (Contatti, Privacy, Regolamento)

### 2. Contenuti Dinamici dal Database
La sitemap interroga automaticamente il database per includere:

#### Notizie
- Query: `daoNotizie.getNotizieFiltered({ pubblicata: true })`
- URL format: `/notizia/{id}`
- Include `lastmod` con data di ultima modifica

#### Eventi
- Query: `daoEventi.getEventiPubblicati()`
- URL format: `/evento/{id}`
- Include `lastmod` con data di aggiornamento

#### Squadre
- Query: `daoSquadre.getSquadre()`
- URL format: `/getsquadra/{id}`
- Include tutte le squadre attive

## Configurazione

### URL Base
Il dominio è configurato in `src/shared/routes/sitemap.js`:
```javascript
const hostname = 'https://asdborgovercelli.app';
```

### Aggiungere Nuovi Contenuti Dinamici

Per aggiungere altre entità del database (es. prodotti, categorie), modifica il file `src/shared/routes/sitemap.js`:

```javascript
// Importa il DAO
const daoProdotti = require('../../features/prodotti/services/dao-prodotti');

// Nella route, aggiungi la query
try {
    const prodotti = await daoProdotti.getProdottiPubblicati();
    
    if (prodotti && Array.isArray(prodotti)) {
        prodotti.forEach(prodotto => {
            links.push({
                url: `/prodotto/${prodotto.slug}`,
                changefreq: 'weekly',
                priority: 0.7,
                lastmod: prodotto.updatedAt
            });
        });
    }
} catch (error) {
    console.error('[SITEMAP] Errore recupero prodotti:', error);
}
```

## Parametri Sitemap

### Priority (Priorità)
- `1.0`: Massima priorità (homepage)
- `0.9`: Alta priorità (notizie, eventi)
- `0.8`: Media-alta (squadre, campionati, prenotazioni)
- `0.7`: Media (galleria, recensioni, contatti)
- `0.5-0.6`: Bassa (login, privacy, regolamento)

### Changefreq (Frequenza di aggiornamento)
- `daily`: Contenuto aggiornato quotidianamente
- `weekly`: Aggiornamenti settimanali
- `monthly`: Aggiornamenti mensili
- `yearly`: Raramente aggiornato

### Lastmod (Ultima modifica)
Viene popolato automaticamente dai campi del database:
- `data_modifica` (preferito)
- `data_pubblicazione`
- `created_at` (fallback)

## Testing

### Test Locale
```bash
# Avvia il server
npm start

# Visita nel browser o usa curl
curl http://localhost:3000/sitemap.xml
```

### Validazione XML
Usa un validatore online:
- https://www.xml-sitemaps.com/validate-xml-sitemap.html
- https://www.google.com/ping?sitemap=https://asdborgovercelli.app/sitemap.xml

## Invio a Google Search Console

1. Accedi a [Google Search Console](https://search.google.com/search-console)
2. Seleziona la tua proprietà
3. Vai su "Sitemap" nel menu laterale
4. Inserisci `https://asdborgovercelli.app/sitemap.xml`
5. Clicca "Invia"

## Vantaggi della Sitemap Dinamica

✅ **Sempre aggiornata**: Non serve rigenerare manualmente quando aggiungi contenuti  
✅ **Efficiente**: Genera XML solo quando richiesto  
✅ **Scalabile**: Gestisce migliaia di URL senza problemi  
✅ **SEO-friendly**: Include lastmod per aiutare i crawler a identificare contenuti nuovi  
✅ **Manutenibile**: Tutto in un unico file di route  

## Troubleshooting

### La sitemap non si carica
- Verifica che il server sia in esecuzione
- Controlla i log del server per errori del database
- Verifica che i DAO siano importati correttamente

### Contenuti mancanti
- Verifica le query del database nel codice
- Controlla che i contenuti siano marcati come "pubblicati"
- Aggiungi log per debug:
  ```javascript
  console.log('[SITEMAP] Notizie trovate:', notizie.length);
  ```

### Errori XML
- Assicurati che tutti gli URL siano validi (nessun carattere speciale non escaped)
- Verifica che le date siano in formato ISO valido

## Performance

La route è ottimizzata per:
- Stream processing (non carica tutto in memoria)
- Error handling per query database fallite
- Cache-friendly headers

## File Coinvolti

- **Route**: `src/shared/routes/sitemap.js`
- **Configurazione app**: `src/app.js`
- **Dipendenze**: `package.json` (libreria `sitemap`)

## Note

- La sitemap **NON include** pagine admin (protette da autenticazione)
- Le pagine di login/registrazione sono incluse ma con bassa priorità
- La sitemap usa il protocollo HTTPS
