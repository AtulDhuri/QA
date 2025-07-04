const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Dynamic Form'
  },
  description: {
    type: String,
    default: ''
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure one admin can create only one form
formSchema.index({ adminId: 1 }, { unique: true });

module.exports = mongoose.model('Form', formSchema);