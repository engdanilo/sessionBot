const express = require('express');
const { register } = require('../controllers/authController');
const { registerValidator } = require('../validators/authValidator');
const { validationResult } = require('express-validator');

const router = express.Router();
// Rota para registrar um novo usuário
router.post('/register', registerValidator, async (req, res) => {
  try {
    // Validar os dados da requisição
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Chamar a função register do controller
    await register(req, res);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;