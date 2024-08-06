var express = require('express');
var router = express.Router();

require('../models/connection');
const User = require('../models/users');
const { checkBody } = require('../modules/checkBody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');

// 1- Route qui créé l'user OpenAgenda
router.post("/openAgenda", (req, res) => {
    const newUser = new User({
        username: 'OpenAgenda',
    });
    newUser.save().then((newDoc) => {
      res.json({ result: true });
    });
  });

module.exports = router;