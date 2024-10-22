const mongoose = require('mongoose');

const ApiKeySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  key: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ApiKey = mongoose.model('ApiKey', ApiKeySchema);

module.exports = ApiKey;