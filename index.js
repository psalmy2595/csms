const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const routes = require('./route/index');
const cookieParser = require('cookie-parser');
const config = require("./config");
const session = require('express-session');
const flash = require('express-flash');
const PORT = process.env.PORT || 3000;


mongoose.connect(
 config.dbUrl,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  }
);

//telling express to use body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookieParser())
app.use(session({
  cookie: { maxAge: 60000 },
  saveUninitialized: true,
  resave: true,
  secret: 'secret'
}));
app.use(flash());

//Root route
app.use('/', routes);



app.listen(PORT, function () {
  console.log("NEW SMS PORTAL, SERVER STARTED ON PORT 3000");
});