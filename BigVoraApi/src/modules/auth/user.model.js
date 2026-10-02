const mongoose = require('mongoose');
const addressSchema = new mongoose.Schema({
  label: {type: String, enum: ['Home', 'Work', 'Other'], default: 'Home'},
  name: {type: String, required: true, trim: true, maxlength: 100},
  phone: {type: String, required: true, match: /^\d{10}$/},
  line: {type: String, required: true, trim: true, maxlength: 250},
  city: {type: String, required: true, trim: true, maxlength: 80},
  state: {type: String, required: true, trim: true, maxlength: 80},
  pincode: {type: String, required: true, match: /^\d{6}$/},
  isDefault: {type: Boolean, default: false},
}, {_id: true, timestamps: true});

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true },
  mobile: { type: String, trim: true, match: /^\d{10}$/ },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  isActive: { type: Boolean, default: true },
  addresses: {type: [addressSchema], default: []},
}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true, sparse: true, name: 'email_identifier_unique' });
userSchema.index({ mobile: 1 }, { unique: true, sparse: true, name: 'mobile_identifier_unique' });

userSchema.pre('validate', function () {
  if (!this.email && !this.mobile) this.invalidate('email', 'Email or mobile is required.');
});

userSchema.set('toJSON', {
  transform(doc, value) { delete value.password; return value; },
});

module.exports = mongoose.model('User', userSchema);
