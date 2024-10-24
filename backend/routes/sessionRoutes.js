const express = require('express');
const router = express.Router();
const { createSessions } = require('../controllers/sessionController');
const { countryValidator, quantityValidator } = require('../validators/sessionValidator'); // Importe os validadores
const { validationResult } = require('express-validator');

// Rota para criar novas sessões
router.post('/create', countryValidator, quantityValidator, async (req, res) => {
  try {
    // Validar os dados da requisição
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Chamar a função createSessions do controller
    await createSessions(req, res); 
  } catch (error) {
    console.error('Error creating sessions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;