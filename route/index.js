const express = require("express");
const { auth } = require("../middleware/auth");
const { User } = require("../models/user");
const axios = require("axios");
const { smsApiUsername, smsApiKey } = require("../config");

const router = express.Router();

router.get("/", function (req, res) {
  res.redirect('/login')
});

router.get("/register", function (req, res) {
  res.render("register", { successMessage: req.flash('success'), errorMessage: req.flash('error') });
});

router.get("/dashboard", auth, function (req, res) {
  res.render("dashboard", { successMessage: req.flash('success'), errorMessage: req.flash('error') } );
});

router.get("/login", function (req, res) {
  res.render("login", { successMessage: req.flash('success'), errorMessage: req.flash('error') } );
});

router.get("/sent", function (req, res) {
  res.render("sent");
});

router.get("/error", function (req, res) {
  res.render("error", {error: null, returnUrl: '/dashboard'});
});
//Post requests
router.post("/register", function (req, res) {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (user) {
      req.flash("error", "User with the provided email already exists");
      return res.redirect('/register')
    } else {
      const reg = new User({
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
      });
    
      reg.save((err, user) => {
        if (err) {
          req.flash("error", err.message)
          res.redirect('/register')
        } else {
          req.flash('success', 'Please sign in with your new credentials')
          res.redirect("/login");
        }
      });
    }
  })
});


router.post("/login", function (req, res) {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) return res.status(400).json(err);
    if (!user) {
      req.flash('error', 'Invalid email or password');
      res.redirect("/login")
    } else {
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (!isMatch) {
          req.flash('error', 'Invalid email or password')
          return res.redirect('/login')
        }
        // // Generate token on login
        user.generateToken((err, tok) => {
          if (err) {
            req.flash('error', "Unable to sign in, please try again")
            res.redirect('/login')
          };
          res.cookie("w_authExp", tok.tokenExp);
          res.cookie("w_auth", tok.token);
          console.log("success");
          res.redirect("dashboard");
        });
      });
    }

  });
});

router.post("/dashboard", function (req, res) {
  const { message, sender, recipient } = req.body;

  const splitedRecipients = recipient.split(',').map(item => {
    const recipientDigitsArray = item.split("");
    recipientDigitsArray.shift();
    recipientDigitsArray.unshift("2", "3", "4");
    
    return {
      msidn: recipientDigitsArray.join("")
    };
  })

  const options = {
    data: {
      SMS: {
        auth: {
          username: smsApiUsername,
          apikey: smsApiKey,
        },
        message: {
          sender: sender,
          messagetext: message,
          flash: "0",
        },
        recipients: {
          gsm: splitedRecipients,
        },
      },
    },
    method: "POST",
    url: "http://api.ebulksms.com:8080/sendsms.json",
    headers: { "content-type": "application/json" },
  };

  axios(options)
    .then((response) => {
      const status = response.data.response.status;

      if (status === "SUCCESS") {
        res.redirect("/sent");
      } else {
        throw new Error(`Unable to send message - Reason: ${status}`);
      }
    })
    .catch((error) => {
      res.render("error", { error, returnUrl: "/dashboard" });
    });
});

router.get("/logout", function (req, res) {
  res.clearCookie("w_auth");
  res.clearCookie("w_authExp");

  res.redirect("/login");
});

module.exports = router;
