const { StringSession } = require('telegram/sessions');
const { TelegramClient } = require('telegram');
const fs = require('node:fs/promises');

const createSessionFile = async (phoneNumber, apiId, apiHash) => {
  try {
    // Criar uma nova StringSession
    const stringSession = new StringSession('');

    // Criar um novo cliente Telegram
    const client = new TelegramClient(
      stringSession,
      apiId,
      apiHash,
      {
        connectionRetries: 5,
      }
    );

    // Conectar o cliente (opcional, pode ser feito posteriormente)
    await client.connect(); 

    // Salvar a StringSession em um arquivo
    const sessionFileName = `${phoneNumber}.session`;
    await fs.writeFile(sessionFileName, stringSession.save());

    return sessionFileName;
  } catch (error) {
    console.error('Erro ao criar arquivo .session:', error);
    throw error;
  }
};

module.exports = { createSessionFile };