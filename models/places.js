const mongoose = require('mongoose');

const placeSchema = mongoose.Schema({
    namePlace: String,
    address : String,
    cp: String,
    city: String,
    latitude: Number,
    longitude: Number,
    events : [{ type: mongoose.Schema.Types.ObjectId, ref: 'events' }], // clé étrangère vers l'id des events qui ont lieu à cette place
 });

const Place = mongoose.model('places', placeSchema);

module.exports = Place;