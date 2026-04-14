const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: 'fas fa-code' },
  level: { type: String, default: 'Beginner' },
  category: { type: String, default: 'Technical' },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Skill', skillSchema, 'skills');
