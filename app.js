if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require('method-override');
const ejsMate = require("ejs-mate");
const WrapAsync = require("./ulits/WrapAsnyc.js"); 
const ExpressError = require("./ulits/ExpressErr.js"); 
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require('passport-local');
const Users = require("./models/user.js");
const { saveRedirectUrl } = require("./middleware.js");
const listingsRouter = require("./Routes/listing.js");
const reviewsRouter = require("./Routes/reviews.js");

const dbsUrl = process.env.ATLASDB_URL;

// Setup EJS engine
app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
mongoose.connect(dbsUrl)
  .then(() => console.log("Connected to DB"))
  .catch(err => console.log(err));

  const store = MongoStore.create({
    mongoUrl: dbsUrl,
    crypto: {
    secret: process.env.SECRET ,
    },
    touchAfter: 24 * 3600,
  });

  store.on("error", () =>{
    console.log("ERROR MONGOSTORE SESSOION :", err)
  })
// Configure session
const sessionOptions = {
  store,
  secret: process.env.SECRET, 
  resave: false,
  saveUninitialized: true,
  cookie: {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true
  }
};

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(Users.serializeUser());
passport.deserializeUser(Users.deserializeUser());
passport.use(new LocalStrategy(Users.authenticate()));

// Flash messages middleware
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  next();
});

// Routes
app.get('/', (req, res) => {
  res.render("home");
});

// Signup routes
app.get('/signup', (req, res) => {
  res.render('sign');
});

app.post("/signup",
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
  })
);

// Login routes
app.get("/login", (req, res) => {
  res.render('login');
});

app.post("/login",
  saveRedirectUrl,
  passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login"
  }), (req, res) => {
      req.flash("success", "Welcome back!");
      let redirectUrl = res.locals.redirectUrl || "/listing"; 
      res.redirect(redirectUrl);
  }
);

// Logout route
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
      if (err) return next(err);
      req.flash("success", "Logged out successfully!");
      res.redirect("/listing");
  });
});

// Listings and reviews routers
app.use("/listing", listingsRouter);
app.use("/listing/:id/reviews", reviewsRouter);

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Error handler
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something Went Wrong!";
  res.status(statusCode).render("error", { err });
});

// Start server
app.listen(8080, () => {
  console.log("Server is listening on port 8080");
});
