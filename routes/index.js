var express = require('express');
var router = express.Router();

const fetch = require('node-fetch');

router.get('/events', (req, res) => {
  fetch(`https://api.openagenda.com/v2/agendas/20500020/events?key=b74467be8ca543c5a63c1925805ca024`)
    .then(response => response.json())
    .then(data => {
      if (data.status === 'ok') {
        res.json({ events: data });
      } else {
        res.json({ events: [] });
      }
    });
});

module.exports = router;
