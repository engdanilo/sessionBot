const { body } = require('express-validator');

const registerValidator = [
  body('telegramId').notEmpty().withMessage('O ID do Telegram é obrigatório').isInt().withMessage('O ID do Telegram deve ser um número inteiro'),
  body('firstName').notEmpty().withMessage('O primeiro nome é obrigatório').isString().withMessage('O primeiro nome deve ser uma string'),
  body('lastName').optional().isString().withMessage('O último nome deve ser uma string'),
  body('username').optional().isString().withMessage('O nome de usuário deve ser uma string'),
];

module.exports = { registerValidator };