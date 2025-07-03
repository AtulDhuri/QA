const mongoose = require('mongoose');

const remarkSchema = new mongoose.Schema({
  rating: { type: Number, required: true, min: 1, max: 10 }, // Rating out of 10
  attendedBy: { type: String, required: true },
  remark: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const responseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks: [remarkSchema],
  clientRating: { type: Number, min: 0, max: 5 } // Average rating out of 5
}, { 
  timestamps: true,
  strict: false // Allow any fields to be saved
});

module.exports = mongoose.model('Response', responseSchema);