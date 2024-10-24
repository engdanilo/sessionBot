const { body } = require('express-validator');

const registerValidator = [
  body('telegramId')
    .notEmpty().withMessage('Telegram ID is required')
    .isInt().withMessage('Telegram ID must be an integer'),
  body('firstName')
    .notEmpty().withMessage('First name is required')
    .isString().withMessage('First name must be a string'),
  body('lastName')
    .optional()
    .isString().withMessage('Last name must be a string'),
  body('username')
    .optional()
    .isString().withMessage('Username must be a string'),
  body('walletAddress')
    .notEmpty().withMessage('Wallet address is required')
    .isString().withMessage('Wallet address must be a string'),
  body('apiKey')
    .notEmpty().withMessage('API Key is required')
    .isString().withMessage('API Key must be a string')
];

module.exports = { registerValidator };