const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  image: { type: String, default: null },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  nameKey: { type: String, required: true, unique: true },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
module.exports = mongoose.model('Category', schema);
