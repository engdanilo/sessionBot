const User = require('../models/UserModel');
const ApiKey = require('../models/ApiKeyModel');
const smsActivate = require('sms-activate-org');

// Função para obter informações do usuário
const getUserInfo = async (req, res) => {
  try {
    const userId = req.user.id; // Supondo que o ID do usuário esteja disponível em req.user após a autenticação

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const apiKey = await ApiKey.findOne({ userId });

    res.json({
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      apiKey: apiKey ? apiKey.key : null, // Retorna a API Key se existir
    });
  } catch (error) {
    console.error('Erro ao obter informações do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Função para cadastrar/atualizar a API Key do usuário
const manageApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { apiKey } = req.body;

    // Validar a API Key aqui (opcional)
    // ...

    let apiKeyDocument = await ApiKey.findOne({ userId });

    if (apiKeyDocument) {
      // API Key já existe, atualizar
      apiKeyDocument.key = apiKey;
    } else {
      // API Key não existe, criar nova
      apiKeyDocument = new ApiKey({ userId, key: apiKey });
    }

    await apiKeyDocument.save();

    res.json({ message: 'API Key salva com sucesso' });
  } catch (error) {
    console.error('Erro ao gerenciar API Key:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Função para obter o saldo do usuário no SMS Activate
const getSmsActivateBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    const apiKey = await ApiKey.findOne({ userId });
    if (!apiKey) {
      return res.status(400).json({ message: 'API Key não encontrada' });
    }

    // Criar uma instância do cliente da API
    const api = new smsActivate(apiKey.key);

    // Obter o saldo
    const balance = await api.getBalance();

    res.json({ balance });
  } catch (error) {
    console.error('Erro ao obter saldo do SMS Activate:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = {
  getUserInfo,
  manageApiKey,
  getSmsActivateBalance
};