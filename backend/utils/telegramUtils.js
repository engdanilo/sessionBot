const { bot } = require('../server'); // Importar o bot do server.js

// Função para enviar mensagem de texto para o usuário
const sendMessage = async (chatId, message) => {
  try {
    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
  }
};

// Função para enviar um documento para o usuário
const sendDocument = async (chatId, filePath) => {
  try {
    await bot.sendDocument(chatId, filePath);
  } catch (error) {
    console.error('Erro ao enviar documento:', error);
  }
};

module.exports = { sendMessage, sendDocument };