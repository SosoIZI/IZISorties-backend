const mongoose = require('mongoose');
require('dotenv').config();

const connectionString = 'mongodb+srv://ClusterSoso:wtmNFlLOkcKVEHli@clustersoso.7lda9ao.mongodb.net/IZISorties-LaCapsule'

mongoose.connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log('Tu es bien connecté à Mongoose !'))
  .catch(error => console.error(error));