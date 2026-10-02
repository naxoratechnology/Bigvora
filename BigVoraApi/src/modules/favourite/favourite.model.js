const mongoose = require('mongoose');
const favouriteSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true},
  productId: {type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true},
}, {timestamps: true});
favouriteSchema.index({userId: 1, productId: 1}, {unique: true});
module.exports = mongoose.model('Favourite', favouriteSchema);
