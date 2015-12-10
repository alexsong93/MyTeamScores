var express = require('express');
var broker = require('../middleware/broker');
var homepage = require('./homepage');
var users = require('./users');
var scores = require('./scores');
var router = express.Router();

router.use(users);
router.use(homepage);
router.use(scores);

module.exports = router;
