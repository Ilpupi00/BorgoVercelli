var express = require('express');
var router = express.Router();
const daoUser = require('../services/dao-user');
const { isLoggedIn } = require('../middlewares/auth');

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

// GET /mie-prenotazioni - View user's bookings page
router.get('/mie-prenotazioni', isLoggedIn, async (req, res) => {
  try {
    res.render('mie_prenotazioni', {
      user: req.user
    });
  } catch (error) {
    console.error('Errore caricamento pagina prenotazioni:', error);
    res.status(500).render('error', { message: 'Errore nel caricamento della pagina' });
  }
});

module.exports = router;
