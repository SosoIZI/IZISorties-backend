var express = require("express");
var router = express.Router();

require("../models/connection");
const Place = require("../models/places");
const apiKey = process.env.API_KEY;

// 1- Route pour ajouter une nouvelle Place (lieu où se passent des events) à partir d'un formulaire
// c'est le front qui vérifie si la place existe déjà ou pas (la route se lance seulement si la place n'existe pas déjà dans la BDD)
router.post("/", (req, res) => {
        const newPlace = new Place({
          namePlace: req.body.namePlace,
          address: req.body.address,
          cp: req.body.cp,
          city: req.body.city,
          latitude: req.body.latitude,
          longitude: req.body.longitude,
          events: [],
        });
        newPlace.save();
        res.json({ result: newPlace });
      } 
  );


// 2- Route pour ajouter une nouvelle Place (lieu où se passent des events) à partir de OpenAgenda
router.post("/openagenda", (req, res) => {
  // d'abord je vais chercher tous les events de l'API et donc les places associées
  fetch(
    `https://api.openagenda.com/v2/agendas/20500020/events?key=${apiKey}`
  )
    .then((response) => response.json())
    .then((data) => {
      if (data) {
        // si data true => donc si je trouve des données, je vais fetch sur le site data.gouv pour trouver le CP du lieu puis créer la place
        for (const obj of data.events) {
          fetch(
            `https://api-adresse.data.gouv.fr/reverse/?lon=${obj.location.longitude}&lat=${obj.location.latitude}`
          )
            .then((response) => response.json())
            .then((infos) => {
              // je vérifie que la place n'existe pas déjà dans ma BDD Mongoose

              console.log('data.events', data.events)
              console.log('infos', infos)

              Place.findOne(
                { namePlace: obj.location.name },
                { cp: obj.location.city }
              ).then((placeData) => {
                if (placeData === null) {
                  // si ma place n'existe pas déjà dans ma BDD Place sur Mongoose, alors je créé une nouvelle Place
                  const newPlace = new Place({
                    namePlace: obj.location.name,
                    address: obj.location.address,
                    cp: infos.features[0].properties.citycode,
                    city: obj.location.city,
                    latitude: obj.location.latitude,
                    longitude: obj.location.longitude,
                    events: [],
                  });
                  newPlace.save();
                }
              });
            });
        }
        res.json({ result: true });
      } else {
        res.json({ events: "il ny a pas de données" });
      }
    });
});

// 3- Route pour récupérer les infos d’une place en fonction de son id
router.get("/:id", (req, res) => {
  Place.find({ _id: req.params.id }).then((data) => {
    res.json({ result: true, place: data });
  });
});

// 4- Route pour trouver une place en fonction de son cp et son nom (pour le formulaire de création d'un event)
router.get("/:cp/:name", (req, res) => {
  Place.find({ cp: req.params.cp, name: req.params.name }).then((data) => {
    res.json({ result: true, events: data });
  });
});

//5- route GET pour récupérer toutes les villes dans la bdd

router.get('/cities', (req, res) => {
  Place.find()
  .then(data => {
    res.json({ allPlaces: data.city });
  });
})


// 6 - récupérer les données d'une ville sur l'API

router.get('/:city', (req,res) => {
  fetch(`https://api-adresse.data.gouv.fr/search/?q=${req.params.city}`)
  .then((response) => response.json())
  .then((data) => {
    res.json({city: data.features})
        })
      })
    
module.exports = router;

// 7 - Route pour récupérer toutes les places 
router.get("/", (req, res) => {
  Place.find().then((data) => {
    res.json({ result: true, places: data });
  });
});

// 8 - Mise à jour du compteur du nb d'event pour cette place
router.put("/newevent", (req, res) => {
  console.log('la route newevent se lance');
  console.log('req.body', req.body)
    Place.updateOne(
        { _id: req.body.placeId },
        { $push: { events: req.body.eventId } }
      ).then(() => {
        res.json({ result: "levent a ete rajoute a la place" });
      });
});

  router.delete('/delete/:token', (req, res) => {            // on rajoute un nom de route delete pour specifier la route                  
    User.deleteOne({ token: req.params.token })
      .then(() => {                                               // supprimer l'id qui est égal à 'id de la requête . c'est l'id qui correspond au bouton supprimer
        User.find()
          .then(data => {
            res.json({ result: true });                           
          });
      });
  })
  
  module.exports = router;
  
