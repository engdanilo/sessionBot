const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/authMiddleware');
const { createSessions } = require('../controllers/sessionController');

// Rota para criar novas sessões (protegida por autenticação)
router.post('/create', auth, createSessions);

module.exports = router;