const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {type: String, required: true, trim: true, maxlength: 100},
    message: {type: String, required: true, trim: true, maxlength: 400},
    icon: {type: String, default: 'notifications-outline'},
    isActive: {type: Boolean, default: true},
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  },
  {timestamps: true},
);

module.exports = mongoose.model('Notification', notificationSchema);
