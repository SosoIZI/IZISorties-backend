var express = require("express");
var router = express.Router();

require("../models/connection");
const Event = require("../models/events");

// Attention ici ce sont les routes pour les events qui sont présents dans la BDD
// donc cela ne concerne que les events qui ont été créés dans IZI
// Pour les events issus de l'API, écrire les routes dans index.js

// 1- Route get en fonction des filtres de recherche

// 2- Route get en fonction du user (afficher les events que l'user a créé)

// 3- Route delete un event (si c'est un event créé par le user)


module.exports = router;