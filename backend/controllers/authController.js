const User = require('../models/UserModel');

const register = async (req, res) => {
  try {
    // Obter os dados do corpo da requisição
    const { telegramId, firstName, lastName, username, walletAddress, apiKey } = req.body;

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ telegramId });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Criar um novo usuário
    const newUser = new User({
      telegramId,
      firstName,
      lastName,
      username,
      walletAddress,
      apiKey,
    });

    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { register };