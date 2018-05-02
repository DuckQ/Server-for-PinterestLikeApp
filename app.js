const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const usersRoute = require('./api/routes/users');
const authRoute = require('./api/routes/auth');
const imagesRoute = require('./api/routes/images');
const searchByTagRoute = require('./api/routes/searchByTag');
const config = require('./config');

let mongo_User = process.env.mongo_User || config.mongo_User;
let mongo_PW = process.env.mongo_PW || config.mongo_PW;
let mongo_Other = process.env.mongo_Other || config.mongo_Other;
mongoose.connect(
  'mongodb://' + mongo_User + ':' + mongo_PW + mongo_Other,
  {
    useMongoClient: true
  }
);

mongoose.Promise = global.Promise;
let db = mongoose.connection;

// Handle DB connection success
db.once("open", function() {
    console.log("Connection to db was successful");
});

app.use('/uploads', express.static('uploads'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//CORS
app.use((req, res, next) => {
  // sites that will have access
  res.header('Access-Control-Allow-Origin', '*');
  // acceptable headers
  res.header('Access-Control-Allow-Headers',  req.header("Access-Control-Request-Headers"));
  // allowed methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  //to not block incoming request
  next();
});

app.use('/api/users', usersRoute);
app.use('/api/auth', authRoute);
app.use('/api/images', imagesRoute);
app.use('/api/images/tag', searchByTagRoute);

//This setup must be in the end, because if this part was reached, it means other routers couldnt deal with request
app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: error.message
  });
});

module.exports = app;