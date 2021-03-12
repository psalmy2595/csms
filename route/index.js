const express = require("express");
const { auth } = require("../middleware/auth");
const { User } = require("../models/user");
const axios = require("axios");

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
    if (err) return res.status(400).json(err);

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
  console.log("🚀 ~ file: index.js ~ line 61 ~ req.body", req.body);

  const recipientDigitsArray = recipient.split("");
  recipientDigitsArray.shift();
  recipientDigitsArray.unshift("2", "3", "4");
  recipientDigitsArray.join("");

  const processedNumber = recipientDigitsArray.join("");

  const options = {
    data: {
      SMS: {
        auth: {
          username: "olatunjiyakub99@gmail.com",
          apikey: "f338d58a940ea765f2c8c35a44e156b7540fb8fd",
        },
        message: {
          sender: sender,
          messagetext: message,
          flash: "0",
        },
        recipients: {
          gsm: [
            {
              msidn: processedNumber,
            },
          ],
        },
      },
    },
    method: "POST",
    url: "http://api.ebulksms.com:8080/sendsms.json",
    headers: { "content-type": "application/json" },
  };

  axios(options)
    .then((res) => {
      const status = res.data.response.status;

      if (status === "SUCCESS") {
        console.log("success");
      } else {
        throw new Error(`Unable to send message - Reason: ${status}`);
      }
    })
    .catch((error) => {
      console.log(
        "🚀 ~ file: index.js ~ line 93 ~ axios ~ error",
        error.message
      );
    });

  res.redirect("/dashboard");
});

router.get("/logout", function (req, res) {
  res.clearCookie("w_auth");
  res.clearCookie("w_authExp");

  res.redirect("/login");
});

module.exports = router;
