const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String
  },
  username: {
    type: String
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    default: ''
  },
  apiKey: {
    type: String,
    required: true,
    default: ''
  },
  paid: {
    type: Boolean,
    default: false
  },
  paymentExpiration: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  termsOfUse: {
    type: Boolean,
    default: false
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;