const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true},
    country: {type: String, required: true},
    sessionData: {type: String, required: true},
    createdAt: {type: Date, default: Date.now},
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;