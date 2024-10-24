const express = require('express');
const router = express.Router();
const { createPaymentIntent } = require('../controllers/paymentController');

// Rota para criar uma nova intenção de pagamento
router.post('/create-intent', createPaymentIntent);

module.exports = router;