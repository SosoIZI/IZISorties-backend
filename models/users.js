const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  username: String,
  email: String,
  password: String,
  token: String, 
  eventCreated : [{ type: mongoose.Schema.Types.ObjectId, ref: 'events' }], // clé étrangère pour lier un evènement créé à l'utilisateur qui l'a créé.
//   eventLiked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'events' }], // clé étrangère pour lier l'event à l'utilisateur.
//   eventBooked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'events' }], // clé étrangère pour lier l'event à l'utilisateur.
//   j'ai supprimé les paramètres  "eventLiked et eventBooked".
//   Ce seront des props du reducer persistant "event"
resetPasswordToken: String, // Pour réinitialiser le TOKEN // Google auth
resetPasswordExpires: Date,  //Timer pour que la demande de password expire







 });

const User = mongoose.model('users', userSchema);

module.exports = User;
