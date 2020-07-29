require("dotenv").config();
require('module-alias/register');
const config = require('config');
const mongodbUri = config.get('app.mongodbUri');
const isProduction = process.env.NODE_ENV !== 'development';
const mongoose = require('mongoose');
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const history = require('connect-history-api-fallback');

const app = express();

// Set up Mongodb
if (isProduction) {
  mongoose.connect(mongodbUri);
} else {
  mongoose
    .connect(mongodbUri, { useUnifiedTopology: true, useNewUrlParser: true })
    .catch((error) => {
      console.log("Mongodb crashed ERROR:", error);
    });
  mongoose.set("debug", true);
}

const sixtyDaysInSeconds = 5184000
app.use(helmet.hsts({
  maxAge: sixtyDaysInSeconds
}))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(history());
app.use(express.static('./client/dist'));

// API endpoints
app.use('/api', require('./routes/api'));

app.get("/*", function(req, res) {
  return res.sendFile("./client/public/index.html");
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500).json(err);
});

module.exports = app;
