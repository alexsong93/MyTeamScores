var express = require('express');
var homepage = require('../middleware/homepage');
var router = express.Router();

router.route('/')
    .get(homepage.render);

module.exports = router;