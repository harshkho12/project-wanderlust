const Listing = require("./models/listing");
const Reviews = require("./models/review");
const { listingSchema, reviewSchema } = require("./Schema"); // Ensure you import these schemas
const ExpressError = require("./ulits/ExpressErr"); 





// Check if user is logged in
module.exports.isLogedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;  // Fixed typo here from `redirectUlr` to `redirectUrl`
    req.flash("error", "You must be logged in to create a listing!");
    return res.redirect("/login"); // Use `return` to stop execution after redirect
  }
  next(); // Only call `next()` if the user is authenticated
};

// Save the redirect URL before login
module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

// Check if the current user is the owner of the listing
module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing.owner.equals(req.user._id)) { 
    req.flash("error", "You don't have permission to edit");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

// Check if the current user is the author of the review
module.exports.authorReview = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Reviews.findById(reviewId);
  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You don't have permission to delete this review");
    return res.redirect(`/listings/${id}`);
  }
  next();
};
