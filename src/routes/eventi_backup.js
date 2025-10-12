const express = require('express');
const router = express.Router();

router.get('/eventi/all', (req, res) => {
  res.json([]);
});

router.get('/eventi', (req, res) => {
  res.render('eventi', {
    title: 'Eventi - Asd BorgoVercelli 2022',
    eventi: []
  });
});

module.exports = router;
