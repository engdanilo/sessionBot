const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/authMiddleware');
const { createPaymentIntent } = require('../controllers/paymentController');

// Rota para criar uma nova intenção de pagamento (protegida por autenticação)
router.post('/create-intent', auth, createPaymentIntent);

module.exports = router;