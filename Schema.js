// Schema.js
const Joi = require('joi');

// Define the schema for a listing
const listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    price: Joi.number().required().min(0),
    description: Joi.string().required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    image: Joi.string().optional().allow(null, ''), 
    // Add other fields as needed
  }).required()
});

// Define the schema for a review
const reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required(),
    // Add other fields as needed
  }).required()
});

// Export the schemas
module.exports = { listingSchema, reviewSchema };
