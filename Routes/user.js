const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const WrapAsync = require("../ulits/WrapAsnyc");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");

// Signup routes
router.get('/signup', (req, res) => {
  res.render('sign');
});

router.post("/signup",
WrapAsync(async (req, res, next) => { 
  try {
    let { username, email, password } = req.body;
    const newUser = new Users({ email, username });
    const registeredUser = await Users.register(newUser, password);
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err); 
      }
      req.flash("success", "Welcome to Wanderlust!");
      res.redirect("/listing");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
}));

// Login routes
router.get("/login", (req, res) => {
  res.render('login');
});

router.post("/login",
  saveRedirectUrl,
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login"
  }), (req, res) => {
    req.flash("success", "Welcome back!");
    let redirectUrl = res.locals.redirectUrl || "/listing";
    res.redirect(redirectUrl);
});

// Logout route
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Logged out successfully!");
    res.redirect("/listing");
  });
});
module.exports = router;
