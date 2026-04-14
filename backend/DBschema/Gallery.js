const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  imageUrl: { type: String, required: true },
  publicId: { type: String, required: true }, // cloudinary public id is useful for later deletion
  category: { type: String, default: 'Event' },
  eventDate: { type: String, default: '' },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Gallery', gallerySchema, 'galleries');
