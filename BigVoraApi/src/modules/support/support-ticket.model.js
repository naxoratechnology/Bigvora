const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    customerId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true},
    subject: {type: String, required: true, trim: true, maxlength: 120},
    message: {type: String, required: true, trim: true, maxlength: 1000},
    category: {type: String, enum: ['order', 'payment', 'delivery', 'account', 'return', 'other'], default: 'other'},
    status: {type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open', index: true},
  },
  {timestamps: true},
);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
