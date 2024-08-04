var express = require('express');
var router = express.Router();

const fetch = require('node-fetch');

router.get('/events', (req, res) => {
  // fetch(`??????????`)
  //   .then(response => response.json())
  //   .then(data => {
  //     if (data.status === 'ok') {
  //       res.json({ events: data });
  //     } else {
  //       res.json({ events: [] });
  //     }
  //   });
});

module.exports = router;
