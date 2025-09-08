var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/Homepage', function(req, res, next) {
  res.send('Welcome to the Homepage');
});

module.exports = router;
