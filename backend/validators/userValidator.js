const { body } = require('express-validator');

const apiKeyValidator = [
  body('apiKey')
    .notEmpty().withMessage('A API Key é obrigatória')
    .isString().withMessage('A API Key deve ser uma string')
];

module.exports = { apiKeyValidator };