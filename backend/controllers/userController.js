const User = require('../models/UserModel');
const smsActivate = require('sms-activate-org');

// Função para obter informações do usuário
const getUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      apiKey: user.apiKey, // Retorna a API Key diretamente do usuário
      walletAddress: user.walletAddress, // Retorna o endereço da carteira
      paid: user.paid, // Retorna o status de pagamento
      paymentExpiration: user.paymentExpiration // Retorna a data de expiração do pagamento
    });
  } catch (error) {
    console.error('Error getting user information:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Função para gerenciar a API Key do usuário
const manageApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { apiKey } = req.body;

    // Atualizar a API Key do usuário no banco de dados
    const updatedUser = await User.findOneAndUpdate({ _id: userId }, { apiKey }, { new: true }); 

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'API Key saved successfully' });
  } catch (error) {
    console.error('Error managing API Key:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Função para obter o saldo do usuário no SMS Activate
const getSmsActivateBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || !user.apiKey) {
      return res.status(400).json({ message: 'API Key not found' });
    }

    // Criar uma instância do cliente da API
    const api = new smsActivate(user.apiKey);

    // Obter o saldo
    const balance = await api.getBalance();

    res.json({ balance });
  } catch (error) {
    console.error('Error getting SMS Activate balance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getUserInfo,
  manageApiKey,
  getSmsActivateBalance
};