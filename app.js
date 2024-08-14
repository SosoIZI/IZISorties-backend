require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const fileUpload = require('express-fileupload');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var placesRouter = require('./routes/places');
var eventsRouter = require('./routes/events');
var categoriesRouter = require('./routes/categories');

var app = express();
const cors = require('cors')
app.use(cors())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
  }));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/places', placesRouter);
app.use('/events', eventsRouter);
app.use('/categories', categoriesRouter);


module.exports = app;
