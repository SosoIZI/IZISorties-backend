var express = require('express');
var router = express.Router();

const fetch = require('node-fetch');

const apiKey = process.env.API_KEY;

// pour créer des events et des places à partir d'OpenAgenda, il faut toujours commencer par vérifier que l'user OpenAgenda est présent dans la BDD dans la coll "users"
// Sinon lancer la route post qui créé l'user OpenAgenda (post dans users) et récuperer l'ID d'openAgenda et le renseigner la route post de events dans la propriété "user"
// puis lancer la route post d'OpenAgenda dans places pour créer les lieux de sorties
// puis la route post d'OpenAgenda dans events pour créer les évènements et les rattacher à des lieux
// de façon générale dans IZI, ce sera toujours le même principe => on crée la place avant de créer l'event.

router.get('/openagenda', (req, res) => {
  fetch(`https://api.openagenda.com/v2/agendas/20500020/events?key=${apiKey}`)
    .then(response => response.json())
    .then(data => {
      if (data) {
        res.json({ events: data.events })
        } else {
        res.json({ events: 'il ny a pas de données' });
      }
    });
});


// router.get('/datatourisme', (req, res) => {
//   fetch(`https://diffuseur.datatourisme.fr/webservice/3ccd767387128938cb555a01cf5d38e7/e54740e8-6515-407e-9fbf-cb048e6a4706`)
//     .then(response => response.json())
//     .then(data => {
//       if (data) {
//         res.json({ events: data })
//         } else {
//         res.json({ events: 'il ny a pas de données' });
//       }
//     });
// });

module.exports = router;
