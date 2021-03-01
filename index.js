const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const routes = require('./route/index');
const cookieParser = require('cookie-parser')

const PORT = process.env.PORT || 3000;

mongoose.connect(
  // "mongodb+srv://psalmy2595:linuxinside@cluster0-6k5rx.mongodb.net/sms?retryWrites=true&w=majority",
  "mongodb://localhost/csms",
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
app.use(cookieParser());

//Root route
app.use('/', routes);


app.listen(PORT, function () {
  console.log("NEW SMS PORTAL By Psalmyjay, SERVER STARTED ON PORT 3000");
});