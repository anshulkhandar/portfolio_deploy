const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  position: { type: String, required: true },
  location: { type: String, default: '' },
  startDate: { type: String, required: true },
  endDate: { type: String, default: 'Present' },
  description: { type: String, default: '' },
  technologies: [{ type: String }],
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Experience', experienceSchema, 'experiences');
