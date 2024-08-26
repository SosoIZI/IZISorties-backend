var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const crypto = require("crypto"); //pour crypter le token
const nodemailer = require("nodemailer"); // pour l'envoi du mail

// 1- Route qui créé l'user OpenAgenda
router.post("/openAgenda", (req, res) => {
  const newUser = new User({
    username: "OpenAgenda",
  });
  newUser.save().then((newDoc) => {
    res.json({ result: true });
  });
});

// 2-Route pour s'inscrire (en utilisant checkBody pour valider l'exactitude des infos)
router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["username", "email", "password"])) {
    // if !checkBody === checBody false === isVAlid false
    res.json({ result: false, error: "Éléments manquants" });

    return;
  }

  // On regarde si l'utilisateur ne s'est pas déja enregistré

  User.findOne({ email: req.body.email }).then((data) => {
    if (data === null) {
      // Si data null alors on crée un nouvel User)
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: hash,
        token: uid2(32),
      });
      // on save l'user dans la dataBase
      newUser.save().then((newDoc) => {
        res.json({ result: true, token: newDoc.token });
      });
    } else {
      //Si data n'est pas null: L'utilisateur existe déja dans la base de donnée
      res.json({ result: false, error: "Utilisateur déja inscrit" });
    }
  });
});

// 3-Route pour se connecter
router.post("/signin", (req, res) => {
  // console.log(req.body);
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Erreur: Informations manquantes" });
    return;
  }
  // Une fois que les données ont été renseignées, à savoir mail/pseudo et password on va contrôler l'exactitude du password
  User.findOne({ email: req.body.email }).then((data) => {
    console.log(data);
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token });
    } else {
      res.json({
        result: false,
        error: "Utilisateur non trouvé, mot de passe faux",
      });
    }
  });
});

router.delete('/delete/:token', (req, res) => {            // on rajoute un nom de route delete pour specifier la route                  
    User.deleteOne({ token: req.params.token })
      .then(() => {                                               // Supprimer l'id qui est égal à 'id de la requête . c'est l'id qui correspond au bouton supprimer
        User.find()
          .then(data => {
            res.json({ result: true });                           
          });
      });
  })

// route pour faire la demande de changement de mdp-//
  router.post('/forgot-password', (req, res) => { 
    const { email } = req.body;
    User.findOne({ email }).then(user => {
        if (!user) {
            return res.json({ result: false, error: 'Utilisateur non trouvé' });
        }
    // Générer un token unique et une date d'expiration
    const token = crypto.randomBytes(32).toString("hex");
    const expirationDate = Date.now() + 3600000; // token valable une heure
    // Sauvegarder le token et la date d'expiration dans la base de données
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expirationDate;
    user.save();

    // Configurer le service de messagerie

    const transporter = nodemailer.createTransport({
      //La méthode createTransport est utilisée pour configurer et créer un transporteur (transport) qui enverra les emails via un service de messagerie (comme Gmail).
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Pour éviter les erreurs de certificat (à utiliser uniquement en développement)
      },
    });
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Réinitialisation de votre mot de passe",
      text: `Vous recevez cet e-mail car vous avez demandé la réinitialisation du mot de passe de votre compte.
                 Veuillez cliquer sur le lien suivant, ou copiez-le dans votre navigateur pour terminer le processus:
                 http://localhost:3001/reset-password?token=${token} 
                 Si vous n'avez pas demandé cela, ignorez cet e-mail et votre mot de passe restera inchangé.`,
      };

      
      // Envoyer l'email
      transporter.sendMail(mailOptions, (err) => {
  
          if (err) {
            console.log('Erreur lors de l\'envoi de l\'email:', err)
              return res.json({ result: false, error: 'Erreur lors de l\'envoi de l\'email' });
          }
          res.json({ result: true, message: 'Email de réinitialisation envoyé' });
      });
  });
});

//Route pour renouveler son mot de passe
router.post("/reset-password/:token", (req, res) => {
  const { password } = req.body;
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  }) // greater than date de lancement de demande du token
    .then((user) => {
      if (!user) {
        return res.json({
          result: false,
          error: "Le token de réinitialisation est invalide ou a expiré.",
        });
      }
      // Mettre à jour le mot de passe et supprimer les informations de réinitialisation
      const hash = bcrypt.hashSync(password, 10);
      user.password = hash;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      user.save().then(() => {
        res.json({
          result: true,
          message: "Mot de passe réinitialisé avec succès.",
        });
      });
});
})

// Route get les infos du user en fonction du token
router.get("/infos/:token", (req, res) => {
  User.find({ token: req.params.token }).then((data) => {
    console.log(data);
    res.json({ user: data });
  });
});

// Route pour se connecter au service google pour authentification
router.post('/google-auth', (req, res) => {
  const { name,email} = req.body;
 
  User.findOne({ email }).then(user => {
    if (user) {
      // Si l'utilisateur existe, renvoyer le token
      res.json({ result: true, token: user.token });
    } else {
      // Si l'utilisateur n'existe pas, créer un nouveau compte
      const newUser = new User({
        username: name,
        email: email,
        token: uid2(32), // Créez un nouveau token pour l'utilisateur
      });

      newUser.save().then(newDoc => {
        res.json({ result: true, token: newDoc.token });
      }).catch(error => {
        res.json({ result: false, error: "Erreur lors de la création de l'utilisateur" });
      });
    }
  }).catch(error => {
    res.json({ result: false, error: "Erreur lors de la vérification de l'utilisateur" });
  });
});

module.exports = router;