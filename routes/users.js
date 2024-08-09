var express = require('express');
var router = express.Router();

require('../models/connection');
const User = require('../models/users');
const { checkBody } = require('../modules/checkBody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');

// 1- Route qui créé l'user OpenAgenda 
router.post("/openAgenda", (req, res) => {
    const newUser = new User({
        username: 'OpenAgenda',
    });
    newUser.save().then((newDoc) => {
      res.json({ result: true });
    });
  });


  // 1/Route pour s'inscrire (en utilisant checkBody pour valider l'exactitude des infos)

  router.post('/signup', (req, res) => {
    if (!checkBody(req.body, ['username','email', 'password'])) {  // if !checkBody === checBody false === isVAlid false
      res.json({ result: false, error: 'Éléments manquants' })
    
      return;
    }
  
    // On regarde si l'utilisateur ne s'est pas déja enregistré

    User.findOne({ email: req.body.email }).then(data => {
      if (data === null) {// Si data null alors on crée un nouvel User)
        const hash = bcrypt.hashSync(req.body.password, 10);
  
        const newUser = new User({
          username: req.body.username,
          email:req.body.email,
          password: hash,
          token: uid2(32),
    
        });
        // on save l'user dans la dataBase
        newUser.save().then(newDoc => {
          res.json({ result: true, token: newDoc.token });
        });
      } else {
        //Si data n'est pas null: L'utilisateur existe déja dans la base de donnée
        res.json({ result: false, error: 'Utilisateur déja inscrit' })
    
      }
    });
  });


// 2/   Route pour se connecter

  router.post('/signin', (req, res) => {
    console.log(req.body);
    if (!checkBody(req.body, ['email', 'password'])) {
      res.json({ result: false, error: 'Erreur: Informations manquantes' });
      return;
    }
  // Une fois que les données ont été renseignées, à savoir mail/pseudo et password on va contrôler l'exactitude du password 

    User.findOne({ email: req.body.email }).then(data => {
      console.log(data);
      if (data && bcrypt.compareSync(req.body.password, data.password)) {
        res.json({ result: true, token: data.token });
      } else {
        res.json({ result: false, error: 'Utilisateur non trouvé, mot de passe faux' });
    
      }
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
  