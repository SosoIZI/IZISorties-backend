var express = require("express");
var router = express.Router();

require("../models/connection");
const moment = require("moment");
moment().format();
const apiKey = process.env.API_KEY;

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

// 2- Route qui créé dans Mongoose les events de OpenAgenda
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
                  {obj.image ? (pictures= obj.image.base + obj.image.filename) : (pictures= "/IZI_sorties_home.png")}
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
                  newEvent.save();
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
// music&categorie=cinema
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
      $match: {
        endDate: {
          $gte: new Date(endDateStartHeure),
          $lte: new Date(endDateEndHeure),
        },
        startDate: {
          $gte: new Date(startDateStartHeure),
          $lte: new Date(startDateEndHeure),
        },
        categories: { $in: categories },
        "placeInfo.city": { $regex: city, $options: "i" },
      },
    },
  ])
  .then(events => {res.json({ events })})
  .catch(error => {
    console.error(error);
    res.status(500).json({ error: 'Une erreur est survenue' });
  });
})
.catch(error => {
  console.error(error);
  res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de la ville' });
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
router.put("/like/:idUser/:idEvent", (req, res) => {
  Event.findOne({ _id: req.params.idEvent }).then((eventData) => {
    if (eventData && !eventData.nbLike.includes(req.params.idUser)) {
      Event.updateOne(
        { _id: req.params.idEvent },
        { $push: { nbLike: req.params.idUser } }
      ).then(() => {
        res.json({ result: true });
      });
    } else {
      Event.updateOne(
        { _id: req.params.idEvent },
        { $pull: { nbLike: req.params.idUser } }
      ).then(() => {
        res.json({ result: false });
      });
    }
  });
});

// 8- Mise à jour du nombre de users qui ont booked cet event
router.put("/booking/:idUser/:idEvent", (req, res) => {
  Event.findOne({ _id: req.params.idEvent }).then((eventData) => {
    if (eventData && !eventData.nbBooking.includes(req.params.idUser)) {
      Event.updateOne(
        { _id: req.params.idEvent },
        { $push: { nbBooking: req.params.idUser } }
      ).then(() => {
        res.json({ result: true });
      });
    } else {
      Tweet.updateOne(
        { _id: req.params.idEvent },
        { $pull: { nbBooking: req.params.idUser } }
      ).then(() => {
        res.json({ result: false });
      });
    }
  });
});

// 9- Route chercher un event par son id
router.get("/:id", (req, res) => {
  Event.findById(req.params.id).then((data) => {
    res.json({ events: data });
  });
});

// 10- Route chercher les 5 events qui ont le plus de booking
router.get("/top/liked", (req, res) => {
  Event.find({}).then((events) => {
    const sortedEvents = events.sort(
      (a, b) => b.nbLike.length - a.nbLike.length
    );
    res.json({ events: sortedEvents });
  });
});

module.exports = router;
