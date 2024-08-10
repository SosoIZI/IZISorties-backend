const mongoose = require('mongoose');

const eventSchema = mongoose.Schema({
  eventName: String,
  startTime: String,
  endTime: String,
  startDate: Date,
  endDate: Date,
  place : { type: mongoose.Schema.Types.ObjectId, ref: 'places' }, // clé étrangère vers l'id de la place où a lieu cet event
  pictures: [String],
  description: String,
  price: String,
  categories: [String],
  nbLike: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }], // clé étrangère vers l'id des users qui ont liké cet event
  nbBooking: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }], // clé étrangère vers l'id des users qui ont booké cet event
  user:{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }, // clé étrangère vers l'id du user qui a créé cet event
 });

const Event = mongoose.model('events', eventSchema);

module.exports = Event;