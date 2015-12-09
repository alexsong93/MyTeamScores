var express = require('express');
var broker = require('../middleware/broker');
var router = express.Router();

router.route('/scores')
    .get(broker.getScores);

module.exports = router;