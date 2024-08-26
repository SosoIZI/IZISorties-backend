var express = require("express");
var router = express.Router();
const fetch = require('node-fetch');

require("../models/connection");
const moment = require("moment");
moment().format();
const apiKey = process.env.API_KEY;

const fs = require('fs');
const path = require('path'); // Import de path pour gérer les chemins de fichiers
const unzipper = require('unzipper'); // Pour extraire les fichiers ZIP

const Event = require("../models/events");
const Place = require("../models/places");
const User = require("../models/users");

// 1- Route qui créé un nouvel event dans Mongoose
router.post("/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((data) => {
    const newEvent = new Event({
      eventName: req.body.eventName,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      place: req.body.placeId,
      // dans le formulaire dans le frontend, l'utilisateur devra rattacher son évènement à une place
      // sinon il créera sa place dans le formulaire directement.
      // dans tous les cas, la soumission du formulaire enverra un id de place
      pictures: req.body.pictures,
      description: req.body.description,
      price: req.body.price,
      categories: req.body.categories,
      nbLike: [],
      nbBooking: [],
      user: data._id,
    });

    // Quand je crée l'event, la BDD Place se met aussi à jour avec l'id de l'event
    newEvent.save().then((newDoc) => {
      Place.updateOne(
        { _id: req.body.place },
        { $push: { events: newDoc._id } }
      ).then(() => {
        res.json({ result: newEvent });
      });
    });
  });
});

