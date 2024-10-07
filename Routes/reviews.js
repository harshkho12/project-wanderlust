const express = require("express");
const router = express.Router({ mergeParams: true });
const Listings = require("../models/listing.js");
const Reviews = require("../models/review.js");
const { isLogedIn, authorReview  } = require("../middleware");
const { reviewSchema } = require("../Schema");
const ExpressError = require("../ulits/ExpressErr");
const WrapAsync = require("../ulits/WrapAsnyc");

// Reviews routes
// Post reviews/
const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
      const errMsg = error.details.map(el => el.message).join(',');
      throw new ExpressError(400, errMsg);
    } else {
      next();
    }
  };

router.post("/", validateReview, WrapAsync(async (req, res) => {
    const listing = await Listings.findById(req.params.id);
    const newReview = new Reviews(req.body.review);
   newReview.author = req.user._id;
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    req.flash("success", "Review Added!");
    res.redirect(`/listing/${listing._id}`);
  }));
  
  // delete reviews ------
  router.delete("/:reviewId",isLogedIn,authorReview, WrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Listings.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Reviews.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted!");
    res.redirect(`/listing/${id}`);
  }));

  module.exports = router;