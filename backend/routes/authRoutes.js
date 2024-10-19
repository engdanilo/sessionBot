// backend/routes/authRoute.js
const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/authController'); // Importação desestruturada

// Rota de login
router.post('/login', login);

// Rota de registro
router.post('/register', register);

module.exports = router;