const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Reviews = require("./review.js")

const listingSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],  
  },
  description: String,
  image:{
    url: String,
    filename:String
  },
  price: Number,
  location: String,
  country: String,
  reviews: [{
    type: Schema.Types.ObjectId,
    ref: "Reviews"
  }],
  owner:{
    type: Schema.Types.ObjectId,
    ref: "User"
  }
});

listingSchema.post("findOneAndDelete", async function (listing) {
  if (listing) {
      await Reviews.deleteMany({ _id: { $in: listing.reviews } });
  }
});


const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;