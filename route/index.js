const express = require('express');
const { auth } = require('../middleware/auth');
const { User } = require('../models/user');


const router = express.Router();

router.get("/", function (req, res) {
  res.render("login");
});

router.get("/register", function (req, res) {
  res.render("register");
});

router.get("/dashboard", auth, function (req, res) {
  res.render("dashboard");
});

router.get("/login", function (req, res) {
  res.render("login");
});

//Post requests
router.post("/register", function (req, res) {
  const reg = new User({
    email: req.body.email,
    password: req.body.password,
    name: req.body.name,
  });

  reg.save((err, user) => {
    if (err) {
      return res.send("Check User Information");
    }
    return res.redirect("login");
  });
});

router.post("/login", function (req, res) {
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
          res.redirect("dashboard");
        });
      });

  });
});

router.get('/logout', function(req, res) {
  res.clearCookie('w_auth');
  res.clearCookie('w_authExp');

  res.redirect('/login');
})


module.exports = router;