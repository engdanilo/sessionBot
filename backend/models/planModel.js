const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanType', required: true },
    expirationDate: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
});

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;
