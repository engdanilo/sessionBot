const mongoose = require('mongoose');

const planTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    durationInDays: { type: Number, required: true },
    createdat: { type: Date, default: Date.now },
});

const PlanType = mongoose.model('PlanType', planTypeSchema);

module.exports = PlanType;
