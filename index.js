const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { User } = require("./models/user");

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

//Root route
app.get("/", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/dashboard", function (req, res) {
  res.render("dashboard");
});

app.get("/login", function (req, res) {
  res.render("login");
});

//Post requests
app.post("/register", function (req, res) {
  const reg = new User({
    email: req.body.email,
    password: req.body.password,
    name: req.body.name,
  });

  reg.save((user, err) => {
    if (err) {
      return res.send("Check User Information");
    }
    return res.redirect("login");
  });
});

app.post("/login", function (req, res) {
  User.findOne({ email: req.body.email }, (err, user) => {
    if(err) return res.status(400).json(err)
  
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (!isMatch) return res.status(400).send("Error", err);
        // // Generate token on login
        user.generateToken((err, tok) => {
          if (err) return res.status(400).send(err);
          res.cookie("w_authExp", tok.tokenExp);
          res.cookie("w_auth", tok.token);
          console.log("success");
          res.render("dashboard");
        });
      });

  });
});

app.listen(PORT, function () {
  console.log("NEW SMS PORTAL By Psalmyjay, SERVER STARTED ON PORT 3000");
});