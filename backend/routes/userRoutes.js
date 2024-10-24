const express = require('express');
const router = express.Router();
const { getUserInfo, manageApiKey, getSmsActivateBalance } = require('../controllers/userController');

// Rota para obter informações do usuário
router.get('/me', getUserInfo);

// Rota para gerenciar a API Key do usuário
router.post('/api-key', manageApiKey);

// Rota para obter o saldo do usuário no SMS Activate
router.get('/balance', getSmsActivateBalance);

module.exports = router;