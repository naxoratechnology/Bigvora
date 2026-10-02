const mongoose = require('mongoose');

const productRuleSchema = new mongoose.Schema({
  title: {type: String, required: true, trim: true, maxlength: 80},
  description: {type: String, required: true, trim: true, maxlength: 240},
  icon: {type: String, required: true, enum: ['refresh-outline', 'shield-checkmark-outline', 'cube-outline', 'ribbon-outline', 'checkmark-circle-outline']},
  isActive: {type: Boolean, default: true},
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
}, {timestamps: true});

module.exports = mongoose.model('ProductRule', productRuleSchema);
