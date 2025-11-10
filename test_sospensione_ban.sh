#!/bin/bash

echo "==================================="
echo "Test Sistema Sospensione/Ban Utenti"
echo "==================================="
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Verifica database...${NC}"
COLUMNS=$(sqlite3 /workspaces/Sito_BorgoVercelli/database/database.db "PRAGMA table_info(UTENTI);" | grep -E "stato|motivo_sospensione|data_inizio_sospensione|data_fine_sospensione|admin_sospensione_id" | wc -l)

if [ "$COLUMNS" -eq 5 ]; then
    echo -e "${GREEN}✓ Tutte le colonne sono presenti nel database${NC}"
else
    echo -e "${RED}✗ Mancano alcune colonne nel database (trovate: $COLUMNS/5)${NC}"
fi

echo ""
echo -e "${YELLOW}2. Verifica files creati/modificati...${NC}"

FILES=(
    "/workspaces/Sito_BorgoVercelli/database/migrations/add_user_status.sql"
    "/workspaces/Sito_BorgoVercelli/src/models/user.js"
    "/workspaces/Sito_BorgoVercelli/src/services/dao-user.js"
    "/workspaces/Sito_BorgoVercelli/src/services/email-service.js"
    "/workspaces/Sito_BorgoVercelli/src/routes/admin.js"
    "/workspaces/Sito_BorgoVercelli/src/middlewares/auth.js"
    "/workspaces/Sito_BorgoVercelli/src/views/Admin/Contenuti/Gestore_Utenti.ejs"
    "/workspaces/Sito_BorgoVercelli/src/public/javascripts/components/Gestore_utenti.js"
    "/workspaces/Sito_BorgoVercelli/src/public/stylesheets/Admin.css"
    "/workspaces/Sito_BorgoVercelli/docs/SISTEMA_SOSPENSIONE_BAN.md"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file"
    fi
done

echo ""
echo -e "${YELLOW}3. Verifica funzioni DAO...${NC}"
grep -q "sospendiUtente" /workspaces/Sito_BorgoVercelli/src/services/dao-user.js && echo -e "${GREEN}✓${NC} sospendiUtente" || echo -e "${RED}✗${NC} sospendiUtente"
grep -q "bannaUtente" /workspaces/Sito_BorgoVercelli/src/services/dao-user.js && echo -e "${GREEN}✓${NC} bannaUtente" || echo -e "${RED}✗${NC} bannaUtente"
grep -q "revocaSospensioneBan" /workspaces/Sito_BorgoVercelli/src/services/dao-user.js && echo -e "${GREEN}✓${NC} revocaSospensioneBan" || echo -e "${RED}✗${NC} revocaSospensioneBan"
grep -q "verificaSospensioniScadute" /workspaces/Sito_BorgoVercelli/src/services/dao-user.js && echo -e "${GREEN}✓${NC} verificaSospensioniScadute" || echo -e "${RED}✗${NC} verificaSospensioniScadute"

echo ""
echo -e "${YELLOW}4. Verifica email templates...${NC}"
grep -q "sendSospensioneEmail" /workspaces/Sito_BorgoVercelli/src/services/email-service.js && echo -e "${GREEN}✓${NC} sendSospensioneEmail" || echo -e "${RED}✗${NC} sendSospensioneEmail"
grep -q "sendBanEmail" /workspaces/Sito_BorgoVercelli/src/services/email-service.js && echo -e "${GREEN}✓${NC} sendBanEmail" || echo -e "${RED}✗${NC} sendBanEmail"
grep -q "sendRevocaEmail" /workspaces/Sito_BorgoVercelli/src/services/email-service.js && echo -e "${GREEN}✓${NC} sendRevocaEmail" || echo -e "${RED}✗${NC} sendRevocaEmail"

echo ""
echo -e "${YELLOW}5. Verifica routes API...${NC}"
grep -q "/api/admin/utenti/:id/sospendi" /workspaces/Sito_BorgoVercelli/src/routes/admin.js && echo -e "${GREEN}✓${NC} POST /api/admin/utenti/:id/sospendi" || echo -e "${RED}✗${NC} POST /api/admin/utenti/:id/sospendi"
grep -q "/api/admin/utenti/:id/banna" /workspaces/Sito_BorgoVercelli/src/routes/admin.js && echo -e "${GREEN}✓${NC} POST /api/admin/utenti/:id/banna" || echo -e "${RED}✗${NC} POST /api/admin/utenti/:id/banna"
grep -q "/api/admin/utenti/:id/revoca" /workspaces/Sito_BorgoVercelli/src/routes/admin.js && echo -e "${GREEN}✓${NC} POST /api/admin/utenti/:id/revoca" || echo -e "${RED}✗${NC} POST /api/admin/utenti/:id/revoca"

echo ""
echo -e "${YELLOW}6. Verifica modali frontend...${NC}"
grep -q "sceltaSospendiBanModal" /workspaces/Sito_BorgoVercelli/src/views/Admin/Contenuti/Gestore_Utenti.ejs && echo -e "${GREEN}✓${NC} Modal Scelta" || echo -e "${RED}✗${NC} Modal Scelta"
grep -q "sospensioneModal" /workspaces/Sito_BorgoVercelli/src/views/Admin/Contenuti/Gestore_Utenti.ejs && echo -e "${GREEN}✓${NC} Modal Sospensione" || echo -e "${RED}✗${NC} Modal Sospensione"
grep -q "banModal" /workspaces/Sito_BorgoVercelli/src/views/Admin/Contenuti/Gestore_Utenti.ejs && echo -e "${GREEN}✓${NC} Modal Ban" || echo -e "${RED}✗${NC} Modal Ban"
grep -q "revocaModal" /workspaces/Sito_BorgoVercelli/src/views/Admin/Contenuti/Gestore_Utenti.ejs && echo -e "${GREEN}✓${NC} Modal Revoca" || echo -e "${RED}✗${NC} Modal Revoca"

echo ""
echo -e "${YELLOW}7. Verifica funzioni JavaScript...${NC}"
grep -q "mostraSospendiBan" /workspaces/Sito_BorgoVercelli/src/public/javascripts/components/Gestore_utenti.js && echo -e "${GREEN}✓${NC} mostraSospendiBan" || echo -e "${RED}✗${NC} mostraSospendiBan"
grep -q "confermaSospensione" /workspaces/Sito_BorgoVercelli/src/public/javascripts/components/Gestore_utenti.js && echo -e "${GREEN}✓${NC} confermaSospensione" || echo -e "${RED}✗${NC} confermaSospensione"
grep -q "confermaBan" /workspaces/Sito_BorgoVercelli/src/public/javascripts/components/Gestore_utenti.js && echo -e "${GREEN}✓${NC} confermaBan" || echo -e "${RED}✗${NC} confermaBan"
grep -q "confermaRevoca" /workspaces/Sito_BorgoVercelli/src/public/javascripts/components/Gestore_utenti.js && echo -e "${GREEN}✓${NC} confermaRevoca" || echo -e "${RED}✗${NC} confermaRevoca"

echo ""
echo -e "${GREEN}==================================="
echo "Test completato!"
echo "===================================${NC}"
echo ""
echo "Per testare manualmente:"
echo "1. Riavvia il server Node.js"
echo "2. Accedi come admin"
echo "3. Vai su 'Gestione Utenti'"
echo "4. Prova a sospendere/bannare/revocare un utente"
echo ""
