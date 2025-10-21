var express = require('express');
var router = express.Router();
const daoUser = require('../services/dao-user');
const { isLoggedIn } = require('../middlewares/auth');

/* GET users listing. */
router.get('/homepage', function(req, res, next) {
  res.send('Welcome to the Homepage');
});

// PUT /update - Update user profile
router.put('/update', isLoggedIn, async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = {
      nome: req.body.nome,
      cognome: req.body.cognome,
      email: req.body.email,
      telefono: req.body.telefono,
      ruolo_preferito: req.body.ruolo_preferito,
      piede_preferito: req.body.piede_preferito
    };

    await daoUser.updateUser(userId, updateData);

    res.json({ success: true, message: 'Profilo aggiornato con successo' });
  } catch (error) {
    console.error('Errore aggiornamento profilo:', error);
    res.status(500).json({ success: false, error: 'Errore nell\'aggiornamento del profilo' });
  }
});

module.exports = router;
