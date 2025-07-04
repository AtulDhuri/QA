const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  inputType: { 
    type: String, 
    required: true,
    enum: ['text', 'number', 'email', 'phone', 'textarea', 'select', 'radio', 'checkbox', 'rating']
  },
  options: [String], // For select, radio, checkbox
  required: { type: Boolean, default: false },
  validation: {
    minLength: { type: Number },
    maxLength: { type: Number },
    pattern: { type: String },
    min: { type: Number },
    max: { type: Number }
  },
  order: { type: Number, default: 0 },
  isRemarkField: { type: Boolean, default: false }, // To identify remark fields
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);