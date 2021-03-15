const express = require("express");
const { auth } = require("../middleware/auth");
const { User } = require("../models/user");
const axios = require("axios");
const { smsApiUsername, smsApiKey } = require("../config");

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

router.get("/sent", function (req, res) {
  res.render("sent");
});

router.get("/error", function (req, res) {
  res.render("error", {error: null, returnUrl: '/dashboard'});
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
    if (err) return res.status(400).json(err);
    if(!user) return res.status(400).json({ message: 'user does not exist' })

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
