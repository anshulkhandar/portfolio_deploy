const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  // Array of images from Cloudinary
  images: [{
    url: String,
    publicId: String
  }],
  
  // Link to YouTube/Vimeo video
  videoLink: { type: String, default: '' },
  
  technologies: [{ type: String }],
  githubLink: { type: String, default: '' },
  liveLink: { type: String, default: '' },
  category: { type: String, default: 'Web Development' },
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema, 'projects');
