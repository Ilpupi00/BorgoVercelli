#!/bin/bash

# Script di deployment per il nuovo sistema di ruoli
# Borgo Vercelli - Aggiornamento Sistema Ruoli

echo "=========================================="
echo "   DEPLOYMENT SISTEMA RUOLI AGGIORNATO   "
echo "=========================================="
echo ""

# Colori per output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Backup del database (opzionale ma raccomandato)
echo -e "${YELLOW}[1/5] Backup database...${NC}"
echo "IMPORTANTE: Assicurati di avere un backup del database prima di procedere!"
read -p "Hai fatto il backup? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${RED}Deployment annullato. Fai prima il backup del database.${NC}"
    exit 1
fi

# 2. Esegui migration database
echo -e "${YELLOW}[2/5] Esecuzione migration database...${NC}"
# Se usi PostgreSQL:
# psql -U your_user -d borgo_vercelli -f database/migrations/add_new_roles.sql

# Se usi Railway o altro servizio cloud, usa il loro CLI o connessione diretta
echo "Esegui manualmente: psql -U your_user -d borgo_vercelli -f database/migrations/add_new_roles.sql"
read -p "Migration completata? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${RED}Deployment annullato.${NC}"
    exit 1
fi

# 3. Verifica migration
echo -e "${YELLOW}[3/5] Verifica migration...${NC}"
echo "Esegui: psql -U your_user -d borgo_vercelli -f database/migrations/test_new_roles.sql"
read -p "Test migration passato? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${RED}Deployment annullato. Verifica gli errori.${NC}"
    exit 1
fi

# 4. Riavvia server
echo -e "${YELLOW}[4/5] Riavvio server...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 restart borgo-vercelli
    echo -e "${GREEN}✓ Server riavviato con PM2${NC}"
elif [ -f "package.json" ]; then
    npm restart &
    echo -e "${GREEN}✓ Server riavviato con npm${NC}"
else
    echo -e "${YELLOW}⚠ Riavvia manualmente il server${NC}"
fi

# 5. Test finale
echo -e "${YELLOW}[5/5] Test finale...${NC}"
echo ""
echo "Testa i seguenti scenari:"
echo "  1. Admin può accedere a tutto"
echo "  2. Segretario può gestire squadre"
echo "  3. Gestore Campo può gestire campi e prenotazioni"
echo "  4. Dirigente può gestire più squadre"
echo "  5. Badge ruoli visualizzati correttamente"
echo ""
read -p "Tutti i test sono passati? (s/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo ""
    echo -e "${GREEN}=========================================="
    echo "  ✓ DEPLOYMENT COMPLETATO CON SUCCESSO  "
    echo "==========================================${NC}"
    echo ""
    echo "Ruoli aggiunti:"
    echo "  - Segretario (ID: 5)"
    echo "  - Gestore Campo (ID: 6)"
    echo ""
    echo "Funzionalità aggiornate:"
    echo "  - Dirigenti possono gestire più squadre"
    echo "  - Presidente, Vice e Segretario gestiscono tutte le squadre"
    echo "  - Gestore Campo gestisce campi e prenotazioni"
    echo ""
    echo "Documentazione: docs/SISTEMA_RUOLI_AGGIORNATO.md"
else
    echo ""
    echo -e "${RED}⚠ Deployment completato ma con errori nei test${NC}"
    echo "Controlla i log e la documentazione per il troubleshooting"
    exit 1
fi
