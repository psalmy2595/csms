const express = require("express");
const { auth } = require("../middleware/auth");
const bcrypt = require('bcrypt');
const { User } = require("../models/user");
const Token = require("../models/token");
const axios = require("axios");
const crypto = require("crypto");
const { smsApiUsername, smsApiKey, clientUrl } = require("../config");
const sendEmail = require("../utils/email/sendEmail");

const router = express.Router();

router.get("/", function (req, res) {
  res.redirect("/login");
});

router.get("/register", function (req, res) {
  res.render("register", {
    successMessage: req.flash("success"),
    errorMessage: req.flash("error"),
  });
});

router.get("/dashboard", auth, function (req, res) {
  res.render("dashboard", {
    successMessage: req.flash("success"),
    errorMessage: req.flash("error"),
  });
});

router.get("/login", function (req, res) {
  res.render("login", {
    successMessage: req.flash("success"),
    errorMessage: req.flash("error"),
  });
});

router.get("/sent", function (req, res) {
  res.render("sent");
});

router.get("/error", function (req, res) {
  res.render("error", { error: null, returnUrl: "/dashboard" });
});

router.get("/forgot-password", function (req, res) {
  res.render("forgotPassword", {
    successMessage: req.flash("success"),
    errorMessage: req.flash("error"),
  });
});

router.get("/password-reset", function (req, res) {
  res.render("passwordReset", {
    successMessage: req.flash("success"),
    errorMessage: req.flash("error"),
    query : req.query
  });
});

//Post requests
router.post("/register", function (req, res) {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (user) {
      req.flash("error", "User with the provided email already exists");
      return res.redirect("/register");
    } else {
      const reg = new User({
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
      });

      reg.save((err, user) => {
        if (err) {
          req.flash("error", err.message);
          res.redirect("/register");
        } else {
          req.flash("success", "Please sign in with your new credentials");
          res.redirect("/login");
        }
      });
    }
  });
});

router.post("/login", function (req, res) {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) return res.status(400).json(err);
    if (!user) {
      req.flash("error", "Invalid email or password");
      res.redirect("/login");
    } else {
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (!isMatch) {
          req.flash("error", "Invalid email or password");
          return res.redirect("/login");
        }
        // // Generate token on login
        user.generateToken((err, tok) => {
          if (err) {
            req.flash("error", "Unable to sign in, please try again");
            res.redirect("/login");
          }
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

  const splitedRecipients = recipient.split(",").map((item) => {
    const recipientDigitsArray = item.split("");
    recipientDigitsArray.shift();
    recipientDigitsArray.unshift("2", "3", "4");

    return {
      msidn: recipientDigitsArray.join(""),
    };
  });

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
        req.flash("success", "Message sent successfully");
        res.redirect("/dashboard");
      } else {
        throw new Error(`Unable to send message - Reason: ${status}`);
      }
    })
    .catch((error) => {
      req.flash("error", error.message);
      res.redirect("/dashboard");
    });
});

router.get("/logout", function (req, res) {
  res.clearCookie("w_auth");
  res.clearCookie("w_authExp");

  res.redirect("/login");
});

router.post("/forgot-password", async function (req, res) {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    req.flash("error", "User with provided email does not exist");
    res.redirect("/forgot-password");
  }
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  await new Token({
    userId: user._id,
    token: resetToken,
    createdAt: Date.now(),
  }).save();

  // send to user here
  const link = `${clientUrl}/password-reset?token=${resetToken}&id=${user._id}`;
  console.log("🚀 ~ file: index.js ~ line 193 ~ link", link);
  sendEmail(
    user.email,
    "Password Reset Request",
    { name: user.name, link },
    "./templates/requestResetPassword.handlebars"
  );

  req.flash("success", "Reset password link her been sent to your email");
  res.redirect("/forgot-password");
});

router.post("/password-reset", async function (req, res) {
  const { token, userId, newPassword } = req.body;

  let passwordResetToken = await Token.findOne({ token, userId });
  if (!passwordResetToken) {
    req.flash("error", "Invalid or expired password reset token");
    return res.redirect("back");
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    await User.updateOne(
      { _id: userId },
      { $set: { password: hash } },
      { new: true }
    );
    const user = await User.findById({ _id: userId });
    sendEmail(
      user.email,
      "Password Reset Successfully",
      {
        name: user.name,
      },
      "./templates/resetPassword.handlebars"
    );
    await passwordResetToken.deleteOne();
    req.flash("success", "Password reset successfully, Please log in");
    res.redirect("/login");
  } catch (error) {
    req.flash("error", `Unable to reset password ${error.nessage}`);
    return res.redirect("back");
  }
});

module.exports = router;
