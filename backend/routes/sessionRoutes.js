// backend/routes/sessionRoutes.js
const express = require('express');
const router = express.Router();
const { createSession } = require('../controllers/sessionController'); // Importação desestruturada

// Rota para criar uma nova sessão
router.post('/create-session', createSession);

module.exports = router;