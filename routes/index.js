var express = require("express");
var router = express.Router();

const fetch = require("node-fetch");

const apiKey = process.env.API_KEY;
const uniqid = require("uniqid");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// pour créer des events et des places à partir d'OpenAgenda, il faut toujours commencer par vérifier que l'user OpenAgenda est présent dans la BDD dans la coll "users"
// Sinon lancer la route post qui créé l'user OpenAgenda (post dans users) et récuperer l'ID d'openAgenda et le renseigner la route post de events dans la propriété "user"
// puis lancer la route post d'OpenAgenda dans places pour créer les lieux de sorties
// puis la route post d'OpenAgenda dans events pour créer les évènements et les rattacher à des lieux
// de façon générale dans IZI, ce sera toujours le même principe => on crée la place avant de créer l'event.

router.get("/openagenda", (req, res) => {
  fetch(`https://api.openagenda.com/v2/agendas/20500020/events?key=${apiKey}`)
    .then((response) => response.json())
    .then((data) => {
      if (data) {
        res.json({ events: data.events });
      } else {
        res.json({ events: "il ny a pas de données" });
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

// Route pour gérer les images dans cloudinary
router.post("/upload", async (req, res) => {
  try {
    const files = req.files.images; // Récupère les fichiers envoyés
    let urls = [];

    if (files.length) {
      // Si plusieurs fichiers sont envoyés
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const photoPath = `./tmp/${uniqid()}.jpg`; // Génère un chemin temporaire pour le fichier
        await file.mv(photoPath); // Déplace le fichier temporairement

        const resultCloudinary = await cloudinary.uploader.upload(photoPath); // Upload le fichier sur Cloudinary
        fs.unlinkSync(photoPath); // Supprime le fichier temporaire
        urls.push(resultCloudinary.secure_url); // Ajoute l'URL sécurisée au tableau des URLs
      }
    } else {
      // Si un seul fichier est envoyé
      const photoPath = `./tmp/${uniqid()}.jpg`; 
      await files.mv(photoPath); 
      const resultCloudinary = await cloudinary.uploader.upload(photoPath); 
      fs.unlinkSync(photoPath); 
      urls.push(resultCloudinary.secure_url); 
    }

    res.json({
      result: true,
      urls: urls, // Retourne les URLs des fichiers uploadés
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ result: false, error: error.message });
  }
});

module.exports = router;