// 2- Route qui créé dans Mongoose les events de OpenAgenda /!\ avoir lancer la route openagenda de places avant !!!
router.post("/api/openagenda", (req, res) => {
  fetch(`https://api.openagenda.com/v2/agendas/20500020/events?key=${apiKey}`)
    .then((response) => response.json())
    .then((data) => {
      if (data) {
        for (const obj of data.events) {
          fetch(
            `https://api-adresse.data.gouv.fr/reverse/?lon=${obj.location.longitude}&lat=${obj.location.latitude}`
          )
            .then((response) => response.json())
            .then((infos) => {
              // je cherche l'_id de la place de cet event
              Place.findOne(
                { namePlace: obj.location.name },
                { cp: infos.features[0].properties.citycode }
              ).then((placeData) => {
                if (placeData != null) {
                  {
                    obj.image
                      ? (pictures = obj.image.base + obj.image.filename)
                      : (pictures = "/IZI_sorties_home.png");
                  }
                  const newEvent = new Event({
                    eventName: obj.title.fr,
                    startTime: moment(obj.nextTiming.begin).format("HH:mm"),
                    endTime: moment(obj.nextTiming.end).format("HH:mm"),
                    startDate: new Date(obj.firstTiming.begin),
                    endDate: new Date(obj.lastTiming.begin),
                    place: placeData._id,
                    pictures: pictures,
                    description: obj.description.fr,
                    price: "",
                    categories: ["music", "cinema"],
                    nbLike: [],
                    nbBooking: [],
                    user: "66b0aa0fc4c8131877047e63", // Mettre l'_id de OpenAgenda dans la collection "users" (cet user est déjà créé sinon le créer avec la route http://localhost:3000/users/openAgenda)
                  });
                  newEvent.save().then();
                  fetch(`http://localhost:3000/places/newevent`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      placeId: placeData._id,
                      eventId: newEvent._id,
                    }),
                  })
                    .then((response) => response.json())
                    .then((data) => {
                      console.log(data);
                    });
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

// 3- Route get en fonction de l'input saisi dans la barre de recherche
//http://localhost:3000/events/search/:rennes test thunderCLIENT OK
router.get("/search/:search", (req, res) => {
  Event.aggregate([
    {
      $lookup: {
        from: "places", // La collection à joindre
        localField: "place", // Le champ local (clé étrangère)
        foreignField: "_id", // Le champ de la collection jointe
        as: "placeInfo", // Le nom du champ de résultat après la jointure
      },
    },
    {
      $unwind: "$placeInfo", // Décompose le tableau résultant de la jointure en documents individuels
    },
    {
      $match: {
        $or: [
          { eventName: { $regex: req.params.search, $options: "i" } },
          { description: { $regex: req.params.search, $options: "i" } },
          { "placeInfo.city": { $regex: req.params.search, $options: "i" } },
        ],
      },
    },
  ]).then((data) => {
    console.log(data);
    res.json({ events: data });
  });
});

// géolib?
// 4- Route get en fonction des filtres de recherche (dates, catégories, lieu)
// pour tester cette route dans Thunder : http://localhost:3000/events/2024-04-01/2024-08-30/-1.65551/48.114985?categorie=music&categorie=cinema
router.get("/:startDate/:endDate/:city", (req, res) => {
  // Utiliser le module moment pour formater les dates
  const startDateEndHeure = moment(req.params.startDate).endOf("day").toDate();
  const startDateStartHeure = moment(req.params.startDate).startOf("day").toDate();
  const endDateEndHeure = moment(req.params.endDate).endOf("day").toDate();
  const endDateStartHeure = moment(req.params.endDate).startOf("day").toDate();

  // Si aucune catégorie n'est saisie, alors categories est un tableau vide
  let categories = req.query.categorie;
  if (!categories) {
    categories = [];
  } else if (!Array.isArray(categories)) {
    categories = [categories];
  }

  // Récupérer la ville à partir des coordonnées
  fetch(`https://api-adresse.data.gouv.fr/search/?q=${req.params.city}`)
    .then(response => response.json())
    .then(infos => {
      const city = infos.features[0].properties.city;

      const matchConditions = {
        startDate: { $gte: new Date(startDateStartHeure) },
        endDate: { $lte: new Date(endDateEndHeure) },
        "placeInfo.city": { $regex: city, $options: "i" },
      };

      // Ajouter le filtre de catégorie uniquement si des catégories sont sélectionnées
      if (categories.length > 0) {
        matchConditions.categories = { $in: categories };
      }

      Event.aggregate([
        {
          $lookup: {
            from: "places", // La collection à joindre
            localField: "place", // Le nom de la propriété (clé étrangère)
            foreignField: "_id", // Le champ de la collection qui fait le lien
            as: "placeInfo", // Le nom du champ de résultat après la jointure
          },
        },
        {
          $unwind: "$placeInfo", // Décompose le tableau résultant de la jointure en documents individuels
        },
        {
          $match: matchConditions, // Appliquer les conditions de match
        },
      ]).then((data) => {
        console.log(data);
        res.json({ events: data });
      });

    })
    .catch(error => {
      console.error("Error fetching city data:", error);
      res.status(500).json({ error: "Error fetching city data" });
    });
});

// 5- Route get en fonction du user (afficher les events que l'user a créé)
router.get("/user/:id", (req, res) => {
  Event.find({ user: req.params.id }).then((data) => {
    console.log(data);
    res.json({ events: data });
  });
});

// 6- Route delete un event
// NB: un event ne peut être suppr par un user que si c'est cet user qui l'a créé
router.delete("/:id", (req, res) => {
  Event.deleteOne({ _id: req.params.id }).then(() => {
    res.json({ result: true });
  });
});

// 7- Mise à jour du compteur NbLike
router.put("/like/:token/:idEvent", (req, res) => {
  User.findOne({ token: req.params.token }).then((userData) => {
    Event.findOne({ _id: req.params.idEvent }).then((eventData) => {
      if (eventData && !eventData.nbLike.includes(userData._id)) {
        Event.updateOne(
          { _id: req.params.idEvent },
          { $push: { nbLike: userData._id } }
        ).then(() => {
          res.json({ result: true });
        });
      } else {
        Event.updateOne(
          { _id: req.params.idEvent },
          { $pull: { nbLike: userData._id } }
        ).then(() => {
          res.json({ result: false });
        });
      }
    });
  });
});

// 8- Mise à jour du nombre de users qui ont booked cet event
router.put("/booking/:token/:idEvent", (req, res) => {
  User.findOne({ token: req.params.token }).then((userData) => {
    Event.findOne({ _id: req.params.idEvent }).then((eventData) => {
      if (eventData && !eventData.nbBooking.includes(userData._id)) {
        Event.updateOne(
          { _id: req.params.idEvent },
          { $push: { nbBooking: userData._id } }
        ).then(() => {
          res.json({ result: true });
        });
      } else {
        Event.updateOne(
          { _id: req.params.idEvent },
          { $pull: { nbBooking: userData._id } }
        ).then(() => {
          res.json({ result: false });
        });
      }
    });
  });
});

// 9- Route chercher un event par son id
router.get("/:id", (req, res) => {
  Event.findById(req.params.id).then((data) => {
    res.json({ events: data });
  });
});

// 10- Route chercher les 5 events qui ont le plus de like
router.get("/top/liked", (req, res) => {
  // Je n'affiche que les events dont la date de fin est au delà d'aujourd'hui
  Event.find({ endDate: { $gt: new Date() } }).then((events) => {
    let sortedEvents = events.sort((a, b) => b.nbLike.length - a.nbLike.length);
    res.json({ events: sortedEvents });
  });
});

// 11- Route pour chercher tous les events que l'user a liké
router.get("/likelist/like/user/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((userData) => {
    Event.find({ nbLike: { $in: userData._id } }).then((eventData) => {
      // tri dans l'ordre croissant des events
      let sortedEventsLiked = eventData.sort(
        (a, b) => a.startDate - b.startDate
      );
      res.json({ eventsLiked: sortedEventsLiked });
    });
  });
});

// 12- Route pour chercher tous les events que l'user a booké
router.get("/bookinglist/booking/user/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((userData) => {
    Event.find({
      nbBooking: { $in: userData._id },
    }).then((eventData) => {
      // tri dans l'ordre croissant des events
      let sortedEventsBooked = eventData.sort(
        (a, b) => a.startDate - b.startDate
      );
      res.json({ eventsBooked: sortedEventsBooked });
    });
  });
});

// 13 - Route DELETE pour supprimer les événements basés sur l'ID du lieu
router.delete('/events/delete-by-place/:placeId', async (req, res) => {
  try {
    const placeId = req.params.placeId;
    
    // Suppression des événements où le champ 'place' correspond à l'ID fourni
    const result = await Event.deleteMany({ place: req.params.placeId });

    res.status(200).json({
      message: `Nombre de documents supprimés : ${result.deletedCount}`
    });
  } catch (error) {
    console.error("Erreur lors de la suppression des documents :", error);
    res.status(500).json({ error: 'Erreur lors de la suppression des documents.' });
  }
});

// 14- Route swipe à droite
router.put("/swipe/droite/droite/:token/:idEvent", (req, res) => {
  User.findOne({ token: req.params.token }).then((userData) => {
    Event.findOne({ _id: req.params.idEvent }).then((eventData) => {
      if (eventData && !eventData.nbLike.includes(userData._id)) {
        Event.updateOne(
          { _id: req.params.idEvent },
          { $push: { nbLike: userData._id } }
        ).then(() => {
          res.json({ result: true });
        });
      } else {
        res.json({ result: false, message: "l'utilisateur avait déjà liké cet event" });
      }
    });
  });
});

// 15- Route swipe à gauche
router.put("/swipe/gauche/gauche/:token/:idEvent", (req, res) => {
  User.findOne({ token: req.params.token }).then((userData) => {
    Event.findOne({ _id: req.params.idEvent }).then((eventData) => {
      if (eventData && eventData.nbLike.includes(userData._id)) {
        Event.updateOne(
          { _id: req.params.idEvent },
          { $pull: { nbLike: userData._id } }
        ).then(() => {
          res.json({ result: true });
        });
      } else {
        res.json({ result: false, message: "l'utilisateur n'avait pas liké cet event" });
      }
    });
  });
});

module.exports = router;