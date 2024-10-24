const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
  try {
    // Obter o token do cabeçalho da requisição
    const token = req.header('Authorization').replace('Bearer ', '');

    // Verificar se o token existe
    if (!token) {
      return res.status(401).json({ message: 'Access denied' }); // Mensagem em inglês
    }

    // Verificar se o token é válido
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' }); // Mensagem em inglês
  }
};

module.exports = { auth };