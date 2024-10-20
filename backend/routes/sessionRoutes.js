// backend/routes/sessionRoutes.js
const express = require('express');
const router = express.Router();
const { createSession } = require('../controllers/sessionController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rota para criar uma nova sessão
router.post('/create-session', authMiddleware, createSession);

module.exports = router;