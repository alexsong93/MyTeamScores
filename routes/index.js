var express = require('express');
var broker = require('../middleware/broker');
var users = require('./users');
var scores = require('./scores');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.use(users);
router.use(scores);

module.exports = router;
