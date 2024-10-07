const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const WrapAsync = require("../ulits/WrapAsnyc");
const ExpressErr = require("../ulits/ExpressErr.js")
const { listingSchema } = require("../Schema.js");
const { isLogedIn, isOwner } = require("../middleware.js");
const {storage} = require("../config/cloudinary.js")
const multer  = require('multer');
const upload = multer({ storage}) ;



// Validation Middleware for listings
const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const errMsg = error.details.map(el => el.message).join(',');
    throw new ExpressErr(400, errMsg);
  } else {
    next();
  }
};
// for search 
router.get("/", WrapAsync(async (req, res) => {
  const { query } = req.query;  

  
  let searchCriteria = {};

  if (query) {
   
    searchCriteria = {
      $or: [
        { title: new RegExp(query, 'i') }, 
        { location: new RegExp(query, 'i') }
      ]
    };
  }

  // Fetch listings based on the search criteria
  const allListing = await Listing.find(searchCriteria);
  res.render("listings/index", { allListing });
}));

// GET all listings
router.get("/", WrapAsync(async (req, res) => {
  const allListing = await Listing.find({});
  res.render("listings/index", { allListing });
}));

// GET form to create a new listing
router.get("/new", isLogedIn, (req, res) => {
  res.render("listings/new");
});


// Create listing
router.post("/", isLogedIn, upload.single('listing[image]'), validateListing, WrapAsync(async (req, res) => {
      let url = req.file.path;
      let filename =req.file.filename;
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = {url ,filename}
  await newListing.save();
  req.flash("success", "New Listing Created");
  res.redirect("/listing");
}));
// POST route to handle image uploads

// GET single listing by ID
router.get("/:id", WrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author" }
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing Not Found!");
    return res.redirect("/listing");
  }
  
  res.render("listings/show", { listing });
}));
  
// GET edit form for a listing
router.get("/:id/edit", isLogedIn, isOwner, WrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  console.log(req.body); 
  if (!listing) {
    req.flash("error", "Listing Not Found!");
    return res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
   originalImageUrl = originalImageUrl.replace("/upload","/upload/,w_250");
  res.render("listings/edit", { listing ,originalImageUrl});
}));

// PUT update listing
router.put("/:id", isLogedIn, isOwner,upload.single('listing[image]'), validateListing, WrapAsync(async (req, res) => {
  const { id } = req.params;
  const updatedListing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });
  if(typeof req.file !== "undefined"){
    let url = req.file.path;
    let filename =req.file.filename;
    updatedListing.image = {url ,filename};
    await updatedListing.save();
  }

  req.flash("success", "Listing Updated");
  res.redirect(`/listing/${updatedListing._id}`);
}));

// DELETE listing
router.delete("/:id", isLogedIn, isOwner, WrapAsync(async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted");
  res.redirect("/listing");
}));

module.exports = router;
