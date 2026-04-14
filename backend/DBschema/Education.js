const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  field: { type: String, default: '' },
  startDate: { type: String, required: true },
  endDate: { type: String, default: 'Present' },
  description: { type: String, default: '' },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Education', educationSchema, 'educations');
