var express = require("express");
var router = express.Router();

require("../models/connection");
const Place = require("../models/places");

// Route pour ajouter une nouvelle Place (lieu où se passent des events)
// Rajouter une condition qui vérifie si le lieu existe déjà (en fonction du nom et de l'adresse)

// router.post("/", (req, res) => {
//     const newPlace = new Place({
//         namePlace: req.body.namePlace,
//         address: req.body.address,
//         cp: req.body.cp,
//         city: req.body.city,
//         latitude: req.body.latitude,
//         longitude: req.body.longitude,
//     });
//     newPlace.save().then((newDoc) => {
//       res.json({ result: true });
//     });
//   });

// // Route pour supprimer une place à partir de son namePlace et de son cp
// router.delete('/', (req, res) => {
//     Place.deleteOne({ namePlace: req.body.namePlace} , {cp: req.body.cp })
//     .then(data => {
//         console.log(data)
//         if (data) {
//             res.json({ result: true });
//           } else {
//             res.json({ result: false, error: 'Nothing found for this name' });
//           }
//     })
//    });

// // Route pour récupérer tous les events d’une place en fonction de son id
// router.get('/:id', (req, res) => {
//     Place.find({ events: req.params.id })
//     .then(data => {
//         //console.log(data)
//         if (data) {
//             res.json({ result: true, places: data });
//           } else {
//             res.json({ result: false, error: 'Nothing found for this nickname' });
//           }
//     })
//    });

   module.exports = router;