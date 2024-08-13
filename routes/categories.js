var express = require("express");
var router = express.Router();

require("../models/connection");

const Categorie = require("../models/categories");

// 1 - Route pour récupérer toutes les categories
router.get("/", (req, res) => {
    Categorie.find().then((data) => {
      res.json({ categories: data });
    });
  });

module.exports = router;