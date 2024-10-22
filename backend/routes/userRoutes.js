const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/authMiddleware');
const { getUserInfo, manageApiKey, getSmsActivateBalance } = require('../controllers/userController');

// Rota para obter informações do usuário (protegida por autenticação)
router.get('/me', auth, getUserInfo);

// Rota para gerenciar a API Key do usuário (protegida por autenticação)
router.post('/api-key', auth, manageApiKey);

// Rota para obter o saldo do usuário no SMS Activate (protegida por autenticação)
router.get('/balance', auth, getSmsActivateBalance);

module.exports = router;